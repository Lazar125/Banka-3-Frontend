import api from "./api.js";

export async function getPortfolio() {
  const response = await api.get("/portfolio");
  return response.data || [];
}

export async function sellHolding(payload) {
  const response = await api.post("/portfolio/sell", payload);
  return response.data;
}

export async function setHoldingPublicAmount(holdingId, publicAmount) {
  const response = await api.patch(`/portfolio/${holdingId}/public`, {
    public_amount: publicAmount,
  });
  return response.data;
}

export async function exerciseOption(optionId, accountNumber) {
  const response = await api.post(`/options/${optionId}/exercise`, {
    account_number: accountNumber,
  });
  return response.data;
}

export async function getMyTax() {
  const response = await api.get("/tax/me");
  return response.data;
}
