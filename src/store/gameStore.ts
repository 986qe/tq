import { create } from 'zustand'
import { GameState, Player, Obstacle, Item, Particle } from '@/types/game'
import { PLAYER_X, GROUND_Y, PLAYER_WIDTH, PLAYER_HEIGHT, BASE_SPEED } from '@/game/constants'

interface GameStoreState extends GameState {
  canvasWidth: number
  canvasHeight: number
  runAnimationId: number | null
  lastObstacleTime: number
  lastItemTime: number
  setCanvasSize: (w: number, h: number) => void
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  updateGame: () => void
  setRunAnimationId: (id: number | null) => void
  addObstacle: (obstacle: Obstacle) => void
  removeObstacle: (x: number) => void
  addItem: (item: Item) => void
  collectItem: (index: number) => void
  addParticles: (particles: Particle[]) => void
  clearParticles: () => void
}

const getInitialPlayer = (canvasHeight: number): Player => ({
  x: PLAYER_X,
  y: canvasHeight * GROUND_Y - PLAYER_HEIGHT,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  velocityY: 0,
  isJumping: false,
  isSliding: false,
  hasShield: false,
  hasMagnet: false,
  magnetTimer: 0,
  shieldTimer: 0,
})

const getInitialState = (): GameStoreState => {
  const canvasHeight = 600
  return {
    isPlaying: false,
    isPaused: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('parkour_highscore') || '0'),
    speed: BASE_SPEED,
    player: getInitialPlayer(canvasHeight),
    obstacles: [],
    items: [],
    particles: [],
    canvasWidth: 800,
    canvasHeight,
    runAnimationId: null,
    lastObstacleTime: 0,
    lastItemTime: 0,
    setCanvasSize: () => {},
    startGame: () => {},
    pauseGame: () => {},
    resumeGame: () => {},
    endGame: () => {},
    updateGame: () => {},
    setRunAnimationId: () => {},
    addObstacle: () => {},
    removeObstacle: () => {},
    addItem: () => {},
    collectItem: () => {},
    addParticles: () => {},
    clearParticles: () => {},
  }
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...getInitialState(),

  setCanvasSize: (w: number, h: number) => set({ canvasWidth: w, canvasHeight: h }),

  startGame: () => {
    const { canvasHeight } = get()
    set({
      isPlaying: true,
      isPaused: false,
      score: 0,
      speed: BASE_SPEED,
      player: getInitialPlayer(canvasHeight),
      obstacles: [],
      items: [],
      particles: [],
      lastObstacleTime: 0,
      lastItemTime: 0,
    })
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  endGame: () => {
    const { score, highScore } = get()
    const newHigh = Math.max(score, highScore)
    localStorage.setItem('parkour_highscore', String(newHigh))
    set({ isPlaying: false, highScore: newHigh })
  },

  updateGame: () => {
    const state = get()
    if (!state.isPlaying || state.isPaused) return

    const groundY = state.canvasHeight * GROUND_Y - state.player.height
    let newPlayer = { ...state.player }
    newPlayer.velocityY += 0.6
    newPlayer.y += newPlayer.velocityY
    if (newPlayer.y >= groundY) {
      newPlayer.y = groundY
      newPlayer.velocityY = 0
      newPlayer.isJumping = false
    }

    let newSpeed = Math.min(state.speed + 0.001, 12)
    let newScore = state.score + Math.floor(newSpeed / 5)

    if (newPlayer.hasShield) {
      newPlayer.shieldTimer -= 1
      if (newPlayer.shieldTimer <= 0) {
        newPlayer.hasShield = false
      }
    }
    if (newPlayer.hasMagnet) {
      newPlayer.magnetTimer -= 1
      if (newPlayer.magnetTimer <= 0) {
        newPlayer.hasMagnet = false
      }
    }

    let newObstacles = state.obstacles
      .map((o: Obstacle) => ({ ...o, x: o.x - newSpeed }))
      .filter((o: Obstacle) => o.x + o.width > -50)

    let newItems = state.items
      .map((i: Item) => {
        let updated = { ...i, x: i.x - newSpeed }
        if (newPlayer.hasMagnet && !i.collected) {
          const dx = newPlayer.x - i.x
          const dy = newPlayer.y - i.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            updated.x += dx * 0.05
            updated.y += dy * 0.05
          }
        }
        return updated
      })
      .filter((i: Item) => i.x > -50 && !i.collected)

    set({
      player: newPlayer,
      speed: newSpeed,
      score: newScore,
      obstacles: newObstacles,
      items: newItems,
    })
  },

  setRunAnimationId: (id: number | null) => set({ runAnimationId: id }),

  addObstacle: (obstacle: Obstacle) => set((state) => ({
    obstacles: [...state.obstacles, obstacle]
  })),

  removeObstacle: (_x: number) => set((state) => ({
    obstacles: state.obstacles.filter((o: Obstacle) => o.x > -50)
  })),

  addItem: (item: Item) => set((state) => ({
    items: [...state.items, item]
  })),

  collectItem: (index: number) => set((state) => {
    const item = state.items[index]
    if (!item || item.collected) return state

    const newPlayer = { ...state.player }
    let newScore = state.score + item.value

    switch (item.type) {
      case 'shield':
        newPlayer.hasShield = true
        newPlayer.shieldTimer = 600
        break
      case 'magnet':
        newPlayer.hasMagnet = true
        newPlayer.magnetTimer = 400
        break
    }

    const newItems = state.items.map((i: Item, idx: number) =>
      idx === index ? { ...i, collected: true } : i
    )

    return {
      player: newPlayer,
      score: newScore,
      items: newItems,
    }
  }),

  addParticles: (particles: Particle[]) => set((state) => ({
    particles: [...state.particles, ...particles]
  })),

  clearParticles: () => set({ particles: [] }),
}))
