import os
from dotenv import load_dotenv
from web3 import Web3

load_dotenv()


# =========================================================
# BLOCKCHAIN CONFIGURATION
# =========================================================

RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL")
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS")


# =========================================================
# CONNECT TO BLOCKCHAIN
# =========================================================

def get_web3():
    """
    Create and return a Web3 connection.
    """

    if not RPC_URL:
        raise ValueError(
            "BLOCKCHAIN_RPC_URL is not configured."
        )

    web3 = Web3(
        Web3.HTTPProvider(RPC_URL)
    )

    if not web3.is_connected():
        raise ConnectionError(
            "Unable to connect to blockchain network."
        )

    return web3


# =========================================================
# WALLET
# =========================================================

def get_account(web3):
    """
    Get the blockchain account from the configured
    private key.
    """

    if not PRIVATE_KEY:
        raise ValueError(
            "BLOCKCHAIN_PRIVATE_KEY is not configured."
        )

    account = web3.eth.account.from_key(
        PRIVATE_KEY
    )

    return account


# =========================================================
# CONTRACT
# =========================================================

def get_contract(web3, abi):
    """
    Load the deployed smart contract.
    """

    if not CONTRACT_ADDRESS:
        raise ValueError(
            "BLOCKCHAIN_CONTRACT_ADDRESS is not configured."
        )

    return web3.eth.contract(
        address=Web3.to_checksum_address(
            CONTRACT_ADDRESS
        ),
        abi=abi,
    )


# =========================================================
# SEND CONTRACT TRANSACTION
# =========================================================

def send_contract_transaction(
    web3,
    contract_function,
):
    """
    Sign and send a smart-contract transaction.
    """

    account = get_account(web3)

    nonce = web3.eth.get_transaction_count(
        account.address
    )

    transaction = contract_function.build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "chainId": web3.eth.chain_id,
            "gas": 500000,
        }
    )

    signed_transaction = web3.eth.account.sign_transaction(
        transaction,
        PRIVATE_KEY,
    )

    tx_hash = web3.eth.send_raw_transaction(
        signed_transaction.raw_transaction
    )

    receipt = web3.eth.wait_for_transaction_receipt(
        tx_hash
    )

    return {
        "transaction_hash": tx_hash.hex(),
        "block_number": receipt.blockNumber,
        "status": receipt.status,
        "contract_address": CONTRACT_ADDRESS,
    }


# =========================================================
# BLOCKCHAIN STATUS
# =========================================================

def get_blockchain_status():
    """
    Check whether the configured blockchain is reachable.
    """

    web3 = get_web3()

    return {
        "connected": web3.is_connected(),
        "chain_id": web3.eth.chain_id,
        "latest_block": web3.eth.block_number,
    }


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    try:

        status = get_blockchain_status()

        print("\n=== BLOCKCHAIN CONNECTION ===")
        print(
            "Connected:",
            status["connected"]
        )
        print(
            "Chain ID:",
            status["chain_id"]
        )
        print(
            "Latest Block:",
            status["latest_block"]
        )

    except Exception as error:

        print(
            "\nBlockchain connection error:",
            error
        )