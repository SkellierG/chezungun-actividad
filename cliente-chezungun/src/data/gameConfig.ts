export const GAME_CONFIG = {
  // Puntaje base otorgado por cada respuesta correcta en las rondas
  "points_per_correct_answer": 10,

  // Multiplicadores base para la repartición de puntos
  "multipliers": {
    "to_team": 1.5,      // Si se envían al equipo, se multiplican por 1.5 (incentiva cooperar)
    "to_individual": 1.0 // Si se los queda el jugador, se multiplican por 1.0
  },

  // Modificadores extras o alternativos del multiplicador según el rol exacto del jugador en db.sql
  "role_multipliers": {
    "lonko": {
      "to_team": 2.0,       // Aporte supremo al equipo
      "to_individual": 1.0
    },
    "capitan": {
      "to_team": 2.0,       // Gran beneficio grupal
      "to_individual": 1.0
    },
    "fraile": {
      "to_team": 2.0,
      "to_individual": 0.5  // Ligera bonificación mixta
    },
    "winka": {
      "to_team": 1.0,       // Menos incentivo grupal
      "to_individual": 1.8  // Mayor ganancia individual
    },
    "indio": {
      "to_team": 1.0,
      "to_individual": 1.8
    },
    "diplomatico": {
      "to_team": 1.5,
      "to_individual": 1.5
    },
    "jugador": {
      "to_team": 1.5,
      "to_individual": 1.0
    }
  }
}