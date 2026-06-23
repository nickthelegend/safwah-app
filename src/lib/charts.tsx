"use client";

type Pt = { x: string; y: number };
type Bar = { label: string; value: number; color?: string };
type Slice = { label: string; value: number; color: string };

export function LineChart({ data, color = "#CCFF00", height = 200 }: { data: Pt[]; color?: string; height?: number }) {
  const w = 560, h = height, pad = 16;
  const max = Math.max(...data.map((d) => d.y), 1);
  const px = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const py = (v: number) => h - 28 - (v / max) * (h - 50);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(d.y)}`).join(" ");
  const area = `${line} L ${px(data.length - 1)} ${h - 28} L ${px(0)} ${h - 28} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.22} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((g) => <line key={g} x1={pad} x2={w - pad} y1={28 + g * (h - 56)} y2={28 + g * (h - 56)} stroke="rgba(255,255,255,0.05)" />)}
      <path d={area} fill="url(#lg)" />
      <path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={i} cx={px(i)} cy={py(d.y)} r={i === data.length - 1 ? 4.5 : 2.5} fill={i === data.length - 1 ? color : "#0d0d0f"} stroke={color} strokeWidth={1.5} />)}
      {data.map((d, i) => <text key={i} x={px(i)} y={h - 8} fill="#5d5d63" fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)">{d.x}</text>)}
    </svg>
  );
}

export function BarChart({ data, height = 200 }: { data: Bar[]; height?: number }) {
  const w = 560, h = height, pad = 12;
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = (w - pad * 2) / data.length - 12;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      {data.map((d, i) => {
        const bh = (d.value / max) * (h - 50);
        const x = pad + i * ((w - pad * 2) / data.length) + 6;
        return (
          <g key={i}>
            <text x={x + bw / 2} y={h - 30 - bh - 6} fill="#9a9aa0" fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)">{d.value}</text>
            <rect x={x} y={h - 28 - bh} width={bw} height={bh} rx={7} fill={d.color || "#10b981"} opacity={0.92} />
            <text x={x + bw / 2} y={h - 10} fill="#5d5d63" fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Doughnut({ data, centerValue, centerLabel }: { data: Slice[]; centerValue?: string; centerLabel?: string }) {
  const size = 230, cx = size / 2, cy = size / 2, r = size * 0.38, stroke = r * 0.76, C = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={r} stroke="#101013" strokeWidth={stroke} fill="none" />
            {data.map((d, i) => {
              const frac = d.value / total, dash = frac * C, off = -acc * C;
              acc += frac;
              return <circle key={i} cx={cx} cy={cy} r={r} stroke={d.color} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={off} />;
            })}
          </g>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {centerValue && <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{centerValue}</span>}
          {centerLabel && <span style={{ fontSize: 11, color: "#5d5d63" }}>{centerLabel}</span>}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: d.color }} />
            <span style={{ flex: 1, fontSize: 13, color: "#9a9aa0" }}>{d.label}</span>
            <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
