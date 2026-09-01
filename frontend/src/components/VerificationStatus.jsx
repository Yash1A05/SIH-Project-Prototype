import React, { useEffect, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { supabase } from "../supabaseClient";

export default function VerificationStatus({ onViewAll }) {

  // =====================================================
  // LIVE VERIFICATION DATA
  // =====================================================

  const [verificationData, setVerificationData] = useState([
    {
      name: "Verified",
      value: 0,
      color: "#22c55e",
    },
    {
      name: "Under Verification",
      value: 0,
      color: "#3b82f6",
    },
    {
      name: "In Progress",
      value: 0,
      color: "#eab308",
    },
    {
      name: "Rejected",
      value: 0,
      color: "#ef4444",
    },
  ]);

  const [loading, setLoading] = useState(true);


  // =====================================================
  // FETCH LIVE VERIFICATION DATA
  // =====================================================

  useEffect(() => {

    let channel = null;

    const fetchVerificationData = async () => {

      try {

        // -------------------------------------------------
        // Get logged-in user
        // -------------------------------------------------

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();


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


        // -------------------------------------------------
        // Fetch user's projects
        // -------------------------------------------------

        const {
          data: projects,
          error: projectsError,
        } = await supabase
          .from("projects")
          .select(
            "id, project_name, status"
          )
          .eq(
            "user_id",
            user.id
          );


        if (projectsError) {

          console.error(
            "Verification projects fetch error:",
            projectsError
          );

          return;
        }


        // -------------------------------------------------
        // Count project statuses
        // -------------------------------------------------

        let verified = 0;
        let underVerification = 0;
        let inProgress = 0;
        let rejected = 0;


        projects?.forEach((project) => {

          const status =
            String(
              project.status || ""
            )
              .trim()
              .toLowerCase();


          // Completed = Verified
          if (
            status === "completed"
          ) {
            verified++;
          }

          // Under Verification
          else if (
            status === "under verification"
          ) {
            underVerification++;
          }

          // In Progress
          else if (
            status === "in progress"
          ) {
            inProgress++;
          }

          // Rejected
          else if (
            status === "rejected"
          ) {
            rejected++;
          }

        });


        // -------------------------------------------------
        // Update chart
        // -------------------------------------------------

        setVerificationData([
          {
            name: "Verified",
            value: verified,
            color: "#22c55e",
          },
          {
            name: "Under Verification",
            value: underVerification,
            color: "#3b82f6",
          },
          {
            name: "In Progress",
            value: inProgress,
            color: "#eab308",
          },
          {
            name: "Rejected",
            value: rejected,
            color: "#ef4444",
          },
        ]);

      } catch (error) {

        console.error(
          "Verification status error:",
          error
        );

      } finally {

        setLoading(false);

      }

    };


    // =====================================================
    // INITIAL DATA FETCH
    // =====================================================

    fetchVerificationData();


    // =====================================================
    // SUPABASE REALTIME
    // =====================================================

    const setupRealtime = async () => {

      const {
        data: { user },
      } = await supabase.auth.getUser();


      if (!user) {
        return;
      }


      channel = supabase
        .channel(
          `verification-status-${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `user_id=eq.${user.id}`,
          },
          () => {

            // Database change hote hi
            // verification data dobara fetch hoga
            fetchVerificationData();

          }
        )
        .subscribe((status) => {

          console.log(
            "Verification Realtime:",
            status
          );

        });

    };


    setupRealtime();


    // =====================================================
    // CLEANUP REALTIME CONNECTION
    // =====================================================

    return () => {

      if (channel) {

        supabase.removeChannel(
          channel
        );

      }

    };

  }, []);


  // =====================================================
  // TOTAL PROJECTS
  // =====================================================

  const total = verificationData.reduce(
    (sum, item) =>
      sum + item.value,
    0
  );


  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >

      {/* Header */}

      <div
        style={{
          color: "var(--text-primary)",
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 10,
        }}
      >
        Verification Status
      </div>


      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >

        {/* Donut Chart */}

        <div
          style={{
            position: "relative",
            width: 140,
            height: 140,
            flexShrink: 0,
          }}
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={verificationData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={62}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >

                {verificationData.map(
                  (entry, index) => (

                    <Cell
                      key={index}
                      fill={entry.color}
                    />

                  )
                )}

              </Pie>


              <Tooltip
                contentStyle={{
                  background:
                    "var(--bg-card)",
                  border:
                    "1px solid var(--border)",
                  borderRadius: 8,
                  color:
                    "var(--text-primary)",
                  fontSize: 12,
                }}
              />

            </PieChart>

          </ResponsiveContainer>


          {/* Center Label */}

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            <div
              style={{
                color:
                  "var(--text-primary)",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {loading ? "..." : total}
            </div>


            <div
              style={{
                color:
                  "var(--text-muted)",
                fontSize: 9,
              }}
            >
              Total
            </div>

          </div>

        </div>


        {/* Legend */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
          }}
        >

          {verificationData.map(
            (item) => (

              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >

                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        item.color,
                    }}
                  />

                  <span
                    style={{
                      color:
                        "var(--text-secondary)",
                      fontSize: 11,
                    }}
                  >
                    {item.name}
                  </span>

                </div>


                <span
                  style={{
                    color:
                      "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {loading
                    ? "..."
                    : item.value}
                </span>

              </div>

            )
          )}

        </div>

      </div>


      {/* View All */}

      <button
        onClick={() => onViewAll?.()}
        style={{
          marginTop: 14,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--accent-cyan)",
          fontSize: 12,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        View All Verifications →
      </button>

    </div>
  );
}