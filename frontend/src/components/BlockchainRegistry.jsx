import React, { useEffect, useState } from "react";

export default function BlockchainRegistry() {
  const [blockchain, setBlockchain] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "http://127.0.0.1:5000";

  useEffect(() => {
    async function loadBlockchainData() {
      try {
        setLoading(true);

        // Dashboard blockchain data
        const dashboardResponse = await fetch(
          `${API_URL}/api/blockchain/dashboard`
        );

        if (!dashboardResponse.ok) {
          throw new Error(
            "Failed to fetch blockchain dashboard"
          );
        }

        const dashboardData =
          await dashboardResponse.json();

        // Recent REAL blockchain transactions
        const transactionsResponse = await fetch(
          `${API_URL}/api/blockchain/transactions`
        );

        if (!transactionsResponse.ok) {
          throw new Error(
            "Failed to fetch blockchain transactions"
          );
        }

        const transactionsData =
          await transactionsResponse.json();

        console.log(
          "REAL BLOCKCHAIN DASHBOARD:",
          dashboardData
        );

        console.log(
          "REAL BLOCKCHAIN TRANSACTIONS:",
          transactionsData
        );

        setBlockchain(dashboardData);

        if (transactionsData.status === "success") {
          setTransactions(
            transactionsData.transactions || []
          );
        }

        setLoading(false);

      } catch (err) {
        console.error(
          "Blockchain Registry Error:",
          err
        );

        setError(err.message);
        setLoading(false);
      }
    }

    loadBlockchainData();
  }, []);

  const shortenAddress = (address) => {
    if (!address) return "-";

    return (
      address.slice(0, 6) +
      "..." +
      address.slice(-4)
    );
  };

  const shortenHash = (hash) => {
    if (!hash) return "-";

    return (
      hash.slice(0, 6) +
      "..." +
      hash.slice(-4)
    );
  };

  if (loading) {
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
        }}
      >
        <span
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Blockchain Registry
        </span>

        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: 12,
            padding: "20px 0",
          }}
        >
          Loading blockchain data...
        </div>
      </div>
    );
  }

  if (error || !blockchain) {
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
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Blockchain Registry
          </span>

          <span
            style={{
              color: "#ef4444",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Offline
          </span>
        </div>

        <div
          style={{
            color: "#ef4444",
            fontSize: 11,
            padding: "20px 0",
          }}
        >
          Unable to load blockchain data.
        </div>
      </div>
    );
  }

  const carbonCredits =
    blockchain.carbon_credits;

  const chain =
    blockchain.blockchain;

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
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Blockchain Registry
        </span>

        <span
          style={{
            color: "#22c55e",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Connected
        </span>
      </div>


      {/* RECENT REAL CARBON CREDIT TRANSACTIONS */}

      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <div
            key={`${transaction.transaction_hash}-${transaction.block_number}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "rgba(59,130,246,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                width="14"
                height="14"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>

            <div
              style={{
                color: "var(--accent-cyan)",
                fontSize: 11,
                fontFamily: "monospace",
                minWidth: 90,
              }}
              title={transaction.transaction_hash}
            >
              {shortenHash(transaction.transaction_hash)}
            </div>

            <div
              style={{
                flex: 1,
                color: "var(--text-secondary)",
                fontSize: 11,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Carbon Credits — {Number(transaction.amount || 0).toLocaleString()} BCC
            </div>

            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 11,
                whiteSpace: "nowrap",
              }}
            >
              {transaction.date}
            </div>

            <span
              style={{
                color: "#22c55e",
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Confirmed
            </span>
          </div>
        ))
      ) : (
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 11,
            padding: "12px 0",
          }}
        >
          No carbon-credit transactions found yet.
        </div>
      )}

      {/* REGISTRY CONTRACT */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 0",
        }}
      >

        {/* ICON */}

        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background:
              "rgba(34,197,94,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            width="14"
            height="14"
          >
            <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>


        {/* CONTRACT ADDRESS */}

        <div
          style={{
            color: "var(--accent-cyan)",
            fontSize: 11,
            fontFamily: "monospace",
            minWidth: 90,
          }}
          title={
            chain.registry_contract
          }
        >
          {shortenAddress(
            chain.registry_contract
          )}
        </div>


        {/* DESCRIPTION */}

        <div
          style={{
            flex: 1,
            color: "var(--text-secondary)",
            fontSize: 11,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          BlueCarbon Evidence Registry
        </div>


        {/* DATE */}

        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          {transactions[0]?.date || "-"}
        </div>


        {/* STATUS */}

        <span
          style={{
            color: "#22c55e",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Confirmed
        </span>

      </div>


      {/* CREDIT SUMMARY */}

      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop:
            "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: 11,
        }}
      >
        Blockchain Balance:{" "}
        <strong
          style={{
            color: "var(--text-primary)",
          }}
        >
          {carbonCredits.balance.toLocaleString()} BCC
        </strong>
      </div>

    </div>
  );
}