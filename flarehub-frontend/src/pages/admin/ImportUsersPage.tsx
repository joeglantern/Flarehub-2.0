import { useState, useRef } from 'react'
import { read, utils } from 'xlsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UploadSimple, CheckCircle, XCircle, Warning, PaperPlaneTilt, ArrowClockwise } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
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

interface PendingUser {
  id:        string
  email:     string
  firstName: string
  lastName:  string
}

interface ActivationStats {
  total:        number
  activated:    number
  pending:      number
  pendingUsers: PendingUser[]
}

interface ResendResult {
  sent:          number
  alreadyActive: number
  failed:        { email: string; reason: string }[]
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

function formatPhone(val: string | number | null): string | null {
  if (val == null) return null
  const p = String(val).replace(/\.0$/, '').trim()
  return p.length === 9 ? `0${p}` : p
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(' ')
  return { firstName: parts[0] ?? full, lastName: parts.slice(1).join(' ') }
}

function makeRow(
  nameRaw: string,
  emailRaw: string,
  phone: string | null,
  county: string | null,
  gender: string | null,
  businessName: string | null,
): ParsedRow {
  const { firstName, lastName } = splitName(nameRaw)
  const row: ParsedRow = {
    firstName, lastName,
    email:           emailRaw,
    phone,
    county,
    gender:          mapGender(gender),
    businessName,
    businessStage:   null,
    businessPlanUrl: null,
    _raw:            nameRaw,
  }
  if (!emailRaw || !emailRaw.includes('@')) row._error = 'Missing or invalid email'
  return row
}

// YCIC format: headers on row index 1, data from row index 2
function parseYCICSheet(workbook: ReturnType<typeof read>): ParsedRow[] {
  const ws  = workbook.Sheets[workbook.SheetNames[0]]
  const raw = utils.sheet_to_json(ws, { header: 1, defval: null }) as (string | number | null)[][]
  const rows: ParsedRow[] = []
  for (let i = 2; i < raw.length; i++) {
    const r       = raw[i]
    const nameRaw = String(r[0] ?? '').trim()
    if (!nameRaw) continue
    const emailRaw = String(r[6] ?? '').trim()
    const planUrl  = r[31] ? String(r[31]).trim() : null
    const row = makeRow(nameRaw, emailRaw, formatPhone(r[1]), r[5] ? String(r[5]).trim() : null, r[3] ? String(r[3]) : null, r[10] ? String(r[10]).trim() : null)
    row.businessStage   = mapStage(r[17] ? String(r[17]) : null)
    row.businessPlanUrl = planUrl && planUrl.startsWith('http') ? planUrl : null
    rows.push(row)
  }
  return rows
}

// SYV Nairobi: headers row 0, data from row 1
// cols: 0=idx,1=UniqueId,2=CompanyName,3=Name,4=Email,5=Phone,8=gender,9=County
function parseSYVNairobi(ws: ReturnType<typeof read>['Sheets'][string]): ParsedRow[] {
  const raw = utils.sheet_to_json(ws, { header: 1, defval: null }) as (string | number | null)[][]
  const rows: ParsedRow[] = []
  for (let i = 1; i < raw.length; i++) {
    const r       = raw[i]
    const nameRaw = String(r[3] ?? '').trim()
    if (!nameRaw) continue
    rows.push(makeRow(nameRaw, String(r[4] ?? '').trim(), formatPhone(r[5]), r[9] ? String(r[9]).trim() : null, r[8] ? String(r[8]) : null, r[2] ? String(r[2]).trim() : null))
  }
  return rows
}

// SYV Kwale: headers row 0, data from row 1
// cols: 0=No,1=name,2=gender,6=Organization,11=Phone,13=Email,18=County
function parseSYVKwale(ws: ReturnType<typeof read>['Sheets'][string]): ParsedRow[] {
  const raw = utils.sheet_to_json(ws, { header: 1, defval: null }) as (string | number | null)[][]
  const rows: ParsedRow[] = []
  for (let i = 1; i < raw.length; i++) {
    const r       = raw[i]
    const nameRaw = String(r[1] ?? '').trim()
    if (!nameRaw) continue
    rows.push(makeRow(nameRaw, String(r[13] ?? '').trim(), formatPhone(r[11]), r[18] ? String(r[18]).trim() : null, r[2] ? String(r[2]) : null, r[6] ? String(r[6]).trim() : null))
  }
  return rows
}

function parseSheet(wb: ReturnType<typeof read>, sheetName: string): ParsedRow[] {
  const ws      = wb.Sheets[sheetName]
  const raw     = utils.sheet_to_json(ws, { header: 1, defval: null }) as (string | null)[][]
  const headers = (raw[0] ?? []).map(h => String(h ?? '').toLowerCase())
  if (headers.some(h => h.includes('unique identifier') || h.includes('entreprenuer'))) return parseSYVNairobi(ws)
  if (headers.some(h => h.includes('final ycm') || h.includes('sub_county')))           return parseSYVKwale(ws)
  return parseYCICSheet(wb)
}

function detectAndParse(workbook: ReturnType<typeof read>): ParsedRow[] {
  // Merge all "selected" sheets when present (e.g. Nairobi_Selected_50 + Kwale_Selected_50)
  const selected = workbook.SheetNames.filter(n => n.toLowerCase().includes('selected'))
  if (selected.length > 0) return selected.flatMap(name => parseSheet(workbook, name))
  return parseSheet(workbook, workbook.SheetNames[0])
}

export default function ImportUsersPage() {
  const qc = useQueryClient()
  const fileRef          = useRef<HTMLInputElement>(null)
  const [rows, setRows]  = useState<ParsedRow[] | null>(null)
  const [programId, setProgramId]           = useState<number | undefined>()
  const [result, setResult]                 = useState<ImportResult | null>(null)
  const [statsProgramId, setStatsProgramId] = useState<number | undefined>()
  const [resendResult, setResendResult]     = useState<ResendResult | null>(null)
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
  const [showPending, setShowPending]       = useState(false)
  const [userSearch, setUserSearch]         = useState('')
  const [testEmail, setTestEmail]           = useState('')
  const [testConfirmed, setTestConfirmed]   = useState(false)

  const { data: programs } = useQuery({
    queryKey: ['admin', 'programs-list'],
    queryFn:  () => api.get<ApiSuccess<Program[]>>('/programs').then(r => r.data.data),
  })

  const { data: stats, isFetching: statsFetching } = useQuery({
    queryKey: ['admin', 'activation-stats', statsProgramId],
    queryFn:  () =>
      api.get<ApiSuccess<ActivationStats>>('/admin/activation-stats', {
        params: statsProgramId ? { programId: statsProgramId } : {},
      }).then(r => r.data.data),
    enabled: statsProgramId !== undefined,
    refetchInterval: false,
  })

  const resendMut = useMutation({
    mutationFn: (userIds?: string[]) =>
      api.post<ApiSuccess<ResendResult>>('/admin/resend-invites', {
        ...(statsProgramId ? { programId: statsProgramId } : {}),
        ...(userIds?.length ? { userIds } : {}),
      }).then(r => r.data.data),
    onSuccess: (data) => {
      setResendResult(data)
      setSelectedIds(new Set())
      qc.invalidateQueries({ queryKey: ['admin', 'activation-stats', statsProgramId] })
    },
  })

  const testMut = useMutation({
    mutationFn: (email: string) =>
      api.post<ApiSuccess<ResendResult & { wasAlreadyActive?: boolean }>>('/admin/resend-invites', { testEmail: email })
        .then(r => r.data.data),
    onSuccess: () => { setTestEmail(''); setTestConfirmed(false) },
  })

  const importMut = useMutation({
    mutationFn: (users: Omit<ParsedRow, '_raw' | '_error'>[]) =>
      api.post<ApiSuccess<ImportResult>>('/admin/bulk-import/users', { programId, users })
        .then(r => r.data.data),
    onSuccess: (data) => setResult(data),
  })

  const [enrollResult, setEnrollResult] = useState<{ enrolled: number; notFound: number } | null>(null)
  const enrollMut = useMutation({
    mutationFn: (emails: string[]) =>
      api.post<ApiSuccess<{ enrolled: number; notFound: number }>>('/admin/bulk-enroll', { programId, emails })
        .then(r => r.data.data),
    onSuccess: (data) => {
      setEnrollResult(data)
      qc.invalidateQueries({ queryKey: ['admin', 'activation-stats'] })
    },
  })

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = read(ev.target?.result, { type: 'array', cellDates: true })
      setRows(detectAndParse(wb))
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

      {/* Activation status */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Account Activations</p>
          {stats && (
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['admin', 'activation-stats', statsProgramId] })}
              className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors"
              title="Refresh"
            >
              <ArrowClockwise size={15} className={statsFetching ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        <select
          value={statsProgramId ?? ''}
          onChange={e => { setStatsProgramId(e.target.value ? Number(e.target.value) : undefined); setResendResult(null) }}
          className="w-full max-w-sm text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-4"
        >
          <option value="">— Select a program to see activation status —</option>
          {programs?.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {statsProgramId && (
          statsFetching && !stats ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-ink-faint)]">
              <Spinner size="sm" /> Loading…
            </div>
          ) : stats ? (
            <>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)] mb-1.5">
                  <span><strong className="text-[var(--color-ink)]">{stats.activated}</strong> of <strong className="text-[var(--color-ink)]">{stats.total}</strong> accounts activated</span>
                  <span className="text-[var(--color-ink-faint)]">{stats.pending} pending</span>
                </div>
                <div className="h-2 bg-[var(--color-elev)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-forest-500)] rounded-full transition-all"
                    style={{ width: stats.total > 0 ? `${(stats.activated / stats.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {stats.pending > 0 && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <Button
                      size="sm"
                      onClick={() => { setResendResult(null); resendMut.mutate(selectedIds.size ? [...selectedIds] : undefined) }}
                      disabled={resendMut.isPending}
                      className="flex items-center gap-2"
                    >
                      {resendMut.isPending
                        ? <><Spinner size="sm" /> Sending…</>
                        : <><PaperPlaneTilt size={14} />
                            {selectedIds.size
                              ? `Send to ${selectedIds.size} selected`
                              : `Send to all ${stats.pending} pending`}
                          </>
                      }
                    </Button>
                    <button
                      onClick={() => setShowPending(v => !v)}
                      className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline"
                    >
                      {showPending ? 'Hide list' : 'Select specific users'}
                    </button>
                  </div>

                  {showPending && (
                    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                      {/* Search */}
                      <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                        <input
                          type="text"
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          placeholder="Search by name or email…"
                          className="w-full text-sm bg-transparent outline-none text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)]"
                        />
                      </div>
                      {/* Select all (filtered) */}
                      <div className="px-4 py-2 bg-[var(--color-elev)] flex items-center gap-3 border-b border-[var(--color-border)]">
                        <input
                          type="checkbox"
                          checked={
                            stats.pendingUsers
                              .filter(u => {
                                const q = userSearch.toLowerCase()
                                return !q || u.email.toLowerCase().includes(q) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
                              })
                              .every(u => selectedIds.has(u.id)) &&
                            stats.pendingUsers.filter(u => {
                              const q = userSearch.toLowerCase()
                              return !q || u.email.toLowerCase().includes(q) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
                            }).length > 0
                          }
                          onChange={e => {
                            const filtered = stats.pendingUsers.filter(u => {
                              const q = userSearch.toLowerCase()
                              return !q || u.email.toLowerCase().includes(q) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
                            })
                            setSelectedIds(prev => {
                              const next = new Set(prev)
                              filtered.forEach(u => e.target.checked ? next.add(u.id) : next.delete(u.id))
                              return next
                            })
                          }}
                          className="rounded"
                        />
                        <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
                          {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {stats.pendingUsers
                          .filter(u => {
                            const q = userSearch.toLowerCase()
                            return !q || u.email.toLowerCase().includes(q) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
                          })
                          .map(u => (
                            <label key={u.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-elev)] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(u.id)}
                                onChange={e => setSelectedIds(prev => {
                                  const next = new Set(prev)
                                  e.target.checked ? next.add(u.id) : next.delete(u.id)
                                  return next
                                })}
                                className="rounded"
                              />
                              <span className="text-sm text-[var(--color-ink)]">{u.firstName} {u.lastName}</span>
                              <span className="text-xs text-[var(--color-ink-faint)] ml-auto">{u.email}</span>
                            </label>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </>
              )}

              {stats.pending === 0 && (
                <p className="text-sm text-[var(--color-forest-500)] font-medium flex items-center gap-1.5">
                  <CheckCircle size={16} /> All {stats.total} users have activated their accounts
                </p>
              )}

              {resendResult && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex flex-wrap gap-5 text-sm">
                    <span className="flex items-center gap-1.5 text-[var(--color-forest-500)] font-semibold">
                      <CheckCircle size={16} /> {resendResult.sent} emails sent
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--color-ink-faint)]">
                      <Warning size={16} /> {resendResult.alreadyActive} already active
                    </span>
                    {resendResult.failed.length > 0 && (
                      <span className="flex items-center gap-1.5 text-[var(--color-error)]">
                        <XCircle size={16} /> {resendResult.failed.length} failed
                      </span>
                    )}
                  </div>
                  {resendResult.failed.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {resendResult.failed.map((f, i) => (
                        <p key={i} className="text-xs text-[var(--color-error)]">{f.email}: {f.reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null
        )}

        {/* Test send */}
        <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide mb-3">Test send</p>
          <div className="flex gap-2 items-start">
            <input
              type="email"
              value={testEmail}
              onChange={e => { setTestEmail(e.target.value); setTestConfirmed(false) }}
              placeholder="any@email.com"
              className="flex-1 max-w-xs text-sm border border-[var(--color-border)] rounded-lg px-3 py-2 bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            {testEmail && !testConfirmed && (
              <Button size="sm" variant="secondary" onClick={() => setTestConfirmed(true)}>
                Send
              </Button>
            )}
            {testConfirmed && (
              <Button
                size="sm"
                onClick={() => testMut.mutate(testEmail)}
                disabled={testMut.isPending}
                className="flex items-center gap-1.5 bg-[var(--color-terra-500)] hover:bg-[var(--color-terra-600)] text-white border-0"
              >
                {testMut.isPending ? <><Spinner size="sm" /> Sending…</> : 'Confirm send'}
              </Button>
            )}
          </div>
          {testConfirmed && (
            <p className="text-xs text-[var(--color-terra-500)] mt-2 flex items-center gap-1.5">
              <Warning size={13} /> This sends to the address even if the account is already activated.
            </p>
          )}
          {testMut.isSuccess && (
            <p className="text-xs text-[var(--color-forest-500)] mt-2 flex items-center gap-1.5">
              <CheckCircle size={13} /> Invite sent to {testEmail}
            </p>
          )}
          {testMut.isError && (
            <p className="text-xs text-[var(--color-error)] mt-2">Failed — check the email is in the system.</p>
          )}
        </div>
      </Card>

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

          {/* Enroll result banner */}
          {enrollResult && (
            <Card className="mb-5 bg-[var(--color-elev)]">
              <div className="flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-1.5 text-[var(--color-forest-500)] font-semibold">
                  <CheckCircle size={18} /> {enrollResult.enrolled} enrolled in program
                </span>
                {enrollResult.notFound > 0 && (
                  <span className="flex items-center gap-1.5 text-[var(--color-ink-faint)]">
                    <Warning size={18} /> {enrollResult.notFound} not found in system
                  </span>
                )}
              </div>
            </Card>
          )}

          {/* Preview table */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Preview — {validRows.length} valid rows</p>
              <div className="flex gap-2">
                {programId && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => enrollMut.mutate(validRows.map(r => r.email))}
                    disabled={enrollMut.isPending || validRows.length === 0}
                    title="Enroll already-imported users into the selected program without creating new accounts"
                  >
                    {enrollMut.isPending
                      ? <><Spinner size="sm" /> Enrolling…</>
                      : `Enroll ${validRows.length} existing users`}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importMut.isPending || validRows.length === 0}
                >
                  {importMut.isPending
                    ? <><Spinner size="sm" className="animate-spin" /> Importing…</>
                    : `Import ${validRows.length} users`}
                </Button>
              </div>
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
