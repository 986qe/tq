import React from 'react'
import { useGameStore } from '@/store/gameStore'

interface HUDProps {
  nearTask: boolean
  nearBody: boolean
  nearCrew: boolean
}

const HUD: React.FC<HUDProps> = ({ nearTask, nearBody, nearCrew }) => {
  const { role, completedTasks, totalTasks, killCooldown, sabotageActive } = useGameStore()
  const taskPct = (completedTasks / totalTasks) * 100
  const isImpostor = role === 'impostor'

  return (
    <div className="hud">
      <div className="task-bar">
        <div className="task-label">任务进度</div>
        <div className="task-progress">
          <div className="task-fill" style={{ width: `${taskPct}%` }} />
        </div>
        <span className="task-count">{completedTasks}/{totalTasks}</span>
      </div>

      <div className={`role-badge ${role}`}>
        {isImpostor ? '内鬼' : '船员'}
      </div>

      {isImpostor && (
        <div className="kill-cooldown">
          <div className="cd-label">击杀冷却</div>
          <div className={`cd-timer ${killCooldown <= 0 ? 'ready' : ''}`}>
            {killCooldown <= 0 ? 'READY' : Math.ceil(killCooldown)}
          </div>
        </div>
      )}

      {nearBody && <div className="interaction-hint">按 E 报告尸体</div>}
      {nearTask && <div className="interaction-hint">按 E {isImpostor ? '假装' : ''}执行任务</div>}
      {nearCrew && isImpostor && killCooldown <= 0 && <div className="kill-hint">按 K 击杀</div>}

      {sabotageActive && <div className="sabotage-alert">⚠ 氧气泄漏警报 ⚠</div>}
    </div>
  )
}

export default HUD
