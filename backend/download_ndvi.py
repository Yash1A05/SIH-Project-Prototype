import os
import requests

from copernicus import get_access_token


# --------------------------------------------------
# 1. Get access token
# --------------------------------------------------

token = get_access_token()

if not token:
    print("❌ Could not get Copernicus access token.")
    exit()


# --------------------------------------------------
# 2. Sentinel Hub Processing API
# --------------------------------------------------

PROCESS_URL = "https://sh.dataspace.copernicus.eu/process/v1"


# --------------------------------------------------
# 3. Test AOI - Pune
# --------------------------------------------------

bbox = [
    73.80,
    18.48,
    73.90,
    18.56
]


# --------------------------------------------------
# 4. NDVI + Cloud Mask Evalscript
#
# B04 = Red
# B08 = NIR
# SCL = Scene Classification Layer
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
            bands: 4,
            sampleType: "AUTO"
        }
    };
}


function evaluatePixel(sample) {

    // Mask:
    // 3  = Cloud shadow
    // 8  = Cloud medium probability
    // 9  = Cloud high probability
    // 10 = Thin cirrus
    // 11 = Snow / ice
    //
    // Also remove invalid pixels using dataMask.

    if (
        sample.dataMask === 0 ||
        sample.SCL === 3 ||
        sample.SCL === 8 ||
        sample.SCL === 9 ||
        sample.SCL === 10 ||
        sample.SCL === 11
    ) {
        return [0, 0, 0, 0];
    }


    // Calculate NDVI

    let denominator = sample.B08 + sample.B04;

    if (denominator === 0) {
        return [0, 0, 0, 0];
    }

    let ndvi = (sample.B08 - sample.B04) / denominator;


    // NDVI visualization
    //
    // Low NDVI  -> brown/yellow
    // Medium    -> green
    // High      -> dark green

    let r;
    let g;
    let b;


    if (ndvi < 0) {

        r = 0.60;
        g = 0.40;
        b = 0.20;

    } else if (ndvi < 0.2) {

        r = 0.90;
        g = 0.80;
        b = 0.40;

    } else if (ndvi < 0.4) {

        r = 0.60;
        g = 0.75;
        b = 0.30;

    } else if (ndvi < 0.6) {

        r = 0.30;
        g = 0.60;
        b = 0.20;

    } else {

        r = 0.05;
        g = 0.35;
        b = 0.05;
    }


    return [
        r,
        g,
        b,
        1
    ];
}
"""


# --------------------------------------------------
# 5. Request body
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

                    # Wider time period
                    # gives the system more chances
                    # to find a better scene.

                    "timeRange": {
                        "from": "2025-06-01T00:00:00Z",
                        "to": "2025-10-31T23:59:59Z"
                    },

                    # Try to avoid very cloudy scenes.

                    "maxCloudCoverage": 60,

                    # Prefer least cloudy acquisition.

                    "mosaickingOrder": "leastCC"
                }
            }
        ]
    },


    # --------------------------------------------------
    # 6. Output image
    # --------------------------------------------------

    "output": {

        "width": 512,
        "height": 512,

        "responses": [

            {
                "identifier": "default",

                "format": {
                    "type": "image/png"
                }
            }
        ]
    },


    "evalscript": evalscript
}


# --------------------------------------------------
# 7. Request headers
# --------------------------------------------------

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}


print("🌱 Requesting NDVI image...")
print("🛰️ Applying cloud/shadow masking...")


# --------------------------------------------------
# 8. Send request
# --------------------------------------------------

response = requests.post(
    PROCESS_URL,
    headers=headers,
    json=request_body
)


print("Status:", response.status_code)


# --------------------------------------------------
# 9. Save result
# --------------------------------------------------

if response.status_code == 200:

    os.makedirs("data", exist_ok=True)

    output_file = "data/ndvi_pune.png"

    with open(output_file, "wb") as file:
        file.write(response.content)

    print("✅ NDVI image received!")
    print(f"✅ Saved at: {output_file}")

else:

    print("❌ NDVI request failed!")
    print(response.text)