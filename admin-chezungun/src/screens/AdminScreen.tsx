import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import type { AdminParty, GlobalPlayer } from '../types/db'
import PartiesTab from './PartiesTab'
import PlayersTab from './PlayersTab'
import FloatingScoreboard from '../components/FLoatingScoreboard'

export default function AdminScreen() {
  // Estados de salas y carga
  const [parties, setParties] = useState<AdminParty[]>([])
  const [loading, setLoading] = useState(true)
  const [newPartyCode, setNewPartyCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Gestión de Jugadores y Pestañas
  const [activeTab, setActiveTab] = useState<'parties' | 'players'>('parties')
  const [allPlayers, setAllPlayers] = useState<GlobalPlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [selectedPartyForPlayer, setSelectedPartyForPlayer] = useState<Record<string, string>>({})

  // Estados para control de Edición Inline de Jugadores (Pestaña Players)
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editNameInput, setEditNameInput] = useState('')
  const [editRoleInput, setEditRoleInput] = useState('')
  const [editTeamInput, setEditTeamInput] = useState('')

  // 1. Traer salas con sus equipos
  const fetchAllParties = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parties')
        .select(`
          id,
          code,
          created_at,
          teams ( id, name, color, score ),
          player_parties (
            role,
            individual_score,
            players (id, name),
            teams (id, name, color, score)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setParties(data || [])
    } catch (error) {
      console.error('Error cargando panel de admin:', error)
      alert('Error al traer los datos globales de las partidas.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Traer todos los jugadores globales
  const fetchAllPlayers = async () => {
    setLoadingPlayers(true)
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          name,
          created_at,
          code_players ( code ),
          player_parties (
            party_id,
            role,
            team_id,
            parties ( code ),
            teams ( id, name, color )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllPlayers(data || [])
    } catch (error) {
      console.error('Error cargando jugadores globales:', error)
      alert('Error al traer la lista global de jugadores.')
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

  // Crear sala
  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault()
    let code = newPartyCode.trim().toUpperCase()
    if (!code) {
      code = 'ROOM_' + Math.random().toString(36).substring(2, 7).toUpperCase()
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('parties').insert([{ code }])
      if (error) {
        if (error.code === '23505') return alert('Ese código de Party ya existe.')
        throw error
      }
      setNewPartyCode('')
      alert(`¡Sala "${code}" creada con éxito!`)
      fetchAllParties() 
    } catch (error) {
      console.error(error)
      alert('No se pudo crear la sala.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Activar el modo edición para una fila específica (Pestaña Jugadores)
  const startEditing = (player: GlobalPlayer, currentRole: string, currentTeamId: string) => {
    setEditingPlayerId(player.id)
    setEditNameInput(player.name)
    setEditRoleInput(currentRole)
    setEditTeamInput(currentTeamId)
  }

  // Guardar cambios inline (Pestaña Jugadores)
  const handleUpdatePlayer = async (playerId: string, hasActiveParty: boolean) => {
    if (!editNameInput.trim()) return alert('El nombre no puede estar vacío.')

    try {
      const { error: playerError } = await supabase
        .from('players')
        .update({ name: editNameInput.trim() })
        .eq('id', playerId)

      if (playerError) throw playerError

      if (hasActiveParty) {
        const { error: roleError } = await supabase
          .from('player_parties')
          .update({ 
            role: editRoleInput,
            team_id: editTeamInput || null
          })
          .eq('player_id', playerId)

        if (roleError) throw roleError
      }

      alert('Cambios guardados con éxito.')
      setEditingPlayerId(null)
      fetchAllPlayers()
      fetchAllParties()
    } catch (error) {
      console.error(error)
      alert('Error al intentar guardar las modificaciones del jugador.')
    }
  }

  // Eliminar por completo a un jugador
  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('¿Estás seguro de eliminar permanentemente a este jugador? Se borrará su sesión de raíz.')) return
    try {
      await supabase.from('player_parties').delete().eq('player_id', playerId)
      await supabase.from('code_players').delete().eq('player_id', playerId)
      const { error } = await supabase.from('players').delete().eq('id', playerId)
      if (error) throw error

      alert('Jugador eliminado con éxito.')
      fetchAllPlayers()
    } catch (error) {
      console.error(error)
      alert('Error al intentar eliminar al jugador.')
    }
  }

  // Echar / Expulsar de la sala
  const handleKickPlayer = async (playerId: string) => {
    if (!confirm('¿Quieres expulsar a este jugador de su sala actual?')) return
    try {
      const { error } = await supabase.from('player_parties').delete().eq('player_id', playerId)
      if (error) throw error

      alert('Jugador expulsado de la sala.')
      if (activeTab === 'players') fetchAllPlayers(); else fetchAllParties();
    } catch (error) {
      console.error(error)
      alert('No se pudo expulsar al jugador.')
    }
  }

  // Forzar cambio o unión de sala
  const handleForceJoinParty = async (playerId: string) => {
    const targetPartyId = selectedPartyForPlayer[playerId]
    if (!targetPartyId) return alert('Por favor, selecciona una sala primero.')

    try {
      await supabase.from('player_parties').delete().eq('player_id', playerId)
      const { error } = await supabase.from('player_parties').insert([
        { 
          player_id: playerId, 
          party_id: targetPartyId,
          role: 'jugador',
          team_id: null,
          individual_score: 0 
        }
      ])
      if (error) throw error

      alert('Jugador reubicado con éxito.')
      fetchAllPlayers()
    } catch (error) {
      console.error(error)
      alert('Error al forzar la unión a la sala.')
    }
  }

  // Fundar un nuevo equipo
  const handleCreateTeam = async (partyId: string, teamName: string) => {
    const { error } = await supabase
      .from('teams')
      .insert([{ party_id: partyId, name: teamName, score: 0 }])

    if (error) {
      alert('Error al fundar el equipo en la base de datos')
      throw error
    }
    await fetchAllParties()
  }

  // NUEVA ACCIÓN: Modificar nombre y color del equipo
  const handleUpdateTeam = async (teamId: string, name: string, color: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: name.trim(), color: color.trim() })
        .eq('id', teamId)

      if (error) throw error
      await fetchAllParties()
    } catch (error) {
      console.error(error)
      alert('Error al actualizar las propiedades del equipo.')
    }
  }

  // NUEVA ACCIÓN: Añadir o quitar puntos a un equipo de forma reactiva
  const handleUpdateTeamScore = async (teamId: string, currentScore: number, delta: number) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ score: Math.max(0, currentScore + delta) }) // Previene puntajes negativos si lo deseas
        .eq('id', teamId)

      if (error) throw error
      await fetchAllParties()
    } catch (error) {
      console.error(error)
      alert('Error al modificar la puntuación de la escuadra.')
    }
  }

  // NUEVA ACCIÓN: Asignar o remover gente de un equipo directamente desde esta pestaña
  const handleUpdatePlayerTeam = async (playerId: string, teamId: string | null) => {
    try {
      const { error } = await supabase
        .from('player_parties')
        .update({ team_id: teamId })
        .eq('player_id', playerId)

      if (error) throw error
      await fetchAllParties()
    } catch (error) {
      console.error(error)
      alert('Error al reasignar el equipo del jugador.')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff' }}>
      <h2>Panel de Administración Global</h2>
      <p style={{ color: '#aaa' }}>Crea salas y monitorea jugadores, equipos y puntajes en tiempo real.</p>
      
      {/* Pestañas de Navegación */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <button 
          onClick={() => setActiveTab('parties')} 
          style={{ padding: '10px 20px', background: activeTab === 'parties' ? '#0284c7' : '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🏰 Salas Activas ({parties.length})
        </button>
        <button 
          onClick={() => setActiveTab('players')} 
          style={{ padding: '10px 20px', background: activeTab === 'players' ? '#0284c7' : '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          👥 Todos los Jugadores ({allPlayers.length})
        </button>
      </div>

      <hr style={{ borderColor: '#444', margin: '20px 0' }} />

      {activeTab === 'parties' ? (
        <PartiesTab
          newPartyCode={newPartyCode}
          setNewPartyCode={setNewPartyCode}
          isSubmitting={isSubmitting}
          handleCreateParty={handleCreateParty}
          fetchAllParties={fetchAllParties}
          loading={loading}
          parties={parties}
          handleKickPlayer={handleKickPlayer}
          handleCreateTeam={handleCreateTeam}
          handleUpdateTeam={handleUpdateTeam}
          handleUpdateTeamScore={handleUpdateTeamScore}
          handleUpdatePlayerTeam={handleUpdatePlayerTeam}
        />
      ) : (
        <PlayersTab
          fetchAllPlayers={fetchAllPlayers}
          loadingPlayers={loadingPlayers}
          allPlayers={allPlayers}
          editingPlayerId={editingPlayerId}
          setEditingPlayerId={setEditingPlayerId}
          editNameInput={editNameInput}
          setEditNameInput={setEditNameInput}
          editRoleInput={editRoleInput}
          setEditRoleInput={setEditRoleInput}
          editTeamInput={editTeamInput}
          setEditTeamInput={setEditTeamInput}
          parties={parties}
          selectedPartyForPlayer={selectedPartyForPlayer}
          setSelectedPartyForPlayer={setSelectedPartyForPlayer}
          startEditing={startEditing}
          handleUpdatePlayer={handleUpdatePlayer}
          handleDeletePlayer={handleDeletePlayer}
          handleKickPlayer={handleKickPlayer}
          handleForceJoinParty={handleForceJoinParty}
        />
      )}

      {/* COMPONENTE INTERACTIVO SIEMPRE VISIBLE PARA EL ADMIN */}
      <FloatingScoreboard 
        availableParties={parties} 
      />
    </div>
  )
}