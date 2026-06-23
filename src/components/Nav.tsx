"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/swap", label: "Swap" },
  { href: "/analytics", label: "Analytics" },
  { href: "/transactions", label: "Activity" },
];

export function Nav() {
  const path = usePathname();
  const [addr, setAddr] = useState<string | null>(null);
  const connect = async () => {
    const eth = typeof window !== "undefined" ? (window as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } }).ethereum : null;
    if (!eth) { toast.error("No EVM wallet found — install MetaMask to connect."); return; }
    try {
      const accts = await eth.request({ method: "eth_requestAccounts" });
      if (accts[0]) { setAddr(accts[0]); toast.success(`Connected ${short(accts[0])}`); }
    } catch { toast.error("Connection request rejected."); }
  };
  return (
    <header style={{ borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 30, backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.7)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--lime)", boxShadow: "0 0 12px rgba(204,255,0,.7)" }} />
          <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: 0.3 }}>safwah</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--lime)", background: "var(--lime-wash)", padding: "3px 9px", borderRadius: 99 }}>wallet</span>
        </Link>
        <nav style={{ display: "flex", gap: 4, marginLeft: 18 }}>
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href} style={{ fontSize: 13.5, fontWeight: 600, padding: "8px 14px", borderRadius: 99, color: active ? "var(--lime)" : "var(--text-dim)", background: active ? "var(--lime-wash)" : "transparent" }}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {addr ? (
            <button onClick={() => setAddr(null)} className="mono" style={{ fontSize: 12, color: "var(--text)", display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 99, background: "var(--card)", border: "1px solid var(--border-strong)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--emerald)" }} /> {short(addr)}
            </button>
          ) : (
            <button onClick={connect} className="btn-lime" style={{ padding: "9px 18px", fontSize: 13 }}>Connect Wallet</button>
          )}
        </div>
      </div>
    </header>
  );
}
