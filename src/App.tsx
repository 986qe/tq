import React, { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import StartScreen from '@/components/StartScreen'
import GameCanvas from '@/components/GameCanvas'
import HUD from '@/components/HUD'
import MeetingScreen from '@/components/MeetingScreen'
import GameOverScreen from '@/components/GameOver'

const App: React.FC = () => {
  const { phase, startGame, resetGame, setPhase } = useGameStore()
  const [showRules, setShowRules] = useState(false)

  const handleStart = () => {
    startGame()
  }

  const handleRestart = () => {
    startGame()
  }

  const handleHome = () => {
    resetGame()
  }

  const handleBackToGame = () => {
    setPhase('playing')
  }

  return (
    <>
      {phase === 'menu' && (
        <StartScreen onStart={handleStart} onRules={() => setShowRules(true)} />
      )}

      {(phase === 'playing') && (
        <>
          <GameCanvas />
          <HUD nearTask={false} nearBody={false} nearCrew={false} />
        </>
      )}

      {phase === 'meeting' && (
        <MeetingScreen onBackToGame={handleBackToGame} />
      )}

      {phase === 'result' && (
        <GameOverScreen onRestart={handleRestart} onHome={handleHome} />
      )}

      {showRules && (
        <div className="modal" onClick={() => setShowRules(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>游戏规则</h2>
            <div className="rules-text">
              <h3>身份说明</h3>
              <p><span className="role crew">船员</span>：完成任务或找出内鬼即可获胜</p>
              <p><span className="role impostor">内鬼</span>：消灭所有船员或拖延时间即可获胜</p>
              <h3>操作说明</h3>
              <ul>
                <li><strong>WASD / 方向键</strong>：移动角色</li>
                <li><strong>E</strong>：执行任务 / 报告尸体</li>
                <li><strong>K</strong>：击杀（仅内鬼可用）</li>
              </ul>
              <h3>胜利条件</h3>
              <p><strong>船员</strong>：完成所有任务 或 投票淘汰所有内鬼</p>
              <p><strong>内鬼</strong>：内鬼数量 ≥ 船员数量 或 时间耗尽</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowRules(false)}>知道了</button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
