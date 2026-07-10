export interface AdminPlayerParties {
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

export interface AdminParty {
  id: string;
  code: string;
  created_at: string;
  teams?: { id: string; name: string; score: number }[] | null;
  player_parties: AdminPlayerParties | AdminPlayerParties[] | null;
}

export interface GlobalPlayer {
  id: string;
  name: string;
  created_at: string;
  code_players: { code: string } | { code: string }[] | null;
  player_parties: {
    party_id: string;
    role: string | null;
    team_id: string | null;
    parties: { code: string } | null;
    teams: { id: string; name: string } | null;
  } | {
    party_id: string;
    role: string | null;
    team_id: string | null;
    parties: { code: string } | null;
    teams: { id: string; name: string } | null;
  }[] | null;
}