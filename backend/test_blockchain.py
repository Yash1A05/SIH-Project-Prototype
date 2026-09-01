from hash_metadata import create_evidence_hash
from blockchain_registry import register_evidence


# Test project
project_id = "TEST-PROJECT-001"

metadata = {
    "area_hectares": 86.18,
    "ndvi": 0.42,
    "ndwi": -0.11,
    "ndmi": 0.15,
    "carbon_stock": 18970.97,
    "co2e": 69560.22
}


# ---------------------------------------------------------
# 1. Create SHA-256 evidence hash
# ---------------------------------------------------------

hash_hex, hash_bytes32, canonical_metadata = create_evidence_hash(
    project_id,
    metadata
)

print("\nEvidence Hash:")
print(hash_hex)

print("\nbytes32 Hash:")
print(hash_bytes32)


# ---------------------------------------------------------
# 2. Register evidence on blockchain
# ---------------------------------------------------------

result = register_evidence(
    hash_bytes32,
    project_id,
    "local://metadata/TEST-PROJECT-001"
)


# ---------------------------------------------------------
# 3. Print blockchain result
# ---------------------------------------------------------

print("\nBlockchain Registration Result:")
print(result)