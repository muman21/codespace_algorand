// network.ts
import algosdk from 'algosdk'

const ENV = import.meta.env.VITE_ENVIRONMENT // "test" or "main"

export const CONFIG = {
  networkName: ENV === 'main' ? 'mainnet' : 'testnet',
  algodServer: import.meta.env.VITE_ALGOD_SERVER || '',
  algodPort: import.meta.env.VITE_ALGOD_PORT || '',
  algodToken: import.meta.env.VITE_ALGOD_TOKEN || '',
  indexer: import.meta.env.VITE_INDEXER_SERVER || '', // <-- fast / main
  archiveIndexer: import.meta.env.VITE_ARCHIVE_INDEXER || '', // optional
}

// ✅ Create algod client using config
// eslint-disable-next-line prettier/prettier
export const algodClient = new algosdk.Algodv2(
  CONFIG.algodToken,
  CONFIG.algodServer,
  CONFIG.algodPort
)

// ✅ Centralized ASA / NFT IDs per network
export const ASSETS = {
  USDC: CONFIG.networkName === 'mainnet' ? 31566704 : 10458941, // replace with actual IDs
  // Add more ASA IDs as needed
}
