drop table code_players;
drop table player_parties;
drop table teams cascade;
drop table parties cascade;
drop table players cascade;



-- 1. Asegurar que las tablas previas existen o adaptarlas (Modificación/Creación)

-- Tabla de Partities (Salas de Juego)
CREATE TABLE IF NOT EXISTS parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Equipos (Cada equipo pertenece a una Party específica)
CREATE TABLE teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL,
    score INT DEFAULT 0 NOT NULL, -- Puntaje del Equipo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Evita tener dos equipos con el mismo nombre en la misma sala
    UNIQUE (party_id, name) 
);

-- Tabla de Jugadores (Tu sistema ad-hoc usando el código único de sesión)
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Esta tabla une el código guardado en LocalStorage con un id_player real
create table code_players (
  id uuid default gen_random_uuid() primary key,
  code text unique not null, -- El código único que se guardará en localStorage
  player_id uuid references players(id) on delete cascade unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Relación/Sesión: Une Jugador, Party, Equipo y su Rol/Puntaje individual
-- Esta tabla resuelve "Miembros", "Roles", "Puntaje Individual" y la "Lista General"
CREATE TABLE player_parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL, -- Puede empezar sin equipo
    role VARCHAR(50) DEFAULT 'player' NOT NULL, -- Ej: 'leader', 'writer', 'guesser', 'player'
    individual_score INT DEFAULT 0 NOT NULL, -- Puntaje individual de cada persona
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Un jugador solo puede estar activo en una party a la vez en este registro
    UNIQUE (player_id, party_id)
);