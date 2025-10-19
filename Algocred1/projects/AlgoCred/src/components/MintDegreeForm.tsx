/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Registered institutions (imported instead of hardcoded)
import { registeredInstitutions } from '../utils/registeredinstitutions'

const TEST_USD_ID = 745142652
const TEST_USD_DECIMALS = 2
const FEE_AMOUNT = 9 * 10 ** TEST_USD_DECIMALS // 9 TUSD per student
const FEE_RECEIVER = 'CRL73DO2N6HT25UJVAF3VKSIXELBDOIQBZ44LTQCLYBLRCAHRYJBUNOVZQ'

type MintDegreeFormProps = {
  wallet: { wallet: string; name: string } | null
  goBack: () => void
}

// 🔑 Hash format aligned with VerifyDegreeForm
function formatDegreeData(
  studentName: string,
  universityName: string,
  gradYear: string,
  degreeTitle: string,
  seatNumber: string,
  percentage: string,
) {
  return `${studentName.trim().toLowerCase()}|${universityName.trim().toLowerCase()}|${gradYear.trim()}|${degreeTitle.trim().toLowerCase()}|${seatNumber.trim().toLowerCase()}|${percentage}`
}

function normalizeHeader(h: string) {
  return h.replace(/\s+/g, '').toLowerCase()
}

function MintDegreeForm({ wallet, goBack }: MintDegreeFormProps) {
  const { activeAddress, signTransactions } = useWallet()

  const [connectedInstitution, setConnectedInstitution] = useState<string | null>(null)
  const [_university, setUniversity] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ total: 0, done: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (wallet?.wallet || activeAddress) {
      const address = wallet?.wallet || activeAddress || ''
      const match = registeredInstitutions.find((inst) => inst.wallet.toLowerCase() === address.toLowerCase())
      setConnectedInstitution(match ? match.name : null)
      setUniversity(match ? match.name : '')
    }
  }, [wallet, activeAddress])

  const REQUIRED_COLUMNS = [
    'serialnumber',
    'studentseatnumber',
    'studentname',
    'fathersname',
    'yearofgraduation',
    'nameoffaculty',
    'nameofdepartment',
    'degreetitle',
    'finalpercentage',
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
      headersRow.forEach((h, idx) => (headerMap[normalizeHeader(String(h || ''))] = idx))

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

        // ✅ Check for any empty field in the row
        const emptyFields = Object.entries(obj).filter(([_, val]) => val === '')
        if (emptyFields.length > 0) {
          throw new Error(`Row ${r + 1} has empty fields: ${emptyFields.map(([k]) => k).join(', ')}`)
        }

        rows.push(obj)
      }

      if (rows.length === 0) throw new Error('No student rows found in the spreadsheet')

      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')

      const results: {
        university: string
        year: string
        degreeTitle: string
        percentage: string
        name: string
        assetId?: number
        txId?: string
        serial?: number
      }[] = []

      const BATCH_SIZE = 16
      setProgress({ total: rows.length, done: 0 })

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batchRows = rows.slice(i, i + BATCH_SIZE)
        const params = await algodClient.getTransactionParams().do()
        const txns: algosdk.Transaction[] = []

        // ✅ Check if this university is fee-exempt
        const matchedInstitution = registeredInstitutions.find((inst) => inst.name === connectedInstitution)

        // ✅ Only charge fee if the institution is NOT feeExempt
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
          console.log(`💡 Fee skipped for ${connectedInstitution}`)
        }

        // NFT creation transactions
        for (const row of batchRows) {
          const dataString = formatDegreeData(
            String(row['studentname'] || ''),
            connectedInstitution || '',
            String(row['yearofgraduation'] || ''),
            String(row['degreetitle'] || ''),
            String(row['studentseatnumber'] || ''),
            String(row['finalpercentage'] || ''),
          )

          const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataString))
          const hashBytes = new Uint8Array(hashBuffer)

          const nftTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
            sender: activeAddress!,
            total: 1,
            decimals: 0,
            assetName: `${String(row['degreetitle'] || 'Degree').trim()} - Degree NFT`,
            unitName: 'DEGREE',
            assetURL: '',
            defaultFrozen: false,
            suggestedParams: params,
            assetMetadataHash: hashBytes,
          })

          txns.push(nftTxn)
        }

        const encodedUnsigned = txns.map((t) => algosdk.encodeUnsignedTransaction(t))
        const signedBlobs = await signTransactions(encodedUnsigned)

        if (!signedBlobs || signedBlobs.length === 0) throw new Error('Batch signing failed')

        for (let k = 0; k < signedBlobs.length; k++) {
          const signed = signedBlobs[k]
          if (!signed) throw new Error('A transaction was not signed')
          const { txid } = await algodClient.sendRawTransaction(signed).do()
          const conf = await algosdk.waitForConfirmation(algodClient, txid, 4)

          if (k >= 1) {
            const createdAssetId =
              (conf as any)['asset-index'] || (conf as any)['assetIndex'] || (conf as any)['inner-txns']?.[0]?.['created-asset-id']
            const rowIndex = i + (k - 1)
            const studentRow = rows[rowIndex]

            results.push({
              name: String(studentRow['studentname'] || ''),
              assetId: createdAssetId ? Number(createdAssetId) : undefined,
              txId: txid,
              serial: Number(studentRow['serialnumber'] || 0),
              university: connectedInstitution || '',
              year: String(studentRow['yearofgraduation'] || ''),
              degreeTitle: String(studentRow['degreetitle'] || ''),
              percentage: String(studentRow['finalpercentage'] || ''),
            })

            setProgress((p) => ({ total: p.total, done: p.done + 1 }))
          }
        }

        await new Promise((res) => setTimeout(res, 300))
      }

      const outRows = [['Serial', 'Student Name', 'University', 'Year', 'Degree Title', 'Percentage', 'Asset ID', 'Tx ID']]
      results.sort((a, b) => (a.serial || 0) - (b.serial || 0))

      for (const r of results) {
        outRows.push([
          String(r.serial ?? ''),
          String(r.name ?? ''),
          String(r.university ?? ''),
          String(r.year ?? ''),
          String(r.degreeTitle ?? ''),
          String(r.percentage ?? ''),
          String(r.assetId ?? ''),
          String(r.txId ?? ''),
        ])
      }

      const outWb = XLSX.utils.book_new()
      const outWs = XLSX.utils.aoa_to_sheet(outRows)
      XLSX.utils.book_append_sheet(outWb, outWs, 'minted')

      const wbout = XLSX.write(outWb, { type: 'array', bookType: 'xlsx' })
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'mint_results.xlsx')

      alert(`✅ Minting completed. ${results.length} NFTs minted.`)
      goBack()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to process file and mint NFTs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">🎓 Batch Mint Degree NFTs (Excel Upload)</h2>

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
            <li>Student seat number</li>
            <li>Student name</li>
            <li>Father's name</li>
            <li>Year of graduation</li>
            <li>Name of faculty</li>
            <li>Name of department</li>
            <li>Degree title</li>
            <li>Final percentage</li>
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

export default MintDegreeForm
