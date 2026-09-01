import { useEffect, useState } from "react";
import MapSelector from "./MapSelector";

import Auth from "./Auth";
import { supabase } from "./supabaseClient";

// Dashboard components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import KpiCard from "./components/KpiCard";
import ProjectMap from "./components/ProjectMap";
import SequestrationChart from "./components/SequestrationChart";
import RecentProjects from "./components/RecentProjects";
import VerificationStatus from "./components/VerificationStatus";
import BlockchainRegistry from "./components/BlockchainRegistry";
import QuickActions from "./components/QuickActions";
import MyProjects from "./menu/MyProjects";
import CarbonCredits from "./menu/CarbonCredits";

// Dashboard data
import { kpiData } from "./data/mockData";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // DASHBOARD THEME
  // =====================================================
  // "light"  = always light
  // "dark"   = always dark
  // "system" = follows Windows/browser system theme
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("blue-carbon-theme") || "system";
  });

  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";

    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });

  // Remember the selected mode after refresh
  useEffect(() => {
    localStorage.setItem("blue-carbon-theme", theme);
  }, [theme]);

  // Watch the operating system/browser theme
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: light)"
    );

    const handleSystemThemeChange = (event) => {
      setSystemTheme(event.matches ? "light" : "dark");
    };

    setSystemTheme(mediaQuery.matches ? "light" : "dark");

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // Theme actually applied to the website
  const activeTheme = theme === "system" ? systemTheme : theme;

  // =====================================================
  // DASHBOARD LIVE DATA
  // =====================================================

  const [dashboardData, setDashboardData] = useState({
    totalProjects: 0,
    totalArea: 0,
    totalCo2e: 0,

    // This month
    projectsThisMonth: 0,
    areaThisMonth: 0,
    co2eThisMonth: 0,

    // Verified projects
    verifiedProjects: 0,
    verifiedProjectsThisMonth: 0,

    // Issued carbon credits
    issuedCredits: 0,
    issuedCreditsThisMonth: 0,
  });

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [activePage, setActivePage] = useState("Dashboard");

  const handleNavigate = (page) => {
    if (page === "Add New Project") {
      setShowMapSelector(true);
      setActivePage("Add New Project");
      return;
    }

    setShowMapSelector(false);
    setActivePage(page);
  };

  // Map Selector
  const [showMapSelector, setShowMapSelector] = useState(false);

  // =====================================================
  // CHECK SUPABASE SESSION
  // =====================================================

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);
      setLoading(false);
    };

    getSession();

    // Listen for login / logout / Google OAuth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =====================================================
  // FETCH DASHBOARD DATA FROM SUPABASE
  // =====================================================

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchDashboardData = async () => {
      try {
        // =================================================
        // CURRENT MONTH START DATE
        // =================================================

        const now = new Date();

        const monthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

        const monthStartISO =
          monthStart.toISOString();

        // =================================================
        // TOTAL PROJECTS
        // =================================================

        const {
          count: projectCount,
          error: projectError,
        } = await supabase
          .from("projects")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "user_id",
            session.user.id
          );

        if (projectError) {
          console.error(
            "Projects fetch error:",
            projectError
          );
          return;
        }

        // =================================================
        // VERIFIED PROJECTS
        // =================================================
        // Completed projects are treated as verified
        // =================================================

        const {
          count: verifiedCount,
          error: verifiedError,
        } = await supabase
          .from("projects")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "user_id",
            session.user.id
          )
          .eq(
            "status",
            "Completed"
          );

        if (verifiedError) {
          console.error(
            "Verified projects fetch error:",
            verifiedError
          );
          return;
        }

        // =================================================
        // VERIFIED PROJECTS CREATED THIS MONTH
        // =================================================

        const {
          count: verifiedProjectsThisMonth,
          error: verifiedMonthlyError,
        } = await supabase
          .from("projects")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "user_id",
            session.user.id
          )
          .eq(
            "status",
            "Completed"
          )
          .gte(
            "created_at",
            monthStartISO
          );

        if (verifiedMonthlyError) {
          console.error(
            "Verified projects this month fetch error:",
            verifiedMonthlyError
          );
          return;
        }

        // =================================================
        // PROJECTS CREATED THIS MONTH
        // =================================================

        const {
          count: projectsThisMonth,
          error: monthlyProjectError,
        } = await supabase
          .from("projects")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "user_id",
            session.user.id
          )
          .gte(
            "created_at",
            monthStartISO
          );

        if (monthlyProjectError) {
          console.error(
            "Monthly projects fetch error:",
            monthlyProjectError
          );
          return;
        }

        // =================================================
        // ALL CARBON ESTIMATES
        // =================================================

        const {
          data: carbonData,
          error: carbonError,
        } = await supabase
          .from("carbon_estimates")
          .select(
            `
              area_hectares,
              estimated_co2e_tonnes,
              created_at
            `
          )
          .eq(
            "user_id",
            session.user.id
          );

        if (carbonError) {
          console.error(
            "Carbon estimates fetch error:",
            carbonError
          );
          return;
        }

        // =================================================
        // ISSUED CARBON CREDITS
        // =================================================

        const {
          data: creditsData,
          error: creditsError,
        } = await supabase
          .from("carbon_credits")
          .select(
            `
              credits_tco2e,
              status,
              issued_at
            `
          )
          .eq(
            "user_id",
            session.user.id
          )
          .eq(
            "status",
            "Issued"
          );

        if (creditsError) {
          console.error(
            "Carbon credits fetch error:",
            creditsError
          );
          return;
        }

        // =================================================
        // TOTAL ISSUED CREDITS
        // =================================================

        const issuedCredits =
          creditsData?.reduce(
            (sum, item) =>
              sum +
              Number(
                item.credits_tco2e || 0
              ),
            0
          ) || 0;

        // =================================================
        // ISSUED CREDITS THIS MONTH
        // =================================================

        const issuedCreditsThisMonth =
          creditsData?.reduce(
            (sum, item) => {
              if (!item.issued_at) {
                return sum;
              }

              const issuedDate =
                new Date(item.issued_at);

              if (
                issuedDate >=
                monthStart
              ) {
                return (
                  sum +
                  Number(
                    item.credits_tco2e || 0
                  )
                );
              }

              return sum;
            },
            0
          ) || 0;

        // =================================================
        // TOTAL AREA
        // =================================================

        const totalArea =
          carbonData?.reduce(
            (sum, item) =>
              sum +
              Number(
                item.area_hectares || 0
              ),
            0
          ) || 0;

        // =================================================
        // TOTAL CO2e
        // =================================================

        const totalCo2e =
          carbonData?.reduce(
            (sum, item) =>
              sum +
              Number(
                item.estimated_co2e_tonnes || 0
              ),
            0
          ) || 0;

        // =================================================
        // THIS MONTH CARBON DATA
        // =================================================

        const thisMonthCarbonData =
          carbonData?.filter((item) => {
            if (!item.created_at) {
              return false;
            }

            return (
              new Date(item.created_at) >=
              monthStart
            );
          }) || [];

        // =================================================
        // AREA CREATED THIS MONTH
        // =================================================

        const areaThisMonth =
          thisMonthCarbonData.reduce(
            (sum, item) =>
              sum +
              Number(
                item.area_hectares || 0
              ),
            0
          );

        // =================================================
        // CO2e CREATED THIS MONTH
        // =================================================

        const co2eThisMonth =
          thisMonthCarbonData.reduce(
            (sum, item) =>
              sum +
              Number(
                item.estimated_co2e_tonnes || 0
              ),
            0
          );

        // =================================================
        // REAL BLOCKCHAIN CARBON CREDITS
        // =================================================

        let blockchainCredits = 0;

        try {
          const blockchainResponse = await fetch(
            "http://127.0.0.1:5000/api/blockchain/dashboard"
          );

          if (blockchainResponse.ok) {
            const blockchainData =
              await blockchainResponse.json();

            blockchainCredits =
              Number(
                blockchainData?.carbon_credits?.balance || 0
              );

            console.log(
              "REAL BLOCKCHAIN BCC BALANCE:",
              blockchainCredits
            );
          }
        } catch (blockchainError) {
          console.error(
            "Blockchain credits fetch error:",
            blockchainError
          );
        }

        // =================================================
        // SAVE LIVE DASHBOARD DATA
        // =================================================

        setDashboardData({
          totalProjects:
            projectCount || 0,

          totalArea,

          totalCo2e,

          projectsThisMonth:
            projectsThisMonth || 0,

          areaThisMonth,

          co2eThisMonth,

          verifiedProjects:
            verifiedCount || 0,

          verifiedProjectsThisMonth:
            verifiedProjectsThisMonth || 0,

          issuedCredits:
            blockchainCredits,

          issuedCreditsThisMonth:
            blockchainCredits,
        });

        // =================================================
        // DEBUG
        // =================================================

        console.log(
          "Dashboard live data:",
          {
            totalProjects:
              projectCount || 0,

            totalArea,

            totalCo2e,

            projectsThisMonth:
              projectsThisMonth || 0,

            areaThisMonth,

            co2eThisMonth,

            verifiedProjects:
              verifiedCount || 0,

            verifiedProjectsThisMonth:
              verifiedProjectsThisMonth || 0,

            issuedCredits,

            issuedCreditsThisMonth,
          }
        );
      } catch (error) {
        console.error(
          "Dashboard data error:",
          error
        );
      }
    };

    fetchDashboardData();
  }, [session]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111318",
          color: "white",
          fontFamily: "Arial",
          fontSize: "20px",
        }}
      >
        Loading...
      </div>
    );
  }

  // =====================================================
  // USER NOT LOGGED IN
  // =====================================================

  if (!session) {
    return (
      <Auth
        onAuthenticated={() => {
          // Supabase onAuthStateChange
          // will update session
        }}
      />
    );
  }

  // =====================================================
  // USER LOGGED IN → DASHBOARD
  // =====================================================

  return (
    <div
      className={`theme-${activeTheme}`}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        background:
          "var(--bg-base)",
        color:
          "var(--text-primary)",
        fontFamily:
          "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      
      <Sidebar
  isOpen={sidebarOpen}
  onNavigate={handleNavigate}
/>



      {/* Main area */}
      <div
        className="dashboard-main"
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Header
          onToggleSidebar={() =>
            setSidebarOpen((value) => !value)
          }
          theme={theme}
          activeTheme={activeTheme}
          onChangeTheme={(newTheme) => {
            setTheme(newTheme);
          }}
        />

        {/* Dashboard content */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {activePage === "Dashboard" && (
            <>
              {/* Page Header */}
              <div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color:
                  "var(--text-primary)",
              }}
            >
              Dashboard Overview
            </h1>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color:
                  "var(--text-secondary)",
              }}
            >
              Welcome back! Here's
              what's happening with
              your blue carbon
              projects.
            </p>
          </div>

          {/* =================================================
              KPI CARDS
          ================================================= */}

          <div
            className="kpi-grid"
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            {kpiData.map((item) => {
              let liveValue =
                item.value;

              let liveTrend =
                item.trend;

              // =============================================
              // TOTAL PROJECTS
              // =============================================

              if (
                item.id ===
                "projects"
              ) {
                liveValue =
                  dashboardData.totalProjects.toLocaleString();

                liveTrend =
                  `+${dashboardData.projectsThisMonth} this month`;
              }

              // =============================================
              // TOTAL AREA
              // =============================================

              if (
                item.id === "area"
              ) {
                liveValue =
                  dashboardData.totalArea.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }
                  );

                liveTrend =
                  `+${dashboardData.areaThisMonth.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }
                  )} ha this month`;
              }

              // =============================================
              // ESTIMATED CO2e
              // =============================================

              if (
                item.id === "co2"
              ) {
                liveValue =
                  dashboardData.totalCo2e.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }
                  );

                liveTrend =
                  `+${dashboardData.co2eThisMonth.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }
                  )} tCO₂e this month`;
              }

              // =============================================
              // VERIFIED PROJECTS
              // =============================================

              if (
                item.id === "verified"
              ) {
                liveValue =
                  dashboardData.verifiedProjects.toLocaleString();

                liveTrend =
                  `+${dashboardData.verifiedProjectsThisMonth} this month`;
              }

              // =============================================
              // ISSUED CREDITS
              // =============================================

              if (
                item.id === "credits"
              ) {
                liveValue =
                  dashboardData.issuedCredits.toLocaleString();

                liveTrend =
                  `+${dashboardData.issuedCreditsThisMonth.toLocaleString()} BCC this month`;
              }

              return (
                <KpiCard
                  key={item.id}
                  {...item}
                  value={liveValue}
                  trend={liveTrend}
                />
              );
            })}
          </div>

          {/* =================================================
              PROJECT MAP + CO2e CHART
          ================================================= */}

          <div
            className="map-chart-row"
            style={{
              display: "flex",
              gap: 14,
              minHeight: 340,
              width: "100%",
            }}
          >
            <div
              style={{
                flex: 1.1,
                minWidth: 0,
                display: "flex",
              }}
            >
              <ProjectMap />
            </div>

            <div
              style={{
                flex: 0.9,
                minWidth: 0,
                display: "flex",
              }}
            >
              <SequestrationChart />
            </div>
          </div>

          {/* =================================================
              RECENT PROJECTS + VERIFICATION + BLOCKCHAIN
          ================================================= */}

          <div
            className="bottom-grid"
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <div
              style={{
                flex:
                  "1 1 260px",
                minWidth: 0,
              }}
            >
              <RecentProjects
  onViewAll={() => setActivePage("My Projects")}
/>
            </div>

            <div
              style={{
                flex:
                  "0 1 280px",
                minWidth: 0,
              }}
            >
              <VerificationStatus
                onViewAll={() => setActivePage("Verification")}
              />
            </div>

            <div
              style={{
                flex:
                  "1 1 280px",
                minWidth: 0,
              }}
            >
              <BlockchainRegistry />
            </div>
          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

              <QuickActions
                onAddProject={() =>
                  setShowMapSelector(true)
                }
              />
            </>
          )}

          {showMapSelector && (
            <div style={{ width: "100%", minWidth: 0 }}>
              <MapSelector />
            </div>
          )}

          {activePage === "My Projects" && (
            <MyProjects />
          )}

          {activePage === "Verification" && (
            <div
              style={{
                color: "var(--text-primary)",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Verification
            </div>
          )}

          {activePage === "Carbon Credits" && (
  <CarbonCredits />
)}
        </main>
      </div>
    </div>
  );
}

export default App;