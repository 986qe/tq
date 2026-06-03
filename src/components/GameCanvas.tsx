import React, { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { drawBackground, drawPlayer, drawObstacle, drawItem, drawParticles } from '@/game/renderer'
import { spawnObstacle, spawnItem, createParticles, updateParticles, shouldSpawnObstacle, shouldSpawnItem } from '@/game/engine'
import { checkObstacleCollision, checkItemCollection } from '@/game/collision'
import { jump, startSlide, endSlide } from '@/game/physics'

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const frameCountRef = useRef(0)
  
  const {
    isPlaying, isPaused, player, obstacles, items, particles, score,
    canvasWidth, canvasHeight, setCanvasSize, updateGame, endGame,
    startGame, addObstacle, addItem, collectItem, addParticles, clearParticles,
    setRunAnimationId
  } = useGameStore()

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w
    canvas.height = h
    setCanvasSize(w, h)
  }, [setCanvasSize])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frameCountRef.current++
    const frame = frameCountRef.current

    // Update game state
    updateGame()

    const state = useGameStore.getState()
    
    if (!state.isPlaying) return

    // Spawn obstacles
    if (shouldSpawnObstacle(frame) && frame - state.lastObstacleTime > 30) {
      addObstacle(spawnObstacle(state.canvasWidth, state.canvasHeight))
      useGameStore.setState({ lastObstacleTime: frame })
    }

    // Spawn items
    if (shouldSpawnItem(frame) && frame - state.lastItemTime > 40) {
      addItem(spawnItem(state.canvasWidth, state.canvasHeight))
      useGameStore.setState({ lastItemTime: frame })
    }

    // Check collisions
    const currentState = useGameStore.getState()
    
    // Obstacle collision
    for (let i = 0; i < currentState.obstacles.length; i++) {
      if (checkObstacleCollision(currentState.player, currentState.obstacles[i])) {
        if (currentState.player.hasShield) {
          // Shield absorbs hit
          const shieldParticles = createParticles(
            currentState.player.x + currentState.player.width / 2,
            currentState.player.y + currentState.player.height / 2,
            '#00f5ff',
            20
          )
          addParticles(shieldParticles)
          useGameStore.setState({
            player: { ...currentState.player, hasShield: false, shieldTimer: 0 },
            obstacles: currentState.obstacles.filter((_, idx) => idx !== i)
          })
        } else {
          // Game over
          const deathParticles = createParticles(
            currentState.player.x + currentState.player.width / 2,
            currentState.player.y + currentState.player.height / 2,
            '#ff0066',
            30
          )
          addParticles(deathParticles)
          endGame()
          return
        }
        break
      }
    }

    // Item collection
    const itemState = useGameStore.getState()
    itemState.items.forEach((item, index) => {
      if (!item.collected && checkItemCollection(itemState.player, item)) {
        collectItem(index)
        const colors: Record<string, string> = { energy: '#ffdd00', shield: '#00ff88', magnet: '#8b5cf6' }
        const collectParticles = createParticles(item.x + 15, item.y + 15, colors[item.type], 10)
        addParticles(collectParticles)
      }
    })

    // Update particles
    const particleState = useGameStore.getState()
    const updatedParticles = updateParticles(particleState.particles)
    useGameStore.setState({ particles: updatedParticles })

    // Render
    const renderState = useGameStore.getState()
    drawBackground(ctx, canvas.width, canvas.height, frame * renderState.speed)
    
    renderState.obstacles.forEach(obstacle => drawObstacle(ctx, obstacle))
    renderState.items.forEach(item => {
      if (!item.collected) drawItem(ctx, item)
    })
    drawPlayer(ctx, renderState.player)
    drawParticles(ctx, renderState.particles)

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, addObstacle, addItem, collectItem, addParticles, endGame])

  // Start/stop game loop
  useEffect(() => {
    if (isPlaying && !isPaused) {
      frameCountRef.current = 0
      gameLoopRef.current = requestAnimationFrame(gameLoop)
      setRunAnimationId(gameLoopRef.current)
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [isPlaying, isPaused, gameLoop, setRunAnimationId])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        const state = useGameStore.getState()
        if (state.isPlaying && !state.isPaused) {
          useGameStore.setState({ player: jump(state.player) })
        }
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        const state = useGameStore.getState()
        if (state.isPlaying && !state.isPaused) {
          useGameStore.setState({ player: startSlide(state.player) })
          setTimeout(() => {
            const slideState = useGameStore.getState()
            if (slideState.player.isSliding) {
              useGameStore.setState({ player: endSlide(slideState.player) })
            }
          }, 500)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let touchStartY = 0
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchEndY - touchStartY
      const state = useGameStore.getState()
      
      if (!state.isPlaying || state.isPaused) return

      if (deltaY > 50) {
        // Swipe down = slide
        useGameStore.setState({ player: startSlide(state.player) })
        setTimeout(() => {
          const slideState = useGameStore.getState()
          if (slideState.player.isSliding) {
            useGameStore.setState({ player: endSlide(slideState.player) })
          }
        }, 500)
      } else {
        // Tap or swipe up = jump
        useGameStore.setState({ player: jump(state.player) })
      }
    }

    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchend', handleTouchEnd)
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  )
}

export default GameCanvas
