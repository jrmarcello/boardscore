export interface Player {
  id: string
  name: string
  score: number
  odUserId: string | null
  photoURL: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreatePlayerDTO {
  name: string
  odUserId?: string
  photoURL?: string
}

export type UpdateScoreDTO = {
  playerId: string
  delta: number // positivo para somar, negativo para subtrair
}
