import { GRAVITY, JUMP_FORCE, GROUND_Y, PLAYER_SLIDE_HEIGHT, PLAYER_HEIGHT } from './constants'
import { Player } from '@/types/game'

export function updatePlayerPhysics(player: Player, canvasHeight: number): Player {
  const groundY = canvasHeight * GROUND_Y - player.height
  const updated = { ...player }

  // Apply gravity
  if (updated.y < groundY || updated.velocityY < 0) {
    updated.velocityY += GRAVITY
  }

  updated.y += updated.velocityY

  // Ground collision
  if (updated.y >= groundY) {
    updated.y = groundY
    updated.velocityY = 0
    updated.isJumping = false
  }

  return updated
}

export function jump(player: Player): Player {
  if (!player.isJumping && !player.isSliding) {
    return {
      ...player,
      velocityY: JUMP_FORCE,
      isJumping: true,
    }
  }
  return player
}

export function startSlide(player: Player): Player {
  if (!player.isSliding && !player.isJumping) {
    const groundY = player.y + player.height - PLAYER_SLIDE_HEIGHT
    return {
      ...player,
      height: PLAYER_SLIDE_HEIGHT,
      y: groundY,
      isSliding: true,
    }
  }
  return player
}

export function endSlide(player: Player): Player {
  if (player.isSliding) {
    const groundY = player.y + player.height - PLAYER_HEIGHT
    return {
      ...player,
      height: PLAYER_HEIGHT,
      y: groundY,
      isSliding: false,
    }
  }
  return player
}
