export const GRAVITY = 0.6
export const JUMP_FORCE = -12
export const GROUND_Y = 0.75
export const PLAYER_X = 80
export const BASE_SPEED = 5
export const SPEED_INCREMENT = 0.001
export const MAX_SPEED = 12
export const OBSTACLE_SPAWN_RATE = 0.02
export const ITEM_SPAWN_RATE = 0.008
export const SLIDE_DURATION = 500
export const PLAYER_WIDTH = 40
export const PLAYER_HEIGHT = 60
export const PLAYER_SLIDE_HEIGHT = 25
export const GROUND_OBSTACLE_TYPES = [
  { width: 30, height: 40, type: 'ground' as const },
  { width: 50, height: 35, type: 'ground' as const },
  { width: 25, height: 50, type: 'ground' as const },
]
export const AIR_OBSTACLE_TYPES = [
  { width: 60, height: 20, type: 'air' as const },
  { width: 40, height: 30, type: 'air' as const },
]
export const ITEM_TYPES: Array<{ type: 'energy' | 'shield' | 'magnet', value: number }> = [
  { type: 'energy', value: 10 },
  { type: 'shield', value: 0 },
  { type: 'magnet', value: 0 },
]
