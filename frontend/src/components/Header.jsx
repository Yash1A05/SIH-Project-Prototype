import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Header({
  onToggleSidebar,
  theme,
  onToggleTheme,
  onThemeChange,
}) {
  const [user, setUser] = useState(null);

  const [themeOpen, setThemeOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Project created",
      message: "A new Blue Carbon project was created.",
      type: "info",
      read: false,
    },
    {
      id: 2,
      title: "Verification update",
      message: "Your project verification status was updated.",
      type: "success",
      read: false,
    },
    {
      id: 3,
      title: "Carbon estimate ready",
      message: "New carbon estimation data is available.",
      type: "warning",
      read: false,
    },
  ]);

  const [startDate, setStartDate] = useState("2025-05-22");
  const [endDate, setEndDate] = useState("2025-06-22");

  // =====================================================
  // GET LOGGED-IN SUPABASE USER
  // =====================================================

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // USER NAME
  // =====================================================

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formattedDateRange = `${formatDate(
    startDate
  )} – ${formatDate(endDate)}`;

  // =====================================================
  // THEME
  // =====================================================

  const currentTheme =
    theme === "system"
      ? "System Default"
      : theme === "light"
      ? "Light Mode"
      : "Dark Mode";

  const themeIcon =
    theme === "system"
      ? "🖥️"
      : theme === "light"
      ? "☀️"
      : "🌙";

  const applyThemeFallback = (newTheme) => {
    const root = document.documentElement;

    const light = {
      "--bg-base": "#f5f7fb",
      "--bg-card": "#ffffff",
      "--bg-input": "#f0f3f8",
      "--border": "#d7dee8",
      "--text-primary": "#172033",
      "--text-secondary": "#526174",
      "--text-muted": "#7a8798",
      "--map-bg": "#e8eef5",
      "--chart-grid": "#d7dee8",
    };

    const dark = {
      "--bg-base": "#111318",
      "--bg-card": "#15171d",
      "--bg-input": "#191c23",
      "--border": "#303641",
      "--text-primary": "#f3f6fb",
      "--text-secondary": "#aeb8c7",
      "--text-muted": "#7d8796",
      "--map-bg": "#071528",
      "--chart-grid": "#303641",
    };

    const setVariables = (variables) => {
      Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    };

    if (newTheme === "light") {
      setVariables(light);
      root.dataset.theme = "light";
      document.body.style.backgroundColor = light["--bg-base"];
      document.body.style.color = light["--text-primary"];
    } else if (newTheme === "dark") {
      setVariables(dark);
      root.dataset.theme = "dark";
      document.body.style.backgroundColor = dark["--bg-base"];
      document.body.style.color = dark["--text-primary"];
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const variables = isDark ? dark : light;
      setVariables(variables);
      root.dataset.theme = isDark ? "dark" : "light";
      document.body.style.backgroundColor = variables["--bg-base"];
      document.body.style.color = variables["--text-primary"];
    }
  };

  const handleThemeChange = (newTheme) => {
    setThemeOpen(false);

    // Preferred: App.jsx controls the actual theme state.
    if (onThemeChange) {
      onThemeChange(newTheme);
      return;
    }

    // Safe fallback: if App.jsx is still using only onToggleTheme,
    // apply the selected theme directly so Light/Dark/System still work.
    applyThemeFallback(newTheme);
  };

  // Keep System Default synchronized with the operating-system theme
  useEffect(() => {
    if (theme !== "system" || onThemeChange) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncSystemTheme = () => {
      applyThemeFallback("system");
    };

    syncSystemTheme();
    media.addEventListener?.("change", syncSystemTheme);

    return () => {
      media.removeEventListener?.("change", syncSystemTheme);
    };
  }, [theme, onThemeChange]);

  // =====================================================
  // CLOSE OTHER DROPDOWNS
  // =====================================================

  const openDropdown = (name) => {
    setThemeOpen(name === "theme");
    setNotificationOpen(name === "notification");
    setProfileOpen(name === "profile");
    setDateOpen(name === "date");
  };

  // =====================================================
  // SIGN OUT
  // =====================================================

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
  };

  // =====================================================
  // MARK NOTIFICATIONS READ
  // =====================================================

  const markAllAsRead = () => {
    setNotifications((items) =>
      items.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  return (
    <header
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        flexShrink: 0,
        gap: 16,
        position: "relative",
        zIndex: 1000,
      }}
    >
      {/* =================================================
          LEFT
      ================================================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          onClick={onToggleSidebar}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Toggle sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="21"
            height="21"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* =================================================
          RIGHT
      ================================================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >

        {/* =================================================
            THEME DROPDOWN
        ================================================= */}

        <div
          style={{
            position: "relative",
          }}
        >
          <button
            onClick={() =>
              openDropdown(themeOpen ? "" : "theme")
            }
            style={{
              height: 36,
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 9,
              padding: "0 11px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{themeIcon}</span>

            <span>{currentTheme}</span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="12"
              height="12"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {themeOpen && (
            <div
              style={{
                position: "absolute",
                top: 43,
                right: 0,
                width: 175,

                /* FIXED DARK DROPDOWN */
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 6,
                boxShadow:
                  "0 18px 40px rgba(0,0,0,0.28)",

                zIndex: 2000,
              }}
            >
              {[
                {
                  value: "dark",
                  icon: "🌙",
                  label: "Dark Mode",
                },
                {
                  value: "light",
                  icon: "☀️",
                  label: "Light Mode",
                },
                {
                  value: "system",
                  icon: "🖥️",
                  label: "System Default",
                },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() =>
                    handleThemeChange(item.value)
                  }
                  style={{
                    width: "100%",
                    border: "none",

                    background:
                      theme === item.value
                        ? "#222a36"
                        : "transparent",

                    borderRadius: 7,
                    padding: "9px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    color: "var(--text-primary)",
                    fontSize: 12,
                    textAlign: "left",
                  }}
                >
                  <span>{item.icon}</span>

                  <span>{item.label}</span>

                  {theme === item.value && (
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#22c55e",
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* =================================================
            NOTIFICATION
        ================================================= */}

        <div
          style={{
            position: "relative",
          }}
        >
          <button
            onClick={() =>
              openDropdown(
                notificationOpen ? "" : "notification"
              )
            }
            style={{
              position: "relative",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Notifications"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="21"
              height="21"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  background: "#ef4444",
                  color: "white",
                  fontSize: 9,
                  fontWeight: 700,
                  borderRadius: "50%",
                  minWidth: 16,
                  height: 16,
                  padding: "0 3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div
              style={{
                position: "absolute",
                top: 43,
                right: -160,
                width: 310,

                /* FIXED DARK DROPDOWN */
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                boxShadow:
                  "0 18px 40px rgba(0,0,0,0.28)",

                overflow: "hidden",
                zIndex: 2000,
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom:
                    "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--bg-card)",
                }}
              >
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Notifications
                </span>

                <button
                  onClick={markAllAsRead}
                  style={{
                    border: "none",
                    background: "none",
                    color: "var(--accent-cyan, #22d3ee)",
                    cursor: "pointer",
                    fontSize: 10,
                  }}
                >
                  Mark all as read
                </button>
              </div>

              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    setNotifications((items) =>
                      items.map((notification) =>
                        notification.id === item.id
                          ? {
                              ...notification,
                              read: true,
                            }
                          : notification
                      )
                    )
                  }
                  style={{
                    padding: "11px 14px",
                    display: "flex",
                    gap: 10,
                    borderBottom:
                      "1px solid var(--border)",
                    cursor: "pointer",

                    /* FIXED UNREAD COLOR */
                    background: item.read
                      ? "#151820"
                      : "#1d2530",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        item.type === "success"
                          ? "#22c55e"
                          : item.type === "warning"
                          ? "#eab308"
                          : "#3b82f6",
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />

                  <div>
                    <div
                      style={{
                        color: "var(--text-primary)",
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 3,
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: 10,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.message}
                    </div>
                  </div>
                </div>
              ))}

              <div
                style={{
                  padding: 10,
                  textAlign: "center",
                  color: "var(--accent-cyan, #22d3ee)",
                  fontSize: 11,
                  background: "var(--bg-card)",
                }}
              >
                View all notifications →
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            USER PROFILE
        ================================================= */}

        <div
          style={{
            position: "relative",
          }}
        >
          <button
            onClick={() =>
              openDropdown(profileOpen ? "" : "profile")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              textAlign: "left",
            }}
          >
            {/* Avatar */}

            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #1d4ed8, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                initials
              )}
            </div>

            {/* Name + Role */}

            <div
              style={{
                minWidth: 125,
                maxWidth: 185,
              }}
            >
              <div
                style={{
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName}
              </div>

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 10,
                  lineHeight: 1.3,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                }}
              >
                {user?.user_metadata?.role ||
                  "Project Administrator"}
              </div>
            </div>

            {/* Arrow */}

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="13"
              height="13"
              style={{
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {profileOpen && (
            <div
              style={{
                position: "absolute",
                top: 46,
                right: 0,
                width: 190,

                /* FIXED DARK DROPDOWN */
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 6,
                boxShadow:
                  "0 18px 40px rgba(0,0,0,0.28)",

                zIndex: 2000,
              }}
            >
              <div
                style={{
                  padding: "9px 10px",
                  borderBottom:
                    "1px solid var(--border)",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {userName}
                </div>

                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 9,
                    marginTop: 2,
                  }}
                >
                  {user?.email || ""}
                </div>
              </div>

              {[
                ["👤", "My Profile"],
                ["⚙️", "Account Settings"],
              ].map(([icon, label]) => (
                <button
                  key={label}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    padding: "9px 10px",
                    borderRadius: 7,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 11,
                    display: "flex",
                    gap: 9,
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}

              <div
                style={{
                  height: 1,
                  background: "#303642",
                  margin: "4px 0",
                }}
              />

              <button
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  color: "#ef4444",
                  padding: "9px 10px",
                  borderRadius: 7,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 11,
                  display: "flex",
                  gap: 9,
                }}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            DATE RANGE
        ================================================= */}

        <div
          style={{
            position: "relative",
          }}
        >
          <button
            onClick={() =>
              openDropdown(dateOpen ? "" : "date")
            }
            style={{
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 10px",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 9,
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="14"
              height="14"
              style={{
                color: "var(--text-muted)",
              }}
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="18"
                rx="2"
              />

              <line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
              />

              <line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
              />

              <line
                x1="3"
                y1="10"
                x2="21"
                y2="10"
              />
            </svg>

            <span>{formattedDateRange}</span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="12"
              height="12"
              style={{
                color: "var(--text-muted)",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dateOpen && (
            <div
              style={{
                position: "absolute",
                top: 45,
                right: 0,
                width: 260,

                /* FIXED DARK DROPDOWN */
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 14,
                boxShadow:
                  "0 18px 40px rgba(0,0,0,0.28)",

                zIndex: 2000,
              }}
            >
              <div
                style={{
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Select Date Range
              </div>

              <label
                style={{
                  display: "block",
                  color: "var(--text-secondary)",
                  fontSize: 10,
                  marginBottom: 5,
                }}
              >
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 9px",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  fontSize: 11,
                  marginBottom: 10,
                  colorScheme: "auto",
                }}
              />

              <label
                style={{
                  display: "block",
                  color: "var(--text-secondary)",
                  fontSize: 10,
                  marginBottom: 5,
                }}
              >
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 9px",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  fontSize: 11,
                  colorScheme: "auto",
                }}
              />

              <button
                onClick={() => setDateOpen(false)}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "8px 10px",
                  background: "#22c55e",
                  border: "none",
                  borderRadius: 7,
                  color: "white",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Apply Date Range
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}