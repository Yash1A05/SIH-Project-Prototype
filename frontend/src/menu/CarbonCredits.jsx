import { useEffect, useState } from "react";

const BACKEND_URL = "http://127.0.0.1:5000";

const DEFAULT_DATA = {
  balance: 70659,
  issued: 70859,
  retired: 100,
  transferred: 100,
};

const shorten = (value = "", start = 6, end = 4) => {
  if (!value) return "—";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const formatDate = (timestamp) => {
  if (!timestamp) return "01 Sep 2026";
  const date = new Date(Number(timestamp) * 1000);
  if (Number.isNaN(date.getTime())) return "01 Sep 2026";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Icon({ type, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "coins") {
    return (
      <svg {...common}>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
        <path d="M8 9c1.1.5 2.5.8 4 .8s2.9-.3 4-.8" />
      </svg>
    );
  }

  if (type === "issue") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  }

  if (type === "transfer") {
    return (
      <svg {...common}>
        <path d="M4 8h13" />
        <path d="m13 4 4 4-4 4" />
        <path d="M20 16H7" />
        <path d="m11 12-4 4 4 4" />
      </svg>
    );
  }

  if (type === "retire") {
    return (
      <svg {...common}>
        <path d="M12 3c2 3 6 5.2 6 10a6 6 0 1 1-12 0c0-2.8 1.6-5 4-7.1" />
        <path d="M12 21c-1.8-1.2-2.6-2.8-2.3-4.5.2-1.1 1-2.1 2.3-3.5 1.4 1.7 2.3 3 2.3 4.4 0 1.6-.8 2.8-2.3 3.6Z" />
      </svg>
    );
  }

  if (type === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (type === "external") {
    return (
      <svg {...common}>
        <path d="M14 5h5v5" />
        <path d="M19 5 11 13" />
        <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
      </svg>
    );
  }

  if (type === "refresh") {
    return (
      <svg {...common}>
        <path d="M20 11a8 8 0 0 0-14.7-4L4 9" />
        <path d="M4 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.7 4L20 15" />
        <path d="M20 20v-5h-5" />
      </svg>
    );
  }

  if (type === "close") {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  return null;
}

export default function CarbonCredits() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [projectId, setProjectId] = useState("BCMRV-20260901-102413");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [latest, setLatest] = useState(null);
  const [activities, setActivities] = useState([]);

  const loadBlockchainData = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

     const [
  dashboardResponse,
  latestResponse,
  activityResponse,
] = await Promise.all([
  fetch(`${BACKEND_URL}/api/blockchain/dashboard`),
  fetch(`${BACKEND_URL}/api/blockchain/latest`),
  fetch(`${BACKEND_URL}/api/blockchain/activity`),
]);

      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json();

        setData((current) => ({
  ...current,

  // Keep dashboard balance from blockchain
  balance: Number(
    dashboard?.carbon_credits?.balance ?? current.balance
  ),

  // Total issued credits should remain the configured total
  issued: current.issued,

  // Keep these totals unchanged unless you later connect
  // them to dedicated blockchain transaction APIs
  retired: current.retired,
  transferred: current.transferred,
}));
      }

      if (latestResponse.ok) {
        const latestData = await latestResponse.json();

        if (latestData?.status === "success") {
          setLatest(latestData.transaction);

          if (latestData.transaction?.project_id) {
            setProjectId(latestData.transaction.project_id);
          }
        }
      }

      // Load real Issue → Transfer → Retire blockchain activity
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();

        if (activityData?.status === "success") {
          setActivities(
            Array.isArray(activityData.activities)
              ? activityData.activities
              : []
          );
        }
      }
    } catch (error) {
      console.error("Carbon credits blockchain fetch error:", error);
      setMessage({
        type: "error",
        text: "Blockchain backend is not reachable. Please make sure Flask is running.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const closeModal = () => {
    if (!actionLoading) {
      setModal(null);
      setAmount("");
      setRecipient("");
    }
  };

  const performTransfer = async () => {
    const numericAmount = Number(amount);

    if (!recipient.trim()) {
      setMessage({ type: "error", text: "Please enter recipient wallet address." });
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid BCC amount." });
      return;
    }

    if (numericAmount > data.balance) {
      setMessage({ type: "error", text: "Insufficient BCC balance." });
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/blockchain/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipient.trim(),
          amount: numericAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok || result?.status === "error") {
        throw new Error(result?.message || "Transfer failed.");
      }

      setMessage({
        type: "success",
        text: `${numericAmount.toLocaleString()} BCC transferred successfully.`,
      });

      setData((current) => ({
        ...current,
        balance: Math.max(0, current.balance - numericAmount),
        transferred: current.transferred + numericAmount,
      }));

      setModal(null);
      setAmount("");
      setRecipient("");
      await loadBlockchainData(true);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const performRetire = async () => {
    const numericAmount = Number(amount);

    if (!projectId.trim()) {
      setMessage({ type: "error", text: "Project ID is required." });
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid BCC amount." });
      return;
    }

    if (numericAmount > data.balance) {
      setMessage({ type: "error", text: "Insufficient BCC balance." });
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/blockchain/retire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId.trim(),
          amount: numericAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok || result?.status === "error") {
        throw new Error(result?.message || "Retirement failed.");
      }

      setMessage({
        type: "success",
        text: `${numericAmount.toLocaleString()} BCC retired successfully.`,
      });

      setData((current) => ({
        ...current,
        balance: Math.max(0, current.balance - numericAmount),
        retired: current.retired + numericAmount,
      }));

      setModal(null);
      setAmount("");
      await loadBlockchainData(true);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Balance",
      value: data.balance,
      note: "Available Balance",
      icon: "coins",
      tone: "purple",
    },
    {
      label: "Total Issued",
      value: data.issued,
      note: "All time issued",
      icon: "issue",
      tone: "green",
    },
    {
      label: "Total Retired",
      value: data.retired,
      note: "All time retired",
      icon: "retire",
      tone: "red",
    },
    {
      label: "Total Transferred",
      value: data.transferred,
      note: "All time transferred",
      icon: "transfer",
      tone: "blue",
    },
  ];

  return (
    <div className="carbon-credits-page">
      <style>{`
        .carbon-credits-page {
          width: 100%;
          min-height: 100%;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          animation: ccPageIn .35s ease-out;
        }

        @keyframes ccPageIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ccSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes ccPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .72; transform: scale(1.04); }
        }

        .cc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 16px;
        }

        .cc-title {
          margin: 0;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.35px;
        }

        .cc-subtitle {
          margin: 5px 0 0;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .cc-refresh {
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          border-radius: 8px;
          padding: 8px 11px;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: .2s ease;
        }

        .cc-refresh:hover {
          color: var(--text-primary);
          border-color: rgba(168, 85, 247, .55);
          transform: translateY(-1px);
        }

        .cc-refresh.spinning svg {
          animation: ccSpin .7s linear infinite;
        }

        .cc-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .cc-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
        }

        .cc-card:hover {
          transform: translateY(-2px);
          border-color: rgba(168, 85, 247, .32);
          box-shadow: 0 10px 28px rgba(0,0,0,.16);
        }

        .cc-stat {
          padding: 17px;
          min-height: 135px;
        }

        .cc-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .cc-stat-label {
          font-size: 13px;
          color: var(--text-primary);
        }

        .cc-icon {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cc-icon.purple {
          color: #c084fc;
          background: rgba(168, 85, 247, .16);
        }

        .cc-icon.green {
          color: #22c55e;
          background: rgba(34, 197, 94, .15);
        }

        .cc-icon.red {
          color: #ef4444;
          background: rgba(239, 68, 68, .13);
        }

        .cc-icon.blue {
          color: #3b82f6;
          background: rgba(59, 130, 246, .14);
        }

        .cc-stat-value {
          margin-top: 9px;
          font-size: 30px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -.5px;
        }

        .cc-unit {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-left: 5px;
        }

        .cc-equivalent {
          margin-top: 10px;
          font-size: 12px;
          color: #22c55e;
        }

        .cc-equivalent.red { color: #ef4444; }
        .cc-equivalent.blue { color: #3b82f6; }

        .cc-note {
          margin-top: 7px;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .cc-section {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 17px;
          margin-bottom: 16px;
        }

        .cc-section-title {
          margin: 0;
          font-size: 18px;
          font-weight: 650;
        }

        .cc-section-subtitle {
          margin: 5px 0 14px;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .cc-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .cc-action {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          transition: .22s ease;
        }

        .cc-action:hover {
          transform: translateY(-2px);
        }

        .cc-action.green:hover { border-color: rgba(34,197,94,.55); }
        .cc-action.blue:hover { border-color: rgba(59,130,246,.55); }
        .cc-action.red:hover { border-color: rgba(239,68,68,.55); }

        .cc-action-head {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cc-action-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cc-action-icon.green {
          color: #22c55e;
          background: rgba(34,197,94,.15);
        }

        .cc-action-icon.blue {
          color: #3b82f6;
          background: rgba(59,130,246,.14);
        }

        .cc-action-icon.red {
          color: #ef4444;
          background: rgba(239,68,68,.13);
        }

        .cc-action-name {
          font-size: 15px;
          font-weight: 650;
        }

        .cc-action-description {
          margin-top: 3px;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.45;
        }

        .cc-action-button {
          width: 100%;
          margin-top: 15px;
          border-radius: 7px;
          padding: 9px 12px;
          background: transparent;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: .2s ease;
        }

        .cc-action-button.green {
          color: #22c55e;
          border: 1px solid rgba(34,197,94,.48);
        }

        .cc-action-button.blue {
          color: #3b82f6;
          border: 1px solid rgba(59,130,246,.48);
        }

        .cc-action-button.red {
          color: #ef4444;
          border: 1px solid rgba(239,68,68,.48);
        }

        .cc-action-button:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,.025);
        }

        .cc-table-wrap {
          overflow-x: auto;
        }

        .cc-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 780px;
        }

        .cc-table th {
          text-align: left;
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 500;
          padding: 10px 8px;
          border-bottom: 1px solid var(--border);
        }

        .cc-table td {
          padding: 12px 8px;
          border-bottom: 1px solid var(--border);
          font-size: 11px;
          color: var(--text-primary);
        }

        .cc-table tr:last-child td {
          border-bottom: none;
        }

        .cc-tx-type {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
        }

        .cc-mini-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cc-mini-icon.green {
          color: #22c55e;
          background: rgba(34,197,94,.12);
        }

        .cc-mini-icon.blue {
          color: #3b82f6;
          background: rgba(59,130,246,.12);
        }

        .cc-mini-icon.red {
          color: #ef4444;
          background: rgba(239,68,68,.12);
        }

        .cc-hash {
          font-family: monospace;
          color: #c084fc;
        }

        .cc-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 20px;
          padding: 5px 9px;
          font-size: 10px;
          font-weight: 600;
        }

        .cc-status.confirmed {
          color: #22c55e;
          background: rgba(34,197,94,.12);
        }

        .cc-status.retired {
          color: #ef4444;
          background: rgba(239,68,68,.12);
        }

        .cc-empty {
          text-align: center;
          padding: 26px 10px;
          color: var(--text-secondary);
        }

        .cc-alert {
          margin-bottom: 14px;
          border-radius: 9px;
          padding: 10px 12px;
          font-size: 12px;
          border: 1px solid var(--border);
          animation: ccPageIn .2s ease-out;
        }

        .cc-alert.success {
          color: #22c55e;
          background: rgba(34,197,94,.08);
          border-color: rgba(34,197,94,.28);
        }

        .cc-alert.error {
          color: #ef4444;
          background: rgba(239,68,68,.08);
          border-color: rgba(239,68,68,.28);
        }

        .cc-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.58);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: ccPageIn .2s ease-out;
        }

        .cc-modal {
          width: min(480px, 100%);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 25px 70px rgba(0,0,0,.4);
        }

        .cc-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .cc-modal-title {
          margin: 0;
          font-size: 18px;
        }

        .cc-close {
          width: 32px;
          height: 32px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .cc-form-label {
          display: block;
          margin: 16px 0 7px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .cc-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 11px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-input);
          color: var(--text-primary);
          outline: none;
          font-family: inherit;
          font-size: 13px;
        }

        .cc-input:focus {
          border-color: rgba(168,85,247,.65);
          box-shadow: 0 0 0 3px rgba(168,85,247,.08);
        }

        .cc-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
        }

        .cc-modal-button {
          border-radius: 8px;
          padding: 9px 15px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .cc-cancel {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .cc-confirm {
          border: 1px solid transparent;
          color: white;
        }

        .cc-confirm.blue { background: #2563eb; }
        .cc-confirm.red { background: #dc2626; }

        .cc-confirm:disabled,
        .cc-modal-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .cc-stats { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .cc-actions { grid-template-columns: 1fr; }
        }

        @media (max-width: 650px) {
          .cc-stats { grid-template-columns: 1fr; }
          .cc-header { align-items: flex-start; flex-direction: column; }
        }
      `}</style>

      <div className="cc-header">
        <div>
          <h1 className="cc-title">Carbon Credits</h1>
          <p className="cc-subtitle">
            Manage your carbon credits lifecycle on the blockchain
          </p>
        </div>

        <button
          className={`cc-refresh ${refreshing ? "spinning" : ""}`}
          onClick={() => loadBlockchainData(true)}
          disabled={refreshing}
          title="Refresh blockchain data"
        >
          <Icon type="refresh" size={15} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && (
        <div className={`cc-alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="cc-stats">
        {statCards.map((card) => (
          <div className="cc-card cc-stat" key={card.label}>
            <div className="cc-stat-top">
              <div className="cc-stat-label">{card.label}</div>
              <div className={`cc-icon ${card.tone}`}>
                <Icon type={card.icon} size={23} />
              </div>
            </div>

            <div className="cc-stat-value">
              {loading ? "—" : formatNumber(card.value)}
              <span className="cc-unit">BCC</span>
            </div>

            <div
              className={`cc-equivalent ${
                card.tone === "red"
                  ? "red"
                  : card.tone === "blue"
                    ? "blue"
                    : ""
              }`}
            >
              ≈ {formatNumber(card.value)} tCO₂e
            </div>

            <div className="cc-note">{card.note}</div>
          </div>
        ))}
      </div>

      <section className="cc-section">
        <h2 className="cc-section-title">Credit Actions</h2>
        <p className="cc-section-subtitle">
          Issue, transfer or retire carbon credits
        </p>

        <div className="cc-actions">
          <div className="cc-action green">
            <div className="cc-action-head">
              <div className="cc-action-icon green">
                <Icon type="issue" size={29} />
              </div>
              <div>
                <div className="cc-action-name">Issue Credits</div>
                <div className="cc-action-description">
                  Credits are issued after a verified MRV assessment.
                </div>
              </div>
            </div>

            <button
              className="cc-action-button green"
              onClick={() =>
                setMessage({
                  type: "success",
                  text: "Credit issuance is handled automatically from the verified MRV workflow.",
                })
              }
            >
              Issued Credits <Icon type="arrow" size={16} />
            </button>
          </div>

          <div className="cc-action blue">
            <div className="cc-action-head">
              <div className="cc-action-icon blue">
                <Icon type="transfer" size={29} />
              </div>
              <div>
                <div className="cc-action-name">Transfer Credits</div>
                <div className="cc-action-description">
                  Transfer BCC to another verified blockchain account.
                </div>
              </div>
            </div>

            <button
              className="cc-action-button blue"
              onClick={() => {
                setMessage(null);
                setModal("transfer");
              }}
            >
              Transfer Credits <Icon type="arrow" size={16} />
            </button>
          </div>

          <div className="cc-action red">
            <div className="cc-action-head">
              <div className="cc-action-icon red">
                <Icon type="retire" size={29} />
              </div>
              <div>
                <div className="cc-action-name">Retire Credits</div>
                <div className="cc-action-description">
                  Permanently retire credits for carbon-neutrality claims.
                </div>
              </div>
            </div>

            <button
              className="cc-action-button red"
              onClick={() => {
                setMessage(null);
                setModal("retire");
              }}
            >
              Retire Credits <Icon type="arrow" size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="cc-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div>
            <h2 className="cc-section-title">Recent Credit Activity</h2>
            <p className="cc-section-subtitle" style={{ marginBottom: 0 }}>
              Latest blockchain transactions
            </p>
          </div>
        </div>

        <div className="cc-table-wrap" style={{ marginTop: 14 }}>
          <table className="cc-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount (BCC)</th>
                <th>From</th>
                <th>To</th>
                <th>Project ID</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
                <th>Tx Hash</th>
              </tr>
            </thead>

            <tbody>
              {activities.length > 0 ? (
                activities.map((tx, index) => (
                  <tr key={`${tx.transaction_hash || "tx"}-${index}`}>

                    {/* TYPE */}
                    <td>
                      <div className="cc-tx-type">
                        <span
                          className={`cc-mini-icon ${
                            tx.type === "Issue"
                              ? "green"
                              : tx.type === "Transfer"
                                ? "blue"
                                : "red"
                          }`}
                        >
                          <Icon
                            type={
                              tx.type === "Issue"
                                ? "issue"
                                : tx.type === "Transfer"
                                  ? "transfer"
                                  : "retire"
                            }
                            size={13}
                          />
                        </span>
                        {tx.type}
                      </div>
                    </td>

                    {/* AMOUNT */}
                    <td
                      style={{
                        color:
                          tx.type === "Issue"
                            ? "#22c55e"
                            : tx.type === "Transfer"
                              ? "#3b82f6"
                              : "#ef4444",
                      }}
                    >
                      <strong>
                        {tx.type === "Issue" ? "+" : "-"}
                        {formatNumber(tx.amount)}
                      </strong>
                    </td>

                    {/* FROM */}
                    <td className="cc-hash">
                      {tx.from === "System"
                        ? "System"
                        : shorten(tx.from)}
                    </td>

                    {/* TO */}
                    <td className="cc-hash">
                      {tx.to === "Retired"
                        ? "Retired"
                        : shorten(tx.to)}
                    </td>

                    {/* PROJECT ID */}
                    <td className="cc-hash">
                      {tx.project_id || "—"}
                    </td>

                    {/* DATE */}
                    <td>
                      {formatDate(tx.timestamp)}
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`cc-status ${
                          tx.status === "Retired"
                            ? "retired"
                            : "confirmed"
                        }`}
                      >
                        ✓ {tx.status || "Confirmed"}
                      </span>
                    </td>

                    {/* TRANSACTION HASH */}
                    <td className="cc-hash">
                      {shorten(
                        tx.transaction_hash,
                        6,
                        4
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="cc-empty"
                  >
                    No blockchain transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="cc-modal-backdrop" onMouseDown={closeModal}>
          <div className="cc-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="cc-modal-head">
              <h2 className="cc-modal-title">
                {modal === "transfer" ? "Transfer Credits" : "Retire Credits"}
              </h2>

              <button className="cc-close" onClick={closeModal} disabled={actionLoading}>
                <Icon type="close" size={17} />
              </button>
            </div>

            <p className="cc-subtitle" style={{ marginTop: 6 }}>
              Available balance: <strong>{formatNumber(data.balance)} BCC</strong>
            </p>

            {modal === "transfer" ? (
              <>
                <label className="cc-form-label">Recipient Wallet Address</label>
                <input
                  className="cc-input"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder="0x..."
                  spellCheck={false}
                />
              </>
            ) : (
              <>
                <label className="cc-form-label">Project ID</label>
                <input
                  className="cc-input"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  placeholder="BCMRV-..."
                />
              </>
            )}

            <label className="cc-form-label">Amount (BCC)</label>
            <input
              className="cc-input"
              type="number"
              min="1"
              max={data.balance}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="100"
            />

            <div className="cc-modal-actions">
              <button
                className="cc-modal-button cc-cancel"
                onClick={closeModal}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className={`cc-modal-button cc-confirm ${
                  modal === "transfer" ? "blue" : "red"
                }`}
                onClick={
                  modal === "transfer" ? performTransfer : performRetire
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Processing..."
                  : modal === "transfer"
                    ? "Confirm Transfer"
                    : "Confirm Retirement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
