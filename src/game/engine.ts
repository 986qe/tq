import { useGameStore, GameStoreState } from '@/store/gameStore'
import { Player, Task } from '@/types/game'
import { PLAYER_SPEED, KILL_COOLDOWN, KILL_DISTANCE, TASK_DISTANCE, BODY_DISTANCE, TILE_WALL, TILE_FLOOR, TILE_DOOR, MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS } from '@/game/constants'
import { isWalkable, distance, isWall, mapData } from '@/game/mapData'

let keys: Record<string, boolean> = {}

export function initInput() {
  keys = {}
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
}

export function cleanupInput() {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
}

function handleKeyDown(e: KeyboardEvent) {
  keys[e.key.toLowerCase()] = true
  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','k','r'].includes(e.key.toLowerCase())) {
    e.preventDefault()
  }
}

function handleKeyUp(e: KeyboardEvent) {
  keys[e.key.toLowerCase()] = false
}

export function handlePlayerInput(store: GameStoreState): void {
  const player = store.currentPlayer
  if (!player || !player.isAlive || store.doingTask || store.phase !== 'playing') return

  let moveX = 0
  let moveY = 0

  if (keys['w'] || keys['arrowup']) moveY = -1
  if (keys['s'] || keys['arrowdown']) moveY = 1
  if (keys['a'] || keys['arrowleft']) moveX = -1
  if (keys['d'] || keys['arrowright']) moveX = 1

  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.707
    moveY *= 0.707
  }

  if (moveX !== 0 || moveY !== 0) {
    const newX = player.x + moveX * PLAYER_SPEED
    const newY = player.y + moveY * PLAYER_SPEED

    if (isWalkable(newX, player.y, player.radius)) {
      player.x = newX
    }
    if (isWalkable(player.x, newY, player.radius)) {
      player.y = newY
    }
    player.bobSpeed = 0.008
  } else {
    player.bobSpeed = 0
  }

  // E键：任务/报告
  if (keys['e'] || keys['r']) {
    keys['e'] = false
    keys['r'] = false
    if (!store.doingTask) {
      const nearbyBody = store.bodies.find(b => distance(player.x, player.y, b.x, b.y) < BODY_DISTANCE)
      if (nearbyBody) {
        store.reportBody(nearbyBody)
        return
      }
      const nearbyTask = store.tasks.find(t => !t.isCompleted && distance(player.x, player.y, t.x, t.y) < TASK_DISTANCE)
      if (nearbyTask) {
        store.startTask(nearbyTask)
      }
    }
  }

  // K键：击杀
  if (keys['k'] && player.isImpostor && store.killCooldown <= 0 && !store.doingTask) {
    keys['k'] = false
    const nearbyCrew = store.players.find(p =>
      p !== player && p.isAlive && !p.isImpostor &&
      distance(player.x, player.y, p.x, p.y) < KILL_DISTANCE
    )
    if (nearbyCrew) {
      store.performKill(player, nearbyCrew)
    }
  }
}

export function updateAIPlayer(player: Player, store: GameStoreState, deltaTime: number): void {
  if (!player.isAlive || player === store.currentPlayer) return

  player.aiKillCooldown -= deltaTime
  player.aiMoveTimer -= deltaTime

  // 内鬼AI：击杀附近船员
  if (player.isImpostor && player.aiKillCooldown <= 0) {
    const nearby = store.players.find(p =>
      p !== player && p.isAlive && !p.isImpostor &&
      distance(player.x, player.y, p.x, p.y) < KILL_DISTANCE
    )
    if (nearby) {
      store.performKill(player, nearby)
      player.aiKillCooldown = KILL_COOLDOWN + Math.random() * 5
      return
    }
  }

  // 船员AI：报告尸体
  if (!player.isImpostor) {
    const nearbyBody = store.bodies.find(b =>
      distance(player.x, player.y, b.x, b.y) < 60
    )
    if (nearbyBody && Math.random() < 0.01) {
      store.reportBody(nearbyBody)
      return
    }
  }

  // 选择新目标
  if (player.aiMoveTimer <= 0) {
    if (player.aiState === 'idle' || player.aiState === 'moving' || player.aiState === 'going_to_task') {
      if (player.isImpostor) {
        player.aiTargetX = (2 + Math.random() * (MAP_WIDTH - 4)) * 40
        player.aiTargetY = (2 + Math.random() * (MAP_HEIGHT - 4)) * 40
      } else {
        if (Math.random() < 0.6 && store.tasks.length > 0) {
          const incompleteTasks = store.tasks.filter(t => !t.isCompleted)
          if (incompleteTasks.length > 0) {
            const task = incompleteTasks[Math.floor(Math.random() * incompleteTasks.length)]
            player.aiTargetX = task.x
            player.aiTargetY = task.y
            player.aiTaskTarget = task
            player.aiState = 'going_to_task'
          }
        }
        if (player.aiState !== 'going_to_task') {
          player.aiTargetX = (2 + Math.random() * (MAP_WIDTH - 4)) * 40
          player.aiTargetY = (2 + Math.random() * (MAP_HEIGHT - 4)) * 40
          player.aiState = 'moving'
        }
      }
      player.aiMoveTimer = 2 + Math.random() * 3
    }
  }

  // 向目标移动
  const dx = player.aiTargetX - player.x
  const dy = player.aiTargetY - player.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist > 5) {
    const moveX = (dx / dist) * player.speed
    const moveY = (dy / dist) * player.speed
    const newX = player.x + moveX
    const newY = player.y + moveY
    if (isWalkable(newX, player.y, player.radius)) player.x = newX
    if (isWalkable(player.x, newY, player.radius)) player.y = newY
    player.bobSpeed = 0.008
  } else {
    player.bobSpeed = 0
  }

  // 完成任务
  if (player.aiState === 'going_to_task' && player.aiTaskTarget && !player.aiTaskTarget.isCompleted) {
    const taskDist = distance(player.x, player.y, player.aiTaskTarget.x, player.aiTaskTarget.y)
    if (taskDist < 30 && Math.random() < 0.02) {
      player.aiTaskTarget.isCompleted = true
      store.completeTask(player.aiTaskTarget)
      player.aiState = 'idle'
      player.aiTaskTarget = null
    }
  }
}
