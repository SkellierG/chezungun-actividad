export const GAME_CONFIG = {
  // Puntaje base otorgado por cada respuesta correcta en las rondas
  "points_per_correct_answer": 10,

  // Multiplicadores base para la repartición de puntos
  "multipliers": {
    "to_team": 1.5,      // Si se envían al equipo, se multiplican por 1.5 (incentiva cooperar)
    "to_individual": 1.0 // Si se los queda el jugador, se multiplican por 1.0
  },

  // Modificadores extras o alternativos del multiplicador según el rol del jugador
  "role_multipliers": {
    "lider": {
      "to_team": 2.0,       // Un líder aporta más si coopera
      "to_individual": 1.0
    },
    "jugador": {
      "to_team": 1.5,
      "to_individual": 1.0
    },
    "soporte": {
      "to_team": 1.8,
      "to_individual": 1.2
    }
  }
}