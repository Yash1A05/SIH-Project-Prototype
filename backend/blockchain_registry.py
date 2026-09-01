import json
import os
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

RPC_URL = os.getenv(
    "BLOCKCHAIN_RPC_URL",
    "http://127.0.0.1:8545"
)

CONTRACT_ADDRESS = os.getenv(
    "BLOCKCHAIN_CONTRACT_ADDRESS"
)

CARBON_CREDIT_ADDRESS = os.getenv(
    "CARBON_CREDIT_CONTRACT_ADDRESS"
)

PRIVATE_KEY = os.getenv(
    "BLOCKCHAIN_PRIVATE_KEY"
)


# =========================================================
# VALIDATE CONFIGURATION
# =========================================================

if not CONTRACT_ADDRESS:
    raise ValueError(
        "BLOCKCHAIN_CONTRACT_ADDRESS is not set in .env"
    )

if not CARBON_CREDIT_ADDRESS:
    raise ValueError(
        "CARBON_CREDIT_CONTRACT_ADDRESS is not set in .env"
    )

if not PRIVATE_KEY:
    raise ValueError(
        "BLOCKCHAIN_PRIVATE_KEY is not set in .env"
    )


# =========================================================
# CONNECT TO BLOCKCHAIN
# =========================================================

w3 = Web3(
    Web3.HTTPProvider(RPC_URL)
)

if not w3.is_connected():
    raise ConnectionError(
        f"Could not connect to blockchain at {RPC_URL}"
    )


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

REGISTRY_ABI_PATH = (
    BASE_DIR
    / "blockchain"
    / "artifacts"
    / "contracts"
    / "BlueCarbonRegistry.sol"
    / "BlueCarbonRegistry.json"
)

CARBON_CREDIT_ABI_PATH = (
    BASE_DIR
    / "blockchain"
    / "artifacts"
    / "contracts"
    / "CarbonCredit.sol"
    / "CarbonCredit.json"
)


# =========================================================
# LOAD REGISTRY ABI
# =========================================================

with open(
    REGISTRY_ABI_PATH,
    "r",
    encoding="utf-8"
) as file:
    registry_artifact = json.load(file)

REGISTRY_ABI = registry_artifact["abi"]


# =========================================================
# LOAD CARBON CREDIT ABI
# =========================================================

with open(
    CARBON_CREDIT_ABI_PATH,
    "r",
    encoding="utf-8"
) as file:
    carbon_credit_artifact = json.load(file)

CARBON_CREDIT_ABI = carbon_credit_artifact["abi"]


# =========================================================
# CONTRACT INSTANCES
# =========================================================

contract = w3.eth.contract(
    address=Web3.to_checksum_address(
        CONTRACT_ADDRESS
    ),
    abi=REGISTRY_ABI
)

carbon_credit_contract = w3.eth.contract(
    address=Web3.to_checksum_address(
        CARBON_CREDIT_ADDRESS
    ),
    abi=CARBON_CREDIT_ABI
)


# =========================================================
# REGISTER EVIDENCE
# =========================================================

def register_evidence(
    evidence_hash,
    project_id,
    metadata_uri
):
    """
    Register MRV evidence on BlueCarbonRegistry.
    """

    account = w3.eth.account.from_key(
        PRIVATE_KEY
    )

    nonce = w3.eth.get_transaction_count(
        account.address
    )

    transaction = contract.functions.registerEvidence(
        bytes.fromhex(
            evidence_hash.replace("0x", "")
        ),
        str(project_id),
        str(metadata_uri)
    ).build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gas": 500000,
        "gasPrice": w3.eth.gas_price,
        "chainId": w3.eth.chain_id
    })

    signed_transaction = account.sign_transaction(
        transaction
    )

    transaction_hash = w3.eth.send_raw_transaction(
        signed_transaction.raw_transaction
    )

    receipt = w3.eth.wait_for_transaction_receipt(
        transaction_hash
    )

    return {
        "success": receipt.status == 1,
        "transaction_hash": transaction_hash.hex(),
        "block_number": receipt.blockNumber,
        "contract_address": CONTRACT_ADDRESS
    }


# =========================================================
# VERIFY EVIDENCE
# =========================================================

def verify_evidence(evidence_hash):

    return contract.functions.verifyEvidence(
        bytes.fromhex(
            evidence_hash.replace("0x", "")
        )
    ).call()


# =========================================================
# GET EVIDENCE
# =========================================================

def get_evidence(evidence_hash):

    result = contract.functions.getEvidence(
        bytes.fromhex(
            evidence_hash.replace("0x", "")
        )
    ).call()

    return {
        "evidence_hash": result[0].hex(),
        "project_id": result[1],
        "metadata_uri": result[2],
        "registered_at": result[3],
        "registered_by": result[4],
        "exists": result[5]
    }


# =========================================================
# ISSUE CARBON CREDITS
# =========================================================

def issue_carbon_credits(
    project_id,
    evidence_hash,
    recipient,
    amount
):
    """
    Issue Blue Carbon Credits.

    1 BCC = 1 tonne CO2e
    """

    account = w3.eth.account.from_key(
        PRIVATE_KEY
    )

    recipient = Web3.to_checksum_address(
        recipient
    )

    amount = int(amount)

    if amount <= 0:
        raise ValueError(
            "Carbon credit amount must be greater than zero"
        )

    nonce = w3.eth.get_transaction_count(
        account.address
    )

    transaction = carbon_credit_contract.functions.issueCredits(
        str(project_id),
        bytes.fromhex(
            evidence_hash.replace("0x", "")
        ),
        recipient,
        amount
    ).build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gas": 500000,
        "gasPrice": w3.eth.gas_price,
        "chainId": w3.eth.chain_id
    })

    signed_transaction = account.sign_transaction(
        transaction
    )

    transaction_hash = w3.eth.send_raw_transaction(
        signed_transaction.raw_transaction
    )

    receipt = w3.eth.wait_for_transaction_receipt(
        transaction_hash
    )

    return {
        "success": receipt.status == 1,
        "transaction_hash": transaction_hash.hex(),
        "block_number": receipt.blockNumber,
        "contract_address": CARBON_CREDIT_ADDRESS,
        "recipient": recipient,
        "amount": amount
    }


# =========================================================
# GET CARBON CREDIT PROJECT
# =========================================================

def get_credit_project(project_id):

    result = carbon_credit_contract.functions.getProject(
        str(project_id)
    ).call()

    return {
        "project_id": result[0],
        "evidence_hash": result[1].hex(),
        "credits_issued": result[2],
        "credits_retired": result[3],
        "registered_at": result[4],
        "exists": result[5]
    }


# =========================================================
# AVAILABLE CARBON CREDITS
# =========================================================

def get_available_credits(project_id):

    return carbon_credit_contract.functions.availableCredits(
        str(project_id)
    ).call()


# =========================================================
# CARBON CREDIT BALANCE
# =========================================================

# =========================================================
# CARBON CREDIT BALANCE
# =========================================================

def get_carbon_credit_balance(address):
    """
    Returns BCC token balance for a wallet.
    """

    checksum_address = Web3.to_checksum_address(address)

    return carbon_credit_contract.functions.balanceOf(
        checksum_address
    ).call()


# =========================================================
# TRANSFER CARBON CREDITS
# =========================================================

def transfer_carbon_credits(
    recipient,
    amount
):
    """
    Transfer BCC tokens from the configured blockchain account
    to another wallet.
    """

    account = w3.eth.account.from_key(
        PRIVATE_KEY
    )

    recipient = Web3.to_checksum_address(
        recipient
    )

    amount = int(amount)

    if amount <= 0:
        raise ValueError(
            "Transfer amount must be greater than zero"
        )

    current_balance = carbon_credit_contract.functions.balanceOf(
        account.address
    ).call()

    if current_balance < amount:
        raise ValueError(
            f"Insufficient BCC balance. Available: {current_balance}"
        )

    nonce = w3.eth.get_transaction_count(
        account.address,
        "pending"
    )

    transaction = carbon_credit_contract.functions.transfer(
        recipient,
        amount
    ).build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gas": 200000,
        "gasPrice": w3.eth.gas_price,
        "chainId": w3.eth.chain_id
    })

    signed_transaction = account.sign_transaction(
        transaction
    )

    transaction_hash = w3.eth.send_raw_transaction(
        signed_transaction.raw_transaction
    )

    receipt = w3.eth.wait_for_transaction_receipt(
        transaction_hash
    )

    return {
        "success": receipt.status == 1,
        "transaction_hash": transaction_hash.hex(),
        "block_number": receipt.blockNumber,
        "contract_address": CARBON_CREDIT_ADDRESS,
        "sender": account.address,
        "recipient": recipient,
        "amount": amount
    }


# =========================================================
# RETIRE CARBON CREDITS
# =========================================================

def retire_carbon_credits(
    project_id,
    amount
):
    """
    Retire BCC carbon credits from the configured blockchain account.
    """

    account = w3.eth.account.from_key(
        PRIVATE_KEY
    )

    project_id = str(project_id)
    amount = int(amount)

    if not project_id:
        raise ValueError(
            "Project ID is required"
        )

    if amount <= 0:
        raise ValueError(
            "Retirement amount must be greater than zero"
        )

    # Check wallet balance
    current_balance = carbon_credit_contract.functions.balanceOf(
        account.address
    ).call()

    if current_balance < amount:
        raise ValueError(
            f"Insufficient BCC balance. Available: {current_balance}"
        )

    # Get pending nonce
    nonce = w3.eth.get_transaction_count(
        account.address,
        "pending"
    )

    # Retire credits directly through smart contract
    transaction = carbon_credit_contract.functions.retireCredits(
        project_id,
        amount
    ).build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gas": 500000,
        "gasPrice": w3.eth.gas_price,
        "chainId": w3.eth.chain_id
    })

    signed_transaction = account.sign_transaction(
        transaction
    )

    transaction_hash = w3.eth.send_raw_transaction(
        signed_transaction.raw_transaction
    )

    receipt = w3.eth.wait_for_transaction_receipt(
        transaction_hash
    )

    # Get updated balance
    new_balance = carbon_credit_contract.functions.balanceOf(
        account.address
    ).call()

    return {
        "success": receipt.status == 1,
        "transaction_hash": transaction_hash.hex(),
        "block_number": receipt.blockNumber,
        "contract_address": CARBON_CREDIT_ADDRESS,
        "project_id": project_id,
        "amount": amount,
        "retired": amount,
        "remaining_balance": new_balance
    }

# =========================================================
# LATEST CARBON CREDIT BLOCKCHAIN TRANSACTION
# =========================================================

from datetime import datetime


def get_latest_carbon_credit_transaction():
    """
    Get latest CarbonCreditsIssued event from blockchain.
    Returns real transaction hash, block number and date.
    """

    try:
        # CarbonCreditsIssued event signature
        event_signature = Web3.keccak(
            text="CarbonCreditsIssued(string,bytes32,address,uint256)"
        ).hex()

        latest_block = w3.eth.block_number

        logs = w3.eth.get_logs({
            "address": Web3.to_checksum_address(
                CARBON_CREDIT_ADDRESS
            ),
            "fromBlock": 0,
            "toBlock": latest_block,
            "topics": [event_signature]
        })

        if not logs:
            return None

        latest_log = logs[-1]

        block_number = latest_log["blockNumber"]
        transaction_hash = latest_log["transactionHash"].hex()

        block = w3.eth.get_block(block_number)

        timestamp = block["timestamp"]

        date = datetime.fromtimestamp(
            timestamp
        ).strftime("%d %b %Y")

        # Decode event
        event = carbon_credit_contract.events.CarbonCreditsIssued()

        decoded = event.process_log(latest_log)

        args = decoded["args"]

        return {
            "transaction_hash": transaction_hash,
            "block_number": block_number,
            "date": date,
            "timestamp": timestamp,
            "project_id": args["projectId"],
            "evidence_hash": args["evidenceHash"].hex(),
            "recipient": args["recipient"],
            "amount": int(args["amount"]),
            "status": "Confirmed"
        }

    except Exception as error:
        print(
            "Latest blockchain transaction error:",
            error
        )

        return None