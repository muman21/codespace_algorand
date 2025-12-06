import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

// Pages
import Home from './pages/home' // new landing page
import AlgoCredDashboard from './pages/credichain' // your old Home.tsx renamed
import LMS from './pages/lms' // new LMS/ERP page

const supportedWallets: SupportedWallet[] = [{ id: WalletId.PERA }, { id: WalletId.DEFLY }, { id: WalletId.EXODUS }]

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/credichain" element={<AlgoCredDashboard />} />
            <Route path="/lms" element={<LMS />} />
          </Routes>
        </Router>
      </WalletProvider>
    </SnackbarProvider>
  )
}
