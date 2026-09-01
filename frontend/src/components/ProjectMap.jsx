import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  LayersControl,
  useMap,
} from "react-leaflet";

import { supabase } from "../supabaseClient";

import "leaflet/dist/leaflet.css";

// =====================================================
// STATUS CONFIG
// =====================================================

const STATUS_CONFIG = {
  completed: {
    label: "Verified",
    color: "#22c55e",
  },

  verified: {
    label: "Verified",
    color: "#22c55e",
  },

  "under verification": {
    label: "Under Verification",
    color: "#3b82f6",
  },

  "in progress": {
    label: "In Progress",
    color: "#eab308",
  },

  rejected: {
    label: "Rejected",
    color: "#ef4444",
  },
};

// =====================================================
// MAP RESIZE HANDLER
// =====================================================

function MapResizeHandler({ fullscreen }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [fullscreen, map]);

  return null;
}

// =====================================================
// FIT MAP TO PROJECT LOCATIONS
// =====================================================

function FitProjects({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (!locations || locations.length === 0) {
      return;
    }

    const bounds = locations.map(
      (project) => project.coordinates
    );

    if (bounds.length === 1) {
      map.setView(bounds[0], 8);
    } else {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 8,
      });
    }
  }, [locations, map]);

  return null;
}

// =====================================================
// GET CENTER FROM AOI POLYGON
// =====================================================

function getPolygonCenter(polygon) {
  try {
    if (!polygon) {
      return null;
    }

    let data = polygon;

    // -------------------------------------------------
    // JSON string
    // -------------------------------------------------

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (error) {
        console.error("Polygon JSON parse error:", error);
        return null;
      }
    }

    // -------------------------------------------------
    // GeoJSON Feature / FeatureCollection
    // -------------------------------------------------

    if (data?.type === "Feature") {
      data = data.geometry;
    }

    if (data?.type === "FeatureCollection") {
      data = data.features?.[0]?.geometry;
    }

    // -------------------------------------------------
    // GeoJSON Polygon / MultiPolygon
    // -------------------------------------------------

    if (data?.type === "Polygon") {
      data = data.coordinates?.[0];
    }

    if (data?.type === "MultiPolygon") {
      data = data.coordinates?.[0]?.[0];
    }

    // -------------------------------------------------
    // Some saved AOIs are wrapped inside an object
    // -------------------------------------------------

    if (data?.coordinates && Array.isArray(data.coordinates)) {
      data = data.coordinates;
    }

    if (data?.polygon && Array.isArray(data.polygon)) {
      data = data.polygon;
    }

    if (!Array.isArray(data)) {
      console.log("Invalid polygon:", polygon);
      return null;
    }

    // -------------------------------------------------
    // Extract coordinate points from ANY nested format
    // Supports:
    //   { lat, lng }
    //   { latitude, longitude }
    //   [lat, lng]       (Leaflet style)
    //   [lng, lat]       (GeoJSON style)
    //   deeply nested arrays
    // -------------------------------------------------

    const points = [];

    const addPoint = (lat, lng) => {
      lat = Number(lat);
      lng = Number(lng);

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        points.push([lat, lng]);
      }
    };

    const collectPoints = (value) => {
      if (!value) return;

      // -----------------------------------------------
      // Leaflet LatLng object
      // -----------------------------------------------

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Number.isFinite(Number(value.lat)) &&
        Number.isFinite(Number(value.lng))
      ) {
        addPoint(value.lat, value.lng);
        return;
      }

      // -----------------------------------------------
      // latitude / longitude object
      // -----------------------------------------------

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Number.isFinite(Number(value.latitude)) &&
        Number.isFinite(Number(value.longitude))
      ) {
        addPoint(value.latitude, value.longitude);
        return;
      }

      // -----------------------------------------------
      // Coordinate array
      // -----------------------------------------------

      if (Array.isArray(value)) {
        if (
          value.length >= 2 &&
          !Array.isArray(value[0]) &&
          !Array.isArray(value[1]) &&
          !value[0]?.lat &&
          !value[0]?.lng
        ) {
          const a = Number(value[0]);
          const b = Number(value[1]);

          if (Number.isFinite(a) && Number.isFinite(b)) {
            // India-friendly detection:
            // GeoJSON: [longitude, latitude]  -> [73, 18]
            // Leaflet: [latitude, longitude]  -> [18, 73]
            if (
              Math.abs(a) > 60 &&
              Math.abs(b) <= 40
            ) {
              addPoint(b, a);
            } else if (
              Math.abs(b) > 60 &&
              Math.abs(a) <= 40
            ) {
              addPoint(a, b);
            } else {
              // Default to GeoJSON when ambiguous.
              addPoint(b, a);
            }

            return;
          }
        }

        value.forEach(collectPoints);
        return;
      }

      // -----------------------------------------------
      // Object containing coordinates / polygon
      // -----------------------------------------------

      if (typeof value === "object") {
        if (Array.isArray(value.coordinates)) {
          collectPoints(value.coordinates);
        } else if (Array.isArray(value.polygon)) {
          collectPoints(value.polygon);
        }
      }
    };

    collectPoints(data);

    // -------------------------------------------------
    // Remove duplicate points
    // -------------------------------------------------

    const uniquePoints = points.filter(
      (point, index, array) =>
        index ===
        array.findIndex(
          (item) =>
            item[0] === point[0] &&
            item[1] === point[1]
        )
    );

    if (uniquePoints.length === 0) {
      console.log(
        "❌ No valid polygon coordinates:",
        polygon
      );
      return null;
    }

    // -------------------------------------------------
    // Calculate polygon center
    // -------------------------------------------------

    let latitude = 0;
    let longitude = 0;

    uniquePoints.forEach(([lat, lng]) => {
      latitude += lat;
      longitude += lng;
    });

    latitude /= uniquePoints.length;
    longitude /= uniquePoints.length;

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      console.log(
        "❌ Invalid center coordinates:",
        latitude,
        longitude
      );
      return null;
    }

    console.log(
      "📍 Polygon center:",
      latitude,
      longitude
    );

    return [latitude, longitude];

  } catch (error) {
    console.error(
      "Polygon parsing error:",
      error
    );

    return null;
  }
}


// =====================================================
// GET COORDINATES FROM LOCATION
// =====================================================

function getLocationCoordinates(location) {
  if (!location) {
    return null;
  }

  try {
    // -------------------------------------------------
    // Object
    // -------------------------------------------------

    if (
      typeof location === "object"
    ) {
      if (
        Number.isFinite(
          Number(location.lat)
        ) &&
        Number.isFinite(
          Number(location.lng)
        )
      ) {
        return [
          Number(location.lat),
          Number(location.lng),
        ];
      }

      if (
        Number.isFinite(
          Number(location.latitude)
        ) &&
        Number.isFinite(
          Number(location.longitude)
        )
      ) {
        return [
          Number(location.latitude),
          Number(location.longitude),
        ];
      }

      // GeoJSON Point
      if (
        location.type === "Point" &&
        Array.isArray(
          location.coordinates
        )
      ) {
        const lng =
          Number(
            location.coordinates[0]
          );

        const lat =
          Number(
            location.coordinates[1]
          );

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        ) {
          return [lat, lng];
        }
      }
    }

    // -------------------------------------------------
    // String:
    // "18.5204,73.8567"
    // -------------------------------------------------

    if (
      typeof location === "string"
    ) {
      const trimmed =
        location.trim();

      // Try JSON first
      if (
        trimmed.startsWith("{") ||
        trimmed.startsWith("[")
      ) {
        try {
          const parsed =
            JSON.parse(trimmed);

          return getLocationCoordinates(
            parsed
          );
        } catch {
          // Continue below
        }
      }

      const parts =
        trimmed
          .split(",")
          .map((item) =>
            Number(item.trim())
          );

      if (
        parts.length >= 2 &&
        Number.isFinite(parts[0]) &&
        Number.isFinite(parts[1])
      ) {
        return [
          parts[0],
          parts[1],
        ];
      }
    }

  } catch (error) {
    console.error(
      "Location coordinates error:",
      error
    );
  }

  return null;
}

// =====================================================
// PROJECT MAP
// =====================================================

export default function ProjectMap() {

  // ===================================================
  // STATES
  // ===================================================

  const [projects, setProjects] =
    useState([]);

  const [aoiRecords, setAoiRecords] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [fullscreen, setFullscreen] =
    useState(false);

  // ===================================================
  // FETCH PROJECTS + AOI
  // ===================================================

  useEffect(() => {

    const fetchMapData = async () => {

      try {

        setLoading(true);

        // ---------------------------------------------
        // Logged-in user
        // ---------------------------------------------

        const {
          data: {
            user,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          console.error(
            "User fetch error:",
            userError
          );

          return;
        }

        if (!user) {
          console.error(
            "No logged-in user found."
          );

          return;
        }

        // ---------------------------------------------
        // PROJECTS
        // ---------------------------------------------

        const {
          data: projectData,
          error: projectError,
        } =
          await supabase
            .from("projects")
            .select(
              `
                id,
                project_name,
                description,
                location,
                status,
                created_at
              `
            )
            .eq(
              "user_id",
              user.id
            );

        if (projectError) {

          console.error(
            "Projects fetch error:",
            projectError
          );

          return;
        }

        // ---------------------------------------------
        // AOI RECORDS
        // ---------------------------------------------

        const {
          data: aoiData,
          error: aoiError,
        } =
          await supabase
            .from("aoi_records")
            .select(
              `
                id,
                project_id,
                polygon,
                location,
                area_hectares
              `
            )
            .eq(
              "user_id",
              user.id
            );

        if (aoiError) {

          console.error(
            "AOI fetch error:",
            aoiError
          );

          return;
        }

        console.log(
          "🗺️ Project map projects:",
          projectData
        );

        console.log(
          "🗺️ Project map AOIs:",
          aoiData
        );

        setProjects(
          projectData || []
        );

        setAoiRecords(
          aoiData || []
        );

      } catch (error) {

        console.error(
          "Project map error:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

    fetchMapData();

  }, []);

  // ===================================================
  // CREATE ACTUAL PROJECT LOCATIONS
  // ===================================================

  const projectLocations =
    useMemo(() => {

      const locations = [];

      projects.forEach(
        (project) => {

          // -------------------------------------------
          // Find AOI belonging to project
          // -------------------------------------------

          const aoi =
            aoiRecords.find(
              (record) =>
                String(
                  record.project_id
                ) ===
                String(
                  project.id
                )
            );

          console.log(
            "PROJECT:",
            project.project_name
          );

          console.log(
            "PROJECT ID:",
            project.id
          );

          console.log(
            "AOI:",
            aoi
          );

          // -------------------------------------------
          // FIRST:
          // AOI Polygon
          // -------------------------------------------

          let coordinates =
            getPolygonCenter(
              aoi?.polygon
            );

          // -------------------------------------------
          // SECOND:
          // AOI location
          // -------------------------------------------

          if (
            !coordinates &&
            aoi?.location
          ) {
            coordinates =
              getLocationCoordinates(
                aoi.location
              );
          }

          // -------------------------------------------
          // THIRD:
          // Project location
          // -------------------------------------------

          if (
            !coordinates &&
            project.location
          ) {
            coordinates =
              getLocationCoordinates(
                project.location
              );
          }

          // -------------------------------------------
          // No coordinates
          // -------------------------------------------

          if (!coordinates) {

            console.log(
              "❌ No coordinates for:",
              project.project_name
            );

            return;
          }

          // -------------------------------------------
          // STATUS
          // -------------------------------------------

          const rawStatus =
            String(
              project.status || ""
            )
              .trim()
              .toLowerCase();

          const status =
            STATUS_CONFIG[
              rawStatus
            ] || {
              label:
                project.status ||
                "Unknown",

              color:
                "#94a3b8",
            };

          // -------------------------------------------
          // FINAL PROJECT LOCATION
          // -------------------------------------------

          locations.push({

            id:
              project.id,

            projectName:
              project.project_name,

            location:
              project.location,

            status:
              status.label,

            color:
              status.color,

            area:
              aoi?.area_hectares ??
              null,

            coordinates,
          });

        }
      );

      console.log(
        "🗺️ FINAL PROJECT LOCATIONS:",
        locations
      );

      return locations;

    }, [
      projects,
      aoiRecords,
    ]);

  // ===================================================
  // STATUS COUNTS
  // ===================================================

  const statusCounts =
    useMemo(() => {

      const counts = {
        verified: 0,
        underVerification: 0,
        inProgress: 0,
        rejected: 0,
      };

      projects.forEach(
        (project) => {

          const status =
            String(
              project.status || ""
            )
              .trim()
              .toLowerCase();

          if (
            status ===
              "completed" ||
            status ===
              "verified"
          ) {
            counts.verified++;
          }

          else if (
            status ===
            "under verification"
          ) {
            counts.underVerification++;
          }

          else if (
            status ===
            "in progress"
          ) {
            counts.inProgress++;
          }

          else if (
            status ===
            "rejected"
          ) {
            counts.rejected++;
          }

        }
      );

      return counts;

    }, [projects]);

  // ===================================================
  // MAP CENTER
  // ===================================================

  const mapCenter =
    projectLocations.length > 0
      ? projectLocations[0]
          .coordinates
      : [
          20.5937,
          78.9629,
        ];

  // ===================================================
  // FULLSCREEN
  // ===================================================

  const toggleFullscreen =
    () => {

      setFullscreen(
        (value) => !value
      );

    };

  // ===================================================
  // UI
  // ===================================================

  return (

    <div
      style={{

        background:
          "var(--bg-card)",

        border:
          "1px solid var(--border)",

        borderRadius: 12,

        overflow: "hidden",

        display: "flex",

        flexDirection:
          "column",

        flex: 1,

        // -------------------------------------------
        // MEDIUM FULLSCREEN
        // -------------------------------------------

        ...(fullscreen
          ? {

              position: "fixed",

              top: "50%",

              left: "50%",

              transform:
                "translate(-50%, -50%)",

              width: "78vw",

              height: "72vh",

              maxWidth: "1200px",

              maxHeight: "760px",

              minWidth: "700px",

              minHeight: "500px",

              zIndex: 9999,

              background:
                "var(--bg-card)",

              boxShadow:
                "0 20px 60px rgba(0,0,0,0.65)",

              borderRadius: 12,

              overflow: "hidden",
            }

          : {}),

      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{

          padding:
            "14px 16px 10px",

          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          background:
            "#111318",

          color:
            "#dbeafe",

          position:
            "relative",

          zIndex: 2000,

          borderBottom:
            "1px solid #2a2f3a",

        }}
      >

        <span
          style={{

            color:
              "#dbeafe",

            fontWeight: 600,

            fontSize: 14,

          }}
        >
          Project Map
        </span>

        {/* Fullscreen */}

        <button
          onClick={
            toggleFullscreen
          }
          title={
            fullscreen
              ? "Exit fullscreen"
              : "Open fullscreen"
          }
          style={{

            background:
              "transparent",

            border: "none",

            cursor: "pointer",

            color:
              "#94a3b8",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            padding: 4,

          }}
        >

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
          >

            {fullscreen ? (

              <path d="M9 9L3 3m0 0v5m0-5h5m7 7l6 6m0 0v-5m0 5h-5M9 15l-6 6m0 0v-5m0 5h5m5-12l6-6m0 0v5m0-5h-5" />

            ) : (

              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />

            )}

          </svg>

        </button>

      </div>

      {/* =================================================
          MAP AREA
      ================================================= */}

      <div
        style={{

          position:
            "relative",

          flex: 1,

          minHeight:
            fullscreen
              ? 0
              : 260,

          overflow:
            "hidden",

        }}
      >

        <MapContainer
          center={mapCenter}
          zoom={5}
          style={{

            width: "100%",

            height: "100%",

            minHeight:
              fullscreen
                ? 0
                : 260,

          }}
          scrollWheelZoom={
            true
          }
        >

          {/* =============================================
              STREET + SATELLITE
          ============================================= */}

          <LayersControl
            position="topright"
          >

            {/* STREET */}

            <LayersControl.BaseLayer
              checked={false}
              name="Street Map"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

            </LayersControl.BaseLayer>

            {/* SATELLITE */}

            <LayersControl.BaseLayer
              checked={true}
              name="Satellite"
            >

              <TileLayer
                attribution="&copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />

            </LayersControl.BaseLayer>

          </LayersControl>

          {/* Map resize */}

          <MapResizeHandler
            fullscreen={
              fullscreen
            }
          />

          {/* Automatically fit projects */}

          <FitProjects
            locations={
              projectLocations
            }
          />

          {/* =============================================
              ACTUAL PROJECT CIRCLES
          ============================================= */}

          {projectLocations.map(
            (project) => (

              <CircleMarker
                key={
                  project.id
                }
                center={
                  project.coordinates
                }
                radius={
                  fullscreen
                    ? 11
                    : 9
                }
                pathOptions={{

                  color:
                    "#ffffff",

                  weight: 2,

                  fillColor:
                    project.color,

                  fillOpacity:
                    0.95,

                }}
              >

                <Popup>

                  <div
                    style={{

                      minWidth: 190,

                      fontFamily:
                        "Arial, sans-serif",

                    }}
                  >

                    <div
                      style={{

                        fontWeight: 700,

                        fontSize: 14,

                        marginBottom: 8,

                        color:
                          "#111827",

                      }}
                    >

                      {
                        project.projectName
                      }

                    </div>

                    <div
                      style={{

                        fontSize: 12,

                        marginBottom: 5,

                        color:
                          "#374151",

                      }}
                    >

                      <strong>
                        Status:
                      </strong>{" "}

                      {
                        project.status
                      }

                    </div>

                    {project.area !==
                      null &&
                      project.area !==
                        undefined && (

                        <div
                          style={{

                            fontSize: 12,

                            marginBottom: 5,

                            color:
                              "#374151",

                          }}
                        >

                          <strong>
                            Area:
                          </strong>{" "}

                          {Number(
                            project.area
                          ).toFixed(2)}{" "}

                          ha

                        </div>

                      )}

                    {project.location && (

                      <div
                        style={{

                          fontSize: 12,

                          marginBottom: 5,

                          color:
                            "#374151",

                        }}
                      >

                        <strong>
                          Location:
                        </strong>{" "}

                        {
                          project.location
                        }

                      </div>

                    )}

                    <div
                      style={{

                        fontSize: 11,

                        color:
                          "#6b7280",

                      }}
                    >

                      Coordinates:{" "}

                      {
                        Number(
                          project
                            .coordinates[0]
                        ).toFixed(5)
                      }

                      ,{" "}

                      {
                        Number(
                          project
                            .coordinates[1]
                        ).toFixed(5)
                      }

                    </div>

                  </div>

                </Popup>

              </CircleMarker>

            )
          )}

        </MapContainer>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div
            style={{

              position:
                "absolute",

              inset: 0,

              zIndex: 1000,

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "rgba(7,18,32,0.55)",

              color:
                "white",

              fontSize: 12,

              pointerEvents:
                "none",

            }}
          >

            Loading project
            locations...

          </div>

        )}

        {/* =================================================
            NO LOCATION
        ================================================= */}

        {!loading &&
          projects.length > 0 &&
          projectLocations.length ===
            0 && (

            <div
              style={{

                position:
                  "absolute",

                top: 12,

                left: 50,

                zIndex: 1000,

                background:
                  "rgba(8,18,36,0.92)",

                border:
                  "1px solid rgba(255,255,255,0.12)",

                borderRadius: 8,

                padding:
                  "8px 10px",

                color:
                  "rgba(255,255,255,0.8)",

                fontSize: 10,

              }}
            >

              Project locations
              are not available
              yet.

            </div>

          )}

        {/* =================================================
            LEGEND
        ================================================= */}

        <div
          style={{

            position:
              "absolute",

            bottom: 10,

            left: 10,

            zIndex: 1000,

            background:
              "rgba(8,18,36,0.92)",

            border:
              "1px solid rgba(255,255,255,0.1)",

            borderRadius: 8,

            padding:
              "10px 12px",

            minWidth: 155,

          }}
        >

          <div
            style={{

              color:
                "white",

              fontSize: 11,

              fontWeight: 600,

              marginBottom: 7,

            }}
          >

            Project Status

          </div>

          {/* VERIFIED */}

          <div
            style={{

              display: "flex",

              alignItems:
                "center",

              gap: 6,

              marginBottom: 4,

            }}
          >

            <div
              style={{

                width: 8,

                height: 8,

                borderRadius:
                  "50%",

                background:
                  "#22c55e",

              }}
            />

            <span
              style={{

                color:
                  "rgba(255,255,255,0.75)",

                fontSize: 10,

              }}
            >

              Verified (
              {
                statusCounts.verified
              }
              )

            </span>

          </div>

          {/* UNDER VERIFICATION */}

          <div
            style={{

              display: "flex",

              alignItems:
                "center",

              gap: 6,

              marginBottom: 4,

            }}
          >

            <div
              style={{

                width: 8,

                height: 8,

                borderRadius:
                  "50%",

                background:
                  "#3b82f6",

              }}
            />

            <span
              style={{

                color:
                  "rgba(255,255,255,0.75)",

                fontSize: 10,

              }}
            >

              Under Verification (
              {
                statusCounts
                  .underVerification
              }
              )

            </span>

          </div>

          {/* IN PROGRESS */}

          <div
            style={{

              display: "flex",

              alignItems:
                "center",

              gap: 6,

              marginBottom: 4,

            }}
          >

            <div
              style={{

                width: 8,

                height: 8,

                borderRadius:
                  "50%",

                background:
                  "#eab308",

              }}
            />

            <span
              style={{

                color:
                  "rgba(255,255,255,0.75)",

                fontSize: 10,

              }}
            >

              In Progress (
              {
                statusCounts
                  .inProgress
              }
              )

            </span>

          </div>

          {/* REJECTED */}

          {statusCounts.rejected >
            0 && (

            <div
              style={{

                display: "flex",

                alignItems:
                  "center",

                gap: 6,

              }}
            >

              <div
                style={{

                  width: 8,

                  height: 8,

                  borderRadius:
                    "50%",

                  background:
                    "#ef4444",

                }}
              />

              <span
                style={{

                  color:
                    "rgba(255,255,255,0.75)",

                  fontSize: 10,

                }}
              >

                Rejected (
                {
                  statusCounts
                    .rejected
                }
                )

              </span>

            </div>

          )}

        </div>

      </div>

    </div>

  );
}