import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';

const BASE_RATES: Record<string, { rate: number; flag: string; name: string }> = {
  AED: { rate: 3.673, flag: '🇦🇪', name: 'UAE Dirham' },
  INR: { rate: 83.12, flag: '🇮🇳', name: 'Indian Rupee' },
  EUR: { rate: 0.923, flag: '🇪🇺', name: 'Euro' },
  GBP: { rate: 0.793, flag: '🇬🇧', name: 'British Pound' },
  PHP: { rate: 56.41, flag: '🇵🇭', name: 'Philippine Peso' },
  CNY: { rate: 7.24, flag: '🇨🇳', name: 'Chinese Yuan' },
  RUB: { rate: 90.12, flag: '🇷🇺', name: 'Russian Ruble' },
  PKR: { rate: 278.5, flag: '🇵🇰', name: 'Pakistani Rupee' },
  BDT: { rate: 110.2, flag: '🇧🇩', name: 'Bangladeshi Taka' },
  NGN: { rate: 1510, flag: '🇳🇬', name: 'Nigerian Naira' },
};

const SAFWAH_FEE = 0.05;
const NETWORK_FEE_USD = 0.50;

interface FxCalculatorProps {
  usdcBalance: number; // base units
}

export function FxCalculator({ usdcBalance }: FxCalculatorProps) {
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('AED');
  const [rates, setRates] = useState(BASE_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch real-time exchange rates on mount
  useEffect(() => {
    setLastUpdated(new Date());
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
              if (typeof data.rates[key] === 'number') {
                updated[key] = { ...updated[key], rate: data.rates[key] };
              }
            });
            return updated;
          });
          setLastUpdated(new Date());
          console.log("FxCalculator initialized real-time rates from Open Exchange API");
        }
      })
      .catch(err => console.warn("Failed to fetch rates, falling back to static pegs", err));
  }, []);

  // Simulate live rate updates with small variance
  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const variance = (Math.random() - 0.5) * 0.002;  // ±0.1% variance
          updated[key] = { ...updated[key], rate: updated[key].rate * (1 + variance) };
        });
        return updated;
      });
      setLastUpdated(new Date());
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const amountUsdc = parseFloat(amount) || 0;
  const safwahFee = amountUsdc * SAFWAH_FEE;
  const netUsdc = Math.max(0, amountUsdc - safwahFee - NETWORK_FEE_USD);
  const currency = rates[selectedCurrency];
  const localAmount = netUsdc * currency.rate;

  const availableUsdc = usdcBalance / 1_000_000;

  return (
    <div style={{
      backgroundColor: "var(--color-white)",
      border: "var(--border-style)",
      borderRadius: "var(--radius-bento)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      boxShadow: "var(--shadow-spread)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{
          color: "var(--color-warm-sand)",
          fontSize: "14px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          margin: 0
        }}>
          <TrendingUp size={16} style={{ color: "var(--color-cyber-gold)" }} />
          FX Calculator & Remittance
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-muted-gray)", fontSize: "11px" }}>
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
          Live · {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
        </div>
      </div>

      {/* Input */}
      <div style={{
        backgroundColor: "rgba(25, 25, 25, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "var(--radius-bento)",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px"
      }}>
        <span style={{ color: "var(--color-sage)", fontSize: "11px", fontWeight: "bold" }}>SEND AMOUNT (USDC)</span>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          max={availableUsdc}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "#fff",
            fontSize: "24px",
            fontWeight: "bold",
            width: "100%"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted-gray)", fontSize: "11px", marginTop: "4px" }}>
          <span>Avail. Balance: USDC {availableUsdc.toFixed(2)}</span>
          {availableUsdc > 0 && (
            <button 
              onClick={() => setAmount(availableUsdc.toFixed(2))} 
              style={{ background: "none", border: "none", color: "var(--color-cyber-gold)", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}
            >
              Use Max
            </button>
          )}
        </div>
      </div>

      {/* Currency Flags Selector */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "8px"
      }}>
        {Object.entries(rates).map(([code, info]) => (
          <button
            key={code}
            onClick={() => setSelectedCurrency(code)}
            style={{
              padding: "8px 0",
              borderRadius: "10px",
              border: selectedCurrency === code ? "1px solid var(--color-cyber-gold)" : "1px solid rgba(255,255,255,0.06)",
              backgroundColor: selectedCurrency === code ? "rgba(253,224,71,0.1)" : "rgba(25,25,25,0.4)",
              color: selectedCurrency === code ? "var(--color-cyber-gold)" : "#fff",
              cursor: "pointer",
              fontSize: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: "16px" }}>{info.flag}</span>
            <span style={{ fontSize: "9px", fontWeight: "bold" }}>{code}</span>
          </button>
        ))}
      </div>

      {/* Conversion Breakdown */}
      {amountUsdc > 0 && (
        <div style={{
          backgroundColor: "rgba(25, 25, 25, 0.4)",
          borderRadius: "var(--radius-bento)",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          fontSize: "12px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-muted-gray)" }}>You send</span>
            <span style={{ color: "#fff", fontWeight: "bold" }}>USDC {amountUsdc.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-muted-gray)" }}>Sui Protocol fee (5%)</span>
            <span style={{ color: "#ef4444" }}>− USDC {safwahFee.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-muted-gray)" }}>Off-ramp fee</span>
            <span style={{ color: "#ef4444" }}>− USDC {NETWORK_FEE_USD.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
            <span style={{ color: "var(--color-muted-gray)" }}>Exchange rate</span>
            <span style={{ color: "var(--color-sage)" }}>1 USDC = {currency.rate.toFixed(4)} {selectedCurrency}</span>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(253, 224, 71, 0.08)",
            border: "1px solid rgba(253, 224, 71, 0.15)",
            padding: "8px 12px",
            borderRadius: "10px",
            marginTop: "4px"
          }}>
            <span style={{ color: "var(--color-warm-sand)", fontWeight: "bold" }}>Recipient gets</span>
            <span style={{ color: "var(--color-cyber-gold)", fontWeight: 800, fontSize: "15px" }}>
              {currency.flag} {localAmount.toFixed(2)} {selectedCurrency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
