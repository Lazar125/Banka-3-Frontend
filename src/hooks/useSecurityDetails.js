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
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getSecurityDetail(ticker);
        if (cancelled) return;
        setDetail(data);

        if (data.type === "stock" && data.stockId) {
          const optionsData = await getSecurityOptions(data.stockId);
          if (!cancelled) setOptions(optionsData);
        } else {
          if (!cancelled) setOptions([]);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  useEffect(() => {
    if (!detail?.id) return;
    let cancelled = false;
    getSecurityHistory(detail.id, period)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((err) => {
        console.error(err);
      });
    return () => {
      cancelled = true;
    };
  }, [detail?.id, period]);

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
