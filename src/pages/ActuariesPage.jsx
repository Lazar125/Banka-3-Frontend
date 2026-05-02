import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import {
  getActuaries,
  setActuaryLimit,
  resetActuaryUsedLimit,
  setActuaryNeedApproval,
} from "../services/ActuaryService";
import { formatMoney, majorToMinor, minorToMajor } from "../utils/money";
import "./ActuariesPage.css";

export default function ActuariesPage() {
  const [filters, setFilters] = useState({
    first_name: "",
    last_name: "",
    email: "",
    position: "",
  });
  const [actuaries, setActuaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLimit, setEditLimit] = useState("");
  const [resetTarget, setResetTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getActuaries(filters);
      setActuaries(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Greška pri učitavanju aktuara.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    load();
  };

  const handleStartEdit = (a) => {
    setEditingId(a.id);
    setEditLimit(String(minorToMajor(a.limit) ?? ""));
    setError("");
  };

  const handleSaveLimit = async (a) => {
    const value = Number(editLimit);
    if (!value || value <= 0) {
      setError("Limit mora biti veći od 0.");
      return;
    }
    const newLimitMinor = majorToMinor(value);
    if (newLimitMinor < (a.used_limit || 0)) {
      setError(
        `Novi limit ${formatMoney(newLimitMinor, "RSD")} je manji od trenutno iskorišćenog ${formatMoney(a.used_limit, "RSD")}.`
      );
      return;
    }
    try {
      const updated = await setActuaryLimit(a.id, newLimitMinor);
      setActuaries((prev) => prev.map((x) => (x.id === a.id ? { ...x, ...updated } : x)));
      setMessage("Limit ažuriran.");
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Greška pri ažuriranju limita.");
    }
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    try {
      const updated = await resetActuaryUsedLimit(resetTarget.id);
      setActuaries((prev) =>
        prev.map((x) => (x.id === resetTarget.id ? { ...x, ...updated } : x))
      );
      setMessage("usedLimit resetovan na 0.");
      setResetTarget(null);
    } catch (err) {
      setError(err.response?.data?.error || "Greška pri resetu usedLimit-a.");
    }
  };

  const handleToggleNeedApproval = async (a) => {
    try {
      const updated = await setActuaryNeedApproval(a.id, !a.need_approval);
      setActuaries((prev) => prev.map((x) => (x.id === a.id ? { ...x, ...updated } : x)));
    } catch (err) {
      setError(err.response?.data?.error || "Greška pri promeni need_approval.");
    }
  };

  return (
    <div className="act-page">
      <Sidebar />

      <h1 className="act-title">Upravljanje aktuarima</h1>

      <form className="act-filters" onSubmit={handleFilterSubmit}>
        <input
          placeholder="Ime"
          value={filters.first_name}
          onChange={(e) => setFilters((f) => ({ ...f, first_name: e.target.value }))}
        />
        <input
          placeholder="Prezime"
          value={filters.last_name}
          onChange={(e) => setFilters((f) => ({ ...f, last_name: e.target.value }))}
        />
        <input
          placeholder="Email"
          value={filters.email}
          onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          placeholder="Pozicija"
          value={filters.position}
          onChange={(e) => setFilters((f) => ({ ...f, position: e.target.value }))}
        />
        <button type="submit">Pretraži</button>
      </form>

      {error && <p className="act-error">{error}</p>}
      {message && <p className="act-success">{message}</p>}

      <div className="act-table-wrap">
        {loading ? (
          <p className="act-empty">Učitavanje...</p>
        ) : actuaries.length === 0 ? (
          <p className="act-empty">Nema rezultata.</p>
        ) : (
          <table className="act-table">
            <thead>
              <tr>
                <th>Ime</th>
                <th>Prezime</th>
                <th>Email</th>
                <th>Pozicija</th>
                <th>Limit</th>
                <th>Used limit</th>
                <th>Need approval</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {actuaries.map((a) => (
                <tr key={a.id}>
                  <td>{a.first_name}</td>
                  <td>{a.last_name}</td>
                  <td>{a.email}</td>
                  <td>{a.position || "—"}</td>
                  <td>
                    {editingId === a.id ? (
                      <div className="act-edit-row">
                        <input
                          type="number"
                          step="0.01"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                        />
                        <button onClick={() => handleSaveLimit(a)}>Sačuvaj</button>
                        <button onClick={() => setEditingId(null)}>✕</button>
                      </div>
                    ) : (
                      <button className="act-link" onClick={() => handleStartEdit(a)}>
                        {formatMoney(a.limit, "RSD")}
                      </button>
                    )}
                  </td>
                  <td>{formatMoney(a.used_limit, "RSD")}</td>
                  <td>
                    <button
                      className={`act-toggle ${a.need_approval ? "act-toggle--on" : ""}`}
                      onClick={() => handleToggleNeedApproval(a)}
                    >
                      {a.need_approval ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td>
                    <button
                      className="act-btn act-btn--reset"
                      onClick={() => setResetTarget(a)}
                    >
                      Reset usedLimit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {resetTarget && (
        <div className="act-overlay" onClick={() => setResetTarget(null)}>
          <div className="act-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reset usedLimit</h2>
            <p>
              Da li ste sigurni da želite da resetujete usedLimit za{" "}
              <strong>
                {resetTarget.first_name} {resetTarget.last_name}
              </strong>
              ? Trenutno: {formatMoney(resetTarget.used_limit, "RSD")}.
            </p>
            <div className="act-modal-actions">
              <button onClick={() => setResetTarget(null)}>Otkaži</button>
              <button onClick={handleConfirmReset}>Potvrdi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
