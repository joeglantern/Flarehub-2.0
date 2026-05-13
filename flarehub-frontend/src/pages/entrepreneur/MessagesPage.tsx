import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import {
  PaperPlaneRight, PencilSimple, MagnifyingGlass, DotsThree,
  PencilLine, Trash, X, ArrowLeft,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { wsClient } from '@/lib/ws'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/store/auth.store'
import { useDebounce } from '@/hooks/useDebounce'
import { cn, timeAgo } from '@/lib/utils'
import type { ApiSuccess, ApiPaginated, Conversation, Message, User } from '@/types/api'

const THREAD_LIMIT = 50

export default function MessagesPage() {
  const { contactId } = useParams<{ contactId?: string }>()
  const navigate      = useNavigate()
  const location      = useLocation()
  const { user }      = useAuthStore()
  const qc            = useQueryClient()

  // Detect mentor path so navigation stays in /mentor/messages/...
  const isMentorPath  = location.pathname.startsWith('/mentor')
  const basePath      = isMentorPath ? '/mentor/messages' : '/messages'

  const [text, setText]                   = useState('')
  const [isTyping, setIsTyping]           = useState(false)
  const [newMsgOpen, setNewMsgOpen]       = useState(false)
  const [searchQ, setSearchQ]             = useState('')
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [editingId, setEditingId]         = useState<number | null>(null)
  const [editText, setEditText]           = useState('')
  const [menuMsgId, setMenuMsgId]         = useState<number | null>(null)
  const bottomRef                         = useRef<HTMLDivElement>(null)
  const typingTimer                       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef                           = useRef<HTMLDivElement>(null)
  const debouncedSearch                   = useDebounce(searchQ)
  const debouncedSidebarSearch            = useDebounce(sidebarSearch)

  /* ── Close menu on outside click ─────────────────────────────────────── */
  useEffect(() => {
    if (!menuMsgId) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuMsgId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuMsgId])

  /* ── Queries ──────────────────────────────────────────────────────────── */
  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn:  () => api.get<ApiSuccess<Conversation[]>>('/messages/conversations').then(r => r.data.data),
  })

  const {
    data: threadData,
    fetchNextPage: fetchOlderMessages,
    hasNextPage: hasOlderMessages,
    isFetchingNextPage: loadingOlder,
    isLoading: threadLoading,
  } = useInfiniteQuery({
    queryKey:        ['messages', contactId],
    queryFn:         ({ pageParam }) =>
      api.get<ApiPaginated<Message>>(`/messages/${contactId}`, {
        params: { page: pageParam, limit: THREAD_LIMIT },
      }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled: !!contactId,
  })

  const thread: Message[] = threadData
    ? [...threadData.pages].reverse().flatMap(p => [...p.data].reverse())
    : []

  const { data: msgSearchResults } = useQuery({
    queryKey: ['messages', 'search', debouncedSidebarSearch],
    queryFn:  () =>
      api.get<ApiSuccess<Array<{ id: number; content: string; createdAt: string; contactId: string; contactName: string; isMe: boolean }>>>(
        `/messages/search?q=${encodeURIComponent(debouncedSidebarSearch)}`,
      ).then(r => r.data.data),
    enabled: debouncedSidebarSearch.length >= 2,
  })

  const { data: searchResults, isError: searchError, isFetching: searchLoading } = useQuery({
    queryKey: ['users', 'search', debouncedSearch],
    queryFn:  () =>
      api.get<ApiSuccess<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>[]>>(
        `/users/search?q=${encodeURIComponent(debouncedSearch)}`,
      ).then(r => r.data.data),
    enabled:  debouncedSearch.length >= 2,
    retry:    false,
  })

  /* ── Mark as read when thread opens ──────────────────────────────────── */
  useEffect(() => {
    if (!contactId) return
    api.patch(`/messages/${contactId}/read`).then(() => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    }).catch(() => {})
  }, [contactId, qc])

  /* ── Thread cache helpers ─────────────────────────────────────────────── */
  type ThreadCache = InfiniteData<ApiPaginated<Message>>

  const patchThread = useCallback((updater: (old: ThreadCache) => ThreadCache) => {
    qc.setQueryData<ThreadCache>(['messages', contactId], (old) => old ? updater(old) : old)
  }, [qc, contactId])

  /* ── Send ─────────────────────────────────────────────────────────────── */
  const send = useMutation({
    mutationFn: (content: string) =>
      api.post<ApiSuccess<Message>>('/messages', { receiverId: contactId, content }).then(r => r.data.data),

    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: ['messages', contactId] })
      const previousThread = qc.getQueryData<ThreadCache>(['messages', contactId])
      const optimisticMsg: Message = {
        id:         Date.now(),
        senderId:   user!.id,
        receiverId: contactId!,
        content,
        isRead:     false,
        createdAt:  new Date().toISOString(),
      }
      patchThread((old) => {
        const pages = [...old.pages]
        const last  = { ...pages[pages.length - 1] }
        last.data   = [...last.data, optimisticMsg]
        pages[pages.length - 1] = last
        return { ...old, pages }
      })
      setText('')
      return { previousThread }
    },

    onError: (_err, _content, context) => {
      if (context?.previousThread) qc.setQueryData(['messages', contactId], context.previousThread)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['messages', contactId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  /* ── Edit ──────────────────────────────────────────────────────────────── */
  const editMsg = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      api.patch<ApiSuccess<Message>>(`/messages/${id}/edit`, { content }).then(r => r.data.data),
    onSuccess: (updated) => {
      patchThread((old) => ({
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          data: page.data.map(m => m.id === updated.id ? updated : m),
        })),
      }))
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setEditingId(null)
      setEditText('')
    },
  })

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const deleteMsg = useMutation({
    mutationFn: (id: number) => api.delete(`/messages/${id}`).then(r => r.data),
    onSuccess: (_data, deletedId) => {
      patchThread((old) => ({
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          data: page.data.filter(m => m.id !== deletedId),
        })),
      }))
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  /* ── WebSocket ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const unsubs = [
      wsClient.on('new_message', (data) => {
        const d = data as { senderId?: string }
        if (d.senderId === contactId) {
          qc.invalidateQueries({ queryKey: ['messages', contactId] })
          api.patch(`/messages/${contactId}/read`).catch(() => {})
        }
        qc.invalidateQueries({ queryKey: ['conversations'] })
      }),
      wsClient.on('typing', (data) => {
        const d = data as { fromUserId: string }
        if (d.fromUserId === contactId) {
          setIsTyping(true)
          if (typingTimer.current) clearTimeout(typingTimer.current)
          typingTimer.current = setTimeout(() => setIsTyping(false), 3000)
        }
      }),
      wsClient.on('message_edited', (data) => {
        const d = data as { id: number; content: string; senderId: string; receiverId: string }
        if (d.senderId === contactId || d.receiverId === contactId) {
          patchThread((old) => ({
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.map(m => m.id === d.id ? { ...m, content: d.content } : m),
            })),
          }))
          qc.invalidateQueries({ queryKey: ['conversations'] })
        }
      }),
      wsClient.on('message_deleted', (data) => {
        const d = data as { id: number; senderId: string; receiverId: string }
        if (d.senderId === contactId || d.receiverId === contactId) {
          patchThread((old) => ({
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              data: page.data.filter(m => m.id !== d.id),
            })),
          }))
          qc.invalidateQueries({ queryKey: ['conversations'] })
        }
      }),
      wsClient.on('user_online', (data) => {
        const d = data as { userId: string }
        qc.setQueryData<Conversation[]>(['conversations'], (old) =>
          old?.map(c => c.contactId === d.userId ? { ...c, isOnline: true } : c)
        )
      }),
      wsClient.on('user_offline', (data) => {
        const d = data as { userId: string }
        qc.setQueryData<Conversation[]>(['conversations'], (old) =>
          old?.map(c => c.contactId === d.userId ? { ...c, isOnline: false } : c)
        )
      }),
      wsClient.on('messages_read', () => {
        qc.invalidateQueries({ queryKey: ['conversations'] })
      }),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [contactId, qc, patchThread])

  /* ── Scroll to bottom on new messages ────────────────────────────────── */
  const threadLength = thread.length
  useEffect(() => {
    if (!loadingOlder) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadLength, isTyping, loadingOlder])

  /* ── Typing event ─────────────────────────────────────────────────────── */
  const sendTyping = useCallback(() => {
    if (!contactId) return
    wsClient.send('typing', { receiverId: contactId })
  }, [contactId])

  const handleTextChange = (val: string) => { setText(val); sendTyping() }
  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || send.isPending) return
    send.mutate(trimmed)
  }

  const startEdit = (msg: Message) => {
    setEditingId(msg.id)
    setEditText(msg.content)
    setMenuMsgId(null)
  }

  const confirmEdit = () => {
    if (!editingId || !editText.trim()) return
    editMsg.mutate({ id: editingId, content: editText.trim() })
  }

  const activeConv  = conversations?.find(c => c.contactId === contactId)
  const totalUnread = conversations?.reduce((n, c) => n + c.unreadCount, 0) ?? 0

  // Mobile: show thread panel only when a contact is selected
  const showSidebar = !contactId
  const showThread  = !!contactId

  return (
    <div className="px-4 lg:px-7 py-6 lg:py-8 max-w-[1400px] mx-auto pb-24 lg:pb-8">
      <div className="flex h-[calc(100vh-160px)] min-h-[600px] gap-5">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className={cn(
          'card flex flex-col overflow-hidden',
          'w-full lg:w-[320px] lg:shrink-0',
          // Mobile: hide sidebar when thread is open
          showThread ? 'hidden lg:flex' : 'flex',
        )}>

          {/* Header */}
          <div className="px-4 py-4 border-b border-[var(--color-line)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] font-bold text-[var(--color-ink)]"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  Inbox
                </h2>
                {totalUnread > 0 && !sidebarSearch && (
                  <span className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-[var(--color-terra-500)] text-white rounded-full flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setNewMsgOpen(true)}
                title="New message"
                className="p-1.5 rounded-xl text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] hover:bg-[var(--color-elev)] transition-colors"
              >
                <PencilSimple size={16} weight="duotone" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[var(--color-elev)]">
              <MagnifyingGlass size={14} className="text-[var(--color-ink-mute)] shrink-0" />
              <input
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Search messages…"
                className="flex-1 bg-transparent text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] outline-none"
              />
              {sidebarSearch && (
                <button type="button" onClick={() => setSidebarSearch('')}
                  className="text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Conversation list / search results */}
          <ul className="flex-1 overflow-y-auto py-1">
            {sidebarSearch.length >= 2 ? (
              !msgSearchResults?.length ? (
                <li className="text-[12px] text-[var(--color-ink-mute)] text-center py-8">No messages found</li>
              ) : (
                msgSearchResults.map(r => (
                  <li key={r.id}>
                    <button
                      onClick={() => { navigate(`${basePath}/${r.contactId}`); setSidebarSearch('') }}
                      className={cn(
                        'w-full flex flex-col gap-0.5 px-3 mx-2 my-0.5 py-2.5 rounded-xl text-left hover:bg-[var(--color-elev)] transition',
                        contactId === r.contactId && 'bg-[var(--color-forest-50)] ring-1 ring-[var(--color-forest-100)]',
                      )}
                    >
                      <p className="text-[13px] font-semibold text-[var(--color-ink)] truncate">{r.contactName}</p>
                      <p className="text-[12px] text-[var(--color-ink-mute)] truncate">
                        {r.isMe ? 'You: ' : ''}{r.content}
                      </p>
                    </button>
                  </li>
                ))
              )
            ) : convsLoading ? (
              <li className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </li>
            ) : !conversations?.length ? (
              <li className="flex flex-col items-center gap-3 p-6 text-center">
                <p className="text-[13px] text-[var(--color-ink-mute)]">No conversations yet.</p>
                <button
                  type="button"
                  onClick={() => setNewMsgOpen(true)}
                  className="text-[12px] font-semibold text-[var(--color-forest-500)] hover:text-[var(--color-forest-600)] transition-colors"
                >
                  Start one →
                </button>
              </li>
            ) : (
              conversations.map(c => (
                <li key={c.contactId}>
                  <button
                    onClick={() => navigate(`${basePath}/${c.contactId}`)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 mx-2 my-0.5 rounded-xl text-left transition',
                      contactId === c.contactId
                        ? 'bg-[var(--color-forest-50)] ring-1 ring-[var(--color-forest-100)]'
                        : 'hover:bg-[var(--color-elev)]',
                    )}
                  >
                    <Avatar
                      firstName={c.contactName.split(' ')[0]}
                      lastName={c.contactName.split(' ')[1]}
                      size={38}
                      online={c.isOnline}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[13px] truncate',
                        c.unreadCount > 0 ? 'font-semibold text-[var(--color-ink)]' : 'font-medium text-[var(--color-ink)]',
                      )}>
                        {c.contactName}
                      </p>
                      <p className={cn(
                        'text-[12px] truncate mt-0.5',
                        c.unreadCount > 0 ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-mute)]',
                      )}>
                        {c.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-terra-500)] mt-1.5 shrink-0" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* ── Thread ──────────────────────────────────────────────────────── */}
        <div className={cn(
          'card flex-1 flex flex-col min-w-0 overflow-hidden',
          showSidebar ? 'hidden lg:flex' : 'flex',
        )}>
          {!contactId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 dotted">
              <div className="w-16 h-16 rounded-3xl mesh-green flex items-center justify-center mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-[18px] font-semibold text-[var(--color-ink)]">Select a conversation</p>
              <p className="text-[13px] text-[var(--color-ink-mute)] mt-1">
                Choose someone from the left, or start a new message.
              </p>
              <button
                onClick={() => setNewMsgOpen(true)}
                className="mt-4 text-[13px] font-semibold text-[var(--color-forest-500)] hover:text-[var(--color-forest-600)]"
              >
                New message →
              </button>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-[var(--color-line)] flex items-center gap-3 shrink-0">
                {/* Mobile back button */}
                <button
                  type="button"
                  onClick={() => navigate(basePath)}
                  className="lg:hidden p-1.5 -ml-1 rounded-xl text-[var(--color-ink-mute)] hover:bg-[var(--color-elev)] transition-colors"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={18} />
                </button>

                {activeConv && (
                  <>
                    <Avatar
                      firstName={activeConv.contactName.split(' ')[0]}
                      lastName={activeConv.contactName.split(' ')[1]}
                      size={42}
                      online={activeConv.isOnline}
                    />
                    <div className="flex-1">
                      <p className="text-[16px] font-semibold text-[var(--color-ink)] leading-tight"
                        style={{ fontFamily: 'var(--font-display)' }}>
                        {activeConv.contactName}
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-mute)] flex items-center gap-1.5">
                        {isTyping ? (
                          <span className="text-[var(--color-forest-500)]">typing…</span>
                        ) : activeConv.isOnline ? (
                          <>
                            <span className="relative inline-flex w-1.5 h-1.5">
                              <span className="live w-1.5 h-1.5 rounded-full bg-emerald-500 absolute" />
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </span>
                            online
                          </>
                        ) : 'offline'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 dotted">
                {threadLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={cn('flex gap-2', i % 3 === 0 ? 'justify-end' : 'justify-start')}>
                        {i % 3 !== 0 && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
                        <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-36' : 'w-52')} />
                      </div>
                    ))}
                  </div>
                )}

                {!threadLoading && hasOlderMessages && (
                  <div className="flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => fetchOlderMessages()}
                      disabled={loadingOlder}
                      className="text-[11px] font-medium text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] px-3 py-1.5 rounded-full border border-[var(--color-line)] hover:bg-[var(--color-elev)] transition-colors disabled:opacity-40"
                    >
                      {loadingOlder ? 'Loading…' : 'Load older messages'}
                    </button>
                  </div>
                )}

                {thread.map((msg, idx) => {
                  const isMe    = msg.senderId === user?.id
                  const prevMsg = thread[idx - 1]
                  const showTime = !prevMsg ||
                    new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60_000

                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <p className="text-center text-[10px] text-[var(--color-ink-faint)] my-2">
                          {timeAgo(msg.createdAt)}
                        </p>
                      )}
                      <div className={cn('flex items-end gap-2 group', isMe ? 'justify-end' : 'justify-start')}>
                        {!isMe && (
                          <Avatar
                            firstName={activeConv?.contactName.split(' ')[0]}
                            lastName={activeConv?.contactName.split(' ')[1]}
                            size="sm"
                          />
                        )}

                        {editingId === msg.id ? (
                          <div className="flex items-center gap-2 max-w-xs lg:max-w-md w-full">
                            <input
                              autoFocus
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmEdit() }
                                if (e.key === 'Escape') { setEditingId(null); setEditText('') }
                              }}
                              className="flex-1 h-9 px-3 text-[13px] rounded-2xl border border-[var(--color-forest-500)] bg-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={confirmEdit}
                              disabled={editMsg.isPending || !editText.trim()}
                              className="text-[12px] font-semibold text-[var(--color-forest-500)] hover:text-[var(--color-forest-600)] disabled:opacity-40"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingId(null); setEditText('') }}
                              className="text-[12px] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="relative flex items-end gap-1">
                            {isMe && (
                              <div className="relative" ref={menuMsgId === msg.id ? menuRef : undefined}>
                                <button
                                  type="button"
                                  onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                                  className="p-1 rounded-full text-[var(--color-ink-faint)] hover:text-[var(--color-ink-mute)] hover:bg-[var(--color-elev)] opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <DotsThree size={16} weight="bold" />
                                </button>
                                {menuMsgId === msg.id && (
                                  <div className="absolute bottom-8 right-0 z-10 w-32 bg-white border border-[var(--color-line)] rounded-2xl shadow-[var(--shadow-pop)] py-1 overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(msg)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--color-ink)] hover:bg-[var(--color-elev)] transition-colors"
                                    >
                                      <PencilLine size={13} />
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { deleteMsg.mutate(msg.id); setMenuMsgId(null) }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash size={13} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className={cn(
                              'max-w-[260px] lg:max-w-md px-4 py-2.5 text-[13px] leading-relaxed shadow-[var(--shadow-soft)]',
                              isMe
                                ? 'bg-[var(--color-forest-500)] text-white rounded-2xl rounded-br-sm'
                                : 'bg-white text-[var(--color-ink)] rounded-2xl rounded-bl-sm border border-[var(--color-line)]',
                            )}>
                              {msg.content}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <Avatar
                      firstName={activeConv?.contactName.split(' ')[0]}
                      lastName={activeConv?.contactName.split(' ')[1]}
                      size="sm"
                    />
                    <div className="bg-white border border-[var(--color-line)] shadow-[var(--shadow-soft)] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-faint)] animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-faint)] animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-faint)] animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="p-3 border-t border-[var(--color-line)] shrink-0">
                <div className="flex items-end gap-2 p-2 rounded-2xl bg-[var(--color-elev)] border border-[var(--color-line)] focus-within:border-[var(--color-forest-500)] transition-colors">
                  <textarea
                    value={text}
                    onChange={e => handleTextChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Write a reply…"
                    rows={1}
                    className="flex-1 bg-transparent text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] outline-none resize-none py-2 max-h-32"
                  />
                  <button
                    type="button"
                    disabled={!text.trim() || send.isPending}
                    onClick={handleSend}
                    className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-[13px] font-semibold shrink-0 bg-[var(--color-forest-500)] text-white hover:bg-[var(--color-forest-600)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperPlaneRight size={14} weight="fill" />
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── New message modal ───────────────────────────────────────────────── */}
      <Modal
        open={newMsgOpen}
        onClose={() => { setNewMsgOpen(false); setSearchQ('') }}
        title="New message"
        description="Search for a person to start a conversation."
        size="sm"
      >
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-mute)] pointer-events-none" />
            <input
              autoFocus
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full h-10 pl-9 pr-4 text-[13px] rounded-xl border border-[var(--color-line)] bg-white focus:outline-none focus:border-[var(--color-forest-500)] placeholder:text-[var(--color-ink-mute)] transition-colors"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {searchQ.length < 2 ? (
              <p className="text-[12px] text-[var(--color-ink-mute)] text-center py-6">
                Type at least 2 characters to search
              </p>
            ) : searchLoading ? (
              <p className="text-[12px] text-[var(--color-ink-mute)] text-center py-6">Searching…</p>
            ) : searchError ? (
              <p className="text-[12px] text-red-500 text-center py-6">
                Search failed — check that the server is running
              </p>
            ) : !searchResults?.length ? (
              <p className="text-[12px] text-[var(--color-ink-mute)] text-center py-6">
                No users found for &ldquo;{debouncedSearch}&rdquo;
              </p>
            ) : (
              searchResults.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setNewMsgOpen(false)
                    setSearchQ('')
                    navigate(`${basePath}/${u.id}`)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-elev)] transition-colors text-left"
                >
                  <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--color-ink)] truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[12px] text-[var(--color-ink-mute)] truncate">{u.email}</p>
                  </div>
                  <span className="text-[11px] text-[var(--color-ink-faint)] shrink-0 capitalize font-mono">{u.role}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
