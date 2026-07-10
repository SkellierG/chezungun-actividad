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