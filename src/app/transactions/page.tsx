"use client";

import { fmt, TXNS, CATEGORIES } from "@/lib/data";

const catColor = (c: string) => CATEGORIES.find((x) => x.label === c)?.color || "#CCFF00";

export default function TransactionsPage() {
  const total = TXNS.reduce((s, t) => s + t.aed, 0);
  const vat = TXNS.reduce((s, t) => s + t.vat, 0);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>Activity</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 20 }}>Every purchase, recorded on Polygon Amoy.</p>

      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Total spent</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>AED {fmt(total)}</div>
          </div>
          <div style={{ width: 1, background: "var(--hairline)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>VAT reclaimable</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: "var(--emerald)" }}>AED {fmt(vat)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "6px 22px" }}>
        {TXNS.map((t, i) => (
          <div key={t.merchant} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: i < TXNS.length - 1 ? "1px solid var(--hairline)" : "none" }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--card-soft)", border: `1px solid ${catColor(t.cat)}`, display: "flex", alignItems: "center", justifyContent: "center", color: catColor(t.cat), fontWeight: 700 }}>{t.cat[0]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{t.merchant}</div>
              <div style={{ fontSize: 12, color: "var(--text-mute)" }}>{t.cat} · {t.ago}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontWeight: 700, fontSize: 14.5 }}>− AED {fmt(t.aed)}</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--lime)", marginTop: 3 }}>+AED {fmt(t.vat)} VAT</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
