import React, { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import GameOver from '@/components/GameOver'

const GameOverPage: React.FC = () => {
  const { endGame } = useGameStore()

  useEffect(() => {
    endGame()
  }, [endGame])

  return (
    <div className="relative w-full h-full overflow-hidden bg-dark-bg">
      <GameOver />
    </div>
  )
}

export default GameOverPage
