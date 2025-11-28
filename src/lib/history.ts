import type { Player } from '../types'

export interface HistoryEntry {
  id: string
  playerId: string
  playerName: string
  action: 'score_up' | 'score_down' | 'player_added' | 'player_removed' | 'leader_change' | 'scores_reset' | 'board_cleared'
  amount?: number
  timestamp: Date
  details?: string
}

// Session-persistent history per room (survives refresh, clears on tab close)
class HistoryManager {
  private entriesByRoom: Map<string, HistoryEntry[]> = new Map()
  private snapshotByRoom: Map<string, HistoryEntry[]> = new Map()
  private currentRoomId: string | null = null
  private maxEntries = 50
  private listeners: Set<() => void> = new Set()

  private getStorageKey(roomId: string): string {
    return `boardscore_history_${roomId}`
  }

  private loadFromStorage(roomId: string): HistoryEntry[] {
    try {
      const stored = sessionStorage.getItem(this.getStorageKey(roomId))
      if (!stored) return []
      const entries = JSON.parse(stored) as HistoryEntry[]
      // Reconvert timestamps from string to Date
      return entries.map(e => ({ ...e, timestamp: new Date(e.timestamp) }))
    } catch {
      return []
    }
  }

  private saveToStorage(roomId: string, entries: HistoryEntry[]) {
    try {
      sessionStorage.setItem(this.getStorageKey(roomId), JSON.stringify(entries))
    } catch {
      // Storage full or unavailable - silently fail
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getEntries(): HistoryEntry[] {
    if (!this.currentRoomId) return []
    return this.entriesByRoom.get(this.currentRoomId) || []
  }

  private setEntries(entries: HistoryEntry[]) {
    if (!this.currentRoomId) return
    this.entriesByRoom.set(this.currentRoomId, entries)
    this.saveToStorage(this.currentRoomId, entries)
  }

  private updateSnapshot() {
    if (!this.currentRoomId) return
    this.snapshotByRoom.set(this.currentRoomId, [...this.getEntries()])
  }

  setRoom(roomId: string) {
    if (this.currentRoomId !== roomId) {
      this.currentRoomId = roomId
      // Load from sessionStorage or initialize empty
      if (!this.entriesByRoom.has(roomId)) {
        const stored = this.loadFromStorage(roomId)
        this.entriesByRoom.set(roomId, stored)
        this.snapshotByRoom.set(roomId, [...stored])
      }
      this.notifyListeners()
    }
  }

  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    if (!this.currentRoomId) return

    const newEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    }

    const entries = this.getEntries()
    entries.unshift(newEntry)

    // Keep only last N entries
    if (entries.length > this.maxEntries) {
      this.setEntries(entries.slice(0, this.maxEntries))
    }

    this.updateSnapshot()
    this.notifyListeners()
  }

  logScoreChange(player: Player, amount: number) {
    const action = amount > 0 ? 'score_up' : 'score_down'
    this.addEntry({
      playerId: player.id,
      playerName: player.name,
      action,
      amount: Math.abs(amount),
      details: `${amount > 0 ? '+' : ''}${amount} pts`,
    })
  }

  logPlayerAdded(player: Player) {
    this.addEntry({
      playerId: player.id,
      playerName: player.name,
      action: 'player_added',
      details: 'entrou no jogo',
    })
  }

  logPlayerRemoved(playerName: string, playerId: string) {
    this.addEntry({
      playerId,
      playerName,
      action: 'player_removed',
      details: 'saiu do jogo',
    })
  }

  logLeaderChange(newLeader: Player, previousLeader?: Player) {
    this.addEntry({
      playerId: newLeader.id,
      playerName: newLeader.name,
      action: 'leader_change',
      details: previousLeader
        ? `assumiu a liderança de ${previousLeader.name}`
        : 'é o novo líder!',
    })
  }

  logScoresReset(playerCount: number) {
    this.addEntry({
      playerId: 'system',
      playerName: 'Sistema',
      action: 'scores_reset',
      details: `Placar zerado (${playerCount} jogadores)`,
    })
  }

  logBoardCleared(removedCount: number) {
    this.addEntry({
      playerId: 'system',
      playerName: 'Sistema',
      action: 'board_cleared',
      details: `Sala esvaziada (${removedCount} jogadores removidos)`,
    })
  }

  getSnapshot(): HistoryEntry[] {
    if (!this.currentRoomId) return []
    return this.snapshotByRoom.get(this.currentRoomId) || []
  }

  clear() {
    if (!this.currentRoomId) return
    this.entriesByRoom.set(this.currentRoomId, [])
    this.saveToStorage(this.currentRoomId, [])
    this.updateSnapshot()
    this.notifyListeners()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }
}

export const historyManager = new HistoryManager()

// Format timestamp for display
export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get emoji for action type
export function getActionEmoji(action: HistoryEntry['action']): string {
  switch (action) {
    case 'score_up':
      return '⬆️'
    case 'score_down':
      return '⬇️'
    case 'player_added':
      return '🎮'
    case 'player_removed':
      return '👋'
    case 'leader_change':
      return '👑'
    case 'scores_reset':
      return '🔄'
    case 'board_cleared':
      return '🧹'
    default:
      return '📝'
  }
}
