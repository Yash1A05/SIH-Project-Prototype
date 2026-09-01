import { supabase } from "../supabaseClient";


// =====================================================
// ISSUE CARBON CREDITS
// =====================================================

export async function issueCarbonCredits({
  projectId,
  carbonEstimateId,
  creditsTco2e,
}) {
  try {
    // -------------------------------------------------
    // Get logged-in user
    // -------------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("User is not logged in.");
    }


    // -------------------------------------------------
    // Validate input
    // -------------------------------------------------

    if (!projectId) {
      throw new Error("Project ID is required.");
    }

    if (!carbonEstimateId) {
      throw new Error("Carbon estimate ID is required.");
    }

    if (
      creditsTco2e === null ||
      creditsTco2e === undefined ||
      Number(creditsTco2e) <= 0
    ) {
      throw new Error("Valid credit amount is required.");
    }


    // -------------------------------------------------
    // Insert credit
    // -------------------------------------------------

    const { data, error } = await supabase
      .from("carbon_credits")
      .insert({
        project_id: projectId,
        carbon_estimate_id: carbonEstimateId,
        user_id: user.id,
        credits_tco2e: Number(creditsTco2e),
        status: "Issued",
      })
      .select()
      .single();


    // -------------------------------------------------
    // Handle error
    // -------------------------------------------------

    if (error) {

      // Already issued
      if (error.code === "23505") {
        throw new Error(
          "Credits have already been issued for this carbon estimate."
        );
      }

      throw error;
    }


    // -------------------------------------------------
    // Success
    // -------------------------------------------------

    return {
      success: true,
      data,
    };

  } catch (error) {

    console.error(
      "Issue carbon credits error:",
      error
    );

    return {
      success: false,
      error: error.message,
    };
  }
}