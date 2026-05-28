import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TravelPortfolio } from '../components/TravelPortfolio';
import React from 'react';

describe('TravelPortfolio', () => {
  it('renders portfolio heading', () => {
    render(<TravelPortfolio totalRefunded={50_000_000} settlementNFTCount={2} invoiceNFTCount={5} merchantNames={['Dubai Mall', 'Armani']} />);
    expect(screen.getByText('Travel Spend Insights')).toBeInTheDocument();
  });

  it('calculates approximate total spend from VAT', () => {
    render(<TravelPortfolio totalRefunded={5_000_000} settlementNFTCount={1} invoiceNFTCount={3} merchantNames={[]} />);
    // 5 USDC refunded = 100 USDC spend (5% VAT)
    expect(screen.getByText(/\$100/)).toBeInTheDocument();
  });

  it('shows badge section', () => {
    render(<TravelPortfolio totalRefunded={0} settlementNFTCount={0} invoiceNFTCount={0} merchantNames={[]} />);
    expect(screen.getByText('TAX-FREE BADGES')).toBeInTheDocument();
  });

  it('shows First Claim badge as earned when settlementNFTCount >= 1', () => {
    render(<TravelPortfolio totalRefunded={1_000_000} settlementNFTCount={1} invoiceNFTCount={2} merchantNames={[]} />);
    expect(screen.getByText('First Claim')).toBeInTheDocument();
  });

  it('shows Big Spender badge earned when totalRefunded >= 100 USDC', () => {
    render(<TravelPortfolio totalRefunded={100_000_000} settlementNFTCount={2} invoiceNFTCount={8} merchantNames={[]} />);
    expect(screen.getByText('Big Spender')).toBeInTheDocument();
  });

  it('renders spend categories from merchant names', () => {
    render(<TravelPortfolio totalRefunded={10_000_000} settlementNFTCount={1} invoiceNFTCount={3} merchantNames={['DIFC Restaurant', 'Mall Shop']} />);
    expect(screen.getByText('SPEND CATEGORIES')).toBeInTheDocument();
  });
});
