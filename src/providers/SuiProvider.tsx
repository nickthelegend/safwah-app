"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { SuiJsonRpcClient as SuiClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { registerEnokiWallets } from "@mysten/enoki";
import { EnokiFlowProvider } from "@mysten/enoki/react";
import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" },
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
});

const suiClientForEnoki = new SuiClient({ url: getJsonRpcFullnodeUrl("testnet"), network: 'testnet' });

if (typeof window !== "undefined") {
  registerEnokiWallets({
    apiKey: process.env.VITE_ENOKI_PUBLIC_KEY || '',
    client: suiClientForEnoki,
    network: 'testnet',
    providers: {
      google: {
        clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
        redirectUrl: window.location.origin,
      },
    },
  });
}

export default function SuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <EnokiFlowProvider apiKey={process.env.VITE_ENOKI_PUBLIC_KEY || ''}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            {children}
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </EnokiFlowProvider>
  );
}
