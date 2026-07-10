import React from 'react'
import type { GlobalPlayer, AdminParty } from '../types/db'

interface PlayersTabProps {
  fetchAllPlayers: () => Promise<void>;
  loadingPlayers: boolean;
  allPlayers: GlobalPlayer[];
  editingPlayerId: string | null;
  setEditingPlayerId: (id: string | null) => void;
  editNameInput: string;
  setEditNameInput: (val: string) => void;
  editRoleInput: string;
  setEditRoleInput: (val: string) => void;
  editTeamInput: string;
  setEditTeamInput: (val: string) => void;
  parties: AdminParty[];
  selectedPartyForPlayer: Record<string, string>;
  setSelectedPartyForPlayer: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  startEditing: (player: GlobalPlayer, currentRole: string, currentTeamId: string) => void;
  handleUpdatePlayer: (playerId: string, hasActiveParty: boolean) => Promise<void>;
  handleDeletePlayer: (playerId: string) => Promise<void>;
  handleKickPlayer: (playerId: string) => Promise<void>;
  handleForceJoinParty: (playerId: string) => Promise<void>;
}

export default function PlayersTab({
  fetchAllPlayers,
  loadingPlayers,
  allPlayers,
  editingPlayerId,
  setEditingPlayerId,
  editNameInput,
  setEditNameInput,
  editRoleInput,
  setEditRoleInput,
  editTeamInput,
  setEditTeamInput,
  parties,
  selectedPartyForPlayer,
  setSelectedPartyForPlayer,
  startEditing,
  handleUpdatePlayer,
  handleDeletePlayer,
  handleKickPlayer,
  handleForceJoinParty
}: PlayersTabProps) {
  
  function hasActivePartyObj(activePartyObj: any): boolean {
    return !!(activePartyObj && activePartyObj.party_id);
  }

  return (
    <section style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Directorio Centralizado de Jugadores</h3>
        <button onClick={fetchAllPlayers} style={{ padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
          🔄 Actualizar Listado
        </button>
      </div>

      {loadingPlayers ? (
        <p>Consultando base de datos central de jugadores...</p>
      ) : allPlayers.length === 0 ? (
        <p style={{ color: '#aaa' }}>No se han registrado jugadores en el sistema todavía.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #444', color: '#aaa' }}>
              <th style={{ padding: '12px 8px' }}>Nombre Jugador</th>
              <th style={{ padding: '12px 8px' }}>Sala / Rol / Equipo</th>
              <th style={{ padding: '12px 8px' }}>Forzar Entrada a Sala</th>
              <th style={{ padding: '12px 8px' }}>Acciones de Control</th>
            </tr>
          </thead>
          <tbody>
            {allPlayers.map((player) => {
              const rawParty = player.player_parties
              const activePartyObj: any = Array.isArray(rawParty) ? rawParty[0] : rawParty
              
              const currentPartyCode = activePartyObj?.parties?.code
              const currentRole = activePartyObj?.role || 'Sin Rol'
              const currentTeamId = activePartyObj?.team_id || ''
              const currentTeamName = activePartyObj?.teams?.name || 'Ninguno'
              
              const isEditing = editingPlayerId === player.id

              return (
                <tr key={player.id} style={{ borderBottom: '1px solid #2a2a2a', backgroundColor: isEditing ? '#2d2d2d' : 'transparent' }}>
                  
                  {/* COLUMNA 1: NOMBRE */}
                  <td style={{ padding: '12px 8px' }}>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editNameInput} 
                        onChange={(e) => setEditNameInput(e.target.value)} 
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #0284c7', backgroundColor: '#444', color: '#fff', width: '90%' }}
                      />
                    ) : (
                      <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                    )}
                  </td>

                  {/* COLUMNA 2: METADATA Y SELECCIÓN DE ROLES/EQUIPOS */}
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div>
                        {currentPartyCode ? (
                          <span style={{ background: '#14532d', color: '#4ade80', padding: '3px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            Sala: {currentPartyCode}
                          </span>
                        ) : (
                          <span style={{ background: '#78350f', color: '#fcd34d', padding: '3px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                            En Lobby (Sin Sala)
                          </span>
                        )}
                      </div>
                      
                      {isEditing ? (
                        hasActivePartyObj(activePartyObj) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                            
                            <select
                              value={editRoleInput}
                              onChange={(e) => setEditRoleInput(e.target.value)}
                              style={{ padding: '4px', backgroundColor: '#444', color: '#fff', border: '1px solid #0284c7', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                              <option value="Jugador">Jugador Normal</option>
                              <option value="Líder de Equipo">Líder de Equipo (Capitán)</option>
                              <option value="Espectador">Espectador Pasivo</option>
                              <option value="Moderador de Campo">Moderador (Dummy)</option>
                              <option value="Especialista Técnico">Especialista (Dummy)</option>
                            </select>

                            <select
                              value={editTeamInput}
                              onChange={(e) => setEditTeamInput(e.target.value)}
                              style={{ padding: '4px', backgroundColor: '#444', color: '#fff', border: '1px solid #0284c7', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                              <option value="">-- Ningún Equipo --</option>
                              {(() => {
                                const matchingParty = parties.find(p => p.id === activePartyObj?.party_id)
                                const availableTeams = matchingParty?.teams || []
                                const teamsList = Array.isArray(availableTeams) ? availableTeams : [availableTeams]
                                
                                return teamsList.map((t: any) => t && (
                                  <option key={t.id} value={t.id}>Facc: {t.name}</option>
                                ))
                              })()}
                            </select>

                          </div>
                        ) : (
                          <span style={{ color: '#aaa', fontSize: '0.85rem', fontStyle: 'italic' }}>Une al jugador a una sala para darle rol y equipo.</span>
                        )
                      ) : (
                        <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#fb923c' }}>Rol: {currentRole}</span>
                          <span style={{ color: '#4ade80' }}>Equipo: {currentTeamName}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* COLUMNA 3: REUBICACIÓN */}
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <select
                        value={selectedPartyForPlayer[player.id] || ''}
                        onChange={(e) => setSelectedPartyForPlayer({ ...selectedPartyForPlayer, [player.id]: e.target.value })}
                        disabled={isEditing}
                        style={{ padding: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', fontSize: '0.85rem' }}
                      >
                        <option value="">-- Mover a... --</option>
                        {parties.map(p => (
                          <option key={p.id} value={p.id}>Sala: {p.code}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleForceJoinParty(player.id)}
                        disabled={isEditing}
                        style={{ padding: '4px 8px', background: '#0284c7', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Mover
                      </button>
                    </div>
                  </td>

                  {/* COLUMNA 4: ACCIONES */}
                  <td style={{ padding: '12px 8px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleUpdatePlayer(player.id, hasActivePartyObj(activePartyObj))}
                          style={{ padding: '6px 10px', background: '#22c55e', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          💾 Guardar
                        </button>
                        <button
                          onClick={() => setEditingPlayerId(null)}
                          style={{ padding: '6px 10px', background: '#4b5563', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => startEditing(player, currentRole, currentTeamId)}
                          style={{ padding: '4px 8px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          ✏️ Editar
                        </button>
                        {currentPartyCode && (
                          <button
                            onClick={() => handleKickPlayer(player.id)}
                            style={{ padding: '4px 8px', background: '#ea580c', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Echar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          style={{ padding: '4px 8px', background: '#b91c1c', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}