import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Building2, Bitcoin, Globe, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACTS } from '../lib/contracts';
import { toast } from 'sonner';


const WITHDRAWAL_METHODS = [
  {
    id: 0,
    key: 'visa',
    label: 'Visa / Mastercard',
    icon: CreditCard,
    description: 'Instant to your card',
    eta: '< 2 minutes',
    color: '#3B82F6',
    fields: [
      { key: 'cardNumber', label: 'Card Number (last 4)', placeholder: '4242', maxLength: 4 },
      { key: 'cardHolder', label: 'Cardholder Name', placeholder: 'John Doe' },
    ],
  },
  {
    id: 1,
    key: 'bank',
    label: 'Bank Transfer',
    icon: Building2,
    description: 'SWIFT / IBAN transfer',
    eta: '1–3 business days',
    color: '#10B981',
    fields: [
      { key: 'iban', label: 'IBAN', placeholder: 'AE070331234567890123456' },
      { key: 'bankName', label: 'Bank Name', placeholder: 'Emirates NBD' },
      { key: 'swiftCode', label: 'SWIFT Code', placeholder: 'EBILAEAD' },
    ],
  },
  {
    id: 2,
    key: 'crypto',
    label: 'Crypto Wallet',
    icon: Bitcoin,
    description: 'Send to any wallet',
    eta: '< 1 minute',
    color: '#F59E0B',
    fields: [
      { key: 'walletAddress', label: 'Destination Address', placeholder: '0x...' },
      { key: 'network', label: 'Network', placeholder: 'Ethereum, Sui, Solana...' },
    ],
  },
  {
    id: 3,
    key: 'remittance',
    label: 'Send to Family',
    icon: Globe,
    description: 'Remittance to 100+ countries',
    eta: '< 1 hour',
    color: '#8B5CF6',
    fields: [
      { key: 'phone', label: 'Recipient Phone', placeholder: '+91 98765 43210' },
      { key: 'country', label: 'Country', placeholder: 'India' },
      { key: 'recipientName', label: 'Recipient Name', placeholder: 'Priya Sharma' },
    ],
  },
];

const FEE_BPS = 500;  // 5%

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;  // USDC base units
}

export function WithdrawalModal({ isOpen, onClose, availableBalance }: WithdrawalModalProps) {
  const [step, setStep] = useState<'method' | 'amount' | 'details' | 'confirm' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<typeof WITHDRAWAL_METHODS[0] | null>(null);
  const [amount, setAmount] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [txDigest, setTxDigest] = useState('');

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();


  const amountUsdc = parseFloat(amount) || 0;
  const amountBase = Math.floor(amountUsdc * 1_000_000);
  const feeBase = Math.floor(amountBase * FEE_BPS / 10000);
  const netBase = amountBase - feeBase;
  const feeUsdc = (feeBase / 1_000_000).toFixed(2);
  const netUsdc = (netBase / 1_000_000).toFixed(2);
  const availableUsdc = (availableBalance / 1_000_000).toFixed(2);

  const destinationString = selectedMethod?.fields
    .map(f => `${f.key}:${fieldValues[f.key] ?? ''}`)
    .join('|') ?? '';

  const handleWithdraw = async () => {
    const address = account?.address;
    if (!address || !selectedMethod) return;
    setIsProcessing(true);
    try {
      // Get USDC coins
      const coins = await suiClient.getCoins({
        owner: address,
        coinType: CONTRACTS.USDC_COIN_TYPE,
      });
      if (coins.data.length === 0) throw new Error('No USDC balance');

      const tx = new Transaction();
      const primaryCoin = coins.data[0].coinObjectId;
      if (coins.data.length > 1) {
        tx.mergeCoins(tx.object(primaryCoin), coins.data.slice(1).map(c => tx.object(c.coinObjectId)));
      }
      const [withdrawCoin] = tx.splitCoins(tx.object(primaryCoin), [amountBase]);

      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::safwah_treasury::initiate_withdrawal`,
        arguments: [
          tx.object(CONTRACTS.TREASURY_ID),
          withdrawCoin,
          tx.pure.u8(selectedMethod.id),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(destinationString))),
        ],
      });

      const result = await signAndExecute({ transaction: tx });
      setTxDigest(result.digest);
      setStep('success');
    } catch (err: any) {
      toast.error(err.message ?? 'Withdrawal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setStep('method');
    setSelectedMethod(null);
    setAmount('');
    setFieldValues({});
    setTxDigest('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-white font-bold text-lg">Withdraw Funds</h2>
                <p className="text-zinc-400 text-xs">Available: USDC {availableUsdc}</p>
              </div>
              <button onClick={reset} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">

              {/* Step: Method Selection */}
              {step === 'method' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-zinc-400 text-sm mb-4">Where do you want to send your USDC?</p>
                  {WITHDRAWAL_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.key}
                        onClick={() => { setSelectedMethod(method); setStep('amount'); }}
                        className="w-full flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 rounded-2xl p-4 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${method.color}20` }}>
                          <Icon size={18} style={{ color: method.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{method.label}</p>
                          <p className="text-zinc-400 text-xs">{method.description} · ETA: {method.eta}</p>
                        </div>
                        <ArrowRight size={16} className="text-zinc-500" />
                      </button>
                    );
                  })}
                  {/* Fee Notice */}
                  <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 mt-2">
                    <Info size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-yellow-300 text-xs">A 5% processing fee applies to all withdrawals. This supports the Safwah protocol.</p>
                  </div>
                </motion.div>
              )}

              {/* Step: Amount */}
              {step === 'amount' && selectedMethod && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <button onClick={() => setStep('method')} className="text-zinc-400 text-xs hover:text-white">← Back</button>

                  <div className="bg-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-400 text-xs mb-2">Amount to withdraw (USDC)</p>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      max={availableBalance / 1_000_000}
                      className="w-full bg-transparent text-white text-3xl font-bold outline-none placeholder-zinc-600"
                    />
                    <div className="flex gap-2 mt-3">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          onClick={() => setAmount(((availableBalance / 1_000_000) * pct / 100).toFixed(2))}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 rounded-lg transition-colors"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {amountUsdc > 0 && (
                    <div className="space-y-2">
                      {[
                        { label: 'You send', value: `USDC ${amountUsdc.toFixed(2)}`, color: 'text-white' },
                        { label: 'Safwah fee (5%)', value: `− USDC ${feeUsdc}`, color: 'text-red-400' },
                        { label: 'You receive', value: `USDC ${netUsdc}`, color: 'text-emerald-400 font-bold' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between text-sm">
                          <span className="text-zinc-400">{row.label}</span>
                          <span className={row.color}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setStep('details')}
                    disabled={amountUsdc <= 0 || amountBase > availableBalance}
                    className="w-full bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {/* Step: Details */}
              {step === 'details' && selectedMethod && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <button onClick={() => setStep('amount')} className="text-zinc-400 text-xs hover:text-white">← Back</button>
                  <p className="text-white font-semibold">{selectedMethod.label} Details</p>
                  {selectedMethod.fields.map(field => (
                    <div key={field.key}>
                      <label className="text-zinc-400 text-xs block mb-1.5">{field.label}</label>
                      <input
                        type="text"
                        value={fieldValues[field.key] ?? ''}
                        onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        maxLength={(field as any).maxLength}
                        className="w-full bg-zinc-800 border border-zinc-700 focus:border-yellow-500 text-white px-4 py-3 rounded-xl outline-none text-sm transition-colors"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setStep('confirm')}
                    disabled={selectedMethod.fields.some(f => !fieldValues[f.key])}
                    className="w-full bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors"
                  >
                    Review Withdrawal
                  </button>
                </motion.div>
              )}

              {/* Step: Confirm */}
              {step === 'confirm' && selectedMethod && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p className="text-white font-semibold">Confirm Withdrawal</p>
                  <div className="bg-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between"><span className="text-zinc-400 text-sm">Method</span><span className="text-white text-sm">{selectedMethod.label}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400 text-sm">Amount</span><span className="text-white text-sm">USDC {amountUsdc.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400 text-sm">Fee (5%)</span><span className="text-red-400 text-sm">− USDC {feeUsdc}</span></div>
                    <div className="border-t border-zinc-700 pt-3 flex justify-between"><span className="text-zinc-300 font-semibold">You receive</span><span className="text-emerald-400 font-bold">USDC {netUsdc}</span></div>
                  </div>
                  {selectedMethod.fields.map(field => (
                    <div key={field.key} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{field.label}</span>
                      <span className="text-white">{fieldValues[field.key]}</span>
                    </div>
                  ))}
                  <p className="text-zinc-500 text-xs">By proceeding, you authorize Safwah to process this withdrawal on-chain. The 5% fee supports protocol operations.</p>
                  <button
                    onClick={handleWithdraw}
                    disabled={isProcessing}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Processing...</>
                    ) : 'Confirm & Withdraw'}
                  </button>
                </motion.div>
              )}

              {/* Step: Success */}
              {step === 'success' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6 space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">Withdrawal Initiated!</p>
                    <p className="text-zinc-400 text-sm mt-1">USDC {netUsdc} is on its way</p>
                  </div>
                  <div className="bg-zinc-800 rounded-xl p-3">
                    <p className="text-zinc-400 text-xs mb-1">Transaction</p>
                    <a
                      href={`https://testnet.suiscan.xyz/testnet/tx/${txDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 text-xs font-mono hover:underline"
                    >
                      {txDigest.slice(0, 20)}...
                    </a>
                  </div>
                  <button onClick={reset} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl transition-colors">
                    Done
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
