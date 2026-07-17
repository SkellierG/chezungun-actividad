import React, { useState, useEffect } from 'react'
import { CONTENT } from '../data/contenido'

const MYSTIC_TITLES = [
  "⛪ Tratado del Biobío y Otras Aguas Bautismales",
  "⚔️ Milagros del Apóstol en la Selva Fría",
  "📜 Crónicas de la Frontera Inconclusa",
  "⚜️ Silabario del Alma para la Conversión del Indómito",
  "🌀 Pronósticos del Copista sobre la Gran Ciénaga",
  "🌿 Exorcismos de los Árboles que Lloran Sangre",
  "🍷 Cánones contra la Herejía del Muday",
  "⚖️ Sentencias Coloniales de la Real Audiencia",
  "🏔️ De las Sombras y Volcanes del Reino de Chile"
]

const NONSENSE_PHRASES = [
  "--- [PÁGINA PODRIDA POR LA JURADA HUMEDAD DE VALDIVIA] ---",
  "--- [CENSURADO POR EL SANTO OFICIO DE LIMA] ---",
  "[Aquí el copista derramó vino de misa y dibujó un copihue herético]",
  "Nota al margen: El Gobernador insiste en que las piedras nos vigilan.",
  "¿¿¿ Quid est hoc? El traductor se ha dormido bajo un canelo ???",
  "Glosado herético: Afirman que las machis le hablan a los truenos en latín.",
  "--- [TINTA BORRADA POR AGUA DE LA LLUVIA DE TRES MESES] ---",
  "[Mancha de lodo de la Cuesta de Purén]"
]

interface FraileBookProps {
  isOpen: boolean
  onClose: () => void
}

interface ProcessedCategory {
  tabName: string
  items: Array<{ che_zungun: string; espanol: string; isNonsense?: boolean }>
}

export default function FraileBook({ isOpen, onClose }: FraileBookProps) {
  const [processedTabs, setProcessedTabs] = useState<ProcessedCategory[]>([])
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0)

  // Cada vez que se ABRE el libro, se ejecuta la aleatorización total (Desordenado y corrupto)
  useEffect(() => {
    if (!isOpen) return

    const rawCategories = Object.values(CONTENT.categorias)
    
    // 1. Mezclar las categorías originales e inventarles nombres absurdos
    const shuffledCategories = [...rawCategories].sort(() => Math.random() - 0.5)
    const shuffledTitles = [...MYSTIC_TITLES].sort(() => Math.random() - 0.5)

    const finalTabs: ProcessedCategory[] = shuffledCategories.map((categoryItems, idx) => {
      // Mezclar los elementos internos del vocabulario
      let items = [...categoryItems].sort(() => Math.random() - 0.5)

      // Inyectar espacios en blanco o líneas sin sentido de forma aleatoria
      const updatedItems = [...items]
      const insertionsCount = Math.floor(Math.random() * 3) + 1 // 1 a 3 sinsentidos por tab
      for (let i = 0; i < insertionsCount; i++) {
        const insertAt = Math.floor(Math.random() * (updatedItems.length + 1))
        const randomNonsense = NONSENSE_PHRASES[Math.floor(Math.random() * NONSENSE_PHRASES.length)]
        updatedItems.splice(insertAt, 0, {
          che_zungun: randomNonsense,
          espanol: "",
        })
      }

      return {
        tabName: shuffledTitles[idx] || `📜 Pergamino Extraño ${idx + 1}`,
        items: updatedItems
      }
    })

    setProcessedTabs(finalTabs)
    setActiveTabIdx(0) // Reiniciar en la primera pestaña generada
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'serif' }}>
      <div style={{ width: '100%', maxWidth: '850px', height: '85vh', backgroundColor: '#2c221e', borderRadius: '12px', border: '3px solid #8c6d53', boxShadow: '0 10px 30px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#f4ede2' }}>
        
        {/* Cabecera del Grimorio */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '2px solid #5a4535', background: '#211916' }}>
          <h2 style={{ margin: 0, color: '#dfb76c', fontSize: '1.4rem', letterSpacing: '1px' }}>📖 Grimorio Mutante del Fraile</h2>
          <button onClick={onClose} style={{ background: '#722f2f', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
            Cerrar Libro
          </button>
        </div>

        {/* 📑 PESTAÑAS LATERALES / SUPERIORES DE LA CARPETA */}
        <div style={{ display: 'flex', overflowX: 'auto', background: '#1c1513', borderBottom: '2px solid #5a4535', padding: '5px 5px 0 5px', gap: '4px' }} className="no-scrollbar">
          {processedTabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTabIdx(i)}
              style={{
                padding: '10px 16px',
                border: '1px solid #5a4535',
                borderBottom: activeTabIdx === i ? '2px solid #2c221e' : '1px solid #5a4535',
                backgroundColor: activeTabIdx === i ? '#2c221e' : '#140f0d',
                color: activeTabIdx === i ? '#dfb76c' : '#a89485',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: activeTabIdx === i ? 'bold' : 'normal',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              {tab.tabName}
            </button>
          ))}
        </div>

        {/* 📖 CONTENIDO DE LA PÁGINA */}
        <div style={{ flex: 1, padding: '25px', overflowY: 'auto', background: '#2c221e', backgroundImage: 'radial-gradient(rgba(0,0,0,0.15) 15%, transparent 16%)', backgroundSize: '8px 8px' }}>
          {processedTabs[activeTabIdx] ? (
            <div style={{ maxWidth: '650px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#a89485', marginBottom: '20px', fontSize: '0.9rem', borderBottom: '1px dashed #5a4535', paddingBottom: '10px' }}>
                *Las páginas crujen. El orden y las glosas parecen haber mutado desde la última vez...*
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {processedTabs[activeTabIdx].items.map((item, index) => {
                  if (item.isNonsense) {
                    return (
                      <div key={index} style={{ padding: '10px', backgroundColor: 'rgba(114, 47, 47, 0.15)', borderLeft: '3px solid #722f2f', color: '#e07a7a', fontStyle: 'italic', fontSize: '0.95rem', letterSpacing: '0.5px', borderRadius: '4px', textAlign: 'center' }}>
                        {item.che_zungun}
                      </div>
                    )
                  }

                  return (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px 15px', borderBottom: '1px solid rgba(140, 109, 83, 0.2)', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px', alignItems: 'center' }}>
                      <span style={{ color: '#dfb76c', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                        {item.che_zungun}
                      </span>
                      <span style={{ color: '#d9cebd', fontSize: '1rem' }}>
                        {item.espanol}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#a89485', marginTop: '40px' }}>Ningún pergamino cargado...</div>
          )}
        </div>
      </div>
    </div>
  )
}