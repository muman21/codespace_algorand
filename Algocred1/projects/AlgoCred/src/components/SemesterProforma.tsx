/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'

// Registered institutions (imported from utils)
import { registeredInstitutions } from '../utils/registeredinstitutions'

// SaaS Fee Config
const TEST_USD_ID = 745142652
const TEST_USD_DECIMALS = 2
const FEE_AMOUNT = 0.1 * 10 ** TEST_USD_DECIMALS // 0.1 TUSD → 10 units
const FEE_RECEIVER = 'CRL73DO2N6HT25UJVAF3VKSIXELBDOIQBZ44LTQCLYBLRCAHRYJBUNOVZQ'

// University → Faculties → Departments (optionally Programs)
type ProgramAwareDept = { name: string; programs?: string[] }
type FacMap = Record<string, { faculty: string; departments: ProgramAwareDept[] }[]>

const uniStructure: FacMap = {
  'ABC University': [
    {
      faculty: 'Faculty of Sciences',
      departments: [{ name: 'Mathematics' }, { name: 'Physics' }, { name: 'Computer Science', programs: ['BS CS', 'BS SE', 'BS AI'] }],
    },
    { faculty: 'Chemical Sciences', departments: [{ name: 'Chemical Sciences' }] },
    { faculty: 'Faculty of Biology', departments: [{ name: 'Biology' }] },
    {
      faculty: 'Faculty of Management & Social Sciences',
      departments: [{ name: 'Management & Social Sciences' }],
    },
  ],
  SMIU: [
    {
      faculty: 'Faculty of Management Sciences',
      departments: [{ name: 'Business Administration' }, { name: 'Accounting & Finance' }],
    },
    {
      faculty: 'Faculty of Computing',
      departments: [{ name: 'Computer Science', programs: ['BS CS', 'BS SE'] }],
    },
  ],
  'Darul Uloom Memon': [
    {
      faculty: 'Takhassus',
      departments: [{ name: 'Takhassus fil Fiqh' }],
    },
    {
      faculty: 'Islamic Banking & Finance',
      departments: [{ name: 'Islamic Banking & Finance' }],
    },
  ],
}

// ---------- Crypto Helpers (AES-GCM-256 with key derived from seat number) ----------
async function sha256Base64(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input.trim())
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

async function deriveAesKeyFromSeat(seatNumber: string): Promise<CryptoKey> {
  // Derive a 256-bit key by hashing the seat number
  const material = new TextEncoder().encode(seatNumber.trim())
  const hash = await crypto.subtle.digest('SHA-256', material) // 32 bytes
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt'])
}

function toBase64(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8))
}

async function aesGcmEncryptJSON(plainObj: any, seatNumber: string): Promise<{ ivB64: string; cipherB64: string }> {
  const key = await deriveAesKeyFromSeat(seatNumber)
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM
  const plaintext = new TextEncoder().encode(JSON.stringify(plainObj))
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return { ivB64: toBase64(iv), cipherB64: toBase64(new Uint8Array(cipherBuf)) }
}

// ---------- Types ----------
type ProformaFormProps = {
  wallet: { wallet: string; name: string } | null
  goBack: () => void
}

type CourseRow = { courseName: string; courseNumber: string; marks: string }

// ---------- Component ----------
export default function ProformaForm({ wallet, goBack }: ProformaFormProps) {
  const { activeAddress, signTransactions } = useWallet()

  const [connectedInstitution, setConnectedInstitution] = useState<string | null>(null)
  const [university, setUniversity] = useState('')

  const [studentName, setStudentName] = useState('')
  const [seatNumber, setSeatNumber] = useState('')
  const [faculty, setFaculty] = useState('')
  const [department, setDepartment] = useState('')
  const [program, setProgram] = useState<string>('') // optional based on department
  const [semester, setSemester] = useState<string>('1')
  const [numCourses, setNumCourses] = useState<6 | 7>(6)
  const [courses, setCourses] = useState<CourseRow[]>(Array.from({ length: 6 }, () => ({ courseName: '', courseNumber: '', marks: '' })))

  const [loading, setLoading] = useState(false)

  // University mapping by connected wallet
  useEffect(() => {
    if (wallet?.wallet || activeAddress) {
      const address = wallet?.wallet || activeAddress || ''
      const match = registeredInstitutions.find((inst) => inst.wallet.toLowerCase() === address.toLowerCase())
      const uniName = match ? match.name : ''
      setConnectedInstitution(match ? match.name : null)
      setUniversity(uniName)

      // Initialize faculty selection defaults if available
      const facs = uniStructure[uniName]?.[0]
      if (facs) {
        setFaculty(facs.faculty)
        const dep0 = facs.departments?.[0]
        if (dep0) {
          setDepartment(dep0.name)
          setProgram(dep0.programs?.[0] || '')
        }
      }
    }
  }, [wallet, activeAddress])

  // Faculties available for this institution
  const faculties = useMemo(() => (university ? uniStructure[university] || [] : []), [university])

  // Departments for selected faculty
  const departments = useMemo(() => {
    const f = faculties.find((f) => f.faculty === faculty)
    return f?.departments || []
  }, [faculties, faculty])

  // Current department object (to check program options)
  const currentDept = useMemo(() => departments.find((d) => d.name === department), [departments, department])

  // Update programs when department changes
  useEffect(() => {
    if (currentDept) {
      const progList = currentDept.programs || []
      setProgram(progList.length ? progList[0] : '')
    } else {
      setProgram('')
    }
  }, [currentDept])

  // Adjust course rows when user toggles 6/7
  useEffect(() => {
    setCourses((prev) => {
      const target = numCourses
      if (prev.length === target) return prev
      if (prev.length < target) {
        return [...prev, ...Array.from({ length: target - prev.length }, () => ({ courseName: '', courseNumber: '', marks: '' }))]
      } else {
        return prev.slice(0, target)
      }
    })
  }, [numCourses])

  // Semesters 1–8 by default
  const semesters = Array.from({ length: 8 }, (_, i) => String(i + 1))

  const handleCourseChange = (idx: number, key: keyof CourseRow, value: string) => {
    setCourses((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: value }
      return next
    })
  }

  const validateForm = (): string | null => {
    if (!connectedInstitution) return 'Connected wallet is not a registered institution.'
    if (!studentName.trim()) return 'Please enter the student name.'
    if (!seatNumber.trim()) return 'Please enter the seat number.'
    if (!faculty) return 'Please select a faculty.'
    if (!department) return 'Please select a department.'
    if (!semester) return 'Please select a semester.'
    for (let i = 0; i < courses.length; i++) {
      const c = courses[i]
      if (!c.courseName.trim() || !c.courseNumber.trim() || !c.marks.trim()) {
        return `Please complete course row ${i + 1}.`
      }
      if (isNaN(Number(c.marks)) || Number(c.marks) < 0) {
        return `Marks must be a non-negative number in row ${i + 1}.`
      }
    }
    return null
  }

  const handleMint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const err = validateForm()
      if (err) throw new Error(err)

      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

      // Build plaintext payload to encrypt
      const payload = {
        studentName: studentName.trim(),
        seatNumber: seatNumber.trim(),
        university,
        faculty,
        department,
        program: program || undefined,
        semester: Number(semester),
        courses: courses.map((c) => ({
          courseName: c.courseName.trim(),
          courseNumber: c.courseNumber.trim(),
          marks: Number(c.marks),
        })),
      }

      // Encrypt payload
      const { ivB64, cipherB64 } = await aesGcmEncryptJSON(payload, seatNumber.trim())

      // Hash (studentName|university|seatNumber|semester)
      const hashBase64 = await sha256Base64(
        `${studentName.trim().toLowerCase()}|${university.trim().toLowerCase()}|${seatNumber.trim().toLowerCase()}|${semester.trim()}`,
      )

      // ARC-69 metadata
      const metadata = {
        standard: 'arc69',
        description: 'Semester Proforma NFT (Privacy-Preserving)',
        media_url: '',
        properties: {
          enc: {
            alg: 'AES-GCM-256',
            iv: ivB64,
            ciphertext: cipherB64,
          },
          sha256: hashBase64,
        },
      }

      const params = await algodClient.getTransactionParams().do()
      // Create the semester NFT
      const assetName = `Semester ${semester} Proforma`
      const unitName = 'PROFRM'
      const nftTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: activeAddress!,
        total: 1,
        decimals: 0,
        assetName,
        unitName,
        assetURL: '',
        note: new TextEncoder().encode(JSON.stringify(metadata)),
        defaultFrozen: false,
        suggestedParams: params,
      })

      // --- SaaS fee transaction (0.1 TUSD) ---
      const feeTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress!,
        receiver: FEE_RECEIVER,
        amount: FEE_AMOUNT,
        assetIndex: TEST_USD_ID,
        suggestedParams: params,
      })

      // Pay Fee
      {
        const encodedTxn = algosdk.encodeUnsignedTransaction(feeTxn)
        const signed = await signTransactions([encodedTxn])
        const signedBytes = signed[0] instanceof Uint8Array ? signed[0] : new Uint8Array(signed[0] as unknown as ArrayBuffer)
        const sendResult = await algodClient.sendRawTransaction(signedBytes).do()
        await algosdk.waitForConfirmation(algodClient, sendResult.txid, 4)

        alert(`✅ SaaS Fee of 0.1 TUSD paid!\nTxID: ${sendResult.txid}`)
      }

      // Mint NFT
      {
        const encodedTxn = algosdk.encodeUnsignedTransaction(nftTxn)
        const signed = await signTransactions([encodedTxn])
        const signedBytes = signed[0] instanceof Uint8Array ? signed[0] : new Uint8Array(signed[0] as unknown as ArrayBuffer)
        const sendResult = await algodClient.sendRawTransaction(signedBytes).do()
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, sendResult.txid, 4)

        const assetID =
          (confirmedTxn as any)['asset-index'] ||
          (confirmedTxn as any)['assetIndex'] ||
          (confirmedTxn as any)['inner-txns']?.[0]?.['created-asset-id']

        alert(`✅ Semester Proforma NFT minted!\nTxID: ${sendResult.txid}\nAsset ID: ${assetID}`)
      }

      goBack()
    } catch (e: any) {
      alert(`❌ Failed to mint Semester Proforma NFT.\n${e?.message || ''}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleMint} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">📘 Mint Semester Proforma NFT</h2>

      <div className="text-sm text-gray-700">
        <strong>Connected Institution:</strong>
        <br />
        <code className="bg-gray-100 p-2 rounded block">{connectedInstitution || '❌ Not a registered institution'}</code>
      </div>

      {!connectedInstitution ? (
        <div className="text-red-600 mt-2">This wallet is not registered. Minting is disabled.</div>
      ) : (
        <>
          {/* University (locked) */}
          <div>
            <label className="block text-sm font-medium">University</label>
            <input type="text" className="input input-bordered w-full" value={university} disabled />
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-sm font-medium">Student Full Name</label>
            <input
              required
              type="text"
              className="input input-bordered w-full"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>

          {/* Seat Number */}
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

          {/* Faculty */}
          <div>
            <label className="block text-sm font-medium">Faculty</label>
            <select
              required
              className="input input-bordered w-full"
              value={faculty}
              onChange={(e) => {
                setFaculty(e.target.value)
                const f = (uniStructure[university] || []).find((x) => x.faculty === e.target.value)
                const dep0 = f?.departments?.[0]
                setDepartment(dep0?.name || '')
                setProgram(dep0?.programs?.[0] || '')
              }}
            >
              {(uniStructure[university] || []).map((f) => (
                <option key={f.faculty} value={f.faculty}>
                  {f.faculty}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium">Department</label>
            <select
              required
              className="input input-bordered w-full"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value)
                const dep = departments.find((d) => d.name === e.target.value)
                setProgram(dep?.programs?.[0] || '')
              }}
            >
              {departments.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Program */}
          {currentDept?.programs && currentDept.programs.length > 0 && (
            <div>
              <label className="block text-sm font-medium">Program</label>
              <select className="input input-bordered w-full" value={program} onChange={(e) => setProgram(e.target.value)}>
                {currentDept.programs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium">Semester</label>
            <select required className="input input-bordered w-full" value={semester} onChange={(e) => setSemester(e.target.value)}>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Courses */}
          <div>
            <label className="block text-sm font-medium">Number of Courses</label>
            <select
              className="input input-bordered w-full"
              value={numCourses}
              onChange={(e) => setNumCourses(Number(e.target.value) === 7 ? 7 : 6)}
            >
              <option value={6}>6</option>
              <option value={7}>7</option>
            </select>
          </div>

          {/* Course Rows */}
          <div className="grid grid-cols-1 gap-3">
            {courses.map((c, idx) => (
              <div key={idx} className="grid md:grid-cols-3 gap-3 p-3 rounded border">
                <div>
                  <label className="block text-sm font-medium">Course Name (#{idx + 1})</label>
                  <input
                    required
                    type="text"
                    className="input input-bordered w-full"
                    value={c.courseName}
                    onChange={(e) => handleCourseChange(idx, 'courseName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Course Number</label>
                  <input
                    required
                    type="text"
                    className="input input-bordered w-full"
                    value={c.courseNumber}
                    onChange={(e) => handleCourseChange(idx, 'courseNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Marks</label>
                  <input
                    required
                    type="number"
                    min={0}
                    className="input input-bordered w-full"
                    value={c.marks}
                    onChange={(e) => handleCourseChange(idx, 'marks', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
            {loading ? 'Minting...' : 'Mint Semester Proforma (Fee 0.1 TUSD)'}
          </button>

          <button type="button" onClick={goBack} className="mt-2 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400">
            Go Back
          </button>
        </>
      )}
    </form>
  )
}
