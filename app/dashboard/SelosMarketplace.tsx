'use client'

// Selos de marketplace, em arquivo PRÓPRIO de propósito: o wrapper da Gestão
// precisa deles no seletor, e importá-los da GestaoConsolidada arrastaria a tela
// consolidada inteira pro bundle inicial — matando o lazy-load dela.

export function SeloAmazon({ size = 15 }: { size?: number }) {
  return (
    <span title="Amazon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size + 7, height: size + 7, borderRadius: 5, background: '#232F3E', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 16.5c3.2 2.1 7 3 10.5 3 2.6 0 5.4-.5 7.9-1.7.4-.2.7.2.4.5-2.3 2-5.5 3-8.4 3-4 0-7.7-1.6-10.5-4.3-.2-.2 0-.5.1-.5z" fill="#FF9900"/>
        <path d="M8.9 10.6c0-1 .3-1.8.8-2.3.5-.6 1.2-.8 2-.8.2 0 .4 0 .6.1v-.9c0-.5-.1-.9-.3-1.1-.2-.2-.5-.3-.9-.3-.6 0-1 .2-1.3.7l-1.4-.4C8.9 4.5 9.9 4 11.3 4c.8 0 1.5.2 1.9.6.5.4.7 1 .7 1.9v4.9h-1.5l-.1-.7c-.4.6-1 .9-1.8.9-.6 0-1-.2-1.3-.5-.2-.4-.3-.8-.3-1.5zm1.6-.2c0 .5.2.8.7.8.4 0 .8-.2 1.1-.7V8.9c-.2 0-.3-.1-.5-.1-.9 0-1.3.5-1.3 1.6z" fill="#fff"/>
      </svg>
    </span>
  )
}

export function SeloML({ size = 15 }: { size?: number }) {
  return (
    <span title="Mercado Livre" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size + 7, height: size + 7, borderRadius: 5, background: '#FFE600', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="9" ry="6.2" fill="#FFE600" stroke="#2D3277" strokeWidth="1.1"/>
        <path d="M6.5 12.4c1-1.6 2.2-2.6 3.2-2.6.8 0 1 .6 1.6 1.2.5.5 1 .6 1.5.2.6-.5 1.1-1.4 2-1.4 1.1 0 2.2 1 2.8 2.3" stroke="#2D3277" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </span>
  )
}
