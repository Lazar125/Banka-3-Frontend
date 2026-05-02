import api from "./api.js";

// Listings (stocks + futures). Filters: search, exchange (acronym prefix),
// price/ask/bid/volume min-max, settlement_from/to (futures only), sort.
export async function getListings(params = {}) {
  const cleaned = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) cleaned[k] = v;
  });
  const response = await api.get("/listings", { params: cleaned });
  return response.data || [];
}

export async function getListing(id) {
  const response = await api.get(`/listings/${id}`);
  return response.data;
}

// period ∈ day | week | month | year | 5y | all (defaults to month)
export async function getListingHistory(id, period = "month") {
  const response = await api.get(`/listings/${id}/history`, { params: { period } });
  return response.data;
}

export async function getForexPairs() {
  const response = await api.get("/forex-pairs");
  return response.data || [];
}

// Employee/actuary only.
export async function getOptionDates(stockId) {
  const response = await api.get(`/stocks/${stockId}/options/dates`);
  return response.data || [];
}

// settlement: "YYYY-MM-DD". strikes: rows above/below ATM, 0 = no limit.
export async function getOptionGrid(stockId, settlement, strikes = 5) {
  const response = await api.get(`/stocks/${stockId}/options`, {
    params: { settlement, strikes },
  });
  return response.data;
}
