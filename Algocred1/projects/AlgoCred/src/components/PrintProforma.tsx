/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import algosdk from 'algosdk'
import domtoimage from 'dom-to-image-more'
import { registeredInstitutions } from '../utils/registeredinstitutions'
import { calculateCGPAForInstitution, gradingMap } from '../utils/grading' // ✅ import gradingMap too

// AES Decrypt
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

export default function PrintProforma() {
  const [assetId, setAssetId] = useState('')
  const [seatNumber, setSeatNumber] = useState('')
  const [data, setData] = useState<any | null>(null)
  const [status, setStatus] = useState('')
  const [institutionName, setInstitutionName] = useState<string>('')

  const handleFetch = async () => {
    try {
      setStatus('🔍 Fetching asset details...')

      const indexerFast = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '')
      const indexerArchive = new algosdk.Indexer('', 'https://mainnet-idx.algonode.cloud', '')

      let txns
      try {
        txns = await indexerFast.searchForTransactions().assetID(Number(assetId)).txType('acfg').limit(1).do()
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Fast indexer failed, trying archival...', e)
        txns = { transactions: [] }
      }

      if (!txns.transactions || txns.transactions.length === 0) {
        try {
          txns = await indexerArchive.searchForTransactions().assetID(Number(assetId)).txType('acfg').limit(1).do()
        } catch {
          throw new Error('Both indexers failed to fetch transactions')
        }
      }

      if (!txns.transactions?.length) throw new Error('No asset creation transaction found for this Asset ID')
      const creationTxn = txns.transactions[0]
      if (!creationTxn.note) throw new Error('No note found in asset creation transaction')

      const creatorWallet = creationTxn.sender
      const institution = registeredInstitutions.find((inst) => inst.wallet === creatorWallet)
      const uniName = institution ? institution.name : 'Unknown Institution'
      setInstitutionName(uniName)

      const noteBuf = noteToArrayBuffer(creationTxn.note)
      const noteStr = new TextDecoder().decode(noteBuf)
      const metadata = JSON.parse(noteStr)
      const enc = metadata?.properties?.enc
      if (!enc) throw new Error('No encryption data found in asset')

      const decrypted = await aesGcmDecryptJSON(enc.iv, enc.ciphertext, seatNumber.trim())
      if (decrypted.seatNumber.toLowerCase() !== seatNumber.trim().toLowerCase()) throw new Error('Seat number mismatch')

      setData(decrypted)
      setStatus('✅ Success! Proforma ready.')
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err)
      setStatus(`❌ ${err.message}`)
    }
  }

  const handlePrint = async () => {
    try {
      const element = document.getElementById('proforma-card')
      if (!element) throw new Error('Proforma card not found')
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1,
        bgcolor: '#ffffff',
        style: { backgroundColor: '#ffffff', color: '#000000' },
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `proforma_${seatNumber}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setStatus('📥 Download started!')
    } catch (err: any) {
      setStatus(`❌ Print failed: ${err.message}`)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🖨 Print Semester Proforma</h2>
      <div className="flex flex-col gap-3 mb-4">
        <input className="border p-2" placeholder="Asset ID" value={assetId} onChange={(e) => setAssetId(e.target.value)} />
        <input className="border p-2" placeholder="Seat Number" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
        <button onClick={handleFetch} className="bg-blue-600 text-white py-2 rounded">
          Verify & Print
        </button>
      </div>
      {status && <div className="mb-4">{status}</div>}

      {data && (
        <>
          <div id="proforma-card" className="bg-white shadow-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-2">{institutionName}</h2>
            <h3 className="text-lg font-semibold text-center mb-4">{data.semester}ᵗʰ Semester Proforma</h3>

            <p>
              <strong>Student:</strong> {data.studentName}
            </p>
            <p>
              <strong>Seat No:</strong> {data.seatNumber}
            </p>

            <table className="w-full border mt-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-2">S#</th>
                  <th className="border px-2">Course Number</th>
                  <th className="border px-2">Course Name</th>
                  <th className="border px-2">Marks</th>
                  <th className="border px-2">GPA</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((c: any, i: number) => {
                  const calc = gradingMap[institutionName]
                  let subjGPA = 0
                  if (calc) {
                    const res = calc([{ marks: c.marks }])
                    subjGPA = parseFloat(res.cgpa === 'Failed' ? '0' : res.cgpa)
                  }
                  return (
                    <tr key={i}>
                      <td className="border px-2">{i + 1}</td>
                      <td className="border px-2">{c.courseNumber}</td>
                      <td className="border px-2">{c.courseName}</td>
                      <td className="border px-2">{c.marks}</td>
                      <td className="border px-2">{subjGPA.toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const { total, percentage, cgpa } = calculateCGPAForInstitution(institutionName, data.courses)
                  const rounded = Math.round(percentage)
                  const gpaSum = data.courses.reduce((sum: number, c: any) => {
                    const calc = gradingMap[institutionName]
                    if (!calc) return sum
                    const res = calc([{ marks: c.marks }])
                    const subjGPA = parseFloat(res.cgpa === 'Failed' ? '0' : res.cgpa)
                    return sum + subjGPA
                  }, 0)
                  const avgGPA = gpaSum / data.courses.length

                  return (
                    <>
                      <tr>
                        <td colSpan={3} className="border px-2 font-bold">
                          Total
                        </td>
                        <td className="border px-2">{total}</td>
                        <td className="border px-2">{avgGPA.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="border px-2 font-bold">
                          Percentage
                        </td>
                        <td className="border px-2" colSpan={2}>
                          {percentage.toFixed(2)}%
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="border px-2 font-bold">
                          CGPA
                        </td>
                        <td className="border px-2" colSpan={2}>
                          {cgpa}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-2 py-3 italic">
                          Mr./Ms. {data.studentName} has secured {numberToWords(rounded)} percent with a GPA of {cgpa} in {data.semester}ᵗʰ
                          semester.
                        </td>
                      </tr>
                    </>
                  )
                })()}
              </tfoot>
            </table>
          </div>

          <button onClick={handlePrint} className="mt-4 bg-green-600 text-white py-2 px-4 rounded">
            Download PNG
          </button>
        </>
      )}
    </div>
  )
}
