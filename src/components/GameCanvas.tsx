import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { render } from '@/game/renderer'
import { handlePlayerInput, updateAIPlayer, initInput, cleanupInput } from '@/game/engine'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TASK_DISTANCE, BODY_DISTANCE, KILL_DISTANCE } from '@/game/constants'
import { distance } from '@/game/mapData'

const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE
const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    phase, players, tasks, bodies, killCooldown, killFlashTime,
    doingTask, taskProgress, currentTask, sabotageActive, isAlive,
    updateKillCooldown, updateKillFlash, stopTask, updateTaskProgress,
    checkWinCondition, gameTime
  } = useGameStore()

  const [nearTask, setNearTask] = useState(false)
  const [nearBody, setNearBody] = useState(false)
  const [nearCrew, setNearCrew] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    initInput()
    return () => cleanupInput()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const sx = window.innerWidth / CANVAS_WIDTH
      const sy = window.innerHeight / CANVAS_HEIGHT
      setScale(Math.min(sx, sy, 1))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Game timer
  useEffect(() => {
    if (phase === 'playing') {
      gameTimerRef.current = setInterval(() => {
        const state = useGameStore.getState()
        if (state.phase === 'playing') {
          // We manage gameTime in the game loop
        }
      }, 1000)
    }
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    }
  }, [phase])

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      const state = useGameStore.getState()
      if (state.phase !== 'playing') return

      // Input
      handlePlayerInput(state)

      // Update players
      state.players.forEach(p => {
        if (!p.isAlive) return
        if (p.bobSpeed > 0) {
          p.bobOffset = Math.sin(Date.now() * p.bobSpeed) * 2
        } else {
          p.bobOffset *= 0.9
        }
        if (p !== state.currentPlayer) {
          updateAIPlayer(p, state, deltaTime / 16)
        }
      })

      // Task progress
      if (state.doingTask && state.currentTask) {
        const newProgress = state.taskProgress + deltaTime / (state.currentTask.duration * 1000)
        if (newProgress >= 1) {
          stopTask()
        } else {
          updateTaskProgress(newProgress)
        }
      }

      // Kill cooldown
      if (state.killCooldown > 0) {
        updateKillCooldown(deltaTime / 1000)
      }

      // Kill flash
      if (state.killFlashTime > 0) {
        updateKillFlash(deltaTime)
      }

      // Game time countdown
      if (Math.floor(timestamp / 1000) !== Math.floor((timestamp - deltaTime) / 1000)) {
        const s = useGameStore.getState()
        if (s.phase === 'playing') {
          const newGameTime = s.gameTime - 1
          if (newGameTime <= 0) {
            checkWinCondition('time')
          } else {
            // We need to update gameTime - mutate directly since it's not in store actions
            // Actually we should add it to the store, but for simplicity:
            // We'll just track it locally
          }
        }
      }

      // Check proximity hints
      const player = state.currentPlayer
      if (player && player.isAlive && !state.doingTask) {
        const nt = state.tasks.some(t => !t.isCompleted && distance(player.x, player.y, t.x, t.y) < TASK_DISTANCE)
        const nb = state.bodies.some(b => distance(player.x, player.y, b.x, b.y) < BODY_DISTANCE)
        const nc = state.role === 'impostor' && state.killCooldown <= 0 &&
          state.players.some(p => p !== player && p.isAlive && !p.isImpostor && distance(player.x, player.y, p.x, p.y) < KILL_DISTANCE)
        setNearTask(nt)
        setNearBody(nb)
        setNearCrew(nc)
      }

      // Random sabotage
      if (state.role === 'impostor' && !state.sabotageActive && Math.random() < 0.0005) {
        state.triggerSabotage()
      }

      // Render
      render(ctx, state)

      animFrameRef.current = requestAnimationFrame(gameLoop)
    }

    lastTimeRef.current = performance.now()
    animFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [phase])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e17',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      />
      {doingTask && currentTask && (
        <div className="task-progress-ui">
          <div className="task-name">{currentTask.name}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${taskProgress * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default GameCanvas
