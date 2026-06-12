import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'

interface MeetingScreenProps {
  onBackToGame: () => void
}

const MeetingScreen: React.FC<MeetingScreenProps> = ({ onBackToGame }) => {
  const {
    players, selectedVote, selectVote, resolveMeeting,
    meetingTimer, setPhase, phase
  } = useGameStore()
  const [voted, setVoted] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resultClass, setResultClass] = useState('')
  const timerRef = useRef(meetingTimer)

  useEffect(() => {
    timerRef.current = meetingTimer
    if (meetingTimer <= 0 && !voted && phase === 'meeting') {
      handleSubmit()
    }
  }, [meetingTimer, voted, phase])

  const handleSubmit = useCallback(() => {
    if (voted) return
    setVoted(true)
    resolveMeeting()

    // Determine result display
    const currentPlayer = players[0]
    const votes: Record<number, number> = {}
    players.forEach(player => {
      if (!player.isAlive) return
      const vote = player === currentPlayer ? selectedVote : player.voteTarget
      if (vote !== null && vote !== undefined && vote !== -2) {
        votes[vote] = (votes[vote] || 0) + 1
      }
    })

    let maxVotes = 0
    let maxTarget: number | null = null
    let isTie = false

    for (const [target, count] of Object.entries(votes)) {
      const t = parseInt(target)
      if (count > maxVotes) {
        maxVotes = count
        maxTarget = t
        isTie = false
      } else if (count === maxVotes) {
        isTie = true
      }
    }

    if (isTie || maxTarget === -1) {
      setResult('平票或跳过，无人被淘汰')
      setResultClass('skipped')
    } else {
      const eliminated = players.find(p => p.id === maxTarget)
      if (eliminated) {
        setResult(`${eliminated.name} 被淘汰！${eliminated.isImpostor ? '（内鬼）' : '（船员）'}`)
        setResultClass('eliminated')
      }
    }

    setTimeout(() => {
      if (phase === 'meeting') {
        onBackToGame()
      }
    }, 3000)
  }, [voted, selectedVote, players, resolveMeeting, phase, onBackToGame])

  return (
    <div className="meeting-screen">
      <div className="meeting-overlay">
        <div className="meeting-panel">
          <h2 className="meeting-title">紧急会议</h2>
          <div className="meeting-timer" style={{ color: meetingTimer <= 10 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
            {meetingTimer}
          </div>
          <div className="meeting-status">
            {voted ? '投票结束' : '请选择你要投票的玩家'}
          </div>

          <div className="player-list">
            {players.map(player => {
              const isSelected = selectedVote === player.id
              const isDead = !player.isAlive
              return (
                <div
                  key={player.id}
                  className={`player-item ${isDead ? 'dead' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (!isDead && !voted && player.id !== 0) {
                      selectVote(player.id)
                    }
                  }}
                >
                  <div className="player-color" style={{ background: player.color.hex }} />
                  <span className="player-name">{player.name}</span>
                  <span className={`player-status ${isDead ? 'dead' : 'alive'}`}>
                    {isDead ? '已死亡' : '存活'}
                  </span>
                </div>
              )
            })}
            <div
              className={`player-item ${selectedVote === -1 ? 'selected' : ''}`}
              onClick={() => { if (!voted) selectVote(-1) }}
            >
              <div className="player-color" style={{ background: '#666' }} />
              <span className="player-name">跳过投票</span>
            </div>
          </div>

          {!voted && (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={selectedVote === null}
            >
              提交投票
            </button>
          )}

          {result && (
            <div className={`vote-result ${resultClass}`}>{result}</div>
          )}

          {voted && (
            <button className="btn btn-secondary" onClick={onBackToGame}>
              返回游戏
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MeetingScreen
