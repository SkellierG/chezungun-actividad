import { supabase } from '../utils/supabase'
import type { PlayerSession } from '../App'

interface PartyGameScreenProps {
  player: PlayerSession
  setPlayer: React.Dispatch<React.SetStateAction<PlayerSession | null>>
}

export default function PartyGameScreen({ player, setPlayer }: PartyGameScreenProps) {
  
  const handleLeaveParty = async () => {
    if (!player) return
    await supabase.from('player_parties').delete().eq('player_id', player.id)
    setPlayer({ ...player, player_parties: null })
  }

  return (
    <div className="App">
      <div style={{ background: '#2e7d32', color: 'white', padding: '15px', borderRadius: '4px' }}>
        <h2>Estás en la Sala: {player.player_parties?.parties.code}</h2>
      </div>

      <div style={{ margin: '20px 0' }}>
        <p><strong>Jugador activo:</strong> {player.name}</p>
        <p><strong>ID de sesión:</strong> <code>{player.code_players?.code}</code></p>
      </div>

      <div style={{ padding: '30px', border: '2px dashed #2e7d32', margin: '30px 0' }}>
        <h3>[ Pantalla del Juego de Turnos ]</h3>
        <p>Aquí irá toda la lógica interactiva cuando los jugadores ya están en la partida.</p>
      </div>

      <button onClick={handleLeaveParty} style={{ background: '#d32f2f', color: 'white' }}>
        Salir de la Party
      </button>
    </div>
  )
}