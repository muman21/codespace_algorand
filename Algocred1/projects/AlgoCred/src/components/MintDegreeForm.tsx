import React, { useState } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'

// Registered institutions (same format as ConnectWallet.tsx)
const registeredInstitutions: { wallet: string; name: string }[] = [
  { wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM', name: 'Darul Uloom Memon' },
  { wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI', name: 'SMIU' },
  { wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM', name: 'Iqra University' },
]

interface MintDegreeProps {
  goBack: () => void
}

// Helper to ensure consistent formatting between mint & verify
function formatDegreeData(studentName: string, universityName: string, gradYear: string, degreeTitle: string) {
  return `${studentName.trim().toLowerCase()}|${universityName.trim().toLowerCase()}|${gradYear.trim()}|${degreeTitle.trim().toLowerCase()}`
}

const MintDegree: React.FC<MintDegreeProps> = ({ goBack }) => {
  const { activeAddress, signTransactions } = useWallet()

  const [studentName, setStudentName] = useState('')
  const [degreeTitle, setDegreeTitle] = useState('Bachelor of Science')
  const [gradYear, setGradYear] = useState('2025')
  const [loading, setLoading] = useState(false)

  // Match active wallet to registered institution
  const matchedInstitution = registeredInstitutions.find((inst) => inst.wallet.toLowerCase() === (activeAddress || '').toLowerCase())
  const universityName = matchedInstitution?.name || ''

  const degreeOptions = ['Bachelor of Science', 'Bachelor of Arts', 'Master of Science', 'Master of Arts', 'PhD']
  const yearOptions = ['2021', '2022', '2023', '2024', '2025', '2026']

  const handleMint = async () => {
    if (!activeAddress) {
      alert('Please connect your wallet first.')
      return
    }
    if (!universityName) {
      alert('Connected wallet is not recognized as a registered university.')
      return
    }
    if (!studentName.trim()) {
      alert('Please enter the student name.')
      return
    }

    try {
      setLoading(true)
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

      // 1. Create SHA-256 hash using consistent format
      const degreeData = formatDegreeData(studentName, universityName, gradYear, degreeTitle)
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(degreeData))
      const hashBytes = new Uint8Array(hashBuffer)
      const hashBase64 = btoa(String.fromCharCode(...hashBytes))

      // 2. ARC69 metadata with ONLY the hash
      const metadata = {
        standard: 'arc69',
        description: 'Academic Degree NFT (Privacy-Preserving)',
        media_url: '',
        properties: {
          sha256: hashBase64,
        },
      }

      // 3. Get suggested transaction params
      const params = await algodClient.getTransactionParams().do()

      // 4. Create asset creation txn (only storing hash in note field)
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        total: 1,
        decimals: 0,
        assetName: `${degreeTitle} - Degree NFT`,
        unitName: 'DEGREE',
        assetURL: '',
        note: new TextEncoder().encode(JSON.stringify(metadata)),
        defaultFrozen: false,
        suggestedParams: params,
      })

      // 5. Encode & sign
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn)
      const signed = await signTransactions([encodedTxn])

      if (!signed[0]) {
        throw new Error('Transaction signing failed')
      }

      // 6. Send signed transaction
      const sendResult = await algodClient.sendRawTransaction(signed[0]).do()

      // 7. Wait for confirmation before reading asset ID
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, sendResult.txid, 4)
      const assetID = confirmedTxn['assetIndex'] || confirmedTxn['assetIndex']
      if (!assetID) {
        throw new Error('Asset ID not found after confirmation')
      }

      alert(`✅ Degree NFT minted!\nTransaction ID: ${sendResult.txid}\nAsset ID: ${assetID}`)
      goBack()
    } catch (err) {
      alert('❌ Failed to mint degree NFT.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-md rounded-xl">
      <h2 className="text-xl font-bold mb-4">Mint Degree NFT</h2>

      {universityName ? (
        <>
          <label className="block mb-2">University Name</label>
          <input type="text" value={universityName} disabled className="w-full p-2 border rounded mb-4 bg-gray-100" />
        </>
      ) : (
        <p className="mb-4 text-red-600">Connected wallet is not recognized as a registered university.</p>
      )}

      <label className="block mb-2">Student Name</label>
      <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full p-2 border rounded mb-4" />

      <label className="block mb-2">Degree Title</label>
      <select value={degreeTitle} onChange={(e) => setDegreeTitle(e.target.value)} className="w-full p-2 border rounded mb-4">
        {degreeOptions.map((deg) => (
          <option key={deg} value={deg}>
            {deg}
          </option>
        ))}
      </select>

      <label className="block mb-2">Graduation Year</label>
      <select value={gradYear} onChange={(e) => setGradYear(e.target.value)} className="w-full p-2 border rounded mb-4">
        {yearOptions.map((yr) => (
          <option key={yr} value={yr}>
            {yr}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={handleMint}
          disabled={loading || !universityName}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Minting...' : 'Mint Degree'}
        </button>
        <button onClick={goBack} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400">
          Go Back
        </button>
      </div>
    </div>
  )
}

export default MintDegree
