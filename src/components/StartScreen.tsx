import React from 'react'

interface StartScreenProps {
  onStart: () => void
  onRules: () => void
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onRules }) => {
  return (
    <div className="start-screen">
      <div className="stars-bg" />
      <div className="alert-light" />
      <div className="menu-content">
        <div className="title-container">
          <h1 className="game-title">太空狼人杀</h1>
          <div className="subtitle">SPACE WEREWOLF</div>
          <div className="divider" />
        </div>
        <p className="tagline">"当整个飞船只剩下最后一次投票，真正的内鬼，也许就在你身边。"</p>
        <div className="menu-buttons">
          <button className="btn btn-primary" onClick={onStart}>开始游戏</button>
          <button className="btn btn-secondary" onClick={onRules}>规则说明</button>
        </div>
      </div>
    </div>
  )
}

export default StartScreen
