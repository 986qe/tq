export interface Color {
  name: string
  hex: string
  dark: string
}

export interface Player {
  id: number
  name: string
  color: Color
  x: number
  y: number
  speed: number
  isAlive: boolean
  isImpostor: boolean
  radius: number
  voteTarget: number | null
  bobOffset: number
  bobSpeed: number
  // AI
  aiTargetX: number
  aiTargetY: number
  aiMoveTimer: number
  aiKillCooldown: number
  aiState: string
  aiTaskTarget: Task | null
}

export interface Task {
  id: number
  name: string
  x: number
  y: number
  duration: number
  isCompleted: boolean
}

export interface DeadBody {
  x: number
  y: number
  color: Color
  playerId: number
}

export type GamePhase = 'menu' | 'playing' | 'meeting' | 'result'
export type Role = 'crewmate' | 'impostor'
export type WinReason = 'tasks' | 'vote' | 'kill' | 'time' | null

export interface GameState {
  phase: GamePhase
  role: Role
  players: Player[]
  currentPlayer: Player | null
  tasks: Task[]
  bodies: DeadBody[]
  totalTasks: number
  completedTasks: number
  killCooldown: number
  meetingTimer: number
  isAlive: boolean
  sabotageActive: boolean
  gameTime: number
  currentTask: Task | null
  taskProgress: number
  doingTask: boolean
  selectedVote: number | null
  killFlashTime: number
  resultWinner: Role | null
  resultReason: string
}
