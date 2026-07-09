import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

// Interfaces estrictas para manejar todo el árbol relacional mapeado desde Supabase
interface AdminPlayerParties {
  role: string | null;
  individual_score: number;
  players: {
    id: string;
    name: string;
  } | null;
  teams: {
    id: string;
    name: string;
    score: number;
  } | null;
}

interface AdminParty {
  id: string;
  code: string;
  created_at: string;
  player_parties: AdminPlayerParties | AdminPlayerParties[] | null;
}

export default function AdminScreen() {
  const [parties, setParties] = useState<AdminParty[]>([])
  const [loading, setLoading] = useState(true)
  const [newPartyCode, setNewPartyCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar salas y todos sus miembros con roles, puntajes y equipos
  const fetchAllParties = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parties')
        .select(`
          id,
          code,
          created_at,
          player_parties (
            role,
            individual_score,
            players (
              id,
              name
            ),
            teams (
              id,
              name,
              score
            )
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

  useEffect(() => {
    fetchAllParties()
  }, [])

  // Crear una nueva party de forma manual o aleatoria
  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault()
    let code = newPartyCode.trim().toUpperCase()
    
    // Si dejan el input vacío, generamos un código corto aleatorio (ej: RM42B)
    if (!code) {
      code = 'ROOM_' + Math.random().toString(36).substring(2, 7).toUpperCase()
    }

    setIsSubmitting(false)
    try {
      const { error } = await supabase
        .from('parties')
        .insert([{ code }])

      if (error) {
        if (error.code === '23505') { // Código de duplicado en Postgres
          return alert('Ese código de Party ya existe. Intenta con otro.')
        }
        throw error
      }

      setNewPartyCode('')
      alert(`¡Sala "${code}" creada con éxito!`)
      fetchAllParties() // Recargar lista
    } catch (error) {
      console.error(error)
      alert('No se pudo crear la sala.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff' }}>
      <h2>Panel de Administración Global</h2>
      <p style={{ color: '#aaa' }}>Crea salas y monitorea jugadores, equipos y puntajes en tiempo real.</p>
      
      <hr style={{ borderColor: '#444', margin: '20px 0' }} />

      {/* SECCIÓN A: CREACIÓN DE PARTIES */}
      <section style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Crear Nueva Sala (Party)</h3>
        <form onSubmit={handleCreateParty} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Ej: AB12 (Vacío para aleatorio)"
            value={newPartyCode}
            onChange={(e) => setNewPartyCode(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '250px' }}
          />
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ padding: '10px 20px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isSubmitting ? 'Creando...' : 'Crear Sala'}
          </button>
        </form>
      </section>

      {/* SECCIÓN B: MONITOREO DE PARTIES Y MIEMBROS */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Salas Activas ({parties.length})</h3>
          <button onClick={fetchAllParties} style={{ padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
            🔄 Actualizar Datos
          </button>
        </div>

        {loading ? (
          <p>Cargando información consolidada...</p>
        ) : parties.length === 0 ? (
          <p style={{ color: '#aaa' }}>No hay salas creadas en el servidor actualmente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {parties.map((party) => {
              // Normalizar la relación de player_parties ya que Postgres/Supabase puede devolver objeto o array
              const rawMembers = party.player_parties
              const members: AdminPlayerParties[] = Array.isArray(rawMembers)
                ? rawMembers
                : rawMembers
                ? [rawMembers]
                : []

              return (
                <div key={party.id} style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>
                      Sala Cód: {party.code}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#777' }}>
                      Creada: {new Date(party.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h4>Jugadores Inscritos ({members.length})</h4>
                  {members.length === 0 ? (
                    <p style={{ color: '#777', fontSize: '0.9rem', italic: 'true' }}>Sala vacía sin jugadores aún.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px', fontSize: '0.95rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #444', color: '#aaa' }}>
                          <th style={{ padding: '8px' }}>Jugador</th>
                          <th style={{ padding: '8px' }}>Equipo</th>
                          <th style={{ padding: '8px' }}>Rol</th>
                          <th style={{ padding: '8px' }}>Ptos. Indiv.</th>
                          <th style={{ padding: '8px' }}>Ptos. Equipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #2a2a2a' }}>
                            <td style={{ padding: '8px', fontWeight: '500' }}>
                              {member.players?.name || 'Anónimo'}
                            </td>
                            <td style={{ padding: '8px', color: member.teams?.name ? '#4ade80' : '#aaa' }}>
                              {member.teams?.name || 'Ninguno'}
                            </td>
                            <td style={{ padding: '8px', color: '#fb923c' }}>
                              {member.role || 'Sin Rol'}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              {member.individual_score}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#86efac' }}>
                              {member.teams?.score !== undefined ? member.teams.score : '-'}
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
    </div>
  )
}