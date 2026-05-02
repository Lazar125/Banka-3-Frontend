import { useEffect, useState, useRef } from "react";
import { refreshAllSecurities, refreshSecurity } from "../services/SecurityService";

export function useSecurityRefresh(intervalMinutes = 15) {
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // automatski svakih x minuta
  useEffect(() => {
    const performRefresh = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await refreshAllSecurities();
        setLastRefresh(result.timestamp);
        
        console.log(`⏰ Sledeće osvežavanje za ${intervalMinutes} minuta`);
      } catch (err) {
        setError(err.message);
        console.error("❌ Automatski refresh greška:", err);
      } finally {
        setLoading(false);
      }
    };

    performRefresh();

    intervalRef.current = setInterval(() => {
      performRefresh();
    }, intervalMinutes * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMinutes]);

  // ručni refresh kad korisnik klikne dugme
  const manualRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await refreshAllSecurities();
      setLastRefresh(result.timestamp);
      
      console.log("🔄 Ručni refresh završen:", result.timestamp);
    } catch (err) {
      setError(err.message);
      console.error("❌ Ručni refresh greška:", err);
    } finally {
      setLoading(false);
    }
  };

   // posle neke akcije (kupovina, prodaja i odobravanje)
  const refreshAfterAction = async (ticker = null) => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (ticker) {
        result = await refreshSecurity(ticker);
        console.log(`📍 Osvežavanje samo ${ticker} nakon akcije`);
      } else {
        result = await refreshAllSecurities();
        console.log("📍 Osvežavanje sve hartije nakon akcije");
      }

      setLastRefresh(result.timestamp);
    } catch (err) {
      setError(err.message);
      console.error("❌ Osvežavanje nakon akcije greška:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    lastRefresh,
    error,
    manualRefresh,
    refreshAfterAction,
  };
}