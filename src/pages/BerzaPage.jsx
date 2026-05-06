import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExchanges, setExchangeOpenOverride } from "../services/ExchangeService";
import Sidebar from "../components/Sidebar.jsx";
import { computeExchangeStatus } from "../utils/exchangeHours.js";
import "./BerzaPage.css";

export default function BerzaPage() {
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getExchanges();
        if (!cancelled) {
          setExchanges(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Greška pri učitavanju podataka o berzama.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Tick every minute so "Otvorena/Zatvorena" stays accurate as time passes.
  useEffect(() => {
    const handle = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(handle);
  }, []);

  const rows = useMemo(() => exchanges.map((ex) => ({
    ...ex,
    status: computeExchangeStatus(ex),
  })), [exchanges]);

  const handleToggleOverride = async (exchange) => {
    const next = !exchange.open_override;
    setUpdatingId(exchange.id);
    try {
      const updated = await setExchangeOpenOverride(exchange.id, next);
      setExchanges((prev) =>
        prev.map((ex) => (ex.id === exchange.id ? { ...ex, ...updated } : ex))
      );
      setSuccess(
        `${exchange.name || exchange.acronym} je ${next ? "prinudno otvorena" : "vraćena na redovno radno vreme"}.`
      );
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Greška pri izmeni statusa berze.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="berza-page">
      <div className="berza-content">
        <Sidebar />

        <div className="berza-header">
          <button className="berza-back-btn" onClick={() => navigate("/employees")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <p className="berza-eyebrow">Tržište</p>
            <h1 className="berza-title">Berze</h1>
            <p className="berza-subtitle">
              Pregled berzi i ručno uključivanje radnog vremena za testiranje.
            </p>
          </div>
        </div>

        {success && <p className="berza-msg berza-msg--success">{success}</p>}
        {error && <p className="berza-msg berza-msg--error">{error}</p>}

        {loading ? (
          <p className="berza-loading">Učitavanje...</p>
        ) : (
          <div className="berza-table-wrap">
            <table className="berza-table">
              <thead>
                <tr>
                  <th>Naziv</th>
                  <th>Akronim</th>
                  <th>MIC</th>
                  <th>Država</th>
                  <th>Valuta</th>
                  <th>Radno vreme</th>
                  <th>Vremenska zona</th>
                  <th>Status</th>
                  <th>Test mod</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="berza-empty">Nema dostupnih berzi.</td></tr>
                )}
                {rows.map((exchange) => (
                  <tr key={exchange.id}>
                    <td>{exchange.name || "—"}</td>
                    <td>{exchange.acronym || "—"}</td>
                    <td>{exchange.mic_code || "—"}</td>
                    <td>{exchange.polity || exchange.country || "—"}</td>
                    <td>{exchange.currency || "—"}</td>
                    <td>{exchange.open_time || "—"} – {exchange.close_time || "—"}</td>
                    <td>{exchange.time_zone_offset || "—"}</td>
                    <td>
                      <span className={`berza-status berza-status--${exchange.status.className}`}>
                        {exchange.status.label}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`berza-toggle-btn ${exchange.open_override ? "berza-toggle-btn--open" : ""}`}
                        onClick={() => handleToggleOverride(exchange)}
                        disabled={updatingId === exchange.id}
                        title={`Klikni da ${exchange.open_override ? "isključiš" : "uključiš"} prinudno otvaranje`}
                      >
                        <span className="berza-toggle-circle"></span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
