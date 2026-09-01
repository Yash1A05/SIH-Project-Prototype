import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const navItems = [
  {
    section: null,
    items: [{ label: "Dashboard", icon: "grid", active: true }],
  },
  {
    section: "PROJECT MANAGEMENT",
    items: [
      { label: "Add New Project", icon: "plus-circle" },
      { label: "My Projects", icon: "bookmark" },
      { label: "Project Map", icon: "map-pin" },
    ],
  },
  {
    section: "MRV SYSTEM",
    items: [
      { label: "Measurement", icon: "bar-chart-2" },
      { label: "Reporting", icon: "file-text" },
      { label: "Verification", icon: "shield-check" },
    ],
  },
  {
    section: "CARBON MANAGEMENT",
    items: [
      { label: "Carbon Estimates", icon: "wind" },
      { label: "Carbon Credits", icon: "credit-card" },
      { label: "Credit Transactions", icon: "repeat" },
    ],
  },
  {
    section: "BLOCKCHAIN & REGISTRY",
    items: [
      { label: "Blockchain Registry", icon: "box" },
      { label: "Smart Contracts", icon: "code" },
      { label: "Audit Trail", icon: "list" },
    ],
  },
  {
    section: "ANALYTICS & INSIGHTS",
    items: [
      { label: "Analytics", icon: "trending-up" },
      { label: "Reports", icon: "file-bar-chart" },
    ],
  },
  {
    section: "ADMIN & SETTINGS",
    items: [
      { label: "Users & Roles", icon: "users" },
      { label: "Settings", icon: "settings" },
    ],
  },
];

function Icon({ name }) {
  const icons = {
    grid: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),

    folder: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),

    "plus-circle": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),

    bookmark: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),

    "map-pin": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),

    "bar-chart-2": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),

    "file-text": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),

    "shield-check": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),

    wind: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
        <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
        <path d="M17.73 8.27A2.5 2.5 0 1 1 19.5 12H2" />
      </svg>
    ),

    "credit-card": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),

    repeat: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),

    box: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),

    code: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),

    list: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),

    "trending-up": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),

    "file-bar-chart": (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),

    users: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),

    settings: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),

    logout: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  };

  return (
    <span style={{ display: "flex", alignItems: "center" }}>
      {icons[name] || null}
    </span>
  );
}

export default function Sidebar({ isOpen, onNavigate }) {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      style={{
        width: isOpen ? 220 : 0,
        minWidth: isOpen ? 220 : 0,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 18px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1d4ed8, #22c55e)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            width="18"
            height="18"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path
              d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z"
              fill="rgba(255,255,255,0.3)"
            />
            <path d="M12 6v2M12 16v2M6 12h2M16 12h2" />
          </svg>
        </div>

        <div style={{ whiteSpace: "nowrap" }}>
          <div
            style={{
              color: "var(--text-primary)",
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1.2,
            }}
          >
            Blue Carbon
          </div>

          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 10,
              lineHeight: 1.2,
            }}
          >
            Registry & MRV
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="sidebar-nav"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 0",
        }}
      >
        {navItems.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <div
                style={{
                  color: "var(--sidebar-label)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "14px 18px 5px",
                  whiteSpace: "nowrap",
                }}
              >
                {group.section}
              </div>
            )}

            {group.items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
  setActiveItem(item.label);
  onNavigate?.(item.label);
}}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "calc(100% - 16px)",
                  padding: "8px 18px",
                  background:
                    activeItem === item.label
                      ? "var(--sidebar-active-bg)"
                      : "transparent",
                  color:
                    activeItem === item.label
                      ? "var(--sidebar-active-text)"
                      : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight:
                    activeItem === item.label ? 600 : 400,
                  textAlign: "left",
                  borderRadius: 6,
                  margin: "1px 8px",
                  whiteSpace: "nowrap",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div
        style={{
          padding: "10px 0 12px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "calc(100% - 16px)",
            padding: "9px 18px",
            background: isLoggingOut
              ? "var(--sidebar-active-bg)"
              : "transparent",
            color: isLoggingOut
              ? "var(--sidebar-active-text)"
              : "#ef4444",
            border: "none",
            cursor: isLoggingOut ? "default" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "left",
            borderRadius: 6,
            margin: "1px 8px",
            whiteSpace: "nowrap",
            transition: "background 0.15s, color 0.15s",
            opacity: isLoggingOut ? 0.7 : 1,
          }}
        >
          <Icon name="logout" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}