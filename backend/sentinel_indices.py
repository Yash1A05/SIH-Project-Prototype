import os
import requests
import rasterio
import numpy as np

from dotenv import load_dotenv
from pyproj import Transformer

load_dotenv()


# ==========================================
# COPERNICUS / SENTINEL HUB
# ==========================================

CLIENT_ID = os.getenv("COPERNICUS_CLIENT_ID")
CLIENT_SECRET = os.getenv("COPERNICUS_CLIENT_SECRET")

TOKEN_URL = (
    "https://identity.dataspace.copernicus.eu/"
    "auth/realms/CDSE/protocol/openid-connect/token"
)

PROCESS_URL = (
    "https://sh.dataspace.copernicus.eu/api/v1/process"
)


# ==========================================
# GET ACCESS TOKEN
# ==========================================

def get_access_token():

    response = requests.post(

        TOKEN_URL,

        data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },

        timeout=30,
    )

    response.raise_for_status()

    return response.json()["access_token"]


# ==========================================
# DYNAMIC AOI INDEX ANALYSIS
# ==========================================

def analyze_indices(polygon):

    print("\n===================================")
    print("       AOI INDEX ANALYSIS")
    print("===================================")


    # ======================================
    # 1. REACT COORDINATES → WGS84
    # ======================================

    coordinates = [

        [point["lng"], point["lat"]]

        for point in polygon

    ]


    # Close polygon
    if coordinates[0] != coordinates[-1]:

        coordinates.append(
            coordinates[0]
        )


    print(
        "AOI WGS84 coordinates created successfully."
    )


    # ======================================
    # 2. DETERMINE UTM ZONE
    # ======================================

    mean_longitude = np.mean(
        [point[0] for point in coordinates]
    )

    mean_latitude = np.mean(
        [point[1] for point in coordinates]
    )


    utm_zone = int(
        (mean_longitude + 180) / 6
    ) + 1


    if mean_latitude >= 0:

        target_epsg = 32600 + utm_zone

    else:

        target_epsg = 32700 + utm_zone


    target_crs = (
        f"http://www.opengis.net/def/crs/"
        f"EPSG/0/{target_epsg}"
    )


    print(
        "UTM zone:",
        utm_zone
    )

    print(
        "Target CRS:",
        f"EPSG:{target_epsg}"
    )


    # ======================================
    # 3. TRANSFORM WGS84 → UTM
    # ======================================

    transformer = Transformer.from_crs(

        "EPSG:4326",

        f"EPSG:{target_epsg}",

        always_xy=True

    )


    projected_coordinates = []


    for lon, lat in coordinates:

        x, y = transformer.transform(
            lon,
            lat
        )

        projected_coordinates.append(
            [x, y]
        )


    print(
        "AOI transformed to meter-based UTM coordinates."
    )


    # ======================================
    # 4. CREATE PROJECTED GEOJSON
    # ======================================

    geometry = {

        "type": "Polygon",

        "coordinates": [
            projected_coordinates
        ]

    }


    # ======================================
    # 5. EVALSCRIPT
    # ======================================

    evalscript = """

//VERSION=3

function setup() {

    return {

        input: [{

            bands: [

                "B03",
                "B04",
                "B08",
                "B11",
                "dataMask"

            ],

            units: "REFLECTANCE"

        }],

        output: {

            bands: 4,

            sampleType: "FLOAT32",

            nodataValue: -9999

        }

    };

}


function evaluatePixel(sample) {

    // NDVI

    var ndvi =
        (sample.B08 - sample.B04) /
        (sample.B08 + sample.B04);


    // NDWI

    var ndwi =
        (sample.B03 - sample.B08) /
        (sample.B03 + sample.B08);


    // NDMI

    var ndmi =
        (sample.B08 - sample.B11) /
        (sample.B08 + sample.B11);


    if (sample.dataMask === 0) {

        return [

            -9999,
            -9999,
            -9999,
            0

        ];

    }


    return [

        ndvi,
        ndwi,
        ndmi,
        1

    ];

}

"""


    # ======================================
    # 6. SENTINEL HUB REQUEST
    # ======================================

    payload = {

        "input": {

            "bounds": {

                "geometry": geometry,

                "properties": {

                    "crs": target_crs

                }

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
                                "2026-08-26T23:59:59Z"

                        },

                        "maxCloudCoverage": 20,

                        "mosaickingOrder":
                            "leastCC"

                    }

                }

            ]

        },


        # ==================================
        # IMPORTANT
        # ==================================
        #
        # Sentinel-2 requested at TRUE 10m
        # resolution.
        #
        # No fixed 512x512 anymore.
        #

        "output": {

            "resx": 10,

            "resy": 10,

            "responses": [

                {

                    "identifier": "default",

                    "format": {

                        "type": "image/tiff"

                    }

                }

            ]

        },


        "evalscript": evalscript

    }


    # ======================================
    # 7. AUTHENTICATION
    # ======================================

    print(
        "\nRequesting Sentinel-2 indices..."
    )


    token = get_access_token()


    headers = {

        "Authorization":
            f"Bearer {token}",

        "Content-Type":
            "application/json"

    }


    # ======================================
    # 8. SEND REQUEST
    # ======================================

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


    if response.status_code != 200:

        print(response.text)

        response.raise_for_status()


    # ======================================
    # 9. SAVE INDEX TIFF
    # ======================================

    output_file = (
        "data/aoi_indices.tif"
    )


    os.makedirs(
        "data",
        exist_ok=True
    )


    with open(
        output_file,
        "wb"
    ) as f:

        f.write(
            response.content
        )


    print(
        "✅ Index GeoTIFF saved:",
        output_file
    )


    # ======================================
    # 10. READ TIFF
    # ======================================

    with rasterio.open(
        output_file
    ) as src:

        data = src.read()

        raster_crs = src.crs

        raster_transform = src.transform

        raster_width = src.width

        raster_height = src.height


        print(
            "Raster shape:",
            data.shape
        )

        print(
            "Raster CRS:",
            raster_crs
        )

        print(
            "Raster resolution:",
            raster_transform.a,
            "x",
            abs(raster_transform.e),
            "meters"
        )

        print(
            "Raster size:",
            raster_width,
            "x",
            raster_height
        )


    # ======================================
    # 11. READ BANDS
    # ======================================

    ndvi = data[0]

    ndwi = data[1]

    ndmi = data[2]

    data_mask = data[3]


    # ======================================
    # 12. VALID PIXELS
    # ======================================

    valid = (

        (data_mask > 0)

        & np.isfinite(ndvi)

        & np.isfinite(ndwi)

        & np.isfinite(ndmi)

        & (ndvi != -9999)

        & (ndwi != -9999)

        & (ndmi != -9999)

    )


    ndvi_valid = ndvi[valid]

    ndwi_valid = ndwi[valid]

    ndmi_valid = ndmi[valid]


    if len(ndvi_valid) == 0:

        raise ValueError(
            "No valid pixels found for selected AOI."
        )


    # ======================================
    # 13. STATISTICS
    # ======================================

    statistics = {

        "valid_pixels":
            int(len(ndvi_valid)),


        "ndvi": {

            "mean":
                float(np.mean(ndvi_valid)),

            "minimum":
                float(np.min(ndvi_valid)),

            "maximum":
                float(np.max(ndvi_valid)),

            "median":
                float(np.median(ndvi_valid)),

            "standard_deviation":
                float(np.std(ndvi_valid))

        },


        "ndwi": {

            "mean":
                float(np.mean(ndwi_valid)),

            "minimum":
                float(np.min(ndwi_valid)),

            "maximum":
                float(np.max(ndwi_valid)),

            "median":
                float(np.median(ndwi_valid))

        },


        "ndmi": {

            "mean":
                float(np.mean(ndmi_valid)),

            "minimum":
                float(np.min(ndmi_valid)),

            "maximum":
                float(np.max(ndmi_valid)),

            "median":
                float(np.median(ndmi_valid))

        }

    }


    # ======================================
    # 14. PRINT RESULTS
    # ======================================

    print(
        "\n========== AOI INDEX STATISTICS =========="
    )


    print(
        "Valid pixels:",
        len(ndvi_valid)
    )


    print("\nNDVI")

    print(
        "Mean:",
        statistics["ndvi"]["mean"]
    )

    print(
        "Min :",
        statistics["ndvi"]["minimum"]
    )

    print(
        "Max :",
        statistics["ndvi"]["maximum"]
    )


    print("\nNDWI")

    print(
        "Mean:",
        statistics["ndwi"]["mean"]
    )

    print(
        "Min :",
        statistics["ndwi"]["minimum"]
    )

    print(
        "Max :",
        statistics["ndwi"]["maximum"]
    )


    print("\nNDMI")

    print(
        "Mean:",
        statistics["ndmi"]["mean"]
    )

    print(
        "Min :",
        statistics["ndmi"]["minimum"]
    )

    print(
        "Max :",
        statistics["ndmi"]["maximum"]
    )


    # ======================================
    # 15. RETURN
    # ======================================

    return {

        "statistics":
            statistics,

        "file":
            output_file

    }