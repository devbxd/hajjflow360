'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type CurrencyCode = 'SAR' | 'USD' | 'EUR' | 'GBP';

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'SAR', label: 'SAR — Saudi Riyal', symbol: 'SAR' },
  { code: 'USD', label: 'USD — US Dollar', symbol: '$' },
  { code: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP — British Pound', symbol: '£' },
];

// Fixed reference rates (1 SAR = X). Every amount is stored and collected in
// SAR — this only converts what's shown on screen, never what's saved.
const RATES: Record<CurrencyCode, number> = {
  SAR: 1,
  USD: 0.2666,
  EUR: 0.2466,
  GBP: 0.2094,
};

const STORAGE_KEY = 'manasikpro_display_currency';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (amountInSar: number, options?: { decimals?: number }) => string;
  convert: (amountInSar: number) => number;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('SAR');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in RATES) setCurrencyState(stored as CurrencyCode);
    } catch {
      // localStorage unavailable — stay on the SAR default.
    }
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // Per-viewer convenience only; failing to persist isn't fatal.
    }
  };

  const symbol = CURRENCIES.find((c) => c.code === currency)!.symbol;
  const convert = (amountInSar: number) => amountInSar * RATES[currency];

  const format = (amountInSar: number, options?: { decimals?: number }) => {
    const decimals = options?.decimals ?? 0;
    const numberText = convert(amountInSar).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return currency === 'SAR' ? `SAR ${numberText}` : `${symbol}${numberText}`;
  };

  return <CurrencyContext.Provider value={{ currency, setCurrency, format, convert, symbol }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
