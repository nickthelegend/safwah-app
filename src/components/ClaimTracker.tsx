import React, { useEffect, useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Shield, Star, RefreshCw } from 'lucide-react';

interface ClaimTrackerProps {
  claimObjectId: string;
}

const TIMELINE_STEPS = [
  { status: 1, label: 'Claim Submitted', sublabel: 'Verified on Sui blockchain', icon: CheckCircle2, color: '#10B981' },
  { status: 1, label: '80% USDC Paid', sublabel: 'Instant refund to your wallet', icon: CheckCircle2, color: '#10B981' },
  { status: 2, label: 'Customs Approved', sublabel: 'Airport officer verified exit', icon: Shield, color: '#3B82F6' },
  { status: 3, label: 'Fully Settled', sublabel: '20% final payment + NFT minted', icon: Star, color: '#F59E0B' },
];

export function ClaimTracker({ claimObjectId }: ClaimTrackerProps) {
  const [claimStatus, setClaimStatus] = useState<number>(1);
  const [claimData, setClaimData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const suiClient = useSuiClient();

  const fetchClaim = async () => {
    if (!claimObjectId || claimObjectId.startsWith('CLAIM-')) return;
    setIsRefreshing(true);
    try {
      const obj = await suiClient.getObject({
        id: claimObjectId,
        options: { showContent: true },
      });
      const fields = (obj.data?.content as any)?.fields;
      if (fields) {
        setClaimStatus(Number(fields.status));
        setClaimData(fields);
      }
    } catch (err) {
      console.error('Failed to fetch claim:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClaim();
    const interval = setInterval(fetchClaim, 5000);
    return () => clearInterval(interval);
  }, [claimObjectId]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-sm">Claim Progress</h3>
        <button
          onClick={fetchClaim}
          disabled={isRefreshing}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-4">
        {TIMELINE_STEPS.map((step, index) => {
          const isStepCompleted = (index === 0 || index === 1) ? claimStatus >= 1 : claimStatus >= step.status;
          const isCurrent = (index === 0 || index === 1) ? claimStatus === 1 : claimStatus === step.status;
          
          const Icon = step.icon;

          return (
            <div key={index} className="flex gap-3">
              {/* Timeline line + icon */}
              <div className="flex flex-col items-center">
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0"
                  style={{
                    backgroundColor: isStepCompleted ? `${step.color}20` : 'transparent',
                    borderColor: isStepCompleted ? step.color : '#3F3F46',
                  }}
                >
                  {isStepCompleted ? (
                    <Icon size={14} style={{ color: step.color }} />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-zinc-600" />
                  )}
                </motion.div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className="w-0.5 h-8 mt-1"
                    style={{ backgroundColor: isStepCompleted ? step.color : '#3F3F46' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-8 flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: isStepCompleted || isCurrent ? 'white' : '#52525B' }}
                >
                  {step.label}
                </p>
                <p className="text-xs" style={{ color: isStepCompleted || isCurrent ? '#A1A1AA' : '#3F3F46' }}>
                  {step.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
