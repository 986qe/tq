import React, { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useNavigate } from 'react-router-dom'

const GameOver: React.FC = () => {
  const { score, highScore, startGame } = useGameStore()
  const navigate = useNavigate()
  const [displayScore, setDisplayScore] = useState(0)

  // Animate score counting up
  useEffect(() => {
    if (score === 0) {
      setDisplayScore(0)
      return
    }
    
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0
    let step = 0
    
    const timer = setInterval(() => {
      step++
      current = Math.min(Math.floor(increment * step), score)
      setDisplayScore(current)
      if (step >= steps) {
        clearInterval(timer)
        setDisplayScore(score)
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [score])

  const handleRestart = () => {
    startGame()
    navigate('/game')
  }

  const handleMenu = () => {
    navigate('/')
  }

  const isNewHighScore = score === highScore && score > 0

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-bg/95 z-20">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, #ff0066 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Game Over Title */}
      <h1 className="font-orbitron text-5xl md:text-7xl font-black text-neon-pink neon-text mb-8">
        GAME OVER
      </h1>

      {/* Score Card */}
      <div className="glass-card rounded-2xl px-12 py-8 mb-8">
        {/* Current Score */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-gray-400 text-sm font-inter mb-2">本局得分</span>
          <span className="font-orbitron text-6xl text-neon-cyan neon-text">
            {displayScore}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent mb-6" />

        {/* High Score */}
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-sm font-inter mb-2">最高分</span>
          <span className="font-orbitron text-3xl text-neon-purple">
            {highScore}
          </span>
          {isNewHighScore && (
            <span className="mt-2 px-3 py-1 rounded-full bg-neon-pink/20 border border-neon-pink text-neon-pink text-xs animate-pulse">
              🎉 新纪录！
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleMenu}
          className="font-orbitron text-lg font-bold text-gray-400 border-2 border-gray-600 rounded-xl px-8 py-3 
            hover:border-gray-400 hover:text-gray-300 transition-all duration-300"
        >
          返回主页
        </button>
        <button
          onClick={handleRestart}
          className="font-orbitron text-lg font-bold text-neon-cyan border-2 border-neon-cyan rounded-xl px-8 py-3 
            hover:bg-neon-cyan/10 hover:scale-105 transition-all duration-300 animate-pulse-glow"
        >
          再来一局
        </button>
      </div>
    </div>
  )
}

export default GameOver
