import React, { useState } from 'react'

interface Props {
  wallet: string
  goBack: () => void
}

const MintDegreeForm: React.FC<Props> = ({ wallet, goBack }) => {
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [degree, setDegree] = useState('')
  const [transcript, setTranscript] = useState<File | null>(null)

  const years = ['2021', '2022', '2023', '2024', '2025']
  const degrees = ['BS Computer Science', 'BA Economics', 'MBA', 'PhD', 'Other']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTranscript(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate mint logic
    console.log('Minting degree with data:', {
      name,
      year,
      degree,
      institution: wallet,
      transcript,
    })

    alert('Degree minting initiated (mocked).')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">🎓 Issue a Degree</h2>

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
            <option key={y}>{y}</option>
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
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Upload Transcript (image or PDF)</label>
        <input type="file" accept=".jpg,.png,.pdf" className="file-input w-full" onChange={handleFileChange} />
      </div>

      <div className="text-sm text-gray-500">Institution Address: <strong>{wallet}</strong></div>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-success">Mint Degree</button>
        <button type="button" className="btn" onClick={goBack}>← Back</button>
      </div>
    </form>
  )
}

export default MintDegreeForm
