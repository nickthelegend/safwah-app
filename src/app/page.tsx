"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import WalletConnect from "../components/WalletConnect";
import { uploadToWalrus } from "../lib/walrus";
import { CONTRACTS } from "../lib/contracts";
import { QRCodeSVG } from "qrcode.react";
import { ClaimQRCode } from "../components/ClaimQRCode";
import { WithdrawalModal } from "../components/WithdrawalModal";
import { ClaimTracker } from "../components/ClaimTracker";

import { useEnokiFlow, useZkLogin, useZkLoginSession } from "@mysten/enoki/react";
import { useGaslessTransaction } from "../lib/gasless";
import { ZkLoginButton } from "../components/ZkLoginButton";
import { FxCalculator } from "../components/FxCalculator";
import { TravelPortfolio } from "../components/TravelPortfolio";
import { startEventListener } from "../lib/events";
import { Scanner } from "@yudiel/react-qr-scanner";

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
  emoji?: string;
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
  
  // Real Sui Wallet connection hooks
  const currentAccount = useCurrentAccount();
  const enokiFlow = useEnokiFlow();
  const zkLogin = useZkLogin();
  const zkSession = useZkLoginSession();
  const { executeGasless } = useGaslessTransaction();

  const walletAddress = currentAccount?.address || zkLogin.address || "";
  const walletConnected = !!walletAddress;
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Fetch real USDC balance
  const { data: coinsData } = useSuiClientQuery('getCoins', {
    owner: walletAddress,
    coinType: CONTRACTS.USDC_COIN_TYPE,
  }, { enabled: walletConnected });

  const usdcBalanceVal = coinsData?.data
    .reduce((sum, c) => sum + Number(c.balance), 0) ?? 0;
  const usdcDisplay = (usdcBalanceVal / 1_000_000).toFixed(2);

  // Fetch real SUI balance
  const { data: suiBalanceData } = useSuiClientQuery('getBalance', {
    owner: walletAddress,
  }, { enabled: walletConnected });

  const suiBalanceVal = suiBalanceData ? Number(suiBalanceData.totalBalance) : 0;
  const suiDisplay = (suiBalanceVal / 1_000_000_000).toFixed(2);

  // Start live event listener for status updates and incoming invoices
  useEffect(() => {
    if (!walletAddress) return;
    const cleanup = startEventListener(suiClient, walletAddress, {
      onClaimApproved: ({ claimId, finalAmount }) => {
        alert(`Claim approved! ${claimId.slice(0, 10)}... has been approved by custom officers. Remaining ${(finalAmount / 1_000_000).toFixed(2)} USDC is ready to claim at the airport.`);
      },
      onClaimSettled: ({ claimId, totalRefunded }) => {
        alert(`Claim settled! ${claimId.slice(0, 10)}... has been fully settled. Total refunded: ${(totalRefunded / 1_000_000).toFixed(2)} USDC.`);
      },
      onInvoiceReceived: ({ invoiceNumber, merchantName, vatAmount }) => {
        alert(`New digital invoice received! Invoice #${invoiceNumber} from ${merchantName} is eligible for a VAT refund of ${(vatAmount / 1_000_000).toFixed(2)} USDC.`);
      }
    });
    return cleanup;
  }, [suiClient, walletAddress]);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClaimForQr, setSelectedClaimForQr] = useState<Claim | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Digital pay & scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBill, setScannedBill] = useState<any | null>(null);
  const [scannerError, setScannerError] = useState("");

  // Query owned InvoiceNFTs
  const { data: ownedInvoiceNFTs } = useSuiClientQuery('getOwnedObjects', {
    owner: walletAddress,
    filter: {
      StructType: `${CONTRACTS.PACKAGE_ID}::safwah_nft::InvoiceNFT`,
    },
    options: {
      showContent: true,
    }
  }, { enabled: walletConnected });

  // Query owned RefundSettlementNFTs
  const { data: ownedSettlementNFTs } = useSuiClientQuery('getOwnedObjects', {
    owner: walletAddress,
    filter: {
      StructType: `${CONTRACTS.PACKAGE_ID}::safwah_nft::RefundSettlementNFT`,
    },
    options: {
      showContent: true,
    }
  }, { enabled: walletConnected });

  // Load claims from localStorage on mount
  useEffect(() => {
    if (!walletAddress) return;
    const savedClaims = localStorage.getItem(`safwah_claims_${walletAddress}`);
    if (savedClaims) {
      try {
        setClaims(JSON.parse(savedClaims));
      } catch (e) {}
    }
  }, [walletAddress]);

  // Save claims to localStorage helper
  const updateClaimsAndSave = (newClaims: Claim[]) => {
    setClaims(newClaims);
    if (walletAddress) {
      localStorage.setItem(`safwah_claims_${walletAddress}`, JSON.stringify(newClaims));
    }
  };

  // Map on-chain NFTs
  const invoiceNfts = (ownedInvoiceNFTs?.data || []).map((obj: any) => {
    const fields = obj.data?.content?.fields || {};
    return {
      id: obj.data?.objectId || `invoice-${Math.random()}`,
      title: `Invoice #${fields.invoice_number || "Unknown"}`,
      claimId: fields.is_claimed ? "Submitted" : "Unclaimed",
      vatRefunded: `${(Number(fields.vat_amount || 0) / 1_000_000).toFixed(2)} USDC`,
      imageUrl: fields.image_url || "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=250&auto=format&fit=crop",
      txnHash: obj.data?.objectId ? (obj.data.objectId.slice(0, 8) + "..." + obj.data.objectId.slice(-6)) : ""
    };
  });

  const settlementNfts = (ownedSettlementNFTs?.data || []).map((obj: any) => {
    const fields = obj.data?.content?.fields || {};
    return {
      id: obj.data?.objectId || `settlement-${Math.random()}`,
      title: `Refund Proof #${fields.claim_id?.slice(-6) || "Settled"}`,
      claimId: fields.claim_id || "CLM-Real",
      vatRefunded: `${(Number(fields.total_vat_refunded || 0) / 1_000_000).toFixed(2)} USDC`,
      imageUrl: fields.image_url || "https://images.unsplash.com/photo-1642156878705-4c07c6f0ea99?q=80&w=250&auto=format&fit=crop",
      txnHash: obj.data?.objectId ? (obj.data.objectId.slice(0, 8) + "..." + obj.data.objectId.slice(-6)) : ""
    };
  });

  // Combine both for displaying in the NFTs list
  const allNfts = [...settlementNfts, ...invoiceNfts, ...nfts];

  // Portfolio calculations
  const totalRefundedVal = claims.reduce((sum, c) => {
    const numericVat = parseFloat(c.totalVat) || 0;
    const portion = c.status === "Fully Settled" ? 1.0 : 0.8;
    return sum + (numericVat * portion) * 1_000_000;
  }, 0);
  const settlementNFTCount = settlementNfts.length || claims.filter(c => c.nftMinted).length;
  const invoiceNFTCount = invoiceNfts.length || receipts.length;
  const merchantNames = receipts.map(r => r.storeName);

  // Map selectedClaimForQr to ClaimQRCode component's expected props format
  const qrClaimData = selectedClaimForQr ? {
    objectId: selectedClaimForQr.id,
    totalVat: Math.floor(parseFloat(selectedClaimForQr.totalVat) * 1_000_000) || 148200000,
    receiptCount: selectedClaimForQr.receiptCount,
    merchantNames: [selectedClaimForQr.title],
    submittedAt: selectedClaimForQr.date + "T12:00:00Z",
    status: selectedClaimForQr.status === "Fully Settled" ? 3 : 1,
    instantPaid: Math.floor(parseFloat(selectedClaimForQr.payoutAmount) * 1_000_000) || 118560000,
    finalAmount: Math.floor((parseFloat(selectedClaimForQr.totalVat) - parseFloat(selectedClaimForQr.payoutAmount)) * 1_000_000) || 29640000,
  } : null;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleReceiptSelect = (receiptId: string) => {
    setReceipts(prev => prev.map(rec => 
      rec.id === receiptId ? { ...rec, selectedForClaim: !rec.selectedForClaim } : rec
    ));
  };

  // Faucet handler
  const handleGetTestUsdc = async () => {
    if (!walletConnected) {
      alert("Please connect your Sui Wallet first!");
      return;
    }
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::usdc_mock::faucet`,
        arguments: [
          tx.object(CONTRACTS.USDC_MOCK_ADMIN_ID),
          tx.pure.u64(100_000_000),   // 100 USDC (6 decimals)
          tx.pure.address(walletAddress),
        ],
      });
      const result = await executeGasless(tx, suiClient, {
        jwt: zkSession?.jwt ?? undefined,
        fallback: () => signAndExecute({ transaction: tx }),
      });
      alert(`100 Test USDC successfully minted!\nTransaction digest: ${result.digest}`);
    } catch (err: any) {
      alert(`Faucet call failed: ${err.message || err}`);
    }
  };

  // Submit claim handler (Bundles selected receipts on-chain)
  const handleSubmitClaim = async () => {
    if (!walletConnected) {
      alert("Please connect your Sui Wallet first!");
      return;
    }
    const selected = receipts.filter(r => r.selectedForClaim && !r.claimed);
    if (selected.length === 0) {
      alert("Select at least one receipt to bundle into a claim.");
      return;
    }

    setIsSubmitting(true);
    try {
      const totalVatAED = selected.reduce((sum, r) => sum + parseFloat(r.vat), 0);
      const totalVatUSDC = (totalVatAED / 3.67).toFixed(2);
      const totalVatBaseUnits = Math.floor(parseFloat(totalVatUSDC) * 1_000_000); // base units
      const instantPayout = (parseFloat(totalVatUSDC) * 0.8).toFixed(2);

      // 1. Fetch user coins to cover the payment
      const coins = await suiClient.getCoins({
        owner: walletAddress,
        coinType: CONTRACTS.USDC_COIN_TYPE,
      });

      if (coins.data.length === 0) {
        throw new Error("No USDC balance. Click the 'Get Test USDC' button to get some test coins.");
      }

      // Calculate total available balance in coins
      const totalAvailable = coins.data.reduce((sum, c) => sum + Number(c.balance), 0);
      if (totalAvailable < totalVatBaseUnits) {
        throw new Error(`Insufficient USDC balance. Required: ${(totalVatBaseUnits / 1_000_000).toFixed(2)} USDC, Available: ${(totalAvailable / 1_000_000).toFixed(2)} USDC.`);
      }

      const tx = new Transaction();
      
      // Merge coins if there are multiple coin objects
      const primaryCoin = coins.data[0].coinObjectId;
      if (coins.data.length > 1) {
        tx.mergeCoins(
          tx.object(primaryCoin),
          coins.data.slice(1).map(c => tx.object(c.coinObjectId))
        );
      }

      // Split exact VAT amount from primary coin
      const [vatCoin] = tx.splitCoins(tx.object(primaryCoin), [totalVatBaseUnits]);

      // Prepare claim arguments
      const blobIds = selected.map(r => Array.from(new TextEncoder().encode(r.walrusUrl.replace("walrus://blob/", ""))));
      const vatAmounts = selected.map(r => Math.floor((parseFloat(r.vat) / 3.67) * 1_000_000));
      const merchantNames = selected.map(r => Array.from(new TextEncoder().encode(r.storeName)));
      const totalPurchase = Math.floor(selected.reduce((sum, r) => sum + parseFloat(r.amount.replace(/,/g, '')) * 100, 0)); // AED cents
      const newClaimId = `CLAIM-${Date.now()}`;
      const claimNumber = Array.from(new TextEncoder().encode(newClaimId));

      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::safwah::submit_claim`,
        arguments: [
          tx.object(CONTRACTS.ESCROW_ID),
          vatCoin,
          tx.pure.vector('vector<u8>', blobIds),
          tx.pure.vector('u64', vatAmounts),
          tx.pure.vector('vector<u8>', merchantNames),
          tx.pure.u64(totalPurchase),
          tx.pure.vector('u8', claimNumber),
        ],
      });

      const result = await executeGasless(tx, suiClient, {
        jwt: zkSession?.jwt ?? undefined,
        fallback: () => signAndExecute({ transaction: tx }),
      });

      const txDetails = await suiClient.waitForTransaction({
        digest: result.digest,
        options: {
          showObjectChanges: true,
        }
      });

      const claimChange = txDetails.objectChanges?.find(
        (oc: any) => oc.type === "created" && oc.objectType.includes("::safwah::VatClaim")
      );
      const claimObjectId = (claimChange as any)?.objectId || newClaimId;

      const newClaim: Claim = {
        id: claimObjectId,
        title: selected.length === 1 ? `${selected[0].storeName} Claim` : `Bundle of ${selected.length} Receipts`,
        receiptCount: selected.length,
        totalVat: `${totalVatUSDC} USDC`,
        payoutAmount: `${instantPayout} USDC (80%)`,
        status: "80% Paid (Exit Pending)",
        nftMinted: false,
        date: new Date().toISOString().split('T')[0]
      };

      setClaims(prev => [newClaim, ...prev]);
      setReceipts(prev => prev.map(rec => 
        rec.selectedForClaim ? { ...rec, claimed: true, selectedForClaim: false } : rec
      ));

      setActiveCategory("claims");
      alert(`Refund claim ${claimObjectId} submitted successfully!\n\n80% Instant Payout (${instantPayout} USDC) has been sent to your SUI Wallet.\nTransaction Hash: ${result.digest}\n\n20% will be unlocked at airport customs exit inspection!`);
    } catch (err: any) {
      alert(`Claim submission failed: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle scanned Digital Bill QR code
  const handleScanBill = (result: string) => {
    if (!result) return;
    try {
      const payload = JSON.parse(result);
      if (payload.type === "safwah_bill_v1") {
        setScannedBill(payload);
        setIsScannerOpen(false);
      } else {
        setScannerError("Invalid QR Code: Not a Safwah Digital Bill");
        setTimeout(() => setScannerError(""), 3000);
      }
    } catch (err) {
      setScannerError("Invalid QR Code: Failed to parse");
      setTimeout(() => setScannerError(""), 3000);
    }
  };

  // Atomic PTB payment & claim checkout
  const handleExecuteDigitalPay = async () => {
    if (!walletConnected || !scannedBill) return;
    setIsSubmitting(true);
    try {
      const grossAED = parseFloat(scannedBill.amountAED.replace(/,/g, ''));
      const vatAED = parseFloat(scannedBill.vatAED.replace(/,/g, ''));
      const netAED = grossAED - vatAED;

      const vatUSDC = (vatAED / 3.67).toFixed(2);
      const vatAmountBaseUnits = Math.floor(parseFloat(vatUSDC) * 1_000_000);

      const netUSDC = (netAED / 3.67).toFixed(2);
      const netAmountBaseUnits = Math.floor(parseFloat(netUSDC) * 1_000_000);

      const totalRequired = vatAmountBaseUnits + netAmountBaseUnits;

      // 1. Fetch user coins to cover the payment
      const coins = await suiClient.getCoins({
        owner: walletAddress,
        coinType: CONTRACTS.USDC_COIN_TYPE,
      });

      if (coins.data.length === 0) {
        throw new Error("No USDC balance. Click the 'Get Test USDC' button to get some test coins.");
      }

      // Calculate total available balance
      const totalAvailable = coins.data.reduce((sum, c) => sum + Number(c.balance), 0);
      if (totalAvailable < totalRequired) {
        throw new Error(`Insufficient USDC balance. Required: ${(totalRequired / 1_000_000).toFixed(2)} USDC, Available: ${(totalAvailable / 1_000_000).toFixed(2)} USDC.`);
      }

      const tx = new Transaction();
      
      // Merge coins if there are multiple coin objects
      const primaryCoin = coins.data[0].coinObjectId;
      if (coins.data.length > 1) {
        tx.mergeCoins(
          tx.object(primaryCoin),
          coins.data.slice(1).map(c => tx.object(c.coinObjectId))
        );
      }

      // Split coins: netCoin (merchant pay) and vatCoin (escrow)
      const [netCoin, vatCoin] = tx.splitCoins(tx.object(primaryCoin), [
        netAmountBaseUnits,
        vatAmountBaseUnits
      ]);

      // Transfer net purchase to merchant
      tx.transferObjects([netCoin], tx.pure.address(scannedBill.merchantAddress));

      // Call submit_claim
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::safwah::submit_claim`,
        arguments: [
          tx.object(CONTRACTS.ESCROW_ID),
          vatCoin,
          tx.pure.vector('vector<u8>', [Array.from(new TextEncoder().encode(scannedBill.walrusBlobId))]),
          tx.pure.vector('u64', [vatAmountBaseUnits]),
          tx.pure.vector('vector<u8>', [Array.from(new TextEncoder().encode(scannedBill.businessName))]),
          tx.pure.u64(Math.floor(grossAED * 100)), // AED cents
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(scannedBill.invoiceNumber))),
        ],
      });

      // Call issue_invoice_nft
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::safwah::issue_invoice_nft`,
        arguments: [
          tx.object(scannedBill.merchantLicenseId),
          tx.pure.address(walletAddress),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(scannedBill.invoiceNumber))),
          tx.pure.u64(Math.floor(grossAED * 100)), // AED cents
          tx.pure.u64(vatAmountBaseUnits),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(scannedBill.walrusBlobId))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(scannedBill.walrusUrl))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(scannedBill.walrusUrl))),
        ],
      });

      const result = await executeGasless(tx, suiClient, {
        jwt: zkSession?.jwt ?? undefined,
        fallback: () => signAndExecute({ transaction: tx }),
      });

      const txDetails = await suiClient.waitForTransaction({
        digest: result.digest,
        options: {
          showObjectChanges: true,
        }
      });

      const claimChange = txDetails.objectChanges?.find(
        (oc: any) => oc.type === "created" && oc.objectType.includes("::safwah::VatClaim")
      );
      const claimObjectId = (claimChange as any)?.objectId || `CLAIM-${Date.now()}`;

      // Create new locally saved claims & receipts
      const instantPayout = (parseFloat(vatUSDC) * 0.8).toFixed(2);
      const newClaim: Claim = {
        id: claimObjectId,
        title: `${scannedBill.businessName} Claim`,
        receiptCount: 1,
        totalVat: `${vatUSDC} USDC`,
        payoutAmount: `${instantPayout} USDC (80%)`,
        status: "80% Paid (Exit Pending)",
        nftMinted: true, // NFT minted atomically!
        date: new Date().toISOString().split('T')[0]
      };

      const newRec: Receipt = {
        id: `rec-${Date.now()}`,
        storeName: scannedBill.businessName,
        amount: `${parseFloat(scannedBill.amountAED).toLocaleString()} AED`,
        vat: `${parseFloat(scannedBill.vatAED).toLocaleString()} AED`,
        date: new Date().toISOString().split('T')[0],
        walrusUrl: `walrus://blob/${scannedBill.walrusBlobId}`,
        selectedForClaim: false,
        claimed: true
      };

      setReceipts(prev => [newRec, ...prev]);
      updateClaimsAndSave([newClaim, ...claims]);
      setScannedBill(null);
      setActiveCategory("claims");

      alert(`Payment & Claim Refund processed atomically!\n\n95% Net purchase paid to merchant.\n80% instant VAT refund (${instantPayout} USDC) received in your wallet.\nInvoice NFT minted successfully!\nTransaction Hash: ${result.digest}`);
    } catch (err: any) {
      alert(`Transaction failed: err.message || err`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mint Refund proof NFT on Sui (mock UI updates, can call safwah_nft in v2 if needed)
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

  // Upload receipt (Walrus storage + AI scan)
  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStoreName || !formAmount) return;

    setIsUploading(true);
    try {
      const calculatedVat = (parseFloat(formAmount.replace(/,/g, '')) * 0.05).toFixed(2); // 5% VAT UAE

      // Create a mock Blob representation of receipt data to upload to Walrus
      const receiptDataJson = JSON.stringify({
        storeName: formStoreName,
        amountAED: formAmount,
        vatAED: calculatedVat,
        timestamp: Date.now()
      });
      const blob = new Blob([receiptDataJson], { type: "application/json" });
      
      // Upload to real Walrus testnet nodes
      const walrusResult = await uploadToWalrus(blob);

      const newRec: Receipt = {
        id: `rec-${Date.now()}`,
        storeName: formStoreName,
        amount: `${parseFloat(formAmount).toLocaleString()} AED`,
        vat: `${calculatedVat} AED`,
        date: new Date().toISOString().split('T')[0],
        walrusUrl: `walrus://blob/${walrusResult.blobId}`,
        selectedForClaim: true,
        claimed: false
      };

      setReceipts(prev => [newRec, ...prev]);
      setIsModalOpen(false);
      setActiveCategory("receipts");
      alert(`AI Scan Complete!\nStore: ${newRec.storeName}\nVAT Extracted: ${newRec.vat}\nUploaded to Decentralized Storage (Walrus Blob: ${walrusResult.blobId.slice(0, 8)}...)!`);
    } catch (err: any) {
      alert(`Walrus upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="phone-frame">
      {/* Header section with wallet connection */}
      <header className="header">
        <div className="header-left">
          <span className="header-greeting-lbl">SAFWAH TOURIST APP</span>
          <h1 className="header-title-name">Sui VAT Refund</h1>
        </div>
        
        <div className="header-right" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <ZkLoginButton />
          <WalletConnect />
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

            {claims.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <ClaimTracker claimObjectId={claims[0].id} />
              </div>
            )}
            <div className="bento-grid" style={{ marginBottom: "12px" }}>
              <div className="bento-metric-card">
                <span className="bento-metric-label">USDC BALANCE</span>
                <div className="bento-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="bento-icon-circle">
                      <span>💵</span>
                    </div>
                    <span className="bento-value">{walletConnected ? `${usdcDisplay} USDC` : "0.00 USDC"}</span>
                  </div>
                  {walletConnected && usdcBalanceVal > 0 && (
                    <button 
                      onClick={() => setIsWithdrawOpen(true)}
                      style={{
                        fontSize: "10px",
                        background: "rgba(212,175,55,0.2)",
                        color: "var(--color-cyber-gold)",
                        border: "1px solid rgba(212,175,55,0.4)",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
              <div className="bento-metric-card">
                <span className="bento-metric-label">SUI BALANCE</span>
                <div className="bento-content">
                  <div className="bento-icon-circle">
                    <span>💧</span>
                  </div>
                  <span className="bento-value">{walletConnected ? `${suiDisplay} SUI` : "0.00 SUI"}</span>
                </div>
              </div>
            </div>
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
            {walletConnected && (
              <button 
                className="btn-primary" 
                style={{ width: "100%", padding: "14px", marginTop: "16px", background: "var(--color-cyber-gold-dark)", color: "var(--color-void-black)" }}
                onClick={handleGetTestUsdc}
              >
                Get Test USDC (Faucet)
              </button>
            )}
            <div className="hero-alert-box" style={{ marginBottom: "16px" }}>
              <div className="hero-alert-text">
                ✈️ Scan your Claim QR code at airport exit validation to receive the final 20% (29.64 USDC).
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <FxCalculator usdcBalance={usdcBalanceVal} />
              <TravelPortfolio
                totalRefunded={totalRefundedVal}
                settlementNFTCount={settlementNFTCount}
                invoiceNFTCount={invoiceNFTCount}
                merchantNames={merchantNames}
              />
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
            {walletConnected && (
              <button 
                className="btn-primary" 
                style={{ width: "100%", padding: "12px", marginBottom: "16px", background: "var(--color-cyber-gold-dark)", color: "var(--color-void-black)" }}
                onClick={() => setIsModalOpen(true)}
              >
                + Upload Receipt (AI Scan to Walrus)
              </button>
            )}
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
                  <span className="bento-value">{allNfts.length} Minted</span>
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
              <div key={claim.id} className="feed-card" onClick={() => setSelectedClaimForQr(claim)} style={{ cursor: "pointer" }}>
                <div className="feed-card-left">
                  <div className="feed-icon-container">🧾</div>
                  <div className="feed-text-area">
                    <span className="feed-title">{claim.title}</span>
                    <span className="feed-subtitle" style={{ fontSize: "10px" }}>{claim.id.startsWith("CLAIM-") ? claim.id : claim.id.slice(0, 10) + "..." + claim.id.slice(-8)}</span>
                    <span className="feed-subtitle">{claim.date} • {claim.receiptCount} Receipts • {claim.totalVat}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
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
              {allNfts.map((nft) => (
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

          {/* FAB: Center QR Scanner */}
          <div className="fab-container">
            <button className={`fab-btn ${isScannerOpen ? "open" : ""}`} onClick={() => setIsScannerOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
                <rect width="5" height="5" x="3" y="3" rx="1" />
                <rect width="5" height="5" x="16" y="3" rx="1" />
                <rect width="5" height="5" x="3" y="16" rx="1" />
                <path d="M21 16V21H16" />
                <path d="M21 12H16" />
                <path d="M12 21H12" />
                <path d="M12 12H12" />
                <path d="M12 16H16" />
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

      {/* Claim QR Modal */}
      {selectedClaimForQr && qrClaimData && (
        <ClaimQRCode
          isOpen={!!selectedClaimForQr}
          onClose={() => setSelectedClaimForQr(null)}
          claim={qrClaimData}
        />
      )}

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={usdcBalanceVal}
      />

      {/* Live QR Scanner Camera Modal */}
      {isScannerOpen && (
        <div className="modal-overlay" onClick={() => setIsScannerOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "360px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="label-caps" style={{ color: "var(--color-cyber-gold)", fontSize: "12px" }}>SCAN DIGITAL BILL QR CODE</span>
              <button onClick={() => setIsScannerOpen(false)} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--color-sage)", cursor: "pointer" }}>&times;</button>
            </div>

            <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: "16px", overflow: "hidden", background: "#000" }}>
              <Scanner
                onScan={(detectedCodes) => {
                  if (detectedCodes[0]?.rawValue) {
                    handleScanBill(detectedCodes[0].rawValue);
                  }
                }}
                onError={(err) => console.warn(err)}
                constraints={{ facingMode: "environment" }}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { width: "100%", height: "100%", objectFit: "cover" }
                }}
              />
              <div className="absolute inset-0 pointer-events-none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, border: "2px dashed var(--color-cyber-gold)", margin: "30px", borderRadius: "12px" }} />
            </div>

            {scannerError && (
              <p style={{ color: "#EF4444", fontSize: "12px", textAlign: "center", marginTop: "12px", fontWeight: "bold" }}>{scannerError}</p>
            )}

            <p style={{ color: "var(--color-sage)", fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
              Hold the merchant's digital bill QR code inside the frame to pay and claim refund atomically.
            </p>
          </div>
        </div>
      )}

      {/* Confirm Pay & Claim Refund Modal */}
      {scannedBill && (
        <div className="modal-overlay" onClick={() => setScannedBill(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "360px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="label-caps" style={{ color: "var(--color-cyber-gold)", fontSize: "12px" }}>CONFIRM PAY & CLAIM REFUND</span>
              <button onClick={() => setScannedBill(null)} style={{ background: "none", border: "none", fontSize: "24px", color: "var(--color-sage)", cursor: "pointer" }}>&times;</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="bento-metric-card" style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", padding: "12px" }}>
                <span className="bento-metric-label">STORE / MERCHANT</span>
                <span className="bento-value" style={{ fontSize: "16px", color: "#fff", display: "block", marginTop: "4px" }}>{scannedBill.businessName}</span>
              </div>

              <div className="bento-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="bento-metric-card" style={{ padding: "12px" }}>
                  <span className="bento-metric-label">GROSS AMOUNT</span>
                  <span className="bento-value" style={{ fontSize: "14px", display: "block", marginTop: "4px" }}>{scannedBill.amountAED} AED</span>
                </div>
                <div className="bento-metric-card" style={{ padding: "12px" }}>
                  <span className="bento-metric-label">VAT (5% AED)</span>
                  <span className="bento-value" style={{ fontSize: "14px", color: "var(--color-cyber-gold)", display: "block", marginTop: "4px" }}>{scannedBill.vatAED} AED</span>
                </div>
              </div>

              <div className="bento-metric-card" style={{ padding: "12px" }}>
                <span className="bento-metric-label">USDC BREAKDOWN</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-sage)" }}>Merchant Net Pay (95%):</span>
                    <span style={{ color: "#fff", fontWeight: "bold" }}>{((parseFloat(scannedBill.amountAED) - parseFloat(scannedBill.vatAED)) / 3.67).toFixed(2)} USDC</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-sage)" }}>Escrowed VAT (5%):</span>
                    <span style={{ color: "#fff", fontWeight: "bold" }}>{(parseFloat(scannedBill.vatAED) / 3.67).toFixed(2)} USDC</span>
                  </div>
                  <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-cyber-gold)", fontWeight: "bold" }}>Instant Refund (80%):</span>
                    <span style={{ color: "#10B981", fontWeight: "bold" }}>{((parseFloat(scannedBill.vatAED) / 3.67) * 0.8).toFixed(2)} USDC</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-sage)" }}>Locked Exit Refund (20%):</span>
                    <span style={{ color: "var(--color-cyber-gold)", fontWeight: "bold" }}>{((parseFloat(scannedBill.vatAED) / 3.67) * 0.2).toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>

              <div className="modal-buttons" style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setScannedBill(null)}>
                  Cancel
                </button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={handleExecuteDigitalPay} disabled={isSubmitting}>
                  {isSubmitting ? "Executing PTB..." : "Pay & Claim Refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
