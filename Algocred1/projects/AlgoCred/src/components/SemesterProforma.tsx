/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Registered institutions
import { registeredInstitutions } from '../utils/registeredinstitutions'

// SaaS Fee Config (same as original semester proforma)
const TEST_USD_ID = 745142652
const TEST_USD_DECIMALS = 2
const FEE_AMOUNT = 0.1 * 10 ** TEST_USD_DECIMALS // 0.1 TUSD per student
const FEE_RECEIVER = 'CRL73DO2N6HT25UJVAF3VKSIXELBDOIQBZ44LTQCLYBLRCAHRYJBUNOVZQ'

// ---------- Crypto Helpers (AES-GCM-256 with key derived from seat number) ----------
async function deriveAesKeyFromSeat(seatNumber: string): Promise<CryptoKey> {
  const material = new TextEncoder().encode(seatNumber.trim())
  const hash = await crypto.subtle.digest('SHA-256', material)
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt'])
}

function toBase64(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8))
}

async function aesGcmEncryptJSON(plainObj: any, seatNumber: string): Promise<{ ivB64: string; cipherB64: string }> {
  const key = await deriveAesKeyFromSeat(seatNumber)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(plainObj))
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return { ivB64: toBase64(iv), cipherB64: toBase64(new Uint8Array(cipherBuf)) }
}

// ---------- Component ----------
type Props = { wallet: { wallet: string; name: string } | null; goBack: () => void }

// Normalize header by removing non-alphanumeric and lowercasing
function normalizeHeader(h: string) {
  return String(h || '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

export default function SemesterProformaBatchMint({ wallet, goBack }: Props) {
  const { activeAddress, signTransactions } = useWallet()

  const [connectedInstitution, setConnectedInstitution] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ total: 0, done: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (wallet?.wallet || activeAddress) {
      const address = wallet?.wallet || activeAddress || ''
      const match = registeredInstitutions.find((inst) => inst.wallet.toLowerCase() === address.toLowerCase())
      setConnectedInstitution(match ? match.name : null)
    }
  }, [wallet, activeAddress])

  // Required headers (normalized keys)
  const REQUIRED_COLUMNS = [
    'serialnumber',
    'seatnumber',
    'studentname',
    'fathersname',
    'department',
    'degreetitle',
    'semesternumber',
    'course1details',
    'course2details',
    'course3details',
    'course4details',
    'course5details',
    'course6details',
    'course7details',
  ]

  const handleFile = async (file: File) => {
    setError(null)
    setLoading(true)
    setProgress({ total: 0, done: 0 })

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 })

      if (!json || json.length === 0) throw new Error('Empty spreadsheet')

      const headersRow: string[] = (json[0] || []).map((h: any) => (h ? String(h) : ''))
      const headerMap: Record<string, number> = {}
      headersRow.forEach((h: any, idx: number) => (headerMap[normalizeHeader(String(h || ''))] = idx))

      const missing: string[] = []
      for (const rc of REQUIRED_COLUMNS) {
        if (headerMap[rc] === undefined) missing.push(rc)
      }
      if (missing.length > 0) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`)
      }

      const rows: any[] = []
      for (let r = 1; r < json.length; r++) {
        const row = json[r]
        if (!row || row.length === 0) continue
        const obj: any = {}
        for (const key of Object.keys(headerMap)) {
          obj[key] = row[headerMap[key]] !== undefined ? row[headerMap[key]] : ''
        }
        for (const k of Object.keys(obj)) obj[k] = String(obj[k] ?? '').trim()

        const nonCourseKeys = ['serialnumber', 'seatnumber', 'studentname', 'fathersname', 'department', 'degreetitle', 'semesternumber']
        const emptyNonCourse = nonCourseKeys.filter((k) => obj[k] === '')
        if (emptyNonCourse.length > 0) {
          throw new Error(`Row ${r + 1} has empty required columns: ${emptyNonCourse.join(', ')}`)
        }

        const courses: { courseName: string; courseNumber: string; marks: number }[] = []
        for (let ci = 1; ci <= 7; ci++) {
          const key = `course${ci}details`
          const cell = obj[key] || ''
          if (!cell) continue
          const parts = String(cell)
            .split(':')
            .map((p) => p.trim())
          if (parts.length !== 3) {
            throw new Error(`Row ${r + 1} column Course ${ci} details invalid format`)
          }
          const marks = Number(parts[2])
          if (isNaN(marks) || marks < 0) {
            throw new Error(`Row ${r + 1} column Course ${ci} details has invalid marks`)
          }
          courses.push({ courseName: parts[0], courseNumber: parts[1], marks })
        }
        if (courses.length === 0) {
          throw new Error(`Row ${r + 1} has no course details`)
        }

        obj['parsedCourses'] = courses
        rows.push(obj)
      }

      if (rows.length === 0) throw new Error('No student rows found')

      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
      const results: any[] = []

      const BATCH_SIZE = 16
      setProgress({ total: rows.length, done: 0 })

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batchRows = rows.slice(i, i + BATCH_SIZE)
        const params = await algodClient.getTransactionParams().do()
        const txns: algosdk.Transaction[] = []

        // ✅ Only charge fee if the institution is NOT feeExempt
        const matchedInstitution = registeredInstitutions.find((inst) => inst.name === connectedInstitution)
        if (!matchedInstitution?.feeExempt) {
          const feeTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            sender: activeAddress!,
            receiver: FEE_RECEIVER,
            amount: FEE_AMOUNT * batchRows.length,
            assetIndex: TEST_USD_ID,
            suggestedParams: params,
          })
          txns.push(feeTxn)
        } else {
          // eslint-disable-next-line no-console
          console.log(`💡 Fee skipped for ${connectedInstitution}`)
        }

        const batchAssetNames: string[] = [] // store asset names aligned with transactions

        for (const row of batchRows) {
          const universityName = connectedInstitution || ''
          const payloadPlain = {
            seatNumber: String(row['seatnumber']),
            studentName: String(row['studentname']),
            fathersName: String(row['fathersname']),
            department: String(row['department']),
            degreeTitle: String(row['degreetitle']),
            semester: String(row['semesternumber']),
            courses: row['parsedCourses'],
          }

          const { ivB64, cipherB64 } = await aesGcmEncryptJSON(payloadPlain, String(row['seatnumber']))

          // Compute sha256 hash digest (raw bytes for assetMetadataHash)
          const hashInput = `${String(row['studentname']).trim().toLowerCase()}|${universityName.trim().toLowerCase()}|${String(
            row['seatnumber'],
          )
            .trim()
            .toLowerCase()}|${String(row['semesternumber']).trim()}`
          const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput))
          const metadataHash = new Uint8Array(hashBuffer)

          const metadata = {
            standard: 'arc69',
            description: 'Semester Proforma NFT (Privacy-Preserving)',
            properties: {
              enc: { alg: 'AES-GCM-256', iv: ivB64, ciphertext: cipherB64 },
            },
          }

          // Helper: get initials from university name
          // eslint-disable-next-line no-inner-declarations
          function getInitials(name: string): string {
            return name
              .split(' ')
              .map((word) => word[0]?.toUpperCase() || '')
              .join('')
          }

          const uniInitials = getInitials(connectedInstitution || '')
          const semNum = String(row['semesternumber']).trim()
          const assetName = `Sem ${semNum} ${uniInitials}`
          const unitName = `S${semNum}${uniInitials}`

          batchAssetNames.push(assetName)

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
            assetMetadataHash: metadataHash,
          })

          txns.push(nftTxn)
        }

        // ----------------- Edited Signing & Minting Loop -----------------
        const encodedUnsigned = txns.map((t) => algosdk.encodeUnsignedTransaction(t))
        const signedBlobs = await signTransactions(encodedUnsigned)
        if (!signedBlobs || signedBlobs.length === 0) throw new Error('Batch signing failed')

        const feeOffset = !matchedInstitution?.feeExempt ? 1 : 0 // skip fee txn

        for (let k = 0; k < signedBlobs.length; k++) {
          const signed = signedBlobs[k]
          if (!signed) throw new Error('A transaction was not signed')
          const { txid } = await algodClient.sendRawTransaction(signed).do()
          const conf = await algosdk.waitForConfirmation(algodClient, txid, 4)

          if (k >= feeOffset) {
            const createdAssetId =
              (conf as any)['asset-index'] || (conf as any)['assetIndex'] || (conf as any)['inner-txns']?.[0]?.['created-asset-id']

            const rowIndex = i + (k - feeOffset)
            const studentRow = rows[rowIndex]
            const mintedAssetName = batchAssetNames[k - feeOffset]

            results.push({
              seat: String(studentRow['seatnumber'] || ''),
              name: String(studentRow['studentname'] || ''),
              father: String(studentRow['fathersname'] || ''),
              university: connectedInstitution || '',
              department: String(studentRow['department'] || ''),
              degreeTitle: String(studentRow['degreetitle'] || ''),
              semester: String(studentRow['semesternumber'] || ''),
              assetName: mintedAssetName,
              assetId: createdAssetId ? Number(createdAssetId) : undefined,
              txId: txid,
              serial: Number(studentRow['serialnumber'] || 0),
            })

            setProgress((p) => ({ total: p.total, done: p.done + 1 }))
          }
        }

        await new Promise((res) => setTimeout(res, 300))
      }

      const outRows = [
        [
          'Serial',
          'Seat Number',
          'Student Name',
          "Father's Name",
          'University',
          'Department',
          'Degree Title',
          'Semester',
          'Asset Name',
          'Asset ID',
          'Tx ID',
        ],
      ]
      results.sort((a, b) => (a.serial || 0) - (b.serial || 0))
      for (const r of results) {
        outRows.push([
          String(r.serial ?? ''),
          String(r.seat ?? ''),
          String(r.name ?? ''),
          String(r.father ?? ''),
          String(r.university ?? ''),
          String(r.department ?? ''),
          String(r.degreeTitle ?? ''),
          String(r.semester ?? ''),
          String(r.assetName ?? ''),
          String(r.assetId ?? ''),
          String(r.txId ?? ''),
        ])
      }

      const outWb = XLSX.utils.book_new()
      const outWs = XLSX.utils.aoa_to_sheet(outRows)
      XLSX.utils.book_append_sheet(outWb, outWs, 'minted')

      const wbout = XLSX.write(outWb, { type: 'array', bookType: 'xlsx' })
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'semester_mint_results.xlsx')

      alert(`✅ Minting completed. ${results.length} NFTs minted.`)
      goBack()
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err)
      setError(err?.message || 'Failed to process file and mint NFTs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">📘 Batch Mint Semester Proforma NFTs (Excel Upload)</h2>

      <div className="text-sm text-gray-700">
        <strong>Connected Institution:</strong>
        <br />
        <code className="bg-gray-100 p-2 rounded block">{connectedInstitution || '❌ Not a registered institution'}</code>
      </div>

      {!connectedInstitution ? (
        <div className="text-red-600 mt-2">This wallet is not registered. Minting is disabled.</div>
      ) : (
        <>
          <p className="text-sm">Upload an Excel file (.xlsx) with these headers (order doesn't matter):</p>
          <ul className="text-xs list-disc ml-6">
            <li>Serial number</li>
            <li>Seat number</li>
            <li>Student name</li>
            <li>Father's name</li>
            <li>Department</li>
            <li>Degree title</li>
            <li>Semester number</li>
            <li>Course1 details (course name: course number: marks)</li>
            <li>Course2 details (course name: course number: marks)</li>
            <li>Course3 details (course name: course number: marks)</li>
            <li>Course4 details (course name: course number: marks)</li>
            <li>Course5 details (course name: course number: marks)</li>
            <li>Course6 details (course name: course number: marks)</li>
            <li>Course7 details (course name: course number: marks)</li>
          </ul>

          <input
            type="file"
            accept=".xlsx,.xls"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files && e.target.files[0]
              if (f) handleFile(f)
              e.currentTarget.value = ''
            }}
            className="mt-2"
          />

          {loading && (
            <div className="mt-2">
              <div>
                Minting progress: {progress.done} / {progress.total}
              </div>
              <div className="w-full bg-gray-200 rounded h-3 mt-1">
                <div
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                  className="h-3 rounded bg-blue-600"
                />
              </div>
            </div>
          )}

          {error && <div className="text-red-600 mt-2">Error: {error}</div>}

          <button onClick={goBack} className="mt-4 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400">
            Go Back
          </button>
        </>
      )}
    </div>
  )
}
