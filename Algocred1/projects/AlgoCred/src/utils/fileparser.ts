// src/utils/fileParser.ts
import * as XLSX from 'xlsx'

/**
 * Reads university name from the uploaded Excel/CSV file.
 * Scans the first sheet (top ~20 rows) for a cell containing a registered institution name,
 * and falls back to filename heuristics if parsing fails.
 */
export async function extractUniversityName(file: File, registeredInstitutions: { wallet: string; name: string }[]): Promise<string> {
  const normalize = (s?: string) => (s || '').toString().trim().toLowerCase()

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (sheetName) {
      const sheet = workbook.Sheets[sheetName]

      // --- get rows as arrays (header:1) and assert typing to any[][] ---
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false }) as unknown[][]

      // look at first ~20 rows for any cell that matches a registered institution
      const headerRows = rows.slice(0, 20)
      for (const row of headerRows) {
        if (!Array.isArray(row)) continue
        for (const cell of row) {
          if (!cell) continue
          const cellText = normalize(String(cell))
          for (const inst of registeredInstitutions) {
            const instNorm = normalize(inst.name)
            if (cellText === instNorm || cellText.includes(instNorm) || instNorm.includes(cellText)) {
              return inst.name
            }
            // token check (e.g. "SMIU")
            const tokens = inst.name.split(/\s+/).map(normalize)
            if (tokens.some((t) => cellText === t || cellText.includes(t))) return inst.name
          }

          // check patterns like ["University", "ABC University"] in the same row
          if (cellText.includes('university')) {
            const idx = row.indexOf(cell)
            if (typeof idx === 'number' && row[idx + 1]) {
              const cand = normalize(String(row[idx + 1]))
              for (const inst of registeredInstitutions) {
                if (cand.includes(normalize(inst.name)) || normalize(inst.name).includes(cand)) return inst.name
              }
            }
          }
        }
      }

      // If not found in header area, try object-style parsing to find a 'University' column
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
      if (jsonRows && jsonRows.length > 0) {
        const keys = Object.keys(jsonRows[0]).map(normalize)
        const uniColIdx = keys.findIndex((k) => k.includes('university') || k === 'university')
        if (uniColIdx >= 0) {
          const firstRow = jsonRows[0]
          const headerKeys = Object.keys(firstRow)
          const val = firstRow[headerKeys[uniColIdx]]
          if (val) {
            const valNorm = normalize(String(val))
            for (const inst of registeredInstitutions) {
              if (valNorm.includes(normalize(inst.name)) || normalize(inst.name).includes(valNorm)) return inst.name
            }
          }
        }
      }
    }
  } catch {
    // ignore parsing errors and fall back to filename heuristics
  }

  // Fallback: simple filename heuristics
  const lower = file.name.toLowerCase()
  if (lower.includes('memon')) return 'Darul Uloom Memon'
  if (lower.includes('smiu')) return 'SMIU'
  if (lower.includes('abc')) return 'ABC University'

  return 'Unknown University'
}
