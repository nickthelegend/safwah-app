# 📱 Safwah Tourist Portal Frontend

This Next.js application serves as the user-facing portal for tourists to manage their UAE retail receipts, calculate tax refunds, bundle receipts, and claim payouts instantly on the Sui network.

## 🌟 Features

* **zkLogin (via Enoki)**: Sign in easily with Google/Web2 OAuth credentials—no wallet extensions or seed phrases required.
* **Walrus Receipts Storage**: Compress and store shopping invoice receipts securely on the decentralized Walrus Network.
* **80/20 Escrow Split**: Claim claims atomically. 80% is sent to your wallet immediately in USDC, and 20% is locked until airport customs clearance.
* **Gasless Transactions**: Uses the `safwah-sponsor-backend` to cover gas costs for claim submission.
* **MongoDB Integration**: Persists claim records and receipts status to the centralized MongoDB Atlas database via backend endpoints.
* **Event Notifications**: Real-time event subscription for claim updates (Approved, Settled).

## ⚙️ Configuration (`.env`)

Configure the following variables in a `.env` file:
```env
VITE_SUI_PACKAGE_ID=0x96604c290f1467bf041b080bf945518d56f597cb6a07d0d698466c44ed0eabfb
VITE_SAFWAH_ESCROW_ID=0x36da6295fa6bf907034fa65a84f5f921aa46997b7c492d3c7b2dc0c184115990
VITE_SAFWAH_ADMIN_ID=0xa35448ad356aa9c43d5de33aa3dfabbea81ae89961b62345f1f601e8a88f1b4f
VITE_MERCHANT_REGISTRY_ID=0x28659ebac204de2bdb7b76ae5336b12db82771edca09b60707d7422dea3cb4d1
VITE_USDC_MOCK_ADMIN_ID=0xf8fbe928f2305e9eec49f1a125d093fb8dc98698b3a8dd058797b66c285ccf7c
VITE_BACKEND_URL=http://localhost:3001
```

## 🚀 Execution & Testing

### Install dependencies:
```bash
npm install
```

### Run in development mode:
```bash
npm run dev
```

### Run frontend tests:
```bash
npm run test
```
