import os
import requests

from dotenv import load_dotenv
from pyproj import Geod


load_dotenv()


# =========================================================
# COPERNICUS / SENTINEL HUB CONFIGURATION
# =========================================================

CLIENT_ID = os.getenv("COPERNICUS_CLIENT_ID")

CLIENT_SECRET = os.getenv("COPERNICUS_CLIENT_SECRET")


TOKEN_URL = (
    "https://identity.dataspace.copernicus.eu/"
    "auth/realms/CDSE/protocol/openid-connect/token"
)


PROCESS_URL = (
    "https://sh.dataspace.copernicus.eu/process/v1"
)


# =========================================================
# AOI LIMIT
# =========================================================

# Prototype limit
# This prevents very large AOIs from being sent
# directly to the synchronous Process API.

MAX_AOI_AREA_KM2 = 20.0


# =========================================================
# GEODESIC AREA CALCULATION
# =========================================================

def calculate_aoi_area_km2(coordinates):

    geod = Geod(ellps="WGS84")


    lons = [
        point[0]
        for point in coordinates
    ]


    lats = [
        point[1]
        for point in coordinates
    ]


    area_m2, _ = geod.polygon_area_perimeter(
        lons,
        lats
    )


    area_km2 = abs(area_m2) / 1_000_000


    return area_km2


# =========================================================
# GET ACCESS TOKEN
# =========================================================

def get_access_token():

    if not CLIENT_ID or not CLIENT_SECRET:

        raise RuntimeError(
            "COPERNICUS_CLIENT_ID or "
            "COPERNICUS_CLIENT_SECRET missing"
        )


    print(
        "Client ID loaded:",
        bool(CLIENT_ID)
    )


    print(
        "Client Secret loaded:",
        bool(CLIENT_SECRET)
    )


    response = requests.post(

        TOKEN_URL,

        data={

            "grant_type":
                "client_credentials",

            "client_id":
                CLIENT_ID,

            "client_secret":
                CLIENT_SECRET

        },

        headers={

            "Content-Type":
                "application/x-www-form-urlencoded"

        },

        timeout=30

    )


    print(
        "Token status:",
        response.status_code
    )


    if response.status_code != 200:

        print(
            "\n❌ TOKEN ERROR"
        )

        print(
            response.text
        )

        response.raise_for_status()


    token_data = response.json()


    access_token = token_data.get(
        "access_token"
    )


    if not access_token:

        raise RuntimeError(
            "Access token was not returned"
        )


    print(
        "Access token received!"
    )


    return access_token


# =========================================================
# ANALYZE AOI
# =========================================================

def analyze_aoi(polygon):

    if not polygon:

        raise ValueError(
            "Polygon is empty"
        )


    # =====================================================
    # CONVERT REACT COORDINATES → GEOJSON
    # =====================================================

    coordinates = [

        [
            float(point["lng"]),
            float(point["lat"])
        ]

        for point in polygon

    ]


    # =====================================================
    # CHECK MINIMUM POLYGON POINTS
    # =====================================================

    if len(coordinates) < 3:

        raise ValueError(
            "AOI must contain at least 3 points."
        )


    # =====================================================
    # CLOSE POLYGON
    # =====================================================

    if coordinates[0] != coordinates[-1]:

        coordinates.append(
            coordinates[0]
        )


    geometry = {

        "type":
            "Polygon",

        "coordinates":
            [coordinates]

    }


    print("\n===================================")
    print("AOI SENTINEL-2 ANALYSIS")
    print("===================================")


    print(
        "Polygon points:",
        len(coordinates) - 1
    )


    print(
        "AOI geometry:",
        geometry
    )


    # =====================================================
    # CALCULATE AOI AREA
    # =====================================================

    aoi_area_km2 = calculate_aoi_area_km2(
        coordinates
    )


    print(
        "AOI area:",
        round(aoi_area_km2, 4),
        "km²"
    )


    # =====================================================
    # AOI SIZE VALIDATION
    # =====================================================

    if aoi_area_km2 > MAX_AOI_AREA_KM2:

        raise ValueError(

            f"Selected AOI is too large "
            f"({aoi_area_km2:.2f} km²). "

            f"Please select an AOI smaller than "
            f"{MAX_AOI_AREA_KM2:.0f} km²."

        )


    print(
        "✅ AOI size is within supported limit."
    )


    # =====================================================
    # EVALSCRIPT
    # SENTINEL-2 TRUE COLOR
    #
    # B04 = RED
    # B03 = GREEN
    # B02 = BLUE
    # =====================================================

    evalscript = """

//VERSION=3

function setup() {

    return {

        input: [{

            bands: [
                "B02",
                "B03",
                "B04"
            ],

            units: "REFLECTANCE"

        }],

        output: {

            bands: 3,

            sampleType: "AUTO"

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


    # =====================================================
    # SENTINEL-2 PROCESS API PAYLOAD
    # =====================================================

    payload = {

        "input": {

            "bounds": {

                "geometry":
                    geometry

            },


            "data": [

                {

                    "type":
                        "sentinel-2-l2a",


                    "dataFilter": {

                        "timeRange": {

                            "from":
                                "2026-01-01T00:00:00Z",

                            "to":
                                "2026-08-29T23:59:59Z"

                        },


                        "maxCloudCoverage":
                            30,


                        "mosaickingOrder":
                            "leastCC"

                    }

                }

            ]

        },


        "output": {

            "width":
                512,

            "height":
                512,


            "responses": [

                {

                    "identifier":
                        "default",

                    "format": {

                        "type":
                            "image/png"

                    }

                }

            ]

        },


        "evalscript":
            evalscript

    }


    # =====================================================
    # AUTHENTICATION
    # =====================================================

    token = get_access_token()


    headers = {

        "Authorization":
            f"Bearer {token}",

        "Content-Type":
            "application/json"

    }


    # =====================================================
    # SEND REQUEST
    # =====================================================

    print(
        "\nRequesting Sentinel-2 image..."
    )


    print(
        "Process API:",
        PROCESS_URL
    )


    response = requests.post(

        PROCESS_URL,

        headers=headers,

        json=payload,

        timeout=120

    )


    print(
        "Sentinel status:",
        response.status_code
    )


    # =====================================================
    # ERROR HANDLING
    # =====================================================

    if response.status_code != 200:

        print(
            "\n❌ SENTINEL-2 REQUEST FAILED"
        )


        print(
            "Status:",
            response.status_code
        )


        print(
            "\nCopernicus response:"
        )


        print(
            response.text
        )


        response.raise_for_status()


    # =====================================================
    # SUCCESS
    # =====================================================

    print(
        "✅ Sentinel-2 AOI image received!"
    )


    return response.content