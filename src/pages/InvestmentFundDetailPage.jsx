import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { getInvestmentFundById } from "../services/investmentFundService.js";
import { getPermissions } from "../services/AuthService.js";
import Sidebar from "../components/Sidebar.jsx";
import "./CreateEmployeePage.css";
import "./EmployeesPage.css";
import "./InvestmentFundDetailPage.css";

const PERIOD_LABELS = {
  monthly:   "Mesečno",
  quarterly: "Kvartalno",
  yearly:    "Godišnje",
};

function fmtUSD(v) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(v);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)}.${parseInt(m)}.${y}.`;
}

function Field({ label, value }) {
  return (
    <div className="ifd-field">
      <span className="ifd-field-label">{label}</span>
      <span className="ifd-field-value">{value || "—"}</span>
    </div>
  );
}

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8, 20, 44, 0.95)",
      border: "1px solid rgba(148, 163, 184, 0.2)",
      borderRadius: 12,
      padding: "10px 14px",
    }}>
      <p style={{ margin: "0 0 4px", color: "#94a3b8", fontSize: 12 }}>{label}</p>
      <p style={{ margin: 0, color: "#60a5fa", fontWeight: 700, fontSize: 14 }}>
        {fmtUSD(payload[0].value)}
      </p>
    </div>
  );
}

export default function InvestmentFundDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [sellNote, setSellNote] = useState("");

  const permissions = getPermissions();
  const isSupervisor =
    permissions.includes("admin") || permissions.includes("supervisor");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getInvestmentFundById(Number(id));
        if (!cancelled) setFund(data);
      } catch (err) {
        if (!cancelled)
          setPageError(err.message || "Greška pri učitavanju fonda.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="page-bg">
        <Sidebar />
        <div className="create-page">
          <div className="create-form-card">
            <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#cbd5e1", fontSize: 18 }}>Učitavanje...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageError || !fund) {
    return (
      <div className="page-bg">
        <Sidebar />
        <div className="create-page">
          <div className="create-form-card">
            <div style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#f87171", fontSize: 18 }}>
                {pageError || "Fond nije pronađen."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profit = fund.fundValue - fund.totalInvested;
  const profitPct = ((profit / fund.totalInvested) * 100).toFixed(2);
  const profitPos = profit >= 0;
  const chartData = fund.performance[period];

  function handleSell(pos) {
    const ok = window.confirm(
      `Prodati ${pos.quantity} × ${pos.ticker} po tržišnoj ceni?`
    );
    if (ok) {
      setSellNote(
        `Nalog za prodaju ${pos.quantity} × ${pos.ticker} je kreiran.`
      );
      setTimeout(() => setSellNote(""), 5000);
    }
  }

  return (
    <div className="page-bg">
      <Sidebar />
      <div className="create-page">
        <div className="create-form-card">

          {/* ── Header ── */}
          <div className="create-header">
            <div className="create-header-text">
              <p className="create-eyebrow">INVESTICIONI FOND</p>
              <h1>{fund.name}</h1>
              <p className="create-subtitle">{fund.strategyDescription}</p>
            </div>
            <div className="create-header-actions">
              <button
                className="create-btn create-btn-secondary"
                onClick={() => navigate(-1)}
              >
                Nazad
              </button>
            </div>
          </div>

          {/* ── Sell notification ── */}
          {sellNote && (
            <div className="ifd-sell-notification">{sellNote}</div>
          )}

          {/* ── Overview card ── */}
          <div className="ifd-overview-card">
            <div className="ifd-overview-icon">IF</div>
            <div className="ifd-overview-info">
              <h2>{fund.name}</h2>
              <p>{fund.accountNumber}</p>
              <div className="ifd-meta-row">
                <span className="ifd-badge-fund">Investicioni fond</span>
                <span className="ifd-badge-active">Aktivan</span>
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="ifd-stats-row">
            <div className="ifd-stat-card">
              <span className="ifd-stat-label">Vrednost fonda</span>
              <span className="ifd-stat-value">{fmtUSD(fund.fundValue)}</span>
            </div>
            <div className="ifd-stat-card">
              <span className="ifd-stat-label">Likvidnost (keš)</span>
              <span className="ifd-stat-value">{fmtUSD(fund.liquidity)}</span>
              <span className="ifd-stat-sub">Račun: {fund.accountNumber}</span>
            </div>
            <div className="ifd-stat-card">
              <span className="ifd-stat-label">Profit</span>
              <span className={`ifd-stat-value ${profitPos ? "ifd-stat-positive" : "ifd-stat-negative"}`}>
                {profitPos ? "+" : ""}{fmtUSD(profit)}
              </span>
              <span className="ifd-stat-sub">
                {profitPos ? "+" : ""}{profitPct}% vs. uloženo
              </span>
            </div>
            <div className="ifd-stat-card">
              <span className="ifd-stat-label">Min. ulog</span>
              <span className="ifd-stat-value">{fmtUSD(fund.minimumInvestment)}</span>
            </div>
          </div>

          {/* ── Info grid ── */}
          <div className="ifd-info-grid">
            <div className="ifd-info-card">
              <h3 className="ifd-section-title">Finansijski detalji</h3>
              <div className="ifd-fields-grid">
                <Field label="Menadžer" value={fund.managerEmail} />
                <Field label="Broj računa" value={fund.accountNumber} />
                <Field label="Ukupno uloženo" value={fmtUSD(fund.totalInvested)} />
                <Field label="Prinos" value={`${profitPos ? "+" : ""}${profitPct}%`} />
              </div>
            </div>

            <div className="ifd-info-card">
              <h3 className="ifd-section-title">Opis strategije</h3>
              <div className="ifd-strategy-text">{fund.strategyDescription}</div>
            </div>
          </div>

          {/* ── Positions table ── */}
          <div className="ifd-table-card">
            <h3 className="ifd-section-title">
              Hartije od vrednosti ({fund.positions.length})
            </h3>
            <table className="ifd-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Cena</th>
                  <th>Promena</th>
                  <th>Obim</th>
                  <th>Init. Margin</th>
                  <th>Datum nabavke</th>
                  <th>Količina</th>
                  {isSupervisor && <th>Akcija</th>}
                </tr>
              </thead>
              <tbody>
                {fund.positions.map((pos) => (
                  <tr key={pos.ticker}>
                    <td><span className="ifd-ticker">{pos.ticker}</span></td>
                    <td>{fmtUSD(pos.price)}</td>
                    <td>
                      <span className={pos.change >= 0 ? "ifd-change-pos" : "ifd-change-neg"}>
                        {pos.change >= 0 ? "+" : ""}{pos.change.toFixed(2)}%
                      </span>
                    </td>
                    <td>{pos.volume.toLocaleString()}</td>
                    <td>{fmtUSD(pos.initialMarginCost)}</td>
                    <td>{fmtDate(pos.acquisitionDate)}</td>
                    <td>{pos.quantity}</td>
                    {isSupervisor && (
                      <td>
                        <button
                          className="ifd-sell-btn"
                          onClick={() => handleSell(pos)}
                        >
                          Prodaj
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Performance chart ── */}
          <div className="ifd-chart-card">
            <div className="ifd-chart-header">
              <h3 className="ifd-section-title" style={{ margin: 0 }}>
                Performanse fonda
              </h3>
              <div className="ifd-period-tabs">
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`ifd-period-tab${period === key ? " ifd-period-tab--active" : ""}`}
                    onClick={() => setPeriod(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis
                  dataKey="period"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(148,163,184,0.12)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={52}
                />
                <Tooltip content={<DarkTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#60a5fa" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}
