import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "./supabaseClient";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

// =========================================================
// LEAFLET DRAW CONTROLS
// =========================================================

function DrawControls({ onPolygonCreated }) {
  const map = useMap();
  const drawnItemsRef = useRef(null);

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();

    drawnItemsRef.current = drawnItems;

    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: "topright",

      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },

        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },

      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);

    // Polygon created
    const handleCreated = (event) => {
      const layer = event.layer;

      drawnItems.addLayer(layer);

      const latLngs = layer.getLatLngs();

      console.log("AOI Polygon:", latLngs);

      onPolygonCreated(latLngs);
    };

    // Polygon deleted
    const handleDeleted = () => {
      onPolygonCreated(null);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DELETED, handleDeleted);

      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onPolygonCreated]);

  return null;
}


// =========================================================
// SMALL CARD COMPONENT
// =========================================================

// =========================================================
// THEME CARD COMPONENTS
// =========================================================

function StatCard({ title, value, subtitle, icon, accent = "green" }) {
  return (
    <div className={`mrv-stat-card mrv-accent-${accent}`}>
      <div className="mrv-card-icon">{icon}</div>
      <div className="mrv-card-label">{title}</div>
      <div className="mrv-card-value">{value}</div>
      {subtitle && <div className="mrv-card-subtitle">{subtitle}</div>}
    </div>
  );
}

function IndexCard({ title, icon, mean, minimum, maximum, accent = "green" }) {
  return (
    <div className={`mrv-index-card mrv-accent-${accent}`}>
      <div className="mrv-index-head">
        <span className="mrv-index-icon">{icon}</span>
        <span>{title}</span>
      </div>

      <div className="mrv-index-values">
        <div>
          <small>Mean</small>
          <strong>{Number(mean).toFixed(4)}</strong>
        </div>
        <div>
          <small>Min</small>
          <strong>{Number(minimum).toFixed(4)}</strong>
        </div>
        <div>
          <small>Max</small>
          <strong>{Number(maximum).toFixed(4)}</strong>
        </div>
      </div>
    </div>
  );
}

// Calculate only from the polygon selected by the user.
// No backend value is changed or replaced.
function getPolygonAreaHectares(latLngs) {
  if (!latLngs || latLngs.length < 3) return 0;

  const points = latLngs.map((p) => ({
    lat: Number(p.lat),
    lng: Number(p.lng),
  }));

  const earthRadius = 6378137;
  const lat0 =
    (points.reduce((sum, p) => sum + p.lat, 0) / points.length) *
    (Math.PI / 180);

  const projected = points.map((p) => ({
    x: earthRadius * (p.lng * Math.PI / 180) * Math.cos(lat0),
    y: earthRadius * (p.lat * Math.PI / 180),
  }));

  let area = 0;
  for (let i = 0; i < projected.length; i += 1) {
    const j = (i + 1) % projected.length;
    area += projected[i].x * projected[j].y;
    area -= projected[j].x * projected[i].y;
  }

  return Math.abs(area) / 2 / 10000;
}

function getPolygonPerimeterKm(latLngs) {
  if (!latLngs || latLngs.length < 2) return 0;

  let distance = 0;

  for (let i = 0; i < latLngs.length; i += 1) {
    const current = L.latLng(latLngs[i].lat, latLngs[i].lng);
    const next = L.latLng(
      latLngs[(i + 1) % latLngs.length].lat,
      latLngs[(i + 1) % latLngs.length].lng
    );

    distance += current.distanceTo(next);
  }

  return distance / 1000;
}

// MAIN COMPONENT
// =========================================================

function MapSelector() {
  const [aoi, setAoi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [mapType, setMapType] = useState("street");

  // =======================================================
  // SUPABASE PROJECT STATE
  // =======================================================

  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState(null);

  // =========================================
  // MRV REPORT TOAST STATE
  // =========================================

  const [reportToast, setReportToast] = useState(null);

  // =======================================================
  // AOI CREATED
  // =======================================================

  const handlePolygonCreated = (coordinates) => {
    setAoi(coordinates);
    setResult(null);

    console.log("Selected AOI:", coordinates);
  };

  // =======================================================
// SEND AOI TO FLASK
// =======================================================

const sendAOIToBackend = async () => {

  if (!aoi) {
    alert("Please select an area on the map first.");
    return;
  }
  if (!projectName.trim()) {
  alert("Please enter a project name first.");
  return;
}

  setLoading(true);
  setResult(null);

  try {

    // ===================================================
    // Convert Leaflet coordinates
    // ===================================================

    const polygon = aoi[0].map((point) => ({
      lat: point.lat,
      lng: point.lng,
    }));


    console.log(
      "Sending polygon to Flask:",
      polygon
    );


    // ===================================================
    // SEND REQUEST TO FLASK
    // ===================================================

    const response = await fetch(
      "http://127.0.0.1:5000/api/analyze",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          polygon: polygon,
        }),
      }
    );


    // ===================================================
    // READ FLASK RESPONSE
    // ===================================================

    const data = await response.json();


    console.log(
      "Flask response:",
      data
    );


    // ===================================================
    // BACKEND ERROR
    // ===================================================

    if (!response.ok || data.status === "error") {

      setResult({

        status: "error",

        message:
          data.message ||
          "Analysis could not be completed.",

      });

      return;
    }


    // ===================================================
    // SUCCESS
    // ===================================================

    setResult(data);

    // =======================================================
// SUPABASE EVIDENCE SAVE
// Project → AOI → Analysis
// =======================================================

try {
  // -----------------------------------------------
  // GET CURRENT LOGGED-IN USER
  // -----------------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "Supabase user error:",
      userError
    );

    alert(
      "Analysis completed, but no logged-in user was found."
    );

    return;
  }


  // -----------------------------------------------
  // 1. CREATE PROJECT
  // -----------------------------------------------

  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      project_name: projectName.trim(),
      status: "Completed",
    })
    .select()
    .single();


  if (projectError) {
    console.error(
      "Project save error:",
      projectError
    );

    alert(
      "Analysis completed, but project could not be saved."
    );

    return;
  }


  console.log(
    "Project saved:",
    project
  );


  // Save project ID in React state
  setProjectId(project.id);


  // -----------------------------------------------
  // 2. CREATE AOI RECORD
  // -----------------------------------------------

  const {
    data: aoiRecord,
    error: aoiError,
  } = await supabase
    .from("aoi_records")
    .insert({
      project_id: project.id,
      user_id: user.id,

      polygon: polygon,

      location:
        data.location ||
        data.aoi?.location ||
        null,

      area_m2:
        data.mangrove_screening
          ?.potential_mangrove_area_m2 ||
        null,

      area_hectares:
        data.mangrove_screening
          ?.potential_mangrove_area_hectares ||
        null,
    })
    .select()
    .single();


  if (aoiError) {
    console.error(
      "AOI save error:",
      aoiError
    );

    alert(
      "Project was saved, but AOI could not be saved."
    );

    return;
  }


  console.log(
    "AOI saved:",
    aoiRecord
  );


  // -----------------------------------------------
  // 3. SAVE COMPLETE ANALYSIS RESULT
  // -----------------------------------------------

  const {
    data: analysisRecord,
    error: analysisError,
  } = await supabase
    .from("analysis_results")
    .insert({
      project_id: project.id,
      aoi_id: aoiRecord.id,
      user_id: user.id,

      sentinel_image:
        data.sentinel_image || null,

      ndvi_mean:
        data.statistics?.ndvi?.mean || null,

      ndvi_min:
        data.statistics?.ndvi?.minimum || null,

      ndvi_max:
        data.statistics?.ndvi?.maximum || null,

      ndwi_mean:
        data.statistics?.ndwi?.mean || null,

      ndwi_min:
        data.statistics?.ndwi?.minimum || null,

      ndwi_max:
        data.statistics?.ndwi?.maximum || null,

      ndmi_mean:
        data.statistics?.ndmi?.mean || null,

      ndmi_min:
        data.statistics?.ndmi?.minimum || null,

      ndmi_max:
        data.statistics?.ndmi?.maximum || null,

      mangrove_percentage:
        data.mangrove_screening
          ?.potential_mangrove_percentage ||
        null,

      mangrove_pixels:
        data.mangrove_screening
          ?.potential_mangrove_pixels ||
        null,

      mangrove_area_m2:
        data.mangrove_screening
          ?.potential_mangrove_area_m2 ||
        null,

      mangrove_area_hectares:
        data.mangrove_screening
          ?.potential_mangrove_area_hectares ||
        null,

      ndvi_passed:
  data.mangrove_screening
    ?.condition_counts?.ndvi_passed ?? null,

ndwi_passed:
  data.mangrove_screening
    ?.condition_counts?.ndwi_passed ?? null,

ndmi_passed:
  data.mangrove_screening
    ?.condition_counts?.ndmi_passed ?? null,

all_three_passed:
  data.mangrove_screening
    ?.condition_counts?.all_three_passed ?? null,

      // Complete original Flask response
      analysis_data: data,
    })
    .select()
    .single();


  if (analysisError) {
    console.error(
      "Analysis save error:",
      analysisError
    );

    alert(
      "Project and AOI were saved, but analysis could not be saved."
    );

    return;
  }


  console.log(
    "Analysis saved:",
    analysisRecord
  );


  // -----------------------------------------------
  // 4. SAVE CARBON ESTIMATION
  // -----------------------------------------------

  if (data.carbon_estimation) {

    const {
      data: carbonRecord,
      error: carbonError,
    } = await supabase
      .from("carbon_estimates")
      .insert({
        project_id: project.id,
        analysis_id: analysisRecord.id,
        user_id: user.id,

        area_hectares:
          data.carbon_estimation
            .mangrove_area_hectares ||
          null,

        carbon_stock_factor:
          data.carbon_estimation
            .carbon_stock_factor_t_c_per_ha ||
          null,

        estimated_carbon_tonnes:
          data.carbon_estimation
            .estimated_carbon_tonnes ||
          null,

        estimated_co2e_tonnes:
          data.carbon_estimation
            .estimated_co2e_tonnes ||
          null,

        methodology:
          data.carbon_estimation
            .methodology ||
          null,

        carbon_stock_source:
          data.carbon_estimation
            .carbon_stock_source ||
          null,

        carbon_stock_scope:
          data.carbon_estimation
            .carbon_stock_scope ||
          null,

        notes:
          data.carbon_estimation
            .note ||
          null,
      })
      .select()
      .single();


    if (carbonError) {
      console.error(
        "Carbon save error:",
        carbonError
      );
    } else {
      console.log(
        "Carbon estimate saved:",
        carbonRecord
      );
    }
  }


  // -----------------------------------------------
  // COMPLETE
  // -----------------------------------------------

  console.log(
    "✅ Complete MRV evidence saved to Supabase"
  );

} catch (supabaseError) {

  console.error(
    "Supabase error:",
    supabaseError
  );

  alert(
    "Analysis completed, but Supabase saving failed."
  );
}

  } catch (error) {

    console.error(
      "Error connecting to Flask:",
      error
    );


    // ===================================================
    // ONLY SHOW THIS WHEN FLASK IS ACTUALLY
    // UNREACHABLE
    // ===================================================

    setResult({

      status: "error",

      message:
        "Could not connect to Flask backend. Please make sure the backend server is running.",

    });

  } finally {

    setLoading(false);

  }

};

// =======================================
// GENERATE MRV REPORT
// =======================================

const generateMRVReport = async () => {

  if (!result || result.status !== "success") {
    alert("Please analyze an AOI first.");
    return;
  }

  try {

    console.log("Generating MRV report...");

    const response = await fetch(
      "http://127.0.0.1:5000/api/report",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(result),
      }
    );

    const data = await response.json();

    console.log("Report response:", data);

    if (!response.ok) {
      throw new Error(
        data.message || "Report generation failed"
      );
    }

    if (data.status === "success") {

      // Download generated PDF
      const downloadUrl =
        `http://127.0.0.1:5000/api/report/download?file=${encodeURIComponent(
          data.report_file
        )}`;

      window.open(downloadUrl, "_blank");

      // ===================================================
// SAVE MRV REPORT TO SUPABASE
// ===================================================

try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "Could not get logged-in user:",
      userError
    );
  } else if (!user) {
    console.error(
      "No logged-in Supabase user found."
    );
  } else if (!projectId) {
    console.error(
      "No project ID found. Report cannot be linked to project."
    );
  } else {

    // -----------------------------------------------
    // Extract report ID
    // -----------------------------------------------

    const reportId =
      data.report_id ||
      data.report_file
        ?.match(/BCMRV-\d{8}-\d{6}/)?.[0] ||
      `MRV-${Date.now()}`;


    // -----------------------------------------------
    // SAVE REPORT
    // -----------------------------------------------

    const {
      data: reportRecord,
      error: reportError,
    } = await supabase
      .from("mrv_reports")
      .insert({
        project_id: projectId,
        user_id: user.id,

        report_id: reportId,

        report_url:
          data.report_file || null,

        verification_url:
          data.verification_url || null,

        generated_on:
          data.generated_on || new Date().toISOString(),

        report_data: data,
      })
      .select()
      .single();


    if (reportError) {

      console.error(
        "MRV report Supabase save error:",
        reportError
      );

    } else {

      console.log(
        "✅ MRV report saved to Supabase:",
        reportRecord
      );

    }
  }

} catch (reportSaveError) {

  console.error(
    "MRV report Supabase error:",
    reportSaveError
  );

}

      

      // ===================================
      // PROFESSIONAL DOWNLOAD SUCCESS TOAST
      // ===================================

      const reportId =
        data.report_file?.match(/BCMRV-\d{8}-\d{6}/)?.[0] || null;

      setReportToast({
        type: "success",
        title: "MRV Report Ready",
        message:
          "Your report has been generated and the PDF download has started.",
        reportId: reportId,
      });

      setTimeout(() => {
        setReportToast(null);
      }, 5000);
    }

  } catch (error) {

    console.error(
      "Report generation error:",
      error
    );

    setReportToast({
      type: "error",
      title: "Report Generation Failed",
      message:
        error.message || "Could not generate MRV report.",
    });

    setTimeout(() => {
      setReportToast(null);
    }, 5000);
  }
};


  // =======================================================
  // FORMAT NUMBER
  // =======================================================

  const formatNumber = (value, decimals = 2) => {
    if (value === undefined || value === null) {
      return "0";
    }

    return Number(value).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }
    );
  };


  // =======================================================
  // RENDER
  // =======================================================

// =======================================================
  // RENDER
  // =======================================================

  const selectedPoints = aoi?.[0] || [];
  const mappedAreaHa = getPolygonAreaHectares(selectedPoints);
  const perimeterKm = getPolygonPerimeterKm(selectedPoints);
  const coordinateCount = selectedPoints.length;
  const projectionLabel = "WGS 84";
  const projectionCode = "EPSG:4326";

  return (
    <>
      <style>{`
        /* =====================================================
           BLUE CARBON MRV — CARBON CREDITS VISUAL LANGUAGE
           UI ONLY. No API/backend logic is changed.
        ===================================================== */

        .mrv-page {
          --mrv-bg: #101218;
          --mrv-panel: #151820;
          --mrv-panel-2: #191d26;
          --mrv-panel-3: #1d222d;
          --mrv-border: #303746;
          --mrv-border-soft: #252b36;
          --mrv-text: #f4f7fb;
          --mrv-muted: #9ba7ba;
          --mrv-green: #19d66b;
          --mrv-green-dark: #0d9d4d;
          --mrv-blue: #3f8cff;
          --mrv-purple: #a85cf4;
          --mrv-red: #ff4f5e;
          --mrv-yellow: #f5bd3f;
          width: 100%;
          min-height: 100%;
          box-sizing: border-box;
          padding: 22px;
          color: var(--mrv-text);
          background:
            radial-gradient(circle at 15% 0%, rgba(25,214,107,.055), transparent 28%),
            radial-gradient(circle at 90% 10%, rgba(63,140,255,.045), transparent 25%),
            var(--mrv-bg);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .mrv-shell {
          width: min(1200px, 100%);
          margin: 0 auto;
        }

        .mrv-page *,
        .mrv-page *::before,
        .mrv-page *::after {
          box-sizing: border-box;
        }

        .mrv-topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          animation: mrvFadeUp .45s ease both;
        }

        .mrv-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--mrv-green);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .mrv-title {
          margin: 0;
          font-size: clamp(26px, 3vw, 34px);
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -.025em;
        }

        .mrv-subtitle {
          margin: 8px 0 0;
          color: #aeb8c9;
          font-size: 14px;
        }

        .mrv-section {
          position: relative;
          background: linear-gradient(180deg, rgba(22,26,35,.98), rgba(17,20,27,.98));
          border: 1px solid var(--mrv-border);
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,.18);
          overflow: hidden;
          animation: mrvFadeUp .5s ease both;
        }

        .mrv-section:nth-of-type(2) { animation-delay: .04s; }
        .mrv-section:nth-of-type(3) { animation-delay: .08s; }
        .mrv-section:nth-of-type(4) { animation-delay: .12s; }
        .mrv-section:nth-of-type(5) { animation-delay: .16s; }

        .mrv-section::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: linear-gradient(180deg, var(--mrv-green), #1fb9a1);
          opacity: .85;
        }

        .mrv-section-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .mrv-step {
          width: 30px;
          height: 30px;
          min-width: 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #20d96f, #0fa958);
          color: #07130c;
          font-size: 14px;
          font-weight: 900;
          box-shadow: 0 0 0 5px rgba(25,214,107,.07);
        }

        .mrv-section-title {
          margin: 0;
          font-size: 17px;
          font-weight: 750;
          letter-spacing: -.01em;
        }

        .mrv-section-desc {
          margin: 3px 0 0;
          color: var(--mrv-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .mrv-status-pill {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(25,214,107,.28);
          background: rgba(25,214,107,.08);
          color: #46e98a;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .mrv-project-card {
          background: #12151c;
          border: 1px solid var(--mrv-border-soft);
          border-radius: 10px;
          padding: 14px;
        }

        .mrv-label {
          display: block;
          margin-bottom: 7px;
          color: #aeb8c9;
          font-size: 12px;
          font-weight: 650;
        }

        .mrv-input {
          width: 100%;
          border: 1px solid #323947;
          background: #1a1f29;
          color: #f5f7fb;
          border-radius: 7px;
          padding: 11px 12px;
          outline: none;
          font: inherit;
          font-size: 13px;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }

        .mrv-input::placeholder { color: #667185; }

        .mrv-input:focus {
          border-color: rgba(25,214,107,.65);
          box-shadow: 0 0 0 3px rgba(25,214,107,.09);
          background: #1c222d;
        }

        .mrv-map-wrap {
          border: 1px solid #303745;
          border-radius: 10px;
          overflow: hidden;
          background: #0d1015;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.015);
        }

        .mrv-map {
          height: 600px;
          width: 100%;
        }

        .mrv-map-switcher {
          position: absolute;
          top: 12px;
          left: 58px;
          z-index: 1000;
          display: flex;
          background: #171b23;
          border: 1px solid #394150;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 8px 22px rgba(0,0,0,.28);
        }

        .mrv-map-switcher button {
          border: 0;
          cursor: pointer;
          padding: 8px 12px;
          background: #171b23;
          color: #aeb8c9;
          font-weight: 700;
          font-size: 12px;
          transition: .2s ease;
        }

        .mrv-map-switcher button:hover { color: white; background: #222936; }

        .mrv-map-switcher button.active {
          background: #2563eb;
          color: white;
        }

        /* Keep Leaflet controls functional while matching the dark theme. */
        .mrv-page .leaflet-control-zoom a,
        .mrv-page .leaflet-control-layers {
          background: #171b23 !important;
          color: #eef2f7 !important;
          border-color: #394150 !important;
        }

        .mrv-page .leaflet-control-zoom a:hover,
        .mrv-page .leaflet-control-layers:hover {
          background: #232936 !important;
          color: white !important;
        }

        .mrv-aoi-panel {
          margin-top: 12px;
          padding: 14px;
          border: 1px solid var(--mrv-border);
          border-radius: 10px;
          background: #12151c;
        }

        .mrv-aoi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid #2c333f;
          border-radius: 9px;
          overflow: hidden;
          margin-top: 12px;
        }

        .mrv-aoi-stat {
          padding: 13px 12px;
          text-align: center;
          background: #171b23;
          border-right: 1px solid #2c333f;
        }

        .mrv-aoi-stat:last-child { border-right: 0; }

        .mrv-aoi-stat small {
          display: block;
          color: #8e9aae;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .mrv-aoi-stat strong {
          display: block;
          color: #f4f7fb;
          font-size: 14px;
          font-weight: 800;
        }

        .mrv-aoi-stat span {
          display: block;
          color: #69758a;
          font-size: 10px;
          margin-top: 3px;
        }

        .mrv-coordinate-box {
          max-height: 180px;
          overflow: auto;
          margin-top: 12px;
          padding: 13px;
          border-radius: 8px;
          border: 1px solid #2d3542;
          background: #0c211b;
          color: #bcebd3;
          font-family: "SFMono-Regular", Consolas, monospace;
          font-size: 11px;
          line-height: 1.6;
        }

        .mrv-actions {
          display: flex;
          justify-content: center;
          margin-top: 15px;
        }

        .mrv-primary-btn,
        .mrv-report-btn {
          border: 1px solid rgba(25,214,107,.35);
          border-radius: 8px;
          cursor: pointer;
          color: #06140b;
          background: linear-gradient(135deg, #25df74, #10a957);
          padding: 12px 18px;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 8px 22px rgba(25,214,107,.14);
          transition: transform .2s, box-shadow .2s, filter .2s;
        }

        .mrv-primary-btn:hover,
        .mrv-report-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.06);
          box-shadow: 0 12px 28px rgba(25,214,107,.22);
        }

        .mrv-primary-btn:disabled {
          cursor: not-allowed;
          background: #3b4351;
          color: #9aa4b4;
          border-color: #4a5362;
          box-shadow: none;
          transform: none;
        }

        .mrv-processing {
          margin-top: 13px;
          padding: 13px;
          border: 1px solid #2e3745;
          border-radius: 9px;
          background: #141923;
        }

        .mrv-processing-track {
          height: 5px;
          margin-top: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: #252c38;
        }

        .mrv-processing-bar {
          width: 38%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #1bd56a, #3f8cff);
          animation: mrvProgress 1.25s ease-in-out infinite;
        }

        .mrv-processing-text {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #8995a9;
          font-size: 11px;
        }

        .mrv-result {
          border: 1px solid #303746;
          background: #12151c;
        }

        .mrv-success {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #3be47e;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .mrv-subsection {
          padding: 14px;
          margin-top: 12px;
          border: 1px solid #2c333f;
          border-radius: 10px;
          background: #151922;
        }

        .mrv-subsection-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 8px;
          color: #f3f6fb;
          font-size: 16px;
          font-weight: 750;
        }

        .mrv-file {
          display: inline-block;
          margin-top: 3px;
          color: #8f9bb0;
          font-size: 11px;
          font-family: "SFMono-Regular", Consolas, monospace;
          word-break: break-all;
        }

        .mrv-success-text {
          color: #35df79;
          font-size: 12px;
          font-weight: 700;
          margin: 0 0 5px;
        }

        .mrv-card-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 11px;
        }

        .mrv-stat-card {
          position: relative;
          min-width: 0;
          padding: 15px;
          border: 1px solid #303746;
          border-radius: 10px;
          background: linear-gradient(145deg, #191e27, #151922);
          overflow: hidden;
          transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
          animation: mrvCardIn .45s ease both;
        }

        .mrv-stat-card:hover,
        .mrv-index-card:hover {
          transform: translateY(-3px);
          border-color: #465063;
          box-shadow: 0 12px 28px rgba(0,0,0,.2);
        }

        .mrv-card-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          margin-bottom: 12px;
          font-size: 19px;
          background: rgba(25,214,107,.10);
          border: 1px solid rgba(25,214,107,.18);
        }

        .mrv-accent-blue .mrv-card-icon { background: rgba(63,140,255,.12); border-color: rgba(63,140,255,.22); }
        .mrv-accent-purple .mrv-card-icon { background: rgba(168,92,244,.12); border-color: rgba(168,92,244,.22); }
        .mrv-accent-red .mrv-card-icon { background: rgba(255,79,94,.12); border-color: rgba(255,79,94,.22); }
        .mrv-accent-yellow .mrv-card-icon { background: rgba(245,189,63,.12); border-color: rgba(245,189,63,.22); }

        .mrv-card-label {
          color: #a6b0c0;
          font-size: 11px;
          font-weight: 650;
          margin-bottom: 6px;
        }

        .mrv-card-value {
          color: #f4f7fb;
          font-size: 21px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -.02em;
          word-break: break-word;
        }

        .mrv-card-subtitle {
          color: #69758a;
          font-size: 10px;
          margin-top: 7px;
        }

        .mrv-index-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 11px;
        }

        .mrv-index-card {
          min-width: 0;
          padding: 14px;
          border: 1px solid #303746;
          border-radius: 10px;
          background: #191e27;
          transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
        }

        .mrv-index-head {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f1f4f9;
          font-size: 13px;
          font-weight: 750;
          padding-bottom: 11px;
          border-bottom: 1px solid #2b323e;
        }

        .mrv-index-icon { font-size: 19px; }

        .mrv-index-values {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
          padding-top: 12px;
        }

        .mrv-index-values small {
          display: block;
          color: #79859a;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .mrv-index-values strong {
          display: block;
          color: #f4f7fb;
          font-size: 14px;
          font-weight: 800;
        }

        .mrv-screening-header {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 22px 0 5px;
          color: #f4f7fb;
          font-size: 17px;
          font-weight: 800;
        }

        .mrv-screening-copy {
          margin: 0 0 13px;
          color: #8f9aae;
          font-size: 12px;
        }

        .mrv-detail-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
          margin-top: 12px;
        }

        .mrv-detail {
          padding: 11px;
          border-radius: 8px;
          border: 1px solid #2d3542;
          background: #131720;
        }

        .mrv-detail strong {
          display: block;
          color: #e8edf4;
          font-size: 11px;
          margin-bottom: 5px;
        }

        .mrv-detail span {
          color: #4be587;
          font-size: 15px;
          font-weight: 800;
        }

        .mrv-threshold-wrap {
          margin-top: 12px;
          padding: 13px;
          border: 1px solid #2b333f;
          border-radius: 10px;
          background: #131720;
        }

        .mrv-threshold-title {
          margin: 0 0 11px;
          color: #eaf0f7;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
        }

        .mrv-threshold-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .mrv-threshold {
          padding: 13px;
          border: 1px solid #303746;
          border-radius: 9px;
          background: #191e27;
          transition: transform .2s ease, border-color .2s ease;
        }

        .mrv-threshold:hover {
          transform: translateY(-2px);
          border-color: #465063;
        }

        .mrv-threshold h4 {
          margin: 0 0 12px;
          color: #f4f7fb;
          font-size: 13px;
        }

        .mrv-threshold p {
          margin: 6px 0;
          color: #aab4c4;
          font-size: 12px;
          font-family: "SFMono-Regular", Consolas, monospace;
        }

        .mrv-mask {
          margin-top: 12px;
          padding: 13px;
          border: 1px solid rgba(25,214,107,.22);
          border-radius: 9px;
          background: rgba(25,214,107,.045);
        }

        .mrv-mask h4 {
          margin: 0 0 7px;
          color: #55e88e;
          font-size: 14px;
        }

        .mrv-mask p {
          margin: 0 0 7px;
          color: #929db0;
          font-size: 12px;
        }

        .mrv-mask code {
          display: inline-block;
          max-width: 100%;
          padding: 5px 8px;
          border-radius: 5px;
          background: #0c1016;
          color: #c5cedb;
          font-size: 10px;
          word-break: break-all;
        }

        .mrv-carbon {
          margin-top: 14px;
          padding: 14px;
          border: 1px solid rgba(25,214,107,.24);
          border-radius: 11px;
          background:
            radial-gradient(circle at 50% 0%, rgba(25,214,107,.07), transparent 40%),
            #131820;
        }

        .mrv-carbon-head {
          text-align: center;
          margin-bottom: 14px;
        }

        .mrv-carbon-head h3 {
          margin: 0;
          color: #f4f7fb;
          font-size: 21px;
        }

        .mrv-carbon-head p {
          margin: 6px 0 0;
          color: #8f9aae;
          font-size: 12px;
        }

        .mrv-report-actions {
          display: flex;
          justify-content: center;
          margin: 14px 0;
        }

        .mrv-report-btn {
          color: #07140b;
          padding: 12px 18px;
        }

        .mrv-methodology {
          margin-top: 12px;
          padding: 14px;
          border: 1px solid #303746;
          border-radius: 9px;
          background: #181d26;
        }

        .mrv-methodology h4 {
          margin: 0 0 9px;
          color: #f0f4fa;
          font-size: 14px;
        }

        .mrv-methodology p {
          margin: 6px 0;
          color: #aeb7c7;
          font-size: 12px;
          line-height: 1.55;
        }

        .mrv-methodology strong { color: #edf2f8; }

        .mrv-note {
          margin-top: 10px;
          padding: 12px;
          border: 1px solid rgba(245,189,63,.28);
          border-radius: 8px;
          background: rgba(245,189,63,.055);
          color: #e4bd67;
          font-size: 11px;
          line-height: 1.5;
        }

        .mrv-valid {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 12px;
          padding: 14px;
          border: 1px solid #2f3744;
          border-radius: 9px;
          background: #151922;
        }

        .mrv-valid-label {
          color: #9aa5b8;
          font-size: 12px;
        }

        .mrv-valid-value {
          color: #f4f7fb;
          font-size: 20px;
          font-weight: 850;
        }

        .mrv-next {
          margin-top: 12px;
          padding: 15px;
          text-align: center;
          border: 1px solid rgba(25,214,107,.22);
          border-radius: 9px;
          background: rgba(25,214,107,.045);
        }

        .mrv-next-label {
          color: #7f8ba0;
          font-size: 11px;
          margin-bottom: 5px;
        }

        .mrv-next-value {
          color: #55e88e;
          font-size: 17px;
          font-weight: 800;
        }

        .mrv-error {
          margin-top: 12px;
          padding: 13px;
          border: 1px solid rgba(255,79,94,.3);
          border-radius: 9px;
          background: rgba(255,79,94,.055);
          color: #ff8993;
        }

        .mrv-error h3 {
          margin: 0 0 6px;
          font-size: 14px;
        }

        .mrv-error p { margin: 0; font-size: 12px; }

        .mrv-toast {
          position: fixed;
          top: 92px;
          right: 24px;
          z-index: 9999;
          width: 360px;
          max-width: calc(100vw - 40px);
          padding: 15px;
          border-radius: 10px;
          background: #181d26;
          border: 1px solid #343c4a;
          box-shadow: 0 18px 45px rgba(0,0,0,.42);
          animation: mrvToastIn .35s ease both;
        }

        .mrv-toast.success { border-left: 4px solid #19d66b; }
        .mrv-toast.error { border-left: 4px solid #ff4f5e; }

        .mrv-toast-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .mrv-toast-icon {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 50%;
          background: rgba(25,214,107,.12);
          color: #49e889;
          font-weight: 900;
        }

        .mrv-toast.error .mrv-toast-icon {
          background: rgba(255,79,94,.12);
          color: #ff7b87;
        }

        .mrv-toast-content { flex: 1; }

        .mrv-toast-title {
          margin-bottom: 4px;
          color: #f3f6fb;
          font-size: 14px;
          font-weight: 800;
        }

        .mrv-toast-message {
          color: #9da8ba;
          font-size: 11px;
          line-height: 1.5;
        }

        .mrv-toast-report {
          margin-top: 6px;
          color: #c4cbd6;
          font-size: 10px;
        }

        .mrv-toast-close {
          border: 0;
          background: transparent;
          color: #7f8a9c;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 0;
        }

        .mrv-toast-close:hover { color: white; }

        @keyframes mrvFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes mrvCardIn {
          from { opacity: 0; transform: translateY(7px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes mrvProgress {
          0% { transform: translateX(-130%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(300%); }
        }

        @keyframes mrvToastIn {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 980px) {
          .mrv-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mrv-aoi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mrv-aoi-stat:nth-child(2) { border-right: 0; }
          .mrv-aoi-stat:nth-child(-n+2) { border-bottom: 1px solid #2c333f; }
          .mrv-index-grid { grid-template-columns: 1fr; }
          .mrv-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 680px) {
          .mrv-page { padding: 12px; }
          .mrv-section { padding: 13px; }
          .mrv-topbar { align-items: flex-start; }
          .mrv-card-grid,
          .mrv-threshold-grid,
          .mrv-detail-grid { grid-template-columns: 1fr; }
          .mrv-aoi-grid { grid-template-columns: 1fr; }
          .mrv-aoi-stat {
            border-right: 0;
            border-bottom: 1px solid #2c333f;
          }
          .mrv-aoi-stat:last-child { border-bottom: 0; }
          .mrv-map { height: 600px; }
          .mrv-status-pill { margin-left: 0; }
          .mrv-section-head { flex-wrap: wrap; }
          .mrv-valid { align-items: flex-start; flex-direction: column; }
        }
      `}</style>

      <div className="mrv-page">
        <div className="mrv-shell">

          {/* =================================================
              PROFESSIONAL REPORT TOAST
          ================================================= */}
          {reportToast && (
            <div className={`mrv-toast ${reportToast.type}`}>
              <div className="mrv-toast-row">
                <div className="mrv-toast-icon">
                  {reportToast.type === "success" ? "✓" : "!"}
                </div>

                <div className="mrv-toast-content">
                  <div className="mrv-toast-title">{reportToast.title}</div>
                  <div className="mrv-toast-message">{reportToast.message}</div>

                  {reportToast.reportId && (
                    <div className="mrv-toast-report">
                      <strong>Report ID:</strong> {reportToast.reportId}
                    </div>
                  )}
                </div>

                <button
                  className="mrv-toast-close"
                  onClick={() => setReportToast(null)}
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              PAGE HEADER
          ================================================= */}
          <div className="mrv-topbar">
            <div>
              <div className="mrv-kicker">🌊 Blue Carbon MRV</div>
              <h1 className="mrv-title">Add New Project</h1>
              <p className="mrv-subtitle">
                Map your project area, run analysis, and generate MRV report.
              </p>
            </div>
          </div>

          {/* =================================================
              STEP 1 — PROJECT INFORMATION
              Only the existing Project Name field is shown.
              No new project fields have been invented.
          ================================================= */}
          <section className="mrv-section">
            <div className="mrv-section-head">
              <div className="mrv-step">1</div>
              <div>
                <h2 className="mrv-section-title">Project Information</h2>
                <p className="mrv-section-desc">
                  Provide the project name used by the existing analysis and Supabase save flow.
                </p>
              </div>
            </div>

            <div className="mrv-project-card">
              <label className="mrv-label">Project Name</label>
              <input
                className="mrv-input"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
          </section>

          {/* =================================================
              STEP 2 — MAP & AOI SELECTION
          ================================================= */}
          <section className="mrv-section">
            <div className="mrv-section-head">
              <div className="mrv-step">2</div>
              <div>
                <h2 className="mrv-section-title">Map & AOI Selection</h2>
                <p className="mrv-section-desc">
                  Draw your Area of Interest (AOI) on the map using the existing Leaflet tools.
                </p>
              </div>

              {aoi && (
                <div className="mrv-status-pill">
                  ✓ AOI Selected
                </div>
              )}
            </div>

            <div className="mrv-map-wrap">
              <MapContainer
                center={[19.0760, 72.8777]}
                zoom={10}
                className="mrv-map"
              >
                {mapType === "street" ? (
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                ) : (
                  <TileLayer
                    attribution="Tiles &copy; Esri"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                )}

                <div className="mrv-map-switcher">
                  <button
                    className={mapType === "street" ? "active" : ""}
                    onClick={() => setMapType("street")}
                  >
                    Street
                  </button>
                  <button
                    className={mapType === "satellite" ? "active" : ""}
                    onClick={() => setMapType("satellite")}
                  >
                    Satellite
                  </button>
                </div>

                <DrawControls onPolygonCreated={handlePolygonCreated} />
              </MapContainer>
            </div>

            {aoi && (
              <div className="mrv-aoi-panel">
                <div className="mrv-success">
                  <span>✓</span>
                  <span>Polygon successfully selected. Coordinates captured successfully.</span>
                </div>

                <div className="mrv-aoi-grid">
                  <div className="mrv-aoi-stat">
                    <small>AOI Area</small>
                    <strong>{formatNumber(mappedAreaHa, 4)} ha</strong>
                    <span>Mapped Area</span>
                  </div>

                  <div className="mrv-aoi-stat">
                    <small>Perimeter</small>
                    <strong>{formatNumber(perimeterKm, 2)} km</strong>
                    <span>Total Boundary</span>
                  </div>

                  <div className="mrv-aoi-stat">
                    <small>Coordinates</small>
                    <strong>{coordinateCount} Points</strong>
                    <span>Polygon Vertices</span>
                  </div>

                  <div className="mrv-aoi-stat">
                    <small>Map Projection</small>
                    <strong>{projectionLabel}</strong>
                    <span>{projectionCode}</span>
                  </div>
                </div>

                <pre className="mrv-coordinate-box">
{JSON.stringify(
  aoi[0].map((point) => ({
    lat: point.lat,
    lng: point.lng,
  })),
  null,
  2
)}
                </pre>

                <div className="mrv-actions">
                  <button
                    className="mrv-primary-btn"
                    onClick={sendAOIToBackend}
                    disabled={loading}
                  >
                    {loading ? "🔄 Analyzing..." : "🌿 Analyze Selected Area →"}
                  </button>
                </div>

                {loading && (
                  <div className="mrv-processing">
                    <div className="mrv-processing-text">
                      <span>Analysis & Processing</span>
                      <span>Processing...</span>
                    </div>
                    <div className="mrv-processing-track">
                      <div className="mrv-processing-bar" />
                    </div>
                    <div className="mrv-processing-text" style={{ marginTop: 8 }}>
                      <span>Fetching Sentinel-2 data, indices and carbon estimates...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* =================================================
              STEP 3 — ANALYSIS & PROCESSING
          ================================================= */}
          <section className="mrv-section">
            <div className="mrv-section-head">
              <div className="mrv-step">3</div>
              <div>
                <h2 className="mrv-section-title">Analysis & Processing</h2>
                <p className="mrv-section-desc">
                  Run satellite analysis and generate the existing environmental indices.
                </p>
              </div>
            </div>

            <div className="mrv-project-card">
              <div className="mrv-detail-grid" style={{ marginTop: 0 }}>
                <div className="mrv-detail">
                  <strong>🛰️ Sentinel-2 Data</strong>
                  <span>{loading ? "Processing" : result?.status === "success" ? "✓ Complete" : "Ready"}</span>
                </div>
                <div className="mrv-detail">
                  <strong>🌿 Index Calculation</strong>
                  <span>{loading ? "Processing" : result?.statistics ? "✓ Complete" : "Ready"}</span>
                </div>
                <div className="mrv-detail">
                  <strong>🌱 Mangrove Screening</strong>
                  <span>{loading ? "Processing" : result?.mangrove_screening ? "✓ Complete" : "Ready"}</span>
                </div>
                <div className="mrv-detail">
                  <strong>🌳 Carbon Estimation</strong>
                  <span>{loading ? "Processing" : result?.carbon_estimation ? "✓ Complete" : "Ready"}</span>
                </div>
              </div>

              {loading ? (
                <div className="mrv-processing">
                  <div className="mrv-processing-text">
                    <span>Processing Status</span>
                    <span>Running</span>
                  </div>
                  <div className="mrv-processing-track">
                    <div className="mrv-processing-bar" />
                  </div>
                  <div className="mrv-processing-text" style={{ marginTop: 8 }}>
                    <span>Analyzing spectral indices and estimating carbon stock...</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #2c333f",
                  background: "#131720",
                  color: "#7f8ba0",
                  fontSize: 11
                }}>
                  Select an AOI and use <strong style={{ color: "#bfc8d6" }}>Analyze Selected Area</strong> to start the existing backend pipeline.
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              STEP 4 — RESULTS OVERVIEW
              All backend response data is preserved.
          ================================================= */}
          {result && result.status === "success" && (
            <section className="mrv-section mrv-result">
              <div className="mrv-section-head">
                <div className="mrv-step">4</div>
                <div>
                  <h2 className="mrv-section-title">Results Overview</h2>
                  <p className="mrv-section-desc">
                    Analysis results, Sentinel-2 output, environmental indices and mangrove screening.
                  </p>
                </div>
              </div>

              <div className="mrv-success">
                <span>✓</span>
                <span>{result.message}</span>
              </div>

              {/* Sentinel-2 */}
              <div className="mrv-subsection">
                <h3 className="mrv-subsection-title">
                  <span>🛰️</span> Sentinel-2 Image
                </h3>

                <p className="mrv-success-text">✓ Downloaded successfully</p>
                <span className="mrv-file">File: {result.sentinel_image}</span>
              </div>

              {/* Environmental Indices */}
              {result.statistics && (
                <div className="mrv-subsection">
                  <h3 className="mrv-subsection-title">
                    <span>🌿</span> Environmental Indices
                  </h3>

                  <div className="mrv-index-grid">
                    <IndexCard
                      title="NDVI"
                      icon="🌿"
                      accent="green"
                      mean={result.statistics.ndvi.mean}
                      minimum={result.statistics.ndvi.minimum}
                      maximum={result.statistics.ndvi.maximum}
                    />

                    <IndexCard
                      title="NDWI"
                      icon="💧"
                      accent="blue"
                      mean={result.statistics.ndwi.mean}
                      minimum={result.statistics.ndwi.minimum}
                      maximum={result.statistics.ndwi.maximum}
                    />

                    <IndexCard
                      title="NDMI"
                      icon="💦"
                      accent="purple"
                      mean={result.statistics.ndmi.mean}
                      minimum={result.statistics.ndmi.minimum}
                      maximum={result.statistics.ndmi.maximum}
                    />
                  </div>
                </div>
              )}

              {/* Mangrove Screening */}
              {result.mangrove_screening && (
                <div className="mrv-subsection">
                  <div className="mrv-screening-header">
                    <span>🌱</span>
                    <span>Mangrove Screening</span>
                  </div>

                  <p className="mrv-screening-copy">
                    Potential mangrove areas identified using Sentinel-2 spectral indices.
                  </p>

                  <div className="mrv-card-grid">
                    <StatCard
                      icon="🌿"
                      title="Potential Mangrove"
                      accent="green"
                      value={`${formatNumber(
                        result.mangrove_screening.potential_mangrove_percentage,
                        2
                      )}%`}
                      subtitle="of valid pixels"
                    />

                    <StatCard
                      icon="📍"
                      title="Mangrove Pixels"
                      accent="blue"
                      value={formatNumber(
                        result.mangrove_screening.potential_mangrove_pixels,
                        0
                      )}
                      subtitle="potential pixels"
                    />

                    <StatCard
                      icon="📐"
                      title="Area"
                      accent="purple"
                      value={`${formatNumber(
                        result.mangrove_screening.potential_mangrove_area_m2,
                        2
                      )} m²`}
                      subtitle="potential mangrove area"
                    />

                    <StatCard
                      icon="🌍"
                      title="Area"
                      accent="blue"
                      value={`${formatNumber(
                        result.mangrove_screening.potential_mangrove_area_hectares,
                        4
                      )} ha`}
                      subtitle="hectares"
                    />
                  </div>

                  {/* Screening condition counts — preserved */}
                  {result.mangrove_screening.condition_counts && (
                    <div className="mrv-threshold-wrap">
                      <h4 className="mrv-threshold-title">📊 Screening Details</h4>

                      <div className="mrv-detail-grid">
                        <div className="mrv-detail">
                          <strong>NDVI passed</strong>
                          <span>
                            {formatNumber(
                              result.mangrove_screening.condition_counts.ndvi_passed,
                              0
                            )}
                          </span>
                        </div>

                        <div className="mrv-detail">
                          <strong>NDWI passed</strong>
                          <span>
                            {formatNumber(
                              result.mangrove_screening.condition_counts.ndwi_passed,
                              0
                            )}
                          </span>
                        </div>

                        <div className="mrv-detail">
                          <strong>NDMI passed</strong>
                          <span>
                            {formatNumber(
                              result.mangrove_screening.condition_counts.ndmi_passed,
                              0
                            )}
                          </span>
                        </div>

                        <div className="mrv-detail">
                          <strong>All conditions passed</strong>
                          <span>
                            {formatNumber(
                              result.mangrove_screening.condition_counts.all_three_passed,
                              0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Screening thresholds — preserved exactly from backend */}
                  {result.mangrove_screening?.thresholds && (
                    <div className="mrv-threshold-wrap">
                      <h4 className="mrv-threshold-title">🎯 Screening Thresholds</h4>

                      <div className="mrv-threshold-grid">
                        {result.mangrove_screening.thresholds.potential && (
                          <div className="mrv-threshold">
                            <h4>🌱 Potential</h4>
                            <p>
                              NDVI ≥ {result.mangrove_screening.thresholds.potential.ndvi_min}
                            </p>
                            <p>
                              NDWI ≥ {result.mangrove_screening.thresholds.potential.ndwi_min}
                            </p>
                            <p>
                              NDMI ≥ {result.mangrove_screening.thresholds.potential.ndmi_min}
                            </p>
                          </div>
                        )}

                        {result.mangrove_screening.thresholds.moderate && (
                          <div className="mrv-threshold">
                            <h4>🟡 Moderate</h4>
                            <p>
                              NDVI ≥ {result.mangrove_screening.thresholds.moderate.ndvi_min}
                            </p>
                            <p>
                              NDWI ≥ {result.mangrove_screening.thresholds.moderate.ndwi_min}
                            </p>
                            <p>
                              NDMI ≥ {result.mangrove_screening.thresholds.moderate.ndmi_min}
                            </p>
                          </div>
                        )}

                        {result.mangrove_screening.thresholds.high && (
                          <div className="mrv-threshold">
                            <h4>🟢 High Confidence</h4>
                            <p>
                              NDVI ≥ {result.mangrove_screening.thresholds.high.ndvi_min}
                            </p>
                            <p>
                              NDWI ≥ {result.mangrove_screening.thresholds.high.ndwi_min}
                            </p>
                            <p>
                              NDMI ≥ {result.mangrove_screening.thresholds.high.ndmi_min}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Potential Mangrove Mask — preserved */}
                  <div className="mrv-mask">
                    <h4>🗺️ Potential Mangrove Mask</h4>
                    <p>Mask generated successfully.</p>
                    <code>{result.mangrove_screening.mask_file}</code>
                  </div>
                </div>
              )}

              {/* =================================================
                  CARBON ESTIMATION — preserved
              ================================================= */}
              {result.carbon_estimation && (
                <div className="mrv-carbon">
                  <div className="mrv-carbon-head">
                    <h3>🌱 Carbon Estimation</h3>
                    <p>
                      Area-based estimation of mangrove carbon stock and CO₂ equivalent.
                    </p>
                  </div>

                  <div className="mrv-card-grid">
                    <StatCard
                      icon="🌿"
                      title="Mangrove Area"
                      accent="green"
                      value={`${formatNumber(
                        result.carbon_estimation.mangrove_area_hectares,
                        4
                      )} ha`}
                      subtitle="potential mangrove area"
                    />

                    <StatCard
                      icon="📊"
                      title="Carbon Stock Factor"
                      accent="purple"
                      value={`${formatNumber(
                        result.carbon_estimation.carbon_stock_factor_t_c_per_ha,
                        1
                      )} t C/ha`}
                      subtitle="default carbon stock factor"
                    />

                    <StatCard
                      icon="🌳"
                      title="Estimated Carbon Stock"
                      accent="green"
                      value={`${formatNumber(
                        result.carbon_estimation.estimated_carbon_tonnes,
                        2
                      )} t C`}
                      subtitle="estimated carbon"
                    />

                    <StatCard
                      icon="🌍"
                      title="CO₂ Equivalent"
                      accent="blue"
                      value={`${formatNumber(
                        result.carbon_estimation.estimated_co2e_tonnes,
                        2
                      )} t CO₂e`}
                      subtitle="estimated CO₂ equivalent"
                    />
                  </div>

                  {/* Methodology — preserved */}
                  <div className="mrv-methodology">
                    <h4>📋 Methodology</h4>

                    <p>{result.carbon_estimation.methodology}</p>

                    <p>
                      <strong>Carbon Stock Source:</strong>{" "}
                      {result.carbon_estimation.carbon_stock_source}
                    </p>

                    <p>
                      <strong>Carbon Stock Scope:</strong>{" "}
                      {result.carbon_estimation.carbon_stock_scope}
                    </p>
                  </div>

                  {/* Accuracy note — preserved */}
                  <div className="mrv-note">
                    ⚠️ {result.carbon_estimation.note}
                  </div>
                </div>
              )}

              {/* Valid Pixels — preserved */}
              {result.statistics && (
                <div className="mrv-valid">
                  <div className="mrv-valid-label">📍 Valid Pixels</div>
                  <div className="mrv-valid-value">
                    {formatNumber(result.statistics.valid_pixels, 0)}
                  </div>
                </div>
              )}

              <div className="mrv-next">
                <div className="mrv-next-label">➡️ Next Step</div>
                <div className="mrv-next-value">
                  🌱 {result.next_step || "Carbon Estimation"}
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              STEP 5 — MRV REPORT
              Existing report endpoint + Supabase save flow unchanged.
          ================================================= */}
          {result && result.status === "success" && (
            <section className="mrv-section">
              <div className="mrv-section-head">
                <div className="mrv-step">5</div>
                <div>
                  <h2 className="mrv-section-title">MRV Report & Save</h2>
                  <p className="mrv-section-desc">
                    Generate the existing MRV report and keep the existing evidence-save flow.
                  </p>
                </div>
              </div>

              <div className="mrv-project-card">
                <div className="mrv-report-actions">
                  <button
                    className="mrv-report-btn"
                    onClick={generateMRVReport}
                  >
                    📄 Generate & Download MRV Report →
                  </button>
                </div>

                <div className="mrv-detail-grid">
                  <div className="mrv-detail">
                    <strong>🗺️ AOI</strong>
                    <span>✓ Selected</span>
                  </div>
                  <div className="mrv-detail">
                    <strong>🛰️ Satellite</strong>
                    <span>✓ Sentinel-2</span>
                  </div>
                  <div className="mrv-detail">
                    <strong>🌿 Analysis</strong>
                    <span>✓ Complete</span>
                  </div>
                  <div className="mrv-detail">
                    <strong>🔐 Evidence</strong>
                    <span>Supabase flow</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              ERROR RESULT
          ================================================= */}
          {result && result.status === "error" && (
            <div className="mrv-error">
              <h3>❌ Analysis Failed</h3>
              <p>{result.message}</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default MapSelector;
