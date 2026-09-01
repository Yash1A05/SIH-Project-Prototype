import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function StatusBadge({ status }) {
  const styles = {
    Verified: {
      bg: "var(--badge-verified)",
      color: "var(--badge-verified-text)",
    },

    "Under Verification": {
      bg: "var(--badge-unverified)",
      color: "var(--badge-unverified-text)",
    },

    "In Progress": {
      bg: "var(--badge-progress)",
      color: "var(--badge-progress-text)",
    },

    Rejected: {
      bg: "var(--badge-rejected)",
      color: "var(--badge-rejected-text)",
    },
  };

  const s = styles[status] || {
    bg: "gray",
    color: "white",
  };

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 20,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

/* =====================================================
   PROJECT IMAGES
===================================================== */

const projectImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=200&q=80",
];

/* =====================================================
   STATUS
===================================================== */

function getProjectStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (value === "completed" || value === "verified") {
    return "Verified";
  }

  if (value === "under verification") {
    return "Under Verification";
  }

  if (value === "in progress") {
    return "In Progress";
  }

  if (value === "rejected") {
    return "Rejected";
  }

  return status || "In Progress";
}

/* =====================================================
   ECOSYSTEM
===================================================== */

function getEcosystem(project, analysis) {
  const text = `
    ${project?.project_name || ""}
    ${project?.description || ""}
  `.toLowerCase();

  /* ---------------------------------------------
     First: explicit project information
  --------------------------------------------- */

  if (text.includes("seagrass") || text.includes("sea grass")) {
    return "Seagrass";
  }

  if (text.includes("mangrove") || text.includes("mangroves")) {
    return "Mangrove";
  }

  if (
    text.includes("salt marsh") ||
    text.includes("saltmarsh") ||
    text.includes("coastal wetland")
  ) {
    return "Coastal Wetland";
  }

  /* ---------------------------------------------
     Second: analysis_results

     Your MRV analysis already contains mangrove
     screening information.
  --------------------------------------------- */

  if (analysis) {
    const mangrovePercentage = Number(
      analysis.mangrove_percentage
    );

    const mangroveArea = Number(
      analysis.mangrove_area_hectares ??
        analysis.mangrove_area_m2
    );

    if (
      Number.isFinite(mangrovePercentage) &&
      mangrovePercentage > 0
    ) {
      return "Mangrove";
    }

    if (
      Number.isFinite(mangroveArea) &&
      mangroveArea > 0
    ) {
      return "Mangrove";
    }
  }

  /*
     Don't falsely call an unknown project Mangrove
     or Seagrass.
  */
  return "Blue Carbon";
}

/* =====================================================
   AREA
===================================================== */

function getProjectArea(aoi) {
  if (!aoi) {
    return "—";
  }

  const value =
    aoi.area_hectares ??
    aoi.area_ha ??
    aoi.area;

  const area = Number(value);

  if (!Number.isFinite(area)) {
    return "—";
  }

  return `${area.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} ha`;
}

/* =====================================================
   LOCATION PARSER
===================================================== */

function parseLocation(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) {
      return null;
    }

    if (
      text.startsWith("{") ||
      text.startsWith("[")
    ) {
      try {
        return parseLocation(JSON.parse(text));
      } catch {
        return text;
      }
    }

    return text;
  }

  if (typeof value === "object") {
    return (
      value.display_name ||
      value.name ||
      value.city ||
      value.town ||
      value.village ||
      value.district ||
      value.state ||
      value.location ||
      null
    );
  }

  return null;
}

/* =====================================================
   POLYGON COORDINATES
===================================================== */

function extractCoordinates(value) {
  if (!value) {
    return [];
  }

  let data = value;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  /* GeoJSON Feature */
  if (data?.type === "Feature") {
    data = data.geometry;
  }

  /* GeoJSON Polygon */
  if (
    data?.type === "Polygon" &&
    Array.isArray(data.coordinates)
  ) {
    return data.coordinates[0] || [];
  }

  /* GeoJSON MultiPolygon */
  if (
    data?.type === "MultiPolygon" &&
    Array.isArray(data.coordinates)
  ) {
    return data.coordinates?.[0]?.[0] || [];
  }

  /* ---------------------------------------------
     YOUR DATABASE FORMAT

     [
       { lat: 18.8042, lng: 72.9646 },
       ...
     ]
  --------------------------------------------- */

  if (Array.isArray(data)) {
    const latLngPoints = data
      .filter(
        (point) =>
          point &&
          typeof point === "object" &&
          Number.isFinite(Number(point.lat)) &&
          Number.isFinite(Number(point.lng))
      )
      .map((point) => [
        Number(point.lng),
        Number(point.lat),
      ]);

    if (latLngPoints.length > 0) {
      return latLngPoints;
    }

    /* Normal GeoJSON coordinate array */
    if (
      Array.isArray(data[0]) &&
      typeof data[0][0] === "number"
    ) {
      return data;
    }

    /* Nested coordinate array */
    if (
      Array.isArray(data[0]) &&
      Array.isArray(data[0][0])
    ) {
      return data[0];
    }
  }

  return [];
}

/* =====================================================
   GET CENTER OF POLYGON
===================================================== */

function getPolygonCenter(polygon) {
  const coordinates = extractCoordinates(polygon);

  if (!coordinates.length) {
    return null;
  }

  let lngTotal = 0;
  let latTotal = 0;
  let count = 0;

  coordinates.forEach((point) => {
    if (
      Array.isArray(point) &&
      point.length >= 2 &&
      Number.isFinite(Number(point[0])) &&
      Number.isFinite(Number(point[1]))
    ) {
      lngTotal += Number(point[0]);
      latTotal += Number(point[1]);
      count++;
    }
  });

  if (!count) {
    return null;
  }

  return {
    lat: latTotal / count,
    lng: lngTotal / count,
  };
}

/* =====================================================
   REVERSE GEOCODE
===================================================== */

async function reverseGeocode(lat, lng) {
  /*
   * Primary: BigDataCloud
   * - browser friendly
   * - no API key required for this client-side endpoint
   *
   * Fallback: OpenStreetMap Nominatim
   */
  const services = [
    async () => {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
          lat
        )}&longitude=${encodeURIComponent(
          lng
        )}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error(
          `BigDataCloud HTTP ${response.status}`
        );
      }

      const data = await response.json();

      const city =
        data?.city ||
        data?.locality ||
        data?.principalSubdivision;

      const state =
        data?.principalSubdivision;

      if (city && state && city !== state) {
        return `${city}, ${state}`;
      }

      return (
        city ||
        state ||
        data?.localityInfo?.administrative?.[0]?.name ||
        null
      );
    },

    async () => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          lat
        )}&lon=${encodeURIComponent(
          lng
        )}&zoom=10&addressdetails=1`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Nominatim HTTP ${response.status}`
        );
      }

      const data = await response.json();
      const address = data?.address || {};

      const place =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        address.district;

      const state =
        address.state ||
        address.state_district;

      if (place && state) {
        return `${place}, ${state}`;
      }

      return (
        place ||
        state ||
        data?.display_name ||
        null
      );
    },
  ];

  for (const service of services) {
    try {
      const result = await service();

      if (result) {
        return result;
      }
    } catch (error) {
      console.warn(
        "Reverse geocoding service failed:",
        error
      );
    }
  }

  return null;
}

/* =====================================================
   LOCATION CACHE
   Keeps a successfully resolved location so it does not
   disappear after a re-render / page navigation.
===================================================== */

function getCachedProjectLocation(projectId) {
  if (!projectId) return null;

  try {
    const cache = JSON.parse(
      localStorage.getItem("blueCarbonProjectLocations") ||
        "{}"
    );

    return cache[projectId] || null;
  } catch {
    return null;
  }
}

function cacheProjectLocation(projectId, location) {
  if (!projectId || !location) return;

  try {
    const cache = JSON.parse(
      localStorage.getItem("blueCarbonProjectLocations") ||
        "{}"
    );

    cache[projectId] = location;

    localStorage.setItem(
      "blueCarbonProjectLocations",
      JSON.stringify(cache)
    );
  } catch (error) {
    console.warn(
      "Could not cache project location:",
      error
    );
  }
}

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function RecentProjects({ onViewAll }) {
  const [projects, setProjects] = useState([]);

  const [aoiRecords, setAoiRecords] = useState([]);

  const [analysisResults, setAnalysisResults] =
    useState([]);

  const [resolvedLocations, setResolvedLocations] =
    useState({});

  const [loading, setLoading] = useState(true);

  /* ===================================================
     FETCH DATA
  =================================================== */

  useEffect(() => {
    let mounted = true;

    const fetchProjects = async () => {
      try {
        setLoading(true);

        /* ---------------------------------------------
           USER
        --------------------------------------------- */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "User error:",
            userError
          );
          return;
        }

        if (!user) {
          console.error(
            "No logged-in user."
          );
          return;
        }

        /* ---------------------------------------------
           PROJECTS
        --------------------------------------------- */

        const {
          data: projectData,
          error: projectError,
        } = await supabase
          .from("projects")
          .select(`
            id,
            project_name,
            description,
            location,
            status,
            created_at
          `)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (projectError) {
          console.error(
            "Project fetch error:",
            projectError
          );
          return;
        }

        /* ---------------------------------------------
           AOI
        --------------------------------------------- */

        const {
          data: aoiData,
          error: aoiError,
        } = await supabase
          .from("aoi_records")
          .select(`
            id,
            project_id,
            polygon,
            location,
            area_hectares
          `)
          .eq("user_id", user.id);

        if (aoiError) {
          console.error(
            "AOI fetch error:",
            aoiError
          );
          return;
        }

        /* ---------------------------------------------
           ANALYSIS RESULTS

           Used to identify Mangrove projects
           from actual MRV analysis.
        --------------------------------------------- */

        const {
          data: analysisData,
          error: analysisError,
        } = await supabase
          .from("analysis_results")
          .select(`
            id,
            project_id,
            mangrove_percentage,
            mangrove_pixels,
            mangrove_area_m2,
            mangrove_area_hectares,
            ndvi_passed,
            ndwi_passed,
            ndmi_passed,
            all_three_passed
          `)
          .eq("user_id", user.id);

        if (analysisError) {
          /*
             Analysis table may not contain user_id
             in some database versions.

             Don't break Recent Projects if this
             optional query fails.
          */
          console.warn(
            "Analysis results fetch warning:",
            analysisError
          );
        }

        if (!mounted) {
          return;
        }

        setProjects(projectData || []);
        setAoiRecords(aoiData || []);
        setAnalysisResults(
          analysisData || []
        );

        console.log(
          "Recent Projects live:",
          projectData
        );

        console.log(
          "AOI records:",
          aoiData
        );

        console.log(
          "Analysis results:",
          analysisData
        );
      } catch (error) {
        console.error(
          "Recent Projects error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, []);

  /* ===================================================
     AOI LOOKUP
  =================================================== */

  const aoiByProject = useMemo(() => {
    const map = new Map();

    aoiRecords.forEach((aoi) => {
      if (!map.has(aoi.project_id)) {
        map.set(aoi.project_id, aoi);
      }
    });

    return map;
  }, [aoiRecords]);

  /* ===================================================
     ANALYSIS LOOKUP
  =================================================== */

  const analysisByProject = useMemo(() => {
    const map = new Map();

    analysisResults.forEach((analysis) => {
      if (!map.has(analysis.project_id)) {
        map.set(
          analysis.project_id,
          analysis
        );
      }
    });

    return map;
  }, [analysisResults]);

  /* ===================================================
     RESOLVE MISSING LOCATIONS
  =================================================== */

  useEffect(() => {
    if (!projects.length) {
      return;
    }

    let cancelled = false;

    const resolveLocations = async () => {
      const newLocations = {};

      /*
       * Resolve the same latest 5 projects shown here.
       */
      const projectsToResolve = [...projects]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
        )
        .slice(0, 5);

      for (
        let index = 0;
        index < projectsToResolve.length;
        index++
      ) {
        if (cancelled) return;

        const project =
          projectsToResolve[index];

        const aoi =
          aoiByProject.get(project.id);

        /*
         * 0. Previously resolved browser location
         */
        let location =
          getCachedProjectLocation(project.id);

        /*
         * 1. projects.location
         */
        if (!location) {
          location = parseLocation(
            project.location
          );
        }

        /*
         * 2. aoi_records.location
         */
        if (!location && aoi) {
          location = parseLocation(
            aoi.location
          );
        }

        /*
         * 3. AOI polygon -> center -> reverse geocode
         */
        if (!location && aoi?.polygon) {
          const center =
            getPolygonCenter(
              aoi.polygon
            );

          if (center) {
            console.log(
              "Resolving project location:",
              project.project_name,
              center
            );

            /*
             * Keep public geocoder requests apart.
             */
            if (index > 0) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1100)
              );
            }

            if (cancelled) return;

            const resolved =
              await reverseGeocode(
                center.lat,
                center.lng
              );

            if (resolved) {
              location = resolved;

              /*
               * Save successful result so it remains
               * available on future renders/pages.
               */
              cacheProjectLocation(
                project.id,
                resolved
              );
            }
          }
        }

        if (location) {
          newLocations[project.id] =
            location;
        }
      }

      if (!cancelled) {
        setResolvedLocations(
          (previous) => ({
            ...previous,
            ...newLocations,
          })
        );
      }
    };

    resolveLocations();

    return () => {
      cancelled = true;
    };
  }, [projects, aoiByProject]);
  /* ===================================================
     LATEST 5
  =================================================== */

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort(
        (a, b) =>
          new Date(
            b.created_at || 0
          ) -
          new Date(
            a.created_at || 0
          )
      )
      .slice(0, 5);
  }, [projects]);

  /* ===================================================
     VIEW ALL
  =================================================== */

  const handleViewAll = () => {
  onViewAll?.();
};

  /* ===================================================
     UI
  =================================================== */

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      {/* Header */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Recent Projects
        </span>

        <button
          onClick={handleViewAll}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--accent-cyan)",
            fontSize: 12,
          }}
        >
          View All
        </button>
      </div>

      {/* Loading */}

      {loading && (
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 10,
          }}
        >
          Loading projects...
        </div>
      )}

      {/* PROJECTS */}

      {!loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {recentProjects.map(
            (project, index) => {
              const aoi =
                aoiByProject.get(
                  project.id
                );

              const analysis =
                analysisByProject.get(
                  project.id
                );

              const status =
                getProjectStatus(
                  project.status
                );

              const ecosystem =
                getEcosystem(
                  project,
                  analysis
                );

              const area =
                getProjectArea(aoi);

              /* -----------------------------------------
                 LOCATION

                 Priority:
                 1. projects.location
                 2. aoi_records.location
                 3. polygon reverse geocoding
              ----------------------------------------- */

              const directLocation =
                parseLocation(
                  project.location
                ) ||
                parseLocation(
                  aoi?.location
                );

              const location =
                directLocation ||
                resolvedLocations[
                  project.id
                ] ||
                getCachedProjectLocation(
                  project.id
                ) ||
                "Location not available";

              return (
                <div
                  key={project.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {/* PROJECT IMAGE */}

                  <img
                    src={
                      projectImages[
                        index % projectImages.length
                      ]
                    }
                    alt={ecosystem}
                    style={{
                      width: 44,
                      height: 34,
                      borderRadius: 6,
                      objectFit: "cover",
                      flexShrink: 0,
                      background:
                        "#1a2e44",
                    }}
                  />

                  {/* PROJECT INFORMATION */}

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        color:
                          "var(--text-primary)",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                      title={
                        project.project_name
                      }
                    >
                      {
                        project.project_name
                      }
                    </div>

                    <div
                      style={{
                        color:
                          "var(--text-muted)",
                        fontSize: 10,
                      }}
                    >
                      {location} • {area} •{" "}
                      {ecosystem}
                    </div>
                  </div>

                  {/* STATUS */}

                  <StatusBadge
                    status={status}
                  />
                </div>
              );
            }
          )}
        </div>
      )}

      {/* NO PROJECTS */}

      {!loading &&
        recentProjects.length === 0 && (
          <div
            style={{
              color:
                "var(--text-muted)",
              fontSize: 10,
            }}
          >
            No projects found.
          </div>
        )}
    </div>
  );
}