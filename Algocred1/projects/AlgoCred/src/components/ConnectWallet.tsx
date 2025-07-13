import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD

  return (
    <dialog id="connect_wallet_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Select Wallet Provider</h3>

        <div className="grid gap-4">
          {activeAddress && (
            <>
              <Account />
              <div className="divider" />
            </>
          )}

          {!activeAddress && wallets?.map((wallet) => (
            <button
              key={`provider-${wallet.id}`}
              className="btn btn-outline flex items-center gap-3 border-cyan-700 hover:bg-cyan-100"
              onClick={() => wallet.connect()}
            >
              <img
                alt={`${wallet.metadata.name} logo`}
                src={wallet.metadata.icon || getWalletLogo(wallet.metadata.name)}
                className="w-6 h-6"
              />
              <span>{wallet.metadata.name}</span>
            </button>
          ))}
        </div>

        <div className="modal-action mt-6">
          <button
            className="btn"
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </form>
    </dialog>
  )
}

const getWalletLogo = (name: string): string => {
  switch (name) {
    case 'Pera Wallet':
      return 'https://walletconnect.com/wallets/assets/pera.svg'
    case 'Defly Wallet':
      return 'https://defly.app/img/logo512.png'
    case 'Exodus':
      return 'https://exodus.com/_next/image?url=%2Fimages%2Fbrand%2Flogos%2Fexodus-icon.png&w=64&q=75'
    default:
      return 'https://walletconnect.com/wallets/assets/walletconnect-logo.svg'
  }
}

export default ConnectWallet
