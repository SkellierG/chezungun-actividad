export interface CompassRound {
  question: string;
  targetDirection: string; // Debe coincidir con el nombre de la dirección en la brújula
}

export const JUEGO2_ROUNDS: CompassRound[] = [
  {
    question: "¿Hacia qué dirección debes apuntar si te encuentras en Osorno y quieres ir a Frutillar?",
    targetDirection: "Willi"
  },
  {
    question: "Si estás parado en Puerto Montt, ¿hacia qué dirección se encuentra Bariloche?",
    targetDirection: "Puel"
  },
  {
    question: "Si te encuentras en el centro de Valdivia, ¿hacia qué dirección queda Niebla?",
    targetDirection: "Lafken"
  },
  {
    question: "Si estás jugando desde Llanquihue, ¿en qué dirección se ubica la ciudad de Osorno?",
    targetDirection: "Pikun"
  },
  {
    question: "Si te sitúas en Purranque, ¿hacia qué dirección tendrías que viajar para llegar a San Juan de la Costa?",
    targetDirection: "Lafken"
  },
  {
    question: "Si estás establecido en Castro (Chiloé), ¿hacia dónde debes mirar para apuntar hacia Chaitén?",
    targetDirection: "Puel"
  },
  {
    question: "Si te encuentras en Frutillar, ¿hacia qué dirección exacta queda Puerto Octay?",
    targetDirection: "Pikun"
  },
  {
    question: "Si estás ubicado en Río Bueno, ¿hacia qué dirección se encuentra la ciudad de La Unión?",
    targetDirection: "Lafken"
  },
  {
    question: "Si tu punto de inicio es Entre Lagos, ¿hacia qué dirección está la ciudad de Osorno?",
    targetDirection: "Lafken"
  },
  {
    question: "Si te encuentras en Calbuco, ¿hacia qué dirección tienes que navegar para llegar a Ancud?",
    targetDirection: "Willi"
  },
  {
    question: "Si inicias tu recorrido en Río Negro, ¿hacia qué dirección debes avanzar para llegar a Purranque?",
    targetDirection: "Willi"
  },
  {
    question: "Si te encuentras en San Pablo, ¿en qué dirección se localiza la ciudad de Osorno?",
    targetDirection: "Willi"
  },
  {
    question: "Si estás situado en Frutillar, ¿hacia qué dirección queda la localidad de Cascadas?",
    targetDirection: "Puel"
  },
  {
    question: "Si estás jugando desde Puerto Octay, ¿hacia qué dirección tendrías que viajar para llegar a Entre Lagos?",
    targetDirection: "Puel"
  },
  {
    question: "Si tu punto de inicio es La Unión, ¿hacia qué dirección exacta se ubica Paillaco?",
    targetDirection: "Pikun"
  },
  {
    question: "Si te localizas en San Juan de la Costa, ¿hacia qué dirección se encuentra la comuna de Osorno?",
    targetDirection: "Puel"
  },
  {
    question: "Si te encuentras acampando en Puyehue, ¿hacia qué dirección queda el centro urbano de Osorno?",
    targetDirection: "Lafken"
  },
  {
    question: "Si estás establecido en Los Muermos, ¿hacia qué dirección tienes que moverte para llegar a Fresia?",
    targetDirection: "Pikun"
  },
  {
    question: "Si estás parado en el centro de Osorno, ¿hacia qué dirección se ubica la comuna de San Pablo?",
    targetDirection: "Pikun"
  },
  {
    question: "Si estás en Puerto Montt y necesitas desplazarte hacia Puerto Varas, ¿hacia qué dirección debes apuntar?",
    targetDirection: "Pikun"
  }
];