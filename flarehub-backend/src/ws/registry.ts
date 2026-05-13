import type { WebSocket } from '@fastify/websocket';
import type { ServerEvent } from './events.js';

export class ConnectionRegistry {
  private connections = new Map<string, Set<WebSocket>>();

  register(userId: string, ws: WebSocket): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(ws);
  }

  unregister(userId: string, ws: WebSocket): void {
    const conns = this.connections.get(userId);
    if (!conns) return;
    conns.delete(ws);
    if (conns.size === 0) this.connections.delete(userId);
  }

  isOnline(userId: string): boolean {
    const conns = this.connections.get(userId);
    return !!conns && conns.size > 0;
  }

  push(userId: string, event: ServerEvent): void {
    const conns = this.connections.get(userId);
    if (!conns) return;
    const payload = JSON.stringify(event);
    for (const ws of conns) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
  }

  pushMany(userIds: string[], event: ServerEvent): void {
    for (const id of userIds) this.push(id, event);
  }

  broadcast(event: ServerEvent): void {
    const payload = JSON.stringify(event);
    for (const conns of this.connections.values()) {
      for (const ws of conns) {
        if (ws.readyState === ws.OPEN) {
          ws.send(payload);
        }
      }
    }
  }

  startHeartbeat(intervalMs = 30_000): NodeJS.Timeout {
    return setInterval(() => {
      for (const [userId, conns] of this.connections) {
        for (const ws of conns) {
          if (ws.readyState !== ws.OPEN) {
            this.unregister(userId, ws);
          }
        }
      }
    }, intervalMs);
  }
}
