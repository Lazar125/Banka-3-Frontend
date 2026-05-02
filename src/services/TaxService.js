import api from "./api";

// TODO: Replace with real endpoint when backend implements Celina 3 (berza)
// Expected endpoints: GET /api/tax, POST /api/tax/collect
const MOCK_TAX_DATA = [
  { id: 1, firstName: "Marko", lastName: "Petrović", email: "marko.petrovic@example.com", role: "client", taxAmount: 45230.0 },
  { id: 2, firstName: "Ana", lastName: "Jovanović", email: "ana.jovanovic@example.com", role: "client", taxAmount: 12750.5 },
  { id: 3, firstName: "Nikola", lastName: "Đorđević", email: "nikola.djordjevic@example.com", role: "actuary", taxAmount: 89100.0 },
  { id: 4, firstName: "Jelena", lastName: "Nikolić", email: "jelena.nikolic@example.com", role: "client", taxAmount: 3200.0 },
  { id: 5, firstName: "Stefan", lastName: "Milošević", email: "stefan.milosevic@example.com", role: "actuary", taxAmount: 67450.75 },
  { id: 6, firstName: "Milica", lastName: "Stanković", email: "milica.stankovic@example.com", role: "client", taxAmount: 21890.25 },
  { id: 7, firstName: "Lazar", lastName: "Ilić", email: "lazar.ilic@example.com", role: "actuary", taxAmount: 154320.0 },
  { id: 8, firstName: "Tamara", lastName: "Popović", email: "tamara.popovic@example.com", role: "client", taxAmount: 8640.0 },
];

export async function getTaxData() {
  // const response = await api.get("/tax");
  // return response.data;
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_TAX_DATA), 500);
  });
}

export async function triggerTaxCollection() {
  // const response = await api.post("/tax/collect");
  // return response.data;
  return new Promise((resolve) => {
    setTimeout(() => resolve({ message: "Obračun poreza uspešno pokrenut." }), 1000);
  });
}
