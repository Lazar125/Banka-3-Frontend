import { useEffect, useState } from "react";
import { getSecurityDetail, getSecurityHistory, getSecurityOptions } from "../services/SecurityDetailService";

export function useSecurityDetails(ticker) {
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [options, setOptions] = useState([]);
  const [period, setPeriod] = useState("1M");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDetail();
  }, [ticker]);

  useEffect(() => {
    loadHistory();
  }, [ticker, period]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getSecurityDetail(ticker);
      setDetail(data);
      
      if (data.type === "stock" || ticker.match(/^[A-Z]{1,5}$/)) {
        const optionsData = await getSecurityOptions(ticker);
        setOptions(optionsData);
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getSecurityHistory(ticker, period);
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    detail,
    history,
    options,
    period,
    setPeriod,
    loading,
    error,
  };
}