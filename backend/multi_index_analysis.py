import os
import requests
import numpy as np
import tifffile

from copernicus import get_access_token


PROCESS_URL = "https://sh.dataspace.copernicus.eu/process/v1"

token = get_access_token()

if not token:
    print("❌ Could not get access token.")
    exit()


# --------------------------------------------------
# Test AOI - Pune
# --------------------------------------------------

bbox = [
    73.80,
    18.48,
    73.90,
    18.56
]


# --------------------------------------------------
# NDVI + NDWI + NDMI
#
# B04 = Red
# B03 = Green
# B08 = NIR
# B11 = SWIR
# SCL = Cloud mask
# --------------------------------------------------

evalscript = """
//VERSION=3

function setup() {

    return {

        input: [
            "B03",
            "B04",
            "B08",
            "B11",
            "SCL",
            "dataMask"
        ],

        output: {
            id: "indices",
            bands: 3,
            sampleType: "FLOAT32",
            nodataValue: -9999
        }
    };
}


function evaluatePixel(sample) {

    // Remove invalid/cloud pixels

    if (
        sample.dataMask === 0 ||
        sample.SCL === 1 ||
        sample.SCL === 3 ||
        sample.SCL === 7 ||
        sample.SCL === 8 ||
        sample.SCL === 9 ||
        sample.SCL === 10 ||
        sample.SCL === 11
    ) {
        return [-9999, -9999, -9999];
    }


    // NDVI
    let ndviDenominator =
        sample.B08 + sample.B04;

    // NDWI
    let ndwiDenominator =
        sample.B03 + sample.B08;

    // NDMI
    let ndmiDenominator =
        sample.B08 + sample.B11;


    if (
        ndviDenominator === 0 ||
        ndwiDenominator === 0 ||
        ndmiDenominator === 0
    ) {
        return [-9999, -9999, -9999];
    }


    let ndvi =
        (sample.B08 - sample.B04) /
        ndviDenominator;


    let ndwi =
        (sample.B03 - sample.B08) /
        ndwiDenominator;


    let ndmi =
        (sample.B08 - sample.B11) /
        ndmiDenominator;


    return [
        ndvi,
        ndwi,
        ndmi
    ];
}
"""


# --------------------------------------------------
# Request
# --------------------------------------------------

request_body = {

    "input": {

        "bounds": {
            "bbox": bbox,

            "properties": {
                "crs":
                "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
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
                "identifier": "indices",

                "format": {
                    "type": "image/tiff"
                }
            }
        ]
    },


    "evalscript": evalscript
}


headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}


print("🛰️ Requesting NDVI + NDWI + NDMI...")

response = requests.post(
    PROCESS_URL,
    headers=headers,
    json=request_body
)


print("Status:", response.status_code)


if response.status_code != 200:

    print("❌ Request failed!")
    print(response.text)
    exit()


os.makedirs("data", exist_ok=True)

output_file = "data/multi_indices.tif"

with open(output_file, "wb") as file:
    file.write(response.content)


print("✅ Multi-index GeoTIFF received!")
print(f"✅ Saved at: {output_file}")


# --------------------------------------------------
# Read TIFF
# --------------------------------------------------

data = tifffile.imread(output_file)

print("\nRaster shape:", data.shape)
print("Data type:", data.dtype)


# Expected shape:
# (512, 512, 3)

ndvi = data[:, :, 0]
ndwi = data[:, :, 1]
ndmi = data[:, :, 2]


# --------------------------------------------------
# Valid pixels
# --------------------------------------------------

valid = (
    np.isfinite(ndvi) &
    np.isfinite(ndwi) &
    np.isfinite(ndmi) &
    (ndvi != -9999) &
    (ndwi != -9999) &
    (ndmi != -9999)
)


ndvi_valid = ndvi[valid]
ndwi_valid = ndwi[valid]
ndmi_valid = ndmi[valid]


print("\n========== MULTI-INDEX STATISTICS ==========")

print("Valid pixels:", len(ndvi_valid))


print("\nNDVI")
print("Mean:", np.mean(ndvi_valid))
print("Min :", np.min(ndvi_valid))
print("Max :", np.max(ndvi_valid))


print("\nNDWI")
print("Mean:", np.mean(ndwi_valid))
print("Min :", np.min(ndwi_valid))
print("Max :", np.max(ndwi_valid))


print("\nNDMI")
print("Mean:", np.mean(ndmi_valid))
print("Min :", np.min(ndmi_valid))
print("Max :", np.max(ndmi_valid))