import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { listSignedOptionContracts } from "../services/OptionContractsService.js";
import { formatCurrency } from "../utils/loanCalculations.js";
import "./OptionContractsPage.css";

const FILTERS = [
    { key: "all", label: "Svi" },
    { key: "valid", label: "Važeći" },
    { key: "expired", label: "Istekli" },
];

function formatDate(unix) {
    if (!unix) return "—";
    return new Date(unix * 1000).toLocaleDateString("sr-RS");
}

function formatDateTime(unix) {
    if (!unix) return "—";
    return new Date(unix * 1000).toLocaleString("sr-RS");
}

function optionTypeLabel(value) {
    const raw = String(value || "").toLowerCase();
    if (raw.includes("call")) return "CALL";
    if (raw.includes("put")) return "PUT";
    return value && value !== "—" ? String(value).toUpperCase() : "—";
}

function statusLabel(status) {
    return status === "expired" ? "Istekao" : "Važeći";
}

export default function OptionContractsPage() {
    const [contracts, setContracts] = useState([]);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadContracts() {
            try {
                setLoading(true);
                const data = await listSignedOptionContracts();
                if (!cancelled) {
                    setContracts(Array.isArray(data) ? data : []);
                    setError("");
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e?.response?.data?.message || e.message || "Greška pri učitavanju opcionih ugovora.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadContracts();
        return () => {
            cancelled = true;
        };
    }, []);

    const counts = useMemo(() => {
        return contracts.reduce(
            (acc, c) => {
                acc.all += 1;
                acc[c.status] += 1;
                return acc;
            },
            { all: 0, valid: 0, expired: 0 },
        );
    }, [contracts]);

    const visibleContracts = useMemo(() => {
        const q = search.trim().toLowerCase();

        return contracts.filter((contract) => {
            if (filter !== "all" && contract.status !== filter) return false;
            if (!q) return true;

            return [contract.ticker, contract.name, contract.accountNumber]
                .some((value) => String(value || "").toLowerCase().includes(q));
        });
    }, [contracts, filter, search]);

    return (
        <div className="option-contracts-page oc-page">
            <Sidebar />

            <div className="oc-header">
                <div>
                    <h1 className="oc-title">Opcioni ugovori</h1>
                    <p className="oc-subtitle">
                        Pregled svih potpisanih opcionih ugovora sa filterima za važeće i istekle ugovore.
                    </p>
                </div>

                <button
                    className="oc-refresh-btn"
                    onClick={async () => {
                        setLoading(true);
                        setError("");
                        try {
                            const data = await listSignedOptionContracts();
                            setContracts(Array.isArray(data) ? data : []);
                        } catch (e) {
                            setError(e?.response?.data?.message || e.message || "Greška pri osvežavanju opcionih ugovora.");
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    Osveži
                </button>
            </div>

            <div className="oc-summary">
                <div className="oc-summary-card">
                    <span>Ukupno</span>
                    <strong>{counts.all}</strong>
                </div>
                <div className="oc-summary-card oc-summary-card--valid">
                    <span>Važeći</span>
                    <strong>{counts.valid}</strong>
                </div>
                <div className="oc-summary-card oc-summary-card--expired">
                    <span>Istekli</span>
                    <strong>{counts.expired}</strong>
                </div>
            </div>

            <div className="oc-toolbar">
                <div className="oc-tabs" role="tablist" aria-label="Filter opcionih ugovora">
                    {FILTERS.map((item) => (
                        <button
                            key={item.key}
                            role="tab"
                            aria-selected={filter === item.key}
                            className={`oc-tab${filter === item.key ? " oc-tab--active" : ""}`}
                            onClick={() => setFilter(item.key)}
                        >
                            {item.label}
                            <span>{counts[item.key]}</span>
                        </button>
                    ))}
                </div>

                <input
                    className="oc-search"
                    type="text"
                    placeholder="Pretraži po tickeru, nazivu ili računu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading && <div className="oc-state">Učitavanje opcionih ugovora...</div>}
            {!loading && error && <div className="oc-state oc-state--error">{error}</div>}

            {!loading && !error && (
                <div className="oc-table-wrapper">
                    <table className="oc-table">
                        <thead>
                        <tr>
                            <th>Status</th>
                            <th>Ticker</th>
                            <th>Naziv</th>
                            <th>Tip</th>
                            <th>Količina</th>
                            <th>Raspoloživo</th>
                            <th>Strike</th>
                            <th>Avg cena</th>
                            <th>Trenutna</th>
                            <th>Profit</th>
                            <th>Datum isteka</th>
                            <th>Račun</th>
                            <th>Modifikovano</th>
                        </tr>
                        </thead>
                        <tbody>
                        {visibleContracts.length === 0 && (
                            <tr>
                                <td colSpan={13} className="oc-empty">
                                    Nema opcionih ugovora koji odgovaraju izabranom filteru.
                                </td>
                            </tr>
                        )}

                        {visibleContracts.map((contract) => {
                            const available = Math.max(0, contract.amount - contract.reservedQuantity);
                            const profitClass = contract.profit >= 0 ? "oc-profit--plus" : "oc-profit--minus";

                            return (
                                <tr key={`${contract.id}-${contract.holdingId}`}>
                                    <td>
                      <span className={`oc-status oc-status--${contract.status}`}>
                        {statusLabel(contract.status)}
                      </span>
                                    </td>
                                    <td className="oc-ticker">{contract.ticker}</td>
                                    <td>{contract.name}</td>
                                    <td>{optionTypeLabel(contract.optionType)}</td>
                                    <td>{contract.amount}</td>
                                    <td>{available}</td>
                                    <td>
                                        {contract.strikePrice > 0
                                            ? formatCurrency(contract.strikePrice, contract.currency)
                                            : "—"}
                                    </td>
                                    <td>{formatCurrency(contract.avgCost, contract.currency)}</td>
                                    <td>{formatCurrency(contract.currentPrice, contract.currency)}</td>
                                    <td className={`oc-profit ${profitClass}`}>
                                        {contract.profit >= 0 ? "+" : ""}
                                        {formatCurrency(contract.profit, contract.currency)}
                                    </td>
                                    <td>{formatDate(contract.settlementUnix)}</td>
                                    <td>{contract.accountNumber}</td>
                                    <td>{formatDateTime(contract.lastModifiedUnix)}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}