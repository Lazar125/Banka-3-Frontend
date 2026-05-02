import api from "./api.js";

export async function getTaxDebts(params = {}) {
  const cleaned = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) cleaned[k] = v;
  });
  const response = await api.get("/tax/debts", { params: cleaned });
  return response.data || [];
}

// month: "YYYY-MM" or empty for backfill across all unpaid rows.
export async function runTax(month = "") {
  const response = await api.post("/tax/run", null, {
    params: month ? { month } : {},
  });
  return response.data;
}

export async function getMyTax() {
  const response = await api.get("/tax/me");
  return response.data;
}
