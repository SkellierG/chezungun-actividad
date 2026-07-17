import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { AdminParty, GlobalPlayer } from '../types/db'
import PartiesTab from './PartiesTab'
import PlayersTab from './PlayersTab'
import FloatingScoreboard from '../components/FLoatingScoreboard'

// Diccionario de etiquetas amigables para cada etapa de la partida
const STAGE_LABELS: Record<string, string> = {
  intermedio_1: '🎹 Intermedio 1 (Lobby Espera)',
  juego_1: '🎮 Juego 1 Activo',
  intermedio_2: '🎹 Intermedio 2 (Descanso 1)',
  juego_2: '🎮 Juego 2 Activo',
  intermedio_3: '🎹 Intermedio 3 (Descanso 2)',
  juego_3: '🎮 Juego 3 Activo',
  intermedio_4: '🎹 Intermedio 4 (Pre-Cierre)',
  intermedio_5: '🏆 Intermedio 5 (Podio Final)',
}

export default function AdminScreen() {
  const [parties, setParties] = useState<AdminParty[]>([])
  const [loading, setLoading] = useState(true)
  const [newPartyCode, setNewPartyCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [activeTab, setActiveTab] = useState<'parties' | 'players'>('parties')
  const [allPlayers, setAllPlayers] = useState<GlobalPlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [selectedPartyForPlayer, setSelectedPartyForPlayer] = useState<Record<string, string>>({})

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editNameInput, setEditNameInput] = useState('')
  const [editRoleInput, setEditRoleInput] = useState('')
  const [editTeamInput, setEditTeamInput] = useState('')

  // ⏱️ ESTADOS DE PREVIEW: Capturan los borradores locales. 
  // La duración ahora acepta number o null para fases manuales
  const [localDurations, setLocalDurations] = useState<Record<string, number | null>>({})
  const [previewStages, setPreviewStages] = useState<Record<string, string>>({})

  // 1. Traer salas enriquecidas (Sincronización inicial)
  const fetchAllParties = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parties')
        .select(`
          id,
          code,
          created_at,
          game_stage,
          game_duration_seconds,
          stage_started_at,
          teams ( id, name, color, score ),
          player_parties (
            role,
            individual_score,
            game_status,
            players (id, name),
            teams (id, name, color, score)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setParties(data || [])
      
      // Sincronizar de manera inteligente sin machacar cambios locales que el admin ya esté editando
      setLocalDurations((prev) => {
        const next = { ...prev }
        data?.forEach((p) => {
          if (next[p.id] === undefined) {
            next[p.id] = (p as any).game_duration_seconds ?? null
          }
        })
        return next
      })

      setPreviewStages((prev) => {
        const next = { ...prev }
        data?.forEach((p) => {
          if (next[p.id] === undefined) {
            next[p.id] = (p as any).game_stage || 'intermedio_1'
          }
        })
        return next
      })
    } catch (error) {
      console.error('Error cargando panel de admin:', error)
      alert('Error al traer los datos globales de las partidas.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllPlayers = async () => {
    setLoadingPlayers(true)
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id, name, created_at,
          code_players ( code ),
          player_parties ( party_id, role, team_id, parties ( code ), teams ( id, name, color ) )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllPlayers(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingPlayers(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'parties') {
      fetchAllParties()
    } else {
      fetchAllPlayers()
      fetchAllParties()
    }
  }, [activeTab])

  // =========================================================
  // 📡 MULTI-REALTIME: Escucha salas y estados de jugadores en vivo
  // =========================================================
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-realtime-orchestrator')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, () => {
        fetchAllParties()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_parties' }, () => {
        fetchAllParties()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 🚀 CONFIRMACIÓN Y PUBLICACIÓN: Cambia el Live de Supabase con el Preview seleccionado
  const handlePublishStageAndDuration = async (partyId: string) => {
    const targetStage = previewStages[partyId] || 'intermedio_1'
    let targetSeconds = localDurations[partyId]

    // Forzar null si es una etapa de intermedio (para que no tenga límite de tiempo)
    if (targetStage.startsWith('intermedio_')) {
      targetSeconds = null
    } else if (targetSeconds === undefined || targetSeconds === null) {
      targetSeconds = 60 // Default fallback para juegos si no se especifica
    }

    // El timestamp de inicio solo se registra si la fase tiene límite de tiempo
    const targetStartedAt = targetSeconds !== null ? new Date().toISOString() : null

    try {
      const { error } = await supabase
        .from('parties')
        .update({ 
          game_stage: targetStage,
          game_duration_seconds: targetSeconds,
          stage_started_at: targetStartedAt
        })
        .eq('id', partyId)

      if (error) throw error
      alert('¡Configuración de la partida publicada en vivo con éxito!')
    } catch (error) {
      console.error(error)
      alert('No se pudo publicar la configuración de fase y tiempo.')
    }
  }

  // Funciones de gestión heredadas sin mutaciones
  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault()
    let code = newPartyCode.trim().toUpperCase()
    if (!code) code = 'ROOM_' + Math.random().toString(36).substring(2, 7).toUpperCase()
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('parties').insert([{ code }])
      if (error) { if (error.code === '23505') return alert('Ese código de Party ya existe.'); throw error }
      setNewPartyCode('')
      fetchAllParties() 
    } catch (error) { console.error(error) } finally { setIsSubmitting(false) }
  }

  const startEditing = (player: GlobalPlayer, currentRole: string, currentTeamId: string) => {
    setEditingPlayerId(player.id); setEditNameInput(player.name); setEditRoleInput(currentRole); setEditTeamInput(currentTeamId)
  }

  const handleUpdatePlayer = async (playerId: string, hasActiveParty: boolean) => {
    if (!editNameInput.trim()) return alert('El nombre no puede estar vacío.')
    try {
      await supabase.from('players').update({ name: editNameInput.trim() }).eq('id', playerId)
      if (hasActiveParty) {
        await supabase.from('player_parties').update({ role: editRoleInput, team_id: editTeamInput || null }).eq('player_id', playerId)
      }
      setEditingPlayerId(null); fetchAllPlayers(); fetchAllParties()
    } catch (error) { console.error(error) }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('¿Seguro?')) return
    try {
      await supabase.from('player_parties').delete().eq('player_id', playerId)
      await supabase.from('code_players').delete().eq('player_id', playerId)
      await supabase.from('players').delete().eq('id', playerId)
      fetchAllPlayers()
    } catch (error) { console.error(error) }
  }

  const handleKickPlayer = async (playerId: string) => {
    if (!confirm('¿Expulsar?')) return
    try {
      await supabase.from('player_parties').delete().eq('player_id', playerId)
      if (activeTab === 'players') fetchAllPlayers(); else fetchAllParties();
    } catch (error) { console.error(error) }
  }

  const handleForceJoinParty = async (playerId: string) => {
    const targetPartyId = selectedPartyForPlayer[playerId]
    if (!targetPartyId) return alert('Selecciona sala.')
    try {
      await supabase.from('player_parties').delete().eq('player_id', playerId)
      await supabase.from('player_parties').insert([{ player_id: playerId, party_id: targetPartyId, role: 'jugador', team_id: null, individual_score: 0 }])
      fetchAllPlayers()
    } catch (error) { console.error(error) }
  }

  const handleCreateTeam = async (partyId: string, teamName: string) => {
    await supabase.from('teams').insert([{ party_id: partyId, name: teamName, score: 0 }]); await fetchAllParties()
  }

  const handleUpdateTeam = async (teamId: string, name: string, color: string) => {
    await supabase.from('teams').update({ name: name.trim(), color: color.trim() }).eq('id', teamId); await fetchAllParties()
  }

  const handleUpdateTeamScore = async (teamId: string, currentScore: number, delta: number) => {
    await supabase.from('teams').update({ score: Math.max(0, currentScore + delta) }).eq('id', teamId); await fetchAllParties()
  }

  const handleUpdatePlayerTeam = async (playerId: string, teamId: string | null) => {
    await supabase.from('player_parties').update({ team_id: teamId }).eq('player_id', playerId); await fetchAllParties()
  }

  // Intercepta los cambios de preview de etapa para limpiar automáticamente el input de segundos si es intermedio
  const handlePreviewStageChange = (partyId: string, stage: string) => {
    setPreviewStages(prev => ({ ...prev, [partyId]: stage }))
    if (stage.startsWith('intermedio_')) {
      setLocalDurations(prev => ({ ...prev, [partyId]: null }))
    } else {
      setLocalDurations(prev => {
        // Restaurar a un valor numérico por defecto (ej: 60s) si venía de un valor null
        const current = prev[partyId]
        return { ...prev, [partyId]: current !== null && current !== undefined ? current : 60 }
      })
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff' }}>
      <h2>Panel de Administración Global</h2>
      <p style={{ color: '#aaa' }}>Configura el piano de tiempos de juego y publica de forma segura los cambios de estado.</p>
      
      {/* =======================================================================
          🎛️ PANEL MAESTRO DE FASES CON ENFOQUE PREVIEW vs LIVE
         ======================================================================= */}
      <div style={{ background: '#1e1e1e', padding: '15px 20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #333' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '1.1rem' }}>🎛️ Consola de Orquestación del Piano de Juegos</h4>
        {parties.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>No hay salas activas disponibles.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {parties.map((party) => {
              const currentStage = (party as any).game_stage || 'intermedio_1'
              const liveDuration = (party as any).game_duration_seconds // Puede ser NULL o number
              const liveStartedAt = (party as any).stage_started_at

              const draftStage = previewStages[party.id] || currentStage
              const draftDuration = localDurations[party.id] !== undefined ? localDurations[party.id] : liveDuration

              const isDraftAnIntermediary = draftStage.startsWith('intermedio_')

              return (
                <div key={party.id} style={{ backgroundColor: '#262626', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #0284c7', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {/* Fila superior: Identificación de la Sala */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                      Sala: <span style={{ color: '#38bdf8' }}>{party.code}</span>
                    </span>
                  </div>

                  {/* Estructura Side-By-Side (Live vs Preview) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                    
                    {/* 🟢 PANEL LIVE (Estado En Vivo Real del Servidor) */}
                    <div style={{ background: '#171717', padding: '12px', borderRadius: '6px', border: '1px solid #10b981' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                        EN VIVO (Live)
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: '#888' }}>Fase actual:</span>{' '}
                          <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                            {STAGE_LABELS[currentStage] || currentStage}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#888' }}>Duración activa:</span>{' '}
                          <span style={{ fontWeight: 'bold', color: '#f3f4f6' }}>
                            {liveDuration !== null && liveDuration !== undefined ? (
                              `${liveDuration} segundos ${liveStartedAt ? `(Iniciado: ${new Date(liveStartedAt).toLocaleTimeString()})` : ''}`
                            ) : (
                              '♾️ Manual / Sin Tiempo'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 🛠️ PANEL PREVIEW (Preparación del cambio) */}
                    <div style={{ background: '#171717', padding: '12px', borderRadius: '6px', border: '1px solid #eab308' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#eab308', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🛠️ PREPARAR CAMBIO (Preview)
                      </h5>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          
                          {/* Siguiente Fase (Draft Stage) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#888' }}>Siguiente Etapa:</span>
                            <select
                              value={draftStage}
                              onChange={(e) => handlePreviewStageChange(party.id, e.target.value)}
                              style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                            >
                              <option value="intermedio_1">🎹 Intermedio 1 (Lobby Espera)</option>
                              <option value="juego_1">🎮 Juego 1 Activo</option>
                              <option value="intermedio_2">🎹 Intermedio 2 (Descanso 1)</option>
                              <option value="juego_2">🎮 Juego 2 Activo</option>
                              <option value="intermedio_3">🎹 Intermedio 3 (Descanso 2)</option>
                              <option value="juego_3">🎮 Juego 3 Activo</option>
                              <option value="intermedio_4">🎹 Intermedio 4 (Pre-Cierre)</option>
                              <option value="intermedio_5">🏆 Intermedio 5 (Podio Final)</option>
                            </select>
                          </div>

                          {/* Siguiente Duración (Draft Duration) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#888' }}>Duración (seg):</span>
                            {isDraftAnIntermediary ? (
                              <div style={{ padding: '6px', background: '#222', border: '1px solid #333', color: '#0d9488', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px', textAlign: 'center' }}>
                                ♾️ Libre
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="5"
                                value={draftDuration !== null ? draftDuration : 60}
                                onChange={(e) => setLocalDurations({ ...localDurations, [party.id]: parseInt(e.target.value, 10) || 0 })}
                                style={{ width: '100%', background: '#222', color: '#fff', border: '1px solid #444', padding: '6px', boxSizing: 'border-box', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}
                              />
                            )}
                          </div>

                        </div>

                        {/* Botón Confirmar y Enviar */}
                        <button
                          onClick={() => handlePublishStageAndDuration(party.id)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#eab308',
                            color: '#111',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          Confirmar y Publicar en Vivo 🚀
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* 🟢 MONITOR DE ESTADOS DE DISPOSITIVO CLIENTE EN VIVO */}
                  <div style={{ background: '#111', padding: '10px 12px', borderRadius: '4px', border: '1px solid #333' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '6px', fontWeight: 'bold' }}>
                      MONITOR DE TIEMPO DE DISPOSITIVOS CLIENTES:
                    </span>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {Array.isArray(party.player_parties) && party.player_parties.length > 0 ? (
                        party.player_parties.map((pp: any) => {
                          let badgeBg = '#4b5563'
                          let label = '⏳ En Espera'
                          if (pp.game_status === 'playing') { badgeBg = '#16a34a'; label = '🟢 Jugando' }
                          if (pp.game_status === 'finished') { badgeBg = '#dc2626'; label = '🔴 Terminado' }

                          return (
                            <div key={pp.players?.id} style={{ background: '#222', padding: '4px 10px', borderRadius: '4px', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                              <span style={{ fontWeight: '500' }}>{pp.players?.name}</span>
                              <span style={{ backgroundColor: badgeBg, color: '#fff', padding: '1px 6px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {label}
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#555' }}>No hay jugadores conectados en la sala actualmente.</span>
                      )}
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pestañas de Navegación */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <button onClick={() => setActiveTab('parties')} style={{ padding: '10px 20px', background: activeTab === 'parties' ? '#0284c7' : '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🏰 Salas Activas ({parties.length})</button>
        <button onClick={() => setActiveTab('players')} style={{ padding: '10px 20px', background: activeTab === 'players' ? '#0284c7' : '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>👥 Todos los Jugadores ({allPlayers.length})</button>
      </div>

      <hr style={{ borderColor: '#444', margin: '20px 0' }} />

      {activeTab === 'parties' ? (
        <PartiesTab newPartyCode={newPartyCode} setNewPartyCode={setNewPartyCode} isSubmitting={isSubmitting} handleCreateParty={handleCreateParty} fetchAllParties={fetchAllParties} loading={loading} parties={parties} handleKickPlayer={handleKickPlayer} handleCreateTeam={handleCreateTeam} handleUpdateTeam={handleUpdateTeam} handleUpdateTeamScore={handleUpdateTeamScore} handleUpdatePlayerTeam={handleUpdatePlayerTeam} />
      ) : (
        <PlayersTab fetchAllPlayers={fetchAllPlayers} loadingPlayers={loadingPlayers} allPlayers={allPlayers} editingPlayerId={editingPlayerId} setEditingPlayerId={setEditingPlayerId} editNameInput={editNameInput} setEditNameInput={setEditNameInput} editRoleInput={editRoleInput} setEditRoleInput={setEditRoleInput} editTeamInput={editTeamInput} setEditTeamInput={setEditTeamInput} parties={parties} selectedPartyForPlayer={selectedPartyForPlayer} setSelectedPartyForPlayer={setSelectedPartyForPlayer} startEditing={startEditing} handleUpdatePlayer={handleUpdatePlayer} handleDeletePlayer={handleDeletePlayer} handleKickPlayer={handleKickPlayer} handleForceJoinParty={handleForceJoinParty} />
      )}

      <FloatingScoreboard availableParties={parties} />
    </div>
  )
}