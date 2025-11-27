// Sound effects for gamification
// Using Web Audio API for instant playback

type SoundPriority = 'low' | 'medium' | 'high'

interface ActiveSound {
  oscillator: OscillatorNode
  gainNode: GainNode
  priority: SoundPriority
}

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled = true
  private activeSounds: ActiveSound[] = []
  private priorityLock: SoundPriority | null = null
  private priorityTimeout: ReturnType<typeof setTimeout> | null = null

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    return this.audioContext
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  private getPriorityValue(priority: SoundPriority): number {
    const priorityOrder: Record<SoundPriority, number> = {
      low: 1,
      medium: 2,
      high: 3,
    }
    return priorityOrder[priority]
  }

  private stopLowerPrioritySounds(priority: SoundPriority) {
    const priorityValue = this.getPriorityValue(priority)
    
    // Stop all sounds with lower priority
    this.activeSounds = this.activeSounds.filter((sound) => {
      if (this.getPriorityValue(sound.priority) < priorityValue) {
        try {
          // Fade out quickly instead of abrupt stop
          sound.gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            this.getContext().currentTime + 0.05
          )
          sound.oscillator.stop(this.getContext().currentTime + 0.05)
        } catch {
          // Already stopped
        }
        return false
      }
      return true
    })
  }

  private setPriorityLock(priority: SoundPriority, duration: number) {
    if (this.priorityTimeout) {
      clearTimeout(this.priorityTimeout)
    }
    
    this.priorityLock = priority
    this.priorityTimeout = setTimeout(() => {
      this.priorityLock = null
      this.priorityTimeout = null
    }, duration)
  }

  private canPlay(priority: SoundPriority): boolean {
    if (!this.priorityLock) return true
    return this.getPriorityValue(priority) >= this.getPriorityValue(this.priorityLock)
  }

  // Play a "coin" sound when scoring
  playCoin() {
    if (!this.enabled) return
    if (!this.canPlay('low')) return
    
    this.playTone(880, 0.1, 'sine', 'low') // A5 note
    setTimeout(() => {
      if (this.canPlay('low')) {
        this.playTone(1108, 0.1, 'sine', 'low')
      }
    }, 50) // C#6 note
  }

  // Play a descending tone when losing points
  playLose() {
    if (!this.enabled) return
    if (!this.canPlay('low')) return
    
    this.playTone(440, 0.1, 'sawtooth', 'low') // A4
    setTimeout(() => {
      if (this.canPlay('low')) {
        this.playTone(330, 0.15, 'sawtooth', 'low')
      }
    }, 80) // E4
  }

  // Play a fanfare when leader changes (HIGH PRIORITY - interrupts others)
  playFanfare() {
    if (!this.enabled) return
    
    // High priority: stop lower priority sounds and lock
    this.stopLowerPrioritySounds('high')
    this.setPriorityLock('high', 500)
    
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'triangle', 'high'), i * 100)
    })
  }

  // Play a celebration for new player (MEDIUM PRIORITY)
  playNewPlayer() {
    if (!this.enabled) return
    if (!this.canPlay('medium')) return
    
    this.setPriorityLock('medium', 200)
    this.playTone(523, 0.08, 'sine', 'medium') // C5
    setTimeout(() => {
      if (this.canPlay('medium')) {
        this.playTone(659, 0.08, 'sine', 'medium')
      }
    }, 60) // E5
    setTimeout(() => {
      if (this.canPlay('medium')) {
        this.playTone(784, 0.12, 'sine', 'medium')
      }
    }, 120) // G5
  }

  // Play delete sound (MEDIUM PRIORITY)
  playDelete() {
    if (!this.enabled) return
    if (!this.canPlay('medium')) return
    
    this.setPriorityLock('medium', 150)
    this.playTone(200, 0.15, 'square', 'medium')
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    priority: SoundPriority = 'low'
  ) {
    try {
      const ctx = this.getContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)

      // Track active sound
      const activeSound: ActiveSound = { oscillator, gainNode, priority }
      this.activeSounds.push(activeSound)

      // Remove from active sounds when done
      oscillator.onended = () => {
        const index = this.activeSounds.indexOf(activeSound)
        if (index > -1) {
          this.activeSounds.splice(index, 1)
        }
      }
    } catch {
      // Audio not supported, fail silently
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager()
