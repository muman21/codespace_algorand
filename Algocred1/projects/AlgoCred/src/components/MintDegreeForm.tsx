/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'

// Registered institutions
const registeredInstitutions: { wallet: string; name: string }[] = [
  { wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM', name: 'Darul Uloom Memon' },
  { wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI', name: 'SMIU' },
  { wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM', name: 'ABC University' },
]

const TEST_USD_ID = 745142652
const TEST_USD_DECIMALS = 2
const FEE_AMOUNT = 9 * 10 ** TEST_USD_DECIMALS // 9 TUSD
const FEE_RECEIVER = 'CRL73DO2N6HT25UJVAF3VKSIXELBDOIQBZ44LTQCLYBLRCAHRYJBUNOVZQ'

type MintDegreeFormProps = {
  wallet: { wallet: string; name: string } | null
  goBack: () => void
}

// --- AES-GCM Decryption for Semester Proformas ---
async function decryptAESGCM(encObj: { iv: string; ciphertext: string }, seatNumber: string): Promise<any> {
  const iv = Uint8Array.from(atob(encObj.iv), (c) => c.charCodeAt(0))
  const cipherBytes = Uint8Array.from(atob(encObj.ciphertext), (c) => c.charCodeAt(0))

  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(seatNumber.trim()))
  const key = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['decrypt'])

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes)
  return JSON.parse(new TextDecoder().decode(decrypted))
}

function MintDegreeForm({ wallet, goBack }: MintDegreeFormProps) {
  const { activeAddress, signTransactions } = useWallet()

  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [year, setYear] = useState('2025')
  const [degree, setDegree] = useState('Bachelor of Science')
  const [seatNumber, setSeatNumber] = useState('')
  const [percentage, setPercentage] = useState('')
  const [semesterAssets, setSemesterAssets] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectedInstitution, setConnectedInstitution] = useState<string | null>(null)

  const years = Array.from({ length: 16 }, (_, i) => String(2010 + i))
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

    if (!name.trim() || !seatNumber.trim()) {
      alert('Please enter student name and seat number.')
      setLoading(false)
      return
    }

    try {
      // Collect semester asset IDs
      const ids = semesterAssets.trim()
        ? semesterAssets
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
        : []

      if (!percentage.trim() && ids.length === 0) {
        alert('Please provide either a final percentage OR Semester Proforma asset IDs.')
        setLoading(false)
        return
      }

      // Validate asset count
      if (ids.length > 0) {
        if (degree.toLowerCase().includes('bachelor') && ids.length !== 8) {
          alert('Bachelors requires exactly 8 Semester Proforma asset IDs.')
          setLoading(false)
          return
        } else if (degree.toLowerCase().includes('master') && !(ids.length === 4 || ids.length === 2)) {
          alert('Masters requires 4 or 2 Semester Proforma asset IDs.')
          setLoading(false)
          return
        }
      }

      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

      // --- Calculate final percentage ---
      let finalPercentage: number | null = percentage ? parseFloat(percentage) : null

      if (!finalPercentage && ids.length > 0) {
        const marks: number[] = []
        for (const id of ids) {
          const assetInfo = await algodClient.getAssetByID(parseInt(id)).do()
          const rawNote: any = (assetInfo.params as any).note ?? (assetInfo as any).note ?? null
          if (!rawNote) continue

          let noteBuf: Uint8Array | null = null
          try {
            if (typeof rawNote === 'string') {
              noteBuf = Uint8Array.from(atob(rawNote), (c) => c.charCodeAt(0))
            } else if (rawNote instanceof Uint8Array) {
              noteBuf = rawNote
            } else if (Array.isArray(rawNote)) {
              noteBuf = new Uint8Array(rawNote)
            }
          } catch {
            noteBuf = null
          }
          if (!noteBuf) continue

          let metadataJson: any = null
          try {
            const metadataStr = new TextDecoder().decode(noteBuf)
            metadataJson = JSON.parse(metadataStr)
          } catch {
            continue
          }

          const encObj = metadataJson?.properties?.enc
          if (!encObj?.iv || !encObj?.ciphertext) continue

          try {
            const payload = await decryptAESGCM(encObj, seatNumber)
            if (payload?.courses?.length) {
              const total = payload.courses.reduce((sum: number, c: any) => sum + (Number(c.marks) || 0), 0)
              const percentageForSemester = total / payload.courses.length
              marks.push(percentageForSemester)
            }
          } catch {
            continue
          }
        }
        if (marks.length > 0) {
          finalPercentage = marks.reduce((a, b) => a + b, 0) / marks.length
        }
      }

      // --- Hash student data ---
      const dataString = `${name.trim().toLowerCase()}|${university.trim().toLowerCase()}|${year.trim()}|${degree
        .trim()
        .toLowerCase()}|${seatNumber.trim()}|${finalPercentage ?? 'N/A'}`

      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataString))
      const hashBytes = new Uint8Array(hashBuffer)

      const params = await algodClient.getTransactionParams().do()

      // Txn 1: Create NFT with only metadataHash
      const nftTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: activeAddress!,
        total: 1,
        decimals: 0,
        assetName: `${degree} - Degree NFT`,
        unitName: 'DEGREE',
        assetURL: '',
        defaultFrozen: false,
        suggestedParams: params,
        assetMetadataHash: hashBytes, // ✅ only hash stored
      })

      // Txn 2: Pay minting fee
      const feeTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress!,
        receiver: FEE_RECEIVER,
        amount: FEE_AMOUNT,
        assetIndex: TEST_USD_ID,
        suggestedParams: params,
      })

      // Group and sign
      const txns = [nftTxn, feeTxn]
      algosdk.assignGroupID(txns)
      const encodedTxns = txns.map((t) => algosdk.encodeUnsignedTransaction(t))
      const signed = await signTransactions(encodedTxns)
      const validSigned = signed.filter((s): s is Uint8Array => s !== null)
      if (validSigned.length !== txns.length) throw new Error('Transaction signing failed.')

      // Send
      const { txid } = await algodClient.sendRawTransaction(validSigned).do()
      const confirmed = await algosdk.waitForConfirmation(algodClient, txid, 4)

      const assetID =
        (confirmed as any)['asset-index'] || (confirmed as any)['assetIndex'] || (confirmed as any)['inner-txns']?.[0]?.['created-asset-id']

      alert(`✅ Degree NFT minted!\nTransaction ID: ${txid}\nAsset ID: ${assetID}`)
      goBack()
    } catch (err) {
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
            <label className="block text-sm font-medium">Seat Number</label>
            <input
              required
              type="text"
              className="input input-bordered w-full"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
            />
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

          <div>
            <label className="block text-sm font-medium">Final Percentage (optional)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Enter directly OR leave blank if using Semester Proformas"
              className="input input-bordered w-full"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Semester Proforma Asset IDs (comma-separated, optional)</label>
            <input
              type="text"
              placeholder="e.g. 12345,67890,13579"
              className="input input-bordered w-full"
              value={semesterAssets}
              onChange={(e) => setSemesterAssets(e.target.value)}
            />
          </div>

          <p className="text-xs text-gray-500">
            <em>⚠️ Provide either a final percentage or valid semester proforma IDs.</em>
          </p>

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
