import os
import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("COPERNICUS_CLIENT_ID")
CLIENT_SECRET = os.getenv("COPERNICUS_CLIENT_SECRET")

print("Client ID loaded:", bool(CLIENT_ID))
print("Client Secret loaded:", bool(CLIENT_SECRET))

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"


def get_access_token():
    data = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }

    response = requests.post(TOKEN_URL, data=data)

    if response.status_code == 200:
        return response.json()["access_token"]

    print("Authentication failed!")
    print("Status:", response.status_code)
    print(response.text)

    return None


if __name__ == "__main__":
    token = get_access_token()

    if token:
        print("✅ Copernicus authentication successful!")
        print("✅ Access token received.")
    else:
        print("❌ Could not get access token.")