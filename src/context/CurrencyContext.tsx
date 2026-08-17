import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Currency, DEFAULT_CURRENCY } from '../constants/currencies';

const CURRENCY_KEY = '@selected_currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => Promise<void>;
  /** Quick access to just the symbol, e.g. "$" */
  sym: string;
  /** Format an amount with the currency symbol, e.g. "$12.50" */
  fmt: (amount: number, decimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_CURRENCY,
  setCurrency: async () => {},
  sym: DEFAULT_CURRENCY.symbol,
  fmt: (amount, decimals = 2) => `${DEFAULT_CURRENCY.symbol}${amount.toFixed(decimals)}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

  // Load persisted currency on mount
  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_KEY)
      .then((raw) => {
        if (raw) setCurrencyState(JSON.parse(raw) as Currency);
      })
      .catch(() => {});
  }, []);

  const setCurrency = useCallback(async (c: Currency) => {
    setCurrencyState(c);
    await AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(c));
  }, []);

  const sym = currency.symbol;
  const fmt = useCallback(
    (amount: number, decimals = 2) => `${currency.symbol}${amount.toFixed(decimals)}`,
    [currency],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, sym, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
