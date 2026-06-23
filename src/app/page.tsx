"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fmt, META, RATE, SPEND, initialBalances, type Sym } from "@/lib/data";
import { LineChart } from "@/lib/charts";

type Ccy = "AED" | "USD" | "USDT";

export default function Home() {
  const bal = initialBalances;
  const [ccy, setCcy] = useState<Ccy>("AED");
  const totalAED = (Object.keys(bal) as Sym[]).reduce((s, t) => s + bal[t] * META[t].aed, 0);
  const shown = ccy === "AED" ? totalAED : totalAED / RATE;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 80px" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Welcome back,</p>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginTop: 2, marginBottom: 22 }}>Aisha Rahman</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-dim)", fontSize: 14, fontWeight: 500 }}>Total balance</span>
              <div style={{ display: "flex", gap: 4, background: "#000", border: "1px solid var(--border)", borderRadius: 99, padding: 3 }}>
                {(["AED", "USD", "USDT"] as Ccy[]).map((c) => (
                  <button key={c} onClick={() => setCcy(c)} style={{ padding: "5px 13px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: ccy === c ? "var(--lime)" : "transparent", color: ccy === c ? "var(--on-lime)" : "var(--text-mute)" }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 16 }}>
              {ccy !== "USD" && <span style={{ fontSize: 20, color: "var(--text-dim)", fontWeight: 600, marginBottom: 8 }}>{ccy}</span>}
              <span className="mono" style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>{ccy === "USD" ? "$" : ""}{fmt(shown)}</span>
            </div>
            <p style={{ color: "var(--text-mute)", fontSize: 13, marginTop: 8 }}>≈ AED {fmt(totalAED)} · ${fmt(totalAED / RATE)} · {fmt(totalAED / RATE)} USDT</p>
            <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
              <Link href="/swap" className="btn-ghost" style={{ flex: 1, height: 48, fontWeight: 600, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center" }}>⇄ Swap</Link>
              <button onClick={() => toast("Open the mobile app to scan a merchant QR")} className="btn-lime" style={{ flex: 1.3, height: 48, fontSize: 14.5 }}>Scan &amp; Pay</button>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Portfolio</h3>
            {(Object.keys(META) as Sym[]).map((t, i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < 2 ? "1px solid var(--hairline)" : "none" }}>
                <span style={{ width: 40, height: 40, borderRadius: 99, background: META[t].color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: t === "AED" ? "#0a0a0a" : "#fff" }}>{t[0]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t}</div>
                  <div style={{ fontSize: 12, color: "var(--text-mute)" }}>{META[t].name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{fmt(bal[t], t === "SFL" ? 0 : 2)}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>AED {fmt(bal[t] * META[t].aed)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Spending</h3>
                <p style={{ fontSize: 12, color: "var(--text-dim)" }}>Last 7 days · AED</p>
              </div>
              <Link href="/analytics" style={{ fontSize: 12, fontWeight: 600, color: "var(--lime)", background: "var(--lime-wash)", padding: "6px 11px", borderRadius: 99 }}>▲ Analytics</Link>
            </div>
            <LineChart data={SPEND} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-dim)", fontSize: 13, fontWeight: 500 }}>Loyalty</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--emerald)", background: "var(--emerald-wash)", padding: "4px 10px", borderRadius: 99 }}>Gold</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 14 }}>
              <span className="mono" style={{ fontSize: 36, fontWeight: 700 }}>{fmt(bal.SFL, 0)}</span>
              <span style={{ color: "var(--emerald)", fontWeight: 600, marginBottom: 6 }}>SFL</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: "#000", border: "1px solid var(--border)", overflow: "hidden", marginTop: 14 }}>
              <div style={{ height: "100%", width: `${Math.min(100, (bal.SFL / 2000) * 100)}%`, background: "var(--emerald)" }} />
            </div>
            <p style={{ fontSize: 11.5, color: "var(--text-mute)", marginTop: 8 }}>{fmt(Math.max(0, 2000 - bal.SFL), 0)} SFL to Platinum · ≈ AED {fmt(bal.SFL * 0.2)}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => toast.success("Redeemed SFL for an AED discount")} className="btn-lime" style={{ flex: 1, height: 44, fontSize: 14 }}>Redeem</button>
              <button onClick={() => toast.success("Gift sent")} className="btn-ghost" style={{ flex: 1, height: 44, fontWeight: 600, fontSize: 14 }}>Gift</button>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <span style={{ color: "var(--text-dim)", fontSize: 13 }}>VAT reclaimable</span>
            <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 8 }}>AED 241.00</div>
            <p style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 6 }}>Tracked on-chain across your purchases · auto-refunded at checkout.</p>
          </div>

          <div className="card hoverable" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Quick actions</h3>
            {([["Swap tokens", "USDT · ETH → AED", "/swap"], ["See analytics", "Spending breakdown", "/analytics"], ["Transaction history", "View all activity", "/transactions"]] as const).map(([t, s, href]) => (
              <Link key={t} href={href} style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--hairline)" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--lime-wash)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lime)" }}>→</span>
                <span style={{ flex: 1 }}><span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{t}</span><span style={{ fontSize: 12, color: "var(--text-mute)" }}>{s}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
