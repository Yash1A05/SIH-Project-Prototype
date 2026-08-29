import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

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

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          marginBottom: "8px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#1f2937",
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            marginTop: "5px",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}


// =========================================================
// INDEX CARD
// =========================================================

function IndexCard({
  title,
  icon,
  mean,
  minimum,
  maximum,
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <h4
        style={{
          marginTop: 0,
          fontSize: "18px",
          color: "#374151",
        }}
      >
        {icon} {title}
      </h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
        }}
      >
        <div>
          <small>Mean</small>
          <div style={{ fontWeight: "700" }}>
            {Number(mean).toFixed(4)}
          </div>
        </div>

        <div>
          <small>Min</small>
          <div style={{ fontWeight: "700" }}>
            {Number(minimum).toFixed(4)}
          </div>
        </div>

        <div>
          <small>Max</small>
          <div style={{ fontWeight: "700" }}>
            {Number(maximum).toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
}


// =========================================================
// MAIN COMPONENT
// =========================================================

function MapSelector() {
  const [aoi, setAoi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >

      {/* =================================================
          PROFESSIONAL REPORT TOAST
      ================================================= */}

      {reportToast && (
        <div
          style={{
            position: "fixed",
            top: "25px",
            right: "25px",
            zIndex: 9999,
            width: "360px",
            maxWidth: "calc(100vw - 40px)",
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
            border:
              reportToast.type === "success"
                ? "1px solid #86efac"
                : "1px solid #fecaca",
            borderLeft:
              reportToast.type === "success"
                ? "5px solid #16a34a"
                : "5px solid #dc2626",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >

            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background:
                  reportToast.type === "success"
                    ? "#dcfce7"
                    : "#fee2e2",
                color:
                  reportToast.type === "success"
                    ? "#15803d"
                    : "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {reportToast.type === "success" ? "✓" : "!"}
            </div>

            <div
              style={{
                flex: 1,
              }}
            >

              <div
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color:
                    reportToast.type === "success"
                      ? "#166534"
                      : "#991b1b",
                  marginBottom: "5px",
                }}
              >
                {reportToast.title}
              </div>

              <div
                style={{
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "#4b5563",
                }}
              >
                {reportToast.message}
              </div>

              {reportToast.reportId && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <strong>Report ID:</strong>{" "}
                  {reportToast.reportId}
                </div>
              )}

            </div>

            <button
              onClick={() => setReportToast(null)}
              style={{
                border: "none",
                background: "transparent",
                color: "#9ca3af",
                fontSize: "20px",
                cursor: "pointer",
                padding: "0",
                lineHeight: "1",
              }}
              title="Close"
            >
              ×
            </button>

          </div>

        </div>
      )}


      {/* =================================================
          HEADER
      ================================================= */}

      <h2
        style={{
          textAlign: "center",
          color: "#374151",
          marginBottom: "8px",
        }}
      >
        🌊 Select Mangrove / Coastal Area
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#6b7280",
          marginBottom: "20px",
        }}
      >
        Use the polygon tool on the map to select your
        Area of Interest (AOI).
      </p>


      {/* =================================================
          MAP
      ================================================= */}

      <MapContainer
        center={[19.0760, 72.8777]}
        zoom={10}
        style={{
          height: "600px",
          width: "100%",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DrawControls
          onPolygonCreated={handlePolygonCreated}
        />

      </MapContainer>


      {/* =================================================
          AOI SELECTED
      ================================================= */}

      {aoi && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >

          <h3
            style={{
              color: "#374151",
              marginTop: 0,
            }}
          >
            ✅ AOI Selected
          </h3>

          <p style={{ color: "#6b7280" }}>
            Polygon successfully selected.
          </p>

          <p style={{ color: "#6b7280" }}>
            Coordinates captured successfully.
          </p>


          {/* Coordinates */}

          <pre
            style={{
              maxHeight: "180px",
              overflow: "auto",
              fontSize: "12px",
              background: "#ffffff",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            {JSON.stringify(
              aoi[0].map((point) => ({
                lat: point.lat,
                lng: point.lng,
              })),
              null,
              2
            )}
          </pre>


          {/* =================================================
              ANALYZE BUTTON
          ================================================= */}

          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
            }}
          >

            <button
              onClick={sendAOIToBackend}
              disabled={loading}
              style={{
                padding: "13px 24px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#ffffff",
                background: loading
                  ? "#9ca3af"
                  : "#4b5563",
                border: "none",
                borderRadius: "6px",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "🔄 Analyzing..."
                : "🌿 Analyze Selected Area"}
            </button>

          </div>


          {/* =================================================
              ANALYSIS RESULT
          ================================================= */}

          {result && result.status === "success" && (
            <div
              style={{
                marginTop: "30px",
                background: "#ffffff",
                borderRadius: "14px",
                padding: "25px",
                border: "1px solid #e5e7eb",
                boxShadow:
                  "0 4px 15px rgba(0,0,0,0.06)",
              }}
            >

              {/* HEADER */}

              <h2
                style={{
                  textAlign: "center",
                  color: "#374151",
                  marginTop: 0,
                }}
              >
                📊 Analysis Result
              </h2>


              <div
                style={{
                  textAlign: "center",
                  color: "#16a34a",
                  fontWeight: "600",
                  marginBottom: "25px",
                }}
              >
                ✅ {result.message}
              </div>


              {/* =================================================
                  SENTINEL IMAGE
              ================================================= */}

              <div
                style={{
                  marginBottom: "30px",
                }}
              >

                <h3>🛰️ Sentinel-2 Image</h3>

                <p
                  style={{
                    color: "#16a34a",
                    fontWeight: "600",
                  }}
                >
                  ✓ Downloaded successfully
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  File: {result.sentinel_image}
                </p>

              </div>


              {/* =================================================
                  VEGETATION / WATER / MOISTURE
              ================================================= */}

              {result.statistics && (
                <div>

                  <h3
                    style={{
                      marginBottom: "15px",
                    }}
                  >
                    🌿 Environmental Indices
                  </h3>


                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "15px",
                    }}
                  >

                    <IndexCard
                      title="NDVI"
                      icon="🌿"
                      mean={
                        result.statistics.ndvi.mean
                      }
                      minimum={
                        result.statistics.ndvi.minimum
                      }
                      maximum={
                        result.statistics.ndvi.maximum
                      }
                    />


                    <IndexCard
                      title="NDWI"
                      icon="💧"
                      mean={
                        result.statistics.ndwi.mean
                      }
                      minimum={
                        result.statistics.ndwi.minimum
                      }
                      maximum={
                        result.statistics.ndwi.maximum
                      }
                    />


                    <IndexCard
                      title="NDMI"
                      icon="💦"
                      mean={
                        result.statistics.ndmi.mean
                      }
                      minimum={
                        result.statistics.ndmi.minimum
                      }
                      maximum={
                        result.statistics.ndmi.maximum
                      }
                    />

                  </div>

                </div>
              )}


              {/* =================================================
                  MANGROVE SCREENING
              ================================================= */}

              {result.mangrove_screening && (
                <div
                  style={{
                    marginTop: "35px",
                    paddingTop: "25px",
                    borderTop:
                      "1px solid #e5e7eb",
                  }}
                >

                  <h3
                    style={{
                      fontSize: "22px",
                      color: "#166534",
                      marginBottom: "8px",
                    }}
                  >
                    🌿 Mangrove Screening
                  </h3>

                  <p
                    style={{
                      color: "#6b7280",
                      marginBottom: "20px",
                    }}
                  >
                    Potential mangrove areas identified
                    using Sentinel-2 spectral indices.
                  </p>


                  {/* SCREENING CARDS */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "15px",
                    }}
                  >

                    <StatCard
                      icon="🌿"
                      title="Potential Mangrove"
                      value={`${formatNumber(
                        result.mangrove_screening
                          .potential_mangrove_percentage,
                        2
                      )}%`}
                      subtitle="of valid pixels"
                    />


                    <StatCard
                      icon="📍"
                      title="Mangrove Pixels"
                      value={formatNumber(
                        result.mangrove_screening
                          .potential_mangrove_pixels,
                        0
                      )}
                      subtitle="potential pixels"
                    />


                    <StatCard
                      icon="📐"
                      title="Area"
                      value={`${formatNumber(
                        result.mangrove_screening
                          .potential_mangrove_area_m2,
                        2
                      )} m²`}
                      subtitle="potential mangrove area"
                    />


                    <StatCard
                      icon="🌍"
                      title="Area"
                      value={`${formatNumber(
                        result.mangrove_screening
                          .potential_mangrove_area_hectares,
                        4
                      )} ha`}
                      subtitle="hectares"
                    />

                  </div>


                  {/* =================================================
                      SCREENING LEVELS
                  ================================================= */}

                  {result.mangrove_screening
                    .condition_counts && (
                    <div
                      style={{
                        marginTop: "25px",
                        padding: "20px",
                        background: "#f8fafc",
                        borderRadius: "10px",
                      }}
                    >

                      <h4>
                        📊 Screening Details
                      </h4>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "12px",
                        }}
                      >

                        <div>
                          <strong>
                            NDVI passed
                          </strong>

                          <div>
                            {formatNumber(
                              result
                                .mangrove_screening
                                .condition_counts
                                .ndvi_passed,
                              0
                            )}
                          </div>
                        </div>


                        <div>
                          <strong>
                            NDWI passed
                          </strong>

                          <div>
                            {formatNumber(
                              result
                                .mangrove_screening
                                .condition_counts
                                .ndwi_passed,
                              0
                            )}
                          </div>
                        </div>


                        <div>
                          <strong>
                            NDMI passed
                          </strong>

                          <div>
                            {formatNumber(
                              result
                                .mangrove_screening
                                .condition_counts
                                .ndmi_passed,
                              0
                            )}
                          </div>
                        </div>


                        <div>
                          <strong>
                            All conditions passed
                          </strong>

                          <div>
                            {formatNumber(
                              result
                                .mangrove_screening
                                .condition_counts
                                .all_three_passed,
                              0
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  )}


                  {/* =================================================
                      SCREENING THRESHOLDS
                  ================================================= */}

                  {result.mangrove_screening?.thresholds && (
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "20px",
                        background: "#f9fafb",
                        borderRadius: "10px",
                      }}
                    >

                      <h4
                        style={{
                          textAlign: "center",
                          marginBottom: "20px",
                        }}
                      >
                        🎯 Screening Thresholds
                      </h4>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "15px",
                        }}
                      >

                        {/* POTENTIAL */}

                        {result.mangrove_screening.thresholds.potential && (
                          <div
                            style={{
                              background: "#ffffff",
                              padding: "15px",
                              borderRadius: "10px",
                              border: "1px solid #e5e7eb",
                            }}
                          >

                            <h4>🌱 Potential</h4>

                            <p>
                              NDVI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.potential.ndvi_min
                              }
                            </p>

                            <p>
                              NDWI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.potential.ndwi_min
                              }
                            </p>

                            <p>
                              NDMI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.potential.ndmi_min
                              }
                            </p>

                          </div>
                        )}


                        {/* MODERATE */}

                        {result.mangrove_screening.thresholds.moderate && (
                          <div
                            style={{
                              background: "#ffffff",
                              padding: "15px",
                              borderRadius: "10px",
                              border: "1px solid #e5e7eb",
                            }}
                          >

                            <h4>🟡 Moderate</h4>

                            <p>
                              NDVI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.moderate.ndvi_min
                              }
                            </p>

                            <p>
                              NDWI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.moderate.ndwi_min
                              }
                            </p>

                            <p>
                              NDMI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.moderate.ndmi_min
                              }
                            </p>

                          </div>
                        )}


                        {/* HIGH */}

                        {result.mangrove_screening.thresholds.high && (
                          <div
                            style={{
                              background: "#ffffff",
                              padding: "15px",
                              borderRadius: "10px",
                              border: "1px solid #e5e7eb",
                            }}
                          >

                            <h4>🟢 High Confidence</h4>

                            <p>
                              NDVI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.high.ndvi_min
                              }
                            </p>

                            <p>
                              NDWI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.high.ndwi_min
                              }
                            </p>

                            <p>
                              NDMI ≥{" "}
                              {
                                result.mangrove_screening
                                  .thresholds.high.ndmi_min
                              }
                            </p>

                          </div>
                        )}

                      </div>

                    </div>
                  )}


                  {/* =================================================
                      MASK
                  ================================================= */}

                  <div
                    style={{
                      marginTop: "20px",
                      padding: "18px",
                      background: "#f0fdf4",
                      borderRadius: "10px",
                      border:
                        "1px solid #bbf7d0",
                    }}
                  >

                    <h4
                      style={{
                        color: "#166534",
                      }}
                    >
                      🗺️ Potential Mangrove Mask
                    </h4>

                    <p
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                      }}
                    >
                      Mask generated successfully.
                    </p>

                    <code>
                      {
                        result.mangrove_screening
                          .mask_file
                      }
                    </code>

                  </div>

                </div>
              )}

              {/* =================================================
                  CARBON ESTIMATION
              ================================================= */}

              {result.carbon_estimation && (
                <div
                  style={{
                    marginTop: "30px",
                    padding: "25px",
                    background: "#f0fdf4",
                    borderRadius: "12px",
                    border: "1px solid #bbf7d0",
                  }}
                >

                  <h3
                    style={{
                      textAlign: "center",
                      color: "#166534",
                      fontSize: "26px",
                      marginBottom: "10px",
                    }}
                  >
                    🌱 Carbon Estimation
                  </h3>

                  <p
                    style={{
                      textAlign: "center",
                      color: "#4b5563",
                      marginBottom: "25px",
                    }}
                  >
                    Area-based estimation of mangrove carbon stock and
                    CO₂ equivalent.
                  </p>

                  {/* =========================================
                      MRV REPORT BUTTON
                  ========================================= */}

                  {result &&
                    result.status === "success" && (

                    <div
                      style={{
                        marginTop: "20px",
                        textAlign: "center",
                      }}
                    >

                      <button
                        onClick={generateMRVReport}
                        style={{
                          padding: "14px 24px",
                          fontSize: "16px",
                          fontWeight: "700",
                          cursor: "pointer",
                          border: "none",
                          borderRadius: "10px",
                          background: "#166534",
                          color: "#ffffff",
                        }}
                      >
                        📄 Generate & Download MRV Report
                      </button>

                    </div>

                  )}

                  {/* ================================
                      CARBON ESTIMATION CARDS
                  ================================= */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "15px",
                    }}
                  >

                    {/* MANGROVE AREA */}

                    <div
                      style={{
                        background: "#ffffff",
                        padding: "20px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "30px" }}>
                        🌿
                      </div>

                      <h4>Mangrove Area</h4>

                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                        }}
                      >
                        {formatNumber(
                          result.carbon_estimation
                            .mangrove_area_hectares,
                          4
                        )}{" "}
                        ha
                      </div>

                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        potential mangrove area
                      </p>
                    </div>


                    {/* CARBON STOCK FACTOR */}

                    <div
                      style={{
                        background: "#ffffff",
                        padding: "20px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "30px" }}>
                        📊
                      </div>

                      <h4>Carbon Stock Factor</h4>

                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                        }}
                      >
                        {formatNumber(
                          result.carbon_estimation
                            .carbon_stock_factor_t_c_per_ha,
                          1
                        )}{" "}
                        t C/ha
                      </div>

                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        default carbon stock factor
                      </p>
                    </div>


                    {/* ESTIMATED CARBON */}

                    <div
                      style={{
                        background: "#ffffff",
                        padding: "20px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "30px" }}>
                        🌳
                      </div>

                      <h4>Estimated Carbon Stock</h4>

                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                        }}
                      >
                        {formatNumber(
                          result.carbon_estimation
                            .estimated_carbon_tonnes,
                          2
                        )}{" "}
                        t C
                      </div>

                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        estimated carbon
                      </p>
                    </div>


                    {/* CO2 EQUIVALENT */}

                    <div
                      style={{
                        background: "#ffffff",
                        padding: "20px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "30px" }}>
                        🌍
                      </div>

                      <h4>CO₂ Equivalent</h4>

                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                        }}
                      >
                        {formatNumber(
                          result.carbon_estimation
                            .estimated_co2e_tonnes,
                          2
                        )}{" "}
                        t CO₂e
                      </div>

                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        estimated CO₂ equivalent
                      </p>
                    </div>

                  </div>


                  {/* =================================
                      METHODOLOGY
                  ================================= */}

                  <div
                    style={{
                      marginTop: "25px",
                      padding: "18px",
                      background: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                    }}
                  >

                    <h4
                      style={{
                        color: "#166534",
                      }}
                    >
                      📋 Methodology
                    </h4>

                    <p>
                      {result.carbon_estimation.methodology}
                    </p>

                    <p>
                      <strong>Carbon Stock Source:</strong>{" "}
                      {result.carbon_estimation.carbon_stock_source}
                    </p>

                    <p>
                      <strong>Carbon Stock Scope:</strong>{" "}
                      {result.carbon_estimation.carbon_stock_scope}
                    </p>

                  </div>


                  {/* =================================
                      NOTE
                  ================================= */}

                  <div
                    style={{
                      marginTop: "15px",
                      padding: "15px",
                      background: "#fffbeb",
                      borderRadius: "8px",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      fontSize: "13px",
                    }}
                  >
                    ⚠️ {result.carbon_estimation.note}
                  </div>

                </div>
              )}


              {/* =================================================
                  VALID PIXELS
              ================================================= */}

              {result.statistics && (
                <div
                  style={{
                    marginTop: "25px",
                    padding: "18px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    textAlign: "center",
                  }}
                >

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    📍 Valid Pixels
                  </div>

                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: "700",
                      marginTop: "5px",
                    }}
                  >
                    {formatNumber(
                      result.statistics.valid_pixels,
                      0
                    )}
                  </div>

                </div>
              )}


              {/* =================================================
                  NEXT STEP
              ================================================= */}

              <div
                style={{
                  marginTop: "30px",
                  padding: "20px",
                  background: "#f0fdf4",
                  borderRadius: "12px",
                  border:
                    "1px solid #bbf7d0",
                  textAlign: "center",
                }}
              >

                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "5px",
                  }}
                >
                  ➡️ Next Step
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    color: "#166534",
                  }}
                >
                  🌱{" "}
                  {result.next_step ||
                    "Carbon Estimation"}
                </div>

              </div>

            </div>
          )}


          {/* =================================================
              ERROR RESULT
          ================================================= */}

          {result && result.status === "error" && (
            <div
              style={{
                marginTop: "25px",
                padding: "20px",
                background: "#fef2f2",
                color: "#b91c1c",
                borderRadius: "10px",
                border:
                  "1px solid #fecaca",
              }}
            >

              <h3>❌ Analysis Failed</h3>

              <p>{result.message}</p>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default MapSelector;