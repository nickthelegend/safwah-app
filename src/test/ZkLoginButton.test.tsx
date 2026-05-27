import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ZkLoginButton } from '../components/ZkLoginButton';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock enoki flow
const mockCreateAuthorizationURL = vi.fn();
const mockLogout = vi.fn();

vi.mock('@mysten/enoki/react', () => ({
  useEnokiFlow: () => ({
    createAuthorizationURL: mockCreateAuthorizationURL,
    logout: mockLogout,
  }),
  useZkLogin: () => ({
    address: null,
  }),
  useZkLoginSession: () => ({
    jwt: null,
  }),
}));

describe('ZkLoginButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders Google sign-in button when not logged in', () => {
    render(<ZkLoginButton />);
    expect(screen.getByText('Sign In with Google')).toBeInTheDocument();
  });

  test('calls createAuthorizationURL on click when not logged in', async () => {
    mockCreateAuthorizationURL.mockResolvedValue('https://google.com/oauth');
    
    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(<ZkLoginButton />);
    const button = screen.getByText('Sign In with Google');
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockCreateAuthorizationURL).toHaveBeenCalledWith({
      provider: 'google',
      clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUrl: window.location.origin,
    });
    
    window.location = originalLocation;
  });
});
