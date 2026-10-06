'use client'
// VISUAL NOVO DO PAINEL — liberado pra todos em 06/10/2026 (validado antes só pelo admin).
// Liga o atributo <html data-visual="ouro">, que troca as cores/fontes do painel (globals.css). Em carregamento
// completo o atributo já vem do script do <head> (app/layout.tsx, sem piscar o visual antigo); este efeito cobre a
// navegação pelo app (ex.: login → painel) e tira o atributo ao sair do painel.
import { useEffect } from 'react'

export default function VisualNovo() {
  useEffect(() => {
    const h = document.documentElement
    h.setAttribute('data-visual', 'ouro')
    try { localStorage.removeItem('oraculo_visual') } catch { /* era a chave do botão de validação */ }
    return () => { h.removeAttribute('data-visual') }
  }, [])
  return null
}
