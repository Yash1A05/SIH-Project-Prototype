import os
import requests

from copernicus import get_access_token


# --------------------------------------------------
# 1. Get Copernicus access token
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
# 3. Test AOI
# Pune, Maharashtra
#
# [min longitude, min latitude,
#  max longitude, max latitude]
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
# B03 = Green
# B02 = Blue
#
# These 3 bands create a True Color image.
# --------------------------------------------------

evalscript = """
//VERSION=3

function setup() {
    return {
        input: ["B02", "B03", "B04"],
        output: {
            bands: 3
        }
    };
}

function evaluatePixel(sample) {
    return [
        2.5 * sample.B04,
        2.5 * sample.B03,
        2.5 * sample.B02
    ];
}
"""


# --------------------------------------------------
# 5. Processing API request
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
                        "from": "2025-08-01T00:00:00Z",
                        "to": "2025-08-31T23:59:59Z"
                    },

                    "maxCloudCoverage": 80,

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
# 6. Send request
# --------------------------------------------------

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print("🛰️ Requesting Sentinel-2 satellite image...")

response = requests.post(
    PROCESS_URL,
    headers=headers,
    json=request_body
)


# --------------------------------------------------
# 7. Save image
# --------------------------------------------------

print("Status:", response.status_code)

if response.status_code == 200:

    os.makedirs("data", exist_ok=True)

    output_file = "data/sentinel2_pune.png"

    with open(output_file, "wb") as file:
        file.write(response.content)

    print("✅ Satellite image received!")
    print(f"✅ Saved at: {output_file}")

else:

    print("❌ Satellite image request failed!")
    print(response.text)