import { useEffect, useMemo, useState } from "react";
import { getAccounts } from "../services/AccountService";
import { createOrder } from "../services/OrderService";
import { formatMoney, majorToMinor } from "../utils/money";
import { hasPermission } from "../utils/permissions";
import "./CreateOrderModal.css";

// asset: { kind: "listing"|"option"|"forex", id, ticker, price, exchange }
// exchange: full Exchange object (for closed/after-hours warnings)
export default function CreateOrderModal({ open, asset, direction = "buy", exchange, onClose, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [allOrNone, setAllOrNone] = useState(false);
  const [margin, setMargin] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canMargin = hasPermission("margin_trading");

  useEffect(() => {
    if (!open) return;
    setAccount("");
    setOrderType("market");
    setQuantity("");
    setLimitPrice("");
    setStopPrice("");
    setAllOrNone(false);
    setMargin(false);
    setConfirmStep(false);
    setError("");
    getAccounts()
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => setError("Nije moguće učitati račune."));
  }, [open]);

  const exchangeStatus = useMemo(() => {
    if (!exchange) return { state: "unknown" };
    if (exchange.open_override) return { state: "open" };
    if (!exchange.open_time || !exchange.close_time || !exchange.time_zone_offset) {
      return { state: "unknown" };
    }

    // open_time / close_time are local at the exchange (HH:MM[:SS]).
    // time_zone_offset is "+HH:MM" / "-HH:MM" relative to UTC.
    // We compare current UTC, shifted into the exchange's local time, against
    // the local open/close window.
    const offsetMatch = /^([+-])(\d{2}):(\d{2})$/.exec(exchange.time_zone_offset);
    if (!offsetMatch) return { state: "unknown" };
    const sign = offsetMatch[1] === "+" ? 1 : -1;
    const offsetMinutes =
      sign * (parseInt(offsetMatch[2], 10) * 60 + parseInt(offsetMatch[3], 10));

    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    // Wrap into [0, 1440) so we don't break around midnight.
    const localMinutes = ((utcMinutes + offsetMinutes) % 1440 + 1440) % 1440;

    const [oh, om] = exchange.open_time.split(":").map(Number);
    const [ch, cm] = exchange.close_time.split(":").map(Number);
    const open = oh * 60 + om;
    const close = ch * 60 + cm;

    if (localMinutes >= open && localMinutes < close) return { state: "open" };

    // After-hours = strictly less than 4h after close (spec p.40, Sc 47).
    const minsAfterClose = ((localMinutes - close) % 1440 + 1440) % 1440;
    if (minsAfterClose > 0 && minsAfterClose < 240) return { state: "after_hours" };

    return { state: "closed" };
  }, [exchange]);

  if (!open || !asset) return null;

  const orderTypeOptions = [
    { value: "market", label: "Market" },
    { value: "limit", label: "Limit" },
    { value: "stop", label: "Stop" },
    { value: "stop_limit", label: "Stop-Limit" },
  ];

  const showLimit = orderType === "limit" || orderType === "stop_limit";
  const showStop = orderType === "stop" || orderType === "stop_limit";

  const qty = parseInt(quantity, 10);
  const valid =
    !!account &&
    qty > 0 &&
    (!showLimit || Number(limitPrice) > 0) &&
    (!showStop || Number(stopPrice) > 0);

  const approxPrice =
    showLimit && limitPrice
      ? majorToMinor(limitPrice) * qty
      : asset.price * qty;

  const handleProceed = (e) => {
    e.preventDefault();
    if (!valid) {
      setError("Popunite obavezna polja.");
      return;
    }
    setError("");
    setConfirmStep(true);
  };

  const handleConfirm = async () => {
    if (submitting) return; // double-submit guard
    setSubmitting(true);
    setError("");
    const payload = {
      account_number: account,
      order_type: orderType,
      direction,
      quantity: qty,
      all_or_none: allOrNone,
      margin: canMargin && margin,
    };
    if (asset.kind === "listing") payload.listing_id = asset.id;
    if (asset.kind === "option") payload.option_id = asset.id;
    if (asset.kind === "forex") payload.forex_pair_id = asset.id;
    if (showLimit) payload.limit_price = majorToMinor(limitPrice);
    if (showStop) payload.stop_price = majorToMinor(stopPrice);

    try {
      const res = await createOrder(payload);
      onSuccess?.(res);
      onClose();
    } catch (err) {
      // The gateway returns gRPC errors as plain-text bodies (writeGRPCError),
      // not JSON objects, so axios's `data` is often a string. Bind errors
      // are JSON `{error, details}`. Cover both shapes.
      const status = err.response?.status;
      const data = err.response?.data;
      const detail =
        typeof data === "string"
          ? data
          : data?.error || data?.message || data?.details || "";
      if (status === 401) {
        setError("Sesija je istekla. Prijavite se ponovo.");
      } else if (status === 403) {
        setError(detail || "Nemate dozvolu za ovu akciju.");
      } else {
        setError(detail ? `Greška: ${detail}` : "Greška pri slanju ordera.");
      }
      setConfirmStep(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="order-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-header">
          <h2>{direction === "buy" ? "Kupovina" : "Prodaja"} — {asset.ticker}</h2>
          <button className="order-close" onClick={onClose}>✕</button>
        </div>

        {exchangeStatus.state === "closed" && (
          <p className="order-warn">
            Berza je zatvorena. Order može biti kreiran ali se izvršava sporije.
          </p>
        )}
        {exchangeStatus.state === "after_hours" && (
          <p className="order-warn">
            Tržište je u after-hours stanju. Order može biti izvršen sporije.
          </p>
        )}

        {!confirmStep ? (
          <form onSubmit={handleProceed} className="order-form">
            <label className="order-label">
              Račun
              <select value={account} onChange={(e) => setAccount(e.target.value)}>
                <option value="">— izaberite račun —</option>
                {accounts.map((a) => (
                  <option key={a.account_number} value={a.account_number}>
                    {a.account_number} ({formatMoney(a.balance, a.currency)})
                  </option>
                ))}
              </select>
            </label>

            <label className="order-label">
              Tip ordera
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                {orderTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className="order-label">
              Količina
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>

            {showLimit && (
              <label className="order-label">
                Limit cena
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                />
              </label>
            )}
            {showStop && (
              <label className="order-label">
                Stop cena
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                />
              </label>
            )}

            <label className="order-checkbox">
              <input
                type="checkbox"
                checked={allOrNone}
                onChange={(e) => setAllOrNone(e.target.checked)}
              />
              All or None (AON)
            </label>

            {canMargin && (
              <label className="order-checkbox">
                <input
                  type="checkbox"
                  checked={margin}
                  onChange={(e) => setMargin(e.target.checked)}
                />
                Margin
              </label>
            )}

            {orderType === "market" && (
              <p className="order-note">Koristi se trenutna tržišna cena.</p>
            )}

            {error && <p className="order-error">{error}</p>}

            <div className="order-actions">
              <button type="button" className="order-btn-cancel" onClick={onClose}>
                Otkaži
              </button>
              <button type="submit" className="order-btn-primary" disabled={!valid}>
                Nastavi
              </button>
            </div>
          </form>
        ) : (
          <div className="order-confirm">
            <h3>Potvrda ordera</h3>
            <dl className="order-confirm-list">
              <dt>Hartija</dt><dd>{asset.ticker}</dd>
              <dt>Smer</dt><dd>{direction === "buy" ? "Kupovina" : "Prodaja"}</dd>
              <dt>Tip</dt><dd>{orderType}</dd>
              <dt>Količina</dt><dd>{qty}</dd>
              {showLimit && (<><dt>Limit</dt><dd>{limitPrice}</dd></>)}
              {showStop && (<><dt>Stop</dt><dd>{stopPrice}</dd></>)}
              <dt>Approx. ukupno</dt><dd>{formatMoney(approxPrice)}</dd>
              {allOrNone && (<><dt>AON</dt><dd>Da</dd></>)}
              {margin && canMargin && (<><dt>Margin</dt><dd>Da</dd></>)}
              <dt>Račun</dt><dd>{account}</dd>
            </dl>

            {error && <p className="order-error">{error}</p>}

            <div className="order-actions">
              <button
                type="button"
                className="order-btn-cancel"
                onClick={() => setConfirmStep(false)}
                disabled={submitting}
              >
                Nazad
              </button>
              <button
                type="button"
                className="order-btn-primary"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Slanje..." : "Potvrdi order"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
