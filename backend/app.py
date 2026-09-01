from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

import os
import json
import re
import requests

from datetime import datetime
from urllib.parse import quote

from sentinel_aoi import analyze_aoi
from sentinel_indices import analyze_indices
from mangrove_candidate import screen_mangroves
from carbon_estimation import estimate_carbon
from mrv_report import generate_mrv_report

from hash_metadata import create_evidence_hash
from blockchain_registry import (
    register_evidence,
    verify_evidence,
    issue_carbon_credits,
    get_carbon_credit_balance,
    get_latest_carbon_credit_transaction,
    transfer_carbon_credits,
    retire_carbon_credits,
    w3
)


app = Flask(__name__)

CORS(app)
@app.route("/api/blockchain/latest", methods=["GET"])
def blockchain_latest():
    try:

        transaction = get_latest_carbon_credit_transaction()

        if transaction is None:
            return jsonify({
                "status": "success",
                "transaction": None
            })

        # Web3 can return bytes32/bytes values. Convert them to 0x-prefixed hex
        # before Flask tries to serialize the response as JSON.
        transaction = make_json_safe(transaction)

        # Add a human-readable date when the transaction contains a Unix timestamp.
        if isinstance(transaction, dict) and transaction.get("timestamp") is not None:
            try:
                transaction["date"] = datetime.fromtimestamp(
                    int(transaction["timestamp"])
                ).strftime("%d %b %Y")
            except (TypeError, ValueError, OSError):
                pass

        return jsonify({
            "status": "success",
            "transaction": transaction
        })

    except Exception as error:

        print("Blockchain latest transaction error:", error)

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


@app.route("/api/blockchain/transactions", methods=["GET"])
def blockchain_transactions():
    """Return recent REAL carbon-credit mint/Transfer transactions from the token contract."""
    try:
        from blockchain_registry import CARBON_CREDIT_ADDRESS, w3

        recipient = os.getenv("CARBON_CREDIT_RECIPIENT_ADDRESS")
        if not recipient:
            return jsonify({
                "status": "error",
                "message": "CARBON_CREDIT_RECIPIENT_ADDRESS not configured"
            }), 500

        latest_block = w3.eth.block_number

        # Standard ERC-20 Transfer(address,address,uint256) event.
        transfer_topic = w3.keccak(
            text="Transfer(address,address,uint256)"
        ).hex()

        # Filter only transfers whose destination is our configured recipient.
        recipient_topic = "0x" + recipient.lower().replace("0x", "").rjust(64, "0")

        logs = w3.eth.get_logs({
            "fromBlock": 0,
            "toBlock": latest_block,
            "address": w3.to_checksum_address(CARBON_CREDIT_ADDRESS),
            "topics": [transfer_topic, None, recipient_topic]
        })

        transactions = []
        seen = set()

        for log in reversed(logs):
            tx_hash = log["transactionHash"].hex()
            if tx_hash in seen:
                continue
            seen.add(tx_hash)

            amount = int(log["data"].hex(), 16)
            block = w3.eth.get_block(log["blockNumber"])

            transactions.append({
                "transaction_hash": tx_hash,
                "block_number": int(log["blockNumber"]),
                "amount": amount,
                "date": datetime.fromtimestamp(
                    int(block["timestamp"])
                ).strftime("%d %b %Y"),
                "status": "Confirmed",
                "contract_address": CARBON_CREDIT_ADDRESS,
                "recipient": recipient,
                "project": "Carbon Credits"
            })

            if len(transactions) >= 5:
                break

        return jsonify({
            "status": "success",
            "transactions": transactions
        })

    except Exception as error:
        print("Blockchain transactions error:", error)
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

   # =========================================================
# REAL CARBON CREDIT ACTIVITY
# ISSUE → TRANSFER → RETIRE
# =========================================================

@app.route("/api/blockchain/activity", methods=["GET"])
def blockchain_activity():
    try:

        from blockchain_registry import (
            CARBON_CREDIT_ADDRESS,
            w3,
            carbon_credit_contract
        )

        latest_block = w3.eth.block_number

        ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

        # -------------------------------------------------
        # ERC20 TRANSFER EVENT
        # -------------------------------------------------

        transfer_topic = w3.keccak(
            text="Transfer(address,address,uint256)"
        ).hex()

        logs = w3.eth.get_logs({
            "fromBlock": 0,
            "toBlock": latest_block,
            "address": w3.to_checksum_address(
                CARBON_CREDIT_ADDRESS
            ),
            "topics": [transfer_topic]
        })

        # -------------------------------------------------
        # ISSUE EVENTS
        # -------------------------------------------------

        issue_topic = w3.keccak(
            text="CarbonCreditsIssued(string,bytes32,address,uint256)"
        ).hex()

        issue_logs = w3.eth.get_logs({
            "fromBlock": 0,
            "toBlock": latest_block,
            "address": w3.to_checksum_address(
                CARBON_CREDIT_ADDRESS
            ),
            "topics": [issue_topic]
        })

        issue_by_tx = {}

        issue_event = (
            carbon_credit_contract
            .events
            .CarbonCreditsIssued()
        )

        for log in issue_logs:
            try:

                decoded = issue_event.process_log(log)
                args = decoded["args"]

                tx_hash = log["transactionHash"].hex()

                issue_by_tx[tx_hash] = {
                    "project_id": make_json_safe(
                        args["projectId"]
                    ),
                    "recipient": make_json_safe(
                        args["recipient"]
                    )
                }

            except Exception as decode_error:

                print(
                    "Issue event decode error:",
                    decode_error
                )

        # -------------------------------------------------
        # RETIRE EVENTS
        # -------------------------------------------------

        retire_topic = w3.keccak(
            text="CarbonCreditsRetired(string,address,uint256)"
        ).hex()

        retire_logs = w3.eth.get_logs({
            "fromBlock": 0,
            "toBlock": latest_block,
            "address": w3.to_checksum_address(
                CARBON_CREDIT_ADDRESS
            ),
            "topics": [retire_topic]
        })

        retire_by_tx = {}

        retire_event = (
            carbon_credit_contract
            .events
            .CarbonCreditsRetired()
        )

        for log in retire_logs:
            try:

                decoded = retire_event.process_log(log)
                args = decoded["args"]

                tx_hash = log["transactionHash"].hex()

                retire_by_tx[tx_hash] = {
                    "project_id": make_json_safe(
                        args["projectId"]
                    ),
                    "account": make_json_safe(
                        args["account"]
                    )
                }

            except Exception as decode_error:

                print(
                    "Retire event decode error:",
                    decode_error
                )

        # -------------------------------------------------
        # BUILD ACTIVITY LIST
        # -------------------------------------------------

        activities = []

        for log in reversed(logs):

            tx_hash = log["transactionHash"].hex()

            # ---------------------------------------------
            # FROM ADDRESS
            # ---------------------------------------------

            topic_from = log["topics"][1].hex()

            from_address = w3.to_checksum_address(
                "0x" + topic_from[-40:]
            )

            # ---------------------------------------------
            # TO ADDRESS
            # ---------------------------------------------

            topic_to = log["topics"][2].hex()

            to_address = w3.to_checksum_address(
                "0x" + topic_to[-40:]
            )

            # ---------------------------------------------
            # AMOUNT
            # ---------------------------------------------

            amount = int(
                log["data"].hex(),
                16
            )

            # ---------------------------------------------
            # BLOCK + TIMESTAMP
            # ---------------------------------------------

            block_number = int(
                log["blockNumber"]
            )

            block = w3.eth.get_block(
                block_number
            )

            timestamp = int(
                block["timestamp"]
            )

            # ---------------------------------------------
            # DETERMINE TRANSACTION TYPE
            # ---------------------------------------------

            if from_address.lower() == ZERO_ADDRESS.lower():

                # =========================================
                # ISSUE
                # =========================================

                tx_type = "Issue"

                issue_info = issue_by_tx.get(
                    tx_hash,
                    {}
                )

                project_id = issue_info.get(
                    "project_id"
                )

                from_display = "System"

                to_display = to_address

                status = "Confirmed"

            elif to_address.lower() == ZERO_ADDRESS.lower():

                # =========================================
                # RETIRE
                # =========================================

                tx_type = "Retire"

                retire_info = retire_by_tx.get(
                    tx_hash,
                    {}
                )

                project_id = retire_info.get(
                    "project_id"
                )

                from_display = from_address

                to_display = "Retired"

                status = "Retired"

            else:

                # =========================================
                # TRANSFER
                # =========================================

                tx_type = "Transfer"

                # Standard ERC20 Transfer event does not
                # contain projectId.

                project_id = None

                from_display = from_address

                to_display = to_address

                status = "Confirmed"

            # ---------------------------------------------
            # ADD ACTIVITY
            # ---------------------------------------------

            activities.append({

                "type": tx_type,

                "amount": amount,

                "from": from_display,

                "to": to_display,

                "project_id": project_id,

                "timestamp": timestamp,

                "date": datetime.fromtimestamp(
                    timestamp
                ).strftime("%d %b %Y"),

                "status": status,

                "transaction_hash": tx_hash,

                "block_number": block_number,

                "contract_address":
                    CARBON_CREDIT_ADDRESS
            })

        # -------------------------------------------------
        # LATEST 10 ACTIVITIES
        # -------------------------------------------------

        activities = activities[:10]

        # -------------------------------------------------
        # MAKE EVERYTHING JSON SAFE
        # IMPORTANT:
        # Web3 may return bytes / bytes32 values.
        # -------------------------------------------------

        activities = make_json_safe(
            activities
        )

        # -------------------------------------------------
        # RETURN RESPONSE
        # -------------------------------------------------

        return jsonify({

            "status": "success",

            "activities": activities

        })

    except Exception as error:

        print(
            "Blockchain activity error:",
            error
        )

        return jsonify({

            "status": "error",

            "message": str(error)

        }), 500

        # -------------------------------------------------
        # LATEST 10
        # -------------------------------------------------

        activities = activities[:10]

        return jsonify({
            "status": "success",
            "activities": activities
        })

    except Exception as error:

        print(
            "Blockchain activity error:",
            error
        )

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


# =========================================================
# CONFIGURATION
# =========================================================

# For local development
# Later, for deployment, change this to your public HTTPS URL.


def make_json_safe(value):
    """Convert Web3/blockchain values (especially bytes) into JSON-safe values."""
    if isinstance(value, bytes):
        return "0x" + value.hex()
    if isinstance(value, dict):
        return {str(k): make_json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [make_json_safe(v) for v in value]
    return value

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

        "status":
            "success",

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


                # =================================================
        # BLOCKCHAIN EVIDENCE REGISTRATION
        # =================================================

        try:

            print("\n===================================")
            print("     BLOCKCHAIN EVIDENCE REGISTRATION")
            print("===================================")

            # Use report ID as project identifier
            project_id = report_id

            # Create deterministic evidence hash
            evidence_hash, hash_bytes32, canonical_metadata = (
                create_evidence_hash(
                    project_id,
                    data
                )
            )

            print(
                "Evidence Hash:",
                evidence_hash
            )

            # Register evidence on blockchain
            blockchain_result = register_evidence(
                hash_bytes32,
                project_id,
                verification_url
            )

            print(
                "Blockchain Registration:",
                blockchain_result
            )

            data["blockchain"] = {
                "registered": blockchain_result["success"],
                "evidence_hash": evidence_hash,
                "transaction_hash":
                    blockchain_result["transaction_hash"],
                "block_number":
                    blockchain_result["block_number"],
                "contract_address":
                    blockchain_result["contract_address"]
            }

            print(
                "✅ Evidence registered on blockchain"
            )


            # =================================================
            # CARBON CREDIT ISSUANCE
            # =================================================

            print("\n===================================")
            print("       CARBON CREDIT ISSUANCE")
            print("===================================")

            credit_recipient = os.getenv(
                "CARBON_CREDIT_RECIPIENT_ADDRESS"
            )

            if not credit_recipient:
                raise ValueError(
                    "CARBON_CREDIT_RECIPIENT_ADDRESS "
                    "is not set in .env"
                )

            carbon_data = data.get(
                "carbon_estimation",
                {}
            )

            estimated_co2e = float(
                carbon_data.get(
                    "estimated_co2e_tonnes",
                    0
                )
            )

            # 1 BCC = 1 tonne CO2e
            credits_to_issue = int(
                round(estimated_co2e)
            )

            print(
                "Estimated CO2e:",
                estimated_co2e
            )

            print(
                "Carbon Credits to issue:",
                credits_to_issue,
                "BCC"
            )


            if credits_to_issue > 0:

                credit_result = issue_carbon_credits(
                    project_id=report_id,
                    evidence_hash=evidence_hash,
                    recipient=credit_recipient,
                    amount=credits_to_issue
                )

                print(
                    "Carbon Credit Result:",
                    credit_result
                )

                # Get current recipient balance
                balance = get_carbon_credit_balance(
                    credit_recipient
                )

                data["carbon_credits"] = {

                    "issued": True,

                    "amount": credits_to_issue,

                    "unit": "BCC",

                    "co2e_equivalent_tonnes":
                        credits_to_issue,

                    "recipient":
                        credit_recipient,

                    "transaction_hash":
                        credit_result[
                            "transaction_hash"
                        ],

                    "block_number":
                        credit_result[
                            "block_number"
                        ],

                    "contract_address":
                        credit_result[
                            "contract_address"
                        ],

                    "current_balance":
                        balance
                }

                print(
                    "Current BCC Balance:",
                    balance
                )

                print(
                    "✅ Carbon credits issued successfully"
                )

            else:

                data["carbon_credits"] = {
                    "issued": False,
                    "amount": 0,
                    "unit": "BCC",
                    "reason":
                        "Estimated CO2e is zero"
                }

                print(
                    "⚠️ No carbon credits issued"
                )


        except Exception as blockchain_error:

            print(
                "\n⚠️ BLOCKCHAIN / CREDIT PROCESS FAILED:"
            )

            print(
                blockchain_error
            )

            # MRV report should still succeed
            if "blockchain" not in data:

                data["blockchain"] = {
                    "registered": False,
                    "error": str(blockchain_error)
                }

            data["carbon_credits"] = {
                "issued": False,
                "amount": 0,
                "unit": "BCC",
                "error": str(blockchain_error)
            }


        # =================================================
        # SAVE FINAL VERIFICATION DATA
        # =================================================

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
                verification_url,

            "blockchain":
                data.get("blockchain"),

            "carbon_credits":
                data.get("carbon_credits")

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
        # BLOCKCHAIN VERIFICATION
        # =================================================

        blockchain_verified = False
        blockchain_error = None
        blockchain_evidence_hash = None

        try:

            print("\n===================================")
            print("       BLOCKCHAIN VERIFICATION")
            print("===================================")


            # The original evidence hash was created
            # BEFORE blockchain information was added
            # to the JSON file.
            #
            # Therefore remove blockchain data before
            # recreating the hash.

            evidence_data = dict(data)

            evidence_data.pop(
                "blockchain",
                None
            )

            evidence_data.pop(
    "carbon_credits",
    None
)


            # Recreate exact same evidence hash
            evidence_hash, hash_bytes32, canonical_metadata = (
                create_evidence_hash(
                    report_id,
                    evidence_data
                )
            )


            blockchain_evidence_hash = evidence_hash


            print(
                "Recreated Evidence Hash:",
                evidence_hash
            )


            # Check evidence existence on blockchain
            blockchain_verified = verify_evidence(
                hash_bytes32
            )


            print(
                "Blockchain Verification:",
                blockchain_verified
            )


        except Exception as blockchain_exception:

            blockchain_error = str(
                blockchain_exception
            )

            print(
                "\n⚠️ BLOCKCHAIN VERIFICATION FAILED:"
            )

            print(
                blockchain_error
            )


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
        # BLOCKCHAIN DETAILS
        # =================================================

        blockchain_data = data.get(
            "blockchain",
            {}
        )

        transaction_hash = blockchain_data.get(
            "transaction_hash",
            "N/A"
        )

        block_number = blockchain_data.get(
            "block_number",
            "N/A"
        )

        contract_address = blockchain_data.get(
            "contract_address",
            "N/A"
        )


        # =================================================
        # VERIFICATION PAGE
        # =================================================

        if blockchain_verified:

            verification_title = (
                "✅ Report Verified on Blockchain"
            )

            verification_description = (
                "This report evidence was successfully "
                "verified against the Blue Carbon MRV "
                "blockchain registry."
            )

            verification_background = "#eaf7ee"
            verification_color = "#176b3a"

        else:

            verification_title = (
                "❌ Blockchain Verification Failed"
            )

            verification_description = (
                "This report could not be verified "
                "against the blockchain registry."
            )

            verification_background = "#fdecec"
            verification_color = "#b91c1c"


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
                background:{verification_background};
                padding:18px;
                border-radius:12px;
                margin-top:25px;
            ">

                <h3 style="
                    color:{verification_color};
                    margin-top:0;
                ">

                    {verification_title}

                </h3>


                <p>

                    {verification_description}

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


            <h3>
                🔐 Blockchain Evidence
            </h3>


            <p style="
                word-break:break-all;
                font-size:13px;
            ">

                <b>Evidence Hash:</b><br>

                {blockchain_evidence_hash or "N/A"}

            </p>


            <p style="
                word-break:break-all;
                font-size:13px;
            ">

                <b>Transaction Hash:</b><br>

                {transaction_hash}

            </p>


            <p>

                <b>Block Number:</b>

                {block_number}

            </p>


            <p style="
                word-break:break-all;
                font-size:13px;
            ">

                <b>Contract Address:</b><br>

                {contract_address}

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
# TRANSFER CARBON CREDITS API
# =========================================================

@app.route(
    "/api/blockchain/transfer",
    methods=["POST"]
)
def blockchain_transfer():

    try:

        body = request.get_json() or {}

        recipient = body.get("recipient")
        amount = body.get("amount")

        if not recipient:
            return jsonify({
                "status": "error",
                "message": "Recipient address is required"
            }), 400

        # -------------------------------------------------
        # VALIDATE RECIPIENT WALLET ADDRESS
        # -------------------------------------------------

        recipient = str(recipient).strip()

        # Ethereum/EVM address must be exactly 42 characters:
        # 0x + 40 hexadecimal characters.
        if not re.fullmatch(r"0x[0-9a-fA-F]{40}", recipient):
            return jsonify({
                "status": "error",
                "message": "Invalid recipient wallet address. Use a valid 42-character Ethereum address (0x + 40 hexadecimal characters)."
            }), 400

        try:
            recipient = w3.to_checksum_address(recipient)
        except Exception:
            return jsonify({
                "status": "error",
                "message": "Invalid recipient wallet address."
            }), 400

        # -------------------------------------------------
        # VALIDATE AMOUNT
        # -------------------------------------------------

        if amount is None:
            return jsonify({
                "status": "error",
                "message": "Amount is required"
            }), 400

        try:
            amount = int(amount)
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "Amount must be a valid number"
            }), 400

        if amount <= 0:
            return jsonify({
                "status": "error",
                "message": "Amount must be greater than 0"
            }), 400

        result = transfer_carbon_credits(
            recipient=recipient,
            amount=amount
        )

        # Web3 may return bytes/bytes32 values. Convert them
        # before sending the response through Flask JSON.
        result = make_json_safe(result)

        return jsonify({
            "status": "success",
            "message": "Carbon credits transferred successfully",
            "transaction": result
        })

    except Exception as e:

        print(
            "BCC transfer error:",
            e
        )

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================================================
# RETIRE CARBON CREDITS API
# =========================================================

@app.route(
    "/api/blockchain/retire",
    methods=["POST"]
)
def blockchain_retire():

    try:

        body = request.get_json() or {}

        project_id = body.get("project_id")
        amount = body.get("amount")

        if not project_id:
            return jsonify({
                "status": "error",
                "message": "Project ID is required"
            }), 400

        if amount is None:
            return jsonify({
                "status": "error",
                "message": "Amount is required"
            }), 400

        result = retire_carbon_credits(
            project_id=project_id,
            amount=int(amount)
        )

        return jsonify({
            "status": "success",
            "message": "Carbon credits retired successfully",
            "transaction": result
        })

    except Exception as e:

        print(
            "BCC retire error:",
            e
        )

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# =========================================================
# BLOCKCHAIN DASHBOARD API
# =========================================================

@app.route("/api/blockchain/dashboard", methods=["GET"])
def blockchain_dashboard():

    try:
        from blockchain_registry import (
            get_carbon_credit_balance,
            CARBON_CREDIT_ADDRESS,
            CONTRACT_ADDRESS,
            w3
        )

        recipient = os.getenv(
            "CARBON_CREDIT_RECIPIENT_ADDRESS"
        )

        if not recipient:
            return jsonify({
                "status": "error",
                "message": "CARBON_CREDIT_RECIPIENT_ADDRESS not configured"
            }), 500

        # -------------------------------------------------
        # REAL BCC BALANCE FROM BLOCKCHAIN
        # -------------------------------------------------

        balance = get_carbon_credit_balance(
            recipient
        )

        # -------------------------------------------------
        # NETWORK INFORMATION
        # -------------------------------------------------

        chain_id = w3.eth.chain_id

        # -------------------------------------------------
        # RETURN REAL BLOCKCHAIN DATA
        # -------------------------------------------------

        return jsonify({
            "status": "success",

            "blockchain": {
                "network": "Hardhat Localhost",
                "chain_id": chain_id,

                "registry_contract":
                    CONTRACT_ADDRESS,

                "carbon_credit_contract":
                    CARBON_CREDIT_ADDRESS,

                "recipient":
                    recipient
            },

            "carbon_credits": {
                "balance": int(balance),
                "unit": "BCC",
                "co2e_equivalent_tonnes":
                    int(balance)
            }
        })

    except Exception as e:

        print(
            "Blockchain dashboard error:",
            e
        )

        return jsonify({
            "status": "error",
            "message": str(e)
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