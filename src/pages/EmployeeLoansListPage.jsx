import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { getLoans } from "../services/LoanService.js";
import { formatCurrency } from "../utils/loanCalculations.js";
import "./EmployeeLoansListPage.css";

export default function EmployeeLoansListPage() {
  const [allLoans, setAllLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  const [filterLoanType, setFilterLoanType] = useState("");
  const [filterAccountNumber, setFilterAccountNumber] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadLoans();
  }, []);

const loadLoans = async () => {
  try {
    setLoading(true);
    const data = await getLoans();
    
    console.log("📋 Svi krediti sa backenda:", data);
    console.log("🔴 Odbijeni krediti:", data?.filter(l => l.status?.toLowerCase() === "rejected"));
    
    const sorted = (Array.isArray(data) ? data : []).sort(
      (a, b) => a.account_number.localeCompare(b.account_number)
    );
    
    setAllLoans(sorted);
    setFilteredLoans(sorted);
    setError("");
  } catch (err) {
    setError("Greška pri učitavanju kredita.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleFilterChange = () => {
    let result = [...allLoans];

    if (filterLoanType) {
      result = result.filter(loan => {
        const loanTypeNormalized = loan.loan_type?.toLowerCase().trim();
        const filterNormalized = filterLoanType.toLowerCase().trim();

        const typeMap = {
          "gotovinski": "cash",
          "stambeni": "residential",
          "auto": "auto",
          "refinansirajuci": "refinancing",
          "studentski": "student"
        };
        
        return loanTypeNormalized === typeMap[filterNormalized];
      });
    }

    if (filterAccountNumber) {
      result = result.filter(loan => 
        loan.account_number.includes(filterAccountNumber)
      );
    }

    if (filterStatus) {
      result = result.filter(loan => {
        const statusMap = {
          "odobren": "approved",
          "odbijen": "rejected",
          "otplaćen": "paid",
          "u kašnjenju": "overdue"
        };
        
        const loanStatusNormalized = loan.status?.toLowerCase().trim();
        const filterStatusNormalized = statusMap[filterStatus.toLowerCase().trim()];
        
        return loanStatusNormalized === filterStatusNormalized;
      });
    }

    setFilteredLoans(result);
  };

  useEffect(() => {
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLoanType, filterAccountNumber, filterStatus]);

  const loanTypes = ["GOTOVINSKI", "STAMBENI", "AUTO", "REFINANSIRAJUCI", "STUDENTSKI"];
  const statuses = ["Odobren", "Odbijen", "Otplaćen", "U kašnjenju"];

  if (loading) {
    return (
      <div className="admin-loans-page">
        <Sidebar />
        <div className="admin-loans-loading">Učitavanje kredita...</div>
      </div>
    );
  }

  return (
    <div className="admin-loans-page">
      <Sidebar />

      <h1 className="admin-loans-title">Upravljanje kreditima - Spisak svih kredita</h1>

      <div className="admin-loans-filters">
        <div className="filter-group">
          <label>Vrsta kredita:</label>
          <select
            value={filterLoanType}
            onChange={(e) => setFilterLoanType(e.target.value)}
          >
            <option value="">Sve vrste</option>
            {loanTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Broj računa:</label>
          <input
            type="text"
            placeholder="Unesite broj računa..."
            value={filterAccountNumber}
            onChange={(e) => setFilterAccountNumber(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Svi statusi</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="admin-loans-error">{error}</div>}

      <div className="admin-loans-info">
        Prikazujem <strong>{filteredLoans.length}</strong> od <strong>{allLoans.length}</strong> kredita
      </div>

      {filteredLoans.length === 0 ? (
        <div className="admin-loans-empty">
          {allLoans.length === 0 ? "Nema kredita." : "Nema kredita koji odgovaraju filterima."}
        </div>
      ) : (
        <div className="admin-loans-table-container">
          <table className="admin-loans-table">
            <thead>
              <tr>
                <th>Broj kredita</th>
                <th>Vrsta</th>
                <th>Tip kamate</th>
                <th>Datum ugovaranja</th>
                <th>Period</th>
                <th>Broj računa</th>
                <th>Iznos</th>
                <th>Preostalo</th>
                <th>Valuta</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map(loan => (
                <tr 
                  key={loan.loan_number}
                  onClick={() => setSelectedLoan(loan)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="loan-number">{loan.loan_number}</td>
                  <td>{loan.loan_type}</td>
                  <td>{loan.interest_rate_type || "Fiksna"}</td>
                  <td>{formatDate(loan.agreement_date)}</td>
                  <td>{loan.repayment_period} meseci</td>
                  <td className="account-number">{loan.account_number}</td>
                  <td className="amount">{formatCurrency(loan.loan_amount, loan.currency)}</td>
                  <td className="amount">{formatCurrency(loan.remaining_debt, loan.currency)}</td>
                  <td>{loan.currency}</td>
                  <td>
                    <span className={`status-badge ${loan.status?.toLowerCase().replace(' ', '_')}`}>
                      {loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
        />
      )}
    </div>
  );
}

function LoanDetailModal({ loan, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2>Detalji kredita</h2>

        <div className="detail-grid">
          <div className="detail-row">
            <span className="detail-label">Broj kredita:</span>
            <span className="detail-value">{loan.loan_number}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Vrsta kredita:</span>
            <span className="detail-value">{loan.loan_type}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Ukupan iznos:</span>
            <span className="detail-value">
              {formatCurrency(loan.loan_amount, loan.currency)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Period otplate:</span>
            <span className="detail-value">{loan.repayment_period} meseci</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Nominalna kamatna stopa:</span>
            <span className="detail-value">{loan.nominal_rate}%</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Efektivna kamatna stopa:</span>
            <span className="detail-value">{loan.effective_rate || loan.nominal_rate}%</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Datum ugovaranja:</span>
            <span className="detail-value">{formatDate(loan.agreement_date)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Datum dospeća:</span>
            <span className="detail-value">{formatDate(loan.maturity_date)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Sledeća rata:</span>
            <span className="detail-value">
              {formatCurrency(loan.next_installment_amount, loan.currency)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Datum sledeće rate:</span>
            <span className="detail-value">{formatDate(loan.next_installment_date)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Preostalo dugovanje:</span>
            <span className="detail-value">
              {formatCurrency(loan.remaining_debt, loan.currency)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Valuta:</span>
            <span className="detail-value">{loan.currency}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-status ${loan.status?.toLowerCase().replace(' ', '_')}`}>
              {loan.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("sr-RS");
}