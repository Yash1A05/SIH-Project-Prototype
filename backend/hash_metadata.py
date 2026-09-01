import hashlib
import json


def create_evidence_hash(project_id, metadata):
    """
    Creates a deterministic SHA-256 hash from project evidence metadata.

    Returns:
        hash_hex: 64-character hexadecimal SHA-256 hash
        hash_bytes32: bytes32-compatible value for Solidity
        canonical_metadata: deterministic JSON string
    """

    evidence_data = {
        "project_id": str(project_id),
        "metadata": metadata
    }

    # Same data => always same JSON => always same hash
    canonical_metadata = json.dumps(
        evidence_data,
        sort_keys=True,
        separators=(",", ":")
    )

    hash_bytes = hashlib.sha256(
        canonical_metadata.encode("utf-8")
    ).digest()

    hash_hex = hash_bytes.hex()

    # Solidity bytes32
    hash_bytes32 = "0x" + hash_hex

    return hash_hex, hash_bytes32, canonical_metadata