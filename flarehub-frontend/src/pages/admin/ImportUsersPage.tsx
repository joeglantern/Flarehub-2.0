import { useState, useRef } from 'react'
import { read, utils } from 'xlsx'
import { useQuery, useMutation } from '@tanstack/react-query'
import { UploadSimple, CheckCircle, XCircle, Warning, Spinner } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ApiSuccess, Program } from '@/types/api'

interface ParsedRow {
  firstName:       string
  lastName:        string
  email:           string
  phone:           string | null
  county:          string | null
  gender:          'Male' | 'Female' | 'Other' | 'Unknown'
  businessName:    string | null
  businessStage:   'Idea' | 'Prototype' | 'MVP' | 'Revenue' | null
  businessPlanUrl: string | null
  _raw:            string
  _error?:         string
}

interface ImportResult {
  created: number
  skipped: number
  failed:  { email: string; reason: string }[]
}

function mapGender(val: string | null): ParsedRow['gender'] {
  if (!val) return 'Unknown'
  const v = val.trim().toLowerCase()
  if (v === 'male')   return 'Male'
  if (v === 'female') return 'Female'
  if (v === 'other')  return 'Other'
  return 'Unknown'
}

function mapStage(val: string | null): ParsedRow['businessStage'] {
  if (!val) return null
  const v = val.toLowerCase()
  if (v.includes('idea'))      return 'Idea'
  if (v.includes('prototype')) return 'Prototype'
  if (v.includes('mvp'))       return 'MVP'
  if (v.includes('revenue'))   return 'Revenue'
  return 'Idea'
}

function parseYCICSheet(workbook: ReturnType<typeof read>): ParsedRow[] {
  const ws = workbook.Sheets[workbook.SheetNames[0]]
  // headers are in row 2 (0-indexed row 1), data starts from row 3 (0-indexed row 2)
  const raw: unknown[][] = utils.sheet_to_json(ws, { header: 1, defval: null })

  const rows: ParsedRow[] = []
  for (let i = 2; i < raw.length; i++) {
    const r = raw[i] as (string | number | null)[]
    const nameRaw = String(r[0] ?? '').trim()
    if (!nameRaw) continue

    const emailRaw = String(r[6] ?? '').trim()
    const parts    = nameRaw.split(' ')
    const firstName = parts[0] ?? nameRaw
    const lastName  = parts.slice(1).join(' ')

    const phoneRaw = r[1] != null ? String(r[1]).replace(/\.0$/, '') : null
    const planUrl  = r[31] ? String(r[31]).trim() : null

    const row: ParsedRow = {
      firstName,
      lastName,
      email:           emailRaw,
      phone:           phoneRaw,
      county:          r[5] ? String(r[5]).trim() : null,
      gender:          mapGender(r[3] ? String(r[3]) : null),
      businessName:    r[10] ? String(r[10]).trim() : null,
      businessStage:   mapStage(r[17] ? String(r[17]) : null),
      businessPlanUrl: planUrl && planUrl.startsWith('http') ? planUrl : null,
      _raw:            nameRaw,
    }

    if (!emailRaw || !emailRaw.includes('@')) {
      row._error = 'Missing or invalid email'
    }

    rows.push(row)
  }
  return rows
}

export default function ImportUsersPage() {
  const fileRef          = useRef<HTMLInputElement>(null)
  const [rows, setRows]  = useState<ParsedRow[] | null>(null)
  const [programId, setProgramId] = useState<number | undefined>()
  const [result, setResult]       = useState<ImportResult | null>(null)

  const { data: programs } = useQuery({
    queryKey: ['admin', 'programs-list'],
    queryFn:  () => api.get<ApiSuccess<Program[]>>('/programs').then(r => r.data.data),
  })

  const importMut = useMutation({
    mutationFn: (users: Omit<ParsedRow, '_raw' | '_error'>[]) =>
      api.post<ApiSuccess<ImportResult>>('/admin/bulk-import/users', { programId, users })
        .then(r => r.data.data),
    onSuccess: (data) => setResult(data),
  })

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = read(ev.target?.result, { type: 'array', cellDates: true })
      setRows(parseYCICSheet(wb))
      setResult(null)
    }
    reader.readAsArrayBuffer(file)
  }

  const validRows   = rows?.filter(r => !r._error) ?? []
  const invalidRows = rows?.filter(r => r._error)  ?? []
  const withPlan    = validRows.filter(r => r.businessPlanUrl).length

  function handleImport() {
    const users = validRows.map(({ _raw, _error, ...rest }) => rest)
    importMut.mutate(users)
  }

  return (
    <>
      <PageHeader
        title="Import Users"
        subtitle="Bulk-import YCIC applicants from the official tracker spreadsheet."
      />

      {/* Upload area */}
      <Card className="mb-5">
        <div
          className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-10 text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <UploadSimple size={32} className="mx-auto mb-3 text-[var(--color-ink-faint)]" />
          <p className="text-sm font-medium text-[var(--color-ink)]">Click to upload the YCIC Official Tracker</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">.xlsx or .xls — headers must be in row 2</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {rows && (
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <span className="text-[var(--color-ink-soft)]">
              <strong className="text-[var(--color-ink)]">{rows.length}</strong> rows parsed
            </span>
            <span className="text-[var(--color-forest-500)]">
              <strong>{validRows.length}</strong> valid
            </span>
            {invalidRows.length > 0 && (
              <span className="text-[var(--color-error)]">
                <strong>{invalidRows.length}</strong> will be skipped (no email)
              </span>
            )}
            <span className="text-[var(--color-ink-faint)]">
              <strong>{withPlan}</strong> have business plan links
            </span>
          </div>
        )}
      </Card>

      {rows && (
        <>
          {/* Program selector */}
          <Card className="mb-5">
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Enrol in program (optional)</p>
            <select
              value={programId ?? ''}
              onChange={e => setProgramId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full max-w-sm text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">— No program enrolment —</option>
              {programs?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-[var(--color-ink-faint)] mt-2">
              If selected, each imported user will get an Approved application for this program.
            </p>
          </Card>

          {/* Result banner */}
          {result && (
            <Card className="mb-5 bg-[var(--color-elev)]">
              <div className="flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-1.5 text-[var(--color-forest-500)] font-semibold">
                  <CheckCircle size={18} />
                  {result.created} created
                </span>
                <span className="flex items-center gap-1.5 text-[var(--color-ink-faint)]">
                  <Warning size={18} />
                  {result.skipped} skipped (already exist)
                </span>
                {result.failed.length > 0 && (
                  <span className="flex items-center gap-1.5 text-[var(--color-error)]">
                    <XCircle size={18} />
                    {result.failed.length} failed
                  </span>
                )}
              </div>
              {result.failed.length > 0 && (
                <div className="mt-4 space-y-1">
                  {result.failed.map((f, i) => (
                    <p key={i} className="text-xs text-[var(--color-error)]">
                      {f.email}: {f.reason}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Preview table */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Preview — {validRows.length} valid rows</p>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importMut.isPending || validRows.length === 0}
              >
                {importMut.isPending
                  ? <><Spinner size={14} className="animate-spin" /> Importing…</>
                  : `Import ${validRows.length} users`}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[var(--color-elev)]">
                  <tr>
                    {['Name', 'Email', 'Phone', 'County', 'Gender', 'Business', 'Stage', 'B.Plan'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-semibold text-[var(--color-ink-soft)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-t border-[var(--color-border)] ${row._error ? 'opacity-40' : ''}`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-[var(--color-ink)]">
                        {row.firstName} {row.lastName}
                        {row._error && <span className="ml-1 text-[var(--color-error)]">({row._error})</span>}
                      </td>
                      <td className="px-4 py-2 text-[var(--color-ink-soft)]">{row.email || <span className="text-[var(--color-error)]">—</span>}</td>
                      <td className="px-4 py-2 text-[var(--color-ink-faint)]">{row.phone ?? '—'}</td>
                      <td className="px-4 py-2 text-[var(--color-ink-faint)]">{row.county ?? '—'}</td>
                      <td className="px-4 py-2 text-[var(--color-ink-faint)]">{row.gender}</td>
                      <td className="px-4 py-2 text-[var(--color-ink-soft)] max-w-[180px] truncate">{row.businessName ?? '—'}</td>
                      <td className="px-4 py-2">
                        {row.businessStage
                          ? <Badge variant="default">{row.businessStage}</Badge>
                          : <span className="text-[var(--color-ink-faint)]">—</span>}
                      </td>
                      <td className="px-4 py-2">
                        {row.businessPlanUrl
                          ? <Badge variant="approved">Link</Badge>
                          : <span className="text-[var(--color-ink-faint)]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalidRows.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-elev)]">
                <p className="text-xs text-[var(--color-ink-faint)]">
                  Rows with no email are shown greyed out and will not be imported.
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}
