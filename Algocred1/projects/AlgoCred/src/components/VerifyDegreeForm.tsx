import { useState, useEffect } from 'react'
import algosdk from 'algosdk'

// Registered institutions
const registeredInstitutions: { wallet: string; name: string }[] = [
  { wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM', name: 'Darul Uloom Memon' },
  { wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI', name: 'SMIU' },
  { wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM', name: 'ABC University' },
]

type VerifyDegreeFormProps = {
  wallet: { wallet: string; name: string } | null
  goBack: () => void
}

function formatDegreeData(studentName: string, universityName: string, gradYear: string, degreeTitle: string) {
  return `${studentName.trim().toLowerCase()}|${universityName.trim().toLowerCase()}|${gradYear.trim()}|${degreeTitle.trim().toLowerCase()}`
}

function decodeNoteField(note: string | Uint8Array): string | null {
  if (!note) return null
  if (typeof note === 'string') {
    try {
      const bytes = Uint8Array.from(atob(note), (c) => c.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    } catch {
      return null
    }
  }
  if (note instanceof Uint8Array) return new TextDecoder().decode(note)
  return null
}

function VerifyDegreeForm({ wallet, goBack }: VerifyDegreeFormProps) {
  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [year, setYear] = useState('')
  const [degree, setDegree] = useState('')
  const [asaId, setAsaId] = useState('')
  const [verified, setVerified] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [connectedInstitution, setConnectedInstitution] = useState<string | null>(null)

  const years = Array.from({ length: 16 }, (_, i) => String(2010 + i)) // 2010–2025
  const degrees = ['Bachelor of Science', 'Bachelor of Arts', 'Master of Science', 'Master of Arts', 'PhD', 'Other']

  useEffect(() => {
    if (wallet?.wallet) {
      const match = registeredInstitutions.find((inst) => inst.wallet === wallet.wallet)
      setConnectedInstitution(match ? match.name : null)
    }
  }, [wallet])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setVerified(null)

    if (!connectedInstitution) {
      setVerified(false)
      setLoading(false)
      return
    }

    try {
      const indexerClient = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '')
      const txns = await indexerClient.searchForTransactions().assetID(Number(asaId)).txType('acfg').do()
      const configTxn = txns.transactions
        .filter((txn) => txn.note)
        .sort((a, b) => {
          const aRound = a.confirmedRound ? Number(a.confirmedRound) : 0
          const bRound = b.confirmedRound ? Number(b.confirmedRound) : 0
          return bRound - aRound
        })[0]
      if (!configTxn || !configTxn.note) {
        setVerified(false)
        return
      }
      const noteString = decodeNoteField(configTxn.note)
      if (!noteString) {
        setVerified(false)
        return
      }
      let metadata
      try {
        metadata = JSON.parse(noteString)
      } catch {
        setVerified(false)
        return
      }
      const onChainHash = metadata?.properties?.sha256
      if (!onChainHash) {
        setVerified(false)
        return
      }

      const degreeData = formatDegreeData(name, university, year, degree)
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(degreeData))
      const hashBytes = new Uint8Array(hashBuffer)
      const hashBase64 = btoa(String.fromCharCode(...hashBytes))

      setVerified(hashBase64 === onChainHash)
    } catch {
      setVerified(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">✅ Verify a Degree</h2>
      <div className="text-sm text-gray-700">
        <strong>Connected Institution:</strong>
        <br />
        <code className="bg-gray-100 p-2 rounded block">{connectedInstitution || '❌ Not a registered institution'}</code>
      </div>

      {!connectedInstitution ? (
        <div className="text-red-600 mt-2">This wallet is not registered. Verification is disabled.</div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium">Student Full Name</label>
            <input required type="text" className="input input-bordered w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">University Name</label>
            <input
              required
              type="text"
              className="input input-bordered w-full"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
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
            <label className="block text-sm font-medium">ASA / NFT ID</label>
            <input
              required
              type="number"
              className="input input-bordered w-full"
              value={asaId}
              onChange={(e) => setAsaId(e.target.value)}
            />
          </div>

          <button type="submit" className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Degree'}
          </button>

          {verified !== null && (
            <div className={`mt-4 font-semibold ${verified ? 'text-green-700' : 'text-red-600'}`}>
              {verified ? '✅ Degree Verified Successfully!' : '❌ Degree Not Verified!'}
            </div>
          )}

          <button type="button" onClick={goBack} className="mt-2 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400">
            Go Back
          </button>
        </>
      )}
    </form>
  )
}

export default VerifyDegreeForm
