"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Types
type CategoryId = "overview" | "receipts" | "claims" | "nfts";

interface Receipt {
  id: string;
  storeName: string;
  amount: string;
  vat: string;
  date: string;
  walrusUrl: string;
  selectedForClaim: boolean;
  claimed: boolean;
}

interface Claim {
  id: string;
  title: string;
  receiptCount: number;
  totalVat: string;
  payoutAmount: string;
  status: "80% Paid (Exit Pending)" | "Fully Settled" | "Under Review";
  nftMinted: boolean;
  date: string;
}

interface SuiNFT {
  id: string;
  title: string;
  claimId: string;
  vatRefunded: string;
  imageUrl: string;
  txnHash: string;
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("overview");
  
  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Tourist state
  const [usdcBalance, setUsdcBalance] = useState("142.50");
  const [suiBalance, setSuiBalance] = useState("45.2");

  // Receipts State (Decentralized storage via Walrus)
  const [receipts, setReceipts] = useState<Receipt[]>([
    { id: "rec-1", storeName: "Apple Store, Dubai Mall", amount: "5,499.00 AED", vat: "274.95 AED", date: "2026-05-23", walrusUrl: "walrus://blob/q37s8f921a9x7zh1", selectedForClaim: true, claimed: false },
    { id: "rec-2", storeName: "Chanel Boutique, Galleria", amount: "12,450.00 AED", vat: "622.50 AED", date: "2026-05-24", walrusUrl: "walrus://blob/m92la10f29zk38sw", selectedForClaim: false, claimed: false },
    { id: "rec-3", storeName: "Emaar Entertainment", amount: "450.00 AED", vat: "22.50 AED", date: "2026-05-21", walrusUrl: "walrus://blob/k10w82lz71pa92sk", selectedForClaim: true, claimed: false }
  ]);

  // Claims State (80% instant / 20% airport gate split)
  const [claims, setClaims] = useState<Claim[]>([
    { id: "CLM-8902", title: "Mall Shopping Bundle", receiptCount: 2, totalVat: "148.20 USDC", payoutAmount: "118.56 USDC (80%)", status: "80% Paid (Exit Pending)", nftMinted: true, date: "2026-05-22" }
  ]);

  // Sui NFTs State
  const [nfts, setNfts] = useState<SuiNFT[]>([
    { id: "nft-1", title: "Safwah Refund #8902", claimId: "CLM-8902", vatRefunded: "148.20 USDC", imageUrl: "https://images.unsplash.com/photo-1642156878705-4c07c6f0ea99?q=80&w=250&auto=format&fit=crop", txnHash: "0x4b7f...e2a9" }
  ]);

  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStoreName, setFormStoreName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formVat, setFormVat] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sui Connect simulator
  const handleConnectWallet = (walletType: string) => {
    setIsConnecting(true);
    setShowConnectModal(false);
    setTimeout(() => {
      setWalletAddress("0x8c2a71f09b558de0291ba207f6e3c4a20b08f9de");
      setWalletConnected(true);
      setIsConnecting(false);
    }, 1200);
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setShowWalletMenu(false);
  };

  const toggleReceiptSelect = (receiptId: string) => {
    setReceipts(prev => prev.map(rec => 
      rec.id === receiptId ? { ...rec, selectedForClaim: !rec.selectedForClaim } : rec
    ));
  };

  // Submit claim handler (Bundles selected receipts)
  const handleSubmitClaim = () => {
    if (!walletConnected) {
      alert("Please connect your Sui Wallet first!");
      return;
    }
    const selected = receipts.filter(r => r.selectedForClaim && !r.claimed);
    if (selected.length === 0) {
      alert("Select at least one receipt to bundle into a claim.");
      return;
    }

    const totalVatAED = selected.reduce((sum, r) => sum + parseFloat(r.vat), 0);
    // Convert AED to USDC (roughly 1 USDC = 3.67 AED)
    const totalVatUSDC = (totalVatAED / 3.67).toFixed(2);
    const instantPayout = (parseFloat(totalVatUSDC) * 0.8).toFixed(2);

    const newClaimId = `CLM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newClaim: Claim = {
      id: newClaimId,
      title: selected.length === 1 ? `${selected[0].storeName} Claim` : `Bundle of ${selected.length} Receipts`,
      receiptCount: selected.length,
      totalVat: `${totalVatUSDC} USDC`,
      payoutAmount: `${instantPayout} USDC (80%)`,
      status: "80% Paid (Exit Pending)",
      nftMinted: false,
      date: new Date().toISOString().split('T')[0]
    };

    // Update States
    setClaims(prev => [newClaim, ...prev]);
    setReceipts(prev => prev.map(rec => 
      rec.selectedForClaim ? { ...rec, claimed: true, selectedForClaim: false } : rec
    ));
    setUsdcBalance(prev => (parseFloat(prev) + parseFloat(instantPayout)).toFixed(2));
    
    // Switch to claims list
    setActiveCategory("claims");
    alert(`Refund claim ${newClaimId} submitted successfully!\n\n80% Instant Payout (${instantPayout} USDC) has been sent to your Sui Wallet on-chain.\n\n20% will be unlocked at airport exit inspection!`);
  };

  // Mint Refund proof NFT on Sui
  const handleMintNFT = (claimId: string) => {
    if (!walletConnected) {
      alert("Please connect your Sui Wallet first!");
      return;
    }
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    const newNFT: SuiNFT = {
      id: `nft-${Date.now()}`,
      title: `Safwah Proof #${claimId.split('-')[1] || "NFT"}`,
      claimId: claimId,
      vatRefunded: claim.totalVat,
      imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=250&auto=format&fit=crop",
      txnHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`
    };

    setNfts(prev => [newNFT, ...prev]);
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, nftMinted: true } : c));
    alert(`Proof of Refund NFT successfully minted on Sui!\nTransaction Hash: ${newNFT.txnHash}`);
  };

  // Upload receipt (Walrus storage mock + AI scan)
  const handleUploadReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStoreName || !formAmount) return;

    setIsUploading(true);
    setTimeout(() => {
      const calculatedVat = (parseFloat(formAmount.replace(/,/g, '')) * 0.05).toFixed(2); // 5% VAT UAE
      const mockHash = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const newRec: Receipt = {
        id: `rec-${Date.now()}`,
        storeName: formStoreName,
        amount: `${parseFloat(formAmount).toLocaleString()} AED`,
        vat: `${calculatedVat} AED`,
        date: new Date().toISOString().split('T')[0],
        walrusUrl: `walrus://blob/${mockHash}`,
        selectedForClaim: true,
        claimed: false
      };

      setReceipts(prev => [newRec, ...prev]);
      setIsUploading(false);
      setIsModalOpen(false);
      setActiveCategory("receipts");
      alert(`AI Scan Complete!\nStore: ${newRec.storeName}\nVAT Extracted: ${newRec.vat}\nUploaded to Decentralized Storage (Walrus)!`);
    }, 1800);
  };

  return (
    <main className="phone-frame">
      {/* Header section with wallet connection */}
      <header className="header">
        <div className="header-left">
          <span className="header-greeting-lbl">SAFWAH TOURIST APP</span>
          <h1 className="header-title-name">Sui VAT Refund</h1>
        </div>
        
        <div className="header-right">
          {walletConnected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <button 
                className="btn-primary" 
                style={{ padding: "8px 16px", borderRadius: "16px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                onClick={() => setShowWalletMenu(!showWalletMenu)}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }}></span>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </button>
              {showWalletMenu && (
                <div style={{ position: "absolute", top: "45px", right: "0", backgroundColor: "#1a1a1a", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "12px", zIndex: 1000, padding: "8px", width: "160px" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-sage)", padding: "4px 8px" }}>BALANCES</div>
                  <div style={{ fontSize: "12px", fontWeight: "bold", padding: "2px 8px", color: "#fff" }}>{usdcBalance} USDC</div>
                  <div style={{ fontSize: "12px", padding: "2px 8px", color: "var(--color-sage)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{suiBalance} SUI</div>
                  <button 
                    onClick={handleDisconnect}
                    style={{ background: "none", border: "none", color: "#EF4444", fontSize: "12px", width: "100%", textAlign: "left", padding: "8px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="btn-primary"
              style={{ padding: "10px 18px", borderRadius: "20px", fontSize: "12px" }}
              onClick={() => setShowConnectModal(true)}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      {/* Category selector */}
      <section className="category-scroll-container" ref={scrollContainerRef}>
        <div className="category-btn-wrapper" id="cat-btn-overview">
          {activeCategory === "overview" ? (
            <button className="category-btn-active" onClick={() => setActiveCategory("overview")}>
              <div className="active-circle">📊</div>
              <span className="active-label">Overview</span>
            </button>
          ) : (
            <button className="category-btn-inactive" onClick={() => setActiveCategory("overview")}>📊</button>
          )}
        </div>

        <div className="category-btn-wrapper" id="cat-btn-receipts">
          {activeCategory === "receipts" ? (
            <button className="category-btn-active" onClick={() => setActiveCategory("receipts")}>
              <div className="active-circle">📄</div>
              <span className="active-label">Receipts</span>
            </button>
          ) : (
            <button className="category-btn-inactive" onClick={() => setActiveCategory("receipts")}>📄</button>
          )}
        </div>

        <div className="category-btn-wrapper" id="cat-btn-claims">
          {activeCategory === "claims" ? (
            <button className="category-btn-active" onClick={() => setActiveCategory("claims")}>
              <div className="active-circle">💸</div>
              <span className="active-label">Claims</span>
            </button>
          ) : (
            <button className="category-btn-inactive" onClick={() => setActiveCategory("claims")}>💸</button>
          )}
        </div>

        <div className="category-btn-wrapper" id="cat-btn-nfts">
          {activeCategory === "nfts" ? (
            <button className="category-btn-active" onClick={() => setActiveCategory("nfts")}>
              <div className="active-circle">🛡️</div>
              <span className="active-label">Sui NFTs</span>
            </button>
          ) : (
            <button className="category-btn-inactive" onClick={() => setActiveCategory("nfts")}>🛡️</button>
          )}
        </div>
      </section>

      {/* Main card panel - simulates view transition */}
      <section key={activeCategory} className="hero-card fade-transition">
        <div className="decorative-blob" />

        {/* Overview Tab Content */}
        {activeCategory === "overview" && (
          <>
            <div className="hero-header">
              <div className="hero-icon-holder">
                <span>💸</span>
              </div>
              <div className="hero-title-area">
                <span className="label-caps">ACTIVE RECLAIM VITAL</span>
                <h2>Dubai Mall Shopping Claim</h2>
              </div>
            </div>
            <p className="hero-card-desc">
              Your claim is processed! 80% split has been paid. Verify exit at airport customs to claim the remaining 20%.
            </p>
            <div className="bento-grid">
              <div className="bento-metric-card">
                <span className="bento-metric-label">CLAIM ID</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <span className="bento-value">CLM-8902</span>
                </div>
              </div>
              <div className="bento-metric-card">
                <span className="bento-metric-label">REFUND DUE</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <span className="bento-value">148.20 USDC</span>
                </div>
              </div>
            </div>
            <div className="hero-alert-box">
              <div className="hero-alert-text">
                ✈️ Scan your Claim QR code at airport exit validation to receive the final 20% (29.64 USDC).
              </div>
            </div>
          </>
        )}

        {/* Receipts Tab Content */}
        {activeCategory === "receipts" && (
          <>
            <div className="hero-header">
              <div className="hero-icon-holder">
                <span>📦</span>
              </div>
              <div className="hero-title-area">
                <span className="label-caps">DECENTRALIZED STORAGE</span>
                <h2>Walrus Permanent Blobs</h2>
              </div>
            </div>
            <p className="hero-card-desc">
              Receipt files are compressed and uploaded on Walrus for secure, decentralized government verification.
            </p>
            <div className="bento-grid">
              <div className="bento-metric-card">
                <span className="bento-metric-label">TOTAL RECEIPTS</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/></svg>
                  </div>
                  <span className="bento-value">{receipts.length} Logs</span>
                </div>
              </div>
              <div className="bento-metric-card">
                <span className="bento-metric-label">UNCLAIMED VAT</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <span className="bento-value">
                    {(receipts.filter(r => !r.claimed).reduce((sum, r) => sum + parseFloat(r.vat), 0) / 3.67).toFixed(2)} USDC
                  </span>
                </div>
              </div>
            </div>
            <div className="hero-alert-box">
              <div className="hero-alert-text">
                💡 Check receipts below and click "Submit Tax Refund Claim" in the Claims tab to process.
              </div>
            </div>
          </>
        )}

        {/* Claims Tab Content */}
        {activeCategory === "claims" && (
          <>
            <div className="hero-header">
              <div className="hero-icon-holder">
                <span>🔄</span>
              </div>
              <div className="hero-title-area">
                <span className="label-caps">USDC PAYOUT MODEL</span>
                <h2>80/20 Split Funding</h2>
              </div>
            </div>
            <p className="hero-card-desc">
              Get 80% of your VAT refund paid instantly in USDC to SUI wallet. The remaining 20% pays out immediately upon scanning at airport gate.
            </p>
            <div className="bento-grid">
              <div className="bento-metric-card" style={{ gridColumn: "span 2" }}>
                <span className="bento-metric-label">SELECTED FOR NEW CLAIM</span>
                <div className="bento-content" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="bento-icon-circle">
                      <svg viewBox="0 0 24 24"><path d="m18 2 4 4M13 7l4 4M9 11l4 4"/></svg>
                    </div>
                    <span className="bento-value" style={{ fontSize: "16px" }}>
                      {receipts.filter(r => r.selectedForClaim && !r.claimed).length} Receipts Selected
                    </span>
                  </div>
                  <span className="bento-value" style={{ color: "var(--color-cyber-gold)" }}>
                    {(receipts.filter(r => r.selectedForClaim && !r.claimed).reduce((sum, r) => sum + parseFloat(r.vat), 0) / 3.67).toFixed(2)} USDC
                  </span>
                </div>
              </div>
            </div>
            <button 
              className="btn-primary" 
              style={{ width: "100%", padding: "16px" }}
              onClick={handleSubmitClaim}
              disabled={receipts.filter(r => r.selectedForClaim && !r.claimed).length === 0}
            >
              Bundle & Submit Claim
            </button>
          </>
        )}

        {/* NFTs Tab Content */}
        {activeCategory === "nfts" && (
          <>
            <div className="hero-header">
              <div className="hero-icon-holder">
                <span>🛡️</span>
              </div>
              <div className="hero-title-area">
                <span className="label-caps">ON-CHAIN PROOF</span>
                <h2>Sui Tax-Free NFTs</h2>
              </div>
            </div>
            <p className="hero-card-desc">
              Each approved claim generates a unique soulbound validation NFT on Sui containing encrypted hashes of items bought and verification stamps.
            </p>
            <div className="bento-grid">
              <div className="bento-metric-card">
                <span className="bento-metric-label">NFT COLLECTION</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 12V6"/></svg>
                  </div>
                  <span className="bento-value">{nfts.length} Minted</span>
                </div>
              </div>
              <div className="bento-metric-card">
                <span className="bento-metric-label">SECURE GAS</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <svg viewBox="0 0 24 24"><path d="M12 2v2M12 20v2"/></svg>
                  </div>
                  <span className="bento-value">0.02 SUI</span>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Secondary Feed items lists depending on active category */}
      <section key={`feed-${activeCategory}`} className="feed-section fade-transition">
        {activeCategory === "overview" && (
          <>
            <div className="feed-header">
              <span className="label-caps">CLAIM HISTORY</span>
            </div>
            {claims.map((claim) => (
              <div key={claim.id} className="feed-card">
                <div className="feed-card-left">
                  <div className="feed-icon-container">🧾</div>
                  <div className="feed-text-area">
                    <span className="feed-title">{claim.title}</span>
                    <span className="feed-subtitle">{claim.date} • {claim.receiptCount} Receipts • {claim.totalVat}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <span className="label-caps" style={{ color: claim.status.startsWith("Fully") ? "#10B981" : "var(--color-cyber-gold)" }}>{claim.status}</span>
                  {!claim.nftMinted && (
                    <button 
                      className="btn-primary" 
                      style={{ fontSize: "10px", padding: "6px 12px", borderRadius: "10px" }}
                      onClick={() => handleMintNFT(claim.id)}
                    >
                      Mint NFT Proof
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {activeCategory === "receipts" && (
          <>
            <div className="feed-header">
              <span className="label-caps">SCANNED RECEIPTS</span>
              <span className="label-caps" style={{ color: "var(--color-charcoal)", fontWeight: 800 }}>
                {receipts.filter(r => r.claimed).length} CLAIMED
              </span>
            </div>
            {receipts.map((rec) => (
              <div key={rec.id} className={`feed-card ${rec.claimed ? "completed" : ""}`}>
                <div className="feed-card-left">
                  <div className="feed-icon-container">{rec.emoji || "🛍️"}</div>
                  <div className="feed-text-area">
                    <span className="feed-title">{rec.storeName}</span>
                    <span className="feed-subtitle" style={{ fontSize: "10px" }}>{rec.walrusUrl.slice(0, 20)}...</span>
                    <span className="feed-subtitle">{rec.date} • {rec.amount} (VAT: {rec.vat})</span>
                  </div>
                </div>
                {!rec.claimed && (
                  <button 
                    className={`checkbox-btn ${rec.selectedForClaim ? "checked" : ""}`}
                    onClick={() => toggleReceiptSelect(rec.id)}
                  >
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                  </button>
                )}
                {rec.claimed && (
                  <span className="label-caps" style={{ color: "#10B981" }}>Claimed</span>
                )}
              </div>
            ))}
          </>
        )}

        {activeCategory === "claims" && (
          <>
            <div className="feed-header">
              <span className="label-caps">PENDING RECEIPTS BUNDLE</span>
            </div>
            {receipts.filter(r => !r.claimed).map((rec) => (
              <div key={rec.id} className="feed-card">
                <div className="feed-card-left">
                  <div className="feed-icon-container">🛍️</div>
                  <div className="feed-text-area">
                    <span className="feed-title">{rec.storeName}</span>
                    <span className="feed-subtitle">{rec.amount} (VAT: {rec.vat})</span>
                  </div>
                </div>
                <button 
                  className={`checkbox-btn ${rec.selectedForClaim ? "checked" : ""}`}
                  onClick={() => toggleReceiptSelect(rec.id)}
                >
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </button>
              </div>
            ))}
          </>
        )}

        {activeCategory === "nfts" && (
          <>
            <div className="feed-header">
              <span className="label-caps">MINTED PROOF NFTS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {nfts.map((nft) => (
                <div key={nft.id} className="feed-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px", padding: "16px" }}>
                  <div style={{ position: "relative", width: "100%", height: "120px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#022C22", border: "1px solid rgba(212, 175, 55, 0.2)" }}>
                    <div style={{ position: "absolute", top: "10px", left: "10px", fontSize: "10px", background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: "8px", border: "1px solid rgba(212,175,55,0.3)" }}>
                      SUI NFT
                    </div>
                    <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "10px", color: "var(--color-sage)" }}>REFUND</span>
                      <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--color-cyber-gold)" }}>{nft.vatRefunded}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>{nft.title}</span>
                    <span style={{ fontSize: "10px", color: "var(--color-sage)" }}>Tx: {nft.txnHash}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Floating navigation bar */}
      <div className="nav-wrapper">
        <nav className="nav-pill-bar">
          <button className={`nav-item-btn ${activeCategory === "overview" ? "active" : "inactive"}`} onClick={() => setActiveCategory("overview")}>
            <svg viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </button>

          {/* FAB: Upload Receipt */}
          <div className="fab-container">
            <button className={`fab-btn ${isModalOpen ? "open" : ""}`} onClick={() => setIsModalOpen(true)}>
              <svg viewBox="0 0 24 24" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <button className={`nav-item-btn ${activeCategory === "receipts" ? "active" : "inactive"}`} onClick={() => setActiveCategory("receipts")}>
            <svg viewBox="0 0 24 24" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </button>
        </nav>
      </div>

      {/* Connect Wallet Modal */}
      {showConnectModal && (
        <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="label-caps" style={{ color: "var(--color-cyber-gold)" }}>Connect Sui Wallet</span>
              <button onClick={() => setShowConnectModal(false)} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--color-sage)", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-start", padding: "16px" }} onClick={() => handleConnectWallet("Suiet")}>
                <span style={{ fontSize: "20px" }}>🌐</span> Suiet Wallet
              </button>
              <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-start", padding: "16px" }} onClick={() => handleConnectWallet("Mysten")}>
                <span style={{ fontSize: "20px" }}>💧</span> Sui Wallet
              </button>
              <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-start", padding: "16px" }} onClick={() => handleConnectWallet("Martian")}>
                <span style={{ fontSize: "20px" }}>👽</span> Martian Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload/AI Scan Receipt Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="label-caps" style={{ color: "var(--color-cyber-gold)", fontSize: "12px" }}>AI SCAN SHOPPING RECEIPT</span>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--color-sage)", cursor: "pointer" }}>&times;</button>
            </div>
            
            <form onSubmit={handleUploadReceipt} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group" style={{ border: "2px dashed rgba(212, 175, 55, 0.2)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                <span style={{ fontSize: "32px" }}>📸</span>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>Upload Invoice Photo / PDF</span>
                <span style={{ fontSize: "10px", color: "var(--color-sage)" }}>Max 5MB • Automatically scans & hashes to Walrus</span>
              </div>

              <div className="form-group">
                <label>Store Name (Mock AI Extracted)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Apple Store, Nike, Chanel" 
                  value={formStoreName}
                  onChange={(e) => setFormStoreName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Invoice Value (AED)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 1500" 
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {isUploading ? "AI Scanning & Uploading..." : "Scan & Save to Walrus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
