import { listPortfolio } from "./PortfolioService.js";

const CENTS = 100;

function toMajor(value) {
    return (Number(value) || 0) / CENTS;
}

function readFirst(obj, keys, fallback = null) {
    for (const key of keys) {
        if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
    }
    return fallback;
}

function toUnixSeconds(value) {
    if (!value) return null;
    if (typeof value === "number") return value > 1e12 ? Math.floor(value / 1000) : value;

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
}

function mapHoldingToOptionContract(h) {
    const settlementUnix = toUnixSeconds(readFirst(h, [
        "settlement_date",
        "settlementDate",
        "expiry_date",
        "expiryDate",
        "expiration_date",
        "expirationDate",
    ]));

    const now = Math.floor(Date.now() / 1000);

    return {
        id: readFirst(h, ["option_id", "optionId", "id"]),
        holdingId: h.id,
        ticker: h.ticker || "—",
        name: readFirst(h, ["name", "asset_name", "assetName"], "—"),
        optionType: readFirst(h, ["option_type", "optionType", "type"], "—"),
        amount: Number(readFirst(h, ["amount", "quantity"], 0)) || 0,
        reservedQuantity: Number(readFirst(h, ["reserved_quantity", "reservedQuantity"], 0)) || 0,
        avgCost: toMajor(readFirst(h, ["avg_cost", "avgCost"], 0)),
        currentPrice: toMajor(readFirst(h, ["current_price", "currentPrice"], 0)),
        profit: toMajor(readFirst(h, ["profit", "pnl"], 0)),
        strikePrice: toMajor(readFirst(h, ["strike", "strike_price", "strikePrice"], 0)),
        currency: readFirst(h, ["currency", "settlement_currency", "settlementCurrency"], "USD"),
        settlementUnix,
        lastModifiedUnix: toUnixSeconds(readFirst(h, ["last_modified_unix", "lastModifiedUnix", "updated_at", "updatedAt"])),
        status: settlementUnix && settlementUnix < now ? "expired" : "valid",
        accountNumber: readFirst(h, ["account_number", "accountNumber"], "—"),
    };
}

export async function listSignedOptionContracts() {
    const portfolio = await listPortfolio();
    const holdings = Array.isArray(portfolio) ? portfolio : [];

    return holdings
        .filter((h) => {
            const assetType = String(readFirst(h, ["asset_type", "assetType", "security_type", "securityType"], ""));
            return assetType.toLowerCase() === "option";
        })
        .map(mapHoldingToOptionContract);
}