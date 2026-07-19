/**
 * Marcas e ilustrações compartilhadas entre as dobras.
 * Vivem aqui (e não no Hero) para não criar ciclo de imports.
 */

export function EyeMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <ellipse cx="24" cy="24" rx="22" ry="12" stroke="#F0C262" strokeWidth="2" />
      <circle cx="24" cy="24" r="7.5" fill="url(#gEye)" />
      <circle cx="24" cy="24" r="2.4" fill="#fff" />
      <defs>
        <radialGradient id="gEye" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#FFE7A6" />
          <stop offset="100%" stopColor="#C48F10" />
        </radialGradient>
      </defs>
    </svg>
  )
}

/**
 * Marca do NEO — monograma "N" dourado dentro de uma argola tracejada que
 * gira. Identidade do agente (distinta do olho, que é a marca do Oráculo).
 * O "N" usa a display do site, então acompanha a tipografia da marca.
 */
export function NeoMark({ size = 54 }: { size?: number }) {
  return (
    <span className="neo-mark" style={{ width: size, height: size }}>
      <span className="neo-mark-halo" aria-hidden />
      <svg className="neo-mark-ring" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r="29.5" fill="none" stroke="url(#neoRingG)"
          strokeWidth="1.5" strokeDasharray="3.5 6.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="neoRingG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFE7A6" />
            <stop offset="55%" stopColor="#F0C262" />
            <stop offset="100%" stopColor="#B5840F" />
          </linearGradient>
        </defs>
      </svg>
      <span className="neo-mark-n ora-display" style={{ fontSize: size * 0.46 }}>N</span>
    </span>
  )
}

/**
 * Lockup completo: marca + "AGENTE NEO" + assinatura.
 * `stacked` empilha (para blocos centrados); padrão é em linha.
 */
export function NeoLockup({ size = 54, tagline = true }: { size?: number; tagline?: boolean }) {
  return (
    <span className="neo-lockup">
      <NeoMark size={size} />
      <span className="neo-lockup-text">
        <span className="neo-lockup-word ora-display" style={{ fontSize: size * 0.42 }}>
          AGENTE <span className="ora-goldtext">NEO</span>
        </span>
        {tagline && (
          <span className="neo-lockup-tag" style={{ fontSize: Math.max(9.5, size * 0.16) }}>
            Inteligência · João Flório
          </span>
        )}
      </span>
    </span>
  )
}

/* garrafa squeeze — produto usado como exemplo na mineração e na extensão */
export function Bottle({ h = 54 }: { h?: number }) {
  return (
    <svg width={h * 0.42} height={h} viewBox="0 0 42 100" fill="none" aria-hidden>
      <defs>
        <linearGradient id="botG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#43E0D0" />
          <stop offset="55%" stopColor="#2BB8A9" />
          <stop offset="100%" stopColor="#1E8F84" />
        </linearGradient>
      </defs>
      <rect x="13" y="2" width="16" height="10" rx="3" fill="#1E8F84" />
      <path d="M11 14h20c0 6 4 8 4 16v58a10 10 0 0 1-10 10H17A10 10 0 0 1 7 88V30c0-8 4-10 4-16z" fill="url(#botG)" />
      <rect x="12" y="40" width="18" height="26" rx="4" fill="rgba(255,255,255,0.28)" />
    </svg>
  )
}
