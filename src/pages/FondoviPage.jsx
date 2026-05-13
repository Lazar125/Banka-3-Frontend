import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { getFondovi } from "../services/FondoviService.js";
import "./FondoviPage.css";

function formatCurrency(value) {
    if (value == null) return "—";
    return new Intl.NumberFormat("sr-RS", {
        style: "currency",
        currency: "RSD",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatProfit(value) {
    if (value == null) return "—";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

const SORT_FIELDS = ["naziv", "vrednost", "profit", "minUlog"];

export default function FondoviPage() {
    const [fondovi, setFondovi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const data = await getFondovi();
                if (!cancelled) {
                    setFondovi(data);
                    setError("");
                }
            } catch {
                if (!cancelled) setError("Greška pri učitavanju fondova.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let result = fondovi.filter((f) => {
            if (!term) return true;
            return (
                (f.naziv || "").toLowerCase().includes(term) ||
                (f.opis || "").toLowerCase().includes(term)
            );
        });

        if (sortBy && SORT_FIELDS.includes(sortBy)) {
            result = [...result].sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];
                if (typeof aVal === "string") {
                    return sortOrder === "asc"
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }
                return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
            });
        }
        return result;
    }, [fondovi, searchTerm, sortBy, sortOrder]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, sortOrder]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    function handleSort(field) {
        if (sortBy === field) {
            setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    }

    function SortIcon({ field }) {
        if (sortBy !== field) return <span className="sort-icon sort-icon--neutral">⇅</span>;
        return (
            <span className="sort-icon sort-icon--active">
                {sortOrder === "asc" ? "↑" : "↓"}
            </span>
        );
    }

    if (loading) {
        return (
            <div className="page-bg">
                <img src="/bank-logo.png" alt="logo" className="bank-logo" />
                <Sidebar />
                <div className="content-wrapper"><p>Učitavanje...</p></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-bg">
                <img src="/bank-logo.png" alt="logo" className="bank-logo" />
                <Sidebar />
                <div className="content-wrapper"><p style={{ color: "#f87171" }}>{error}</p></div>
            </div>
        );
    }

    return (
        <div className="page-bg">
            <img src="/bank-logo.png" alt="logo" className="bank-logo" />
            <Sidebar />

            <div className="content-wrapper">
                <div className="employee-card fondovi-card-shell">

                    <div className="employee-topbar">
                        <div className="employee-title-block">
                            <p className="employee-eyebrow">INVESTICIJE</p>
                            <h1>Investicioni Fondovi</h1>
                            <p className="employee-subtitle">
                                Pregled dostupnih investicionih fondova
                            </p>
                        </div>
                    </div>

                    <div className="fondovi-toolbar">
                        <div className="search-wrapper">
                            <span className="search-icon">⌕</span>
                            <input
                                className="search"
                                placeholder="Pretraga po nazivu ili opisu"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="toolbar-actions">
                            <button
                                className="reset-btn"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSortBy("");
                                    setSortOrder("asc");
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="filter-info">
                        Pronađeno: <strong>{filtered.length}</strong> / {fondovi.length} fondova
                    </div>

                    <div className="table-container fondovi-table-wrap">
                        <table className="fondovi-table">
                            <thead>
                                <tr>
                                    <th
                                        className="sortable-th"
                                        onClick={() => handleSort("naziv")}
                                    >
                                        Naziv <SortIcon field="naziv" />
                                    </th>
                                    <th>Opis</th>
                                    <th
                                        className="sortable-th"
                                        onClick={() => handleSort("vrednost")}
                                    >
                                        Vrednost <SortIcon field="vrednost" />
                                    </th>
                                    <th
                                        className="sortable-th"
                                        onClick={() => handleSort("profit")}
                                    >
                                        Profit <SortIcon field="profit" />
                                    </th>
                                    <th
                                        className="sortable-th"
                                        onClick={() => handleSort("minUlog")}
                                    >
                                        Min. Ulog <SortIcon field="minUlog" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="fondovi-empty">
                                            Nema rezultata za zadate kriterijume.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((fond) => (
                                        <tr key={fond.id} className="fondovi-row">
                                            <td className="fondovi-naziv">{fond.naziv}</td>
                                            <td className="fondovi-opis">{fond.opis}</td>
                                            <td>{formatCurrency(fond.vrednost)}</td>
                                            <td className={fond.profit >= 0 ? "profit-positive" : "profit-negative"}>
                                                {formatProfit(fond.profit)}
                                            </td>
                                            <td>{formatCurrency(fond.minUlog)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                        >
                            Prethodna
                        </button>
                        <span>Strana {currentPage} / {totalPages || 1}</span>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((p) => p + 1)}
                        >
                            Sledeća
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
