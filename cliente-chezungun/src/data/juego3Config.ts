export interface TriviaRound {
  question: string;
  options: string[];
  answer: number; // Índice base cero
}

export const JUEGO3_ROUNDS: TriviaRound[] = [
  {
    question: "Si en un mapa interactivo el sol sale por arriba, ¿qué concepto de orientación espacial representa ese punto?",
    options: ["Lafken", "Willi", "Puel", "Pikun"],
    answer: 2 // Puel
  },
  {
    question: "¿Qué significa la expresión habitual 'countries' o actividades que terminan en '-ken' como ' ülkantuken '?",
    options: [
      "Una acción que ocurrirá en el futuro",
      "Una actividad que realizo habitualmente",
      "Una pregunta o duda no resuelta",
      "Un objeto inanimado o color"
    ],
    answer: 1 // Una actividad que realizo habitualmente
  },
  {
    question: "Resuelve la siguiente operación aritmética en Che Zungun: 'Küla Pataka' + 'Kayu Mari' + 'Aylla'",
    options: ["469", "369", "316", "639"],
    answer: 1 // 369 ((3 * 100) + (6 * 10) + 9)
  },
  {
    question: "Si el Administrador del juego te asigna el rol de 'profesor/a o el que transmite conocimiento', ¿qué término te corresponde?",
    options: ["Chillkatujo", "Ngüneytujo", "Shiwen", "Kimeltujo"],
    answer: 3 // Kimeltujo
  },
  {
    question: "¿Cuál de los siguientes grupos contiene únicamente colores de la escala fría o neutros oscuros (Verde, Azul, Negro)?",
    options: [
      "Chod, Kelü, Lig",
      "Kasrü, Kallfü, Kusrü",
      "Koñol, Payne, Keluchoz",
      "Kolü, Chod, Kasrü"
    ],
    answer: 1 // Kasrü (Verde), Kallfü (Azul), Kusrü (Negro)
  },
  {
    question: "Al encontrarte con tus compañeros en la sala de juego y querer saludarlos de forma informal/de confianza, utilizas:",
    options: ["Mañum", "Pewayen", "Mushkay", "Mari mari"],
    answer: 2 // Mushkay
  },
  {
    question: "Te encuentras jugando una partida de Palitun (Chueca). ¿Cuál es la raíz verbal correcta de esta acción frecuente?",
    options: ["palitu-", "awkantu-", "sewma-", "küsow-"],
    answer: 0 // palitu-
  },
  {
    question: "Si asociamos las estaciones del año con sensaciones, ¿cuál de estos términos describe la época de lluvias e invierno ('Pukem')?",
    options: ["Walung", "Pukem", "Rimu", "Pewü"],
    answer: 1 // Pukem
  },
  {
    question: "En la anatomía humana, si tocas tu pecho para sentir los latidos de la vida, estás localizando tu:",
    options: ["Lonko", "Piuke", "Namun", "Kug"],
    answer: 1 // Piuke (Corazón)
  },
  {
    question: "Si deseas expresar estéticamente que algo te agrada o te parece correcto ('me gusta/lo encuentro bueno'), ¿qué verbo utilizas?",
    options: ["Ayüken", "Kümentukelan", "Ayükelan", "Kümentuken"],
    answer: 3 // Kümentuken
  },
  {
    question: "Si estás programando tu brújula Huilliche interactiva hacia el Oeste (dirección del Mar), ¿en qué punto cardinal debes situar el marcador?",
    options: ["Willi", "Pikun", "Lafken", "Puel"],
    answer: 2 // Lafken
  },
  {
    question: "Estás respondiendo una encuesta en el juego. Si la respuesta que vas a dar es afirmativa ('Sí') y luego quieres decir un rotundo 'No', eliges:",
    options: ["Afi, May", "May, No", "No, Femngi", "Femngi, Feylay"],
    answer: 1 // May, No
  },
  {
    question: "Aplica la lógica gramatical habitual: si 'sewma-' significa hacer/construir, ¿cómo dices textualmente 'Yo fabrico o construjo habitualmente'?",
    options: ["sewmakechi", "sewmaken", "sewmatujo", "sewmalay"],
    answer: 1 // sewmaken
  },
  {
    question: "Resuelve la lógica de esta combinación de colores otoñales: un árbol cuyas hojas pasaron de amarillo ('Chod') a rojo ('Kelü'), tiene ahora un color compuesto por ambos:",
    options: ["Keluchoz", "Kallfü", "Kasrü", "Koñol"],
    answer: 0 // Keluchoz (Naranjo)
  },
  {
    question: "En la introducción de un nütram (relato), si dices 'Wapiche ta inche', estás revelando a los demás jugadores tu procedencia como:",
    options: ["Persona del norte", "Habitante de la cordillera", "Persona isleña", "Estudiante de agronomía"],
    answer: 2 // Persona isleña (Isleña/o soy yo)
  }
];