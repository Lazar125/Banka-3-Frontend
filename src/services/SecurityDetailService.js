// za sad mock podaci
const mockHistoryData = {
  AAPL: [
    { date: "2024-03-17", price: 148.50, high: 149.00, low: 148.00, volume: 50000000 },
    { date: "2024-03-18", price: 149.00, high: 150.00, low: 148.50, volume: 52000000 },
    { date: "2024-03-19", price: 150.25, high: 151.00, low: 149.50, volume: 48000000 },
    { date: "2024-03-20", price: 150.15, high: 151.50, low: 150.00, volume: 55000000 },
    { date: "2024-03-21", price: 150.50, high: 151.00, low: 149.80, volume: 51000000 },
    { date: "2024-03-22", price: 149.80, high: 150.50, low: 149.00, volume: 49000000 },
  ],
  MSFT: [
    { date: "2024-03-17", price: 318.00, high: 319.00, low: 317.50, volume: 25000000 },
    { date: "2024-03-18", price: 319.50, high: 320.00, low: 318.50, volume: 26000000 },
    { date: "2024-03-19", price: 320.15, high: 321.00, low: 319.00, volume: 24000000 },
    { date: "2024-03-20", price: 319.80, high: 320.50, low: 319.00, volume: 27000000 },
    { date: "2024-03-21", price: 320.50, high: 321.00, low: 319.50, volume: 25000000 },
    { date: "2024-03-22", price: 319.90, high: 320.50, low: 319.00, volume: 26000000 },
  ],
};

const mockOptions = {
  AAPL: [
    {
      settlementDate: "2024-04-20",
      daysToExpiry: 28,
      options: [
        { strike: 140, callLast: 10.50, callTheta: -0.05, callBid: 10.25, callAsk: 10.75, callVol: 150, callOI: 5000, putLast: 0.01, putTheta: -0.01, putBid: 0.01, putAsk: 0.05, putVol: 100, putOI: 500 },
        { strike: 145, callLast: 8.75, callTheta: -0.04, callBid: 8.50, callAsk: 9.00, callVol: 200, callOI: 6000, putLast: 0.05, putTheta: -0.02, putBid: 0.03, putAsk: 0.08, putVol: 120, putOI: 600 },
        { strike: 150, callLast: 6.25, callTheta: -0.03, callBid: 6.00, callAsk: 6.50, callVol: 300, callOI: 8000, putLast: 0.25, putTheta: -0.03, putBid: 0.20, putAsk: 0.30, putVol: 150, putOI: 800 },
        { strike: 155, callLast: 4.00, callTheta: -0.02, callBid: 3.75, callAsk: 4.25, callVol: 250, callOI: 7000, putLast: 1.50, putTheta: -0.04, putBid: 1.40, putAsk: 1.60, putVol: 180, putOI: 1000 },
        { strike: 160, callLast: 2.10, callTheta: -0.01, callBid: 1.90, callAsk: 2.30, callVol: 180, callOI: 5000, putLast: 4.00, putTheta: -0.05, putBid: 3.85, putAsk: 4.15, putVol: 200, putOI: 1200 },
      ]
    },
    {
      settlementDate: "2024-05-18",
      daysToExpiry: 56,
      options: [
        { strike: 145, callLast: 9.50, callTheta: -0.03, callBid: 9.25, callAsk: 9.75, callVol: 100, callOI: 3000, putLast: 0.10, putTheta: -0.01, putBid: 0.08, putAsk: 0.12, putVol: 80, putOI: 400 },
        { strike: 150, callLast: 7.25, callTheta: -0.02, callBid: 7.00, callAsk: 7.50, callVol: 150, callOI: 4000, putLast: 0.50, putTheta: -0.02, putBid: 0.45, putAsk: 0.55, putVol: 100, putOI: 600 },
        { strike: 155, callLast: 5.10, callTheta: -0.02, callBid: 4.85, callAsk: 5.35, callVol: 120, callOI: 3500, putLast: 1.80, putTheta: -0.03, putBid: 1.70, putAsk: 1.90, putVol: 110, putOI: 700 },
      ]
    },
  ],
};

export async function getSecurityDetail(ticker) {
  try {
    console.log(`Mock: Dohvatanje detalja za ${ticker}...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      ticker,
      name: `${ticker} Company`,
      price: 150.25,
      ask: 150.50,
      bid: 150.00,
      change: 2.50,
      volume: 50000000,
      exchange: "NASDAQ",
    };
  } catch (error) {
    console.error(`❌ Mock: Greška pri dohvatanju ${ticker}:`, error);
    throw error;
  }
}

export async function getSecurityHistory(ticker, period = "1M") {
  try {
    console.log(`Mock: Dohvatanje istorije za ${ticker} (${period})...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const history = mockHistoryData[ticker] || [];
    console.log(`Mock: Istorija za ${ticker}:`, history);
    
    return history;
  } catch (error) {
    console.error(`❌ Mock: Greška pri dohvatanju istorije:`, error);
    throw error;
  }
}

export async function getSecurityOptions(ticker) {
  try {
    console.log(`Mock: Dohvatanje opcija za ${ticker}...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const options = mockOptions[ticker] || [];
    console.log(`Mock: Opcije za ${ticker}:`, options);
    
    return options;
  } catch (error) {
    console.error(`❌ Mock: Greška pri dohvatanju opcija:`, error);
    throw error;
  }
}