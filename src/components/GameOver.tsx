import React from 'react'
import { useGameStore } from '@/store/gameStore'

interface GameOverScreenProps {
  onRestart: () => void
  onHome: () => void
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart, onHome }) => {
  const { resultWinner, resultReason, role } = useGameStore()
  const isVictory = resultWinner === role

  return (
    <div className="result-screen">
      <div className="result-content">
        <h2 className={`result-title ${isVictory ? 'victory' : 'defeat'}`}>
          {isVictory ? '胜利！' : '失败！'}
        </h2>
        <div className="result-icon">{isVictory ? '🏆' : '💀'}</div>
        <p className="result-reason">{resultReason}</p>
        <div className="result-buttons">
          <button className="btn btn-primary" onClick={onRestart}>再来一局</button>
          <button className="btn btn-secondary" onClick={onHome}>返回主页</button>
        </div>
      </div>
    </div>
  )
}

export default GameOverScreen
