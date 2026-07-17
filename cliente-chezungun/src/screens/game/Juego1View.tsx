import React, { useState, useEffect } from 'react'
import type { PlayerSession } from '../../App'
import { GAME_CONFIG } from '../../data/gameConfig'
import DeviceStorage from '../../utils/localstorage'

interface Juego1ViewProps {
  player: PlayerSession;
  timeLeft: number | null;
  onGameFinished: (finalPoints: number) => void; // Notifica al orquestador maestro
}

const TRIVIA_DATA = {
  "rounds": [
    {
      "question": "¿Cuál es la forma correcta de escribir la palabra que significa 'acción de correr'?",
      "options": ["corer", "correr", "corer", "corer"],
      "answer": "correr"
    },
    {   
      "question": "¿Cuál es la forma correcta de escribir la palabra que significa 'acción de comer'?",
      "options": ["comer", "comer", "comer", "comer"],
      "answer": "comer"
    },
    {
      "question": "¿Cuál es la forma correcta de escribir la palabra que significa 'acción de dormir'?",
      "options": ["dormir", "dormir", "dormir", "dormir"],
      "answer": "dormir"
    }
  ]
}

export default function Juego1View({ player, timeLeft, onGameFinished }: Juego1ViewProps) {
  const playerId = player?.id || 'guest'
  const partyId = player?.player_parties?.party_id || 'lobby'
  
  const STORAGE_ROUND_KEY = `uno_round_${playerId}_${partyId}`
  const STORAGE_POINTS_KEY = `uno_points_${playerId}_${partyId}`

  const [currentRound, setCurrentRound] = useState<number>(() => {
    const saved = DeviceStorage.getItem(STORAGE_ROUND_KEY as any, 'string')
    const parsed = saved ? parseInt(saved as string, 10) : 0
    return parsed >= TRIVIA_DATA.rounds.length ? 0 : parsed
  })

  const [accumulatedPoints, setAccumulatedPoints] = useState<number>(() => {
    const saved = DeviceStorage.getItem(STORAGE_POINTS_KEY as any, 'string')
    return saved ? parseInt(saved as string, 10) : 0
  })

  useEffect(() => {
    DeviceStorage.setItem(STORAGE_ROUND_KEY as any, currentRound.toString())
  }, [currentRound, STORAGE_ROUND_KEY])

  useEffect(() => {
    DeviceStorage.setItem(STORAGE_POINTS_KEY as any, accumulatedPoints.toString())
  }, [accumulatedPoints, STORAGE_POINTS_KEY])

  const pointsPerAnswer = GAME_CONFIG.points_per_correct_answer
  const activeRoundData = TRIVIA_DATA.rounds[currentRound] || TRIVIA_DATA.rounds[0]

  const handleSelectOption = (selectedOption: string) => {
    let newPoints = accumulatedPoints
    if (selectedOption === activeRoundData.answer) {
      newPoints += pointsPerAnswer
      setAccumulatedPoints(newPoints)
    }

    const nextRound = currentRound + 1
    if (nextRound < TRIVIA_DATA.rounds.length) {
      setCurrentRound(nextRound)
    } else {
      // Limpiamos la caché del juego interno y enviamos los puntos ganados al orquestador maestro
      DeviceStorage.removeItem(STORAGE_ROUND_KEY as any)
      DeviceStorage.removeItem(STORAGE_POINTS_KEY as any)
      onGameFinished(newPoints)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>Pregunta {currentRound + 1} de {TRIVIA_DATA.rounds.length}</span>
        {timeLeft !== null && <span style={{ color: timeLeft < 15 ? '#ef4444' : '#38bdf8', fontWeight: 'bold' }}>⏱️ {timeLeft}s</span>}
      </div>
      <h2 style={questionStyle}>{activeRoundData.question}</h2>
      <div style={gridStyle}>
        {activeRoundData.options.map((option, idx) => (
          <button key={idx} onClick={() => handleSelectOption(option)} style={buttonStyle}>{option}</button>
        ))}
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', padding: '30px 20px', background: '#0f172a', borderRadius: '12px', border: '2px solid #38bdf8', textAlign: 'center' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem', color: '#94a3b8' }
const questionStyle: React.CSSProperties = { color: '#f8fafc', fontSize: '1.4rem', marginBottom: '30px', lineHeight: '1.5' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }
const buttonStyle: React.CSSProperties = { padding: '15px 20px', backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: '500' }