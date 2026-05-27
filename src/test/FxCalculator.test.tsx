import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FxCalculator } from '../components/FxCalculator';
import '@testing-library/jest-dom';

describe('FxCalculator Component', () => {
  const mockBalance = 100000000; // 100 USDC

  test('renders exchange calculator title and balance', () => {
    render(<FxCalculator usdcBalance={mockBalance} />);
    expect(screen.getByText('FX Calculator & Remittance')).toBeInTheDocument();
    expect(screen.getByText('Avail. Balance: USDC 100.00')).toBeInTheDocument();
  });

  test('allows typing send amount and displays conversion details', () => {
    render(<FxCalculator usdcBalance={mockBalance} />);
    
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '10' } });

    // Verify fee calculations
    // 10 USDC -> 5% fee is 0.50 USDC, off-ramp fee is 0.50 USDC. Net is 9.00 USDC.
    // Exchange rate AED is 3.673 -> 9 * 3.673 = 33.057 AED
    expect(screen.getByText('You send')).toBeInTheDocument();
    expect(screen.getByText('USDC 10.00')).toBeInTheDocument();
    expect(screen.getByText('Sui Protocol fee (5%)')).toBeInTheDocument();
    expect(screen.getAllByText('− USDC 0.50')).toHaveLength(2);
    expect(screen.getByText('Recipient gets')).toBeInTheDocument();
    expect(screen.getByText('🇦🇪 33.06 AED')).toBeInTheDocument();
  });

  test('allows switching currency and recalculates output', () => {
    render(<FxCalculator usdcBalance={mockBalance} />);
    
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '10' } });

    // Click INR flag button
    const inrBtn = screen.getByText('INR');
    fireEvent.click(inrBtn);

    // INR rate is 83.12 -> 9 * 83.12 = 748.08 INR
    expect(screen.getByText('🇮🇳 748.08 INR')).toBeInTheDocument();
  });

  test('clicking Use Max sets amount to max available balance', () => {
    render(<FxCalculator usdcBalance={mockBalance} />);
    
    const useMaxBtn = screen.getByText('Use Max');
    fireEvent.click(useMaxBtn);

    const input = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(input.value).toBe('100.00');
  });
});
