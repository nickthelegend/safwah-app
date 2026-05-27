import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WithdrawalModal } from '../components/WithdrawalModal';
import '@testing-library/jest-dom';

// Mock Sui kit and react components
jest.mock('@mysten/dapp-kit', () => ({
  useSignAndExecuteTransaction: () => ({ mutateAsync: jest.fn() }),
  useCurrentAccount: () => ({ address: '0x1234567890123456789012345678901234567890' }),
  useSuiClient: () => ({ getCoins: jest.fn() }),
}));

jest.mock('@mysten/enoki/react', () => ({
  useEnokiFlow: () => ({ getKeypair: jest.fn() }),
  useZkLogin: () => ({ address: '0x123456' }),
  useZkLoginSession: () => ({ jwt: 'test-jwt' }),
}));

jest.mock('../lib/gasless', () => ({
  useGaslessTransaction: () => ({ executeGasless: jest.fn() }),
}));

describe('WithdrawalModal Component', () => {
  const mockBalance = 50000000; // 50 USDC

  test('renders method selection list when open', () => {
    const handleClose = jest.fn();
    render(<WithdrawalModal isOpen={true} onClose={handleClose} availableBalance={mockBalance} />);

    expect(screen.getByText('Withdraw Funds')).toBeInTheDocument();
    expect(screen.getByText('Available: USDC 50.00')).toBeInTheDocument();
    expect(screen.getByText('Visa / Mastercard')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    expect(screen.getByText('Crypto Wallet')).toBeInTheDocument();
  });

  test('advances to amount step when method is chosen', () => {
    const handleClose = jest.fn();
    render(<WithdrawalModal isOpen={true} onClose={handleClose} availableBalance={mockBalance} />);

    const visaBtn = screen.getByText('Visa / Mastercard');
    fireEvent.click(visaBtn);

    expect(screen.getByText('Amount to withdraw (USDC)')).toBeInTheDocument();
  });
});
