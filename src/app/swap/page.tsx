"use client";

import { useState } from "react";
import { toast } from "sonner";
import { fmt, META, initialBalances, type Sym } from "@/lib/data";

export default function SwapPage() {
  const [bal, setBal] = useState<Record<Sym, number>>({ ...initialBalances });
  const [from, setFrom] = useState<Sym>("USDT");
  const [to, setTo] = useState<Sym>("AED");
  const [amt, setAmt] = useState("");

  const a = parseFloat(amt) || 0;
  const receive = META[to].aed > 0 ? (a * META[from].aed) / META[to].aed : 0;
  const canSwap = a > 0 && a <= bal[from] && from !== to;

  const doSwap = () => {
    if (!canSwap) return;
    setBal((b) => ({ ...b, [from]: +(b[from] - a).toFixed(4), [to]: +(b[to] + receive).toFixed(4) }));
    toast.success(`Swapped ${fmt(a, from === "SFL" ? 0 : 2)} ${from} → ${fmt(receive, to === "SFL" ? 0 : 2)} ${to}`);
    setAmt("");
  };

  const sel = { background: "var(--card-soft)", color: "var(--text)", border: "1px solid var(--border-strong)", borderRadius: 99, padding: "8px 12px", fontWeight: 700 } as const;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>Swap</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 22 }}>Convert between USDT, ETH and AED — 0% fee.</p>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}><span>You pay</span><span className="mono">Balance {fmt(bal[from], from === "SFL" ? 0 : 2)}</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" inputMode="decimal" autoFocus className="mono" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 30, fontWeight: 700 }} />
          <select value={from} onChange={(e) => setFrom(e.target.value as Sym)} className="mono" style={sel}>{(Object.keys(META) as Sym[]).map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </div>
      </div>
      <div style={{ textAlign: "center", color: "var(--lime)", margin: "10px 0", fontSize: 18 }}>↓</div>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}><span>You receive</span><span className="mono">Balance {fmt(bal[to], to === "SFL" ? 0 : 2)}</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ flex: 1, fontSize: 30, fontWeight: 700 }}>{fmt(receive, to === "SFL" ? 0 : 2)}</span>
          <select value={to} onChange={(e) => setTo(e.target.value as Sym)} className="mono" style={sel}>{(Object.keys(META) as Sym[]).map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-mute)", marginTop: 14, padding: "0 4px" }}>
        <span>1 {from} ≈ {fmt(META[from].aed / META[to].aed, 4)} {to}</span><span>Fee 0%</span>
      </div>
      <button onClick={doSwap} disabled={!canSwap} style={{ width: "100%", height: 54, marginTop: 16, fontSize: 16, fontWeight: 700, background: canSwap ? "var(--lime)" : "var(--card)", color: canSwap ? "var(--on-lime)" : "var(--text-mute)", borderRadius: 14, border: canSwap ? "none" : "1px solid var(--border)" }}>
        {from === to ? "Pick two tokens" : a > bal[from] ? `Not enough ${from}` : "Swap"}
      </button>
    </main>
  );
}
