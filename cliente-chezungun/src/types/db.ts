export interface AdminPlayerParties {
  role: 'lider' | 'fraile' | 'diplomatico' | 'jugador' | null;
  individual_score: number;
  players: {
    id: string;
    name: string;
  } | null;
  teams: {
    id: string;
    name: string;
    color: string;
    score: number;
  } | null;
}

export interface AdminParty {
  id: string;
  code: string;
  created_at: string;
  teams?: { id: string; name: string; color: string; score: number }[] | null;
  player_parties: AdminPlayerParties | AdminPlayerParties[] | null;
}

export interface GlobalPlayer {
  id: string;
  name: string;
  created_at: string;
  code_players: { code: string } | { code: string }[] | null;
  player_parties: {
    party_id: string;
    role: 'lider' | 'fraile' | 'diplomatico' | 'jugador' | null;
    team_id: string | null;
    parties: { code: string } | null;
    teams: { id: string; name: string; color: string } | null;
  } | {
    party_id: string;
    role: 'lider' | 'fraile' | 'diplomatico' | 'jugador' | null;
    team_id: string | null;
    parties: { code: string } | null;
    teams: { id: string; name: string; color: string } | null;
  }[] | null;
}

// Diccionario global de roles amigables para visualización en el cliente
export const ROLE_LABELS: Record<string, string> = {
  jugador: 'Jugador Normal',
  lider: 'Líder de Equipo',
  fraile: 'Fraile',
  diplomatico: 'Diplomático'
}
