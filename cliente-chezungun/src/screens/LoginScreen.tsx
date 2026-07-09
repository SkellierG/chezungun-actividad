import React, { useState } from 'react'
import { supabase } from '../utils/supabase'
import DeviceStorage from '../utils/localstorage'
import type { PlayerSession } from '../App'

interface LoginScreenProps {
  setPlayer: React.Dispatch<React.SetStateAction<PlayerSession | null>>
}

export default function LoginScreen({ setPlayer }: LoginScreenProps) {
  const [playerNameInput, setPlayerNameInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerNameInput.trim() || isSubmitting) return

    setIsSubmitting(true)

    // 1. Crear el registro del jugador en la tabla 'players'
    const { data: newPlayer, error: playerError } = await supabase
      .from('players')
      .insert([{ name: playerNameInput.trim() }])
      .select('id, name')
      .single()

    if (playerError || !newPlayer) {
      setIsSubmitting(false)
      return alert('Error creando el perfil de jugador')
    }

    // 2. Generar el código único para este jugador y guardarlo en la tabla 'code_players'
    const uniquePlayerCode = 'plyr_' + Math.random().toString(36).substring(2, 11)

    const { error: codeError } = await supabase
      .from('code_players')
      .insert([{ code: uniquePlayerCode, player_id: newPlayer.id }])

    if (codeError) {
      setIsSubmitting(false)
      return alert('Error asignando código único al jugador')
    }

    // 3. Guardar el código en LocalStorage e inicializar el estado global
    DeviceStorage.setItem('code', uniquePlayerCode)
    
    setPlayer({
      id: newPlayer.id,
      name: newPlayer.name,
      code_players: { code: uniquePlayerCode },
      player_parties: null // Al ser nuevo, entra sin sala asignada (pasará a Vista B)
    })
    
    setIsSubmitting(false)
  }

  return (
    <div className="App">
      <h2>Ingreso al Juego</h2>
      <form onSubmit={handleRegisterPlayer}>
        <input
          type="text"
          placeholder="Tu Nombre o Nickname"
          value={playerNameInput}
          onChange={(e) => setPlayerNameInput(e.target.value)}
          disabled={isSubmitting}
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Cuenta'}
        </button>
      </form>
    </div>
  )
}