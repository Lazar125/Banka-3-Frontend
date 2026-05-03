import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExchanges, setExchangeOpenOverride } from "../services/ExchangeService";
import Sidebar from "../components/Sidebar.jsx";
import "./BerzaPage.css";

// Spec p.40 says all exchanges in the same polity share working hours, so a
// per-row local-time check is sufficient to compute "open"/"closed" without
// hitting holiday calendars. The backend may also surface an is_open flag —
// we prefer that when available so we don't drift from server state.
function parseTimeOfDay(value) {
  if (!value || typeof value !== "string") return null;
  const [h, m = "0"] = value.split(":");
  const hh = Number(h);
  const mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function parseUtcOffset(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const s = String(value).trim();
  // Accepts forms like "+8", "-3", "+8:00", "+05:30".
  const match = s.match(/^([+-]?)(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const h = Number(match[2]);
  const m = Number(match[3] || 0);
  return sign * (h + m / 60);
}

function computeStatus(ex) {
  if (ex.open_override) {
    return { open: true, label: "Otvorena (override)", className: "open" };
  }
  if (typeof ex.is_open === "boolean") {
    return {
      open: ex.is_open,
      label: ex.is_open ? "Otvorena" : "Zatvorena",
      className: ex.is_open ? "open" : "closed",
    };
  }
  const openMin = parseTimeOfDay(ex.open_time);
  const closeMin = parseTimeOfDay(ex.close_time);
  if (openMin == null || closeMin == null) {
    return { open: false, label: "Nepoznato", className: "unknown" };
  }
  const offsetH = parseUtcOffset(ex.time_zone_offset);
  const now = new Date();
  const localMs = now.getTime() + (now.getTimezoneOffset() + offsetH * 60) * 60000;
  const localDate = new Date(localMs);
  const day = localDate.getUTCDay(); // we already shifted to "exchange local"
  if (day === 0 || day === 6) {
    return { open: false, label: "Zatvorena (vikend)", className: "closed" };
  }
  const minutesNow = localDate.getUTCHours() * 60 + localDate.getUTCMinutes();
  const isOpen = minutesNow >= openMin && minutesNow <= closeMin;
  return {
    open: isOpen,
    label: isOpen ? "Otvorena" : "Zatvorena",
    className: isOpen ? "open" : "closed",
  };
}

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
    status: computeStatus(ex),
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
