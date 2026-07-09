import { useState, useEffect } from 'react'
import DeviceStorage from './utils/localstorage'
import { supabase } from './utils/supabase'
import './App.css'

interface PlayerSession {
  id: string;
  name: string;
  code_players?: {
    code: string;
  } | null;
  player_parties?: {
    party_id: string;
    parties: {
      code: string;
    }
  } | null;
}

function App() {
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState<PlayerSession | null>(null)
  
  // Inputs de formularios
  const [playerNameInput, setPlayerNameInput] = useState('')
  const [partyCodeInput, setPartyCodeInput] = useState('')

  // Efecto inicial: Buscar sesión existente mediante el código en LocalStorage
  useEffect(() => {
    async function fetchSession() {
      const savedCode = DeviceStorage.getItem('code', 'string') as string | undefined;

      if (savedCode) {
        // Consultamos la tabla code_players y anidamos los datos del jugador y su sala activa
        const { data, error } = await supabase
          .from('code_players')
          .select(`
            code,
            players (
              id,
              name,
              player_parties (
                party_id,
                parties (
                  code
                )
              )
            )
          `)
          .eq('code', savedCode)
          .maybeSingle();

        if (data && data.players && !error) {
          const playerData = data.players as any;
          
          // Como player_parties es una relación de uno a uno en la práctica, 
          // nos aseguramos de guardarlo como objeto (si viene como array de la consulta, tomamos el primero)
          const rawParty = playerData.player_parties;
          const activeParty = Array.isArray(rawParty) ? rawParty[0] : rawParty;

          setPlayer({
            id: playerData.id,
            name: playerData.name,
            code_players: { code: data.code },
            player_parties: activeParty || null
          })
        } else {
          // Si el código del almacenamiento local ya no existe en el servidor, limpiamos
          DeviceStorage.removeItem('code')
        }
      }
      setLoading(false)
    }

    fetchSession()
  }, [])

  // Paso 1: Crear perfil del jugador y su código apartado (Dashboard Inicial)
  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerNameInput.trim()) return

    // 1. Crear el registro del jugador en la tabla 'players'
    const { data: newPlayer, error: playerError } = await supabase
      .from('players')
      .insert([{ name: playerNameInput }])
      .select('id, name')
      .single()

    if (playerError || !newPlayer) {
      return alert('Error creando el perfil de jugador')
    }

    // 2. Generar el código único para este jugador y guardarlo en la tabla 'code_players'
    const uniquePlayerCode = 'plyr_' + Math.random().toString(36).substring(2, 11)

    const { error: codeError } = await supabase
      .from('code_players')
      .insert([{ code: uniquePlayerCode, player_id: newPlayer.id }])

    if (codeError) {
      return alert('Error asignando código único al jugador')
    }

    // 3. Guardar el código en LocalStorage e inicializar el estado del usuario
    DeviceStorage.setItem('code', uniquePlayerCode)
    setPlayer({
      id: newPlayer.id,
      name: newPlayer.name,
      code_players: { code: uniquePlayerCode },
      player_parties: null
    })
  }

  // Paso 2: Unirse a una sala utilizando la tabla intermedia
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
      // Seteamos el estado local emulando la respuesta relacional exacta que necesitas
      setPlayer({
        ...player,
        player_parties: {
          party_id: party.id,
          parties: { code: party.code }
        }
      })
    } else {
      alert('No se pudo unir a la sala')
    }
  }

  // Abandonar la sala actual
  const handleLeaveParty = async () => {
    if (!player) return
    await supabase.from('player_parties').delete().eq('player_id', player.id)
    setPlayer({ ...player, player_parties: null })
  }

  if (loading) return <div className="App"><h3>Cargando juego...</h3></div>

  // Monitoreo seguro de estados en consola
  console.log('Estado del jugador:', JSON.stringify(player))
  if (player?.player_parties) {
    console.log('Código de Party Directo:', player.player_parties.parties.code);
  }

  // Condición limpia para saber si está en sala o no
  const isInParty = player?.player_parties !== null && player?.player_parties !== undefined;

  // --- RENDERS CONDICIONALES (VISTAS AUTOMÁTICAS DESDE ROOT) ---

  // VISTA A: Registro / Dashboard de bienvenida (No hay código de sesión válido)
  if (!player) {
    return (
      <div className="App">
        <h2>Ingreso al Juego</h2>
        <form onSubmit={handleRegisterPlayer}>
          <input
            type="text"
            placeholder="Tu Nombre o Nickname"
            value={playerNameInput}
            onChange={(e) => setPlayerNameInput(e.target.value)}
            required
          />
          <button type="submit">Crear Cuenta</button>
        </form>
      </div>
    )
  }

  // VISTA B: Buscar Sala (Tiene cuenta pero no está enlazado a un player_parties activo)
  if (!isInParty) {
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

  // VISTA C: Modo Juego Activo (Acceso seguro directo mediante propiedades de objeto)
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

export default App