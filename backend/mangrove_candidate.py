import os
import numpy as np
import rasterio


# =========================================================
# POTENTIAL MANGROVE SCREENING
# =========================================================

def screen_mangroves(index_file):

    print("\n===================================")
    print("      POTENTIAL MANGROVE SCREENING")
    print("===================================")

    # -----------------------------------------------------
    # OPEN INDEX RASTER
    # -----------------------------------------------------

    with rasterio.open(index_file) as src:

        data = src.read()

        profile = src.profile.copy()

        transform = src.transform

        crs = src.crs

        bounds = src.bounds

        print("Raster loaded successfully.")
        print("Raster shape:", data.shape)
        print("Raster CRS:", crs)

        # -------------------------------------------------
        # Check CRS
        # -------------------------------------------------

        if crs is None:
            raise ValueError(
                "Index raster does not have a CRS."
            )

        if not crs.is_projected:
            raise ValueError(
                f"Index raster must use a projected "
                f"meter-based CRS. Current CRS: {crs}"
            )

    # -----------------------------------------------------
    # READ BANDS
    # -----------------------------------------------------

    ndvi = data[0]
    ndwi = data[1]
    ndmi = data[2]
    data_mask = data[3]

    # -----------------------------------------------------
    # VALID PIXELS
    # -----------------------------------------------------

    valid = (
        (data_mask > 0)
        & np.isfinite(ndvi)
        & np.isfinite(ndwi)
        & np.isfinite(ndmi)
        & (ndvi != -9999)
        & (ndwi != -9999)
        & (ndmi != -9999)
    )

    valid_pixel_count = int(
        np.sum(valid)
    )

    print(
        "\nValid pixels:",
        valid_pixel_count
    )

    if valid_pixel_count == 0:

        raise ValueError(
            "No valid pixels found for mangrove screening."
        )

    # =====================================================
    # SCREENING LEVELS
    # =====================================================

    # -----------------------------------------------------
    # POTENTIAL
    # -----------------------------------------------------
    #
    # More inclusive screening.
    # Used to identify pixels that show vegetation,
    # moisture and wetland-like spectral characteristics.
    # -----------------------------------------------------

    POTENTIAL_NDVI = 0.25
    POTENTIAL_NDWI = -0.55
    POTENTIAL_NDMI = -0.05

    # -----------------------------------------------------
    # MODERATE
    # -----------------------------------------------------

    MODERATE_NDVI = 0.30
    MODERATE_NDWI = -0.50
    MODERATE_NDMI = 0.00

    # -----------------------------------------------------
    # HIGH CONFIDENCE
    # -----------------------------------------------------
    #
    # Strict screening rule.
    # -----------------------------------------------------

    HIGH_NDVI = 0.30
    HIGH_NDWI = -0.40
    HIGH_NDMI = 0.10

    print("\n===================================")
    print("       SCREENING THRESHOLDS")
    print("===================================")

    print("\nPotential:")
    print("NDVI >=", POTENTIAL_NDVI)
    print("NDWI >=", POTENTIAL_NDWI)
    print("NDMI >=", POTENTIAL_NDMI)

    print("\nModerate:")
    print("NDVI >=", MODERATE_NDVI)
    print("NDWI >=", MODERATE_NDWI)
    print("NDMI >=", MODERATE_NDMI)

    print("\nHigh:")
    print("NDVI >=", HIGH_NDVI)
    print("NDWI >=", HIGH_NDWI)
    print("NDMI >=", HIGH_NDMI)

    # =====================================================
    # POTENTIAL MANGROVE
    # =====================================================

    potential_mask = (
        valid
        & (ndvi >= POTENTIAL_NDVI)
        & (ndwi >= POTENTIAL_NDWI)
        & (ndmi >= POTENTIAL_NDMI)
    )

    potential_pixels = int(
        np.sum(potential_mask)
    )

    # =====================================================
    # MODERATE MANGROVE
    # =====================================================

    moderate_mask = (
        valid
        & (ndvi >= MODERATE_NDVI)
        & (ndwi >= MODERATE_NDWI)
        & (ndmi >= MODERATE_NDMI)
    )

    moderate_pixels = int(
        np.sum(moderate_mask)
    )

    # =====================================================
    # HIGH CONFIDENCE
    # =====================================================

    high_mask = (
        valid
        & (ndvi >= HIGH_NDVI)
        & (ndwi >= HIGH_NDWI)
        & (ndmi >= HIGH_NDMI)
    )

    high_pixels = int(
        np.sum(high_mask)
    )

    # =====================================================
    # PERCENTAGES
    # =====================================================

    potential_percentage = (
        potential_pixels /
        valid_pixel_count
    ) * 100

    moderate_percentage = (
        moderate_pixels /
        valid_pixel_count
    ) * 100

    high_percentage = (
        high_pixels /
        valid_pixel_count
    ) * 100

    # =====================================================
    # PRINT SCREENING RESULTS
    # =====================================================

    print("\n===================================")
    print("       SCREENING RESULTS")
    print("===================================")

    print(
        "\nPotential mangrove pixels:",
        potential_pixels
    )

    print(
        "Potential mangrove percentage:",
        round(potential_percentage, 4),
        "%"
    )

    print(
        "\nModerate mangrove pixels:",
        moderate_pixels
    )

    print(
        "Moderate mangrove percentage:",
        round(moderate_percentage, 4),
        "%"
    )

    print(
        "\nHigh-confidence mangrove pixels:",
        high_pixels
    )

    print(
        "High-confidence mangrove percentage:",
        round(high_percentage, 4),
        "%"
    )

    # =====================================================
    # INDEX VALUE RANGES
    # =====================================================

    ndvi_valid = ndvi[valid]
    ndwi_valid = ndwi[valid]
    ndmi_valid = ndmi[valid]

    print("\n===================================")
    print("       INDEX VALUE RANGES")
    print("===================================")

    print(
        "NDVI:",
        round(float(np.min(ndvi_valid)), 4),
        "to",
        round(float(np.max(ndvi_valid)), 4)
    )

    print(
        "NDWI:",
        round(float(np.min(ndwi_valid)), 4),
        "to",
        round(float(np.max(ndwi_valid)), 4)
    )

    print(
        "NDMI:",
        round(float(np.min(ndmi_valid)), 4),
        "to",
        round(float(np.max(ndmi_valid)), 4)
    )

    # =====================================================
    # AREA CALCULATION
    # =====================================================
    #
    # IMPORTANT:
    #
    # The index raster is now generated in a projected
    # UTM CRS (EPSG:32643).
    #
    # Therefore raster resolution is in METERS.
    #
    # We do NOT use Geod or latitude/longitude here.
    #
    # Pixel area is calculated directly from the raster
    # transform.
    # =====================================================

    print("\n===================================")
    print("       AREA CALCULATION")
    print("===================================")

    # -----------------------------------------------------
    # Pixel dimensions
    # -----------------------------------------------------

    pixel_width = abs(transform.a)
    pixel_height = abs(transform.e)

    print(
        "Pixel width:",
        round(pixel_width, 4),
        "m"
    )

    print(
        "Pixel height:",
        round(pixel_height, 4),
        "m"
    )

    # -----------------------------------------------------
    # Pixel area
    #
    # Determinant of the affine transform is used so that
    # rotated rasters are also handled correctly.
    # -----------------------------------------------------

    pixel_area_m2 = abs(
        (
            transform.a * transform.e
        )
        -
        (
            transform.b * transform.d
        )
    )

    print(
        "Pixel area:",
        round(pixel_area_m2, 4),
        "m²"
    )

    # -----------------------------------------------------
    # Potential mangrove area
    # -----------------------------------------------------

    potential_area_m2 = (
        potential_pixels *
        pixel_area_m2
    )

    # -----------------------------------------------------
    # Convert m² → hectares
    # -----------------------------------------------------

    potential_area_hectares = (
        potential_area_m2 /
        10000
    )

    # -----------------------------------------------------
    # Convert m² → km²
    # -----------------------------------------------------

    potential_area_km2 = (
        potential_area_m2 /
        1_000_000
    )

    # =====================================================
    # PRINT AREA RESULTS
    # =====================================================

    print(
        "\nPotential mangrove pixels:",
        potential_pixels
    )

    print(
        "Potential mangrove area:",
        round(potential_area_m2, 2),
        "m²"
    )

    print(
        "Potential mangrove area:",
        round(potential_area_hectares, 4),
        "hectares"
    )

    print(
        "Potential mangrove area:",
        round(potential_area_km2, 6),
        "km²"
    )

    # =====================================================
    # CREATE POTENTIAL MANGROVE MASK
    # =====================================================

    mask_output = np.where(
        potential_mask,
        1,
        0
    ).astype(np.uint8)

    # -----------------------------------------------------
    # SAVE MASK
    # -----------------------------------------------------

    os.makedirs(
        "data",
        exist_ok=True
    )

    mask_file = (
        "data/potential_mangrove_mask.tif"
    )

    # -----------------------------------------------------
    # Update raster profile
    # -----------------------------------------------------

    profile.update(
        dtype=rasterio.uint8,
        count=1,
        nodata=0
    )

    # -----------------------------------------------------
    # Save GeoTIFF
    # -----------------------------------------------------

    with rasterio.open(
        mask_file,
        "w",
        **profile
    ) as dst:

        dst.write(
            mask_output,
            1
        )

    print(
        "\n✅ Potential mangrove mask saved:",
        mask_file
    )

    # =====================================================
    # FINAL RESULT
    # =====================================================

    result = {

        "potential_mangrove_pixels":
            potential_pixels,

        "moderate_mangrove_pixels":
            moderate_pixels,

        "high_confidence_mangrove_pixels":
            high_pixels,

        "valid_pixels":
            valid_pixel_count,

        "potential_mangrove_percentage":
            float(potential_percentage),

        "moderate_mangrove_percentage":
            float(moderate_percentage),

        "high_confidence_mangrove_percentage":
            float(high_percentage),

        "potential_mangrove_area_m2":
            float(potential_area_m2),

        "potential_mangrove_area_hectares":
            float(potential_area_hectares),

        "potential_mangrove_area_km2":
            float(potential_area_km2),

        "pixel_area_m2":
            float(pixel_area_m2),

        "pixel_width_m":
            float(pixel_width),

        "pixel_height_m":
            float(pixel_height),

        "crs":
            str(crs),

        "thresholds": {

            "potential": {

                "ndvi_min":
                    POTENTIAL_NDVI,

                "ndwi_min":
                    POTENTIAL_NDWI,

                "ndmi_min":
                    POTENTIAL_NDMI
            },

            "moderate": {

                "ndvi_min":
                    MODERATE_NDVI,

                "ndwi_min":
                    MODERATE_NDWI,

                "ndmi_min":
                    MODERATE_NDMI
            },

            "high": {

                "ndvi_min":
                    HIGH_NDVI,

                "ndwi_min":
                    HIGH_NDWI,

                "ndmi_min":
                    HIGH_NDMI
            }
        },

        "mask_file":
            mask_file
    }

    return result