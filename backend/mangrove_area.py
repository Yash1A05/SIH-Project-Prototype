import json
import numpy as np
import tifffile

from pyproj import Geod


# --------------------------------------------------
# 1. Same AOI used for our current test
# --------------------------------------------------

MIN_LON = 73.80
MIN_LAT = 18.48

MAX_LON = 73.90
MAX_LAT = 18.56


# --------------------------------------------------
# 2. Load potential mangrove mask
#
# 1 = potential mangrove
# 0 = not potential mangrove
# --------------------------------------------------

mask_file = "data/potential_mangrove_mask.tif"

mask = tifffile.imread(mask_file)


print("========== MANGROVE AREA CALCULATION ==========")

print("Raster shape:", mask.shape)


# --------------------------------------------------
# 3. Count candidate pixels
# --------------------------------------------------

candidate_pixels = int(np.sum(mask == 1))

total_pixels = mask.size


print("Total raster pixels:", total_pixels)

print("Potential candidate pixels:", candidate_pixels)


# --------------------------------------------------
# 4. Calculate actual geographic AOI area
#
# WGS84 ellipsoid
# --------------------------------------------------

geod = Geod(ellps="WGS84")


polygon_lons = [
    MIN_LON,
    MAX_LON,
    MAX_LON,
    MIN_LON
]

polygon_lats = [
    MIN_LAT,
    MIN_LAT,
    MAX_LAT,
    MAX_LAT
]


area_m2, perimeter = geod.polygon_area_perimeter(
    polygon_lons,
    polygon_lats
)


area_m2 = abs(area_m2)


print(f"\nAOI area: {area_m2:,.2f} m²")


# --------------------------------------------------
# 5. Area per output pixel
# --------------------------------------------------

area_per_pixel = area_m2 / total_pixels


print(
    f"Area per analysis pixel: "
    f"{area_per_pixel:.2f} m²"
)


# --------------------------------------------------
# 6. Potential mangrove area
# --------------------------------------------------

potential_area_m2 = (
    candidate_pixels *
    area_per_pixel
)


potential_area_ha = (
    potential_area_m2 / 10000
)


potential_area_km2 = (
    potential_area_m2 / 1_000_000
)


print("\n========== POTENTIAL MANGROVE AREA ==========")

print(
    f"Potential area: "
    f"{potential_area_m2:,.2f} m²"
)

print(
    f"Potential area: "
    f"{potential_area_ha:.4f} hectares"
)

print(
    f"Potential area: "
    f"{potential_area_km2:.6f} km²"
)


# --------------------------------------------------
# 7. Percentage of AOI
# --------------------------------------------------

area_percentage = (
    potential_area_m2 /
    area_m2
) * 100


print(
    f"\nPotential area percentage: "
    f"{area_percentage:.4f}%"
)


# --------------------------------------------------
# 8. Save results
# --------------------------------------------------

result = {

    "aoi": {
        "min_longitude": MIN_LON,
        "min_latitude": MIN_LAT,
        "max_longitude": MAX_LON,
        "max_latitude": MAX_LAT
    },

    "raster": {
        "width": int(mask.shape[1]),
        "height": int(mask.shape[0]),
        "total_pixels": int(total_pixels)
    },

    "potential_mangrove": {

        "candidate_pixels": candidate_pixels,

        "area_m2": float(
            potential_area_m2
        ),

        "area_hectares": float(
            potential_area_ha
        ),

        "area_km2": float(
            potential_area_km2
        ),

        "percentage_of_aoi": float(
            area_percentage
        )
    },

    "classification_status":
        "potential_screening_only"
}


output_file = "data/mangrove_area.json"


with open(output_file, "w") as file:

    json.dump(
        result,
        file,
        indent=4
    )


print(
    f"\n✅ Area report saved at: "
    f"{output_file}"
)

print(
    "\n⚠️ This is POTENTIAL mangrove area, "
    "not confirmed mangrove area."
)