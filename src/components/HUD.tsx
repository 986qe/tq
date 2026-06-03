import React from 'react'
import { useGameStore } from '@/store/gameStore'

const HUD: React.FC = () => {
  const { score, speed, player, isPaused, pauseGame, resumeGame } = useGameStore()

  return (
    <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start">
      {/* Score */}
      <div className="glass-card rounded-lg px-4 py-2">
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs font-inter">分数</span>
          <span className="font-orbitron text-2xl text-neon-cyan neon-text">{score}</span>
        </div>
      </div>

      {/* Speed & Status */}
      <div className="glass-card rounded-lg px-4 py-2 flex items-center gap-4">
        {/* Speed */}
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs font-inter">速度</span>
          <span className="font-orbitron text-lg text-neon-pink">{speed.toFixed(1)}x</span>
        </div>

        {/* Shield indicator */}
        {player.hasShield && (
          <div className="px-2 py-1 rounded bg-neon-cyan/20 border border-neon-cyan/50">
            <span className="text-neon-cyan text-xs">🛡️ 护盾</span>
          </div>
        )}

        {/* Magnet indicator */}
        {player.hasMagnet && (
          <div className="px-2 py-1 rounded bg-neon-purple/20 border border-neon-purple/50">
            <span className="text-neon-purple text-xs">🧲 磁铁</span>
          </div>
        )}

        {/* Pause Button */}
        <button
          onClick={isPaused ? resumeGame : pauseGame}
          className="w-10 h-10 rounded-lg bg-dark-card border border-neon-cyan/30 flex items-center justify-center hover:bg-neon-cyan/10 transition-colors"
        >
          <span className="text-neon-cyan text-lg">{isPaused ? '▶' : '⏸'}</span>
        </button>
      </div>
    </div>
  )
}

export default HUD
