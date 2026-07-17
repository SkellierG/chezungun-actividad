-- Limpieza de la base de datos previa
DROP TABLE IF EXISTS code_players CASCADE;
DROP TABLE IF EXISTS player_parties CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS players CASCADE;

-- 1. Tabla de Parties (Salas de Juego)
CREATE TABLE parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Equipos (Cada equipo pertenece a una Party y ahora incluye COLOR)
CREATE TABLE teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#38bdf8' NOT NULL, -- Guardará códigos Hexadecimales (Ej: #FF5733 o #4ade80)
    score INT DEFAULT 0 NOT NULL, -- Puntaje acumulado del equipo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (party_id, name) 
);

-- 3. Tabla de Jugadores Base
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Sesiones (Une el localStorage con el jugador real)
CREATE TABLE code_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL, 
    player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reemplaza solo esta tabla en tu script para actualizar los roles
CREATE TABLE player_parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL, 
    
    -- CAMBIO: El rol por defecto ahora es 'jugador'
    role VARCHAR(20) DEFAULT 'jugador' NOT NULL, 
    
    individual_score INT DEFAULT 0 NOT NULL, 
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE (player_id),
    
    -- CAMBIO: Se añade 'jugador' a la lista de roles permitidos por el servidor
    CONSTRAINT chk_allowed_roles CHECK (role IN ('lider', 'fraile', 'diplomatico', 'jugador'))
);

-- A. Añadir la columna de etapa a la tabla de salas
ALTER TABLE parties 
ADD COLUMN game_stage VARCHAR(30) DEFAULT 'intermedio_1' NOT NULL;

-- B. Añadir la restricción física para asegurar los 5 intermedios y 3 juegos secuenciales
ALTER TABLE parties
ADD CONSTRAINT chk_game_stage CHECK (
    game_stage IN (
        'intermedio_1', -- Lobby de Espera Inicial
        'juego_1',      -- Primera Partida
        'intermedio_2', -- Descanso 1
        'juego_2',      -- Segunda Partida
        'intermedio_3', -- Descanso 2
        'juego_3',      -- Tercera Partida
        'intermedio_4', -- Pre-Cierre / Conclusiones
        'intermedio_5'  -- Final Finalísimo (Scoreboard definitivo)
    )
);

-- C. ¡SÚPER IMPORTANTE! Habilitar la replicación Realtime para la tabla parties
-- Esto le avisa a Supabase que debe transmitir por WebSockets cada UPDATE en esta tabla.
ALTER PUBLICATION supabase_realtime ADD TABLE parties;

-- 1. Añadir columna a parties para guardar el tiempo que decida el Admin por sala
ALTER TABLE parties 
ADD COLUMN game_duration_seconds INT DEFAULT 60 NOT NULL;

-- 2. Añadir la columna de estado del juego individual del jugador en la relación intermedia
ALTER TABLE player_parties 
ADD COLUMN game_status VARCHAR(20) DEFAULT 'waiting' NOT NULL;

-- 3. Restricción física para asegurar los estados válidos de interacción
ALTER TABLE player_parties
ADD CONSTRAINT chk_game_status CHECK (game_status IN ('waiting', 'playing', 'finished'));

-- 4. Habilitar la replicación Realtime también para player_parties
-- De esta forma el Admin escuchará los cambios de estado de los jugadores en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE player_parties;

-- 1. Permitir que la duración sea NULL (NULL significará "Sin tiempo / Manual")
ALTER TABLE parties ALTER COLUMN game_duration_seconds DROP NOT NULL;
ALTER TABLE parties ALTER COLUMN game_duration_seconds SET DEFAULT NULL;

-- 2. Añadir la columna para registrar el inicio exacto de la etapa actual
ALTER TABLE parties ADD COLUMN stage_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;