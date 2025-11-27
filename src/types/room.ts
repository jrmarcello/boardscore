export interface Room {
  id: string
  name: string
  ownerId: string | null
  password: string | null
  status: 'active' | 'finished'
  createdAt: Date
  finishedAt: Date | null
}

export interface CreateRoomDTO {
  name: string
  customId?: string
  password?: string
  ownerId?: string
}

export interface JoinRoomDTO {
  roomId: string
  password?: string
}
