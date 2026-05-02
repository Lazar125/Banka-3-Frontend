import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import CreateOrderModal from "../components/CreateOrderModal.jsx";
import {
  getListing,
  getListingHistory,
  getOptionDates,
  getOptionGrid,
} from "../services/TradingService";
import { getExchanges } from "../services/ExchangeService";
import { formatMoney, formatNumber } from "../utils/money";
import "./SecurityDetailsPage.css";

const PERIODS = [
  { key: "day", label: "Dan" },
  { key: "week", label: "Nedelja" },
  { key: "month", label: "Mesec" },
  { key: "year", label: "Godina" },
  { key: "5y", label: "5 godina" },
  { key: "all", label: "Sve" },
];

export default function SecurityDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = sessionStorage.getItem("userRole");
  const isEmployee = role === "employee";

  const [listing, setListing] = useState(null);
  const [history, setHistory] = useState(null);
  const [period, setPeriod] = useState("month");
  const [exchange, setExchange] = useState(null);

  const [optionDates, setOptionDates] = useState([]);
  const [optionSettlement, setOptionSettlement] = useState("");
  const [optionStrikes, setOptionStrikes] = useState(5);
  const [optionGrid, setOptionGrid] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [orderOpen, setOrderOpen] = useState(false);
  const [orderDirection, setOrderDirection] = useState("buy");
  const [orderAsset, setOrderAsset] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getListing(id), getExchanges()])
      .then(([l, exchanges]) => {
        if (cancelled) return;
        setListing(l);
        setExchange(
          (Array.isArray(exchanges) ? exchanges : []).find((e) => e.id === l?.exchange_id) || null
        );
      })
      .catch(() => !cancelled && setError("Hartija nije pronađena."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!listing) return;
    getListingHistory(id, period)
      .then((h) => !cancelled && setHistory(h))
      .catch(() => !cancelled && setHistory(null));
    return () => {
      cancelled = true;
    };
  }, [listing, id, period]);

  useEffect(() => {
    if (!listing || listing.security_type !== "stock" || !isEmployee) return;
    let cancelled = false;
    getOptionDates(listing.stock_id)
      .then((dates) => {
        if (cancelled) return;
        setOptionDates(dates);
        if (dates.length && !optionSettlement) {
          const first = new Date(dates[0].settlement_date * 1000)
            .toISOString()
            .slice(0, 10);
          setOptionSettlement(first);
        }
      })
      .catch(() => !cancelled && setOptionDates([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing, isEmployee]);

  useEffect(() => {
    if (!listing || listing.security_type !== "stock" || !optionSettlement || !isEmployee) return;
    let cancelled = false;
    getOptionGrid(listing.stock_id, optionSettlement, Number(optionStrikes) || 0)
      .then((g) => !cancelled && setOptionGrid(g))
      .catch(() => !cancelled && setOptionGrid(null));
    return () => {
      cancelled = true;
    };
  }, [listing, optionSettlement, optionStrikes, isEmployee]);

  const chart = useMemo(() => {
    if (!history?.points?.length) return null;
    const points = history.points;
    const w = 720;
    const h = 220;
    const pad = 30;
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = Math.max(1, max - min);
    const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / Math.max(1, points.length - 1));
    const ys = points.map((p) => h - pad - ((p.price - min) / range) * (h - 2 * pad));
    const path = points.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i]},${ys[i]}`).join(" ");
    return { w, h, path, min, max };
  }, [history]);

  const handleBuy = () => {
    if (!listing) return;
    setOrderAsset({
      kind: "listing",
      id: listing.id,
      ticker: listing.ticker,
      price: listing.price,
    });
    setOrderDirection("buy");
    setOrderOpen(true);
  };

  const handleBuyOption = (contract) => {
    setOrderAsset({
      kind: "option",
      id: contract.id,
      ticker: `${listing.ticker} ${contract.side.toUpperCase()} ${contract.strike}`,
      price: contract.last,
    });
    setOrderDirection("buy");
    setOrderOpen(true);
  };

  if (loading) {
    return (
      <div className="sd-page">
        <Sidebar />
        <p className="sd-loading">Učitavanje...</p>
      </div>
    );
  }
  if (error || !listing) {
    return (
      <div className="sd-page">
        <Sidebar />
        <p className="sd-error">{error || "Greška."}</p>
        <button className="sd-back-btn" onClick={() => navigate("/securities")}>
          ← Nazad
        </button>
      </div>
    );
  }

  return (
    <div className="sd-page">
      <Sidebar />

      <div className="sd-header">
        <button className="sd-back-btn" onClick={() => navigate("/securities")}>
          ← Nazad
        </button>
        <div className="sd-title-block">
          <h1 className="sd-title">
            {listing.ticker} <span className="sd-title-name">{listing.name}</span>
          </h1>
          <span className="sd-exchange">{listing.exchange_acronym}</span>
        </div>
      </div>

      <div className="sd-action-bar">
        <button className="sd-buy-btn" onClick={handleBuy}>
          Kupi
        </button>
      </div>

      <div className="sd-stats">
        <Stat label="Cena" value={formatMoney(listing.price)} />
        <Stat label="Bid" value={formatMoney(listing.bid_price)} />
        <Stat label="Ask" value={formatMoney(listing.ask_price)} />
        <Stat label="Volume" value={formatNumber(listing.volume)} />
        <Stat
          label="Promena"
          value={formatMoney(listing.change)}
          className={listing.change >= 0 ? "sd-pos" : "sd-neg"}
        />
        {listing.security_type === "future" && (
          <>
            <Stat
              label="Settlement"
              value={
                listing.settlement_date
                  ? new Date(listing.settlement_date * 1000).toLocaleDateString("sr-RS")
                  : "—"
              }
            />
            <Stat label="Contract size" value={formatNumber(listing.contract_size)} />
            <Stat label="Initial margin" value={formatMoney(listing.initial_margin_cost)} />
          </>
        )}
      </div>

      <div className="sd-card">
        <div className="sd-card-header">
          <h2>Istorija cene</h2>
          <div className="sd-period-row">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={`sd-period ${period === p.key ? "sd-period--active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {chart ? (
          <svg viewBox={`0 0 ${chart.w} ${chart.h}`} className="sd-chart">
            <path d={chart.path} fill="none" stroke="#3b82f6" strokeWidth="2" />
            <text x="6" y="14" className="sd-chart-axis">{formatMoney(chart.max)}</text>
            <text x="6" y={chart.h - 6} className="sd-chart-axis">{formatMoney(chart.min)}</text>
          </svg>
        ) : (
          <p className="sd-empty">Nema istorijskih podataka.</p>
        )}
        {history?.points?.length > 0 && (
          <div className="sd-history-table-wrap">
            <table className="sd-history-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Cena</th>
                  <th>Bid</th>
                  <th>Ask</th>
                  <th>Δ</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {history.points.slice(-20).map((p, i) => (
                  <tr key={i}>
                    <td>{new Date(p.date * 1000).toLocaleDateString("sr-RS")}</td>
                    <td>{formatMoney(p.price)}</td>
                    <td>{formatMoney(p.bid_price)}</td>
                    <td>{formatMoney(p.ask_price)}</td>
                    <td className={p.change >= 0 ? "sd-pos" : "sd-neg"}>
                      {formatMoney(p.change)}
                    </td>
                    <td>{formatNumber(p.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {listing.security_type === "stock" && isEmployee && (
        <div className="sd-card">
          <div className="sd-card-header">
            <h2>Opcije</h2>
            <div className="sd-options-controls">
              <select
                value={optionSettlement}
                onChange={(e) => setOptionSettlement(e.target.value)}
              >
                {optionDates.map((d) => {
                  const iso = new Date(d.settlement_date * 1000).toISOString().slice(0, 10);
                  return (
                    <option key={iso} value={iso}>
                      {iso} ({d.days_to_expiry}d)
                    </option>
                  );
                })}
              </select>
              <label>
                Strikes
                <input
                  type="number"
                  min="0"
                  value={optionStrikes}
                  onChange={(e) => setOptionStrikes(e.target.value)}
                />
              </label>
            </div>
          </div>
          {optionGrid ? (
            <>
              <p className="sd-shared-price">
                Shared Price: <strong>{formatMoney(optionGrid.shared_price)}</strong>
              </p>
              <div className="sd-history-table-wrap">
                <table className="sd-options-table">
                  <thead>
                    <tr>
                      <th colSpan="5" className="sd-options-call">CALL</th>
                      <th>Strike</th>
                      <th colSpan="5" className="sd-options-put">PUT</th>
                    </tr>
                    <tr>
                      <th>Last</th><th>Bid</th><th>Ask</th><th>Vol</th><th>OI</th>
                      <th></th>
                      <th>Last</th><th>Bid</th><th>Ask</th><th>Vol</th><th>OI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionGrid.rows?.map((row) => {
                      const callItm = row.strike < optionGrid.shared_price;
                      const putItm = row.strike > optionGrid.shared_price;
                      return (
                        <tr key={row.strike}>
                          <td className={callItm ? "sd-itm" : "sd-otm"}>{formatMoney(row.call?.last)}</td>
                          <td className={callItm ? "sd-itm" : "sd-otm"}>{formatMoney(row.call?.bid)}</td>
                          <td className={callItm ? "sd-itm" : "sd-otm"}>{formatMoney(row.call?.ask)}</td>
                          <td className={callItm ? "sd-itm" : "sd-otm"}>{formatNumber(row.call?.volume)}</td>
                          <td className={callItm ? "sd-itm" : "sd-otm"}>
                            {row.call ? (
                              <button className="sd-opt-buy" onClick={() => handleBuyOption(row.call)}>
                                {formatNumber(row.call.open_interest)}
                              </button>
                            ) : "—"}
                          </td>
                          <td className="sd-strike">{formatMoney(row.strike)}</td>
                          <td className={putItm ? "sd-itm" : "sd-otm"}>{formatMoney(row.put?.last)}</td>
                          <td className={putItm ? "sd-itm" : "sd-otm"}>{formatMoney(row.put?.bid)}</td>
                          <td className={putItm ? "sd-itm" : "sd-otm"}>{formatMoney(row.put?.ask)}</td>
                          <td className={putItm ? "sd-itm" : "sd-otm"}>{formatNumber(row.put?.volume)}</td>
                          <td className={putItm ? "sd-itm" : "sd-otm"}>
                            {row.put ? (
                              <button className="sd-opt-buy" onClick={() => handleBuyOption(row.put)}>
                                {formatNumber(row.put.open_interest)}
                              </button>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="sd-empty">Nema dostupnih opcija.</p>
          )}
        </div>
      )}

      <CreateOrderModal
        open={orderOpen}
        asset={orderAsset}
        direction={orderDirection}
        exchange={exchange}
        onClose={() => setOrderOpen(false)}
        onSuccess={() => {
          setOrderOpen(false);
        }}
      />
    </div>
  );
}

function Stat({ label, value, className = "" }) {
  return (
    <div className="sd-stat">
      <div className="sd-stat-label">{label}</div>
      <div className={`sd-stat-value ${className}`}>{value}</div>
    </div>
  );
}
