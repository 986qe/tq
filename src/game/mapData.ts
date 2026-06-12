import { TILE_WALL, TILE_FLOOR, TILE_DOOR, MAP_WIDTH, MAP_HEIGHT } from '@/game/constants'

// 地图数据 (25x18)
// 0=空地, 1=墙壁, 2=地板, 3=门
export const mapData: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,2,1,1,1,2,1,1,2,1,2,1,1,2,1,1,2,1],
  [1,2,1,2,2,1,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1,1,1,1,2,2,1],
  [1,2,1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1],
  [1,2,1,1,1,2,1,1,2,1,2,1,1,3,1,1,2,1,1,1,2,1,2,2,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,3,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,2,2,1,2,1,1,1,1,1,2,1,1,2,1,1,2,2,1],
  [1,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,3,1,2,1,2,1,1,1,2,1,1,1,1,2,1,1,1,1,2,1,1,1],
  [1,2,2,3,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,2,1,1,1,1,2,2,1,2,1,2,2,1,1,2,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,1,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,2,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
]

export function isWall(tileX: number, tileY: number): boolean {
  if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
    return true
  }
  return mapData[tileY][tileX] === TILE_WALL
}

export function isWalkable(pixelX: number, pixelY: number, playerRadius: number = 12): boolean {
  const left = Math.floor((pixelX - playerRadius) / 40)
  const right = Math.floor((pixelX + playerRadius) / 40)
  const top = Math.floor((pixelY - playerRadius) / 40)
  const bottom = Math.floor((pixelY + playerRadius) / 40)

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (isWall(x, y)) return false
    }
  }
  return true
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}
