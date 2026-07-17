export interface TriviaRound {
  question: string;
  options: string[];
  answer: number; // Índice base cero (0 para la primera opción, 1 para la segunda...)
}

export const JUEGO1_ROUNDS: TriviaRound[] = [
  {
    question: "¿Cómo se dice correctamente el color 'Verde' en Che Zungun?",
    options: ["Chod", "Kasrü", "Koñol", "Kallfü"],
    answer: 1 // Kasrü
  },
  {
    question: "Si queremos expresar el número 10 (Diez), ¿cuál palabra debemos usar?",
    options: ["Mari", "Meli", "Kiñe", "Pataka"],
    answer: 0 // Mari
  },
  {
    question: "En la orientación del Meli Witran Mapu, ¿qué dirección representa el término 'Puel'?",
    options: ["Norte", "Oeste (Mar)", "Sur", "Este (Arriba / Salida del Sol)"],
    answer: 3 // Este (Arriba / Salida del Sol)
  },
  {
    question: "¿Cuál es el significado correcto en español del saludo respetuoso 'Mari mari'?",
    options: ["Muchas gracias", "Saludo general respetuoso", "Nos vemos otro día", "He estado bien"],
    answer: 1 // Saludo general respetuoso
  },
  {
    question: "Identifica la parte del cuerpo que corresponde a la palabra 'Lonko':",
    options: ["Corazón", "Espalda", "Cabeza", "Mano"],
    answer: 2 // Cabeza
  },
  {
    question: "¿Cómo se escribe de forma correcta la estación del año 'Invierno'?",
    options: ["Walung", "Rimu", "Pewü", "Pukem"],
    answer: 3 // Pukem
  },
  {
    question: "Si un Kimeltujo (docente) te dice 'Mañum', ¿qué te está diciendo?",
    options: ["Hola", "Gracias", "Pregunta", "Trabajo"],
    answer: 1 // Gracias
  },
  {
    question: "Dentro de las actividades frecuentes, ¿cuál es el significado de ' ülkantuken '?",
    options: ["Yo canto / hago música", "Yo trabajo", "Yo juego / hago deporte", "Yo enseño"],
    answer: 0 // Yo canto / hago música
  },
  {
    question: "¿Cómo se traduce de forma exacta la parte del cuerpo 'Piuke'?",
    options: ["Cara / Rostro", "Corazón", "Pies", "Columna"],
    answer: 1 // Corazón
  },
  {
    question: "Según la estructura numérica, ¿cómo se compone y escribe el número 41 (Meli Mari Kiñe)?",
    options: ["Meli Kiñe Mari", "Meli Mari Kiñe", "Kiñe Mari Meli", "Meli Pataka Kiñe"],
    answer: 1 // Meli Mari Kiñe
  },
  {
    question: "¿Qué expresión se utiliza correctamente al finalizar un relato para indicar 'se terminó / se acabó'?",
    options: ["Femngi", "Pewayen", "Afi", "May"],
    answer: 2 // Afi
  },
  {
    question: "Si el rol de un usuario es ser un estudiante, ¿cuál es su concepto correspondiente?",
    options: ["Kimeltujo", "Chillkatujo", "Ngüneytujo", "Shiwen"],
    answer: 1 // Chillkatujo
  },
  {
    question: "¿Cuál es la traducción exacta de la palabra 'Kug' en el léxico de las partes del cuerpo?",
    options: ["Mano", "Dedo", "Cuello", "Pierna"],
    answer: 0 // Mano
  },
  {
    question: "¿Cómo se escribe de forma correcta la estación correspondiente a la 'Primavera'?",
    options: ["Walung", "Rimu", "Pewü", "Pukem"],
    answer: 2 // Pewü
  },
  {
    question: "¿Cuál es la forma correcta de escribir la palabra que significa 'Blanco'?",
    options: ["Lig", "Kolü", "Kusrü", "Payne"],
    answer: 0 // Lig
  },
  {
    question: "¿Qué número representa exactamente el término 'Regle'?",
    options: ["5", "6", "7", "8"],
    answer: 2 // 7
  },
  {
    question: "¿Cuál de las siguientes palabras significa 'Cara, Rostro'?",
    options: ["Ange", "Fosru", "Pel'", "Srüko"],
    answer: 0 // Ange
  }
];