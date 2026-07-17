import { useState, useEffect } from 'react'
import DeviceStorage from './utils/localstorage'
import { supabase } from './utils/supabase'
import LoginScreen from './screens/LoginScreen'
import JoinPartyScreen from './screens/JoinPartyScreen'
import PartyGameScreen from './screens/PartyGameScreen'
import './App.css'

// 1. Interfaz extendida y sincronizada para evitar errores de tipado (TypeScript)
export interface PlayerSession {
  id: string;
  name: string;
  code_players?: {
    code: string;
  } | null;
  player_parties?: {
    party_id: string;
    team_id: string | null;
    role: string;
    individual_score: number;
    game_status: 'waiting' | 'playing' | 'finished'; // 👈 Sincronía de estado de interacción
    parties: {
      id: string;
      code: string;
      game_stage: string;                      // 👈 Sincronía del piano de fases
      game_duration_seconds: number | null;     // 👈 Sincronía de duración (soporta null)
      stage_started_at: string | null;          // 👈 Sincronía de hora de inicio (servidor)
    };
    teams: {
      id: string;
      name: string;
      color: string;
      score: number;
    } | null;
  } | null;
}

function App() {
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState<PlayerSession | null>(null)

  // Efecto inicial: Buscar sesión existente mediante el código en LocalStorage
  useEffect(() => {
    async function fetchSession() {
      const savedCode = DeviceStorage.getItem('code', 'string') as string | undefined;

      if (savedCode) {
        // 2. Consulta robusta que jala las relaciones correctas en un único viaje
        const { data, error } = await supabase
          .from('code_players')
          .select(`
            id,
            code,
            player_id,
            players (
              id,
              name,
              created_at,
              player_parties (
                id,
                party_id,
                role,
                individual_score,
                game_status,
                parties (
                  id,
                  code,
                  game_stage,
                  game_duration_seconds,
                  stage_started_at
                ),
                teams (
                  id,
                  name,
                  color,
                  score
                )
              )
            )
          `)
          .eq('code', savedCode)
          .maybeSingle()

        if (data && data.players && !error) {
          const playerData = data.players as any;
          
          // En la jerarquía de Supabase, player_parties cuelga de players
          const rawParty = playerData.player_parties;
          const activeParty = Array.isArray(rawParty) ? rawParty[0] : rawParty;

          setPlayer({
            id: playerData.id,
            name: playerData.name,
            code_players: { code: data.code },
            player_parties: activeParty || null
          })
        } else {
          // Si el código del almacenamiento local está corrupto o fue borrado, limpiamos
          DeviceStorage.removeItem('code')
        }
      }
      setLoading(false)
    }

    fetchSession()
  }, [])

  if (loading) return <div className="App"><h3>Cargando juego...</h3></div>

  // Monitoreo seguro en consola
  console.log('Estado completo del jugador:', JSON.stringify(player))
  if (player?.player_parties) {
    console.log('Código de Party Directo:', player.player_parties.parties.code);
    console.log('Rol del jugador:', player.player_parties.role);
    console.log('Puntaje Individual:', player.player_parties.individual_score);
    if (player.player_parties.teams) {
      console.log('Equipo:', player.player_parties.teams.name, 'Puntaje Equipo:', player.player_parties.teams.score);
    }
  }

  // Condición limpia para saber si está en una sala activa
  const isInParty = player?.player_parties !== null && player?.player_parties !== undefined;

  // --- RENDERS CONDICIONALES ---

  // VISTA A: Registro / Login (No hay código de sesión válido)
  if (!player) {
    return <LoginScreen setPlayer={setPlayer} />
  }

  // VISTA B: Buscar Sala / Unirse (Tiene cuenta pero no está enlazado a player_parties)
  if (!isInParty) {
    return <JoinPartyScreen player={player} setPlayer={setPlayer} />
  }

  // VISTA C: Modo Juego Activo (Acceso seguro directo mediante propiedades)
  return <PartyGameScreen player={player} setPlayer={setPlayer} />
}

export default App