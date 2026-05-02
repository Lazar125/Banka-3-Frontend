import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { getListings, getForexPairs } from "../services/TradingService";
import { formatMoney, formatNumber, majorToMinor } from "../utils/money";
import "./SecuritiesPage.css";

const AUTO_REFRESH_MS = 30_000;

const TABS = [
  { key: "stocks", label: "Akcije", roles: ["client", "employee"] },
  { key: "futures", label: "Futures", roles: ["client", "employee"] },
  { key: "forex", label: "Forex", roles: ["employee"] },
];

export default function SecuritiesPage() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("userRole");

  const visibleTabs = TABS.filter((t) => t.roles.includes(role));
  const [tab, setTab] = useState(visibleTabs[0]?.key || "stocks");

  const [search, setSearch] = useState("");
  const [exchange, setExchange] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [settlementFrom, setSettlementFrom] = useState("");
  const [settlementTo, setSettlementTo] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [listings, setListings] = useState([]);
  const [forex, setForex] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const filtersInvalid =
    priceMin !== "" && priceMax !== "" && Number(priceMin) > Number(priceMax);

  const buildParams = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (exchange) params.exchange = exchange;
    if (priceMin) params.price_min = majorToMinor(priceMin);
    if (priceMax) params.price_max = majorToMinor(priceMax);
    if (tab === "futures") {
      if (settlementFrom)
        params.settlement_from = Math.floor(new Date(settlementFrom).getTime() / 1000);
      if (settlementTo)
        params.settlement_to = Math.floor(new Date(settlementTo).getTime() / 1000);
    }
    if (sortBy) {
      params.sort_by = sortBy;
      params.sort_order = sortOrder;
    }
    return params;
  }, [search, exchange, priceMin, priceMax, settlementFrom, settlementTo, sortBy, sortOrder, tab]);

  const load = useCallback(async () => {
    if (filtersInvalid) {
      setError("Minimalna cena je veća od maksimalne.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (tab === "forex") {
        const data = await getForexPairs();
        setForex(Array.isArray(data) ? data : []);
      } else {
        const data = await getListings(buildParams());
        const filtered = (Array.isArray(data) ? data : []).filter(
          (l) => l.security_type === (tab === "stocks" ? "stock" : "future")
        );
        setListings(filtered);
      }
      setLastRefresh(new Date());
    } catch {
      setError("Greška pri učitavanju hartija od vrednosti.");
    } finally {
      setLoading(false);
    }
  }, [tab, buildParams, filtersInvalid]);

  useEffect(() => {
    load();
  }, [load]);

  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const id = setInterval(() => loadRef.current(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const renderListingsTable = () => {
    if (listings.length === 0) {
      return <p className="sec-empty">Nema rezultata</p>;
    }
    const isFutures = tab === "futures";
    return (
      <div className="sec-table-wrap">
        <table className="sec-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Naziv</th>
              <th>Berza</th>
              <th>Cena</th>
              <th>Bid</th>
              <th>Ask</th>
              <th>Volume</th>
              <th>Δ</th>
              {isFutures && <th>Settlement</th>}
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} onClick={() => navigate(`/securities/${l.id}`)}>
                <td className="sec-ticker">{l.ticker}</td>
                <td>{l.name}</td>
                <td>{l.exchange_acronym}</td>
                <td>{formatMoney(l.price)}</td>
                <td>{formatMoney(l.bid_price)}</td>
                <td>{formatMoney(l.ask_price)}</td>
                <td>{formatNumber(l.volume)}</td>
                <td className={l.change >= 0 ? "sec-pos" : "sec-neg"}>
                  {formatMoney(l.change)}
                </td>
                {isFutures && (
                  <td>
                    {l.settlement_date
                      ? new Date(l.settlement_date * 1000).toLocaleDateString("sr-RS")
                      : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderForexTable = () => {
    if (forex.length === 0) {
      return <p className="sec-empty">Nema rezultata</p>;
    }
    return (
      <div className="sec-table-wrap">
        <table className="sec-table">
          <thead>
            <tr>
              <th>Par</th>
              <th>Naziv</th>
              <th>Base</th>
              <th>Quote</th>
              <th>Kurs</th>
              <th>Likvidnost</th>
              <th>Contract size</th>
            </tr>
          </thead>
          <tbody>
            {forex.map((p) => (
              <tr key={p.id}>
                <td className="sec-ticker">{p.ticker}</td>
                <td>{p.name}</td>
                <td>{p.base_currency}</td>
                <td>{p.quote_currency}</td>
                <td>{p.exchange_rate?.toFixed(4) || "—"}</td>
                <td>{p.liquidity}</td>
                <td>{formatNumber(p.contract_size)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="sec-page">
      <Sidebar />

      <div className="sec-header">
        <h1 className="sec-title">Hartije od vrednosti</h1>
        <div className="sec-refresh">
          {lastRefresh && (
            <span className="sec-last-refresh">
              Osveženo: {lastRefresh.toLocaleTimeString("sr-RS")}
            </span>
          )}
          <button className="sec-refresh-btn" onClick={load} disabled={loading}>
            {loading ? "Učitavanje..." : "Osveži"}
          </button>
        </div>
      </div>

      <div className="sec-tabs">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            className={`sec-tab ${tab === t.key ? "sec-tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "forex" && (
        <div className="sec-filters">
          <input
            className="sec-input"
            placeholder="Pretraga (ticker ili naziv)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="sec-input"
            placeholder="Exchange prefix (npr. NY)"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
          />
          <input
            className="sec-input"
            type="number"
            placeholder="Min cena"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <input
            className="sec-input"
            type="number"
            placeholder="Max cena"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
          {tab === "futures" && (
            <>
              <input
                className="sec-input"
                type="date"
                placeholder="Settlement od"
                value={settlementFrom}
                onChange={(e) => setSettlementFrom(e.target.value)}
              />
              <input
                className="sec-input"
                type="date"
                placeholder="Settlement do"
                value={settlementTo}
                onChange={(e) => setSettlementTo(e.target.value)}
              />
            </>
          )}
          <select
            className="sec-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Sortiraj po…</option>
            <option value="price">Cena</option>
            <option value="volume">Volume</option>
            <option value="maintenance_margin">Maintenance margin</option>
          </select>
          <select
            className="sec-input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={!sortBy}
          >
            <option value="asc">↑</option>
            <option value="desc">↓</option>
          </select>
        </div>
      )}

      {filtersInvalid && (
        <p className="sec-error">Minimalna cena ne sme biti veća od maksimalne.</p>
      )}
      {error && !filtersInvalid && <p className="sec-error">{error}</p>}

      {tab === "forex" ? renderForexTable() : renderListingsTable()}
    </div>
  );
}
