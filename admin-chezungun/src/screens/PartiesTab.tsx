import React, { useState } from 'react'
import type { AdminParty, AdminPlayerParties } from '../types/db'

interface PartiesTabProps {
  newPartyCode: string;
  setNewPartyCode: (val: string) => void;
  isSubmitting: boolean;
  handleCreateParty: (e: React.FormEvent) => Promise<void>;
  fetchAllParties: () => Promise<void>;
  loading: boolean;
  parties: AdminParty[];
  handleKickPlayer: (playerId: string) => Promise<void>;
  // NUEVA PROP: Manejador para insertar el equipo en la DB mediante el orquestador principal
  handleCreateTeam: (partyId: string, teamName: string) => Promise<void>;
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
  handleCreateTeam
}: PartiesTabProps) {
  // ESTADO LOCAL: Maneja los inputs de texto de los equipos mapeados por el ID de la sala
  const [teamInputs, setTeamInputs] = useState<Record<string, string>>({})
  const [isSubmittingTeam, setIsSubmittingTeam] = useState<Record<string, boolean>>({})

  const onSubmitTeam = async (e: React.FormEvent, partyId: string) => {
    e.preventDefault()
    const teamName = teamInputs[partyId]?.trim()
    if (!teamName) return

    try {
      setIsSubmittingTeam(prev => ({ ...prev, [partyId]: true }))
      await handleCreateTeam(partyId, teamName)
      // Limpiamos el input de esta sala tras el éxito
      setTeamInputs(prev => ({ ...prev, [partyId]: '' }))
    } catch (error) {
      console.error("Error creando equipo en la UI:", error)
    } finally {
      setIsSubmittingTeam(prev => ({ ...prev, [partyId]: false }))
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

                  {/* NUEVA SECCIÓN: Gestión e Inserción de Equipos inline */}
                  <div style={{ background: '#161616', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #222' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#4ade80', fontSize: '0.95rem' }}>🛡️ Gestión de Equipos</h5>
                    
                    {/* Lista rápida de escuadras vigentes */}
                    <div style={{ marginBottom: '10px', fontSize: '0.85rem', color: '#aaa' }}>
                      <span style={{ fontWeight: 'bold' }}>Equipos actuales: </span>
                      {party.teams && party.teams.length > 0 ? (
                        party.teams.map((t, idx) => (
                          <span key={t.id} style={{ background: '#222', padding: '3px 8px', borderRadius: '4px', marginRight: '5px', border: '1px solid #333' }}>
                            {t.name} ({t.score} pts)
                          </span>
                        ))
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#555' }}>No hay equipos en esta sala.</span>
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
                          <th style={{ padding: '8px' }}>Equipo</th>
                          <th style={{ padding: '8px' }}>Rol</th>
                          <th style={{ padding: '8px' }}>Ptos Indiv.</th>
                          <th style={{ padding: '8px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #2a2a2a' }}>
                            <td style={{ padding: '8px', fontWeight: '500' }}>{member.players?.name || 'Anónimo'}</td>
                            <td style={{ padding: '8px', color: member.teams?.name ? '#4ade80' : '#aaa' }}>{member.teams?.name || 'Ninguno'}</td>
                            <td style={{ padding: '8px', color: '#fb923c' }}>{member.role || 'Sin Rol'}</td>
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