import { supabase } from '../utils/supabase'
import type { PlayerSession } from '../App'
import FloatingScoreboard from '../components/FLoatingScoreboard'

interface PartyGameScreenProps {
  player: PlayerSession
  setPlayer: React.Dispatch<React.SetStateAction<PlayerSession | null>>
}

// Diccionario local amigable para mostrar los roles sin las minúsculas puras de la DB
const ROLE_LABELS: Record<string, string> = {
  jugador: 'Jugador Normal',
  lider: 'Líder de Equipo',
  fraile: 'Fraile',
  diplomatico: 'Diplomático'
}

export default function PartyGameScreen({ player, setPlayer }: PartyGameScreenProps) {
  
  const handleLeaveParty = async () => {
    if (!player) return
    if (!confirm('¿Seguro que deseas abandonar la sala de juego actual?')) return
    
    await supabase.from('player_parties').delete().eq('player_id', player.id)
    setPlayer({ ...player, player_parties: null })
  }

  // Desestructuración segura de la sesión relacional
  const activeParty = player.player_parties
  const roomCode = activeParty?.parties?.code || '---'
  const rawRole = activeParty?.role || 'jugador'
  const roleLabel = ROLE_LABELS[rawRole] || rawRole
  const individualScore = activeParty?.individual_score ?? 0
  
  const teamName = activeParty?.teams?.name || 'Ninguno (Sin Grupo)'
  const teamScore = activeParty?.teams?.score ?? 0
  // Leemos el color físico del equipo si el admin ya lo configuró en la base de datos
  const teamColor = (activeParty?.teams as any)?.color || '#3b82f6' 

  return (
    <div className="App" style={{ paddingTop: '100px', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* =========================================================
          📊 INTERFAZ DASHBOARD DE SESIÓN SUPERIOR (SIEMPRE VISIBLE)
         ========================================================= */}
      <header 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          background: '#1a1a1a',
          color: '#fff',
          padding: '12px 20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          borderBottom: `4px solid ${activeParty?.team_id ? teamColor : '#444'}`,
          zIndex: 900,
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          {/* Bloque Identidad del Cliente */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#fff' }}>
              {player.name}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#fb923c', fontWeight: '500' }}>
              🛡️ {roleLabel}
            </span>
          </div>

          {/* Bloque Sala Activa */}
          <div style={{ background: '#222', padding: '6px 12px', borderRadius: '6px', border: '1px solid #333', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#aaa', uppercase: 'true' }}>SALA ACTIVA</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '1px' }}>{roomCode}</span>
          </div>

          {/* Bloque Escuadra/Equipo Asignado */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', minWidth: '120px' }}>
            <span style={{ fontSize: '0.75rem', color: '#aaa' }}>EQUIPO ACTUAL</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: activeParty?.team_id ? teamColor : '#9ca3af' }}>
              {teamName}
            </span>
          </div>

          {/* Bloque Marcadores de Puntuación */}
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

      {/* =========================================================
          🎮 CONTENIDO PRINCIPAL DE LA PANTALLA DE JUEGO
         ========================================================= */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        
        <div style={{ padding: '30px', border: '2px dashed #2e7d32', margin: '30px 0', borderRadius: '8px', background: 'rgba(46, 125, 50, 0.05)' }}>
          <h3 style={{ color: '#4ade80', marginTop: 0 }}>[ Pantalla del Juego de Turnos ]</h3>
          <p style={{ color: '#ccc' }}>Aquí irá toda la lógica interactiva cuando los jugadores ya están en la partida.</p>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '15px' }}>
            Código único de dispositivo: <code>{player.code_players?.code || 'No disponible'}</code>
          </div>
        </div>

        <button 
          onClick={handleLeaveParty} 
          style={{ 
            background: '#d32f2f', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#b71c1c')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#d32f2f')}
        >
          Salir de la Party
        </button>

      </main>

      {/* COMPONENTE INTERACTIVO DE POSICIONES (FLOTANTE ABAJO A LA DERECHA) */}
      <FloatingScoreboard 
        currentPartyId={activeParty?.party_id} 
        clientPlayerId={player.id} 
      />

    </div>
  )
}