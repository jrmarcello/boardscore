export interface Player {
  id: string
  name: string
  score: number
  createdAt: Date
  updatedAt: Date
}

export type CreatePlayerDTO = Pick<Player, 'name'>

export type UpdateScoreDTO = {
  playerId: string
  delta: number // positivo para somar, negativo para subtrair
}
