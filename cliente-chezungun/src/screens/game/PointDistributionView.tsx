import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { GAME_CONFIG } from '../../data/gameConfig'
import type { PlayerSession } from '../../App'
import DeviceStorage from '../../utils/localstorage'

interface PointDistributionViewProps {
  player: PlayerSession
  setPlayer: React.Dispatch<React.SetStateAction<PlayerSession | null>>
  accumulatedPoints: number
  sliderStorageKey: string
  onCleanLocalStorage: () => void
  onSuccess: () => void
}

export default function PointDistributionView({
  player,
  setPlayer,
  accumulatedPoints,
  sliderStorageKey,
  onCleanLocalStorage,
  onSuccess
}: PointDistributionViewProps) {
  const [isSaving, setIsSaving] = useState(false)

  // Sincronizar el slider localmente para que no se mueva al refrescar
  const [pointsToTeam, setPointsToTeam] = useState<number>(() => {
    const savedSlider = DeviceStorage.getItem(sliderStorageKey as any, 'string')
    return savedSlider ? parseInt(savedSlider as string, 10) : Math.floor(accumulatedPoints / 2)
  })

  useEffect(() => {
    DeviceStorage.setItem(sliderStorageKey as any, pointsToTeam.toString())
  }, [pointsToTeam, sliderStorageKey])

  const role = player?.player_parties?.role || 'jugador'
  const config = GAME_CONFIG.role_multipliers[role as keyof typeof GAME_CONFIG.role_multipliers] || GAME_CONFIG.role_multipliers.jugador

  const pointsToKeep = accumulatedPoints - pointsToTeam
  const finalTeamPoints = Math.round(pointsToTeam * config.to_team)
  const finalIndividualPoints = Math.round(pointsToKeep * config.to_individual)

  const handleConfirmDistribution = async () => {
    setIsSaving(true)
    try {
      const activeParty = player.player_parties
      if (!activeParty) return

      const updatedIndividualScore = (activeParty.individual_score ?? 0) + finalIndividualPoints

      // 1. Escribir estado 'finished' e individual_score acumulado en player_parties
      const { error: partyError } = await supabase
        .from('player_parties')
        .update({ 
          game_status: 'finished',
          individual_score: updatedIndividualScore
        })
        .eq('id', activeParty.party_id)

      if (partyError) throw partyError

      // 2. Sumar puntos colectivos a la tabla teams
      const teamId = activeParty.team_id || (activeParty.teams as any)?.id
      if (teamId && finalTeamPoints > 0) {
        const { data: teamData, error: fetchTeamError } = await supabase
          .from('teams')
          .select('score')
          .eq('id', teamId)
          .single()

        if (!fetchTeamError && teamData) {
          const currentTeamScore = teamData.score ?? 0
          await supabase
            .from('teams')
            .update({ score: currentTeamScore + finalTeamPoints })
            .eq('id', teamId)
        }
      }

      // 3. Ejecutar callbacks del juego padre para limpiar estados locales
      onCleanLocalStorage()
      onSuccess()

      // 4. Actualizar el estado maestro global de la sesión
      setTimeout(() => {
        setPlayer((prev) => {
          if (!prev || !prev.player_parties) return prev
          return {
            ...prev,
            player_parties: {
              ...prev.player_parties,
              game_status: 'finished',
              individual_score: updatedIndividualScore
            }
          }
        })
      }, 1500)

    } catch (error) {
      console.error('Error crítico al procesar la distribución unificada:', error)
      alert('Hubo un problema guardando tu distribución de puntos.')
      setIsSaving(false)
    }
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ color: '#38bdf8', marginBottom: '10px' }}>¡Desafío Completado!</h2>
      <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
        Obtuviste un botín de <strong style={{ color: '#f8fafc' }}>{accumulatedPoints} puntos base</strong>.
      </p>

      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px', marginBottom: '25px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', marginBottom: '15px' }}>Elige la distribución exacta:</h3>
        
        <input 
          type="range" 
          min="0" 
          max={accumulatedPoints} 
          step="1"
          value={pointsToTeam}
          onChange={(e) => setPointsToTeam(Number(e.target.value))}
          disabled={isSaving}
          style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer', marginBottom: '25px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '15px' }}>
          <div style={cardStyle}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Para Ti ({pointsToKeep} pts)</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f8fafc' }}>+{finalIndividualPoints}</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Mult: x{config.to_individual}</span>
          </div>

          <div style={{ ...cardStyle, borderColor: '#a855f7' }}>
            <span style={{ fontSize: '0.85rem', color: '#a855f7' }}>Al Equipo ({pointsToTeam} pts)</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#d8b4fe' }}>+{finalTeamPoints}</span>
            <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>Mult: x{config.to_team}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleConfirmDistribution}
        disabled={isSaving}
        style={{
          width: '100%',
          padding: '14px',
          background: isSaving ? '#334155' : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
          color: isSaving ? '#64748b' : '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          boxShadow: isSaving ? 'none' : '0 4px 12px rgba(56, 189, 248, 0.2)'
        }}
      >
        {isSaving ? 'Sincronizando con base de datos...' : 'Confirmar y Enviar'}
      </button>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '30px 20px',
  background: '#0f172a',
  borderRadius: '12px',
  border: '2px solid #38bdf8',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(56, 189, 248, 0.15)',
}
const cardStyle: React.CSSProperties = { 
  flex: 1, 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  padding: '15px', 
  backgroundColor: '#0f172a', 
  border: '1px solid #334155', 
  borderRadius: '8px' 
}