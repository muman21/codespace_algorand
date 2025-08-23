import { useState, useEffect } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'

// Registered institutions (same as VerifyDegreeForm)
const registeredInstitutions: { wallet: string; name: string }[] = [
  { wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM', name: 'Darul Uloom Memon' },
  { wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI', name: 'SMIU' },
  { wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM', name: 'ABC University' },
]

type MintDegreeFormProps = {
  wallet: { wallet: string; name: string } | null
  goBack: () => void
}

function formatDegreeData(studentName: string, universityName: string, gradYear: string, degreeTitle: string) {
  return `${studentName.trim().toLowerCase()}|${universityName.trim().toLowerCase()}|${gradYear.trim()}|${degreeTitle.trim().toLowerCase()}`
}

function MintDegreeForm({ wallet, goBack }: MintDegreeFormProps) {
  const { activeAddress, signTransactions } = useWallet()

  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [year, setYear] = useState('2025')
  const [degree, setDegree] = useState('Bachelor of Science')
  const [loading, setLoading] = useState(false)
  const [connectedInstitution, setConnectedInstitution] = useState<string | null>(null)

  const years = Array.from({ length: 16 }, (_, i) => String(2010 + i)) // 2010–2025
  const degrees = ['Bachelor of Science', 'Bachelor of Arts', 'Master of Science', 'Master of Arts', 'PhD', 'Other']

  useEffect(() => {
    if (wallet?.wallet || activeAddress) {
      const address = wallet?.wallet || activeAddress || ''
      const match = registeredInstitutions.find((inst) => inst.wallet.toLowerCase() === address.toLowerCase())
      setConnectedInstitution(match ? match.name : null)
      setUniversity(match ? match.name : '')
    }
  }, [wallet, activeAddress])

  const handleMint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (!connectedInstitution) {
      alert('Connected wallet is not a registered institution.')
      setLoading(false)
      return
    }

    if (!name.trim()) {
      alert('Please enter the student name.')
      setLoading(false)
      return
    }

    try {
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
      const degreeData = formatDegreeData(name, university, year, degree)
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(degreeData))
      const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))

      const metadata = {
        standard: 'arc69',
        description: 'Academic Degree NFT (Privacy-Preserving)',
        media_url: '',
        properties: { sha256: hashBase64 },
      }

      const params = await algodClient.getTransactionParams().do()
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: activeAddress!,
        total: 1,
        decimals: 0,
        assetName: `${degree} - Degree NFT`,
        unitName: 'DEGREE',
        assetURL: '',
        note: new TextEncoder().encode(JSON.stringify(metadata)),
        defaultFrozen: false,
        suggestedParams: params,
      })

      const encodedTxn = algosdk.encodeUnsignedTransaction(txn)
      const signed = await signTransactions([encodedTxn])
      if (!signed[0]) throw new Error('Transaction signing failed')

      const sendResult = await algodClient.sendRawTransaction(signed[0]).do()
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, sendResult.txid, 4)
      const assetID = confirmedTxn['assetIndex']

      alert(`✅ Degree NFT minted!\nTransaction ID: ${sendResult.txid}\nAsset ID: ${assetID}`)
      goBack()
    } catch {
      alert('❌ Failed to mint degree NFT.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleMint} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">🎓 Mint Degree NFT</h2>

      <div className="text-sm text-gray-700">
        <strong>Connected Institution:</strong>
        <br />
        <code className="bg-gray-100 p-2 rounded block">{connectedInstitution || '❌ Not a registered institution'}</code>
      </div>

      {!connectedInstitution ? (
        <div className="text-red-600 mt-2">This wallet is not registered. Minting is disabled.</div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium">Student Full Name</label>
            <input required type="text" className="input input-bordered w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">University Name</label>
            <input type="text" className="input input-bordered w-full" value={university} disabled />
          </div>

          <div>
            <label className="block text-sm font-medium">Year of Graduation</label>
            <select required className="input input-bordered w-full" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Select Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Degree Title</label>
            <select required className="input input-bordered w-full" value={degree} onChange={(e) => setDegree(e.target.value)}>
              <option value="">Select Degree</option>
              {degrees.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
            {loading ? 'Minting...' : 'Mint Degree'}
          </button>

          <button type="button" onClick={goBack} className="mt-2 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400">
            Go Back
          </button>
        </>
      )}
    </form>
  )
}

export default MintDegreeForm
