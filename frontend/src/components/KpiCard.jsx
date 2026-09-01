import React from "react";

function KpiIcon({ name, color }) {
  const icons = {
    folder: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        width="20"
        height="20"
      >
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),

    map: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        width="20"
        height="20"
      >
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),

    leaf: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        width="20"
        height="20"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        <path d="M12 21.23V12" />
      </svg>
    ),

    shield: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        width="20"
        height="20"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),

    award: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        width="20"
        height="20"
      >
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  };

  return icons[name] || null;
}

export default function KpiCard({
  label,
  value,
  unit,
  trend,
  trendUp,
  icon,
  iconColor,
  iconBg,
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
        minWidth: 140,
        transition: "background 0.15s",
      }}
    >
      {/* Label + Icon */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {label}
        </div>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <KpiIcon
            name={icon}
            color={iconColor}
          />
        </div>
      </div>

      {/* Value */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        <span
          style={{
            color: "var(--text-primary)",
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {value}
        </span>

        {unit && (
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Trend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span
          style={{
            color: trendUp
              ? "#22c55e"
              : "#ef4444",
            fontSize: 11,
          }}
        >
          {trendUp ? "▲" : "▼"} {trend}
        </span>
      </div>
    </div>
  );
}