/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import algosdk from 'algosdk'
import domtoimage from 'dom-to-image-more'

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

// AES-GCM decrypt JSON
async function aesGcmDecryptJSON(ivB64: string, cipherB64: string, seatNumber: string): Promise<any> {
  const key = await deriveAesKeyFromSeat(seatNumber)
  const ivBuf = fromBase64ToArrayBuffer(ivB64)
  const cipherBuf = fromBase64ToArrayBuffer(cipherB64)
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuf) }, key, cipherBuf)
  const text = new TextDecoder().decode(plainBuf)
  return JSON.parse(text)
}

// CGPA calculator
function calculateCGPA(courses: { marks: number }[]) {
  let totalMarks = 0
  let failed = false
  const validMarks: number[] = []

  courses.forEach((c) => {
    totalMarks += c.marks
    if (c.marks < 50) failed = true
    else validMarks.push(c.marks)
  })

  const denominator = failed ? validMarks.length * 100 : courses.length * 100
  const obtained = failed ? validMarks.reduce((a, b) => a + b, 0) : totalMarks
  const percentage = (obtained / denominator) * 100

  return { total: obtained, percentage }
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
  const [university, setUniversity] = useState('')
  const [degreeTitle, setDegreeTitle] = useState('')
  const [assetIds, setAssetIds] = useState('')
  const [semesters, setSemesters] = useState<any[]>([])
  const [status, setStatus] = useState('')

  const handleFetchAll = async () => {
    try {
      setStatus('🔍 Fetching all semesters...')
      const indexer = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '')

      const ids = assetIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
      const semesterData: any[] = []

      for (const id of ids) {
        const txns = await indexer.searchForTransactions().assetID(Number(id)).txType('acfg').limit(1).do()
        if (!txns.transactions || txns.transactions.length === 0) throw new Error(`No creation txn for Asset ${id}`)
        const creationTxn = txns.transactions[0]
        if (!creationTxn.note) throw new Error(`No note in txn for Asset ${id}`)

        const noteStr = new TextDecoder().decode(new Uint8Array(creationTxn.note))
        const metadata = JSON.parse(noteStr)
        const enc = metadata?.properties?.enc
        if (!enc) throw new Error(`No enc data in Asset ${id}`)

        const decrypted = await aesGcmDecryptJSON(enc.iv, enc.ciphertext, seatNumber.trim())
        semesterData.push(decrypted)
      }

      setSemesters(semesterData)
      setStatus('✅ All semesters fetched!')
    } catch (err: any) {
      setStatus(`❌ ${err.message}`)
    }
  }

  const handlePrint = async () => {
    try {
      const element = document.getElementById('marksheet-card')
      if (!element) throw new Error('Marksheet card not found')
      const dataUrl = await domtoimage.toPng(element, { quality: 1, bgcolor: '#ffffff' })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `marksheet_${seatNumber}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setStatus('📥 Download started!')
    } catch (err: any) {
      setStatus(`❌ Print failed: ${err.message}`)
    }
  }

  // Degree completion logic
  const totalSemestersRequired = (() => {
    const d = degreeTitle.toLowerCase()
    if (d.includes('bs') || d.includes('ba') || d.includes('be') || d.includes('bba')) return 8
    if (d.includes('ms') || d.includes('ma') || d.includes('me') || d.includes('mba')) return 4
    if (d.includes('mphil') || d.includes('phd')) return 2
    if (d.includes('finance') || d.includes('management')) return 2
    return 0
  })()
  const degreeCompleted = semesters.length === totalSemestersRequired

  // Row grouping logic
  const getRows = (items: any[]) => {
    const len = items.length
    const rows: any[][] = []

    if (len <= 3) {
      rows.push(items.slice(0, len))
      return rows
    }
    if (len === 4) {
      rows.push(items.slice(0, 2), items.slice(2, 4))
      return rows
    }
    if (len === 5) {
      rows.push(items.slice(0, 2), items.slice(2, 4), items.slice(4))
      return rows
    }
    if (len === 6) {
      rows.push(items.slice(0, 3), items.slice(3, 6))
      return rows
    }
    if (len === 7) {
      rows.push(items.slice(0, 3), items.slice(3, 5), items.slice(5, 7))
      return rows
    }
    if (len >= 8) {
      rows.push(items.slice(0, 3), items.slice(3, 6), items.slice(6, 8))
      return rows
    }

    return [items]
  }

  const semesterRows = getRows(semesters)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🖨 Print Complete Marksheet</h2>

      <div className="flex flex-col gap-3 mb-4">
        <input className="border p-2" placeholder="Seat Number" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
        <input className="border p-2" placeholder="Student Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
        <input className="border p-2" placeholder="University Name" value={university} onChange={(e) => setUniversity(e.target.value)} />
        <input className="border p-2" placeholder="Degree Title" value={degreeTitle} onChange={(e) => setDegreeTitle(e.target.value)} />
        <textarea
          className="border p-2"
          placeholder="Comma-separated Asset IDs for all semesters"
          value={assetIds}
          onChange={(e) => setAssetIds(e.target.value)}
        />
        <button onClick={handleFetchAll} className="bg-blue-600 text-white py-2 rounded">
          Fetch & Decrypt
        </button>
      </div>

      {status && <div className="mb-4">{status}</div>}

      {semesters.length > 0 && (
        <>
          <div id="marksheet-card" className="bg-white shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center">{university}</h2>
            <h3 className="text-lg font-semibold text-center mb-6">
              {degreeTitle} {!degreeCompleted && <span>(Ongoing)</span>}
            </h3>

            {/* Display semesters in rows */}
            {semesterRows.map((row, rIdx) => (
              <div key={rIdx} className={`grid gap-4 mb-4 ${row.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {row.map((sem, idx) => {
                  const { total, percentage } = calculateCGPA(sem.courses)
                  const rounded = Math.round(percentage)
                  return (
                    <div key={idx} className="border rounded-xl shadow-md p-3 text-xs">
                      <h4 className="font-bold text-center mb-2">{sem.semester}ᵗʰ Semester</h4>
                      <table className="w-full border text-xs">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border px-1">#</th>
                            <th className="border px-1">Course #</th>
                            <th className="border px-1">Course Name</th>
                            <th className="border px-1">Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sem.courses.map((c: any, i: number) => (
                            <tr key={i}>
                              <td className="border px-1">{i + 1}</td>
                              <td className="border px-1">{c.courseNumber}</td>
                              <td className="border px-1">{c.courseName}</td>
                              <td className="border px-1">{c.marks}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="border px-1 font-bold">
                              Total
                            </td>
                            <td className="border px-1">{total}</td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="border px-1 font-bold">
                              %
                            </td>
                            <td className="border px-1">{percentage.toFixed(2)}%</td>
                          </tr>
                        </tfoot>
                      </table>
                      <p className="mt-2 italic text-xs">
                        Mr./Ms. {studentName} secured {numberToWords(rounded)} percent in {sem.semester}ᵗʰ semester.
                      </p>
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Overall summary */}
            {(() => {
              const percentages = semesters.map((s) => calculateCGPA(s.courses).percentage)
              const overall = percentages.reduce((a, b) => a + b, 0) / percentages.length
              const rounded = Math.round(overall)
              return (
                <div className="mt-6 text-center">
                  <p className="font-bold">Overall Degree Percentage: {overall.toFixed(2)}%</p>
                  <p className="italic">In words: {numberToWords(rounded)} Percent</p>
                  <p className="mt-2">
                    Student: <strong>{studentName}</strong> | Degree:{' '}
                    <strong>
                      {degreeTitle}
                      {!degreeCompleted && ' (Ongoing)'}
                    </strong>
                  </p>
                </div>
              )
            })()}
          </div>

          <button onClick={handlePrint} className="mt-4 bg-green-600 text-white py-2 px-4 rounded">
            Download PNG
          </button>
        </>
      )}
    </div>
  )
}
