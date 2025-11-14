/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import algosdk from 'algosdk'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { algodClient, CONFIG } from '../configure/network' // ✅ use shared network.ts

// 🔑 Hash format aligned with MintDegree
function formatDegreeData(
  studentName: string,
  universityName: string,
  gradYear: string,
  degreeTitle: string,
  seatNumber: string,
  percentage: string,
) {
  // EXACTLY same processing as minting
  return `${studentName.trim().toLowerCase()}|${universityName.trim().toLowerCase()}|${gradYear.trim()}|${degreeTitle.trim().toLowerCase()}|${seatNumber.trim().toLowerCase()}|${percentage}`
}

type VerifyDegreeFormProps = {
  goBack: () => void
}

function VerifyDegreeForm({ goBack }: VerifyDegreeFormProps) {
  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [year, setYear] = useState('')
  const [degree, setDegree] = useState('')
  const [seatNumber, setSeatNumber] = useState('')
  const [percentage, setPercentage] = useState('')
  const [asaId, setAsaId] = useState('')
  const [verified, setVerified] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const years = Array.from({ length: 16 }, (_, i) => String(2010 + i))
  const degrees = ['Bachelor of Science', 'Bachelor of Arts', 'BS Maths', 'Master of Science', 'Master of Arts', 'PhD', 'Other']

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setVerified(null)

    try {
      // ✅ Use shared indexer from network.ts
      const indexerClient = new algosdk.Indexer('', CONFIG.indexer, '')
      const assetInfo = await indexerClient.lookupAssetByID(Number(asaId)).do()

      // ✅ Use metadata-hash instead of note
      const onChainHashBytes: Uint8Array | undefined = assetInfo.asset.params['metadataHash']
      if (!onChainHashBytes) {
        setVerified(false)
        return
      }

      const onChainHashBase64 = btoa(String.fromCharCode(...onChainHashBytes))

      // Recompute hash with seatNumber + percentage
      const degreeData = formatDegreeData(name, university, year, degree, seatNumber, percentage)
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(degreeData))
      const hashBytes = new Uint8Array(hashBuffer)
      const hashBase64 = btoa(String.fromCharCode(...hashBytes))

      setVerified(hashBase64 === onChainHashBase64)
    } catch {
      setVerified(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">✅ Verify a Degree</h2>

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
        <label className="block text-sm font-medium">Percentage</label>
        <input
          required
          type="text"
          className="input input-bordered w-full"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">ASA / NFT ID</label>
        <input required type="number" className="input input-bordered w-full" value={asaId} onChange={(e) => setAsaId(e.target.value)} />
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
    </form>
  )
}

export default VerifyDegreeForm
