'use client'
// 18/11/2026 — "APP DA LOJA" (Play Store / App Store). Dentro do app das lojas o Oráculo é SÓ PRA CLIENTE: nada de
// vender plano, crédito, curso ou teste grátis (a Apple e o Google exigem o pagamento deles pra venda digital dentro do
// app — decisão do João: a venda continua pelo site). Mesmo código do site; o que muda é esta marca.
//
// Como o app se identifica (o script do <head> do layout liga a marca ANTES de pintar, sem piscar botão de compra):
//   · abre com ?app=android|ios (start_url dos apps);
//   · Android (TWA): referrer android-app://…; iPhone: user agent com "OraculoApp/ios".
// Fica na sessionStorage (só naquela aba/app — o Chrome do celular da pessoa NÃO herda a marca).
// Com a marca: o CSS global (globals.css) esconde todo link de checkout (Greenn), /planos, /teste-gratis e tudo que
// tiver data-venda; as telas leem useAppLoja() pra trocar texto (assinatura vencida, carteira) e tirar abas.
import { useEffect, useState } from 'react'

export function emAppLoja(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.hasAttribute('data-app-loja')
}

/** true dentro do app da Play Store / App Store (false no servidor e no 1º render — o CSS já esconde o que precisa). */
export function useAppLoja(): boolean {
  const [v, setV] = useState(false)
  useEffect(() => { setV(emAppLoja()) }, [])
  return v
}
