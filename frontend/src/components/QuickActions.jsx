import React from "react";

const actions = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="22"
        height="22"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    label: "Add New Project",
    desc: "Register a new blue carbon project",
  },

  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="22"
        height="22"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
      </svg>
    ),
    label: "Generate Report",
    desc: "Download MRV reports",
  },

  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="22"
        height="22"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    label: "View Analytics",
    desc: "Explore detailed insights",
  },

  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="22"
        height="22"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: "Verify Project",
    desc: "Review and verify submitted data",
  },

  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="22"
        height="22"
      >
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
    label: "Issue Credits",
    desc: "Create carbon credits for verified projects",
  },
];

export default function QuickActions({ onAddProject }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Left Text */}
      <div
        style={{
          minWidth: 160,
        }}
      >
        <div
          style={{
            color: "var(--accent-cyan)",
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 4,
          }}
        >
          Make an Impact
        </div>

        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          Support blue carbon projects and contribute to a sustainable future.
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 60,
          background: "var(--border)",
          flexShrink: 0,
        }}
      />

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flex: 1,
          flexWrap: "wrap",
        }}
      >
        {actions.map((action) => (
          <button
  key={action.label}
  onClick={
    action.label === "Add New Project"
      ? onAddProject
      : undefined
  }
  style={{
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "4px 8px",
    borderRadius: 8,
    transition: "background 0.15s",
    flex: "1 1 140px",
    textAlign: "left",
  }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                "var(--bg-input)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "none";
            }}
          >
            {/* Icon */}
            <div
              style={{
                color: "var(--text-secondary)",
                marginTop: 2,
                flexShrink: 0,
              }}
            >
              {action.icon}
            </div>

            {/* Text */}
            <div>
              <div
                style={{
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {action.label}
              </div>

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                {action.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}