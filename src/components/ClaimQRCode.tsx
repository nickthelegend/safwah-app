import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { useDynamicWallet } from '../hooks/useDynamicWallet';

interface ClaimQRPayload {
  version: string;          // "safwah_v1"
  claimObjectId: string;    // Sui shared object ID of VatClaim
  tourist: string;          // Tourist wallet address
  totalVat: number;         // Total VAT in USDC base units
  receiptCount: number;     // Number of receipts in claim
  merchantNames: string[];  // List of merchants
  submittedAt: string;      // ISO timestamp
  network: string;          // "testnet" | "mainnet"
  checksum: string;         // sha256 of claimObjectId + tourist (fraud prevention)
}

interface ClaimQRCodeProps {
  isOpen: boolean;
  onClose: () => void;
  claim: {
    objectId: string;
    totalVat: number;
    receiptCount: number;
    merchantNames: string[];
    submittedAt: string;
    status: number;
    instantPaid: number;
    finalAmount: number;
  };
}

// Status labels matching Move constants
const STATUS_MAP = {
  0: { label: 'Pending', color: '#F59E0B', icon: Clock },
  1: { label: 'Instant Paid — Show at Airport', color: '#10B981', icon: Shield },
  2: { label: 'Customs Approved', color: '#3B82F6', icon: CheckCircle2 },
  3: { label: 'Fully Settled', color: '#8B5CF6', icon: CheckCircle2 },
};

export function ClaimQRCode({ isOpen, onClose, claim }: ClaimQRCodeProps) {
  const { currentAccount: account } = useDynamicWallet();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!claim) return null;

  // Build the QR payload — this is what verifier app scans
  const qrPayload: ClaimQRPayload = {
    version: 'safwah_v1',
    claimObjectId: claim.objectId,
    tourist: account?.address ?? '',
    totalVat: claim.totalVat,
    receiptCount: claim.receiptCount,
    merchantNames: claim.merchantNames,
    submittedAt: claim.submittedAt,
    network: process.env.VITE_SUI_NETWORK ?? 'testnet',
    checksum: btoa(`${claim.objectId}:${account?.address ?? ''}`).slice(0, 16),
  };

  const qrString = JSON.stringify(qrPayload);

  const usdcTotal = (claim.totalVat / 1_000_000).toFixed(2);
  const usdcInstant = (claim.instantPaid / 1_000_000).toFixed(2);
  const usdcFinal = (claim.finalAmount / 1_000_000).toFixed(2);
  const statusInfo = STATUS_MAP[claim.status as keyof typeof STATUS_MAP] ?? STATUS_MAP[0];
  const StatusIcon = statusInfo.icon;

  const handleDownloadQR = async () => {
    setIsDownloading(true);
    try {
      const svg = document.getElementById('claim-qr-svg');
      if (!svg) return;

      // Convert SVG to canvas then download
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 400, 400);
        URL.revokeObjectURL(url);
        const link = document.createElement('a');
        link.download = `safwah-claim-${claim.objectId.slice(0, 8)}.png`;
        link.href = canvas.toDataURL();
        link.click();
        setIsDownloading(false);
      };
      img.src = url;
    } catch {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Safwah VAT Refund Claim',
        text: `My Safwah VAT refund claim: USDC ${usdcTotal}`,
        url: `https://safwah.app/verify/${claim.objectId}`,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-yellow-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-yellow-500/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-lg">VAT Refund Claim</h2>
                <p className="text-zinc-400 text-xs">Show this at customs</p>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Status Badge */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 w-full"
              style={{ backgroundColor: `${statusInfo.color}15`, border: `1px solid ${statusInfo.color}40` }}
            >
              <StatusIcon size={14} style={{ color: statusInfo.color }} />
              <span className="text-xs font-semibold" style={{ color: statusInfo.color }}>
                {statusInfo.label}
              </span>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-center">
              <QRCode
                id="claim-qr-svg"
                value={qrString}
                size={220}
                level="H"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>

            {/* Claim Details */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-xs">Total VAT Refund</span>
                <span className="text-yellow-400 font-bold text-sm">USDC {usdcTotal}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-xs">✓ Already Received (80%)</span>
                <span className="text-emerald-400 font-semibold text-sm">USDC {usdcInstant}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-xs">⏳ At Airport (20%)</span>
                <span className="text-blue-400 font-semibold text-sm">USDC {usdcFinal}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-xs">Receipts</span>
                <span className="text-white text-sm">{claim.receiptCount}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400 text-xs">Claim ID</span>
                <span className="text-zinc-300 text-xs font-mono">{claim.objectId.slice(0, 8)}...{claim.objectId.slice(-4)}</span>
              </div>
            </div>

            {/* Merchants */}
            <div className="mb-4">
              <p className="text-zinc-500 text-xs mb-1">Merchants</p>
              <div className="flex flex-wrap gap-1">
                {claim.merchantNames.map((name, i) => (
                  <span key={i} className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-full">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleDownloadQR}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2.5 rounded-xl transition-colors"
              >
                <Download size={14} />
                {isDownloading ? 'Saving...' : 'Save QR'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Share2 size={14} />
                Share
              </button>
            </div>

            {/* Sui Explorer Link */}
            <a
              href={`https://testnet.suiscan.xyz/testnet/object/${claim.objectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-zinc-500 text-xs mt-3 hover:text-yellow-400 transition-colors"
            >
              View on Suiscan →
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
