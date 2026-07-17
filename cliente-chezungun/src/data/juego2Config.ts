export interface CompassRound {
  question: string;
  targetDirection: string; // Debe coincidir con el nombre de la dirección en la brújula
}

export const JUEGO2_ROUNDS: CompassRound[] = [
  {
    question: "¿Hacia qué dirección se encuentra Frutillar si estás parado en Osorno?",
    targetDirection: "Willi (Sur)"
  },
  {
    question: "Si estás en Puerto Montt, ¿hacia dónde debes mirar para orientarte en dirección a Bariloche (Cordillera)?",
    targetDirection: "Puel (Este)"
  },
  {
    question: "Si te encuentras en Valdivia y quieres mirar hacia el Océano Pacífico (Niebla/Corral), ¿hacia dónde apuntas?",
    targetDirection: "Lafken (Oeste)"
  }
]