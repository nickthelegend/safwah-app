import React from 'react';
import { Trophy, Star, Utensils, Car, ShoppingBag, Award } from 'lucide-react';

interface PortfolioProps {
  totalRefunded: number;    // USDC base units
  settlementNFTCount: number;
  invoiceNFTCount: number;
  merchantNames: string[];
}

// Spend categories inferred from merchant names (basic keyword matching)
const inferCategory = (name: string): 'luxury' | 'dining' | 'transport' | 'shopping' => {
  const n = name.toLowerCase();
  if (n.includes('mall') || n.includes('fashion') || n.includes('gucci') || n.includes('louis') || n.includes('chanel')) return 'luxury';
  if (n.includes('restaurant') || n.includes('cafe') || n.includes('dining') || n.includes('kitchen') || n.includes('emaar')) return 'dining';
  if (n.includes('taxi') || n.includes('transport') || n.includes('metro') || n.includes('ride') || n.includes('uber')) return 'transport';
  return 'shopping';
};

const BADGES = [
  { id: 'first_claim', label: 'First Claim', emoji: '🎫', threshold: 1, unit: 'claims', description: 'Submitted first VAT claim' },
  { id: 'big_spender', label: 'Big Spender', emoji: '💎', threshold: 100, unit: 'usdc', description: 'Reclaimed > 100 USDC' },
  { id: 'frequent_shopper', label: 'Frequent Shopper', emoji: '🛍️', threshold: 3, unit: 'claims', description: 'Submitted 3+ claims' },
  { id: 'vip_traveler', label: 'VIP Traveler', emoji: '✈️', threshold: 500, unit: 'usdc', description: 'Reclaimed > 500 USDC' },
  { id: 'dubai_elite', label: 'Dubai Elite', emoji: '👑', threshold: 1000, unit: 'usdc', description: 'Reclaimed > 1000 USDC' },
  { id: 'nft_collector', label: 'NFT Collector', emoji: '🏆', threshold: 3, unit: 'nfts', description: 'Collected 3+ NFTs' },
];

export function TravelPortfolio({ totalRefunded, settlementNFTCount, invoiceNFTCount, merchantNames }: PortfolioProps) {
  const totalUsdc = totalRefunded / 1_000_000;
  const totalSpend = totalUsdc / 0.05;  // Reverse from 5% VAT

  // Category breakdown
  const categories = merchantNames.reduce((acc, name) => {
    const cat = inferCategory(name);
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalItems = merchantNames.length || 1;

  const categoryData = [
    { label: 'Luxury & Brands', key: 'luxury', icon: Star, color: '#F59E0B', count: categories.luxury ?? 0 },
    { label: 'Fine Dining & Cafe', key: 'dining', icon: Utensils, color: '#EF4444', count: categories.dining ?? 0 },
    { label: 'Transport & Uber', key: 'transport', icon: Car, color: '#3B82F6', count: categories.transport ?? 0 },
    { label: 'General Shopping', key: 'shopping', icon: ShoppingBag, color: '#8B5CF6', count: categories.shopping ?? 0 },
  ];

  const earnedBadges = BADGES.filter(badge => {
    if (badge.unit === 'usdc') return totalUsdc >= badge.threshold;
    if (badge.unit === 'claims') return settlementNFTCount >= badge.threshold;
    if (badge.unit === 'nfts') return invoiceNFTCount >= badge.threshold;
    return false;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Bento: Total Stats */}
      <div style={{
        background: "linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(10, 10, 10, 0.9) 100%)",
        border: "var(--border-style)",
        borderRadius: "var(--radius-main-card)",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "var(--shadow-spread)"
      }}>
        <span className="label-caps" style={{ color: "var(--color-cyber-gold)" }}>Travel Spend Insights</span>
        <h2 style={{ fontSize: "36px", fontWeight: "900", color: "#fff", margin: 0 }}>
          ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span style={{ fontSize: "14px", color: "var(--color-sage)", fontWeight: "bold", marginLeft: "8px" }}>AED Spend Equiv</span>
        </h2>
        <p style={{ color: "var(--color-muted-gray)", fontSize: "12px", margin: 0 }}>
          Inferred total travel spend based on {invoiceNFTCount} receipts. Total VAT refund: USDC {totalUsdc.toFixed(2)}
        </p>
      </div>

      {/* Categories breakdown */}
      <div style={{
        backgroundColor: "var(--color-white)",
        border: "var(--border-style)",
        borderRadius: "var(--radius-bento)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <span style={{ color: "var(--color-sage)", fontSize: "11px", fontWeight: "bold", letterSpacing: "0.1em" }}>SPEND CATEGORIES</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {categoryData.map(cat => {
            const Icon = cat.icon;
            const pct = Math.round((cat.count / totalItems) * 100);
            return (
              <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: `${cat.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Icon size={14} style={{ color: cat.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--color-warm-sand)", fontWeight: "bold" }}>{cat.label}</span>
                    <span style={{ color: cat.color, fontWeight: "bold" }}>{pct}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#1e1e1e", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`,
                      height: "100%",
                      backgroundColor: cat.color,
                      borderRadius: "3px",
                      transition: "width 1s ease-out"
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gamification Badges */}
      <div style={{
        backgroundColor: "var(--color-white)",
        border: "var(--border-style)",
        borderRadius: "var(--radius-bento)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "var(--color-sage)", fontSize: "11px", fontWeight: "bold", letterSpacing: "0.1em" }}>TAX-FREE BADGES</span>
          <span style={{ fontSize: "11px", color: "var(--color-cyber-gold)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
            <Trophy size={12} /> {earnedBadges.length}/{BADGES.length} Unlocked
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {BADGES.map(badge => {
            const earned = earnedBadges.some(b => b.id === badge.id);
            return (
              <div
                key={badge.id}
                title={badge.description}
                style={{
                  backgroundColor: earned ? "rgba(253,224,71,0.05)" : "rgba(25,25,25,0.4)",
                  border: earned ? "1px solid rgba(253,224,71,0.2)" : "1px solid rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  padding: "12px 8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  opacity: earned ? 1 : 0.4,
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontSize: "24px" }}>{badge.emoji}</span>
                <span style={{
                  fontSize: "10px",
                  color: earned ? "var(--color-cyber-gold)" : "var(--color-muted-gray)",
                  fontWeight: "bold",
                  textAlign: "center"
                }}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
