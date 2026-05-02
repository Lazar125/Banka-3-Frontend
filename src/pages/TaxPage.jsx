import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { getTaxDebts, runTax } from "../services/TaxService";
import { formatMoney } from "../utils/money";
import "./TaxPage.css";

export default function TaxPage() {
  const [team, setTeam] = useState("");
  const [name, setName] = useState("");
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [runMonth, setRunMonth] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTaxDebts({ team, name });
      setDebts(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Greška pri učitavanju dugovanja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await runTax(runMonth);
      setRunResult(res);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Greška pri pokretanju obračuna.");
    } finally {
      setRunning(false);
    }
  };

  const totalUnpaid = debts.reduce((s, d) => s + (d.unpaid_rsd || 0), 0);

  return (
    <div className="tax-page">
      <Sidebar />

      <h1 className="tax-title">Porez tracking</h1>

      <div className="tax-summary">
        <div className="tax-summary-card">
          <span className="tax-summary-label">Korisnika sa dugom</span>
          <span className="tax-summary-value">{debts.length}</span>
        </div>
        <div className="tax-summary-card">
          <span className="tax-summary-label">Ukupan neplaćen porez</span>
          <span className="tax-summary-value tax-neg">
            {formatMoney(totalUnpaid, "RSD")}
          </span>
        </div>
      </div>

      <div className="tax-run-card">
        <h2>Ručno pokreni obračun</h2>
        <div className="tax-run-row">
          <label>
            Mesec (YYYY-MM, prazno = svi neplaćeni)
            <input
              type="month"
              value={runMonth}
              onChange={(e) => setRunMonth(e.target.value)}
            />
          </label>
          <button
            className="tax-run-btn"
            onClick={handleRun}
            disabled={running}
          >
            {running ? "Pokrećem..." : "Pokreni obračun"}
          </button>
        </div>
        {runResult && (
          <div className="tax-run-result">
            Period: <strong>{runResult.period || "(svi)"}</strong> · Računa naplaćeno:{" "}
            <strong>{runResult.accounts_paid}</strong> · Redova naplaćeno:{" "}
            <strong>{runResult.rows_paid}</strong> · Bez sredstava:{" "}
            <strong>{runResult.insufficient}</strong> · Naplaćeno:{" "}
            <strong>{formatMoney(runResult.collected_rsd, "RSD")}</strong> / Dug:{" "}
            <strong>{formatMoney(runResult.total_debt_rsd, "RSD")}</strong>
          </div>
        )}
      </div>

      <form className="tax-filters" onSubmit={handleSearch}>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="">Svi tipovi</option>
          <option value="client">Klijenti</option>
          <option value="actuary">Aktuari</option>
        </select>
        <input
          placeholder="Ime ili prezime"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Pretraži</button>
      </form>

      {error && <p className="tax-error">{error}</p>}

      <div className="tax-table-wrap">
        {loading ? (
          <p className="tax-empty">Učitavanje...</p>
        ) : debts.length === 0 ? (
          <p className="tax-empty">Nema korisnika sa neplaćenim porezom.</p>
        ) : (
          <table className="tax-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ime</th>
                <th>Prezime</th>
                <th>Tip</th>
                <th>Plaćeno</th>
                <th>Neplaćeno</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.user_id}>
                  <td>{d.user_id}</td>
                  <td>{d.first_name}</td>
                  <td>{d.last_name}</td>
                  <td>{d.team}</td>
                  <td>{formatMoney(d.paid_rsd, "RSD")}</td>
                  <td className="tax-neg">{formatMoney(d.unpaid_rsd, "RSD")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
