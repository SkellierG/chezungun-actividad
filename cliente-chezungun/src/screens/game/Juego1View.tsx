import React, { useState, useEffect } from 'react'
import { GAME_CONFIG } from '../../data/gameConfig'
import DeviceStorage from '../../utils/localstorage'
import { JUEGO1_ROUNDS } from '../../data/juego1Config' // 📦 Importación de la nueva configuración

interface Juego1ViewProps {
  player: any
  timeLeft: number | null
  onPointsUpdate?: (points: number) => void
  onGameFinished: (finalPoints: number) => void
}

export default function Juego1View({ player, timeLeft, onPointsUpdate, onGameFinished }: Juego1ViewProps) {
  const playerId = player?.id || 'guest'
  const partyId = player?.player_parties?.party_id || 'lobby'
  
  const STORAGE_ROUND_KEY = `uno_round_${playerId}_${partyId}`
  const STORAGE_POINTS_KEY = `uno_points_${playerId}_${partyId}`

  // Inicialización síncrona evaluando los límites del nuevo archivo de configuración
  const [currentRound, setCurrentRound] = useState<number>(() => {
    const saved = DeviceStorage.getItem(STORAGE_ROUND_KEY as any, 'string')
    const parsed = saved ? parseInt(saved as string, 10) : 0
    return parsed >= JUEGO1_ROUNDS.length ? 0 : parsed
  })

  const [accumulatedPoints, setAccumulatedPoints] = useState<number>(() => {
    const saved = DeviceStorage.getItem(STORAGE_POINTS_KEY as any, 'string')
    return saved ? parseInt(saved as string, 10) : 0
  })

  // Sincronizar puntos en caché con el orquestador padre al montar
  useEffect(() => {
    if (onPointsUpdate) {
      onPointsUpdate(accumulatedPoints)
    }
  }, [])

  useEffect(() => {
    DeviceStorage.setItem(STORAGE_ROUND_KEY as any, currentRound.toString())
  }, [currentRound, STORAGE_ROUND_KEY])

  useEffect(() => {
    DeviceStorage.setItem(STORAGE_POINTS_KEY as any, accumulatedPoints.toString())
  }, [accumulatedPoints, STORAGE_POINTS_KEY])

  const pointsPerAnswer = GAME_CONFIG.points_per_correct_answer
  const activeRoundData = JUEGO1_ROUNDS[currentRound] || JUEGO1_ROUNDS[0]

  const handleSelectOption = (idxSelected: number) => {
    let newPoints = accumulatedPoints
    
    // Validación por índice numérico según tu nueva interfaz TriviaRound
    if (idxSelected === activeRoundData.answer) {
      newPoints += pointsPerAnswer
      setAccumulatedPoints(newPoints)
      
      if (onPointsUpdate) {
        onPointsUpdate(newPoints)
      }
    }

    const nextRound = currentRound + 1
    if (nextRound < JUEGO1_ROUNDS.length) {
      setCurrentRound(nextRound)
    } else {
      // Limpieza de estados internos locales de este minijuego antes de la distribución masiva
      DeviceStorage.removeItem(STORAGE_ROUND_KEY as any)
      DeviceStorage.removeItem(STORAGE_POINTS_KEY as any)
      onGameFinished(newPoints)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>Pregunta {currentRound + 1} de {JUEGO1_ROUNDS.length}</span>
        {timeLeft !== null && (
          <span style={{ color: timeLeft < 15 ? '#ef4444' : '#38bdf8', fontWeight: 'bold' }}>
            ⏱️ {timeLeft}s
          </span>
        )}
      </div>
      <h2 style={questionStyle}>{activeRoundData.question}</h2>
      <div style={gridStyle}>
        {activeRoundData.options.map((option, idx) => (
          <button 
            key={idx} 
            onClick={() => handleSelectOption(idx)} 
            style={buttonStyle}
          >
            {option}
          </button>
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