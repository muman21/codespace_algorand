/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import algosdk from 'algosdk'
import domtoimage from 'dom-to-image-more'
import { registeredInstitutions } from '../utils/registeredinstitutions'
import { calculateCGPAForInstitution, gradingMap } from '../utils/grading'
import { CONFIG } from '../configure/network'

// AES Key from Seat Number
async function deriveAesKeyFromSeat(seatNumber: string): Promise<CryptoKey> {
  const material = new TextEncoder().encode(seatNumber.trim())
  const hash = await crypto.subtle.digest('SHA-256', material)
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['decrypt'])
}

// Base64 → ArrayBuffer
function fromBase64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// Note (string/Uint8Array) → ArrayBuffer
function noteToArrayBuffer(note: string | Uint8Array): ArrayBuffer {
  if (typeof note === 'string') {
    const binary = atob(note)
    const arr = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
    return arr.buffer
  } else if (note instanceof Uint8Array) {
    return note.buffer as ArrayBuffer
  } else {
    throw new Error('Unsupported note format')
  }
}

// AES-GCM decrypt JSON
async function aesGcmDecryptJSON(ivB64: string, cipherB64: string, seatNumber: string): Promise<any> {
  const key = await deriveAesKeyFromSeat(seatNumber)
  const ivBuf = fromBase64ToArrayBuffer(ivB64)
  const cipherBuf = fromBase64ToArrayBuffer(cipherB64)
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuf) }, key, cipherBuf)
  const text = new TextDecoder().decode(plainBuf)
  return JSON.parse(text)
}

// Numbers to words (0–100)
function numberToWords(num: number): string {
  const ones = [
    'Zero',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  if (num < 20) return ones[num]
  if (num === 100) return 'One Hundred'
  const tenUnit = Math.floor(num / 10)
  const oneUnit = num % 10
  return oneUnit === 0 ? tens[tenUnit] : `${tens[tenUnit]} ${ones[oneUnit]}`
}

export default function PrintMarksheet() {
  const [seatNumber, setSeatNumber] = useState('')
  const [studentName, setStudentName] = useState('')
  const [degreeTitle, setDegreeTitle] = useState('')
  const [assetIds, setAssetIds] = useState('')
  const [semesters, setSemesters] = useState<any[]>([])
  const [institutionName, setInstitutionName] = useState<string>('')
  const [status, setStatus] = useState('')

  const handleFetchAll = async () => {
    try {
      setStatus('🔍 Fetching all semesters...')

      const indexerFast = new algosdk.Indexer('', CONFIG.indexer, '')
      const indexerArchive = new algosdk.Indexer('', CONFIG.archiveIndexer, '')

      const ids = assetIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
      const semesterData: any[] = []

      for (const id of ids) {
        let txns
        try {
          txns = await indexerFast.searchForTransactions().assetID(Number(id)).txType('acfg').limit(1).do()
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Fast indexer failed, trying archival...', e)
          txns = { transactions: [] }
        }

        if (!txns.transactions || txns.transactions.length === 0) {
          try {
            txns = await indexerArchive.searchForTransactions().assetID(Number(id)).txType('acfg').limit(1).do()
          } catch {
            throw new Error(`Both indexers failed for Asset ${id}`)
          }
        }

        if (!txns.transactions?.length) throw new Error(`No creation txn found for Asset ${id}`)
        const creationTxn = txns.transactions[0]
        if (!creationTxn.note) throw new Error(`No note found in txn for Asset ${id}`)

        const creatorWallet = creationTxn.sender
        const institution = registeredInstitutions.find((inst) => inst.wallet === creatorWallet)
        const uniName = institution ? institution.name : 'Unknown Institution'
        setInstitutionName(uniName)

        const noteBuf = noteToArrayBuffer(creationTxn.note)
        const noteStr = new TextDecoder().decode(noteBuf)
        const metadata = JSON.parse(noteStr)
        const enc = metadata?.properties?.enc
        if (!enc) throw new Error(`No encryption data found in Asset ${id}`)

        const decrypted = await aesGcmDecryptJSON(enc.iv, enc.ciphertext, seatNumber.trim())
        if (decrypted.seatNumber.toLowerCase() !== seatNumber.trim().toLowerCase()) throw new Error('Seat number mismatch')

        semesterData.push(decrypted)
      }

      setSemesters(semesterData)
      setStatus('✅ All semesters fetched successfully!')
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err)
      setStatus(`❌ ${err.message}`)
    }
  }

  const handlePrint = async () => {
    try {
      const element1 = document.getElementById('marksheet-summary')
      const element2 = document.getElementById('course-reference')
      if (!element1 || !element2) throw new Error('Print elements not found')

      const summaryUrl = await domtoimage.toPng(element1, { quality: 1, bgcolor: '#ffffff' })
      const referenceUrl = await domtoimage.toPng(element2, { quality: 1, bgcolor: '#ffffff' })

      const link1 = document.createElement('a')
      link1.href = summaryUrl
      link1.download = `marksheet_summary_${seatNumber}.png`
      document.body.appendChild(link1)
      link1.click()
      document.body.removeChild(link1)

      const link2 = document.createElement('a')
      link2.href = referenceUrl
      link2.download = `course_reference_${seatNumber}.png`
      document.body.appendChild(link2)
      link2.click()
      document.body.removeChild(link2)

      setStatus('📥 Downloads started!')
    } catch (err: any) {
      setStatus(`❌ Print failed: ${err.message}`)
    }
  }

  const totalSemestersRequired = (() => {
    const d = degreeTitle.toLowerCase()
    if (d.includes('bs') || d.includes('ba') || d.includes('be') || d.includes('bba')) return 8
    if (d.includes('ms') || d.includes('ma') || d.includes('me') || d.includes('mba')) return 4
    if (d.includes('mphil') || d.includes('phd')) return 2
    return 0
  })()
  const degreeCompleted = semesters.length === totalSemestersRequired

  const getRows = (items: any[]) => {
    const rows: any[][] = []
    const maxPerPage = 8
    const chunked = items.slice(0, maxPerPage)
    for (let i = 0; i < chunked.length; i += 3) rows.push(chunked.slice(i, i + 3))
    return rows
  }

  const semesterRows = getRows(semesters)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🖨 Print Complete Marksheet</h2>

      <div className="flex flex-col gap-3 mb-4">
        <input className="border p-2" placeholder="Seat Number" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
        <input className="border p-2" placeholder="Student Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
        <input className="border p-2" placeholder="Degree Title" value={degreeTitle} onChange={(e) => setDegreeTitle(e.target.value)} />
        <textarea
          className="border p-2"
          placeholder="Comma-separated Asset IDs for all semesters"
          value={assetIds}
          onChange={(e) => setAssetIds(e.target.value)}
        />
        <button onClick={handleFetchAll} className="bg-blue-600 text-white py-2 rounded">
          Verify & Print
        </button>
      </div>

      {status && <div className="mb-4">{status}</div>}

      {semesters.length > 0 && (
        <>
          {/* Page 1: Summary with course numbers only */}
          <div id="marksheet-summary" className="bg-white shadow-lg p-6 flex flex-col min-h-[1100px]">
            <div className="grid grid-cols-3 gap-4 flex-grow">
              {semesterRows.flat().map((sem, idx) => {
                const { total, percentage, cgpa } = calculateCGPAForInstitution(institutionName, sem.courses)
                return (
                  <div key={idx} className="border rounded-xl shadow-md p-3 text-sm break-inside-avoid">
                    <h4 className="font-bold text-center mb-2">{sem.semester}ᵗʰ Semester</h4>
                    <table className="w-full border text-sm">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border px-1">#</th>
                          <th className="border px-1">Course #</th>
                          <th className="border px-1">Marks</th>
                          <th className="border px-1">GPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map((c: any, i: number) => {
                          const calc = gradingMap[institutionName]
                          let subjGPA = 0
                          if (calc) {
                            const res = calc([{ marks: c.marks }])
                            subjGPA = parseFloat(res.cgpa === 'Failed' ? '0' : res.cgpa)
                          }
                          return (
                            <tr key={i}>
                              <td className="border px-1">{i + 1}</td>
                              <td className="border px-1">{c.courseNumber}</td>
                              <td className="border px-1">{c.marks}</td>
                              <td className="border px-1">{subjGPA.toFixed(1)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} className="border px-1 font-bold">
                            Total
                          </td>
                          <td className="border px-1">{total}</td>
                          <td className="border px-1">{cgpa}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border px-1 font-bold">
                            %
                          </td>
                          <td colSpan={2} className="border px-1">
                            {percentage.toFixed(2)}%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )
              })}
            </div>

            {/* Summary sentence at bottom of Page 1 */}
            {(() => {
              const flatCourses = semesters.flatMap((s) => s.courses)
              const { cgpa, percentage } = calculateCGPAForInstitution(institutionName, flatCourses)
              const rounded = Math.round(percentage)
              return (
                <div className="mt-auto text-center pt-6 border-t">
                  <p className="font-bold">Overall Degree CGPA: {cgpa}</p>
                  <p className="font-bold">Overall Degree Percentage: {percentage.toFixed(2)}%</p>
                  <p className="italic">
                    Mr./Ms. {studentName} secured {numberToWords(rounded)} percent ({percentage.toFixed(2)}%) with a CGPA of {cgpa} in{' '}
                    {degreeTitle}.
                  </p>
                  <p className="mt-2">
                    Degree:{' '}
                    <strong>
                      {degreeTitle}
                      {!degreeCompleted && ' (Ongoing)'}
                    </strong>
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Page 2: Course reference table (two equal columns) */}
          <div id="course-reference" className="bg-white shadow-lg p-6 mt-8">
            <h3 className="text-lg font-bold mb-4 text-center">Course Reference Table</h3>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((col) => {
                const flat = semesters.flatMap((s) => s.courses)
                const half = Math.ceil(flat.length / 2)
                const slice = col === 0 ? flat.slice(0, half) : flat.slice(half)
                return (
                  <table key={col} className="w-full border text-sm">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border px-2 py-1">Course #</th>
                        <th className="border px-2 py-1">Course Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slice.map((c: any, i: number) => (
                        <tr key={i}>
                          <td className="border px-2 py-1">{c.courseNumber}</td>
                          <td className="border px-2 py-1">{c.courseName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              })}
            </div>

            <div className="h-6" />
            <div className="h-10"></div>
          </div>

          <button onClick={handlePrint} className="mt-4 bg-green-600 text-white py-2 px-4 rounded">
            Download PNGs
          </button>
        </>
      )}
    </div>
  )
}
