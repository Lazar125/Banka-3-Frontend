import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { getOrders, approveOrder, declineOrder, cancelOrder } from "../services/OrderService";
import { formatMoney, formatNumber } from "../utils/money";
import "./OrdersPage.css";

const STATUSES = ["all", "pending", "approved", "declined", "done", "cancelled"];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [agent, setAgent] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { status };
      if (agent && Number(agent) > 0) params.agent = Number(agent);
      const data = await getOrders(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError("Greška pri učitavanju ordera.");
    } finally {
      setLoading(false);
    }
  }, [status, agent]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (id, action) => {
    setActingId(id);
    try {
      const updated =
        action === "approve"
          ? await approveOrder(id)
          : action === "decline"
            ? await declineOrder(id)
            : await cancelOrder(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    } catch (err) {
      setError(err.response?.data?.error || "Greška pri akciji nad orderom.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="orders-page">
      <Sidebar />

      <div className="orders-header">
        <button className="orders-back-btn" onClick={() => navigate("/employees")}>
          ← Nazad
        </button>
        <h1 className="orders-title">Pregled ordera</h1>
      </div>

      <div className="orders-filters">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Agent ID (0 = svi)
          <input
            type="number"
            min="0"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            placeholder="0"
          />
        </label>
        <button onClick={load} className="orders-refresh-btn">Osveži</button>
      </div>

      {error && <p className="orders-error">{error}</p>}

      <div className="orders-table-wrap">
        {loading ? (
          <p className="orders-empty">Učitavanje...</p>
        ) : orders.length === 0 ? (
          <p className="orders-empty">Nema ordera.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Agent</th>
                <th>Tip</th>
                <th>Asset</th>
                <th>Smer</th>
                <th>Količina</th>
                <th>Contract</th>
                <th>Cena/jed.</th>
                <th>Preostalo</th>
                <th>Status</th>
                <th>AON</th>
                <th>Margin</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.agent || "—"}</td>
                  <td>{o.order_type}</td>
                  <td>{o.asset_label}</td>
                  <td>{o.direction}</td>
                  <td>{formatNumber(o.quantity)}</td>
                  <td>{formatNumber(o.contract_size) || "—"}</td>
                  <td>{formatMoney(o.price_per_unit)}</td>
                  <td>{formatNumber(o.remaining_portions)}</td>
                  <td className={`orders-status orders-status--${o.status}`}>{o.status}</td>
                  <td>{o.all_or_none ? "Da" : "—"}</td>
                  <td>{o.margin ? "Da" : "—"}</td>
                  <td className="orders-actions">
                    {o.status === "pending" && !o.past_settlement && (
                      <button
                        className="orders-btn orders-btn--approve"
                        onClick={() => handleAction(o.id, "approve")}
                        disabled={actingId === o.id}
                      >
                        Approve
                      </button>
                    )}
                    {o.status === "pending" && (
                      <button
                        className="orders-btn orders-btn--decline"
                        onClick={() => handleAction(o.id, "decline")}
                        disabled={actingId === o.id}
                      >
                        Decline
                      </button>
                    )}
                    {(o.status === "approved" || o.status === "pending") &&
                      o.remaining_portions > 0 && (
                        <button
                          className="orders-btn orders-btn--cancel"
                          onClick={() => handleAction(o.id, "cancel")}
                          disabled={actingId === o.id}
                        >
                          Cancel
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
