import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ClaimTracker } from '../components/ClaimTracker';
import React from 'react';

vi.mock('@mysten/dapp-kit', () => ({
  useSuiClient: () => ({
    getObject: vi.fn().mockResolvedValue({
      data: {
        content: {
          fields: {
            status: '1',
            instant_amount: '8000000',
            final_amount: '2000000',
            total_vat_amount: '10000000',
          },
        },
      },
    }),
  }),
}));

describe('ClaimTracker', () => {
  it('renders all 4 timeline steps', async () => {
    render(<ClaimTracker claimObjectId="0xtest123" />);
    expect(screen.getByText('Claim Submitted')).toBeInTheDocument();
    expect(screen.getByText('80% USDC Paid')).toBeInTheDocument();
    expect(screen.getByText('Customs Approved')).toBeInTheDocument();
    expect(screen.getByText('Fully Settled')).toBeInTheDocument();
  });

  it('shows refresh button', () => {
    render(<ClaimTracker claimObjectId="0xtest" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays claim progress heading', () => {
    render(<ClaimTracker claimObjectId="0xtest" />);
    expect(screen.getByText('Claim Progress')).toBeInTheDocument();
  });
});
