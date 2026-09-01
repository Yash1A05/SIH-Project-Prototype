import React, { useEffect, useState } from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { supabase } from "../supabaseClient";

export default function SequestrationChart() {
  // =====================================================
  // CHART PERIOD
  // =====================================================

  const [monthsToShow, setMonthsToShow] = useState(6);

  // =====================================================
  // LIVE CHART DATA
  // =====================================================

  const [sequestrationData, setSequestrationData] = useState([]);

  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH LIVE CO2e DATA
  // =====================================================

  useEffect(() => {
    const fetchSequestrationData = async () => {
      try {
        setLoading(true);

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
        // Calculate start date
        // -------------------------------------------------

        const today = new Date();

        const startDate = new Date(
          today.getFullYear(),
          today.getMonth() - (monthsToShow - 1),
          1
        );

        // -------------------------------------------------
        // Fetch carbon estimates
        // -------------------------------------------------

        const {
          data: carbonData,
          error: carbonError,
        } = await supabase
          .from("carbon_estimates")
          .select(
            "estimated_co2e_tonnes, created_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .gte(
            "created_at",
            startDate.toISOString()
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

        if (carbonError) {
          console.error(
            "Sequestration data fetch error:",
            carbonError
          );

          return;
        }

        // -------------------------------------------------
        // Create month buckets
        // -------------------------------------------------

        const monthBuckets = {};

        for (
          let i = 0;
          i < monthsToShow;
          i++
        ) {
          const date = new Date(
            today.getFullYear(),
            today.getMonth() -
              (monthsToShow - 1) +
              i,
            1
          );

          const key =
            `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;

          const label =
            date.toLocaleDateString(
              "en-US",
              {
                month: "short",
                year: "2-digit",
              }
            );

          monthBuckets[key] = {
            month: label,
            value: 0,
          };
        }

        // -------------------------------------------------
        // Add CO2e values into correct month
        // -------------------------------------------------

        carbonData?.forEach((item) => {
          if (!item.created_at) return;

          const date = new Date(
            item.created_at
          );

          const key =
            `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;

          if (
            monthBuckets[key]
          ) {
            monthBuckets[key].value +=
              Number(
                item.estimated_co2e_tonnes || 0
              );
          }
        });

        // -------------------------------------------------
        // Convert object → array
        // -------------------------------------------------

        const chartData =
          Object.values(
            monthBuckets
          );

        setSequestrationData(
          chartData
        );

        console.log(
          "Live sequestration data:",
          chartData
        );

      } catch (error) {
        console.error(
          "Sequestration chart error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSequestrationData();

  }, [monthsToShow]);

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
        flex: 1,
        minWidth: 0,
      }}
    >

      {/* Header */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >

        <span
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          CO₂e Sequestration Trend
        </span>

        {/* Period Selector */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 8px",
          }}
        >

          <select
            value={monthsToShow}
            onChange={(event) =>
              setMonthsToShow(
                Number(event.target.value)
              )
            }
            style={{
              background: "var(--bg-input)",
              border: "none",
              outline: "none",
              color: "var(--text-secondary)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >

            <option value={3}>
              Last 3 Months
            </option>

            <option value={6}>
              Last 6 Months
            </option>

            <option value={12}>
              Last 12 Months
            </option>

          </select>

        </div>

      </div>

      {/* Y-axis label */}

      <div
        style={{
          color: "#94a3b8",
          fontSize: 10,
          marginBottom: 4,
          paddingLeft: 2,
        }}
      >
        tCO₂e
      </div>

      {/* Chart */}

      <div
        style={{
          flex: 1,
          minHeight: 200,
        }}
      >

        {loading ? (

          <div
            style={{
              height: "100%",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            Loading chart...
          </div>

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <AreaChart
              data={sequestrationData}
              margin={{
                top: 5,
                right: 10,
                left: -10,
                bottom: 0,
              }}
            >

              <defs>

                <linearGradient
                  id="greenGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="5%"
                    stopColor="#22c55e"
                    stopOpacity={0.3}
                  />

                  <stop
                    offset="95%"
                    stopColor="#22c55e"
                    stopOpacity={0.02}
                  />

                </linearGradient>

              </defs>

              {/* Grid */}

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
                strokeOpacity={0.45}
              />

              {/* X Axis */}

              <XAxis
                dataKey="month"
                tick={{
                  fill: "#94a3b8",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />

              {/* Y Axis */}

              <YAxis
                tick={{
                  fill: "#94a3b8",
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  `${(value / 1000).toFixed(0)}K`
                }
              />

              {/* Tooltip */}

              <Tooltip
  contentStyle={{
    backgroundColor: "#111318",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 12,
  }}
  labelStyle={{
    color: "#cbd5e1",
  }}
  itemStyle={{
    color: "#22c55e",
  }}
  formatter={(value) => [
    `${Number(value).toLocaleString()} tCO₂e`,
    "Sequestration",
  ]}
/>

              {/* Area */}

              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2.5}
                fill="url(#greenGrad)"
                dot={{
                  fill: "#22c55e",
                  r: 4,
                  strokeWidth: 2,
                  stroke: "#0b1120",
                }}
                activeDot={{
                  r: 6,
                  fill: "#22c55e",
                }}
              />

            </AreaChart>

          </ResponsiveContainer>

        )}

      </div>

    </div>
  );
}