import { supabase } from './supabase'

type EventHandler = (data: unknown) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private handlers = new Map<string, Set<EventHandler>>()
  private reconnectDelay = 1000
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = true
  private connecting = false

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return () => this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach((fn) => fn(data))
    this.handlers.get('*')?.forEach((fn) => fn({ type: event, data }))
  }

  async connect() {
    // Prevent concurrent connect calls (e.g. React StrictMode double-effect,
    // or rapid auth events) from racing and closing an in-flight WebSocket.
    if (this.connecting) return
    this.connecting = true

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return

      // Idempotent: null out the old handlers before closing so the onclose
      // callback doesn't schedule another reconnect when we're replacing a
      // still-open connection (e.g. Supabase TOKEN_REFRESHED fires every ~50 min)
      if (this.ws) {
        this.ws.onclose = null
        this.ws.onerror = null
        this.ws.close()
        this.ws = null
        this.stopPing()
      }
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }

      this.shouldReconnect = true
      const wsUrl = `${import.meta.env.VITE_WS_URL}?token=${token}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.reconnectDelay = 1000
        this.startPing()
      }

      this.ws.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string) as { type: string; data?: unknown }
          this.emit(msg.type, msg.data)
        } catch {
          // malformed message — ignore
        }
      }

      this.ws.onclose = () => {
        this.stopPing()
        if (this.shouldReconnect) this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.ws?.close()
      }
    } finally {
      this.connecting = false
    }
  }

  send(type: string, data?: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    }
  }

  disconnect() {
    this.shouldReconnect = false
    this.stopPing()
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    this.ws?.close()
    this.ws = null
  }

  private startPing() {
    this.pingInterval = setInterval(() => this.send('ping'), 25_000)
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private scheduleReconnect() {
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
      this.connect()
    }, this.reconnectDelay)
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsClient = new WebSocketClient()
