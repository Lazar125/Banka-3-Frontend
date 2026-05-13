import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { formatCurrency } from "../utils/loanCalculations.js";
import "./PortfolioPage.css";

// TODO: Zameniti sa pravim API pozivom kada backend implementira endpoint
const MOCK_SECURITIES = [
    {
        id: 1,
        type: "Akcija",
        ticker: "AAPL",
        name: "Apple Inc.",
        quantity: 10,
        purchase_price: 15000,
        current_price: 17500,
        currency: "RSD",
    },
    {
        id: 2,
        type: "Akcija",
        ticker: "MSFT",
        name: "Microsoft Corp.",
        quantity: 5,
        purchase_price: 30000,
        current_price: 27000,
        currency: "RSD",
    },
    {
        id: 3,
        type: "Obveznica",
        ticker: "GOVT",
        name: "US Treasury Bond",
        quantity: 20,
        purchase_price: 10000,
        current_price: 10500,
        currency: "RSD",
    },
    {
        id: 4,
        type: "Akcija",
        ticker: "GOOGL",
        name: "Alphabet Inc.",
        quantity: 3,
        purchase_price: 12000,
        current_price: 11000,
        currency: "RSD",
    },
];

const MOCK_FUNDS = [
    {
        id: 1,
        name: "Alpha Growth Fund",
        description: "Fond fokusiran na IT sektor i kompanije visokog rasta.",
        totalValue: 125000000,
        liquidity: 18000000,
    },
    {
        id: 2,
        name: "Balanced Income Fund",
        description: "Kombinacija obveznica i stabilnih akcija.",
        totalValue: 87000000,
        liquidity: 12000000,
    },
    {
        id: 3,
        name: "Energy Future Fund",
        description: "Investicije u energetski i commodity sektor.",
        totalValue: 64000000,
        liquidity: 9500000,
    },
];

function fmt(amount, currency = "RSD") {
    return formatCurrency(amount / 100, currency);
}

function calcProfitLoss(security) {
    const { quantity, purchase_price, current_price } = security;
    return (current_price - purchase_price) * quantity;
}

export default function PortfolioPage() {
    const navigate = useNavigate();

    const [securities] = useState(MOCK_SECURITIES);
    const [funds] = useState(MOCK_FUNDS);

    const [activeTab, setActiveTab] = useState("securities");

const userRole = sessionStorage.getItem("userRole");

const permissions = JSON.parse(
    sessionStorage.getItem("permissions") || "[]"
);

const isSupervisor =
    userRole === "employee" &&
    (
        permissions.includes("supervisor") ||
        permissions.includes("admin")
    );
    const totalProfitLoss = securities.reduce(
        (sum, s) => sum + calcProfitLoss(s),
        0
    );

    const totalLiquidity = funds.reduce(
        (sum, f) => sum + f.liquidity,
        0
    );

    const handleSell = (ticker) => {
        alert(`Prodaja hartije ${ticker} — funkcionalnost u razvoju.`);
    };

    const handleFundClick = (fundId) => {
        navigate(`/funds/${fundId}`);
    };

    return (
        <div className="portfolio-page">
            <Sidebar />

            <h1 className="portfolio-title">Moj portfolio</h1>

            <div className="portfolio-tabs">
                <button
                    className={`portfolio-tab ${
                        activeTab === "securities" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("securities")}
                >
                    Moje hartije
                </button>

                {isSupervisor && (
                    <button
                        className={`portfolio-tab ${
                            activeTab === "funds" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("funds")}
                    >
                        Moji fondovi
                    </button>
                )}
            </div>

            {activeTab === "securities" && (
                <>
                    <div
                        className={`portfolio-summary ${
                            totalProfitLoss >= 0
                                ? "summary--profit"
                                : "summary--loss"
                        }`}
                    >
                        <span className="summary-label">
                            Ukupni profit/gubitak
                        </span>

                        <span className="summary-value">
                            {totalProfitLoss >= 0 ? "+" : ""}
                            {fmt(totalProfitLoss)}
                        </span>
                    </div>

                    {securities.length === 0 ? (
                        <div className="portfolio-empty">
                            <p>Nemate hartija od vrednosti u portfoliju.</p>
                        </div>
                    ) : (
                        <div className="portfolio-table-wrapper">
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Tip</th>
                                        <th>Ticker</th>
                                        <th>Naziv</th>
                                        <th>Količina</th>
                                        <th>Trenutna cena</th>
                                        <th>Profit/Gubitak</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {securities.map((s) => {
                                        const pl = calcProfitLoss(s);
                                        const isProfit = pl >= 0;

                                        return (
                                            <tr key={s.id}>
                                                <td>
                                                    <span className="security-type-badge">
                                                        {s.type}
                                                    </span>
                                                </td>

                                                <td className="ticker">
                                                    {s.ticker}
                                                </td>

                                                <td className="security-name">
                                                    {s.name}
                                                </td>

                                                <td>{s.quantity}</td>

                                                <td>
                                                    {fmt(
                                                        s.current_price,
                                                        s.currency
                                                    )}
                                                </td>

                                                <td
                                                    className={
                                                        isProfit
                                                            ? "pl pl--profit"
                                                            : "pl pl--loss"
                                                    }
                                                >
                                                    {isProfit ? "+" : ""}
                                                    {fmt(pl, s.currency)}
                                                </td>

                                                <td>
                                                    <button
                                                        className="sell-btn"
                                                        onClick={() =>
                                                            handleSell(s.ticker)
                                                        }
                                                    >
                                                        Sell
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {isSupervisor && activeTab === "funds" && (
                <>
                    <div className="portfolio-summary summary--profit">
                        <span className="summary-label">
                            Ukupna likvidnost fondova
                        </span>

                        <span className="summary-value">
                            {fmt(totalLiquidity)}
                        </span>
                    </div>

                    {funds.length === 0 ? (
                        <div className="portfolio-empty">
                            <p>Nemate fondova kojima upravljate.</p>
                        </div>
                    ) : (
                        <div className="portfolio-table-wrapper">
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Naziv fonda</th>
                                        <th>Opis</th>
                                        <th>Vrednost fonda</th>
                                        <th>Likvidnost</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {funds.map((fund) => (
                                        <tr
                                            key={fund.id}
                                            className="portfolio-clickable-row"
                                            onClick={() =>
                                                handleFundClick(fund.id)
                                            }
                                        >
                                            <td className="fund-name">
                                                {fund.name}
                                            </td>

                                            <td className="fund-description">
                                                {fund.description}
                                            </td>

                                            <td>
                                                {fmt(fund.totalValue)}
                                            </td>

                                            <td className="fund-liquidity">
                                                {fmt(fund.liquidity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}