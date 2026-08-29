# =========================================================
# BLUE CARBON - CARBON ESTIMATION
# =========================================================

# Default mangrove ecosystem carbon stock
# Source: Global Mangrove Alliance, State of the World's
# Mangroves 2024
DEFAULT_CARBON_STOCK_T_C_PER_HA = 394.0

# Molecular weight conversion:
# 1 tonne C = 44/12 tonnes CO2
CO2_CONVERSION_FACTOR = 44 / 12


def estimate_carbon(
    mangrove_area_hectares,
    carbon_stock_t_c_per_ha=DEFAULT_CARBON_STOCK_T_C_PER_HA
):

    print("\n===================================")
    print("       CARBON ESTIMATION")
    print("===================================")

    # -----------------------------------------------------
    # Validate input
    # -----------------------------------------------------

    if mangrove_area_hectares is None:
        raise ValueError(
            "Mangrove area is required for carbon estimation."
        )

    mangrove_area_hectares = float(
        mangrove_area_hectares
    )

    carbon_stock_t_c_per_ha = float(
        carbon_stock_t_c_per_ha
    )

    if mangrove_area_hectares < 0:
        raise ValueError(
            "Mangrove area cannot be negative."
        )

    if carbon_stock_t_c_per_ha < 0:
        raise ValueError(
            "Carbon stock factor cannot be negative."
        )

    # -----------------------------------------------------
    # Carbon stock calculation
    # -----------------------------------------------------

    estimated_carbon_tonnes = (
        mangrove_area_hectares
        * carbon_stock_t_c_per_ha
    )

    # -----------------------------------------------------
    # Convert carbon → CO2 equivalent
    # -----------------------------------------------------

    estimated_co2e_tonnes = (
        estimated_carbon_tonnes
        * CO2_CONVERSION_FACTOR
    )

    # -----------------------------------------------------
    # Print results
    # -----------------------------------------------------

    print(
        "Mangrove area:",
        round(mangrove_area_hectares, 4),
        "hectares"
    )

    print(
        "Carbon stock factor:",
        carbon_stock_t_c_per_ha,
        "t C/ha"
    )

    print(
        "Estimated carbon stock:",
        round(estimated_carbon_tonnes, 2),
        "t C"
    )

    print(
        "Estimated CO2 equivalent:",
        round(estimated_co2e_tonnes, 2),
        "t CO2e"
    )

    print(
        "⚠️ This is an area-based screening estimate."
    )

    # -----------------------------------------------------
    # Return result
    # -----------------------------------------------------

    return {

        "mangrove_area_hectares":
            float(mangrove_area_hectares),

        "carbon_stock_factor_t_c_per_ha":
            float(carbon_stock_t_c_per_ha),

        "estimated_carbon_tonnes":
            float(estimated_carbon_tonnes),

        "estimated_co2e_tonnes":
            float(estimated_co2e_tonnes),

        "methodology":
            "Area-based mangrove ecosystem carbon stock estimate",

        "carbon_stock_source":
            "Global Mangrove Alliance - State of the World's Mangroves 2024",

        "carbon_stock_scope":
            "Living biomass + carbon in top 1 m of soil",

        "note":
            "Screening estimate; field validation and "
            "site-specific carbon factors are required "
            "for higher-accuracy MRV."
    }