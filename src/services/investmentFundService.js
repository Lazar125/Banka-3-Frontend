
const USE_MOCK = true;

const mockDelay = (ms = 1200) => new Promise((resolve) => setTimeout(resolve, ms));

export const createInvestmentFund = async (data) => {
  if (USE_MOCK) {
    await mockDelay();

    const id = Math.floor(Math.random() * 900000) + 100000;
    const year = new Date().getFullYear();
    const suffix = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");

    const result = {
      id,
      name: data.name,
      strategyDescription: data.strategyDescription,
      minimumInvestment: data.minimumInvestment,
      managerEmail: data.managerEmail,
      accountNumber: `IF-${year}-${suffix}`,
      createdAt: new Date().toISOString(),
    };

    console.log("[MOCK] createInvestmentFund response:", result);
    return result;
  }

  // Real endpoint
  // const response = await api.post("/investment-funds", {
  //   name: data.name,
  //   strategy_description: data.strategyDescription,
  //   minimum_investment: data.minimumInvestment,
  //   manager_email: data.managerEmail,
  // });
  // return response.data;
};
