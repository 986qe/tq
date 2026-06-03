import { Player, Obstacle, Item, Particle } from '@/types/game'
import { GROUND_Y, PLAYER_X } from './constants'

export function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, offset: number) {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#0a0a1a')
  gradient.addColorStop(0.5, '#1a1a3a')
  gradient.addColorStop(1, '#0a0a1a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  for (let i = 0; i < 50; i++) {
    const x = ((i * 73 + offset * 0.1) % width)
    const y = (i * 37) % (height * 0.5)
    const size = (i % 3) + 1
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  // Distant buildings
  ctx.fillStyle = '#0f0f2a'
  for (let i = 0; i < 15; i++) {
    const bx = ((i * 120 - offset * 0.3) % (width + 200)) - 100
    const bh = 80 + (i * 47) % 150
    const by = height * GROUND_Y - bh
    ctx.fillRect(bx, by, 50, bh)
    
    // Windows
    ctx.fillStyle = 'rgba(0, 245, 255, 0.2)'
    for (let wy = by + 10; wy < by + bh - 10; wy += 20) {
      for (let wx = bx + 8; wx < bx + 42; wx += 15) {
        ctx.fillRect(wx, wy, 8, 10)
      }
    }
    ctx.fillStyle = '#0f0f2a'
  }

  // Ground
  const groundY = height * GROUND_Y
  ctx.fillStyle = '#1a1a3a'
  ctx.fillRect(0, groundY, width, height - groundY)

  // Ground line with neon glow
  ctx.strokeStyle = '#00f5ff'
  ctx.lineWidth = 2
  ctx.shadowColor = '#00f5ff'
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(width, groundY)
  ctx.stroke()
  ctx.shadowBlur = 0

  // Ground grid lines
  ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)'
  ctx.lineWidth = 1
  for (let gx = -offset % 40; gx < width; gx += 40) {
    ctx.beginPath()
    ctx.moveTo(gx, groundY)
    ctx.lineTo(gx - 30, height)
    ctx.stroke()
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  ctx.save()
  
  if (player.hasShield) {
    ctx.shadowColor = '#00f5ff'
    ctx.shadowBlur = 20
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  // Body
  const bodyColor = player.isSliding ? '#ff00aa' : '#00f5ff'
  ctx.fillStyle = bodyColor
  ctx.shadowColor = bodyColor
  ctx.shadowBlur = 15
  
  // Simple character shape
  const cx = player.x + player.width / 2
  const cy = player.y + player.height / 2
  
  if (player.isSliding) {
    // Sliding pose
    ctx.fillRect(player.x, player.y, player.width, player.height)
  } else {
    // Running pose
    ctx.fillRect(player.x, player.y + 10, player.width, player.height - 20)
    // Head
    ctx.fillRect(player.x + 5, player.y, player.width - 10, 15)
  }
  
  ctx.shadowBlur = 0
  ctx.restore()
}

export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  ctx.save()
  
  if (obstacle.type === 'ground') {
    ctx.fillStyle = '#ff0066'
    ctx.shadowColor = '#ff0066'
    ctx.shadowBlur = 10
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    
    // Danger stripes
    ctx.fillStyle = '#0a0a1a'
    for (let i = 0; i < obstacle.height; i += 8) {
      ctx.fillRect(obstacle.x, obstacle.y + i, obstacle.width, 3)
    }
  } else {
    // Air obstacle (drone/bar)
    ctx.fillStyle = '#ff00aa'
    ctx.shadowColor = '#ff00aa'
    ctx.shadowBlur = 10
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    
    // Glow effect
    ctx.fillStyle = 'rgba(255, 0, 170, 0.3)'
    ctx.fillRect(obstacle.x - 5, obstacle.y - 5, obstacle.width + 10, obstacle.height + 10)
  }
  
  ctx.shadowBlur = 0
  ctx.restore()
}

export function drawItem(ctx: CanvasRenderingContext2D, item: Item) {
  ctx.save()
  
  let color = '#ffdd00'
  let symbol = '★'
  
  switch (item.type) {
    case 'energy':
      color = '#ffdd00'
      symbol = '★'
      break
    case 'shield':
      color = '#00ff88'
      symbol = '◆'
      break
    case 'magnet':
      color = '#8b5cf6'
      symbol = '●'
      break
  }
  
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 15
  
  // Draw item circle
  ctx.beginPath()
  ctx.arc(item.x + 15, item.y + 15, 15, 0, Math.PI * 2)
  ctx.fill()
  
  // Symbol
  ctx.fillStyle = '#0a0a1a'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(symbol, item.x + 15, item.y + 15)
  
  ctx.shadowBlur = 0
  ctx.restore()
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    ctx.save()
    const alpha = p.life / p.maxLife
    ctx.fillStyle = p.color
    ctx.globalAlpha = alpha
    ctx.shadowColor = p.color
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}
