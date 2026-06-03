import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Game from '@/pages/Game'
import GameOverPage from '@/pages/GameOver'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/gameover" element={<GameOverPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
