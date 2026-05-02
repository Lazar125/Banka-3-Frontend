import { useParams } from "react-router-dom";
import { useSecurityDetails } from "../hooks/useSecurityDetails";
import SecurityChart from "../components/securities/SecurityChart";
import SecurityHistoryTable from "../components/securities/SecurityHistoryTable";
import OptionsTable from "../components/securities/OptionsTable";
import "./SecurityDetailPage.css";

function SecurityDetailPage() {
  const { ticker } = useParams();
  const { detail, history, options, period, setPeriod, loading, error } = useSecurityDetails(ticker);

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>⏳ Učitavanje...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red" }}>❌ Greška: {error}</div>;
  }

  if (!detail) {
    return <div style={{ padding: "20px" }}>Hartija nije pronađena</div>;
  }

  return (
    <div className="security-detail-page">
      <div className="detail-container">
        <div className="security-header">
          <div className="header-info">
            <h1>{ticker}</h1>
            <p className="security-name">{detail.name}</p>
            <div className="header-stats">
              <div className="stat">
                <span className="stat-label">Cena:</span>
                <span className="stat-value">${detail.price.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Ask:</span>
                <span className="stat-value">${detail.ask.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Bid:</span>
                <span className="stat-value">${detail.bid.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Promena:</span>
                <span className={`stat-value ${detail.change >= 0 ? "positive" : "negative"}`}>
                  {detail.change >= 0 ? "+" : ""}{detail.change.toFixed(2)}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Volume:</span>
                <span className="stat-value">{(detail.volume / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        </div>

        <SecurityChart data={history} period={period} setPeriod={setPeriod} />

        {history.length > 0 && <SecurityHistoryTable data={history} />}

        {options.length > 0 && <OptionsTable options={options} sharedPrice={detail.price} />}
      </div>
    </div>
  );
}

export default SecurityDetailPage;