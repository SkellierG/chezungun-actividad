import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import type { PlayerSession } from '../App'
import FloatingScoreboard from '../components/FLoatingScoreboard'
import DeviceStorage from '../utils/localstorage'

// 🎮 Importaciones Modulares de Juegos
import Juego1View from './game/Juego1View'
import Juego2View from './game/Juego2View'
import Juego3View from './game/Juego3View'
import TimeUpWaitingView from './game/TimeUpWaitingView'
import PointDistributionView from './game/PointDistributionView'

interface PartyGameScreenProps {
  player: PlayerSession
  setPlayer: React.Dispatch<React.SetStateAction<PlayerSession | null>>
}

const ROLE_LABELS: Record<string, string> = {
  jugador: 'Jugador Normal',
  lider: 'Líder de Equipo',
  fraile: 'Fraile',
  diplomatico: 'Diplomático'
}

export default function PartyGameScreen({ player, setPlayer }: PartyGameScreenProps) {
  const activeParty = player.player_parties
  const roomCode = activeParty?.parties?.code || '---'
  const rawRole = activeParty?.role || 'jugador'
  const roleLabel = ROLE_LABELS[rawRole] || rawRole
  const individualScore = activeParty?.individual_score ?? 0
  const teamName = activeParty?.teams?.name || 'Ninguno (Sin Grupo)'
  const teamScore = activeParty?.teams?.score ?? 0
  const teamColor = (activeParty?.teams as any)?.color || '#3b82f6'
  
  const gameStage = (activeParty?.parties as any)?.game_stage || 'intermedio_1'
  const serverDuration = (activeParty?.parties as any)?.game_duration_seconds 
  const stageStartedAt = (activeParty?.parties as any)?.stage_started_at 

  const storageTimerKey = `chezungun_piano_timer_${activeParty?.party_id}`
  
  // 🔑 Claves persistentes controladas por el Orquestador Maestro
  const STORAGE_STATE_KEY = `orchestrator_state_${player.id}_${activeParty?.party_id}`
  const STORAGE_POINTS_KEY = `orchestrator_points_${player.id}_${activeParty?.party_id}`
  const STORAGE_PREFIX_KEY = `orchestrator_prefix_${player.id}_${activeParty?.party_id}`

  // Estados para controlar la Distribución unificada desde el Padre
  const [distributionState, setDistributionState] = useState<'playing' | 'distributing' | 'success'>(() => {
    const saved = DeviceStorage.getItem(STORAGE_STATE_KEY as any, 'string')
    if (activeParty?.game_status === 'finished') return 'success'
    if (saved === 'distributing') return 'distributing'
    return 'playing'
  })

  const [pointsToDistribute, setPointsToDistribute] = useState<number>(() => {
    const savedPoints = DeviceStorage.getItem(STORAGE_POINTS_KEY as any, 'string')
    return savedPoints ? parseInt(savedPoints as string, 10) : 0
  })

  const [sliderPrefix, setSliderPrefix] = useState<string>(() => {
    const savedPrefix = DeviceStorage.getItem(STORAGE_PREFIX_KEY as any, 'string')
    return (savedPrefix as string) || 'generic'
  })

  const calculateRemainingTime = (): { remaining: number | null; expired: boolean } => {
    if (!activeParty?.party_id || !gameStage.startsWith('juego_')) {
      return { remaining: null, expired: false }
    }

    const cache = DeviceStorage.getItem(storageTimerKey as any, 'object') as any
    const isCacheValidForThisStage = cache && cache.game_stage === gameStage

    if ((activeParty as any).game_status === 'finished' && isCacheValidForThisStage) {
      return { remaining: 0, expired: true }
    }

    if (serverDuration === null || serverDuration === undefined) {
      return { remaining: null, expired: false }
    }

    if (stageStartedAt) {
      const startTime = new Date(stageStartedAt).getTime()
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = serverDuration - elapsed
      
      if (remaining <= 0) return { remaining: 0, expired: true }
      return { remaining, expired: false }
    }

    if (isCacheValidForThisStage) {
      if (cache.screen_should_show === 'finished') return { remaining: 0, expired: true }
      const elapsed = Math.floor((Date.now() - cache.phase_start_time) / 1000)
      const remaining = cache.duration - elapsed
      return { remaining: remaining > 0 ? remaining : 0, expired: remaining <= 0 }
    }

    return { remaining: serverDuration, expired: false }
  }

  const [isTimeUp, setIsTimeUp] = useState<boolean>(() => calculateRemainingTime().expired)
  const [timeLeft, setTimeLeft] = useState<number | null>(() => calculateRemainingTime().remaining)
  const [prevStage, setPrevGameStage] = useState<string>(gameStage)

  if (gameStage !== prevStage) {
    setPrevGameStage(gameStage)
    const { remaining, expired } = calculateRemainingTime()
    setTimeLeft(remaining)
    setIsTimeUp(expired)
    
    // Si cambia el juego desde el admin, reseteamos el estado de distribución local
    DeviceStorage.removeItem(STORAGE_STATE_KEY as any)
    DeviceStorage.removeItem(STORAGE_POINTS_KEY as any)
    DeviceStorage.removeItem(STORAGE_PREFIX_KEY as any)
    setDistributionState('playing')
    setPointsToDistribute(0)
  }

  // Persistir cambios de distribución inmediatamente para blindar contra refrescos
  useEffect(() => {
    DeviceStorage.setItem(STORAGE_STATE_KEY as any, distributionState)
  }, [distributionState, STORAGE_STATE_KEY])

  useEffect(() => {
    DeviceStorage.setItem(STORAGE_POINTS_KEY as any, pointsToDistribute.toString())
  }, [pointsToDistribute, STORAGE_POINTS_KEY])

  useEffect(() => {
    DeviceStorage.setItem(STORAGE_PREFIX_KEY as any, sliderPrefix)
  }, [sliderPrefix, STORAGE_PREFIX_KEY])


  useEffect(() => {
    if (!activeParty?.party_id) return

    if (gameStage.startsWith('intermedio_') || serverDuration === null || serverDuration === undefined) {
      DeviceStorage.removeItem(storageTimerKey as any)
      if ((activeParty as any).game_status !== 'waiting') {
        supabase.from('player_parties').update({ game_status: 'waiting' }).eq('player_id', player.id).then()
      }
      return
    }

    if (gameStage.startsWith('juego_')) {
      let timerInterval: any = null
      let cache = DeviceStorage.getItem(storageTimerKey as any, 'object') as any
      const serverStartTime = stageStartedAt ? new Date(stageStartedAt).getTime() : null

      if (!cache || cache.game_stage !== gameStage) {
        cache = {
          phase_start_time: serverStartTime || Date.now(),
          duration: serverDuration,
          game_stage: gameStage,
          screen_should_show: 'active_game'
        }
        DeviceStorage.setItem(storageTimerKey as any, cache)
        supabase.from('player_parties').update({ game_status: 'playing' }).eq('player_id', player.id).then()
      }

      const initialCheck = calculateRemainingTime()
      if (initialCheck.expired && cache.screen_should_show === 'finished') {
        setTimeLeft(0)
        setIsTimeUp(true)
        return
      }

      const startTime = serverStartTime || cache.phase_start_time
      const duration = cache.duration

      const runTickCalculations = () => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
        const remaining = duration - elapsedSeconds

        if (remaining <= 0) {
          setTimeLeft(0)
          setIsTimeUp(true)

          DeviceStorage.setItem(storageTimerKey as any, {
            phase_start_time: startTime,
            duration: duration,
            game_stage: gameStage,
            screen_should_show: 'finished'
          })

          // El tiempo expiró, enviamos al usuario a distribuir lo que haya alcanzado a acumular
          setDistributionState((current) => {
            if (current === 'playing') return 'distributing'
            return current
          })

          return true
        } else {
          setTimeLeft(remaining)
          setIsTimeUp(false)
          return false
        }
      }

      const isAlreadyCompleted = runTickCalculations()
      if (isAlreadyCompleted) return

      timerInterval = setInterval(() => {
        const stop = runTickCalculations()
        if (stop) clearInterval(timerInterval)
      }, 1000)

      return () => {
        if (timerInterval) clearInterval(timerInterval)
      }
    }
  }, [gameStage, serverDuration, stageStartedAt, activeParty?.party_id, player.id, storageTimerKey])
    
  useEffect(() => {
    if (!activeParty?.party_id) return

    const channel = supabase
      .channel(`room-stage-${activeParty.party_id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${activeParty.party_id}` },
        (payload) => {
          const updated = payload.new as { game_stage: string; game_duration_seconds: number | null; stage_started_at: string | null }
          setPlayer((prev) => {
            if (!prev || !prev.player_parties) return prev
            return {
              ...prev,
              player_parties: {
                ...prev.player_parties,
                game_status: 'waiting', 
                parties: {
                  ...prev.player_parties.parties,
                  game_stage: updated.game_stage,
                  game_duration_seconds: updated.game_duration_seconds,
                  stage_started_at: updated.stage_started_at
                } as any
              }
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeParty?.party_id, setPlayer])

  const handleLeaveParty = async () => {
    if (!player) return
    if (!confirm('¿Seguro que deseas abandonar la sala de juego actual?')) return
    DeviceStorage.removeItem(storageTimerKey as any)
    DeviceStorage.removeItem(STORAGE_STATE_KEY as any)
    DeviceStorage.removeItem(STORAGE_POINTS_KEY as any)
    DeviceStorage.removeItem(STORAGE_PREFIX_KEY as any)
    await supabase.from('player_parties').delete().eq('player_id', player.id)
    setPlayer({ ...player, player_parties: null })
  }

  // 🎯 Callback unificado activado por los juegos hijos cuando el usuario completa las rondas de forma natural
  const handleTriggerDistribution = (finalPoints: number, gamePrefix: string) => {
    setPointsToDistribute(finalPoints)
    setSliderPrefix(gamePrefix)
    setDistributionState('distributing')
  }

  const cleanOrchestratorStorage = () => {
    DeviceStorage.removeItem(STORAGE_STATE_KEY as any)
    DeviceStorage.removeItem(STORAGE_POINTS_KEY as any)
    DeviceStorage.removeItem(STORAGE_PREFIX_KEY as any)
  }

  // 🧱 Enrutador Modular Estático de Vistas de Juegos
  const renderActiveGamePage = () => {
    if (gameStage === 'juego_1') {
      return <Juego1View 
        player={player} 
        timeLeft={timeLeft} 
        onGameFinished={(pts) => handleTriggerDistribution(pts, 'uno')}
      />
    }
    if (gameStage === 'juego_2') {
      return <Juego2View 
        player={player} 
        timeLeft={timeLeft} 
        onGameFinished={(pts) => handleTriggerDistribution(pts, 'dos')}
      />
    }
    if (gameStage === 'juego_3') return <Juego3View />
    return null
  }

  return (
    <div className="App" style={{ paddingTop: '110px', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* 📊 DASHBOARD SUPERIOR FIJO */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#1a1a1a', color: '#fff', padding: '12px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', borderBottom: `4px solid ${activeParty?.team_id ? teamColor : '#444'}`, zIndex: 900, fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>{player.name}</span>
            <span style={{ fontSize: '0.8rem', color: '#fb923c', fontWeight: '500' }}>🛡️ {roleLabel}</span>
          </div>
          <div style={{ background: '#222', padding: '6px 12px', borderRadius: '6px', border: '1px solid #333', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#aaa' }}>SALA ACTIVA</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '1px' }}>{roomCode}</span>
          </div>

          {timeLeft !== null ? (
            <div style={{ background: '#111', padding: '6px 15px', borderRadius: '6px', border: `1px solid ${isTimeUp ? '#ef4444' : '#22c55e'}`, textAlign: 'center', minWidth: '95px' }}>
              <span style={{ display: 'block', fontSize: '0.65rem', color: isTimeUp ? '#ef4444' : '#aaa', fontWeight: 'bold' }}>{isTimeUp ? 'ESTADO' : 'TIEMPO'}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 'bold', color: isTimeUp ? '#ef4444' : '#22c55e' }}>{isTimeUp ? '¡FIN!' : `${timeLeft}s`}</span>
            </div>
          ) : (
            <div style={{ background: '#111', padding: '6px 15px', borderRadius: '6px', border: '1px solid #0d9488', textAlign: 'center', minWidth: '95px' }}>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#0d9488', fontWeight: 'bold' }}>MODO</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0d9488' }}>♾️ LIBRE</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', minWidth: '120px' }}>
            <span style={{ fontSize: '0.75rem', color: '#aaa' }}>EQUIPO ACTUAL</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: activeParty?.team_id ? teamColor : '#9ca3af' }}>{teamName}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ background: '#111', padding: '4px 10px', borderRadius: '4px', textAlign: 'center', border: '1px solid #222' }}>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#888' }}>PTS INDIV.</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#4ade80' }}>{individualScore}</span>
            </div>
            {activeParty?.team_id && (
              <div style={{ background: '#111', padding: '4px 10px', borderRadius: '4px', textAlign: 'center', border: '1px solid #222' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#888' }}>PTS EQ.</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: teamColor }}>{teamScore}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🎮 CUERPO CENTRAL */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        
        {gameStage.startsWith('juego_') ? (
          <div style={{ marginTop: '20px' }}>
            
            {/* 🛡️ INTERCEPCIÓN ABSOLUTA: Si está distribuyendo, NO se quita de la pantalla pase lo que pase */}
            {distributionState === 'distributing' ? (
              <PointDistributionView
                player={player}
                setPlayer={setPlayer}
                accumulatedPoints={pointsToDistribute}
                sliderStorageKey={`${sliderPrefix}_slider_${player.id}_${activeParty?.party_id}`}
                onCleanLocalStorage={cleanOrchestratorStorage}
                onSuccess={() => setDistributionState('success')}
              />
            ) : distributionState === 'success' || isTimeUp || activeParty?.game_status === 'finished' ? (
              <TimeUpWaitingView />
            ) : (
              renderActiveGamePage()
            )}

          </div>
        ) : (
          <div style={{ padding: '30px', border: '2px dashed #2e7d32', margin: '30px 0', borderRadius: '8px', background: 'rgba(46, 125, 50, 0.05)' }}>
            <h3 style={{ color: '#4ade80', marginTop: 0 }}>[ Periodo Intermedio: Zona Segura ]</h3>
            <p style={{ color: '#ccc' }}>Estás descansando con tu escuadra en el lobby principal de la party. Prepárate, el admin cambiará la fase pronto.</p>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '15px' }}>
              Código de dispositivo: <code>{player.code_players?.code || 'No disponible'}</code>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={handleLeaveParty} style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Salir de la Party
          </button>
        </div>
      </main>

      <FloatingScoreboard currentPartyId={activeParty?.party_id} clientPlayerId={player.id} />
    </div>
  )
}