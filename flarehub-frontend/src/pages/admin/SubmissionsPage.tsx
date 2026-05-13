import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, MagnifyingGlass } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { toast } from '@/store/ui.store'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import type { ApiPaginated, SmartGoal, MilestonePlan, MarketResearch } from '@/types/api'

type WithUser<T> = T & { user: { id: string; firstName: string; lastName: string; email: string } }

const GOAL_FIELDS = [
  { key: 'goalStatement' as const, label: 'Goal statement' },
  { key: 'specific' as const,      label: 'Specific' },
  { key: 'measurable' as const,    label: 'Measurable' },
  { key: 'achievable' as const,    label: 'Achievable' },
  { key: 'relevant' as const,      label: 'Relevant' },
  { key: 'timebound' as const,     label: 'Time-bound' },
]

const RESEARCH_FIELDS = [
  { key: 'businessName' as const,      label: 'Business name' },
  { key: 'surveyObjective' as const,   label: 'Objective' },
  { key: 'sampleSize' as const,        label: 'Sample size' },
  { key: 'surveyDuration' as const,    label: 'Duration' },
  { key: 'ageDistribution' as const,   label: 'Age distribution' },
  { key: 'genderBreakdown' as const,   label: 'Gender breakdown' },
  { key: 'location' as const,          label: 'Location' },
  { key: 'awareness' as const,         label: 'Awareness' },
  { key: 'interest' as const,          label: 'Interest' },
  { key: 'avgWillingness' as const,    label: 'Avg. willingness to pay' },
  { key: 'priceRange' as const,        label: 'Price range' },
  { key: 'currentSolutions' as const,  label: 'Current solutions' },
  { key: 'openComments' as const,      label: 'Open comments' },
  { key: 'opportunity1' as const,      label: 'Opportunity 1' },
  { key: 'opportunity2' as const,      label: 'Opportunity 2' },
  { key: 'riskBarrier' as const,       label: 'Risk / barrier' },
]

function CommentDrawer<T extends { id: number; adminComment: string | null; user: { firstName: string; lastName: string } }>({
  item,
  title,
  fields,
  endpoint,
  queryKey,
  renderExtra,
  onClose,
}: {
  item:         T | null
  title:        string
  fields:       { key: keyof T; label: string }[]
  endpoint:     string
  queryKey:     unknown[]
  renderExtra?: (item: T) => React.ReactNode
  onClose:      () => void
}) {
  const [comment, setComment] = useState(item?.adminComment ?? '')
  const qc = useQueryClient()

  const save = useMutation({
    mutationFn: () => api.patch(`${endpoint}/${item!.id}/comment`, { adminComment: comment }),
    onSuccess: () => {
      toast.success('Comment saved')
      qc.invalidateQueries({ queryKey })
      onClose()
    },
    onError: () => toast.error('Could not save'),
  })

  if (!item) return null

  return (
    <Drawer
      open={!!item}
      onClose={onClose}
      title={`${item.user.firstName} ${item.user.lastName} — ${title}`}
      footer={<Button loading={save.isPending} onClick={() => save.mutate()}>Save comment</Button>}
    >
      <div className="space-y-3 text-sm">
        {fields.map(f => {
          const val = item[f.key]
          if (!val) return null
          return (
            <div key={String(f.key)}>
              <p className="text-xs font-medium text-[var(--color-ink-mute)] mb-0.5">{f.label}</p>
              <p className="text-[var(--color-ink)]">
                {Array.isArray(val) ? val.join(', ') : String(val)}
              </p>
            </div>
          )
        })}
        {renderExtra?.(item)}
        <div className="pt-3 border-t border-[var(--color-line)]">
          <Textarea label="Admin comment" rows={4}
            value={comment} onChange={e => setComment(e.target.value)} />
        </div>
      </div>
    </Drawer>
  )
}

export default function SubmissionsPage() {
  const [page, setPage]               = useState(1)
  const [search, setSearch]           = useState('')
  const [selectedGoal, setGoal]       = useState<WithUser<SmartGoal> | null>(null)
  const [selectedMilestone, setMilestone] = useState<WithUser<MilestonePlan> | null>(null)
  const [selectedResearch, setResearch]   = useState<WithUser<MarketResearch> | null>(null)
  const debounced                     = useDebounce(search)

  const { data: goals, isLoading } = useQuery({
    queryKey: ['admin', 'smart-goals', page, debounced],
    queryFn:  () => api.get<ApiPaginated<WithUser<SmartGoal>>>('/submissions/smart-goals', {
      params: { page, limit: 15, search: debounced || undefined },
    }).then(r => r.data),
  })

  const { data: milestones } = useQuery({
    queryKey: ['admin', 'milestones'],
    queryFn:  () => api.get<ApiPaginated<WithUser<MilestonePlan>>>('/submissions/milestones', {
      params: { limit: 100 },
    }).then(r => r.data),
  })

  const { data: research } = useQuery({
    queryKey: ['admin', 'market-research'],
    queryFn:  () => api.get<ApiPaginated<WithUser<MarketResearch>>>('/submissions/market-research', {
      params: { limit: 100 },
    }).then(r => r.data),
  })

  return (
    <>
      <PageHeader title="Submissions" subtitle="Review all user submissions and leave comments." />

      <Tabs defaultValue="smart-goals">
        <TabsList>
          <TabsTrigger value="smart-goals">
            Smart Goals {goals?.meta.total ? `(${goals.meta.total})` : ''}
          </TabsTrigger>
          <TabsTrigger value="milestones">
            Milestone Plans {milestones?.meta.total ? `(${milestones.meta.total})` : ''}
          </TabsTrigger>
          <TabsTrigger value="market-research">
            Market Research {research?.meta.total ? `(${research.meta.total})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart-goals" className="mt-5">
          <div className="mb-4">
            <Input placeholder="Search users..." leftIcon={<MagnifyingGlass size={15} />}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={56} />)}
            </div>
          ) : !goals?.data.length ? (
            <EmptyState icon={<FileText size={28} />} heading="No smart goals submitted" body="None yet." />
          ) : (
            <>
              <div className="flex flex-col gap-2 mb-4">
                {goals.data.map(g => (
                  <Card key={g.id} padding="sm"
                    className="flex items-center justify-between gap-4 cursor-pointer hover:border-[var(--color-border-strong)] transition-colors"
                    onClick={() => setGoal(g)}>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-ink)]">
                        {g.user.firstName} {g.user.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-ink-faint)]">
                        {g.user.email} — {formatDate(g.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {g.adminComment && <Badge variant="approved">Commented</Badge>}
                      <Button variant="secondary" size="sm">Review</Button>
                    </div>
                  </Card>
                ))}
              </div>
              <Pagination page={goals.meta.page} totalPages={goals.meta.totalPages}
                total={goals.meta.total} limit={15} onChange={setPage} />
            </>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="mt-5">
          {!milestones?.data.length ? (
            <EmptyState icon={<FileText size={28} />} heading="No milestone plans submitted" body="None yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {milestones.data.map(m => (
                <Card key={m.id} padding="sm"
                  className="flex items-center justify-between gap-4 cursor-pointer hover:border-[var(--color-border-strong)] transition-colors"
                  onClick={() => setMilestone(m)}>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {m.user.firstName} {m.user.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)]">
                      {m.businessName} — {formatDate(m.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.adminComment && <Badge variant="approved">Commented</Badge>}
                    <Button variant="secondary" size="sm">Review</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="market-research" className="mt-5">
          {!research?.data.length ? (
            <EmptyState icon={<FileText size={28} />} heading="No market research submitted" body="None yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {research.data.map(r => (
                <Card key={r.id} padding="sm"
                  className="flex items-center justify-between gap-4 cursor-pointer hover:border-[var(--color-border-strong)] transition-colors"
                  onClick={() => setResearch(r)}>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {r.user.firstName} {r.user.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)]">
                      {r.businessName} — {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.adminComment && <Badge variant="approved">Commented</Badge>}
                    <Button variant="secondary" size="sm">Review</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CommentDrawer
        item={selectedGoal}
        title="SMART Goals"
        fields={GOAL_FIELDS}
        endpoint="/submissions/smart-goals"
        queryKey={['admin', 'smart-goals']}
        onClose={() => setGoal(null)}
      />

      <CommentDrawer
        item={selectedMilestone}
        title="Milestone Plan"
        fields={[
          { key: 'businessName' as const,        label: 'Business name' },
          { key: 'grantAmount' as const,          label: 'Grant amount' },
          { key: 'implementationPeriod' as const, label: 'Implementation period' },
          { key: 'stage' as const,                label: 'Stage' },
        ]}
        endpoint="/submissions/milestones"
        queryKey={['admin', 'milestones']}
        renderExtra={item => item && item.milestones?.length ? (
          <div className="pt-2">
            <p className="text-xs font-medium text-[var(--color-ink-mute)] mb-1">Milestones</p>
            {item.milestones.map(m => (
              <p key={m.number} className="text-sm text-[var(--color-ink)] mb-0.5">
                {m.number}. {m.title}
              </p>
            ))}
          </div>
        ) : null}
        onClose={() => setMilestone(null)}
      />

      <CommentDrawer
        item={selectedResearch}
        title="Market Research"
        fields={RESEARCH_FIELDS}
        endpoint="/submissions/market-research"
        queryKey={['admin', 'market-research']}
        onClose={() => setResearch(null)}
      />
    </>
  )
}
