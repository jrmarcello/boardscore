import type { Player } from '../types'

export interface HistoryEntry {
  id: string
  playerId: string
  playerName: string
  action: 'score_up' | 'score_down' | 'player_added' | 'player_removed' | 'leader_change'
  amount?: number
  timestamp: Date
  details?: string
}

// In-memory history (could be persisted to Firestore later)
class HistoryManager {
  private entries: HistoryEntry[] = []
  private maxEntries = 50
  private listeners: Set<() => void> = new Set()

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    const newEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    }

    this.entries.unshift(newEntry)

    // Keep only last N entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries)
    }

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

  getEntries(): HistoryEntry[] {
    return [...this.entries]
  }

  clear() {
    this.entries = []
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
    default:
      return '📝'
  }
}
