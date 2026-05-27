import { SuiJsonRpcClient as SuiClient, SuiEvent } from '@mysten/sui/jsonRpc';
import { CONTRACTS } from './contracts';

const EVENT_TYPES = {
  ClaimSubmitted: `${CONTRACTS.PACKAGE_ID}::safwah::ClaimSubmitted`,
  ClaimApproved: `${CONTRACTS.PACKAGE_ID}::safwah::ClaimApproved`,
  ClaimSettled: `${CONTRACTS.PACKAGE_ID}::safwah::ClaimSettled`,
  WithdrawalInitiated: `${CONTRACTS.PACKAGE_ID}::safwah_treasury::WithdrawalInitiated`,
  InvoiceNFTMinted: `${CONTRACTS.PACKAGE_ID}::safwah_nft::InvoiceNFTMinted`,
  RefundSettlementNFTMinted: `${CONTRACTS.PACKAGE_ID}::safwah_nft::RefundSettlementNFTMinted`,
};

/**
 * Poll Sui event stream for Safwah events relevant to the tourist.
 */
export function startEventListener(
  suiClient: SuiClient,
  touristAddress: string,
  handlers: {
    onClaimApproved?: (data: { claimId: string; finalAmount: number }) => void;
    onClaimSettled?: (data: { claimId: string; totalRefunded: number }) => void;
    onInvoiceReceived?: (data: { invoiceNumber: string; merchantName: string; vatAmount: number }) => void;
  }
): () => void {

  let active = true;
  let lastPollTime = Date.now();

  const poll = async () => {
    if (!active) return;
    try {
      // Query events that happened recently
      // Polling events by type
      
      // 1. Poll ClaimApproved events
      if (handlers.onClaimApproved) {
        const approvedEvents = await suiClient.queryEvents({
          query: { MoveEventType: EVENT_TYPES.ClaimApproved },
          limit: 20,
          order: 'descending',
        });

        for (const ev of approvedEvents.data) {
          const fields = ev.parsedJson as any;
          const timestamp = ev.timestampMs ? Number(ev.timestampMs) : Date.now();
          if (timestamp > lastPollTime && fields?.tourist === touristAddress) {
            handlers.onClaimApproved({
              claimId: fields.claim_id,
              finalAmount: Number(fields.final_amount),
            });
          }
        }
      }

      // 2. Poll ClaimSettled events
      if (handlers.onClaimSettled) {
        const settledEvents = await suiClient.queryEvents({
          query: { MoveEventType: EVENT_TYPES.ClaimSettled },
          limit: 20,
          order: 'descending',
        });
        for (const ev of settledEvents.data) {
          const fields = ev.parsedJson as any;
          const timestamp = ev.timestampMs ? Number(ev.timestampMs) : Date.now();
          if (timestamp > lastPollTime && fields?.tourist === touristAddress) {
            handlers.onClaimSettled({
              claimId: fields.claim_id,
              totalRefunded: Number(fields.total_refunded),
            });
          }
        }
      }

      // 3. Poll InvoiceNFTMinted events (tourist received an invoice)
      if (handlers.onInvoiceReceived) {
        const invoiceEvents = await suiClient.queryEvents({
          query: { MoveEventType: EVENT_TYPES.InvoiceNFTMinted },
          limit: 20,
          order: 'descending',
        });
        for (const ev of invoiceEvents.data) {
          const fields = ev.parsedJson as any;
          const timestamp = ev.timestampMs ? Number(ev.timestampMs) : Date.now();
          if (timestamp > lastPollTime && fields?.tourist === touristAddress) {
            handlers.onInvoiceReceived({
              invoiceNumber: fields.invoice_number,
              merchantName: fields.merchant_name || 'Merchant',
              vatAmount: Number(fields.vat_amount),
            });
          }
        }
      }

      lastPollTime = Date.now();
    } catch (err) {
      console.warn('Event polling error:', err);
    }

    if (active) {
      setTimeout(poll, 5000);
    }
  };

  poll();
  return () => { active = false; };  // cleanup
}
