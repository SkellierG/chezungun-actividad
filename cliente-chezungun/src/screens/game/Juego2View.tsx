import React, { useState, useRef, useEffect } from 'react'
import { JUEGO2_ROUNDS } from '../../data/juego2Config'
import { GAME_CONFIG } from '../../data/gameConfig'
import type { PlayerSession } from '../../App'
import DeviceStorage from '../../utils/localstorage'

interface Juego2ViewProps {
  player: any
  timeLeft: number | null
  onPointsUpdate?: (points: number) => void // <--- Aceptada correctamente
  onGameFinished: (finalPoints: number) => void
}

const HUILLICHE_DIRECTIONS = [
  { name: 'Puel', minAngle: 337.5, maxAngle: 22.5 },
  { name: 'Willi Puel', minAngle: 22.5, maxAngle: 67.5 },
  { name: 'Willi', minAngle: 67.5, maxAngle: 112.5 },
  { name: 'Willi Lafken', minAngle: 112.5, maxAngle: 157.5 },
  { name: 'Lafken', minAngle: 157.5, maxAngle: 202.5 },
  { name: 'Pikun Lafken', minAngle: 202.5, maxAngle: 247.5 },
  { name: 'Pikun', minAngle: 247.5, maxAngle: 292.5 },
  { name: 'Pikun Puel', minAngle: 292.5, maxAngle: 337.5 },
]

export default function Juego2View({ player, timeLeft, onPointsUpdate, onGameFinished }: Juego2ViewProps) {
  const playerId = player?.id || 'guest'
  const partyId = player?.player_parties?.party_id || 'lobby'

  const STORAGE_ROUND_KEY = `dos_round_${playerId}_${partyId}`
  const STORAGE_POINTS_KEY = `dos_points_${playerId}_${partyId}`

  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(() => {
    const saved = DeviceStorage.getItem(STORAGE_ROUND_KEY as any, 'string')
    const parsed = saved ? parseInt(saved as string, 10) : 0
    return parsed >= JUEGO2_ROUNDS.length ? 0 : parsed
  })

  const [accumulatedPoints, setAccumulatedPoints] = useState<number>(() => {
    const saved = DeviceStorage.getItem(STORAGE_POINTS_KEY as any, 'string')
    return saved ? parseInt(saved as string, 10) : 0
  })

  const [angle, setAngle] = useState(0)
  const [currentDir, setCurrentDir] = useState('Puel')
  const [isRotating, setIsRotating] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const compassRef = useRef<HTMLDivElement>(null)
  const currentRound = JUEGO2_ROUNDS[currentRoundIndex] || JUEGO2_ROUNDS[0]

  // Sincronizar estado inicial de puntos con el padre para evitar pérdidas en un refresco
  useEffect(() => {
    if (onPointsUpdate) {
      onPointsUpdate(accumulatedPoints)
    }
  }, [])

  useEffect(() => {
    DeviceStorage.setItem(STORAGE_ROUND_KEY as any, currentRoundIndex.toString())
  }, [currentRoundIndex, STORAGE_ROUND_KEY])

  useEffect(() => {
    DeviceStorage.setItem(STORAGE_POINTS_KEY as any, accumulatedPoints.toString())
  }, [accumulatedPoints, STORAGE_POINTS_KEY])

  const pointsPerAnswer = GAME_CONFIG.points_per_correct_answer

  const getHuillicheDirection = (deg: number): string => {
    const normalized = (deg % 360 + 360) % 360
    for (const dir of HUILLICHE_DIRECTIONS) {
      if (dir.minAngle > dir.maxAngle) {
        if (normalized >= dir.minAngle || normalized < dir.maxAngle) return dir.name
      } else {
        if (normalized >= dir.minAngle && normalized < dir.maxAngle) return dir.name
      }
    }
    return 'Puel (Este)'
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!compassRef.current) return
    const rect = compassRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dx = clientX - (rect.left + rect.width / 2)
    const dy = clientY - (rect.top + rect.height / 2)
    let correctedDeg = (Math.atan2(dy, dx) * (180 / Math.PI) + 90 + 360) % 360

    setAngle(Math.round(correctedDeg))
    setCurrentDir(getHuillicheDirection(correctedDeg))
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (isRotating) handleMove(e.clientX, e.clientY) }
    const onTouchMove = (e: TouchEvent) => { if (isRotating && e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY) }
    const stopRotation = () => setIsRotating(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stopRotation)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', stopRotation)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stopRotation)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', stopRotation)
    }
  }, [isRotating])

  const handleCheckDirection = () => {
    if (currentDir === currentRound.targetDirection) {
      const newPoints = accumulatedPoints + pointsPerAnswer
      setAccumulatedPoints(newPoints)
      setStatusMsg(`¡Feyentun! (¡Correcto!) +${pointsPerAnswer} pts`)

      // Notificamos inmediatamente al padre para asegurar el guardado dinámico
      if (onPointsUpdate) {
        onPointsUpdate(newPoints)
      }

      const nextRound = currentRoundIndex + 1

      if (nextRound < JUEGO2_ROUNDS.length) {
        setTimeout(() => { setCurrentRoundIndex(nextRound); setStatusMsg('') }, 1200)
      } else {
        setTimeout(() => {
          // Limpiamos caché interna de la brújula y disparamos la distribución en el padre
          DeviceStorage.removeItem(STORAGE_ROUND_KEY as any)
          DeviceStorage.removeItem(STORAGE_POINTS_KEY as any)
          onGameFinished(newPoints)
        }, 1200)
      }
    } else {
      setStatusMsg(`Esa dirección no es correcta. Estás apuntando a ${currentDir}.`)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>Rumbo {currentRoundIndex + 1} de {JUEGO2_ROUNDS.length}</span>
        {timeLeft !== null && <span style={{ color: timeLeft < 15 ? '#ef4444' : '#38bdf8', fontWeight: 'bold' }}>⏱️ {timeLeft}s</span>}
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#f59e0b', fontSize: '1.2rem' }}>{currentRound?.question}</h3>
      </div>

      <div style={{ position: 'relative', width: '230px', height: '250px', margin: '20px auto', userSelect: 'none' }}>
        <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.8rem', fontWeight: 'bold', color: '#ef4444', pointerEvents: 'none', zIndex: 5 }}>PUEL</div>
        <div style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff', pointerEvents: 'none', zIndex: 5 }}>LAFKEN</div>
        <div style={{ position: 'absolute', left: '5px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff', pointerEvents: 'none', zIndex: 5 }}>PIKUN</div>
        <div style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff', pointerEvents: 'none', zIndex: 5 }}>WILLI</div>

        <div
          ref={compassRef}
          onMouseDown={(e) => { e.preventDefault(); setIsRotating(true) }}
          onTouchStart={() => setIsRotating(true)}
          style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'radial-gradient(circle, #0f172a 40%, #1e293b 100%)', border: '8px solid #475569', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ position: 'absolute', width: '12px', height: '80%', transform: `rotate(${angle}deg)`, display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
            <div style={{ flex: 1, backgroundColor: '#ef4444', borderRadius: '6px 6px 0 0' }} />
            <div style={{ flex: 1, backgroundColor: '#cbd5e1', borderRadius: '0 0 6px 6px' }} />
          </div>
          <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: '#f8fafc', border: '4px solid #1e293b', zIndex: 10, pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ margin: '10px 0' }}>
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Apuntando a: </span>
        <strong style={{ color: '#38bdf8', fontSize: '1.1rem', display: 'block' }}>{currentDir} ({angle}°)</strong>
      </div>

      {statusMsg && <p style={{ color: statusMsg.includes('Feyentun') ? '#4ade80' : '#fca5a5', fontWeight: 'bold', fontSize: '0.9rem' }}>{statusMsg}</p>}

      <button onClick={handleCheckDirection} style={confirmButtonStyle}>Feyentun (Confirmar Dirección)</button>
    </div>
  )
}

const containerStyle: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', padding: '30px 20px', background: '#0f172a', borderRadius: '12px', border: '2px solid #38bdf8', textAlign: 'center' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem', color: '#94a3b8' }
const confirmButtonStyle: React.CSSProperties = { marginTop: '10px', width: '100%', padding: '12px 20px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }