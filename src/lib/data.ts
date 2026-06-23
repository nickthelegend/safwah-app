export const RATE = 3.6725; // AED per USD
export const fmt = (n: number, dp = 2) => n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

export type Sym = "AED" | "USDT" | "SFL";
export const META: Record<Sym, { name: string; color: string; aed: number }> = {
  AED: { name: "UAE Dirham", color: "#CCFF00", aed: 1 },
  USDT: { name: "Tether USD", color: "#26a17b", aed: RATE },
  SFL: { name: "Safwah Loyalty", color: "#10b981", aed: 0.2 },
};

export const SPEND = [
  { x: "Wed", y: 180 }, { x: "Thu", y: 420 }, { x: "Fri", y: 3400 }, { x: "Sat", y: 560 },
  { x: "Sun", y: 250 }, { x: "Mon", y: 1730 }, { x: "Tue", y: 90 },
];

export const CATEGORIES = [
  { label: "Retail", value: 3400, color: "#fb7185" },
  { label: "Electronics", value: 1250, color: "#38bdf8" },
  { label: "Dining", value: 480, color: "#f59e0b" },
  { label: "Groceries", value: 212, color: "#10b981" },
  { label: "Transport", value: 38, color: "#a78bfa" },
];

export const TXNS = [
  { merchant: "Gold Souk Jewellery", cat: "Retail", aed: 3400, vat: 170, ago: "4d ago" },
  { merchant: "Dubai Mall — Apple", cat: "Electronics", aed: 1250, vat: 62.5, ago: "13h ago" },
  { merchant: "Salt Bae Steakhouse", cat: "Dining", aed: 480, vat: 24, ago: "14h ago" },
  { merchant: "Emirates Spinneys", cat: "Groceries", aed: 212.4, vat: 10.62, ago: "2d ago" },
  { merchant: "Careem Ride", cat: "Transport", aed: 38, vat: 1.9, ago: "2d ago" },
];

export const initialBalances: Record<Sym, number> = { AED: 900, USDT: 1000, SFL: 1284 };
