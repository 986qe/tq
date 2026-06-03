export interface Player {
  x: number
  y: number
  width: number
  height: number
  velocityY: number
  isJumping: boolean
  isSliding: boolean
  hasShield: boolean
  hasMagnet: boolean
  magnetTimer: number
  shieldTimer: number
}

export interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  type: 'ground' | 'air'
}

export type ItemType = 'energy' | 'shield' | 'magnet'

export interface Item {
  x: number
  y: number
  type: ItemType
  value: number
  collected?: boolean
}

export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  score: number
  highScore: number
  speed: number
  player: Player
  obstacles: Obstacle[]
  items: Item[]
  particles: Particle[]
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}
