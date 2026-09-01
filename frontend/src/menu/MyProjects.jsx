import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

/* =========================================================
   ICONS
========================================================= */

function Icon({ type, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "leaf") {
    return (
      <svg {...common}>
        <path d="M20 4C11 4 5 8 5 14c0 3.3 2.7 6 6 6 6 0 9-6 9-16Z" />
        <path d="M4 20c3-4 6-7 12-10" />
      </svg>
    );
  }

  if (type === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (type === "location") {
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (type === "area") {
    return (
      <svg {...common}>
        <path d="M5 3H3v2M19 3h2v2M5 21H3v-2M19 21h2v-2" />
        <path d="M7 7h10v10H7z" />
      </svg>
    );
  }

  if (type === "carbon") {
    return (
      <svg {...common}>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      </svg>
    );
  }

  if (type === "cloud") {
    return (
      <svg {...common}>
        <path d="M17.5 19H8a5 5 0 1 1 1.1-9.88A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8Z" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 9h18" />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  if (type === "chevron") {
    return (
      <svg {...common}>
        <path d="m8 10 4 4 4-4" />
      </svg>
    );
  }

  if (type === "grid") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    );
  }

  if (type === "list") {
    return (
      <svg {...common}>
        <path d="M8 6h12M8 12h12M8 18h12" />
        <circle cx="4" cy="6" r="1" fill="currentColor" />
        <circle cx="4" cy="12" r="1" fill="currentColor" />
        <circle cx="4" cy="18" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (type === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (type === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (type === "more") {
    return (
      <svg {...common}>
        <circle cx="12" cy="5" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (type === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  if (type === "refresh") {
    return (
      <svg {...common}>
        <path d="M20 11a8 8 0 0 0-14.7-4L4 9" />
        <path d="M4 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.7 4L20 15" />
        <path d="M20 20v-5h-5" />
      </svg>
    );
  }

  return null;
}

/* =========================================================
   STATUS
========================================================= */

function getStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "completed" || value === "verified") {
    return {
      label: "Verified",
      className: "verified",
    };
  }

  if (value === "under verification") {
    return {
      label: "Under Verification",
      className: "verification",
    };
  }

  if (value === "in progress") {
    return {
      label: "In Progress",
      className: "progress",
    };
  }

  if (value === "rejected") {
    return {
      label: "Rejected",
      className: "rejected",
    };
  }

  return {
    label: status || "Unknown",
    className: "unknown",
  };
}

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value, decimals = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
  });
}

function formatIndex(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return number.toFixed(4);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   PROJECT IMAGES
========================================================= */

const projectImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
];


/* =========================================================
   LOCATION HELPERS
   Priority:
   1. projects.location
   2. aoi_records.location
   3. AOI polygon center -> reverse geocoding
========================================================= */

function parseLocation(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) return null;

    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        return parseLocation(JSON.parse(text));
      } catch {
        return null;
      }
    }

    const invalidLocations = [
      "location unavailable",
      "location not available",
      "location lookup unavailable",
      "location could not be determined",
      "unable to determine location",
      "null",
      "undefined",
    ];

    if (invalidLocations.includes(text.toLowerCase())) {
      return null;
    }

    return text;
  }

  if (typeof value === "object") {
    return (
      parseLocation(value.display_name) ||
      parseLocation(value.name) ||
      parseLocation(value.city) ||
      parseLocation(value.town) ||
      parseLocation(value.village) ||
      parseLocation(value.municipality) ||
      parseLocation(value.district) ||
      parseLocation(value.state) ||
      parseLocation(value.location)
    );
  }

  return null;
}

/*
 * Get location from analysis_results.analysis_data.
 * analysis_data can be either a JSON object or a JSON string.
 * We support the location formats returned by Flask/Nominatim.
 */
function getAnalysisLocation(analysisData) {
  if (!analysisData) return null;

  let data = analysisData;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return parseLocation(data);
    }
  }

  if (!data || typeof data !== "object") return null;

  return (
    parseLocation(data.aoi_location) ||
    parseLocation(data.location) ||
    parseLocation(data.address) ||
    parseLocation(data.display_name)
  );
}

function extractCoordinates(value) {
  if (!value) return [];

  let data = value;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  // GeoJSON Feature
  if (data?.type === "Feature") {
    data = data.geometry;
  }

  // GeoJSON Polygon
  if (
    data?.type === "Polygon" &&
    Array.isArray(data.coordinates)
  ) {
    return data.coordinates[0] || [];
  }

  // GeoJSON MultiPolygon
  if (
    data?.type === "MultiPolygon" &&
    Array.isArray(data.coordinates)
  ) {
    return data.coordinates?.[0]?.[0] || [];
  }

  // Database format: [{ lat, lng }, ...]
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

    // Normal GeoJSON coordinate array
    if (
      Array.isArray(data[0]) &&
      typeof data[0][0] === "number"
    ) {
      return data;
    }

    // Nested coordinate array
    if (
      Array.isArray(data[0]) &&
      Array.isArray(data[0][0])
    ) {
      return data[0];
    }
  }

  return [];
}

function getPolygonCenter(polygon) {
  const coordinates = extractCoordinates(polygon);

  if (!coordinates.length) return null;

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

  if (!count) return null;

  return {
    lat: latTotal / count,
    lng: lngTotal / count,
  };
}

async function reverseGeocode(lat, lng) {
  try {
    if (
      !Number.isFinite(Number(lat)) ||
      !Number.isFinite(Number(lng))
    ) {
      return null;
    }

    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      `&zoom=10` +
      `&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        "Reverse geocoding HTTP error:",
        response.status
      );
      return null;
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

    const state = address.state;

    if (place && state) {
      return `${place}, ${state}`;
    }

    if (place) return place;
    if (state) return state;

    return parseLocation(data?.display_name);
  } catch (error) {
    console.warn("Reverse geocoding failed:", error);
    return null;
  }
}

/* =========================================================
   MAIN
========================================================= */

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [aoiRecords, setAoiRecords] = useState([]);
  const [analysisRecords, setAnalysisRecords] = useState([]);
  const [carbonRecords, setCarbonRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [resolvedLocations, setResolvedLocations] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [viewMode, setViewMode] = useState("grid");
  const [selectedProject, setSelectedProject] = useState(null);

  /* =======================================================
     FETCH EVERYTHING FROM SUPABASE
  ======================================================= */

  const fetchProjects = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setProjects([]);
        setAoiRecords([]);
        setAnalysisRecords([]);
        setCarbonRecords([]);
        return;
      }

      /* ---------------------------------------------------
         PROJECTS
      --------------------------------------------------- */

      const { data: projectData, error: projectError } =
        await supabase
          .from("projects")
          .select(
            `
              id,
              project_name,
              description,
              location,
              status,
              created_at,
              updated_at
            `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (projectError) throw projectError;

      const projectIds = (projectData || []).map(
        (project) => project.id
      );

      /* ---------------------------------------------------
         AOI
      --------------------------------------------------- */

      let aoiData = [];

      if (projectIds.length > 0) {
        const { data, error: aoiError } = await supabase
          .from("aoi_records")
          .select(
            `
              id,
              project_id,
              location,
              area_m2,
              area_hectares,
              polygon,
              created_at
            `
          )
          .eq("user_id", user.id)
          .in("project_id", projectIds);

        if (aoiError) {
          console.warn("AOI fetch warning:", aoiError);
        } else {
          aoiData = data || [];
        }
      }

      /* ---------------------------------------------------
         ANALYSIS RESULTS
      --------------------------------------------------- */

      let analysisData = [];

      if (projectIds.length > 0) {
        const { data, error: analysisError } =
          await supabase
            .from("analysis_results")
            .select(
              `
                id,
                project_id,
                aoi_id,
                ndvi_mean,
                ndvi_min,
                ndvi_max,
                ndwi_mean,
                ndwi_min,
                ndwi_max,
                ndmi_mean,
                ndmi_min,
                ndmi_max,
                mangrove_percentage,
                mangrove_area_hectares,
                analysis_data,
                created_at
              `
            )
            .eq("user_id", user.id)
            .in("project_id", projectIds)
            .order("created_at", { ascending: false });

        if (analysisError) {
          console.warn(
            "Analysis results fetch warning:",
            analysisError
          );
        } else {
          analysisData = data || [];
        }
      }

      /* ---------------------------------------------------
         CARBON ESTIMATES
      --------------------------------------------------- */

      let carbonData = [];

      if (projectIds.length > 0) {
        const { data, error: carbonError } =
          await supabase
            .from("carbon_estimates")
            .select(
              `
                id,
                project_id,
                analysis_id,
                area_hectares,
                estimated_carbon_tonnes,
                estimated_co2e_tonnes,
                carbon_stock_factor,
                methodology,
                created_at
              `
            )
            .eq("user_id", user.id)
            .in("project_id", projectIds)
            .order("created_at", { ascending: false });

        if (carbonError) {
          console.warn(
            "Carbon estimates fetch warning:",
            carbonError
          );
        } else {
          carbonData = data || [];
        }
      }

      setProjects(projectData || []);
      setAoiRecords(aoiData);
      setAnalysisRecords(analysisData);
      setCarbonRecords(carbonData);
    } catch (err) {
      console.error("My Projects error:", err);

      setError(
        err?.message ||
          "Unable to load your projects from Supabase."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* =======================================================
     RESOLVE MISSING LOCATIONS
     Project location -> AOI location -> polygon center
     -> OpenStreetMap reverse geocoding
  ======================================================= */

  useEffect(() => {
    if (!projects.length) return;

    let cancelled = false;

    const resolveLocations = async () => {
      const newLocations = {};

      for (const project of projects) {
        const aoi = aoiRecords.find(
          (item) => item.project_id === project.id
        );

        console.log(
          "Checking location:",
          project.project_name,
          {
            projectLocation: project.location,
            aoiLocation: aoi?.location,
            polygon: aoi?.polygon,
          }
        );

        // 1. Project location
        let location = parseLocation(project.location);

        // 2. AOI location saved in aoi_records
        if (!location) {
          location = parseLocation(aoi?.location);
        }

        // 3. Location returned by Flask and saved in analysis_results.
        //    analysis_data may be a JSON object OR a JSON string.
        if (!location) {
          const analysis = analysisRecords.find(
            (item) => item.project_id === project.id
          );

          location = getAnalysisLocation(
            analysis?.analysis_data
          );
        }

        // 4. Last fallback: AOI polygon -> center -> reverse geocoding
        if (!location && aoi?.polygon) {
          const center = getPolygonCenter(aoi.polygon);

          if (center) {
            console.log(
              "Reverse geocoding:",
              project.project_name,
              center
            );

            const resolved = await reverseGeocode(
              center.lat,
              center.lng
            );

            if (resolved) {
              location = resolved;

              console.log(
                "Location found:",
                project.project_name,
                "=>",
                resolved
              );
            }
          }
        }

        if (location) {
          newLocations[project.id] = location;
        }
      }

      if (!cancelled) {
        setResolvedLocations((previous) => ({
          ...previous,
          ...newLocations,
        }));
      }
    };

    resolveLocations();

    return () => {
      cancelled = true;
    };
  }, [projects, aoiRecords, analysisRecords]);

  /* =======================================================
     BUILD PROJECT DATA
  ======================================================= */

  const projectCards = useMemo(() => {
    return projects.map((project) => {
      const aoi = aoiRecords.find(
        (item) => item.project_id === project.id
      );

      const analysis = analysisRecords.find(
        (item) => item.project_id === project.id
      );

      const carbon = carbonRecords.find(
        (item) => item.project_id === project.id
      );

      const savedAnalysisLocation =
        getAnalysisLocation(
          analysis?.analysis_data
        );

      const directLocation =
        parseLocation(project.location) ||
        parseLocation(aoi?.location) ||
        savedAnalysisLocation;

      const location =
        directLocation ||
        resolvedLocations[project.id] ||
        "Location not available";

      const area =
        carbon?.area_hectares ??
        aoi?.area_hectares ??
        analysis?.mangrove_area_hectares ??
        null;

      return {
        ...project,

        location,

        area,

        carbon:
          carbon?.estimated_carbon_tonnes ?? null,

        co2e:
          carbon?.estimated_co2e_tonnes ?? null,

        ndvi:
          analysis?.ndvi_mean ?? null,

        ndwi:
          analysis?.ndwi_mean ?? null,

        ndmi:
          analysis?.ndmi_mean ?? null,

        ndviMin:
          analysis?.ndvi_min ?? null,

        ndviMax:
          analysis?.ndvi_max ?? null,

        ndwiMin:
          analysis?.ndwi_min ?? null,

        ndwiMax:
          analysis?.ndwi_max ?? null,

        ndmiMin:
          analysis?.ndmi_min ?? null,

        ndmiMax:
          analysis?.ndmi_max ?? null,

        /*
          Your current projects table does not contain
          project_type in the saved structure, so don't
          invent it. Show a sensible Blue Carbon label.
        */
        type: "Blue Carbon Project",

        statusInfo: getStatus(project.status),
      };
    });
  }, [
    projects,
    aoiRecords,
    analysisRecords,
    carbonRecords,
    resolvedLocations,
  ]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projectCards.filter((project) => {
      const matchesSearch =
        !query ||
        project.project_name
          ?.toLowerCase()
          .includes(query) ||
        project.location
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        project.statusInfo.label === statusFilter;

      const matchesType =
        typeFilter === "All" ||
        project.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    projectCards,
    search,
    statusFilter,
    typeFilter,
  ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="my-projects-page">
      <style>{`

        /* =================================================
           PAGE
        ================================================= */

        .my-projects-page {
          width: 100%;
          min-height: 100%;
          box-sizing: border-box;
          padding: 24px 28px 32px;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          animation: mpPageIn .35s ease-out;
        }

        @keyframes mpPageIn {
          from {
            opacity: 0;
            transform: translateY(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes mpSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes mpCardIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =================================================
           HEADER
        ================================================= */

        .mp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .mp-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mp-heading-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #22c55e;
          background: rgba(34,197,94,.09);
          border: 1px solid rgba(34,197,94,.25);
          border-radius: 10px;
          flex-shrink: 0;
        }

        .mp-title {
          margin: 0;
          font-size: 28px;
          line-height: 1.15;
          font-weight: 700;
          letter-spacing: -.45px;
        }

        .mp-subtitle {
          margin: 7px 0 0 52px;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .mp-new-project {
          border: 1px solid rgba(34,197,94,.48);
          background: rgba(34,197,94,.08);
          color: #22c55e;
          border-radius: 8px;
          padding: 11px 16px;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 650;
          transition: .22s ease;
        }

        .mp-new-project:hover {
          background: rgba(34,197,94,.14);
          border-color: rgba(34,197,94,.72);
          transform: translateY(-1px);
        }

        /* =================================================
           TOOLBAR
        ================================================= */

        .mp-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .mp-search {
          flex: 1;
          min-width: 220px;
          height: 46px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 9px;
          color: var(--text-secondary);
          transition: .2s ease;
        }

        .mp-search:focus-within {
          border-color: rgba(34,197,94,.45);
          box-shadow: 0 0 0 3px rgba(34,197,94,.06);
        }

        .mp-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 13px;
        }

        .mp-search input::placeholder {
          color: var(--text-secondary);
          opacity: .75;
        }

        .mp-filter {
          height: 46px;
          min-width: 155px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 9px;
          color: var(--text-primary);
        }

        .mp-filter select {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
        }

        .mp-filter select option {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .mp-view-toggle {
          height: 46px;
          display: flex;
          padding: 3px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 9px;
        }

        .mp-view-button {
          width: 40px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: .2s ease;
        }

        .mp-view-button.active {
          color: var(--text-primary);
          background: var(--bg-input);
          border: 1px solid var(--border);
        }

        /* =================================================
           INFO
        ================================================= */

        .mp-result-count {
          color: var(--text-secondary);
          font-size: 12px;
          margin-bottom: 13px;
        }

        /* =================================================
           CARD GRID
        ================================================= */

        .mp-project-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fill,
            minmax(520px, 1fr)
          );
          gap: 16px;
        }

        /* =================================================
           PROJECT CARD
        ================================================= */

        .mp-project-card {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          min-height: 245px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          animation: mpCardIn .35s ease-out both;
          transition:
            transform .22s ease,
            border-color .22s ease,
            box-shadow .22s ease;
        }

        .mp-project-card:hover {
          transform: translateY(-2px);
          border-color: rgba(34,197,94,.30);
          box-shadow: 0 12px 32px rgba(0,0,0,.18);
        }

        /* =================================================
           PROJECT VISUAL
        ================================================= */

        .mp-project-visual {
          position: relative;
          min-height: 245px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 30% 30%,
              rgba(34,197,94,.20),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              rgba(10,60,45,.9),
              var(--bg-input)
            );
        }

        .mp-project-image {
          width: 100%;
          height: 100%;
          min-height: 245px;
          display: block;
          object-fit: cover;
          transition: transform .35s ease;
        }

        .mp-project-card:hover .mp-project-image {
          transform: scale(1.04);
        }

        .mp-project-visual::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,.42),
            transparent 55%
          );
          pointer-events: none;
        }

        .mp-project-visual::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              135deg,
              transparent 0 48%,
              rgba(34,197,94,.10) 49% 50%,
              transparent 51%
            ),
            linear-gradient(
              25deg,
              transparent 0 55%,
              rgba(255,255,255,.035) 56% 57%,
              transparent 58%
            );
          opacity: .8;
        }

        .mp-visual-leaf {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 76px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #22c55e;
          background: rgba(5,20,15,.48);
          border: 1px solid rgba(34,197,94,.42);
          border-radius: 50%;
          box-shadow: 0 0 35px rgba(34,197,94,.12);
        }

        .mp-visual-label {
          position: absolute;
          left: 13px;
          bottom: 13px;
          padding: 5px 9px;
          border-radius: 6px;
          color: #d1fae5;
          background: rgba(5,20,15,.68);
          border: 1px solid rgba(34,197,94,.30);
          font-size: 10px;
          font-weight: 650;
        }

        /* =================================================
           CARD CONTENT
        ================================================= */

        .mp-card-content {
          min-width: 0;
          padding: 18px 18px 15px;
          display: flex;
          flex-direction: column;
        }

        .mp-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .mp-card-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
          word-break: break-word;
        }

        .mp-location {
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .mp-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 7px;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 650;
        }

        .mp-status.verified {
          color: #22c55e;
          background: rgba(34,197,94,.10);
        }

        .mp-status.verification {
          color: #60a5fa;
          background: rgba(59,130,246,.10);
        }

        .mp-status.progress {
          color: #f59e0b;
          background: rgba(245,158,11,.10);
        }

        .mp-status.rejected {
          color: #ef4444;
          background: rgba(239,68,68,.10);
        }

        .mp-status.unknown {
          color: var(--text-secondary);
          background: var(--bg-input);
        }

        .mp-type {
          align-self: flex-start;
          margin-top: 12px;
          padding: 5px 9px;
          border-radius: 6px;
          color: var(--text-secondary);
          background: var(--bg-input);
          border: 1px solid var(--border);
          font-size: 10px;
          font-weight: 600;
        }

        /* =================================================
           METRICS
        ================================================= */

        .mp-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin-top: 17px;
          padding: 13px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .mp-metric {
          min-width: 0;
          padding: 0 13px;
          border-right: 1px solid var(--border);
        }

        .mp-metric:first-child {
          padding-left: 0;
        }

        .mp-metric:last-child {
          border-right: 0;
        }

        .mp-metric-label {
          color: var(--text-secondary);
          font-size: 10px;
          margin-bottom: 5px;
        }

        .mp-metric-value {
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 650;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mp-metric-value.green {
          color: #22c55e;
        }

        /* =================================================
           BOTTOM
        ================================================= */

        .mp-card-bottom {
          margin-top: auto;
          padding-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .mp-created {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 11px;
        }

        .mp-details {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-primary);
          border-radius: 7px;
          padding: 8px 11px;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
          transition: .2s ease;
        }

        .mp-details:hover {
          border-color: rgba(34,197,94,.45);
          color: #22c55e;
          background: rgba(34,197,94,.05);
        }

        /* =================================================
           EMPTY / LOADING / ERROR
        ================================================= */

        .mp-state {
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 30px;
        }

        .mp-state-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #22c55e;
          background: rgba(34,197,94,.09);
          border: 1px solid rgba(34,197,94,.20);
          margin-bottom: 13px;
        }

        .mp-state-title {
          font-size: 16px;
          font-weight: 650;
        }

        .mp-state-text {
          margin-top: 6px;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .mp-error {
          color: #ef4444;
          background: rgba(239,68,68,.07);
          border: 1px solid rgba(239,68,68,.22);
          border-radius: 9px;
          padding: 11px 13px;
          margin-bottom: 15px;
          font-size: 12px;
        }

        .mp-refresh {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border: 1px solid var(--border);
          background: var(--bg-input);
          color: var(--text-primary);
          border-radius: 7px;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
        }

        .mp-refresh.spinning svg {
          animation: mpSpin .7s linear infinite;
        }

        /* =================================================
           MODAL
        ================================================= */

        .mp-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,.60);
          animation: mpPageIn .2s ease-out;
        }

        .mp-modal {
          width: min(650px, 100%);
          max-height: 85vh;
          overflow-y: auto;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 25px 70px rgba(0,0,0,.40);
        }

        .mp-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--border);
        }

        .mp-modal-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }

        .mp-modal-subtitle {
          margin-top: 5px;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .mp-close {
          width: 34px;
          height: 34px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mp-close:hover {
          color: var(--text-primary);
          border-color: rgba(34,197,94,.40);
        }

        .mp-modal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .mp-modal-stat {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
        }

        .mp-modal-stat-label {
          color: var(--text-secondary);
          font-size: 10px;
        }

        .mp-modal-stat-value {
          margin-top: 5px;
          font-size: 16px;
          font-weight: 650;
        }

        .mp-indices {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .mp-indices-title {
          font-size: 14px;
          font-weight: 650;
        }

        .mp-indices-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .mp-index {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
        }

        .mp-index-name {
          color: var(--text-secondary);
          font-size: 10px;
        }

        .mp-index-value {
          margin-top: 5px;
          font-size: 18px;
          font-weight: 700;
        }

        .mp-index.ndvi .mp-index-value {
          color: #22c55e;
        }

        .mp-index.ndwi .mp-index-value {
          color: #3b82f6;
        }

        .mp-index.ndmi .mp-index-value {
          color: #2dd4bf;
        }

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1100px) {
          .mp-project-grid {
            grid-template-columns: 1fr;
          }

          .mp-project-card {
            grid-template-columns: 190px minmax(0, 1fr);
          }
        }

        @media (max-width: 800px) {
          .my-projects-page {
            padding: 18px;
          }

          .mp-header {
            flex-direction: column;
          }

          .mp-toolbar {
            flex-wrap: wrap;
          }

          .mp-search {
            flex-basis: 100%;
          }

          .mp-project-card {
            grid-template-columns: 1fr;
          }

          .mp-project-visual {
            min-height: 170px;
          }

          .mp-project-image {
            min-height: 170px;
          }
        }

        @media (max-width: 560px) {
          .mp-title {
            font-size: 23px;
          }

          .mp-metrics {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .mp-metric {
            border-right: 0;
          }

          .mp-modal-grid,
          .mp-indices-grid {
            grid-template-columns: 1fr;
          }
        }

      `}</style>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mp-header">
        <div>
          <div className="mp-heading">
            <div className="mp-heading-icon">
              <Icon type="leaf" size={23} />
            </div>

            <h1 className="mp-title">
              My Projects
            </h1>
          </div>

          <p className="mp-subtitle">
            Manage and monitor your blue carbon projects.
          </p>
        </div>

        <button
          className="mp-new-project"
          onClick={() => {
            /*
              Keep navigation controlled by your existing App.jsx.
              This event does not change backend logic.
            */
            window.dispatchEvent(
              new CustomEvent("navigate-to-menu", {
                detail: "Add New Project",
              })
            );
          }}
        >
          <Icon type="plus" size={17} />
          New Project
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mp-error">
          {error}
        </div>
      )}

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="mp-toolbar">
        <div className="mp-search">
          <Icon type="search" size={19} />

          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="mp-filter">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">
              Status: All
            </option>
            <option value="Verified">
              Verified
            </option>
            <option value="Under Verification">
              Under Verification
            </option>
            <option value="In Progress">
              In Progress
            </option>
            <option value="Rejected">
              Rejected
            </option>
          </select>

          <Icon type="chevron" size={15} />
        </div>

        <div className="mp-filter">
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="All">
              Type: All
            </option>
            <option value="Blue Carbon Project">
              Blue Carbon Project
            </option>
          </select>

          <Icon type="chevron" size={15} />
        </div>

        <div className="mp-view-toggle">
          <button
            className={`mp-view-button ${
              viewMode === "grid" ? "active" : ""
            }`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <Icon type="grid" size={18} />
          </button>

          <button
            className={`mp-view-button ${
              viewMode === "list" ? "active" : ""
            }`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <Icon type="list" size={18} />
          </button>
        </div>
      </div>

      {/* =====================================================
          RESULT COUNT
      ===================================================== */}

      {!loading && (
        <div className="mp-result-count">
          Showing {filteredProjects.length} of{" "}
          {projects.length} projects
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="mp-state">
          <div className="mp-state-icon">
            <Icon type="refresh" size={23} />
          </div>

          <div className="mp-state-title">
            Loading your projects...
          </div>

          <div className="mp-state-text">
            Fetching project, analysis and carbon data
            from Supabase.
          </div>
        </div>
      )}

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!loading &&
        !error &&
        projects.length === 0 && (
          <div className="mp-state">
            <div className="mp-state-icon">
              <Icon type="leaf" size={23} />
            </div>

            <div className="mp-state-title">
              No projects yet
            </div>

            <div className="mp-state-text">
              Create your first Blue Carbon project
              to see it here.
            </div>
          </div>
        )}

      {/* =====================================================
          FILTER EMPTY
      ===================================================== */}

      {!loading &&
        projects.length > 0 &&
        filteredProjects.length === 0 && (
          <div className="mp-state">
            <div className="mp-state-icon">
              <Icon type="search" size={23} />
            </div>

            <div className="mp-state-title">
              No matching projects
            </div>

            <div className="mp-state-text">
              Try changing your search or filters.
            </div>
          </div>
        )}

      {/* =====================================================
          PROJECT CARDS
      ===================================================== */}

      {!loading &&
        filteredProjects.length > 0 && (
          <div
            className="mp-project-grid"
            style={
              viewMode === "list"
                ? {
                    gridTemplateColumns: "1fr",
                  }
                : undefined
            }
          >
            {filteredProjects.map(
              (project, index) => (
                <div
                  className="mp-project-card"
                  key={project.id}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* PROJECT VISUAL */}

                  <div className="mp-project-visual">
                    <img
                      src={
                        projectImages[
                          index % projectImages.length
                        ]
                      }
                      alt={project.project_name || "Blue Carbon Project"}
                      className="mp-project-image"
                    />

                    <div className="mp-visual-label">
                      BLUE CARBON
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div className="mp-card-content">
                    <div className="mp-card-top">
                      <div>
                        <h2 className="mp-card-title">
                          {project.project_name ||
                            "Unnamed Project"}
                        </h2>

                        <div className="mp-location">
                          <Icon
                            type="location"
                            size={14}
                          />

                          {project.location}
                        </div>
                      </div>

                      <span
                        className={`mp-status ${project.statusInfo.className}`}
                      >
                        <Icon
                          type="check"
                          size={13}
                        />

                        {project.statusInfo.label}
                      </span>
                    </div>

                    <div className="mp-type">
                      {project.type}
                    </div>

                    {/* METRICS */}

                    <div className="mp-metrics">
                      <div className="mp-metric">
                        <div className="mp-metric-label">
                          Area
                        </div>

                        <div className="mp-metric-value">
                          {project.area !== null
                            ? `${formatNumber(
                                project.area
                              )} ha`
                            : "—"}
                        </div>
                      </div>

                      <div className="mp-metric">
                        <div className="mp-metric-label">
                          Est. Carbon
                        </div>

                        <div className="mp-metric-value green">
                          {project.carbon !== null
                            ? `${formatNumber(
                                project.carbon
                              )} t`
                            : "—"}
                        </div>
                      </div>

                      <div className="mp-metric">
                        <div className="mp-metric-label">
                          CO₂e Sequestered
                        </div>

                        <div className="mp-metric-value">
                          {project.co2e !== null
                            ? `${formatNumber(
                                project.co2e
                              )} t`
                            : "—"}
                        </div>
                      </div>

                      <div className="mp-metric">
                        <div className="mp-metric-label">
                          Created On
                        </div>

                        <div className="mp-metric-value">
                          {formatDate(
                            project.created_at
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM */}

                    <div className="mp-card-bottom">
                      <div className="mp-created">
                        <Icon
                          type="calendar"
                          size={13}
                        />

                        {formatDate(
                          project.created_at
                        )}
                      </div>

                      <button
                        className="mp-details"
                        onClick={() =>
                          setSelectedProject(project)
                        }
                      >
                        View Details
                        <Icon
                          type="arrow"
                          size={14}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

      {/* =====================================================
          REFRESH
      ===================================================== */}

      {!loading && projects.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <button
            className={`mp-refresh ${
              refreshing ? "spinning" : ""
            }`}
            onClick={() => fetchProjects(true)}
            disabled={refreshing}
          >
            <Icon type="refresh" size={14} />

            {refreshing
              ? "Refreshing..."
              : "Refresh Projects"}
          </button>
        </div>
      )}

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedProject && (
        <div
          className="mp-modal-backdrop"
          onMouseDown={() =>
            setSelectedProject(null)
          }
        >
          <div
            className="mp-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="mp-modal-header">
              <div>
                <h2 className="mp-modal-title">
                  {selectedProject.project_name}
                </h2>

                <div className="mp-modal-subtitle">
                  {selectedProject.location}
                </div>
              </div>

              <button
                className="mp-close"
                onClick={() =>
                  setSelectedProject(null)
                }
              >
                <Icon type="close" size={17} />
              </button>
            </div>

            <div className="mp-modal-grid">
              <div className="mp-modal-stat">
                <div className="mp-modal-stat-label">
                  Area
                </div>

                <div className="mp-modal-stat-value">
                  {selectedProject.area !== null
                    ? `${formatNumber(
                        selectedProject.area
                      )} ha`
                    : "—"}
                </div>
              </div>

              <div className="mp-modal-stat">
                <div className="mp-modal-stat-label">
                  Estimated Carbon
                </div>

                <div className="mp-modal-stat-value">
                  {selectedProject.carbon !== null
                    ? `${formatNumber(
                        selectedProject.carbon
                      )} t`
                    : "—"}
                </div>
              </div>

              <div className="mp-modal-stat">
                <div className="mp-modal-stat-label">
                  CO₂e
                </div>

                <div className="mp-modal-stat-value">
                  {selectedProject.co2e !== null
                    ? `${formatNumber(
                        selectedProject.co2e
                      )} t`
                    : "—"}
                </div>
              </div>
            </div>

            <div className="mp-indices">
              <div className="mp-indices-title">
                Environmental Indices
              </div>

              <div className="mp-indices-grid">
                <div className="mp-index ndvi">
                  <div className="mp-index-name">
                    NDVI · Vegetation
                  </div>

                  <div className="mp-index-value">
                    {formatIndex(
                      selectedProject.ndvi
                    )}
                  </div>
                </div>

                <div className="mp-index ndwi">
                  <div className="mp-index-name">
                    NDWI · Water
                  </div>

                  <div className="mp-index-value">
                    {formatIndex(
                      selectedProject.ndwi
                    )}
                  </div>
                </div>

                <div className="mp-index ndmi">
                  <div className="mp-index-name">
                    NDMI · Moisture
                  </div>

                  <div className="mp-index-value">
                    {formatIndex(
                      selectedProject.ndmi
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedProject.description && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop:
                    "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {selectedProject.description}
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                color: "var(--text-secondary)",
                fontSize: 11,
              }}
            >
              Created on{" "}
              {formatDate(
                selectedProject.created_at
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}