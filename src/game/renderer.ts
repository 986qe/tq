import { RefObject } from 'react'
import { GameState, Player, DeadBody, Task } from '@/types/game'
import { mapData, isWall } from '@/game/mapData'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TILE_WALL, TILE_FLOOR, TILE_DOOR } from '@/game/constants'

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  drawMap(ctx)
  state.tasks.forEach(task => drawTask(ctx, task))
  state.bodies.forEach(body => drawDeadBody(ctx, body))
  
  const sortedPlayers = [...state.players].sort((a, b) => a.y - b.y)
  sortedPlayers.forEach(player => drawPlayer(ctx, player, player === state.currentPlayer))
  
  drawEffects(ctx, state)
}

function drawMap(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = mapData[y][x]
      const px = x * TILE_SIZE
      const py = y * TILE_SIZE

      if (tile === TILE_WALL) {
        ctx.fillStyle = '#1a2030'
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        ctx.strokeStyle = '#2a3550'
        ctx.lineWidth = 1
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
        ctx.fillStyle = 'rgba(255,255,255,0.02)'
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 3)
      } else if (tile === TILE_FLOOR || tile === 0) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#0f1319' : '#0d1117'
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
      } else if (tile === TILE_DOOR) {
        ctx.fillStyle = '#1a2030'
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        ctx.fillStyle = 'rgba(0, 229, 255, 0.3)'
        ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10)
      }
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, isCurrent: boolean) {
  if (!player.isAlive) return

  const x = player.x
  const y = player.y + player.bobOffset
  const r = player.radius

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(x, y + r + 3, r, r * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  // 身体
  ctx.fillStyle = player.color.hex
  ctx.beginPath()
  ctx.ellipse(x, y + 2, r * 0.8, r, 0, 0, Math.PI * 2)
  ctx.fill()

  // 身体暗部
  ctx.fillStyle = player.color.dark
  ctx.beginPath()
  ctx.ellipse(x, y + 4, r * 0.7, r * 0.6, 0, 0, Math.PI)
  ctx.fill()

  // 头盔
  ctx.fillStyle = '#1a2535'
  ctx.beginPath()
  ctx.ellipse(x, y - 2, r * 0.9, r * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()

  // 面罩反光
  ctx.fillStyle = 'rgba(100, 200, 255, 0.3)'
  ctx.beginPath()
  ctx.ellipse(x - 3, y - 4, r * 0.4, r * 0.3, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // 背包
  ctx.fillStyle = player.color.dark
  ctx.fillRect(x - r - 3, y - 2, 5, r * 1.2)

  // 当前玩家标记
  if (isCurrent) {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, r + 5, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawDeadBody(ctx: CanvasRenderingContext2D, body: DeadBody) {
  const x = body.x
  const y = body.y
  const r = 12

  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.beginPath()
  ctx.ellipse(x, y + 5, r, r * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = body.color.hex
  ctx.beginPath()
  ctx.ellipse(x, y, r * 1.5, r * 0.6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x - 5, y - 5)
  ctx.lineTo(x + 5, y + 5)
  ctx.moveTo(x + 5, y - 5)
  ctx.lineTo(x - 5, y + 5)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 23, 68, 0.4)'
  ctx.beginPath()
  ctx.ellipse(x + 10, y + 3, 8, 5, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawTask(ctx: CanvasRenderingContext2D, task: Task) {
  if (task.isCompleted) return

  const x = task.x
  const y = task.y
  const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7

  ctx.fillStyle = `rgba(0, 230, 118, ${0.1 * pulse})`
  ctx.beginPath()
  ctx.arc(x, y, 25, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#00e676'
  ctx.beginPath()
  ctx.arc(x, y, 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#0a0e17'
  ctx.font = 'bold 12px Orbitron'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', x, y + 1)

  ctx.fillStyle = 'rgba(0, 230, 118, 0.7)'
  ctx.font = '10px "Noto Sans SC"'
  ctx.fillText(task.name, x, y - 20)
}

function drawEffects(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.sabotageActive) {
    const alpha = Math.sin(Date.now() * 0.01) * 0.15 + 0.15
    ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }

  if (state.killFlashTime > 0) {
    const alpha = state.killFlashTime / 200
    ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }
}
