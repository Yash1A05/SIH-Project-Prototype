from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

import os
import json
import requests

from datetime import datetime
from urllib.parse import quote

from sentinel_aoi import analyze_aoi
from sentinel_indices import analyze_indices
from mangrove_candidate import screen_mangroves
from carbon_estimation import estimate_carbon
from mrv_report import generate_mrv_report


app = Flask(__name__)

CORS(app)


# =========================================================
# CONFIGURATION
# =========================================================

# For local development
# Later, for deployment, change this to your public HTTPS URL.
PUBLIC_BASE_URL = os.getenv(
    "PUBLIC_BASE_URL",
    "http://127.0.0.1:5000"
)

REPORTS_FOLDER = "data/reports"

os.makedirs(
    REPORTS_FOLDER,
    exist_ok=True
)


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return "Blue Carbon MRV Backend is running!"


# =========================================================
# TEST API
# =========================================================

@app.route("/api/test")
def api_test():

    return jsonify({

        "status": "success",

        "message":
            "React can connect to Flask!",

        "project":
            "Blue Carbon MRV"

    })


# =========================================================
# REVERSE GEOCODING
# =========================================================

def get_aoi_location(polygon):

    """
    Convert the center point of the selected AOI
    into an approximate readable location.

    This does NOT represent legal land ownership.
    It is an approximate geographic location.
    """

    if not polygon:

        return {

            "status":
                "unavailable",

            "display_name":
                "Location unavailable"

        }


    try:

        # -------------------------------------------------
        # Calculate AOI center
        # -------------------------------------------------

        latitudes = [

            float(point["lat"])

            for point in polygon

        ]

        longitudes = [

            float(point["lng"])

            for point in polygon

        ]


        center_lat = (
            sum(latitudes)
            / len(latitudes)
        )

        center_lng = (
            sum(longitudes)
            / len(longitudes)
        )


        print("\n===================================")
        print("       AOI LOCATION LOOKUP")
        print("===================================")

        print(
            "Center Latitude:",
            center_lat
        )

        print(
            "Center Longitude:",
            center_lng
        )


        # -------------------------------------------------
        # OpenStreetMap Nominatim reverse geocoding
        # -------------------------------------------------

        response = requests.get(

            "https://nominatim.openstreetmap.org/reverse",

            params={

                "lat":
                    center_lat,

                "lon":
                    center_lng,

                "format":
                    "jsonv2",

                "zoom":
                    14,

                "addressdetails":
                    1

            },

            headers={

                "User-Agent":
                    "BlueCarbonMRV/1.0 "
                    "(environmental MRV prototype)"

            },

            timeout=15

        )


        print(
            "Location API status:",
            response.status_code
        )


        if response.status_code != 200:

            return {

                "status":
                    "unavailable",

                "latitude":
                    center_lat,

                "longitude":
                    center_lng,

                "display_name":
                    "Location could not be determined"

            }


        result = response.json()

        address = result.get(
            "address",
            {}
        )


        # -------------------------------------------------
        # Return location information
        # -------------------------------------------------

        return {

            "status":
                "success",

            "latitude":
                center_lat,

            "longitude":
                center_lng,

            "display_name":
                result.get(
                    "display_name",
                    "Location unavailable"
                ),

            "village":
                address.get(
                    "village"
                ),

            "town":
                address.get(
                    "town"
                ),

            "city":
                address.get(
                    "city"
                ),

            "district":
                address.get(
                    "state_district"
                ),

            "state":
                address.get(
                    "state"
                ),

            "country":
                address.get(
                    "country"
                ),

            "postcode":
                address.get(
                    "postcode"
                )

        }


    except Exception as e:

        print(
            "⚠️ Location lookup failed:",
            e
        )


        # -----------------------------------------------
        # IMPORTANT:
        # Location failure should NOT stop MRV analysis
        # -----------------------------------------------

        return {

            "status":
                "unavailable",

            "display_name":
                "Location lookup unavailable"

        }


# =========================================================
# AOI ANALYSIS API
# =========================================================

@app.route(
    "/api/analyze",
    methods=["POST"]
)
def analyze_aoi_api():

    try:

        # =================================================
        # 1. RECEIVE AOI FROM REACT
        # =================================================

        data = request.get_json()


        if not data:

            return jsonify({

                "status":
                    "error",

                "message":
                    "No JSON data received"

            }), 400


        polygon = data.get(
            "polygon"
        )


        if not polygon:

            return jsonify({

                "status":
                    "error",

                "message":
                    "AOI polygon is required"

            }), 400


        # =================================================
        # 2. AOI LOCATION
        # =================================================

        print(
            "\nFinding approximate AOI location..."
        )


        aoi_location = get_aoi_location(
            polygon
        )


        print(
            "AOI Location:",
            aoi_location.get(
                "display_name"
            )
        )


        # =================================================
        # PRINT AOI
        # =================================================

        print("\n===================================")
        print("          AOI RECEIVED")
        print("===================================")


        for point in polygon:

            print(

                "Latitude:",

                point.get("lat"),

                "| Longitude:",

                point.get("lng")

            )


        # =================================================
        # 3. SENTINEL-2 RGB IMAGE
        # =================================================

        print(
            "\nRequesting Sentinel-2 image..."
        )


        image_bytes = analyze_aoi(
            polygon
        )


        output_file = (
            "data/aoi_sentinel2.png"
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
                image_bytes
            )


        print(

            "✅ Sentinel-2 image saved:",

            output_file

        )


        # =================================================
        # 4. NDVI + NDWI + NDMI
        # =================================================

        print(
            "\nRequesting NDVI + NDWI + NDMI..."
        )


        index_result = analyze_indices(
            polygon
        )


        # =================================================
        # 5. POTENTIAL MANGROVE SCREENING
        # =================================================

        print(
            "\nStarting potential mangrove screening..."
        )


        mangrove_result = screen_mangroves(

            index_result[
                "file"
            ]

        )


        # =================================================
        # 6. CARBON ESTIMATION
        # =================================================

        print(
            "\nStarting carbon estimation..."
        )


        carbon_result = estimate_carbon(

            mangrove_result[
                "potential_mangrove_area_hectares"
            ]

        )


        # =================================================
        # 7. FINAL RESPONSE TO REACT
        # =================================================

        return jsonify({

            "status":
                "success",

            "message":
                "AOI analyzed successfully!",


            # ---------------------------------------------
            # AOI INFORMATION
            # ---------------------------------------------

            "polygon_points":
                len(polygon),

            "polygon":
                polygon,

            "aoi_location":
                aoi_location,


            # ---------------------------------------------
            # SENTINEL-2
            # ---------------------------------------------

            "sentinel_image":
                output_file,


            # ---------------------------------------------
            # ENVIRONMENTAL INDICES
            # ---------------------------------------------

            "indices_file":
                index_result[
                    "file"
                ],

            "statistics":
                index_result[
                    "statistics"
                ],


            # ---------------------------------------------
            # MANGROVE SCREENING
            # ---------------------------------------------

            "mangrove_screening":
                mangrove_result,


            # ---------------------------------------------
            # CARBON ESTIMATION
            # ---------------------------------------------

            "carbon_estimation":
                carbon_result,


            # ---------------------------------------------
            # NEXT STEP
            # ---------------------------------------------

            "next_step":
                "MRV Report Generation"

        })


    except Exception as e:

        print(
            "\n❌ ANALYSIS ERROR:"
        )

        print(e)


        return jsonify({

            "status":
                "error",

            "message":
                str(e)

        }), 500


# =========================================================
# MRV REPORT GENERATION API
# =========================================================

@app.route(
    "/api/report",
    methods=["POST"]
)
def generate_report_api():

    try:

        # =================================================
        # RECEIVE ANALYSIS DATA
        # =================================================

        data = request.get_json()


        if not data:

            return jsonify({

                "status":
                    "error",

                "message":
                    "No analysis data received"

            }), 400


        print("\n===================================")
        print("       MRV REPORT GENERATION")
        print("===================================")


        # =================================================
        # GENERATE UNIQUE REPORT ID
        # =================================================

        report_id = (

            "BCMRV-"

            + datetime.now().strftime(
                "%Y%m%d-%H%M%S"
            )

        )


        print(
            "Report ID:",
            report_id
        )


        # =================================================
        # GENERATED DATE & TIME
        # =================================================

        generated_on = (
            datetime.now().strftime(
                "%d %B %Y, %H:%M"
            )
        )


        data["report_id"] = (
            report_id
        )

        data["generated_on"] = (
            generated_on
        )


        # =================================================
        # VERIFICATION URL
        # =================================================

        verification_url = (

            PUBLIC_BASE_URL

            + "/verify/"

            + quote(
                report_id
            )

        )


        data["verification_url"] = (
            verification_url
        )


        print(
            "Verification URL:",
            verification_url
        )


        # =================================================
        # GENERATE PDF
        # =================================================

        report_file = generate_mrv_report(
            data
        )


        print(
            "✅ MRV report generated:",
            report_file
        )


        # =================================================
        # SAVE VERIFICATION DATA
        # =================================================

        verification_file = os.path.join(

            REPORTS_FOLDER,

            f"{report_id}.json"

        )


        with open(

            verification_file,

            "w",

            encoding="utf-8"

        ) as f:

            json.dump(

                data,

                f,

                indent=2,

                ensure_ascii=False

            )


        print(
            "✅ Verification data saved:",
            verification_file
        )


        # =================================================
        # FINAL RESPONSE
        # =================================================

        return jsonify({

            "status":
                "success",

            "message":
                "MRV report generated successfully!",

            "report_file":
                report_file,

            "report_id":
                report_id,

            "verification_url":
                verification_url

        })


    except Exception as e:

        print(
            "\n❌ REPORT ERROR:"
        )

        print(e)


        return jsonify({

            "status":
                "error",

            "message":
                str(e)

        }), 500


# =========================================================
# MRV REPORT DOWNLOAD API
# =========================================================

@app.route(
    "/api/report/download",
    methods=["GET"]
)
def download_report():

    try:

        report_file = request.args.get(
            "file"
        )


        # =================================================
        # CHECK FILE PARAMETER
        # =================================================

        if not report_file:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Report file is required"

            }), 400


        # =================================================
        # ABSOLUTE PATHS
        # =================================================

        report_path = os.path.abspath(
            report_file
        )

        reports_folder = os.path.abspath(
            REPORTS_FOLDER
        )


        # =================================================
        # SECURITY CHECK
        # =================================================

        try:

            common_path = os.path.commonpath([

                report_path,

                reports_folder

            ])

        except ValueError:

            common_path = ""


        if common_path != reports_folder:

            return jsonify({

                "status":
                    "error",

                "message":
                    "Invalid report path"

            }), 400


        # =================================================
        # CHECK REPORT EXISTS
        # =================================================

        if not os.path.exists(
            report_path
        ):

            return jsonify({

                "status":
                    "error",

                "message":
                    "Report file not found"

            }), 404


        print(
            "⬇️ Downloading MRV report:",
            report_path
        )


        # =================================================
        # SEND PDF TO BROWSER
        # =================================================

        return send_file(

            report_path,

            as_attachment=True,

            download_name=os.path.basename(
                report_path
            ),

            mimetype="application/pdf"

        )


    except Exception as e:

        print(
            "\n❌ DOWNLOAD ERROR:"
        )

        print(e)


        return jsonify({

            "status":
                "error",

            "message":
                str(e)

        }), 500


# =========================================================
# REPORT VERIFICATION PAGE
# =========================================================

@app.route(
    "/verify/<report_id>",
    methods=["GET"]
)
def verify_report(report_id):

    try:

        verification_file = os.path.join(

            REPORTS_FOLDER,

            f"{report_id}.json"

        )


        # =================================================
        # REPORT NOT FOUND
        # =================================================

        if not os.path.exists(
            verification_file
        ):

            return """

            <!DOCTYPE html>

            <html>

            <head>

                <meta
                    name="viewport"
                    content="width=device-width,
                    initial-scale=1"
                >

                <title>
                    Blue Carbon MRV
                </title>

            </head>

            <body style="
                font-family: Arial, sans-serif;
                background:#f4f8f5;
                text-align:center;
                padding:60px;
            ">

                <h1>
                    ❌ Report Not Found
                </h1>

                <p>
                    This Blue Carbon MRV report
                    could not be verified.
                </p>

            </body>

            </html>

            """, 404


        # =================================================
        # READ VERIFICATION DATA
        # =================================================

        with open(

            verification_file,

            "r",

            encoding="utf-8"

        ) as f:

            data = json.load(f)


        # =================================================
        # EXTRACT DATA
        # =================================================

        carbon = data.get(

            "carbon_estimation",

            {}

        )


        mangrove = data.get(

            "mangrove_screening",

            {}

        )


        location = data.get(

            "aoi_location",

            {}

        )


        # =================================================
        # VALUES
        # =================================================

        mangrove_area = mangrove.get(

            "potential_mangrove_area_hectares",

            "N/A"

        )


        mangrove_percentage = mangrove.get(

            "potential_mangrove_percentage",

            "N/A"

        )


        estimated_carbon = carbon.get(

            "estimated_carbon_tonnes",

            "N/A"

        )


        estimated_co2e = carbon.get(

            "estimated_co2e_tonnes",

            "N/A"

        )


        generated_on = data.get(

            "generated_on",

            "N/A"

        )


        location_name = location.get(

            "display_name",

            "Location unavailable"

        )


        # =================================================
        # VERIFICATION PAGE
        # =================================================

        return f"""

        <!DOCTYPE html>

        <html>

        <head>

            <meta
                name="viewport"
                content="width=device-width,
                initial-scale=1"
            >

            <title>
                Blue Carbon MRV Verification
            </title>

        </head>


        <body style="
            margin:0;
            font-family:Arial,sans-serif;
            background:#f4f8f5;
            color:#172033;
        ">


        <div style="
            max-width:700px;
            margin:40px auto;
            background:white;
            padding:30px;
            border-radius:18px;
            box-shadow:
                0 4px 20px
                rgba(0,0,0,0.10);
        ">


            <h1 style="
                color:#176b3a;
                text-align:center;
                margin-bottom:5px;
            ">

                🌿 Blue Carbon MRV

            </h1>


            <h2 style="
                text-align:center;
                margin-top:5px;
            ">

                Report Verification

            </h2>


            <div style="
                background:#eaf7ee;
                padding:18px;
                border-radius:12px;
                margin-top:25px;
            ">

                <h3 style="
                    color:#176b3a;
                    margin-top:0;
                ">

                    ✅ Report Verified

                </h3>


                <p>

                    This report was generated
                    by the Blue Carbon MRV
                    system.

                </p>

            </div>


            <hr style="
                margin:25px 0;
            ">


            <h3>
                📋 Report Information
            </h3>


            <p>

                <b>Report ID:</b>

                {report_id}

            </p>


            <p>

                <b>Generated:</b>

                {generated_on}

            </p>


            <h3>
                📍 AOI Location
            </h3>


            <p>
                {location_name}
            </p>


            <h3>
                🌱 Mangrove Screening
            </h3>


            <p>

                <b>Potential Mangrove Area:</b>

                {mangrove_area} ha

            </p>


            <p>

                <b>Potential Mangrove Percentage:</b>

                {mangrove_percentage} %

            </p>


            <h3>
                🌳 Carbon Estimation
            </h3>


            <p>

                <b>Estimated Carbon:</b>

                {estimated_carbon} t C

            </p>


            <p>

                <b>Estimated CO₂ Equivalent:</b>

                {estimated_co2e} t CO₂e

            </p>


            <hr style="
                margin:25px 0;
            ">


            <p style="
                font-size:13px;
                color:#666;
                line-height:1.5;
            ">

                ⚠️ This is a screening estimate.
                Field validation and site-specific
                carbon factors are required for
                higher-accuracy MRV.

            </p>


            <p style="
                text-align:center;
                color:#176b3a;
                font-weight:bold;
                margin-top:30px;
            ">

                Blue Carbon MRV

            </p>


        </div>


        </body>

        </html>

        """


    except Exception as e:

        print(
            "\n❌ VERIFICATION ERROR:"
        )

        print(e)


        return jsonify({

            "status":
                "error",

            "message":
                str(e)

        }), 500


# =========================================================
# START FLASK
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )