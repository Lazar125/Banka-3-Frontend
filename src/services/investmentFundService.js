const USE_MOCK = true;

const mockDelay = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));

// Pozicije koje fond drži u portfelju
const MOCK_POSITIONS = [
  { ticker: "AAPL", price: 185.50, change: 1.23,  volume: 12000, initialMarginCost: 175.00, acquisitionDate: "2026-01-15", quantity: 150 },
  { ticker: "MSFT", price: 415.20, change: -0.45, volume: 8500,  initialMarginCost: 400.00, acquisitionDate: "2026-02-03", quantity: 80  },
  { ticker: "NVDA", price: 875.00, change: 2.81,  volume: 5200,  initialMarginCost: 820.00, acquisitionDate: "2026-03-10", quantity: 30  },
  { ticker: "AMZN", price: 225.00, change: 0.67,  volume: 14000, initialMarginCost: 210.00, acquisitionDate: "2026-01-28", quantity: 50  },
];

// Istorijski podaci o performansama fonda
const MOCK_PERFORMANCE = {
  monthly: [
    { period: "Jan 2026", value: 93350  },
    { period: "Feb 2026", value: 98200  },
    { period: "Mar 2026", value: 105800 },
    { period: "Apr 2026", value: 109400 },
    { period: "Maj 2026", value: 113541 },
  ],
  quarterly: [
    { period: "Q1 2026", value: 105800 },
    { period: "Q2 2026", value: 113541 },
  ],
  yearly: [
    { period: "2025", value: 88000  },
    { period: "2026", value: 113541 },
  ],
};

export const getInvestmentFundById = async (id) => {
  if (USE_MOCK) {
    await mockDelay();

    const liquidity = 15000;
    const totalPositionValue = MOCK_POSITIONS.reduce(
      (sum, p) => sum + p.price * p.quantity, 0
    );
    const fundValue = totalPositionValue + liquidity;
    const totalInvested = MOCK_POSITIONS.reduce(
      (sum, p) => sum + p.initialMarginCost * p.quantity, 0
    );

    const result = {
      id,
      name: "Alpha Growth Fund",
      strategyDescription:
        "Strategija fokusirana na rast vrednosti akcija u tehnološkom i industrijskom sektoru kroz dugoročna ulaganja u globalne kompanije s visokim potencijalom rasta.",
      managerEmail: "supervisor@banka.raf",
      fundValue,
      minimumInvestment: 5000,
      accountNumber: `IF-2026-${String(id).padStart(6, "0")}`,
      liquidity,
      totalInvested,
      positions: MOCK_POSITIONS,
      performance: MOCK_PERFORMANCE,
    };

    console.log("[MOCK] getInvestmentFundById response:", result);
    return result;
  }

  // Real endpoint — ukloniti komentar kad backend bude spreman:
  // const response = await api.get(`/investment-funds/${id}`);
  // return response.data;
};

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
