import { Obstacle, Item, Player } from '@/types/game'

function checkAABB(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function checkObstacleCollision(player: Player, obstacle: Obstacle): boolean {
  const padding = 5
  return checkAABB(
    player.x + padding, player.y + padding, player.width - padding * 2, player.height - padding * 2,
    obstacle.x, obstacle.y, obstacle.width, obstacle.height
  )
}

export function checkItemCollection(player: Player, item: Item): boolean {
  const magnetRange = item.collected ? 0 : (player.hasMagnet ? 100 : 0)
  const px = player.x + player.width / 2
  const py = player.y + player.height / 2
  const ix = item.x + 15
  const iy = item.y + 15
  
  const dist = Math.sqrt((px - ix) ** 2 + (py - iy) ** 2)
  return dist < (40 + magnetRange)
}
