import { useEffect, useState } from 'react';

interface SolConversionProps {
  arsTotal: number;
  children: (total: number, loading: boolean, error: string | null, usdToArs: number | null) => React.ReactNode;
}

export function SolConversion({ arsTotal, children }: SolConversionProps) {
  const [total, setSolTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usdToArs, setUsdToArs] = useState<number | null>(null);

  useEffect(() => {
    if (arsTotal > 0) {
      setLoading(true);
      setError(null);
      fetch('/api/coingecko/price')
        .then(res => res.json())
        .then(data => {
          const arsPerSol = data['solana']?.ars;
          const usdToArsRate = data['usd-coin']?.ars;
          if (!arsPerSol || arsPerSol === 0) throw new Error('Invalid ARS/SOL rate');
          setUsdToArs(usdToArsRate || null);
          const sol = parseFloat((arsTotal / arsPerSol).toFixed(6));
          setSolTotal(sol);
          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to fetch ARS/SOL rate' + (err instanceof Error ? `: ${err.message}` : ''));
          setLoading(false);
          setUsdToArs(null);
        });
    } else {
      setSolTotal(0);
      setUsdToArs(null);
    }
  }, [arsTotal]);

  return <>{children(total, loading, error, usdToArs)}</>;
}
