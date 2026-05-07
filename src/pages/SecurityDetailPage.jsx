import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSecurityDetails } from "../hooks/useSecurityDetails";
import Sidebar from "../components/Sidebar.jsx";
import SecurityChart from "../components/securities/SecurityChart";
import SecurityHistoryTable from "../components/securities/SecurityHistoryTable";
import OptionsTable from "../components/securities/OptionsTable";
import "./SecurityDetailPage.css";

function isPastSettlement(value) {
  if (!value) return false;
  const ms = typeof value === "number" && value < 1e12 ? value * 1000 : Date.parse(value);
  if (!Number.isFinite(ms)) return false;
  return ms < Date.now();
}

function pickRowsAroundSharedPrice(rows, sharedPrice, count) {
  if (!Array.isArray(rows) || rows.length === 0) return rows || [];
  if (count === "all" || !count) return rows;
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return rows;
  // Spec p.45: show `n` rows above and `n` rows below sharedPrice. We do that
  // by sorting on strike, locating the boundary index, and slicing symmetric
  // windows around it.
  const sorted = [...rows].sort((a, b) => a.strike - b.strike);
  let split = sorted.findIndex((r) => r.strike >= sharedPrice);
  if (split === -1) split = sorted.length;
  const above = sorted.slice(split, split + n);
  const below = sorted.slice(Math.max(0, split - n), split);
  return [...below, ...above];
}

function SecurityDetailPage() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const { detail, history, options, period, setPeriod, loading, error } =
    useSecurityDetails(ticker);

  const role = sessionStorage.getItem("userRole") || "";
  const isClient = role === "client";

  const [selectedSettlement, setSelectedSettlement] = useState("");
  const [strikeCount, setStrikeCount] = useState("10");

  const expired = isPastSettlement(detail?.settlementDate);

  const settlementDates = useMemo(() => {
    return (options || []).map((s) => s.settlementDate);
  }, [options]);

  const visibleOptionSets = useMemo(() => {
    if (!options || options.length === 0) return [];
    const filtered = selectedSettlement
      ? options.filter((s) => s.settlementDate === selectedSettlement)
      : options;
    if (!detail?.price) return filtered;
    return filtered.map((s) => ({
      ...s,
      options: pickRowsAroundSharedPrice(s.options, detail.price, strikeCount),
    }));
  }, [options, selectedSettlement, strikeCount, detail]);

  if (loading) {
    return (
      <div className="security-detail-page">
        <Sidebar />
        <div className="detail-container">
          <p style={{ padding: "20px", textAlign: "center" }}>Učitavanje…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="security-detail-page">
        <Sidebar />
        <div className="detail-container">
          <p style={{ padding: "20px", color: "#fca5a5" }}>Greška: {error}</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="security-detail-page">
        <Sidebar />
        <div className="detail-container">
          <p style={{ padding: "20px" }}>Hartija nije pronađena.</p>
        </div>
      </div>
    );
  }

  function goCreateOrder(direction) {
    const params = new URLSearchParams();
    if (detail.id) params.set("listingId", detail.id);
    if (detail.ticker) params.set("ticker", detail.ticker);
    params.set("direction", direction);
    navigate(`/orders/new?${params.toString()}`);
  }

  return (
    <div className="security-detail-page">
      <Sidebar />
      <div className="detail-container sd-detail">
        <div className="security-header sd-header">
          <button className="sd-back-btn" onClick={() => navigate(-1)} aria-label="Nazad">
            ←
          </button>
          <div className="header-info">
            <h1 className="sd-title">{detail.ticker}</h1>
            <p className="security-name">{detail.name}</p>
            <div className="header-stats">
              <div className="stat">
                <span className="stat-label">Cena:</span>
                <span className="stat-value">${detail.price.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Ask:</span>
                <span className="stat-value">${detail.ask.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Bid:</span>
                <span className="stat-value">${detail.bid.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Promena:</span>
                <span className={`stat-value ${detail.change >= 0 ? "positive" : "negative"}`}>
                  {detail.change >= 0 ? "+" : ""}{detail.change.toFixed(2)}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Volume:</span>
                <span className="stat-value">{(detail.volume / 1000000).toFixed(1)}M</span>
              </div>
              {detail.settlementDate && (
                <div className="stat">
                  <span className="stat-label">Datum isteka:</span>
                  <span className="stat-value">
                    {new Date(detail.settlementDate).toLocaleDateString("sr-RS")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="sd-actions">
            <button
              className="sd-buy-btn"
              onClick={() => goCreateOrder("buy")}
              disabled={expired}
              title={expired ? "Ugovor je istekao" : "Otvori formu za kupovinu"}
            >
              Kupi {detail.ticker}
            </button>
            <button
              className="sd-sell-btn"
              onClick={() => goCreateOrder("sell")}
              disabled={expired}
              title={expired ? "Ugovor je istekao" : "Otvori formu za prodaju"}
            >
              Prodaj
            </button>
          </div>
        </div>

        {expired && (
          <div className="sd-banner sd-banner--warning">
            Ugovor je istekao — kreiranje novog naloga je onemogućeno. Možete pregledati
            istorijske podatke.
          </div>
        )}

        <SecurityChart data={history} period={period} setPeriod={setPeriod} />

        {history.length > 0 && <SecurityHistoryTable data={history} />}

        {options.length > 0 && !isClient && (
          <div className="sd-options-section">
            <div className="sd-options-controls">
              <h3 className="sd-options-title">Lanac opcija</h3>
              <div className="sd-options-filters">
                <label>
                  <span>Datum isteka:</span>
                  <select
                    value={selectedSettlement}
                    onChange={(e) => setSelectedSettlement(e.target.value)}
                  >
                    <option value="">Svi datumi</option>
                    {settlementDates.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="sd-strike-control">
                  <span>Broj strike vrednosti (po strani):</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={strikeCount === "all" ? "" : strikeCount}
                    placeholder="npr. 7"
                    disabled={strikeCount === "all"}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      setStrikeCount(v === "" ? "all" : v);
                    }}
                  />
                  <label className="sd-strike-all">
                    <input
                      type="checkbox"
                      checked={strikeCount === "all"}
                      onChange={(e) => setStrikeCount(e.target.checked ? "all" : "10")}
                    />
                    <span>Sve</span>
                  </label>
                </label>
              </div>
              <p className="sd-shared-price">
                Shared Price: <strong>${detail.price.toFixed(2)}</strong>
              </p>
            </div>
            <OptionsTable options={visibleOptionSets} sharedPrice={detail.price} />
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityDetailPage;
