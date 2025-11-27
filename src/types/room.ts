export interface Room {
  id: string
  name: string
  password: string | null
  status: 'active' | 'finished'
  createdAt: Date
  finishedAt: Date | null
}

export interface CreateRoomDTO {
  name: string
  customId?: string
  password?: string
}

export interface JoinRoomDTO {
  roomId: string
  password?: string
}
