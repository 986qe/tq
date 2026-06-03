import React, { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useNavigate } from 'react-router-dom'

const StartScreen: React.FC = () => {
  const { startGame, highScore } = useGameStore()
  const navigate = useNavigate()
  const [titleVisible, setTitleVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100)
  }, [])

  const handleStart = () => {
    startGame()
    navigate('/game')
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-bg/90 z-10">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(0, 245, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Title */}
      <div className={`transition-all duration-1000 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <h1 className="font-orbitron text-6xl md:text-8xl font-black text-neon-cyan neon-text mb-4 tracking-wider">
          NEON
        </h1>
        <h1 className="font-orbitron text-6xl md:text-8xl font-black text-neon-pink neon-text tracking-wider">
          PARKOUR
        </h1>
      </div>

      {/* Subtitle */}
      <p className={`font-inter text-gray-400 text-lg mt-4 transition-all duration-1000 delay-300 ${titleVisible ? 'opacity-100' : 'opacity-0'}`}>
        霓虹跑酷 · 赛博朋克风格跑酷游戏
      </p>

      {/* High Score */}
      <div className={`mt-8 glass-card rounded-xl px-8 py-4 transition-all duration-1000 delay-500 ${titleVisible ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-gray-400 text-sm">最高分</p>
        <p className="font-orbitron text-3xl text-neon-purple neon-text text-center">{highScore}</p>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className={`mt-10 font-orbitron text-xl font-bold text-neon-cyan border-2 border-neon-cyan rounded-xl px-12 py-4 
          hover:bg-neon-cyan/10 hover:scale-105 transition-all duration-300 animate-pulse-glow
          ${titleVisible ? 'opacity-100' : 'opacity-0'}
        `}
      >
        开始游戏
      </button>

      {/* Controls */}
      <div className={`mt-12 glass-card rounded-xl p-6 transition-all duration-1000 delay-700 ${titleVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h3 className="font-orbitron text-neon-cyan text-sm mb-4 text-center">操作说明</h3>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-dark-card border border-neon-cyan/30 flex items-center justify-center mb-2">
              <span className="text-neon-cyan text-xl">↑</span>
            </div>
            <span className="text-gray-400 text-xs">空格/上箭头 跳跃</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-dark-card border border-neon-pink/30 flex items-center justify-center mb-2">
              <span className="text-neon-pink text-xl">↓</span>
            </div>
            <span className="text-gray-400 text-xs">下箭头 滑铲</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-3 text-center">移动端：点击跳跃，下滑滑铲</p>
      </div>
    </div>
  )
}

export default StartScreen
