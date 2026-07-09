import { useState, useEffect } from 'react'
import DeviceStorage from './utils/localstorage'
import { supabase } from './utils/supabase'
import LoginScreen from './screens/LoginScreen'
import JoinPartyScreen from './screens/JoinPartyScreen'
import PartyGameScreen from './screens/PartyGameScreen'
import './App.css'

// 1. Interfaz extendida para soportar Equipos, Roles y Puntajes de la nueva DB
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
    parties: {
      code: string;
    };
    teams: {
      name: string;
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
        // 2. Consulta actualizada para traer de golpe el Rol, Puntaje Individual y datos del Equipo
        const { data, error } = await supabase
          .from('code_players')
          .select(`
            code,
            players (
              id,
              name,
              player_parties (
                party_id,
                team_id,
                role,
                individual_score,
                parties (
                  code
                ),
                teams (
                  name,
                  score
                )
              )
            )
          `)
          .eq('code', savedCode)
          .maybeSingle();

        if (data && data.players && !error) {
          const playerData = data.players as any;
          
          // Desestructuramos player_parties previniendo si Supabase lo devuelve como Array u Objeto
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

  if (loading) return <div className="App"><h3>Cargando juego...</h3></div>

  // Monitoreo seguro de estados en consola con la nueva información disponible
  console.log('Estado completo del jugador:', JSON.stringify(player))
  if (player?.player_parties) {
    console.log('Código de Party Directo:', player.player_parties.parties.code);
    console.log('Rol del jugador:', player.player_parties.role);
    console.log('Puntaje Individual:', player.player_parties.individual_score);
    if (player.player_parties.teams) {
      console.log('Equipo:', player.player_parties.teams.name, 'Puntaje Equipo:', player.player_parties.teams.score);
    }
  }

  // Condición limpia para saber si está en sala o no
  const isInParty = player?.player_parties !== null && player?.player_parties !== undefined;

  // --- RENDERS CONDICIONALES (VISTAS AUTOMÁTICAS DESDE ROOT) ---

  // VISTA A: Registro / Dashboard de bienvenida (No hay código de sesión válido)
  if (!player) {
    return <LoginScreen setPlayer={setPlayer} />
  }

  // VISTA B: Buscar Sala (Tiene cuenta pero no está enlazado a un player_parties activo)
  if (!isInParty) {
    return <JoinPartyScreen player={player} setPlayer={setPlayer} />
  }

  // VISTA C: Modo Juego Activo (Acceso directo seguro por objetos)
  // Ahora PartyGameScreen recibirá de golpe el rol, el equipo y todos los puntajes dentro del objeto player
  return <PartyGameScreen player={player} setPlayer={setPlayer} />
}

export default App