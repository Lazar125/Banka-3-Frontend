import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import {
  listMyOrders,
  cancelOrder,
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  ORDER_DIRECTION_LABEL,
} from "../services/OrderService.js";
import { formatCurrency } from "../utils/loanCalculations.js";
import "./MyOrdersPage.css";

const STATUS_FILTERS = [
  { value: "all", label: "Svi" },
  { value: "pending", label: "Na čekanju" },
  { value: "approved", label: "Odobreni" },
  { value: "declined", label: "Odbijeni" },
  { value: "done", label: "Završeni" },
];

function fmtTimestamp(unix) {
  if (!unix) return "—";
  try {
    const ms = unix < 1e12 ? unix * 1000 : unix;
    return new Date(ms).toLocaleString("sr-RS");
  } catch {
    return "—";
  }
}

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const role = sessionStorage.getItem("userRole") || "";
  const permissions = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("permissions") || "[]"); }
    catch { return []; }
  }, []);
  const canCancel = role === "client"
    || permissions.includes("admin")
    || permissions.includes("supervisor")
    || permissions.includes("trading_cancel");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await listMyOrders(statusFilter);
      setOrders(data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Greška pri učitavanju naloga.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleCancel(orderId) {
    if (!window.confirm("Da li ste sigurni da želite da otkažete ovaj nalog?")) return;
    setBusy(orderId);
    setActionError("");
    setActionMsg("");
    try {
      await cancelOrder(orderId);
      setActionMsg("Nalog je otkazan.");
      await load();
    } catch (e) {
      setActionError(
        e?.response?.data?.message || e?.message || "Otkazivanje nije uspelo."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mo-page">
      <Sidebar />
      <div className="mo-content">
        <div className="mo-header">
          <div>
            <p className="mo-eyebrow">Trgovanje</p>
            <h1 className="mo-title">Moji nalozi</h1>
            <p className="mo-subtitle">Pregled svih kreiranih naloga sa statusom izvršenja.</p>
          </div>
          <div className="mo-actions">
            <button className="mo-btn-secondary" onClick={load} disabled={loading}>
              {loading ? "Učitava..." : "Osveži"}
            </button>
            <button className="mo-btn-primary" onClick={() => navigate("/securities")}>
              Nova kupovina
            </button>
          </div>
        </div>

        <div className="mo-filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`mo-filter ${statusFilter === f.value ? "mo-filter--active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {actionMsg && <div className="mo-banner mo-banner--ok">{actionMsg}</div>}
        {actionError && <div className="mo-banner mo-banner--error">{actionError}</div>}
        {error && <div className="mo-banner mo-banner--error">{error}</div>}

        <div className="mo-table-wrap">
          <table className="mo-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hartija</th>
                <th>Tip</th>
                <th>Smer</th>
                <th>Količina</th>
                <th>Cena/jed.</th>
                <th>Preostalo</th>
                <th>Provizija</th>
                <th>Status</th>
                <th>Odobrio</th>
                <th>Datum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={12} className="mo-empty">Učitavanje…</td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={12} className="mo-empty">Nema naloga za prikaz.</td></tr>
              )}
              {!loading && orders.map((o) => {
                const statusClass = `mo-status mo-status--${o.status}`;
                const canShowCancel =
                  canCancel && (o.status === "approved" || o.status === "pending") && !o.isDone;
                return (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.ticker || o.listingName || "—"}</td>
                    <td>{ORDER_TYPE_LABEL[o.orderType] || o.orderType}</td>
                    <td>
                      <span className={`mo-direction mo-direction--${o.direction}`}>
                        {ORDER_DIRECTION_LABEL[o.direction] || o.direction}
                      </span>
                    </td>
                    <td>{o.quantity}</td>
                    <td>{formatCurrency(o.pricePerUnit, o.currency)}</td>
                    <td>{o.remainingPortions}</td>
                    <td>
                      {o.commission > 0
                        ? formatCurrency(o.commission, o.currency)
                        : "—"}
                    </td>
                    <td><span className={statusClass}>{ORDER_STATUS_LABEL[o.status] || o.status}</span></td>
                    <td>{o.approvedBy || (o.status === "approved" || o.status === "done" ? "Automatsko odobrenje" : "—")}</td>
                    <td>{fmtTimestamp(o.createdAt || o.lastModification)}</td>
                    <td>
                      {canShowCancel ? (
                        <button
                          className="mo-cancel-btn"
                          onClick={() => handleCancel(o.id)}
                          disabled={busy === o.id}
                        >
                          {busy === o.id ? "..." : "Otkaži"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
