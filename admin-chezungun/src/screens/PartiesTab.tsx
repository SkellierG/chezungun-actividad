import React, { useState } from 'react'
import type { AdminParty, AdminPlayerParties } from '../types/db'
import { ROLE_LABELS } from '../types/db'

interface PartiesTabProps {
  newPartyCode: string;
  setNewPartyCode: (val: string) => void;
  isSubmitting: boolean;
  handleCreateParty: (e: React.FormEvent) => Promise<void>;
  fetchAllParties: () => Promise<void>;
  loading: boolean;
  parties: AdminParty[];
  handleKickPlayer: (playerId: string) => Promise<void>;
  handleCreateTeam: (partyId: string, teamName: string) => Promise<void>;
  handleUpdateTeam: (teamId: string, name: string, color: string) => Promise<void>;
  handleUpdateTeamScore: (teamId: string, currentScore: number, delta: number) => Promise<void>;
  handleUpdatePlayerTeam: (playerId: string, teamId: string | null) => Promise<void>;
}

export default function PartiesTab({
  newPartyCode,
  setNewPartyCode,
  isSubmitting,
  handleCreateParty,
  fetchAllParties,
  loading,
  parties,
  handleKickPlayer,
  handleCreateTeam,
  handleUpdateTeam,
  handleUpdateTeamScore,
  handleUpdatePlayerTeam
}: PartiesTabProps) {
  // Estado para la inserción de nuevos equipos
  const [teamInputs, setTeamInputs] = useState<Record<string, string>>({})
  const [isSubmittingTeam, setIsSubmittingTeam] = useState<Record<string, boolean>>({})

  // Control de edición inline de equipos existentes (Nombre y Color)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editTeamColor, setEditTeamColor] = useState('')

  // NUEVO ESTADO: Guarda el valor arbitrario tipeado por el admin, mapeado por el ID de cada equipo
  const [arbitraryInputs, setArbitraryInputs] = useState<Record<string, string>>({})

  const onSubmitTeam = async (e: React.FormEvent, partyId: string) => {
    e.preventDefault()
    const teamName = teamInputs[partyId]?.trim()
    if (!teamName) return

    try {
      setIsSubmittingTeam(prev => ({ ...prev, [partyId]: true }))
      await handleCreateTeam(partyId, teamName)
      setTeamInputs(prev => ({ ...prev, [partyId]: '' }))
    } catch (error) {
      console.error("Error creando equipo en la UI:", error)
    } finally {
      setIsSubmittingTeam(prev => ({ ...prev, [partyId]: false }))
    }
  }

  const startEditingTeam = (teamId: string, currentName: string, currentColor: string) => {
    setEditingTeamId(teamId)
    setEditTeamName(currentName)
    setEditTeamColor(currentColor)
  }

  const onSaveTeamChanges = async (teamId: string) => {
    if (!editTeamName.trim()) return alert('El nombre de la escuadra no puede estar vacío.')
    try {
      await handleUpdateTeam(teamId, editTeamName, editTeamColor)
      setEditingTeamId(null)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      {/* Sección: Crear Salas */}
      <section style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Crear Nueva Sala (Party)</h3>
        <form onSubmit={handleCreateParty} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Ej: AB12 (Vacío para aleatorio)"
            value={newPartyCode}
            onChange={(e) => setNewPartyCode(e.target.value)}
            disabled={isSubmitting}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '250px' }}
          />
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isSubmitting ? 'Creando...' : 'Crear Sala'}
          </button>
        </form>
      </section>

      {/* Sección: Monitoreo de Salas */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Salas Activas en el Servidor</h3>
          <button onClick={fetchAllParties} style={{ padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <p>Cargando información consolidada...</p>
        ) : parties.length === 0 ? (
          <p style={{ color: '#aaa' }}>No hay salas creadas en el servidor actualmente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {parties.map((party) => {
              const rawMembers = party.player_parties
              const members: AdminPlayerParties[] = Array.isArray(rawMembers) ? rawMembers : rawMembers ? [rawMembers] : []

              return (
                <div key={party.id} style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                  
                  {/* Header de la Sala */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>Sala Cód: {party.code}</span>
                    <span style={{ fontSize: '0.85rem', color: '#777' }}>Creada: {new Date(party.created_at).toLocaleString()}</span>
                  </div>

                  {/* SECCIÓN EXPANDIDA: Gestión e Inserción de Equipos inline */}
                  <div style={{ background: '#161616', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #222' }}>
                    <h5 style={{ margin: '0 0 12px 0', color: '#4ade80', fontSize: '0.95rem' }}>🛡️ Control y Propiedades de Equipos</h5>
                    
                    {/* Lista dinámica con edición y modificadores de puntaje multirango */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                      {party.teams && party.teams.length > 0 ? (
                        party.teams.map((t) => {
                          const isEditingThisTeam = editingTeamId === t.id;

                          return (
                            <div 
                              key={t.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                background: '#222', 
                                padding: '8px 12px', 
                                borderRadius: '4px', 
                                border: '1px solid #333',
                                borderLeft: `5px solid ${t.color || '#38bdf8'}`,
                                flexWrap: 'wrap',
                                gap: '10px'
                              }}
                            >
                              {isEditingThisTeam ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                                  <input
                                    type="text"
                                    value={editTeamName}
                                    onChange={(e) => setEditTeamName(e.target.value)}
                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', fontSize: '0.85rem' }}
                                  />
                                  <input
                                    type="color"
                                    value={editTeamColor}
                                    onChange={(e) => setEditTeamColor(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '40px', height: '28px', padding: 0 }}
                                  />
                                  <button onClick={() => onSaveTeamChanges(t.id)} style={{ padding: '4px 8px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>💾 Guardar</button>
                                  <button onClick={() => setEditingTeamId(null)} style={{ padding: '4px 8px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
                                </div>
                              ) : (
                                <>
                                  <span style={{ fontWeight: 'bold', color: t.color || '#fff' }}>{t.name}</span>
                                  
                                  {/* PANEL INTERACTIVO DE PUNTUACIÓN AVANZADA */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    
                                    {/* Bloque de Restas Rápidas (-10, -5, -1) */}
                                    <div style={{ display: 'flex', gap: '2px', background: '#2d1414', padding: '2px', borderRadius: '4px' }}>
                                      <button 
                                        onClick={() => handleUpdateTeamScore(t.id, t.score, -10)}
                                        style={{ padding: '3px 6px', background: '#7f1d1d', border: 'none', color: '#fca5a5', borderRadius: '3px 0 0 3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                                        title="Restar 10 puntos"
                                      >
                                        -10
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateTeamScore(t.id, t.score, -5)}
                                        style={{ padding: '3px 6px', background: '#991b1b', border: 'none', color: '#fca5a5', borderRadius: '0', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                                        title="Restar 5 puntos"
                                      >
                                        -5
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateTeamScore(t.id, t.score, -1)}
                                        style={{ padding: '3px 6px', background: '#b91c1c', border: 'none', color: '#fff', borderRadius: '0 3px 3px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                                        title="Restar 1 punto"
                                      >
                                        -1
                                      </button>
                                    </div>

                                    {/* Monitor Central de Puntos */}
                                    <span style={{ fontSize: '0.9rem', minWidth: '65px', textAlign: 'center', fontWeight: 'bold', background: '#111', padding: '5px 10px', borderRadius: '4px', border: '1px solid #2a2a2a' }}>
                                      {t.score} pts
                                    </span>

                                    {/* Bloque de Sumas Rápidas (+1, +5, +10) */}
                                    <div style={{ display: 'flex', gap: '2px', background: '#142d19', padding: '2px', borderRadius: '4px' }}>
                                      <button 
                                        onClick={() => handleUpdateTeamScore(t.id, t.score, 1)}
                                        style={{ padding: '3px 6px', background: '#16a34a', border: 'none', color: '#fff', borderRadius: '3px 0 0 3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                                        title="Sumar 1 punto"
                                      >
                                        +1
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateTeamScore(t.id, t.score, 5)}
                                        style={{ padding: '3px 6px', background: '#15803d', border: 'none', color: '#bbf7d0', borderRadius: '0', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                                        title="Sumar 5 puntos"
                                      >
                                        +5
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateTeamScore(t.id, t.score, 10)}
                                        style={{ padding: '3px 6px', background: '#166534', border: 'none', color: '#bbf7d0', borderRadius: '0 3px 3px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                                        title="Sumar 10 puntos"
                                      >
                                        +10
                                      </button>
                                    </div>

                                    {/* MÓDULO ARBITRARIO: Permite ingresar cualquier valor manual */}
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#262626', borderRadius: '4px', border: '1px solid #444', padding: '2px' }}>
                                      <input
                                        type="number"
                                        placeholder="Cant."
                                        value={arbitraryInputs[t.id] || ''}
                                        onChange={(e) => setArbitraryInputs({ ...arbitraryInputs, [t.id]: e.target.value })}
                                        style={{ 
                                          width: '50px', 
                                          background: 'transparent', 
                                          border: 'none', 
                                          color: '#fff', 
                                          fontSize: '0.8rem', 
                                          padding: '2px 4px',
                                          textAlign: 'center',
                                          outline: 'none'
                                        }}
                                      />
                                      <button
                                        onClick={() => {
                                          const customValue = Math.abs(parseInt(arbitraryInputs[t.id] || '0', 10));
                                          if (customValue > 0) {
                                            handleUpdateTeamScore(t.id, t.score, customValue);
                                            setArbitraryInputs({ ...arbitraryInputs, [t.id]: '' });
                                          }
                                        }}
                                        disabled={!arbitraryInputs[t.id] || parseInt(arbitraryInputs[t.id], 10) === 0}
                                        style={{ padding: '3px 6px', background: '#0284c7', border: 'none', color: '#fff', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', marginRight: '2px' }}
                                        title="Sumar cantidad arbitraria"
                                      >
                                        +
                                      </button>
                                      <button
                                        onClick={() => {
                                          const customValue = Math.abs(parseInt(arbitraryInputs[t.id] || '0', 10));
                                          if (customValue > 0) {
                                            handleUpdateTeamScore(t.id, t.score, -customValue);
                                            setArbitraryInputs({ ...arbitraryInputs, [t.id]: '' });
                                          }
                                        }}
                                        disabled={!arbitraryInputs[t.id] || parseInt(arbitraryInputs[t.id], 10) === 0}
                                        style={{ padding: '3px 6px', background: '#ea580c', border: 'none', color: '#fff', borderRadius: '2px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                                        title="Restar cantidad arbitraria"
                                      >
                                        -
                                      </button>
                                    </div>

                                    {/* Botón de configuración Inline */}
                                    <button 
                                      onClick={() => startEditingTeam(t.id, t.name, t.color)}
                                      style={{ padding: '4px 8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                      ✏️ Propiedades
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#555', fontSize: '0.85rem' }}>No hay equipos en esta sala.</span>
                      )}
                    </div>

                    {/* Formulario Inline para fundar un nuevo Equipo */}
                    <form onSubmit={(e) => onSubmitTeam(e, party.id)} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Nombre del nuevo equipo (Ej: Alfas, Külche...)"
                        value={teamInputs[party.id] || ''}
                        onChange={(e) => setTeamInputs({ ...teamInputs, [party.id]: e.target.value })}
                        disabled={isSubmittingTeam[party.id]}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#262626', color: '#fff', fontSize: '0.85rem', flex: 1 }}
                      />
                      <button 
                        type="submit" 
                        disabled={isSubmittingTeam[party.id] || !teamInputs[party.id]?.trim()} 
                        style={{ padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        {isSubmittingTeam[party.id] ? 'Añadiendo...' : '➕ Añadir'}
                      </button>
                    </form>
                  </div>

                  {/* Listado de Miembros de la Sala */}
                  <h4>Jugadores Inscritos ({members.length})</h4>
                  {members.length === 0 ? (
                    <p style={{ color: '#777', fontSize: '0.9rem', fontStyle: 'italic' }}>Sala vacía sin jugadores aún.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px', fontSize: '0.95rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #444', color: '#aaa' }}>
                          <th style={{ padding: '8px' }}>Jugador</th>
                          <th style={{ padding: '8px' }}>Equipo (Modificar Asignación)</th>
                          <th style={{ padding: '8px' }}>Rol</th>
                          <th style={{ padding: '8px' }}>Ptos Indiv.</th>
                          <th style={{ padding: '8px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #2a2a2a' }}>
                            <td style={{ padding: '8px', fontWeight: '500' }}>{member.players?.name || 'Anónimo'}</td>
                            
                            <td style={{ padding: '8px' }}>
                              <select
                                value={member.teams?.id || ''}
                                onChange={(e) => member.players && handleUpdatePlayerTeam(member.players.id, e.target.value || null)}
                                style={{ 
                                  padding: '4px 8px', 
                                  backgroundColor: '#262626', 
                                  color: member.teams?.color || '#fff', 
                                  border: '1px solid #444', 
                                  borderRadius: '4px', 
                                  fontSize: '0.85rem',
                                  fontWeight: member.teams?.name ? 'bold' : 'normal'
                                }}
                              >
                                <option value="" style={{ color: '#aaa' }}>-- Ninguno (Sin Equipo) --</option>
                                {party.teams && party.teams.map((t) => (
                                  <option key={t.id} value={t.id} style={{ color: t.color, fontWeight: 'bold' }}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td style={{ padding: '8px', color: '#fb923c' }}>
                              {ROLE_LABELS[member.role || ''] || member.role || 'Sin Rol'}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{member.individual_score}</td>
                            <td style={{ padding: '8px' }}>
                              <button onClick={() => member.players && handleKickPlayer(member.players.id)} style={{ padding: '4px 8px', background: '#eab308', border: 'none', color: '#000', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                🚪 Echar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}