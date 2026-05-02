import api from "./api.js";

export async function getActuaries(params = {}) {
  const cleaned = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) cleaned[k] = v;
  });
  const response = await api.get("/actuaries", { params: cleaned });
  return response.data || [];
}

export async function setActuaryLimit(id, limitMinor) {
  const response = await api.patch(`/actuaries/${id}/limit`, { limit: limitMinor });
  return response.data;
}

export async function resetActuaryUsedLimit(id) {
  const response = await api.post(`/actuaries/${id}/reset-used-limit`);
  return response.data;
}

export async function setActuaryNeedApproval(id, value) {
  const response = await api.patch(`/actuaries/${id}/need-approval`, {
    need_approval: value,
  });
  return response.data;
}
