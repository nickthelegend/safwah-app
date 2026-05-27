import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClaimQRCode } from '../components/ClaimQRCode';
import { vi, describe, test, expect } from 'vitest';
import '@testing-library/jest-dom';

// Mock Sui kit and react-qr-code
vi.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: () => ({ address: '0x1234567890123456789012345678901234567890' }),
}));

vi.mock('react-qr-code', () => {
  return {
    default: function MockQRCode() {
      return <div data-testid="mock-qr-code" />;
    }
  };
});

describe('ClaimQRCode Component', () => {
  const mockClaim = {
    objectId: '0xabc123',
    totalVat: 10000000, // 10 USDC
    receiptCount: 3,
    merchantNames: ['Apple Store', 'Nike'],
    submittedAt: '2026-05-27T12:00:00Z',
    status: 1, // Instant Paid
    instantPaid: 8000000,
    finalAmount: 2000000,
  };

  test('renders claim details and QR code when open', () => {
    const handleClose = vi.fn();
    render(<ClaimQRCode isOpen={true} onClose={handleClose} claim={mockClaim} />);

    expect(screen.getByText('VAT Refund Claim')).toBeInTheDocument();
    expect(screen.getByText('USDC 10.00')).toBeInTheDocument();
    expect(screen.getByText('USDC 8.00')).toBeInTheDocument();
    expect(screen.getByText('USDC 2.00')).toBeInTheDocument();
    expect(screen.getByText('Apple Store')).toBeInTheDocument();
    expect(screen.getByText('Nike')).toBeInTheDocument();
    expect(screen.getByTestId('mock-qr-code')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<ClaimQRCode isOpen={true} onClose={handleClose} claim={mockClaim} />);

    const closeBtn = screen.getByRole('button', { name: '' }); // X close button
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
