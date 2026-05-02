// za sad mock podaci

const mockSecurities = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    type: "stock",
    price: 150.25,
    ask: 150.50,
    bid: 150.00,
    change: 2.50,
    volume: 50000000,
    exchange: "NASDAQ",
    maintenanceMargin: 75.13,
    lastRefresh: new Date().toISOString(),
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    type: "stock",
    price: 320.15,
    ask: 320.50,
    bid: 319.80,
    change: -1.85,
    volume: 25000000,
    exchange: "NASDAQ",
    maintenanceMargin: 160.08,
    lastRefresh: new Date().toISOString(),
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    type: "stock",
    price: 2800.00,
    ask: 2801.00,
    bid: 2799.00,
    change: 5.25,
    volume: 1200000,
    exchange: "NASDAQ",
    maintenanceMargin: 1400.00,
    lastRefresh: new Date().toISOString(),
  },
  {
    ticker: "CLJ24",
    name: "Crude Oil Futures",
    type: "futures",
    price: 85.50,
    ask: 85.75,
    bid: 85.25,
    change: 0.50,
    volume: 500000,
    exchange: "NYMEX",
    settlementDate: "2024-12-20",
    maintenanceMargin: 855.00,
    lastRefresh: new Date().toISOString(),
  },
  {
    ticker: "EUR/USD",
    name: "Euro/US Dollar",
    type: "forex",
    price: 1.1123,
    ask: 1.1125,
    bid: 1.1121,
    change: 0.0025,
    volume: 5000000,
    exchange: "FOREX",
    liquidity: "High",
    maintenanceMargin: 111.23,
    lastRefresh: new Date().toISOString(),
  },
  {
    ticker: "GBP/USD",
    name: "British Pound/US Dollar",
    type: "forex",
    price: 1.2650,
    ask: 1.2652,
    bid: 1.2648,
    change: -0.0010,
    volume: 3500000,
    exchange: "FOREX",
    liquidity: "High",
    maintenanceMargin: 126.50,
    lastRefresh: new Date().toISOString(),
  },
];

function simulatePriceChange(security) {
  const changePercent = (Math.random() - 0.5) * 2; // -1% do +1%
  const priceChange = security.price * (changePercent / 100);

  return {
    ...security,
    price: parseFloat((security.price + priceChange).toFixed(2)),
    ask: parseFloat((security.ask + priceChange).toFixed(2)),
    bid: parseFloat((security.bid + priceChange).toFixed(2)),
    change: parseFloat(priceChange.toFixed(2)),
    lastRefresh: new Date().toISOString(),
  };
}

export async function refreshAllSecurities() {
  try {
    console.log("📤 Mock: Osvežavanje sve hartije od vrednosti...");
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // simuliranje promene cena
    const refreshedSecurities = mockSecurities.map(security => 
      simulatePriceChange(security)
    );
    console.log("✅ Mock: Hartije osvežene:", refreshedSecurities);

    return {
      data: refreshedSecurities,
      lastRefresh: new Date().toISOString(),
      timestamp: new Date().toLocaleString("sr-RS"),
    };
  } catch (error) {
    console.error("❌ Mock: Greška pri osvežavanju:", error);
    throw error;
  }
}

export async function refreshSecurity(ticker) {
  try {
    console.log(`📤 Mock: Osvežavanje ${ticker}...`);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    const security = mockSecurities.find(s => s.ticker === ticker);
    
    if (!security) {
      throw new Error(`Hartija ${ticker} nije pronađena`);
    }

    const refreshedSecurity = simulatePriceChange(security);
    console.log(`✅ Mock: ${ticker} osvežena:`, refreshedSecurity);

    return {
      data: refreshedSecurity,
      lastRefresh: new Date().toISOString(),
      timestamp: new Date().toLocaleString("sr-RS"),
    };
  } catch (error) {
    console.error(`❌ Mock: Greška pri osvežavanju ${ticker}:`, error);
    throw error;
  }
}

export async function getSecurities(type = null) {
  try {
    console.log(`📤 Mock: Dohvatanje hartije...${type ? ` (tip: ${type})` : ""}`);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const securities = type 
      ? mockSecurities.filter(s => s.type === type)
      : mockSecurities;

    console.log("✅ Mock: Hartije dohvaćene:", securities);

    return {
      data: securities,
      lastRefresh: new Date().toISOString(),
      timestamp: new Date().toLocaleString("sr-RS"),
    };
  } catch (error) {
    console.error("❌ Mock: Greška pri dohvatanju:", error);
    throw error;
  }
}

export function calculateInitialMarginCost(maintenanceMargin) {
  return parseFloat((maintenanceMargin * 1.1).toFixed(2));
}