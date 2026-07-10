import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { ROLE_LABELS } from '../types/db'

interface FloatingScoreboardProps {
  currentPartyId?: string;       // Enviado automáticamente por el Cliente
  clientPlayerId?: string;       // ID del jugador activo (Cliente)
  availableParties?: any[];      // Lista de salas del Admin para el selector rápido
}

export default function FloatingScoreboard({
  currentPartyId,
  clientPlayerId,
  availableParties = []
}: FloatingScoreboardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPartyId, setSelectedPartyId] = useState(currentPartyId || '')
  const [partyData, setPartyData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Estados de ordenamiento para la lista inferior de jugadores
  const [playerSortKey, setPlayerSortKey] = useState<'name' | 'team' | 'role' | 'score'>('score')
  const [playerSortOrder, setPlayerSortOrder] = useState<'asc' | 'desc'>('desc')

  // Sincronizar ID de sala activa
  useEffect(() => {
    if (currentPartyId) {
      setSelectedPartyId(currentPartyId)
    }
  }, [currentPartyId])

  // Cargar datos de la sala seleccionada de forma fresca
  const fetchPartyScoreboard = async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parties')
        .select(`
          id,
          code,
          teams ( id, name, color, score ),
          player_parties (
            role,
            individual_score,
            player_id,
            players ( id, name ),
            teams ( id, name, color )
          )
        `)
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      setPartyData(data)
    } catch (err) {
      console.error('Error cargando ranking:', err)
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos cada vez que se abre el modal o cambia la sala seleccionada
  useEffect(() => {
    if (isOpen && selectedPartyId) {
      fetchPartyScoreboard(selectedPartyId)
    }
  }, [isOpen, selectedPartyId])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Ver Tabla de Posiciones y Miembros"
      >
        📊
      </button>
    )
  }

  // Procesamiento de datos internos de la sala
  const rawMembers = partyData?.player_parties
  const members: any[] = Array.isArray(rawMembers) ? rawMembers : rawMembers ? [rawMembers] : []
  const teams: any[] = partyData?.teams || []

  // 1. Encontrar la información del cliente actual
  const clientInfo = clientPlayerId ? members.find((m) => m.player_id === clientPlayerId) : null

  // 2. Construir Ranking Mixto Integrado (Equipos + Jugadores como iguales)
  const mixedRanking: any[] = []
  
  teams.forEach((t) => {
    mixedRanking.push({
      id: t.id,
      name: `${t.name}`,
      color: t.color || '#38bdf8',
      score: t.score || 0,
      isTeam: true
    })
  })

  members.forEach((m) => {
    mixedRanking.push({
      id: m.player_id,
      name: m.players?.name || 'Anónimo',
      color: m.teams?.color || '#aaa',
      score: m.individual_score || 0,
      isTeam: false,
      teamName: m.teams?.name ? `(Eq: ${m.teams.name})` : '(Sin Equipo)'
    })
  })

  // Ordenar el ranking integrado por puntaje descendente
  mixedRanking.sort((a, b) => b.score - a.score)

  // 3. Ordenar la lista dedicada inferior de jugadores unidos
  const sortedPlayers = [...members].sort((a, b) => {
    let valA: any = ''
    let valB: any = ''

    if (playerSortKey === 'name') {
      valA = a.players?.name || ''
      valB = b.players?.name || ''
    } else if (playerSortKey === 'team') {
      valA = a.teams?.name || ''
      valB = b.teams?.name || ''
    } else if (playerSortKey === 'role') {
      valA = a.role || ''
      valB = b.role || ''
    } else if (playerSortKey === 'score') {
      valA = a.individual_score || 0
      valB = b.individual_score || 0
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return playerSortOrder === 'asc' ? valA - valB : valB - valA
    }
    return playerSortOrder === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })

  const toggleSort = (key: 'name' | 'team' | 'role' | 'score') => {
    if (playerSortKey === key) {
      setPlayerSortOrder(playerSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setPlayerSortKey(key)
      setPlayerSortOrder('desc')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'sans-serif',
        color: '#fff'
      }}
    >
      <div
        style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '12px',
          maxWidth: '650px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '25px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        {/* Botón Cerrar */}
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '15px', right: '15px',
            background: '#333', color: '#fff',
            border: 'none', borderRadius: '4px',
            padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          ✕ Cerrar
        </button>

        <h3 style={{ margin: '0 0 15px 0', color: '#38bdf8' }}>📊 Estado General de la Partida</h3>

        {/* Modo Administrador: Selector de Sala */}
        {!currentPartyId && availableParties.length > 0 && (
          <div style={{ marginBottom: '20px', background: '#161616', padding: '10px', borderRadius: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: '#aaa', marginRight: '10px' }}>Monitorear Sala: </label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              style={{ padding: '5px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}
            >
              <option value="">-- Selecciona una Sala --</option>
              {availableParties.map((p) => (
                <option key={p.id} value={p.id}>Sala: {p.code}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#aaa' }}>Actualizando datos del servidor...</p>
        ) : !selectedPartyId ? (
          <p style={{ color: '#aaa', fontStyle: 'italic' }}>Por favor selecciona una sala para visualizar su ranking.</p>
        ) : (
          <>
            {/* ---------------------------------------------------
                SECCIÓN: EQUIPOS (Siempre Arriba)
               --------------------------------------------------- */}
            <div style={{ background: '#161616', padding: '12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #2a2a2a' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#a3e635', tracking: '1px', display: 'block', marginBottom: '8px' }}>🛡️ RESUMEN DE EQUIPOS</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {teams.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>No hay equipos registrados.</span>
                ) : (
                  teams.map((t) => (
                    <span
                      key={t.id}
                      style={{
                        background: '#222',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        borderLeft: `4px solid ${t.color || '#38bdf8'}`
                      }}
                    >
                      {t.name}: <strong>{t.score} pts</strong>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* ---------------------------------------------------
                SECCIÓN: CLIENTE (Tu Estado como Jugador)
               --------------------------------------------------- */}
            {clientInfo && (
              <div style={{ background: '#1e3a8a', padding: '12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #3b82f6' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#60a5fa', display: 'block', marginBottom: '4px' }}>👤 TU PERFIL</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                  <span><strong>{clientInfo.players?.name}</strong> <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>({ROLE_LABELS[clientInfo.role] || clientInfo.role})</span></span>
                  <span>Equipo: <strong style={{ color: clientInfo.teams?.color }}>{clientInfo.teams?.name || 'Ninguno'}</strong></span>
                  <span style={{ background: '#1d4ed8', padding: '2px 8px', borderRadius: '4px' }}><strong>{clientInfo.individual_score} pts</strong></span>
                </div>
              </div>
            )}

            <hr style={{ borderColor: '#333', margin: '15px 0' }} />

            {/* ---------------------------------------------------
                SECCIÓN: PRIMER LUGAR / RANKING MIXTO INTEGRADO
               --------------------------------------------------- */}
            <h4 style={{ margin: '0 0 10px 0', color: '#fb923c' }}>🏆 Escalafón General de Puntuación</h4>
            <div style={{ background: '#161616', borderRadius: '6px', padding: '10px', marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }}>
              {mixedRanking.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: '#555', fontStyle: 'italic' }}>No hay registros puntuables.</p>
              ) : (
                mixedRanking.map((item, idx) => {
                  const isTopOne = idx === 0
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 8px',
                        background: isTopOne ? '#3f2c00' : 'transparent',
                        borderBottom: '1px solid #222',
                        borderRadius: isTopOne ? '4px' : '0',
                        borderLeft: `3px solid ${item.color}`,
                        fontWeight: isTopOne ? 'bold' : 'normal'
                      }}
                    >
                      <span style={{ fontSize: '0.95rem' }}>
                        {isTopOne ? '🥇 1º Puesto: ' : `${idx + 1}º `}
                        <span style={{ color: item.isTeam ? '#4ade80' : '#fff' }}>{item.name}</span>{' '}
                        {item.isTeam ? (
                          <span style={{ fontSize: '0.75rem', background: '#22c55e', color: '#000', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold', marginLeft: '5px' }}>EQUIPO</span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{item.teamName}</span>
                        )}
                      </span>
                      <span style={{ color: isTopOne ? '#facc15' : '#fff', fontWeight: 'bold' }}>{item.score} pts</span>
                    </div>
                  )
                })
              )}
            </div>

            {/* ---------------------------------------------------
                SECCIÓN: LISTA SORTEABLE DE JUGADORES
               --------------------------------------------------- */}
            <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>👥 Miembros de la Sala</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', color: '#aaa' }}>
                  <th onClick={() => toggleSort('name')} style={{ padding: '6px', cursor: 'pointer', userSelect: 'none' }}>Jugador {playerSortKey === 'name' ? (playerSortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => toggleSort('team')} style={{ padding: '6px', cursor: 'pointer', userSelect: 'none' }}>Equipo {playerSortKey === 'team' ? (playerSortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => toggleSort('role')} style={{ padding: '6px', cursor: 'pointer', userSelect: 'none' }}>Rol {playerSortKey === 'role' ? (playerSortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                  <th onClick={() => toggleSort('score')} style={{ padding: '6px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}>Ptos Indiv. {playerSortKey === 'score' ? (playerSortOrder === 'asc' ? '▲' : '▼') : ''}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '10px', textAlign: 'center', color: '#555', fontStyle: 'italic' }}>No hay jugadores en esta sala.</td>
                  </tr>
                ) : (
                  sortedPlayers.map((m, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #222', backgroundColor: m.player_id === clientPlayerId ? '#1e293b' : 'transparent' }}>
                      <td style={{ padding: '6px', fontWeight: m.player_id === clientPlayerId ? 'bold' : 'normal' }}>
                        {m.players?.name} {m.player_id === clientPlayerId ? '🔑' : ''}
                      </td>
                      <td style={{ padding: '6px', color: m.teams?.color || '#fff' }}>{m.teams?.name || 'Ninguno'}</td>
                      <td style={{ padding: '6px', color: '#aaa' }}>{ROLE_LABELS[m.role] || m.role}</td>
                      <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{m.individual_score}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Botón manual de Refresh interno */}
            <button
              onClick={() => fetchPartyScoreboard(selectedPartyId)}
              style={{ marginTop: '15px', width: '100%', padding: '6px', background: '#262626', border: '1px solid #444', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              🔄 Sincronizar Datos con Servidor
            </button>
          </>
        )}
      </div>
    </div>
  )
}