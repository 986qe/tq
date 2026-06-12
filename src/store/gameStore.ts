import { create } from 'zustand'
import { Player, Task, DeadBody, GameState, Role, GamePhase } from '@/types/game'
import {
  PLAYER_COLORS, SPAWN_POINTS, TASK_LOCATIONS,
  KILL_COOLDOWN, MEETING_DURATION, GAME_DURATION,
  TOTAL_TASKS, TILE_SIZE, IMPOSTOR_COUNT, PLAYER_COUNT,
  PLAYER_SPEED, PLAYER_RADIUS
} from '@/game/constants'
import { distance } from '@/game/mapData'

export interface GameStoreState extends GameState {
  setPhase: (phase: GamePhase) => void
  startGame: () => void
  resetGame: () => void
  performKill: (killer: Player, victim: Player) => void
  reportBody: (body: DeadBody) => void
  startTask: (task: Task) => void
  completeTask: (task: Task) => void
  updateTaskProgress: (progress: number) => void
  stopTask: () => void
  selectVote: (playerId: number | null) => void
  resolveMeeting: () => void
  triggerSabotage: () => void
  updateKillCooldown: (delta: number) => void
  updateKillFlash: (delta: number) => void
  setCurrentPlayer: (player: Player) => void
  aiVote: () => void
  updateGameTime: () => void
}

function createPlayer(id: number, isImpostor: boolean): Player {
  const spawn = SPAWN_POINTS[id]
  return {
    id,
    name: PLAYER_COLORS[id].name,
    color: PLAYER_COLORS[id],
    x: spawn.x * TILE_SIZE + TILE_SIZE / 2,
    y: spawn.y * TILE_SIZE + TILE_SIZE / 2,
    speed: PLAYER_SPEED,
    isAlive: true,
    isImpostor,
    radius: PLAYER_RADIUS,
    voteTarget: null,
    bobOffset: 0,
    bobSpeed: 0,
    aiTargetX: spawn.x * TILE_SIZE + TILE_SIZE / 2,
    aiTargetY: spawn.y * TILE_SIZE + TILE_SIZE / 2,
    aiMoveTimer: 0,
    aiKillCooldown: KILL_COOLDOWN + Math.random() * 5,
    aiState: 'idle',
    aiTaskTarget: null,
  }
}

function createTasks(): Task[] {
  return TASK_LOCATIONS.map((loc, i) => ({
    id: i,
    name: loc.name,
    x: loc.x * TILE_SIZE + TILE_SIZE / 2,
    y: loc.y * TILE_SIZE + TILE_SIZE / 2,
    duration: 3 + Math.random() * 2,
    isCompleted: false,
  }))
}

function getInitialState(): GameState {
  return {
    phase: 'menu',
    role: 'crewmate',
    players: [],
    currentPlayer: null,
    tasks: [],
    bodies: [],
    totalTasks: TOTAL_TASKS,
    completedTasks: 0,
    killCooldown: 0,
    meetingTimer: MEETING_DURATION,
    isAlive: true,
    sabotageActive: false,
    gameTime: GAME_DURATION,
    currentTask: null,
    taskProgress: 0,
    doingTask: false,
    selectedVote: null,
    killFlashTime: 0,
    resultWinner: null,
    resultReason: '',
  }
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...getInitialState(),

  setPhase: (phase) => set({ phase }),

  startGame: () => {
    const isImpostor = Math.random() < 0.33
    const role: Role = isImpostor ? 'impostor' : 'crewmate'

    const impostorIndices = new Set<number>()
    if (isImpostor) {
      impostorIndices.add(0)
      while (impostorIndices.size < IMPOSTOR_COUNT) {
        impostorIndices.add(1 + Math.floor(Math.random() * 5))
      }
    } else {
      while (impostorIndices.size < IMPOSTOR_COUNT) {
        impostorIndices.add(Math.floor(Math.random() * PLAYER_COUNT))
      }
    }

    const players: Player[] = []
    for (let i = 0; i < PLAYER_COUNT; i++) {
      players.push(createPlayer(i, impostorIndices.has(i)))
    }

    set({
      ...getInitialState(),
      phase: 'playing',
      role,
      players,
      currentPlayer: players[0],
      tasks: createTasks(),
    })
  },

  resetGame: () => {
    set(getInitialState())
  },

  performKill: (killer, victim) => {
    victim.isAlive = false
    const body: DeadBody = {
      x: victim.x,
      y: victim.y,
      color: victim.color,
      playerId: victim.id,
    }
    set(state => ({
      bodies: [...state.bodies, body],
      killFlashTime: 200,
      killCooldown: KILL_COOLDOWN,
      isAlive: victim === state.currentPlayer ? false : state.isAlive,
    }))
    get().checkWinCondition('kill')
  },

  reportBody: (body) => {
    set(state => {
      const bodies = state.bodies.filter(b => b !== body)
      return { bodies }
    })
    get().startMeeting()
  },

  startMeeting: () => {
    set({
      phase: 'meeting',
      meetingTimer: MEETING_DURATION,
      selectedVote: null,
    })
    get().aiVote()
  },

  startTask: (task) => {
    set({
      doingTask: true,
      currentTask: task,
      taskProgress: 0,
    })
  },

  completeTask: (task) => {
    task.isCompleted = true
    set(state => {
      const completedTasks = state.tasks.filter(t => t.isCompleted).length
      return { completedTasks }
    })
    get().checkWinCondition('tasks')
  },

  updateTaskProgress: (progress) => {
    set({ taskProgress: progress })
  },

  stopTask: () => {
    set(state => {
      const { currentTask, taskProgress } = state
      if (currentTask && taskProgress >= 1 && !state.currentPlayer?.isImpostor) {
        currentTask.isCompleted = true
        const completedTasks = state.tasks.filter(t => t.isCompleted).length
        setTimeout(() => get().checkWinCondition('tasks'), 0)
        return { doingTask: false, currentTask: null, taskProgress: 0, completedTasks }
      }
      return { doingTask: false, currentTask: null, taskProgress: 0 }
    })
  },

  selectVote: (playerId) => {
    set({ selectedVote: playerId })
  },

  aiVote: () => {
    const { players, currentPlayer } = get()
    players.forEach(player => {
      if (player === currentPlayer || !player.isAlive) return
      if (player.isImpostor) {
        const targets = players.filter(p => p.isAlive && !p.isImpostor && p !== currentPlayer)
        player.voteTarget = targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)].id : -1
      } else {
        const aliveOthers = players.filter(p => p.isAlive && p !== player && p !== currentPlayer)
        player.voteTarget = aliveOthers.length > 0 ? aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id : -1
      }
    })
  },

  resolveMeeting: () => {
    const { players, selectedVote } = get()
    const votes: Record<number, number> = {}

    players.forEach(player => {
      if (!player.isAlive) return
      const vote = player === players[0] ? selectedVote : player.voteTarget
      if (vote !== null && vote !== undefined && vote !== -2) {
        votes[vote] = (votes[vote] || 0) + 1
      }
    })

    let maxVotes = 0
    let maxTarget: number | null = null
    let isTie = false

    for (const [target, count] of Object.entries(votes)) {
      const t = parseInt(target)
      if (count > maxVotes) {
        maxVotes = count
        maxTarget = t
        isTie = false
      } else if (count === maxVotes) {
        isTie = true
      }
    }

    if (!isTie && maxTarget !== null && maxTarget !== -1) {
      const eliminated = players.find(p => p.id === maxTarget)
      if (eliminated) {
        eliminated.isAlive = false
      }
    }

    set({ selectedVote: null })
    setTimeout(() => get().checkWinCondition('vote'), 500)
  },

  triggerSabotage: () => {
    set({ sabotageActive: true })
    setTimeout(() => set({ sabotageActive: false }), 10000)
  },

  updateKillCooldown: (delta) => {
    set(state => ({
      killCooldown: Math.max(0, state.killCooldown - delta),
    }))
  },

  updateKillFlash: (delta) => {
    set(state => ({
      killFlashTime: Math.max(0, state.killFlashTime - delta),
    }))
  },

  updateGameTime: () => {
    set(state => {
      const newTime = state.gameTime - 1
      return { gameTime: newTime }
    })
  },

  setCurrentPlayer: (player) => {
    set({ currentPlayer: player })
  },

  checkWinCondition: (reason: string) => {
    const { players, tasks, completedTasks, totalTasks, gameTime } = get()
    const aliveImpostors = players.filter(p => p.isAlive && p.isImpostor).length
    const aliveCrew = players.filter(p => p.isAlive && !p.isImpostor).length
    const tasksComplete = completedTasks >= totalTasks

    let result: Role | null = null
    let reasonText = ''

    if (tasksComplete) {
      result = 'crewmate'
      reasonText = '船员完成了所有任务！'
    } else if (aliveImpostors === 0) {
      result = 'crewmate'
      reasonText = '所有内鬼已被投票淘汰！'
    } else if (aliveImpostors >= aliveCrew) {
      result = 'impostor'
      reasonText = '内鬼数量已不少于船员！'
    } else if (reason === 'time') {
      result = 'impostor'
      reasonText = '时间耗尽，氧气不足！'
    }

    if (result) {
      set({
        phase: 'result',
        resultWinner: result,
        resultReason: reasonText,
      })
    }
  },
}))
