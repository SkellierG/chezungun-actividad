// skellierg/chezungun-actividad/cliente-chezungun/src/screens/JoinPartyScreen.tsx
import React, { useState } from 'react'
import { supabase } from '../utils/supabase'
import type { PlayerSession } from '../App'

interface JoinPartyScreenProps {
  player: PlayerSession
  setPlayer: React.Dispatch<React.SetStateAction<PlayerSession | null>>
}

export default function JoinPartyScreen({ player, setPlayer }: JoinPartyScreenProps) {
  const [partyCodeInput, setPartyCodeInput] = useState('')

  const handleJoinParty = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = partyCodeInput.trim().toUpperCase()
    if (!code || !player) return

    // 1. Buscamos si la party ya existe
    let { data: party } = await supabase
      .from('parties')
      .select('id, code')
      .eq('code', code)
      .maybeSingle()

    // 2. Si no existe, cancelamos
    if (!party) {
      alert(`La sala con código "${code}" no existe.`);
      return;
    }

    // 3. Insertamos la relación en la tabla intermedia (player_parties)
    await supabase.from('player_parties').delete().eq('player_id', player.id)

    const { error: joinError } = await supabase
      .from('player_parties')
      .insert([{ player_id: player.id, party_id: party.id }])

    if (!joinError) {
      // Seteamos el estado local emulando la respuesta relacional exacta y respetando la interfaz PlayerSession
      setPlayer({
        ...player,
        player_parties: {
          party_id: party.id,
          team_id: null,
          role: 'player', // Valor por defecto en la Base de Datos
          individual_score: 0, // Valor por defecto en la Base de Datos
          parties: {
            code: party.code,
            id: '',
            game_stage: '',
            game_duration_seconds: null,
            stage_started_at: null
          },
          teams: null // Inicia sin equipo asignado
          ,
          game_status: 'waiting'
        }
      })
    } else {
      alert('No se pudo unir a la sala')
    }
  }

  return (
    <div className="App">
      <h2>Hola, {player.name}</h2>
      <p>Tu código de sesión (Apartado): <code>{player.code_players?.code}</code></p>
      
      <div style={{ marginTop: '25px', border: '1px solid #555', padding: '20px', borderRadius: '6px' }}>
        <h3>Unirse a una Sala / Party</h3>
        <form onSubmit={handleJoinParty}>
          <input
            type="text"
            placeholder="Código de Party (Ej: ROOM99)"
            value={partyCodeInput}
            onChange={(e) => setPartyCodeInput(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  )
}