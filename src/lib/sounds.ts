// Sound effects for gamification
// Using Web Audio API for instant playback

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled = true

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  // Play a "coin" sound when scoring
  playCoin() {
    if (!this.enabled) return
    this.playTone(880, 0.1, 'sine') // A5 note
    setTimeout(() => this.playTone(1108, 0.1, 'sine'), 50) // C#6 note
  }

  // Play a descending tone when losing points
  playLose() {
    if (!this.enabled) return
    this.playTone(440, 0.1, 'sawtooth') // A4
    setTimeout(() => this.playTone(330, 0.15, 'sawtooth'), 80) // E4
  }

  // Play a fanfare when leader changes
  playFanfare() {
    if (!this.enabled) return
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'triangle'), i * 100)
    })
  }

  // Play a celebration for new player
  playNewPlayer() {
    if (!this.enabled) return
    this.playTone(523, 0.08, 'sine') // C5
    setTimeout(() => this.playTone(659, 0.08, 'sine'), 60) // E5
    setTimeout(() => this.playTone(784, 0.12, 'sine'), 120) // G5
  }

  // Play delete sound
  playDelete() {
    if (!this.enabled) return
    this.playTone(200, 0.15, 'square')
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
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
    } catch {
      // Audio not supported, fail silently
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager()
