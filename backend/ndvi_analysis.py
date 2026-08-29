import os
import json
import requests
import numpy as np
import tifffile

from copernicus import get_access_token


# --------------------------------------------------
# 1. Get Copernicus access token
# --------------------------------------------------

token = get_access_token()

if not token:
    print("❌ Could not get Copernicus access token.")
    exit()


# --------------------------------------------------
# 2. Processing API
# --------------------------------------------------

PROCESS_URL = "https://sh.dataspace.copernicus.eu/process/v1"


# --------------------------------------------------
# 3. AOI - Pune testing area
# --------------------------------------------------

bbox = [
    73.80,
    18.48,
    73.90,
    18.56
]


# --------------------------------------------------
# 4. Evalscript
#
# B04 = Red
# B08 = NIR
# SCL = Cloud masking
#
# Output = EXACT NDVI FLOAT32
# --------------------------------------------------

evalscript = """
//VERSION=3

function setup() {

    return {

        input: [
            "B04",
            "B08",
            "SCL",
            "dataMask"
        ],

        output: {
            id: "ndvi",
            bands: 1,
            sampleType: "FLOAT32",
            nodataValue: -9999
        }
    };
}


function evaluatePixel(sample) {

    // Invalid pixel
    if (sample.dataMask === 0) {
        return [-9999];
    }


    // Cloud / shadow / cirrus / snow masking
    //
    // 3  = Cloud shadow
    // 8  = Cloud medium probability
    // 9  = Cloud high probability
    // 10 = Thin cirrus
    // 11 = Snow / ice

    if (
        sample.SCL === 3 ||
        sample.SCL === 8 ||
        sample.SCL === 9 ||
        sample.SCL === 10 ||
        sample.SCL === 11
    ) {
        return [-9999];
    }


    // NDVI calculation

    let denominator = sample.B08 + sample.B04;

    if (denominator === 0) {
        return [-9999];
    }

    let ndvi = (sample.B08 - sample.B04) / denominator;

    return [ndvi];
}
"""


# --------------------------------------------------
# 5. Request
# --------------------------------------------------

request_body = {

    "input": {

        "bounds": {
            "bbox": bbox,

            "properties": {
                "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
            }
        },

        "data": [

            {
                "type": "sentinel-2-l2a",

                "dataFilter": {

                    "timeRange": {
                        "from": "2025-06-01T00:00:00Z",
                        "to": "2025-10-31T23:59:59Z"
                    },

                    "maxCloudCoverage": 60,

                    "mosaickingOrder": "leastCC"
                }
            }
        ]
    },


    "output": {

        "width": 512,
        "height": 512,

        "responses": [

            {
                "identifier": "ndvi",

                "format": {
                    "type": "image/tiff"
                }
            }
        ]
    },


    "evalscript": evalscript
}


# --------------------------------------------------
# 6. Request headers
# --------------------------------------------------

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "Accept": "image/tiff"
}


print("🌱 Requesting RAW NDVI data...")
print("🛰️ Applying cloud/shadow masking...")


# --------------------------------------------------
# 7. Send request
# --------------------------------------------------

response = requests.post(
    PROCESS_URL,
    headers=headers,
    json=request_body
)


print("Status:", response.status_code)


# --------------------------------------------------
# 8. Save GeoTIFF
# --------------------------------------------------

if response.status_code != 200:

    print("❌ NDVI request failed!")
    print(response.text)
    exit()


os.makedirs("data", exist_ok=True)

tiff_file = "data/ndvi_raw.tif"

with open(tiff_file, "wb") as file:
    file.write(response.content)

print("✅ Raw NDVI GeoTIFF received!")
print(f"✅ Saved at: {tiff_file}")


# --------------------------------------------------
# 9. Read NDVI values
# --------------------------------------------------

ndvi = tifffile.imread(tiff_file)

print("\nRaster shape:", ndvi.shape)
print("Data type:", ndvi.dtype)


# --------------------------------------------------
# 10. Remove NoData pixels
# --------------------------------------------------

valid_pixels = ndvi[
    np.isfinite(ndvi) &
    (ndvi != -9999)
]


if len(valid_pixels) == 0:

    print("❌ No valid NDVI pixels found.")
    exit()


# --------------------------------------------------
# 11. NDVI statistics
# --------------------------------------------------

minimum = float(np.min(valid_pixels))
maximum = float(np.max(valid_pixels))
mean = float(np.mean(valid_pixels))
median = float(np.median(valid_pixels))
std_dev = float(np.std(valid_pixels))


print("\n========== NDVI STATISTICS ==========")

print(f"Valid pixels : {len(valid_pixels)}")
print(f"Minimum NDVI : {minimum:.4f}")
print(f"Maximum NDVI : {maximum:.4f}")
print(f"Mean NDVI    : {mean:.4f}")
print(f"Median NDVI  : {median:.4f}")
print(f"Std Dev      : {std_dev:.4f}")


# --------------------------------------------------
# 12. Vegetation classification
# --------------------------------------------------

low = np.sum(
    (valid_pixels >= -1) &
    (valid_pixels < 0.2)
)

moderate = np.sum(
    (valid_pixels >= 0.2) &
    (valid_pixels < 0.5)
)

high = np.sum(
    valid_pixels >= 0.5
)


total = len(valid_pixels)


low_percent = (low / total) * 100
moderate_percent = (moderate / total) * 100
high_percent = (high / total) * 100


print("\n====== VEGETATION STATISTICS ======")

print(f"Low vegetation    : {low_percent:.2f}%")
print(f"Moderate          : {moderate_percent:.2f}%")
print(f"High vegetation   : {high_percent:.2f}%")


# --------------------------------------------------
# 13. Save statistics as JSON
# --------------------------------------------------

statistics = {

    "valid_pixels": int(total),

    "ndvi": {
        "minimum": minimum,
        "maximum": maximum,
        "mean": mean,
        "median": median,
        "standard_deviation": std_dev
    },

    "vegetation": {
        "low_percent": float(low_percent),
        "moderate_percent": float(moderate_percent),
        "high_percent": float(high_percent)
    }
}


json_file = "data/ndvi_statistics.json"

with open(json_file, "w") as file:

    json.dump(
        statistics,
        file,
        indent=4
    )


print(f"\n✅ Statistics saved at: {json_file}")