import { Obstacle, Item, Particle } from '@/types/game'
import {
  GROUND_Y, OBSTACLE_SPAWN_RATE, ITEM_SPAWN_RATE,
  GROUND_OBSTACLE_TYPES, AIR_OBSTACLE_TYPES, ITEM_TYPES
} from './constants'

export function spawnObstacle(canvasWidth: number, canvasHeight: number): Obstacle {
  const isAir = Math.random() > 0.5
  const types = isAir ? AIR_OBSTACLE_TYPES : GROUND_OBSTACLE_TYPES
  const type = types[Math.floor(Math.random() * types.length)]
  const groundY = canvasHeight * GROUND_Y

  return {
    x: canvasWidth + 50,
    y: isAir ? groundY - 100 - Math.random() * 50 : groundY - type.height,
    width: type.width,
    height: type.height,
    type: type.type,
  }
}

export function spawnItem(canvasWidth: number, canvasHeight: number): Item {
  const typeInfo = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)]
  const groundY = canvasHeight * GROUND_Y
  const yPos = Math.random() > 0.5
    ? groundY - 40 - Math.random() * 60
    : groundY - 100 - Math.random() * 50

  return {
    x: canvasWidth + 50,
    y: yPos,
    type: typeInfo.type,
    value: typeInfo.value,
  }
}

export function createParticles(x: number, y: number, color: string, count: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color,
      size: 2 + Math.random() * 4,
    })
  }
  return particles
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      life: p.life - 1,
    }))
    .filter(p => p.life > 0)
}

export function shouldSpawnObstacle(elapsed: number): boolean {
  return Math.random() < OBSTACLE_SPAWN_RATE && elapsed > 500
}

export function shouldSpawnItem(elapsed: number): boolean {
  return Math.random() < ITEM_SPAWN_RATE && elapsed > 300
}
