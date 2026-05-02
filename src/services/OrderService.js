import api from "./api.js";

// Place a new order. Exactly one of listing_id/option_id/forex_pair_id must be set.
// limit_price/stop_price required only for LIMIT/STOP/STOP_LIMIT.
export async function createOrder(payload) {
  const response = await api.post("/orders", payload);
  return response.data;
}

// Supervisor feed.
export async function getOrders(params = {}) {
  const cleaned = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) cleaned[k] = v;
  });
  const response = await api.get("/orders", { params: cleaned });
  return response.data || [];
}

export async function approveOrder(id) {
  const response = await api.post(`/orders/${id}/approve`);
  return response.data;
}

export async function declineOrder(id) {
  const response = await api.post(`/orders/${id}/decline`);
  return response.data;
}

export async function cancelOrder(id) {
  const response = await api.post(`/orders/${id}/cancel`);
  return response.data;
}
