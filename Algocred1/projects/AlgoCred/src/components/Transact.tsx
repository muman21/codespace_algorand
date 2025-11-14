/* eslint-disable @typescript-eslint/no-explicit-any */
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { algodClient } from '../configure/network' // ✅ use shared network client
import algosdk from 'algosdk'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [receiverAddress, setReceiverAddress] = useState<string>('')

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const handleSubmitAlgo = async () => {
    setLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    if (receiverAddress.length !== 58) {
      enqueueSnackbar('Invalid receiver address', { variant: 'warning' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar('Sending transaction...', { variant: 'info' })

      // Get suggested transaction params
      const params = await algodClient.getTransactionParams().do()

      // Create transaction
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: receiverAddress,
        amount: 1_000_000, // 1 Algo in microAlgos
        suggestedParams: params,
      })

      // ✅ Sign transaction via wallet (pass transaction and index array)
      const signedBlobs = await transactionSigner([txn], [0])
      if (!signedBlobs || signedBlobs.length === 0) throw new Error('Transaction signing failed')

      // Send transaction
      const { txid } = await algodClient.sendRawTransaction(signedBlobs[0]).do()
      await algosdk.waitForConfirmation(algodClient, txid, 4)

      enqueueSnackbar(`Transaction sent successfully: ${txid}`, { variant: 'success' })
      setReceiverAddress('')
      setModalState(false)
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err)
      enqueueSnackbar(err?.message || 'Failed to send transaction', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="transact_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg">Send payment transaction</h3>
        <br />
        <input
          type="text"
          placeholder="Provide wallet address"
          className="input input-bordered w-full"
          value={receiverAddress}
          onChange={(e) => setReceiverAddress(e.target.value)}
        />
        <div className="modal-action">
          <button type="button" className="btn" onClick={() => setModalState(false)}>
            Close
          </button>
          <button type="button" className={`btn ${receiverAddress.length === 58 ? '' : 'btn-disabled'}`} onClick={handleSubmitAlgo}>
            {loading ? <span className="loading loading-spinner" /> : 'Send 1 Algo'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default Transact
