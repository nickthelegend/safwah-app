import { Transaction } from '@mysten/sui/transactions';
import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc';
import { useEnokiFlow } from '@mysten/enoki/react';

const BACKEND_URL = process.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export interface SponsoredTxResult {
  digest: string;
  effects?: unknown;
}

// Browser-safe base64 encoder for Uint8Array
function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

// Browser-safe base64 decoder to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Execute a gasless sponsored transaction via Enoki.
 * The tourist pays NO gas. The Safwah sponsor wallet covers it.
 *
 * Steps:
 * 1. Build tx as onlyTransactionKind bytes
 * 2. POST to backend /sponsor with jwt from Enoki flow
 * 3. Tourist signs returned bytes with ephemeral key
 * 4. POST signature to /sponsor/:digest/submit
 * 5. Return final digest
 */
export async function executeSponsoredTransaction(
  tx: Transaction,
  suiClient: SuiClient,
  enokiFlow: ReturnType<typeof useEnokiFlow>,
  jwt: string,
): Promise<SponsoredTxResult> {

  // Step 1: Build only the transaction kind bytes (no gas data)
  const bytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
  const transactionBlockKindBytes = uint8ArrayToBase64(bytes);

  // Step 2: Request sponsorship from backend
  const sponsorRes = await fetch(`${BACKEND_URL}/sponsor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionBlockKindBytes, jwt }),
  });

  if (!sponsorRes.ok) {
    const err = await sponsorRes.json();
    throw new Error(`Sponsorship failed: ${err.error ?? sponsorRes.statusText}`);
  }

  const { bytes: sponsoredTxBytes, digest } = await sponsorRes.json();

  // Step 3: Tourist signs with their ephemeral zkLogin key
  const keypair = await enokiFlow.getKeypair();
  const bytesArray = base64ToUint8Array(sponsoredTxBytes);
  const { signature } = await keypair.signTransaction(bytesArray);

  // Step 4: Submit dual-signed transaction
  const submitRes = await fetch(`${BACKEND_URL}/sponsor/${digest}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.json();
    throw new Error(`Submission failed: ${err.error}`);
  }

  const result = await submitRes.json();
  return { digest: result.digest ?? digest, effects: result.effects };
}

/**
 * Hook-friendly wrapper — falls back to regular signAndExecute for
 * non-zkLogin wallets (Suiet, Sui Wallet browser extension).
 * This means regular wallets still work normally — only zkLogin users get gasless.
 */
export function useGaslessTransaction() {
  const enokiFlow = useEnokiFlow();

  const executeGasless = async (
    tx: Transaction,
    suiClient: SuiClient,
    opts: {
      jwt?: string;               // Present for zkLogin users
      fallback: () => Promise<{ digest: string }>;   // For regular wallet users
    }
  ): Promise<SponsoredTxResult> => {
    if (opts.jwt) {
      // zkLogin user → gasless sponsored path
      return executeSponsoredTransaction(tx, suiClient, enokiFlow, opts.jwt);
    } else {
      // Regular wallet user → normal signed transaction
      return opts.fallback();
    }
  };

  return { executeGasless };
}
