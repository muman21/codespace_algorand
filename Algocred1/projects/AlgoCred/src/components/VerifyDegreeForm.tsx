import { useState } from 'react'

type VerifyDegreeFormProps = {
  wallet: string
  goBack: () => void
}

function VerifyDegreeForm({ wallet, goBack }: VerifyDegreeFormProps) {
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [degree, setDegree] = useState('')
  const [asaId, setAsaId] = useState('')
  const [verified, setVerified] = useState<boolean | null>(null)

  const years = ['2021', '2022', '2023', '2024', '2025']
  const degrees = ['BS Computer Science', 'BA Economics', 'MBA', 'PhD', 'Other']

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Mock verification logic
    if (name && year && degree && asaId.length > 3) {
      setVerified(true)
    } else {
      setVerified(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">✅ Verify a Degree</h2>

      <div>
        <label className="block text-sm font-medium">Student Full Name</label>
        <input
          required
          type="text"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Year of Graduation</label>
        <select
          required
          className="select select-bordered w-full"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="">Select year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Degree Program</label>
        <select
          required
          className="select select-bordered w-full"
          value={degree}
          onChange={(e) => setDegree(e.target.value)}
        >
          <option value="">Select degree</option>
          {degrees.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Degree ASA/NFT ID</label>
        <input
          required
          type="text"
          className="input input-bordered w-full"
          value={asaId}
          onChange={(e) => setAsaId(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">
          Verify Degree
        </button>
        <button type="button" className="btn" onClick={goBack}>
          ← Back
        </button>
      </div>

      {verified === true && (
        <div className="alert alert-success mt-4">
          ✅ Degree Verified! Transcript will be shown here (if allowed).
        </div>
      )}
      {verified === false && (
        <div className="alert alert-error mt-4">
          ❌ Degree Verification Failed
        </div>
      )}
    </form>
  )
}

export default VerifyDegreeForm
