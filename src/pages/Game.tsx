import React, { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import GameCanvas from '@/components/GameCanvas'
import StartScreen from '@/components/StartScreen'
import HUD from '@/components/HUD'
import { useNavigate } from 'react-router-dom'

const Game: React.FC = () => {
  const { isPlaying, isPaused, endGame } = useGameStore()
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      endGame()
    }
  }, [endGame])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <GameCanvas />
      {!isPlaying && <StartScreen />}
      {isPlaying && <HUD />}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 z-15">
          <div className="glass-card rounded-2xl px-12 py-8">
            <h2 className="font-orbitron text-4xl text-neon-cyan neon-text text-center mb-6">
              已暂停
            </h2>
            <p className="text-gray-400 text-center">按 ESC 继续</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
