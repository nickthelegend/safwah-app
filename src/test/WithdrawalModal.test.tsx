import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WithdrawalModal } from '../components/WithdrawalModal';
import { vi, describe, test, expect } from 'vitest';
import '@testing-library/jest-dom';

// Mock Sui kit and react components
vi.mock('@mysten/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutateAsync: vi.fn() }),
  useCurrentAccount: () => ({ address: '0x1234567890123456789012345678901234567890' }),
  useSuiClient: () => ({ getCoins: vi.fn() }),
}));

vi.mock('@mysten/enoki/react', () => ({
  useEnokiFlow: () => ({ getKeypair: vi.fn() }),
  useZkLogin: () => ({ address: '0x123456' }),
  useZkLoginSession: () => ({ jwt: 'test-jwt' }),
}));

vi.mock('../lib/gasless', () => ({
  useGaslessTransaction: () => ({ executeGasless: vi.fn() }),
}));

describe('WithdrawalModal Component', () => {
  const mockBalance = 50000000; // 50 USDC

  test('renders method selection list when open', () => {
    const handleClose = vi.fn();
    render(<WithdrawalModal isOpen={true} onClose={handleClose} availableBalance={mockBalance} />);

    expect(screen.getByText('Withdraw Funds')).toBeInTheDocument();
    expect(screen.getByText('Available: USDC 50.00')).toBeInTheDocument();
    expect(screen.getByText('Visa / Mastercard')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    expect(screen.getByText('Crypto Wallet')).toBeInTheDocument();
  });

  test('advances to amount step when method is chosen', () => {
    const handleClose = vi.fn();
    render(<WithdrawalModal isOpen={true} onClose={handleClose} availableBalance={mockBalance} />);

    const visaBtn = screen.getByText('Visa / Mastercard');
    fireEvent.click(visaBtn);

    expect(screen.getByText('Amount to withdraw (USDC)')).toBeInTheDocument();
  });
});
