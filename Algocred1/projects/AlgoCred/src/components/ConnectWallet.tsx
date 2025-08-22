import { useWallet } from '@txnlab/use-wallet-react'
import Account from './Account'
import { useMemo, useEffect } from 'react'

const registeredInstitutions: { wallet: string; name: string }[] = [
  { wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM', name: 'Darul Uloom Memon' },
  { wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI', name: 'SMIU' },
  { wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM', name: 'Iqra University' },
]

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
  setConnectedInstitution: (institution: { wallet: string; name: string } | null) => void
}

const ConnectWallet = ({ openModal, closeModal, setConnectedInstitution }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const matchedInstitution = useMemo(() => {
    if (!activeAddress) return null
    return registeredInstitutions.find((inst) => inst.wallet.toLowerCase() === activeAddress.toLowerCase()) || null
  }, [activeAddress])

  useEffect(() => {
    setConnectedInstitution(matchedInstitution)
  }, [matchedInstitution, setConnectedInstitution])

  const institutionName = matchedInstitution?.name || 'Not Recognised'

  // Find the currently connected wallet instance by matching activeAddress

  // Because wallet.accounts may be undefined, fallback:
  // You can just pick first wallet with .connected === true as activeWallet:
  const connectedWallet = wallets?.find((wallet) => wallet.connect) || null

  // On Disconnect click:
  const handleDisconnect = () => {
    if (connectedWallet && connectedWallet.disconnect) {
      connectedWallet.disconnect()
    } else {
      alert('Disconnect not supported by this wallet.')
    }
  }

  return (
    <dialog id="connect_wallet_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-2xl mb-4">Select Wallet Provider</h3>

        <div className="grid gap-4">
          {!activeAddress &&
            wallets?.map((wallet) => (
              <button
                key={`provider-${wallet.id}`}
                type="button"
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

          {activeAddress && (
            <>
              <div className="text-md text-gray-700">
                <strong>Connected:</strong> {activeAddress}
              </div>
              <div className="text-md">
                <strong>Institution:</strong>{' '}
                <span className={institutionName === 'Not Recognised' ? 'text-red-500' : 'text-green-600'}>{institutionName}</span>
              </div>
              <Account />
              <button type="button" className="btn btn-error mt-4" onClick={handleDisconnect}>
                Disconnect Wallet
              </button>
            </>
          )}
        </div>

        <div className="modal-action mt-6">
          <button className="btn" onClick={closeModal}>
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
