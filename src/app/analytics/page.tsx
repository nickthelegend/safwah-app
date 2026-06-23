"use client";

import { fmt, SPEND, CATEGORIES, TXNS } from "@/lib/data";
import { LineChart, BarChart, Doughnut } from "@/lib/charts";

export default function AnalyticsPage() {
  const total = TXNS.reduce((s, t) => s + t.aed, 0);
  const vat = TXNS.reduce((s, t) => s + t.vat, 0);
  const avg = total / TXNS.length;
  const bars = SPEND.map((p, i) => ({ label: p.x, value: p.y, color: i === SPEND.length - 1 ? "#CCFF00" : "#10b981" }));

  const tiles = [
    ["Total spent", `AED ${fmt(total, 0)}`],
    ["VAT reclaimable", `AED ${fmt(vat, 0)}`],
    ["Transactions", `${TXNS.length}`],
    ["Avg spend", `AED ${fmt(avg, 0)}`],
  ];

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 18 }}>Analytics</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {tiles.map(([l, v]) => (
          <div key={l} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{l}</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Spending trend</h3>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>AED · last 7 days</p>
          <LineChart data={SPEND} />
        </div>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Daily spend</h3>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>Per weekday</p>
          <BarChart data={bars} />
        </div>
        <div className="card" style={{ padding: 22, gridColumn: "1 / -1" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Where it went</h3>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>Spending by category</p>
          <Doughnut data={CATEGORIES} centerValue={`AED ${fmt(total, 0)}`} centerLabel="spent" />
        </div>
      </div>
    </main>
  );
}
