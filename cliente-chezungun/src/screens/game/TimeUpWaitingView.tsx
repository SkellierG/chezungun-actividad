import React from 'react'

export default function TimeUpWaitingView() {
  return (
    <div style={{ padding: '60px 30px', border: '2px solid #ef4444', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.03)', textAlign: 'center' }}>
      <h2 style={{ color: '#ef4444', marginTop: 0, letterSpacing: '0.5px' }}>🚨 ¡TIEMPO LOCAL AGOTADO!</h2>
      <div style={{ margin: '20px auto', background: '#111', padding: '15px', borderRadius: '8px', maxWidth: '500px', border: '1px solid #333' }}>
        <span style={{ display: 'block', fontSize: '0.9rem', color: '#fca5a5', fontWeight: 'bold', marginBottom: '5px' }}>
          🔒 Estado de Dispositivo: Sala de Espera Activa
        </span>
        <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem', lineHeight: '1.4' }}>
          Tu tiempo para interactuar en esta etapa ha concluido. Ya notificamos al panel del Administrador global que estás listo y esperando el siguiente intermedio masivo.
        </p>
      </div>
      <p style={{ color: '#666', fontSize: '0.8rem' }}>Por favor, mantén esta pestaña abierta y no cierres la app.</p>
    </div>
  )
}