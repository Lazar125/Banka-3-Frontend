import api from "./api.js";

export async function getRecipients() {
  const response = await api.get("/recipients");
  return response.data;
}

export async function getTransactions(filters = {}) {
  const params = {};
  
  if (filters.status) {
    const statusMap = {
      'Realizovano': 'realized',
      'Na čekanju': 'pending',
      'Odbijeno': 'rejected',
      'Odobreno': 'approved',
    };
    params.status = statusMap[filters.status] || filters.status;
  }
  
  if (filters.dateFrom) params.date = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  
  if (filters.amountMin || filters.amountMax) {
    const min = filters.amountMin || 0;
    const max = filters.amountMax || 999999999;
    params.amount = `${min}-${max}`;
  }
  
  try {
    const response = await api.get("/transactions", { params });
    
    const data = Array.isArray(response.data) ? response.data : [];
    
   const statusReverseMap = {
  'realized': 'Realizovano',
  'completed': 'Realizovano',  // PRIVREMENO
  'pending': 'Na čekanju',
  'rejected': 'Odbijeno',
  'approved': 'Odobreno',
};
    
    const processedData = data.map(tx => ({
      ...tx,
      status: statusReverseMap[tx.status] || tx.status || "Realizovano",
      currency: tx.currency || "RSD",
    }));
    
    return processedData;
  } catch (error) {
    console.error("❌ API ERROR:", error);
    throw error;
  }
}

export async function createRecipient(recipientData) {
  const response = await api.post("/recipients", recipientData);
  return response.data;
}

export async function updateRecipient(id, recipientData) {
  const response = await api.put(`/recipients/${id}`, recipientData);
  return response.data;
}

export async function deleteRecipient(id) {
  const response = await api.delete(`/recipients/${id}`);
  return response.data;
}

export async function createPayment(paymentData, totpCode) {
  const config = totpCode ? { headers: { TOTP: totpCode } } : {};
  const response = await api.post("/transactions/payment", paymentData, config);
  return response.data;
}

export async function createTransfer(transferData, totpCode) {
  const config = totpCode ? { headers: { TOTP: totpCode } } : {};
  const response = await api.post("/transactions/transfer", transferData, config);
  return response.data;
}
