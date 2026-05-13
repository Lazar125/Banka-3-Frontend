import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInvestmentFund } from "../services/investmentFundService.js";
import { getCurrentUserEmail } from "../services/AuthService.js";
import Sidebar from "../components/Sidebar.jsx";
import "./CreateEmployeePage.css";
import "./EmployeesPage.css";
import "./CreateInvestmentFundPage.css";

function validate(form) {
  const errors = {};
  const name = form.name.trim();
  const desc = form.strategyDescription.trim();
  const minInv = form.minimumInvestment === "" ? NaN : Number(form.minimumInvestment);

  if (!name) {
    errors.name = "Naziv fonda je obavezan.";
  } else if (name.length < 3) {
    errors.name = "Naziv mora imati najmanje 3 karaktera.";
  } else if (name.length > 100) {
    errors.name = "Naziv ne sme biti duži od 100 karaktera.";
  }

  if (!desc) {
    errors.strategyDescription = "Opis strategije je obavezan.";
  } else if (desc.length < 10) {
    errors.strategyDescription = "Opis mora imati najmanje 10 karaktera.";
  } else if (desc.length > 500) {
    errors.strategyDescription = "Opis ne sme biti duži od 500 karaktera.";
  }

  if (form.minimumInvestment === "") {
    errors.minimumInvestment = "Minimalni ulog je obavezan.";
  } else if (isNaN(minInv) || minInv < 1000) {
    errors.minimumInvestment = "Minimalni ulog mora biti najmanje 1.000 RSD.";
  } else if (!Number.isInteger(minInv)) {
    errors.minimumInvestment = "Minimalni ulog mora biti ceo broj (bez decimala).";
  }

  return errors;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY = { name: "", strategyDescription: "", minimumInvestment: "" };

export default function CreateInvestmentFundPage() {
  const navigate = useNavigate();
  const managerEmail = getCurrentUserEmail() || "—";

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdFund, setCreatedFund] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const result = await createInvestmentFund({
        name: form.name.trim(),
        strategyDescription: form.strategyDescription.trim(),
        minimumInvestment: Number(form.minimumInvestment),
        managerEmail,
      });
      setCreatedFund(result);
    } catch (err) {
      setSubmitError(
        err.response?.data?.error || "Greška pri kreiranju fonda. Pokušajte ponovo."
      );
    } finally {
      setLoading(false);
    }
  }

  const descLen = form.strategyDescription.length;
  const descCounterClass =
    descLen > 490 ? "fund-char-counter at-limit" :
    descLen > 450 ? "fund-char-counter near-limit" :
    "fund-char-counter";

  if (createdFund) {
    return (
      <div className="page-bg">
        <Sidebar />
        <div className="create-page">
          <div className="create-form-card">
            <div className="create-header">
              <div className="create-header-text">
                <p className="create-eyebrow">INVESTICIONI FOND KREIRAN</p>
                <h1>Fond uspešno kreiran</h1>
                <p className="create-subtitle">
                  Investicioni fond je registrovan u sistemu i spreman za rad.
                </p>
              </div>
              <div className="create-header-actions">
                <button
                  className="create-btn create-btn-secondary"
                  onClick={() => { setCreatedFund(null); setForm(EMPTY); setErrors({}); setSubmitError(""); }}
                >
                  Kreiraj novi
                </button>
                <button
                  className="create-btn create-btn-primary"
                  onClick={() => navigate("/orders/review")}
                >
                  Nazad
                </button>
              </div>
            </div>

            <div className="fund-success-overview">
              <div className="fund-success-icon">IF</div>
              <div>
                <h2>{createdFund.name}</h2>
                <p>{createdFund.accountNumber}</p>
                <div className="fund-meta-row">
                  <span className="role-badge">Investicioni fond</span>
                  <span className="status-badge is-active">Aktivan</span>
                </div>
              </div>
            </div>

            <div className="fund-success-grid">
              <div className="fund-info-card">
                <h3 className="fund-section-title">Podaci fonda</h3>
                <div className="fund-fields-grid">
                  <FundField label="ID fonda" value={String(createdFund.id)} />
                  <FundField label="Broj računa" value={createdFund.accountNumber} />
                  <FundField label="Minimalni ulog" value={formatCurrency(createdFund.minimumInvestment)} />
                  <FundField label="Datum kreiranja" value={formatDateTime(createdFund.createdAt)} />
                  <FundField label="Menadžer" value={createdFund.managerEmail} />
                </div>
              </div>

              <div className="fund-info-card">
                <h3 className="fund-section-title">Opis strategije</h3>
                <div className="fund-strategy-text">{createdFund.strategyDescription}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <Sidebar />
      <div className="create-page">
        <div className="create-form-card">
          <div className="create-header">
            <div className="create-header-text">
              <p className="create-eyebrow">KREIRANJE INVESTICIONOG FONDA</p>
              <h1>Novi investicioni fond</h1>
              <p className="create-subtitle">
                Unesite naziv, strategiju i uslove ulaganja. Menadžer fonda biće vaš nalog.
              </p>
            </div>
            <div className="create-header-actions">
              <button
                type="button"
                className="create-btn create-btn-secondary"
                onClick={() => navigate("/orders/review")}
              >
                Nazad
              </button>
            </div>
          </div>

          {submitError && <div className="submit-error">{submitError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              {/* Naziv fonda */}
              <div className="form-group">
                <label htmlFor="name">Naziv fonda</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="npr. Alpha Growth Fund"
                  maxLength={100}
                  className={errors.name ? "input-error" : ""}
                />
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>

              {/* Minimalni ulog */}
              <div className="form-group">
                <label htmlFor="minimumInvestment">Minimalni ulog (RSD)</label>
                <input
                  id="minimumInvestment"
                  type="number"
                  name="minimumInvestment"
                  value={form.minimumInvestment}
                  onChange={handleChange}
                  placeholder="npr. 10000"
                  min={1000}
                  step={1}
                  className={errors.minimumInvestment ? "input-error" : ""}
                />
                {errors.minimumInvestment && (
                  <span className="error-msg">{errors.minimumInvestment}</span>
                )}
              </div>

              {/* Menadžer — read-only */}
              <div className="form-group">
                <label>Menadžer fonda</label>
                <input
                  type="text"
                  value={managerEmail}
                  readOnly
                  className="fund-manager-input"
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Opis strategije — full width ispod grida */}
            <div className="form-group" style={{ marginTop: "18px", position: "relative", zIndex: 1 }}>
              <label htmlFor="strategyDescription">Opis strategije</label>
              <textarea
                id="strategyDescription"
                name="strategyDescription"
                value={form.strategyDescription}
                onChange={handleChange}
                placeholder="Opišite investicionu strategiju fonda (minimum 10 karaktera)..."
                maxLength={500}
                className={`fund-textarea${errors.strategyDescription ? " input-error" : ""}`}
              />
              <span className={descCounterClass}>{descLen}/500</span>
              {errors.strategyDescription && (
                <span className="error-msg">{errors.strategyDescription}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="create-btn create-btn-primary"
                disabled={loading}
              >
                {loading ? "Kreiranje..." : "Kreiraj fond"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FundField({ label, value }) {
  return (
    <div className="fund-field">
      <span className="fund-field-label">{label}</span>
      <span className="fund-field-value">{value || "—"}</span>
    </div>
  );
}
