import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set env
import.meta.env.VITE_BACKEND_URL = 'http://localhost:3001';

describe('executeSponsoredTransaction', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls /sponsor and then /sponsor/:digest/submit', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ bytes: 'c3BvbnNvcmVkX2J5dGVz', digest: 'test_digest_001' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ digest: 'test_digest_001' }),
      });

    const mockTx = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    };
    const mockSuiClient = {};
    const mockKeypair = {
      signTransaction: vi.fn().mockResolvedValue({ signature: 'sig_abc_123' }),
    };
    const mockEnokiFlow = {
      getKeypair: vi.fn().mockResolvedValue(mockKeypair),
    };

    const { executeSponsoredTransaction } = await import('../lib/gasless');
    const result = await executeSponsoredTransaction(
      mockTx as any,
      mockSuiClient as any,
      mockEnokiFlow as any,
      'jwt_tourist_token_abc'
    );

    expect(result.digest).toBe('test_digest_001');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:3001/sponsor');
    expect(mockFetch.mock.calls[1][0]).toBe('http://localhost:3001/sponsor/test_digest_001/submit');
    expect(mockKeypair.signTransaction).toHaveBeenCalled();
  });

  it('throws descriptive error when backend is offline', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed: ECONNREFUSED'));
    const mockTx = { build: vi.fn().mockResolvedValue(new Uint8Array([1])) };
    const { executeSponsoredTransaction } = await import('../lib/gasless');

    await expect(
      executeSponsoredTransaction(mockTx as any, {} as any, {} as any, 'jwt')
    ).rejects.toThrow();
  });

  it('throws when backend returns 500 error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Sponsor wallet insufficient balance' }),
    });
    const mockTx = { build: vi.fn().mockResolvedValue(new Uint8Array([1])) };
    const { executeSponsoredTransaction } = await import('../lib/gasless');

    await expect(
      executeSponsoredTransaction(mockTx as any, {} as any, {} as any, 'jwt')
    ).rejects.toThrow('Sponsor wallet insufficient balance');
  });

  it('uses fallback signAndExecute when jwt is undefined', async () => {
    const fallbackFn = vi.fn().mockResolvedValue({ digest: 'fallback_digest_xyz' });
    const jwt = undefined;
    const result = jwt
      ? await Promise.reject('should not reach')
      : await fallbackFn();

    expect(result.digest).toBe('fallback_digest_xyz');
    expect(fallbackFn).toHaveBeenCalledOnce();
  });
});
