import requests

STAC_URL = "https://stac.dataspace.copernicus.eu/v1/search"

search_data = {
    "collections": ["sentinel-2-l2a"],

    "datetime": "2025-08-01T00:00:00Z/2025-08-31T23:59:59Z",

    "intersects": {
        "type": "Point",
        "coordinates": [73.8567, 18.5204]
    },

    "query": {
        "eo:cloud_cover": {
            "lte": 80
        }
    },

    "limit": 10,

    "sortby": [
        {
            "field": "properties.eo:cloud_cover",
            "direction": "asc"
        }
    ]
}

response = requests.post(
    STAC_URL,
    json=search_data
)

print("Status:", response.status_code)

if response.status_code == 200:

    data = response.json()
    products = data.get("features", [])

    print(f"\nFound {len(products)} Sentinel-2 products.\n")

    for i, product in enumerate(products, start=1):

        properties = product.get("properties", {})

        print(f"--- Product {i} ---")
        print("ID:", product.get("id"))
        print("Date:", properties.get("datetime"))
        print("Cloud cover:", properties.get("eo:cloud_cover"))
        print()

else:

    print("❌ Search failed!")
    print(response.text)