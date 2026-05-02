import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import {
  getPortfolio,
  sellHolding,
  setHoldingPublicAmount,
  exerciseOption,
  getMyTax,
} from "../services/PortfolioService";
import { getAccounts } from "../services/AccountService";
import { formatMoney, formatNumber } from "../utils/money";
import "./PortfolioPage.css";

export default function PortfolioPage() {
  const role = sessionStorage.getItem("userRole");
  const isEmployee = role === "employee";

  const [holdings, setHoldings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tax, setTax] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [sellHoldingId, setSellHoldingId] = useState(null);
  const [sellQty, setSellQty] = useState("");
  const [sellAccount, setSellAccount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [publicEdit, setPublicEdit] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [h, a, t] = await Promise.all([
        getPortfolio(),
        getAccounts(),
        getMyTax().catch(() => null),
      ]);
      setHoldings(Array.isArray(h) ? h : []);
      setAccounts(Array.isArray(a) ? a : []);
      setTax(t);
    } catch {
      setError("Greška pri učitavanju portfolija.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalProfit = useMemo(
    () => holdings.reduce((s, h) => s + (h.profit || 0), 0),
    [holdings]
  );

  const handleStartSell = (h) => {
    setSellHoldingId(h.id);
    setSellQty("");
    setSellAccount(h.account_number || "");
    setError("");
  };

  const handleConfirmSell = async () => {
    const h = holdings.find((x) => x.id === sellHoldingId);
    if (!h) return;
    const qty = parseInt(sellQty, 10);
    if (!qty || qty <= 0) {
      setError("Nevalidna količina.");
      return;
    }
    if (qty > h.amount) {
      setError(`Imate samo ${h.amount}, ne možete prodati ${qty}.`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await sellHolding({
        holding_id: h.id,
        account_number: sellAccount,
        order_type: "market",
        quantity: qty,
      });
      setMessage(`Sell order kreiran za ${qty} × ${h.ticker}.`);
      setSellHoldingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Greška pri prodaji.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePublic = async (h) => {
    const value = parseInt(publicEdit[h.id], 10);
    if (Number.isNaN(value) || value < 0 || value > h.amount) {
      setError(`Public amount mora biti između 0 i ${h.amount}.`);
      return;
    }
    try {
      const updated = await setHoldingPublicAmount(h.id, value);
      setHoldings((prev) => prev.map((x) => (x.id === h.id ? { ...x, ...updated } : x)));
      setPublicEdit((prev) => {
        const c = { ...prev };
        delete c[h.id];
        return c;
      });
      setMessage("Public amount ažuriran.");
    } catch (err) {
      setError(err.response?.data?.error || "Greška pri izmeni public amount-a.");
    }
  };

  const handleExercise = async (h) => {
    const accountNumber = sellAccount || h.account_number || accounts[0]?.account_number;
    if (!accountNumber) {
      setError("Izaberite račun za isplatu.");
      return;
    }
    try {
      const res = await exerciseOption(h.option_id, accountNumber);
      setMessage(`Opcija iskorišćena, isplata: ${formatMoney(res.payout)}.`);
      load();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError("Opcija je istekla ili je out-of-the-money.");
      else setError(err.response?.data?.error || "Greška pri korišćenju opcije.");
    }
  };

  return (
    <div className="pf-page">
      <Sidebar />

      <h1 className="pf-title">Moj portfolio</h1>

      <div className="pf-summary">
        <div className="pf-summary-card">
          <span className="pf-summary-label">Ukupan profit</span>
          <span className={`pf-summary-value ${totalProfit >= 0 ? "pf-pos" : "pf-neg"}`}>
            {formatMoney(totalProfit)}
          </span>
        </div>
        {tax && (
          <>
            <div className="pf-summary-card">
              <span className="pf-summary-label">Plaćen porez (godina)</span>
              <span className="pf-summary-value">{formatMoney(tax.paid_this_year_rsd, "RSD")}</span>
            </div>
            <div className="pf-summary-card">
              <span className="pf-summary-label">Neplaćen porez (mesec)</span>
              <span className="pf-summary-value pf-neg">
                {formatMoney(tax.unpaid_this_month_rsd, "RSD")}
              </span>
            </div>
          </>
        )}
      </div>

      {error && <p className="pf-error">{error}</p>}
      {message && <p className="pf-success">{message}</p>}

      {loading ? (
        <p className="pf-empty">Učitavanje...</p>
      ) : holdings.length === 0 ? (
        <p className="pf-empty">Nemate hartija u portfoliju.</p>
      ) : (
        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>Tip</th>
                <th>Ticker</th>
                <th>Količina</th>
                <th>Avg cena</th>
                <th>Trenutna</th>
                <th>Profit</th>
                <th>Račun</th>
                <th>Public</th>
                <th>Modifikovano</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.id}>
                  <td>{h.asset_type}</td>
                  <td className="pf-ticker">{h.ticker}</td>
                  <td>{formatNumber(h.amount)}</td>
                  <td>{formatMoney(h.avg_cost)}</td>
                  <td>{formatMoney(h.current_price)}</td>
                  <td className={h.profit >= 0 ? "pf-pos" : "pf-neg"}>
                    {formatMoney(h.profit)}
                  </td>
                  <td>{h.account_number || "—"}</td>
                  <td>
                    {h.asset_type === "stock" ? (
                      publicEdit[h.id] !== undefined ? (
                        <div className="pf-public-edit">
                          <input
                            type="number"
                            min="0"
                            max={h.amount}
                            value={publicEdit[h.id]}
                            onChange={(e) =>
                              setPublicEdit((p) => ({ ...p, [h.id]: e.target.value }))
                            }
                          />
                          <button onClick={() => handleSavePublic(h)}>OK</button>
                          <button
                            onClick={() =>
                              setPublicEdit((p) => {
                                const c = { ...p };
                                delete c[h.id];
                                return c;
                              })
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          className="pf-public-btn"
                          onClick={() =>
                            setPublicEdit((p) => ({ ...p, [h.id]: h.public_amount }))
                          }
                        >
                          {formatNumber(h.public_amount || 0)}
                        </button>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {h.last_modified_unix
                      ? new Date(h.last_modified_unix * 1000).toLocaleDateString("sr-RS")
                      : "—"}
                  </td>
                  <td className="pf-actions">
                    {h.amount > 0 && (
                      <button
                        className="pf-btn pf-btn--sell"
                        onClick={() => handleStartSell(h)}
                      >
                        Prodaj
                      </button>
                    )}
                    {h.asset_type === "option" && isEmployee && (
                      <button
                        className="pf-btn pf-btn--exercise"
                        onClick={() => handleExercise(h)}
                      >
                        Iskoristi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sellHoldingId !== null && (
        <div className="pf-overlay" onClick={() => setSellHoldingId(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Prodaja</h2>
            <p>
              {(() => {
                const h = holdings.find((x) => x.id === sellHoldingId);
                return h ? `${h.ticker} (poseduješ ${h.amount})` : "";
              })()}
            </p>
            <label>
              Količina
              <input
                type="number"
                min="1"
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
              />
            </label>
            <label>
              Račun za uplatu
              <select value={sellAccount} onChange={(e) => setSellAccount(e.target.value)}>
                <option value="">— izaberite —</option>
                {accounts.map((a) => (
                  <option key={a.account_number} value={a.account_number}>
                    {a.account_number} ({a.currency})
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="pf-error">{error}</p>}
            <div className="pf-modal-actions">
              <button onClick={() => setSellHoldingId(null)}>Otkaži</button>
              <button onClick={handleConfirmSell} disabled={submitting}>
                {submitting ? "Slanje..." : "Potvrdi prodaju"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
