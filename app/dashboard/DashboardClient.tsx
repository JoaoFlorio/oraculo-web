'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
const GestaoHub = dynamic(()=>import('./GestaoHub'),{ssr:false,loading:()=><div style={{padding:40,textAlign:'center',color:'#686890'}}>Carregando Gestão…</div>})

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:      'var(--bg)',
  sidebar: 'var(--sidebar)',
  card:    'var(--card)',
  cardHov: 'var(--cardHov)',
  modal:   'var(--modal)',
  line:    'var(--line)',
  lineG:   'var(--lineG)',
  gold:    'var(--gold)',
  goldG:   'var(--goldG)',
  goldSub: 'var(--goldSub)',
  g:       'var(--g)',
  a:       'var(--a)',
  r:       'var(--r)',
  pur:     'var(--pur)',
  t1:      'var(--t1)',
  t2:      'var(--t2)',
  t3:      'var(--t3)',
  t4:      'var(--t4)',
}
// Tinta translúcida a partir de um token de tema (substitui o antigo `${T.x}NN`).
const tint = (v:string, pct:number)=>`color-mix(in srgb, ${v} ${pct}%, transparent)`

/* ─── Plan config ────────────────────────────────────────────────────────── */
const PLAN_CFG: Record<string,{label:string;color:string;glow:string;limit:number;tabs:string[];modal:boolean;export:boolean}> = {
  // limit sincronizado com PLAN_LIMIT.free em app/api/products/route.ts (única fonte: server)
  free:     { label:'Gratuito',  color:T.t3,  glow:'rgba(104,104,144,0.3)', limit:6,    tabs:['bestsellers','extension','agente','perfil'],                                                                 modal:false, export:false },
  monthly:  { label:'Mensal',    color:T.pur, glow:'rgba(139,120,255,0.3)', limit:9999, tabs:['bestsellers','new','trending','generics','saved','competitor','extension','agente','financeiro','perfil'], modal:true,  export:false },
  biannual: { label:'Semestral', color:T.gold,glow:'rgba(240,180,41,0.3)',  limit:9999, tabs:['bestsellers','new','trending','generics','saved','competitor','extension','agente','financeiro','perfil'], modal:true,  export:true  },
  annual:   { label:'Anual',     color:T.g,   glow:'rgba(34,197,94,0.3)',   limit:9999, tabs:['bestsellers','new','trending','generics','saved','competitor','extension','agente','financeiro','perfil'], modal:true,  export:true  },
  lifetime: { label:'Vitalício', color:T.g,   glow:'rgba(34,197,94,0.3)',   limit:9999, tabs:['bestsellers','new','trending','generics','saved','competitor','extension','agente','financeiro','perfil'], modal:true,  export:true  },
}
// Links Greenn — plataforma de pagamento ativa
const GREENN: Record<string,string> = {
  monthly:  'https://payfast.greenn.com.br/pm36pq4/offer/B0febG',
  biannual: 'https://payfast.greenn.com.br/pm36pq4/offer/rpgHFd',
  annual:   'https://payfast.greenn.com.br/pm36pq4/offer/WBkId3',
  lifetime: 'https://payfast.greenn.com.br/pm36pq4/offer/WBkId3', // fallback → anual
}
// Preços reais dos planos (fonte: oferta Greenn ativa)
const PLAN_PRICE: Record<string,string> = {
  monthly:  'R$ 79,90/mês',
  biannual: 'R$ 397/semestre',
  annual:   'R$ 597/ano',
}
// Economia REAL do Anual vs 12× Mensal: 12×79,90 = R$ 958,80 − R$ 597 = R$ 361,80 (38%)
const ANNUAL_ECON     = 12*79.90 - 597
const ANNUAL_ECON_PCT = Math.round((ANNUAL_ECON/(12*79.90))*100)
const ANNUAL_ECON_FMT = ANNUAL_ECON.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

/* ─── Data ───────────────────────────────────────────────────────────────── */
const CATS = [
  { id:'all',             label:'Todas'          }, // cross-categoria (default)
  { id:'electronics',     label:'Eletrônicos'    },
  { id:'computers',       label:'Computadores'   },
  { id:'home',            label:'Casa e Cozinha' },
  { id:'sports',          label:'Esportes'       },
  { id:'beauty',          label:'Beleza'         },
  { id:'toys',            label:'Brinquedos'     },
  { id:'tools',           label:'Ferramentas'    },
  { id:'pet-supplies',    label:'Pet Shop'       },
  { id:'health',          label:'Saúde'          },
  { id:'office-products', label:'Escritório'     },
]
const NAV = [
  { id:'financeiro',  label:'Gestão'            },
  { id:'bestsellers', label:'Mais Vendidos'     },
  { id:'new',         label:'Recém Adicionados' },
  { id:'trending',    label:'Em Alta'           },
  { id:'generics',    label:'Genéricos'         },
  { id:'saved',       label:'Salvos'            },
  { id:'competitor',  label:'Análise Rival'     },
  { id:'agente',      label:'Agente IA'         },
  { id:'extension',   label:'Extensão'          },
  { id:'perfil',      label:'Meu Perfil'        },
]
const NAV_GROUPS = [
  { group:'Gestão',      ids:['financeiro'] },
  { group:'Mineração',   ids:['bestsellers','new','trending','generics','saved','competitor'] },
  { group:'Ferramentas', ids:['agente','extension'] },
  { group:'Conta',       ids:['perfil'] },
]
const REF: Record<string,number> = {
  electronics:.08, computers:.08, health:.08, tools:.12, toys:.16,
  home:.15, sports:.15, beauty:.15, 'pet-supplies':.15, 'office-products':.15,
}
const DEF_P: Record<string,number> = {
  electronics:150, computers:800, home:80, sports:120, beauty:60,
  toys:70, tools:90, 'pet-supplies':50, health:80, 'office-products':45,
}

/* ─── Utils ──────────────────────────────────────────────────────────────── */
const bsrSales=(b:number)=>{if(!b)return 0;if(b<=50)return 600;if(b<=150)return 280;if(b<=300)return 200;if(b<=600)return 140;if(b<=1000)return 100;if(b<=2000)return 65;if(b<=5000)return 35;if(b<=10000)return 20;if(b<=30000)return 10;if(b<=60000)return 5;if(b<=100000)return 3;return 1}
const fmtK =(n:number)=>n>=1000?`${(n/1000).toFixed(1).replace('.0','')}k`:`${n}`
const fmtN =(n:number)=>Math.round(n).toLocaleString('pt-BR')
const fmtR =(n:number)=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const sColor=(s:number)=>s>=70?T.g:s>=50?T.a:T.r
// Pisos IDÊNTICOS ao DEMAND_FLOORS do backend (salesEstimate.ts) — fonte única de
// "nível de demanda". Alinhar aqui evita o card dizer "Alta" e o backend "Média".
const dInfo =(s:number)=>s>=400?{l:'Muito Alta',c:T.g}:s>=150?{l:'Alta',c:T.g}:s>=65?{l:'Média',c:T.a}:s>=30?{l:'Baixa',c:T.a}:{l:'Muito Baixa',c:T.r}
// Nível de demanda: prefere o rótulo já calculado pelo backend (pool), cai no dInfo local.
const demInfo=(p:any,sales:number)=> p?.demandLabel ? {l:p.demandLabel as string, c:(p.demandColor as string)||dInfo(sales).c} : dInfo(sales)
// Score para cards: usa BSR + vendas estimadas + genérico (sem margem — não disponível no card)
function cardScore(bsr:number,salesEst:number,isGeneric:boolean):number{
  const b=bsr<=50?40:bsr<=200?35:bsr<=500?28:bsr<=1000?22:bsr<=3000?16:bsr<=10000?10:bsr<=30000?6:2
  const s=salesEst>=600?35:salesEst>=280?28:salesEst>=200?22:salesEst>=140?16:salesEst>=100?12:salesEst>=65?8:salesEst>=35?5:2
  const g=isGeneric?14:0
  return Math.min(100,Math.max(5,b+s+g+11))
}
// Score para modal: BSR granular + margem real + bônus genérico (atualiza com input do usuário)
function oScore(bsr:number,m:number,isGeneric=false):number{
  const b=bsr<=10?45:bsr<=50?40:bsr<=100?34:bsr<=200?28:bsr<=500?22:bsr<=1000?16:bsr<=2000?11:bsr<=5000?7:bsr<=10000?4:bsr<=50000?2:1
  const mg=m>=40?35:m>=30?28:m>=20?20:m>=10?12:m>=0?6:0
  const g=isGeneric?10:0
  return Math.min(100,Math.max(5,b+mg+g+10))
}
// Score composto real: penaliza listing fraco mesmo com boa demanda
function realScore(bsr:number, m:number, isGeneric:boolean, breakdown:any, numImages:number, reviewCount:number):number {
  // Demand (max 35) — same as oScore BSR component
  const d = bsr<=10?35:bsr<=50?30:bsr<=100?25:bsr<=200?20:bsr<=500?16:bsr<=1000?12:bsr<=5000?7:bsr<=30000?4:2
  // Listing quality (max 40)
  const imgPts = numImages>=7?14:numImages>=5?11:numImages>=3?7:numImages>=1?3:0
  const bltPts = breakdown ? Math.round((breakdown.bullets.score/breakdown.bullets.max)*12) : 6
  const titPts = breakdown ? Math.round((breakdown.title.score/breakdown.title.max)*8) : 4
  const genPts = isGeneric ? 8 : 0  // generic = opportunity
  // Reviews (max 15)
  const revPts = reviewCount>=1000?15:reviewCount>=200?11:reviewCount>=50?7:reviewCount>=10?4:1
  // Margin (max 10)
  const mgPts = m>=35?10:m>=25?8:m>=15?5:m>=5?2:0
  return Math.min(100, Math.max(5, d+imgPts+bltPts+titPts+genPts+revPts+mgPts))
}
// Estima idade do anúncio pelo prefixo do ASIN
function asinToAge(asin:string):string{
  if(!asin||!asin.startsWith('B'))return'Desconhecido'
  const p=asin.substring(0,3)
  if(p<='B07')return'6+ anos'
  if(p<='B08')return'5-6 anos'
  if(p<='B09')return'4-5 anos'
  if(p<='B0B')return'3-4 anos'
  if(p<='B0C')return'2-3 anos'
  if(p<='B0D')return'~2 anos'
  if(p<='B0F')return'~1 ano'
  return'Recente'
}

/* ─── CSV export ─────────────────────────────────────────────────────────── */
function exportCSV(products: any[], category: string) {
  // Escapa qualquer célula com vírgula/aspas/quebra de linha (evita desalinhar colunas)
  const esc = (v: any) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s
  }
  const rows = [
    ['ASIN','Título','Marca','Categoria','BSR','Vendas/mês Estimadas','Score'],
    ...products.map(p => {
      // mesma derivação do Card: fallback de vendas via BSR e genérico inclui 'genérico'
      const sales = p.salesEst || bsrSales(p.bsr||0)
      const isGeneric = !p.brand || p.brand.trim()==='' || p.brand.toLowerCase()==='genérico'
      return [
        esc(p.asin), esc(p.title||''), esc(p.brand||''), esc(p.category||''),
        p.bsr||0, sales, cardScore(p.bsr||0, sales, isGeneric),
      ]
    })
  ]
  const csv  = rows.map(r=>r.join(',')).join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `oraculo-${category}-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}


/* ─── Suporte WhatsApp ───────────────────────────────────────────────────── */
const WA_LINK = 'https://wa.me/5541987474416?text=Ol%C3%A1!%20Sou%20cliente%20do%20Or%C3%A1culo%20e%20preciso%20de%20ajuda.'
function WaIcon({size=18,c='#fff'}:{size?:number;c?:string}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
      <path d="M12.04 3.5a8.4 8.4 0 0 0-7.27 12.6L3.5 20.5l4.53-1.24a8.4 8.4 0 1 0 4.01-15.76z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9.2 8.4c-.2-.45-.4-.46-.6-.47l-.5-.01c-.18 0-.46.07-.7.33s-.92.9-.92 2.2 .94 2.55 1.07 2.73c.13.17 1.82 2.9 4.48 3.95 2.21.87 2.66.7 3.14.65.48-.04 1.55-.63 1.77-1.24.22-.61.22-1.13.15-1.24-.06-.11-.24-.17-.5-.3s-1.55-.77-1.79-.85c-.24-.09-.42-.13-.59.13-.17.26-.68.85-.83 1.03-.15.17-.31.2-.57.07-.26-.13-1.1-.41-2.1-1.3-.78-.7-1.3-1.55-1.46-1.81-.15-.26-.02-.4.12-.53.11-.12.26-.31.39-.46.13-.15.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.57-1.4-.8-1.91z" fill={c}/>
    </svg>
  )
}

/* ─── Logo mark ──────────────────────────────────────────────────────────── */
function OracleMark({size=22}:{size?:number}){
  // Olho do Oráculo v2 — contorno almond com gradiente dourado, cílios finos
  // assimétricos que nascem da borda do olho e íris com brilho radial.
  // Ids de gradiente únicos por instância (React.useId) p/ coexistir na mesma página.
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g,'')
  const gid = `oraG${uid}`, iid = `oraI${uid}`
  // cílios: [ângulo°, comprimento, opacidade, espessura] — assimétricos de propósito
  const lashes:[number,number,number,number][] = [
    [-90,3.4,.95,.95],[-64,2.6,.72,.8],[-116,3.0,.82,.85],[-40,1.8,.5,.7],[-142,2.2,.6,.7],
    [ 90,3.0,.85,.9],[ 63,2.0,.55,.75],[118,2.5,.7,.8],[144,1.7,.45,.65],[36,1.4,.38,.6],
  ]
  const rx=13.4, ry=5.1 // semi-eixos aproximados do almond
  return(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      style={{filter:'drop-shadow(0 0 7px rgba(240,180,41,0.5))'}}>
      <defs>
        <linearGradient id={gid} x1="4" y1="7" x2="28" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#FFE7A6"/>
          <stop offset="52%" stopColor="#F0B429"/>
          <stop offset="100%" stopColor="#C48F10"/>
        </linearGradient>
        <radialGradient id={iid} cx="38%" cy="34%" r="85%">
          <stop offset="0%"  stopColor="#FFF3CF"/>
          <stop offset="45%" stopColor="#F5C654"/>
          <stop offset="100%" stopColor="#9C6D06"/>
        </radialGradient>
      </defs>
      {lashes.map(([a,len,o,w],i)=>{
        const rad=a*Math.PI/180
        const edge=(rx*ry)/Math.sqrt((ry*Math.cos(rad))**2+(rx*Math.sin(rad))**2)
        const r1=edge+0.7, r2=edge+0.7+len
        const x1=(16+Math.cos(rad)*r1).toFixed(2), y1=(16+Math.sin(rad)*r1).toFixed(2)
        const x2=(16+Math.cos(rad)*r2).toFixed(2), y2=(16+Math.sin(rad)*r2).toFixed(2)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${gid})`} strokeWidth={w} strokeLinecap="round" opacity={o}/>
      })}
      {/* almond externo + interno (linha dupla) */}
      <path d="M2.6 16 C 7.5 9.2, 24.5 9.2, 29.4 16 C 24.5 22.8, 7.5 22.8, 2.6 16 Z"
        stroke={`url(#${gid})`} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M6.4 16 C 10.4 10.9, 21.6 10.9, 25.6 16 C 21.6 21.1, 10.4 21.1, 6.4 16 Z"
        stroke={`url(#${gid})`} strokeWidth=".8" opacity=".5" strokeLinejoin="round"/>
      {/* íris com anel gradiente + miolo radial + pupila + brilho */}
      <circle cx="16" cy="16" r="5.3" stroke={`url(#${gid})`} strokeWidth="1.6"/>
      <circle cx="16" cy="16" r="3.5" fill={`url(#${iid})`}/>
      <circle cx="16" cy="16" r="1.15" fill="#2A1D03"/>
      <circle cx="14.8" cy="14.7" r=".75" fill="rgba(255,255,255,0.9)"/>
    </svg>
  )
}

/* ─── Nav icons ──────────────────────────────────────────────────────────── */
function NavIcon({id,active}:{id:string,active:boolean}){
  const c = active ? T.gold : T.t2
  const icons:Record<string,React.ReactElement> = {
    bestsellers: <><path d="M6 20l4-7 4 5 3-4 3 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="8" r="1.5" fill="currentColor"/></>,
    new:         <><rect x="6" y="6" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M14 12h6M14 16h4M14 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    trending:    <><path d="M5 19l5-6 4 3 5-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 8h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
    generics:    <><circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M13 13h6M13 16h6M13 19h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    saved:       <><path d="M9 6.5A1.5 1.5 0 0 1 10.5 5h11A1.5 1.5 0 0 1 23 6.5V26l-7-4.2L9 26z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></>,
    search:      <><circle cx="14" cy="14" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M19.5 19.5L26 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    competitor: <><circle cx="16" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="20" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="22" cy="20" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M13 13l-1.5 4M19 13l1.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>,
    extension:  <><rect x="5" y="5" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M11 5v4a2 2 0 01-2 2H5M19 14h-2a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    agente:     <><circle cx="14" cy="10" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 15c-3 1.5-5 4-5 7h18c0-3-2-5.5-5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 10v3M12 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
    financeiro: <><path d="M6 20V14M10 20V10M14 20V6M18 20V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 8l4-3 4 4 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
    perfil:     <><circle cx="14" cy="10.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 23c1.3-4.4 4.7-6.8 8.5-6.8s7.2 2.4 8.5 6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>,
  }
  return(
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" style={{flexShrink:0,color:c}}>
      {icons[id]}
    </svg>
  )
}

/* ─── Ícone SVG (substitui emojis estruturais) ───────────────────────────── */
function Ico({n,size=16,c='currentColor'}:{n:string;size?:number;c?:string}){
  const p:Record<string,React.ReactElement> = {
    puzzle:  <path d="M9 4.5a1.6 1.6 0 1 1 3.2 0V6h2.3a1 1 0 0 1 1 1v2.3h1.5a1.6 1.6 0 1 1 0 3.2H16V15a1 1 0 0 1-1 1h-2.3v1.5a1.6 1.6 0 1 1-3.2 0V16H7.2a1 1 0 0 1-1-1v-2.3H4.7a1.6 1.6 0 1 1 0-3.2h1.5V7a1 1 0 0 1 1-1H9z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>,
    key:     <><circle cx="8" cy="8" r="3.2" stroke={c} strokeWidth="1.5"/><path d="M10.3 10.3 19 19M16 16l2-2M14 14l2-2" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
    lock:    <><rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke={c} strokeWidth="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    demand:  <><path d="M4 20V4M4 20h16" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><rect x="7" y="12" width="3" height="5" rx="1" stroke={c} strokeWidth="1.4"/><rect x="12" y="8" width="3" height="9" rx="1" stroke={c} strokeWidth="1.4"/><rect x="17" y="5" width="3" height="12" rx="1" stroke={c} strokeWidth="1.4"/></>,
    images:  <><rect x="4" y="5" width="16" height="14" rx="2" stroke={c} strokeWidth="1.5"/><circle cx="9" cy="10" r="1.6" stroke={c} strokeWidth="1.3"/><path d="m5 17 4.5-4 3 2.5L16 12l3 3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>,
    bullets: <><circle cx="5.5" cy="7" r="1.2" fill={c}/><circle cx="5.5" cy="12" r="1.2" fill={c}/><circle cx="5.5" cy="17" r="1.2" fill={c}/><path d="M9 7h11M9 12h11M9 17h7" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    title:   <><path d="M5 7V5.5h14V7M12 5.5V19M9.5 19h5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
    generic: <><path d="M4 12.5 11.5 5a1.8 1.8 0 0 1 1.3-.5H18a1.5 1.5 0 0 1 1.5 1.5v5.2a1.8 1.8 0 0 1-.5 1.3L11.5 20a1.5 1.5 0 0 1-2.1 0L4 14.6a1.5 1.5 0 0 1 0-2.1z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><circle cx="15.5" cy="8.5" r="1.2" fill={c}/></>,
    clock:   <><circle cx="12" cy="12" r="8" stroke={c} strokeWidth="1.5"/><path d="M12 7.5V12l3 2" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
    cash:    <><rect x="3" y="6.5" width="18" height="11" rx="2" stroke={c} strokeWidth="1.5"/><circle cx="12" cy="12" r="2.6" stroke={c} strokeWidth="1.4"/><path d="M6.5 9.5h.01M17.5 14.5h.01" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></>,
    gift:    <><rect x="4" y="9" width="16" height="11" rx="1.5" stroke={c} strokeWidth="1.5"/><path d="M3.5 9h17M12 9v11M12 9c-1.5-3.5-6-3-5 0M12 9c1.5-3.5 6-3 5 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
    truck:   <><path d="M3 6.5h10v9H3zM13 9.5h4l3 3v3h-7z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><circle cx="7" cy="17.5" r="1.8" stroke={c} strokeWidth="1.4"/><circle cx="16.5" cy="17.5" r="1.8" stroke={c} strokeWidth="1.4"/></>,
    sparkles:<><path d="M12 4.5 13.4 9 18 10.5 13.4 12 12 16.5 10.6 12 6 10.5 10.6 9z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/><path d="M18 5v3M19.5 6.5h-3" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></>,
    star:    <path d="m12 4 2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 16.9l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>,
    ticket:  <><path d="M4 8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2.2a1.8 1.8 0 0 0 0 3.6V16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.2a1.8 1.8 0 0 0 0-3.6z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><path d="M13 8v8" stroke={c} strokeWidth="1.3" strokeDasharray="1.5 2"/></>,
    trending:<><path d="M4 17 10 11l3.5 3L20 7" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.5 7H20v4.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
    robot:   <><rect x="5" y="8" width="14" height="10" rx="2.5" stroke={c} strokeWidth="1.5"/><path d="M12 5.5V8M12 4.2v1.3" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><circle cx="9.3" cy="13" r="1.2" fill={c}/><circle cx="14.7" cy="13" r="1.2" fill={c}/><path d="M3.5 12v3M20.5 12v3" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    search:  <><circle cx="11" cy="11" r="6" stroke={c} strokeWidth="1.6"/><path d="m15.5 15.5 4 4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></>,
    bulb:    <><path d="M9 16.5a5.5 5.5 0 1 1 6 0V18a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><path d="M9.5 21h5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    pin:     <><path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="11" r="2.2" stroke={c} strokeWidth="1.4"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{flexShrink:0,display:'inline-block',verticalAlign:'-0.18em'}}>{p[n]||p.sparkles}</svg>
}
// Mapeia emojis legados (usados em listas de dados) para os ícones SVG do Ico.
const EMOJI_MAP:Record<string,string> = {
  '📸':'images','🖼️':'images','🖼':'images','⭐':'star','🔤':'title','📝':'bullets',
  '✨':'sparkles','🏷️':'generic','🏷':'generic','🎫':'ticket','💰':'cash','📈':'trending',
  '🔍':'search','📊':'demand','🤖':'robot','💡':'bulb','📌':'pin','🎁':'gift','🚚':'truck','📦':'cash',
}
function EmojiIco({e,size=16,c='currentColor'}:{e?:string;size?:number;c?:string}){
  const n = e ? EMOJI_MAP[e] : undefined
  if(!n) return <span style={{color:c}}>{e||'•'}</span>
  return <Ico n={n} size={size} c={c}/>
}

/* ─── Score ring ─────────────────────────────────────────────────────────── */
function ScoreRing({score}:{score:number}){
  const c=sColor(score);const r=9;const circ=2*Math.PI*r
  return(
    <svg width="28" height="28" viewBox="0 0 28 28" style={{flexShrink:0}}>
      <circle cx="14" cy="14" r={r} fill="none" style={{stroke:T.line}} strokeWidth="2.5"/>
      <circle cx="14" cy="14" r={r} fill="none" stroke={c} strokeWidth="2.5"
        strokeDasharray={`${circ*(score/100)} ${circ}`} strokeDashoffset={circ*.25} strokeLinecap="round"/>
      <text x="14" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill={c} fontFamily="inherit">{score}</text>
    </svg>
  )
}

/* ─── Upgrade modal ──────────────────────────────────────────────────────── */
function UpgradeModal({onClose}:{onClose:()=>void}){
  const plans = [
    { id:'monthly',  label:'Mensal',    price:'R$ 79,90', period:'/mês',      color:T.pur,  features:['7 ferramentas (+ Gestão em breve)','Extensão Chrome incluída','Agente IA ilimitado','Simulador Financeiro'] },
    { id:'biannual', label:'Semestral', price:'R$ 397',   period:'/6 meses',  color:T.gold, features:['Tudo do plano Mensal','6 meses de acesso','Exportar CSV','Prioridade no suporte'], best:true },
    { id:'annual',   label:'Anual',     price:'R$ 597',   period:'/ano',      color:T.g,    features:['Tudo do plano Semestral','12 meses de acesso','Suporte VIP','Acesso antecipado a novidades'] },
  ]
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(1,1,8,0.94)',backdropFilter:'blur(14px)',zIndex:1000,overflowY:'auto',padding:'40px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:720,background:T.modal,border:`1px solid ${T.lineG}`,borderRadius:20,overflow:'hidden',boxShadow:'0 40px 80px rgba(0,0,0,0.8)'}}>

        {/* Header */}
        <div style={{padding:'32px 32px 24px',textAlign:'center' as const,borderBottom:`1px solid ${T.line}`,background:`linear-gradient(180deg,rgba(240,180,41,0.07) 0%,transparent 100%)`}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
            <div style={{width:52,height:52,borderRadius:14,background:'rgba(240,180,41,0.1)',border:`1px solid rgba(240,180,41,0.25)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <OracleMark size={28}/>
            </div>
          </div>
          <h2 style={{fontSize:22,fontWeight:800,color:T.t1,letterSpacing:'-0.03em',marginBottom:8}}>Desbloqueie o ORÁCULO Completo</h2>
          <p style={{fontSize:13,color:T.t2,lineHeight:1.6,maxWidth:420,margin:'0 auto'}}>
            Você está no plano Gratuito. Faça upgrade para acessar análise completa, mais produtos e todos os recursos de mineração.
          </p>
        </div>

        {/* Plans */}
        <div style={{padding:'28px 28px 24px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {plans.map(plan=>(
            <div key={plan.id} style={{
              background:plan.best?tint(plan.color,3):T.card,
              border:`1px solid ${plan.best?tint(plan.color,21):T.line}`,
              borderRadius:14,padding:'20px 18px',position:'relative' as const,
              boxShadow:plan.best?`0 0 30px ${tint(plan.color,8)}`:undefined,
            }}>
              {plan.best&&(
                <div style={{position:'absolute',top:-11,left:'50%',transform:'translateX(-50%)',background:plan.color,color:'#02020A',fontSize:9,fontWeight:800,padding:'3px 12px',borderRadius:99,letterSpacing:'0.1em',whiteSpace:'nowrap' as const}}>
                  MAIS POPULAR
                </div>
              )}
              <div style={{fontSize:9,fontWeight:700,color:plan.color,letterSpacing:'0.14em',marginBottom:8}}>{plan.label.toUpperCase()}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:3,marginBottom:4}}>
                <span style={{fontSize:24,fontWeight:800,color:T.t1,letterSpacing:'-0.03em'}}>{plan.price}</span>
                <span style={{fontSize:10,color:T.t3}}>{plan.period}</span>
              </div>
              <div style={{borderTop:`1px solid ${T.line}`,marginTop:14,paddingTop:14,display:'flex',flexDirection:'column',gap:7,marginBottom:18}}>
                {plan.features.map((f,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:7}}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" fill={plan.color} opacity=".2"/><path d="M3.5 6l1.8 1.8L8.5 4.5" stroke={plan.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{fontSize:11,color:T.t2}}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={GREENN[plan.id]} target="_blank" rel="noreferrer"
                style={{display:'block',textAlign:'center' as const,background:plan.best?plan.color:'none',color:plan.best?'#02020A':plan.color,border:plan.best?'none':`1px solid ${tint(plan.color,25)}`,fontWeight:700,fontSize:11,padding:'11px',borderRadius:9,letterSpacing:'0.08em',textDecoration:'none',textTransform:'uppercase' as const,transition:'all .15s'}}>
                Assinar
              </a>
            </div>
          ))}
        </div>

        <div style={{padding:'0 28px 28px',textAlign:'center' as const}}>
          <button onClick={onClose} style={{background:'none',border:'none',color:T.t3,cursor:'pointer',fontSize:12,fontFamily:'inherit',letterSpacing:'0.04em'}}>
            Continuar com plano gratuito →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Promo types ────────────────────────────────────────────────────────── */
type PromoState = { active:boolean; type:'comissao'|'fba'|'ambas'|null }

/* ─── Promo Modal ────────────────────────────────────────────────────────── */
function PromoModal({promo,setPromo,onClose}:{promo:PromoState;setPromo:(p:PromoState)=>void;onClose:()=>void}){
  const [active,setActive]=useState<boolean|null>(promo.active?true:null)
  const [type,setType]=useState<'comissao'|'fba'|'ambas'|null>(promo.type)

  function apply(){
    if(active===false){setPromo({active:false,type:null});onClose();return}
    if(active===true&&type){setPromo({active:true,type});onClose()}
  }

  const canApply = active===false||(active===true&&type!==null)

  const typeOpts:[string,'comissao'|'fba'|'ambas',string,string][]=[
    ['cash','comissao','Comissão de Referência','Taxa % sobre venda zerada'],
    ['truck','fba','Tarifa FBA','Frete + fulfillment zerado'],
    ['sparkles','ambas','Ambas','Comissão E FBA zeradas'],
  ]

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(1,1,8,0.92)',backdropFilter:'blur(14px)',zIndex:910,overflowY:'auto',padding:'32px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:460,background:T.modal,border:`1px solid ${T.lineG}`,borderRadius:20,overflow:'hidden',boxShadow:'0 40px 80px rgba(0,0,0,0.8)'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'22px 24px 18px',borderBottom:`1px solid ${T.line}`,background:`linear-gradient(180deg,rgba(240,180,41,0.06) 0%,transparent 100%)`}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4,display:'flex',alignItems:'center',gap:8,color:T.t1}}><Ico n="gift" size={18} c={T.gold}/> Promoção Amazon Ativa?</div>
            <div style={{fontSize:12,color:T.t3}}>Configure a isenção de tarifas para este período</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:`1px solid ${T.line}`,color:T.t2,width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit'}}>✕</button>
        </div>
        <div style={{padding:'24px'}}>
          {/* Question */}
          <div style={{fontSize:13,fontWeight:600,color:T.t1,marginBottom:16}}>A Amazon liberou isenção de tarifas para sua conta neste período?</div>
          {/* Yes/No pills */}
          <div style={{display:'flex',gap:10,marginBottom:24}}>
            <button onClick={()=>setActive(false)}
              style={{flex:1,padding:'12px',borderRadius:12,border:`1.5px solid ${active===false?'rgba(160,160,200,0.6)':T.line}`,
                background:active===false?'rgba(160,160,200,0.1)':'transparent',color:active===false?T.t1:T.t3,
                fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
              Não, desativar
            </button>
            <button onClick={()=>setActive(true)}
              style={{flex:1,padding:'12px',borderRadius:12,border:`1.5px solid ${active===true?T.gold:T.line}`,
                background:active===true?'rgba(240,180,41,0.08)':'transparent',color:active===true?T.gold:T.t3,
                fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',transition:'all .15s',
                boxShadow:active===true?`0 0 20px rgba(240,180,41,0.15)`:undefined}}>
              Sim, ativar
            </button>
          </div>
          {/* Type selection */}
          {active===true&&(
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:700,color:T.t3,letterSpacing:'0.1em',marginBottom:12}}>Qual isenção está ativa?</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {typeOpts.map(([icon,val,title,desc])=>(
                  <button key={val} onClick={()=>setType(val)}
                    style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,
                      border:`1.5px solid ${type===val?T.gold:T.line}`,
                      background:type===val?'rgba(240,180,41,0.06)':'transparent',
                      cursor:'pointer',fontFamily:'inherit',textAlign:'left' as const,transition:'all .15s',
                      boxShadow:type===val?`0 0 16px rgba(240,180,41,0.12)`:undefined}}>
                    <span style={{flexShrink:0,color:type===val?T.gold:T.t2}}><Ico n={icon} size={20} c={type===val?T.gold:T.t2}/></span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:type===val?T.t1:T.t2,marginBottom:2}}>{title}</div>
                      <div style={{fontSize:11,color:T.t3}}>{desc}</div>
                    </div>
                    {type===val&&<div style={{width:18,height:18,borderRadius:'50%',background:T.gold,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="#02020A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Apply button */}
          <button onClick={apply} disabled={!canApply}
            style={{width:'100%',padding:'14px',borderRadius:12,border:'none',cursor:canApply?'pointer':'not-allowed',fontFamily:'inherit',
              fontWeight:700,fontSize:13,letterSpacing:'0.06em',transition:'all .15s',
              background:canApply?T.goldG:'rgba(255,255,255,0.05)',
              color:canApply?'#02020A':T.t3,
              boxShadow:canApply?'0 4px 20px rgba(240,180,41,0.3)':undefined}}>
            Aplicar em todo o sistema
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Detail modal ───────────────────────────────────────────────────────── */
function DetailModal({product,onClose,promo}:{product:any;onClose:()=>void;promo:PromoState}){
  const catId=CATS.find(c=>product.category?.toLowerCase().includes(c.label.toLowerCase().split(' ')[0]))?.id||'home'
  const defP = product.price>0 ? Math.round(product.price) : (DEF_P[catId]||99)
  const [price,setPrice]=useState(defP)
  const [cost,setCost]=useState(Math.round(defP*.3))
  const [lsData,setLsData]=useState<any>(null)
  const [lsLoading,setLsLoading]=useState(true)
  const [realPrice,setRealPrice]=useState(product.price>0)
  // true depois que o usuário edita preço/custo — o fetch não sobrescreve mais os inputs
  const userTouched=useRef(false)

  // Busca score real do listing via SP-API (inclui preço real + vendas calibradas)
  useEffect(()=>{
    if(!product.asin) return
    setLsLoading(true)
    fetch(`/api/listing-score?asin=${product.asin}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.score) setLsData(d)
        if(d.price>0 && !userTouched.current){ setPrice(Math.round(d.price)); setCost(Math.round(d.price*.3)); setRealPrice(true) }
      })
      .catch(()=>{})
      .finally(()=>setLsLoading(false))
  },[product.asin])

  const bsr=product.bsr||0
  const sales=lsData?.salesEst||product.salesEst||bsrSales(bsr)
  // Se a listing-score trouxe vendas próprias, recalcula pelo dInfo (mesmos pisos);
  // senão usa o rótulo do backend. Coerente em qualquer caminho.
  const dem=lsData?.salesEst?dInfo(sales):demInfo(product,sales)
  const ref=REF[catId]||.15
  const refFee=promo.active&&(promo.type==='comissao'||promo.type==='ambas') ? 0 : +(price*ref).toFixed(2)
  const fba=promo.active&&(promo.type==='fba'||promo.type==='ambas') ? 0 : (price<50?12:price<150?18:price<400?24:32)
  const fbaBase=price<50?12:price<150?18:price<400?24:32
  const profit=+(price-refFee-fba-cost).toFixed(2)
  const margin=price>0?+((profit/price)*100).toFixed(1):0
  const roi=cost>0?+((profit/cost)*100).toFixed(1):0
  const modalGeneric=!product.brand||product.brand.trim()===''
  const numImages = product.images?.length ?? 0
  const reviewCount = lsData?.reviews || product.reviewCount || 0
  const rating = lsData?.rating || product.rating || 0
  // Score composto real: penaliza listing fraco mesmo com boa demanda
  const score = realScore(bsr, margin, modalGeneric, lsData?.breakdown ?? null, numImages, reviewCount)
  const sc=sColor(score)
  const verdictDetails = (() => {
    const parts:string[] = []
    if(bsr>0&&bsr<=100) parts.push(`BSR #${fmtN(bsr)} indica demanda excepcional`)
    else if(bsr>0&&bsr<=1000) parts.push(`BSR #${fmtN(bsr)} — demanda ${dem.l.toLowerCase()}`)
    if(margin>=30) parts.push(`margem sólida de ${margin}%`)
    else if(margin>0) parts.push(`margem de ${margin}% (tente reduzir CMV)`)
    if(numImages<4) parts.push(`⚠️ apenas ${numImages} imagem(ns) — ponto crítico`)
    if(reviewCount<15&&reviewCount>0) parts.push(`⚠️ só ${reviewCount} review(s) — priorize conseguir mais`)
    if(reviewCount===0) parts.push(`⚠️ sem reviews — risco alto`)
    if(modalGeneric) parts.push(`nicho genérico sem marca dominante`)
    return parts.length>0 ? parts.join(' · ') : 'Analise os pontos acima antes de decidir.'
  })()
  const verdict = score>=75
    ? {l:'Excelente Oportunidade',c:T.g,  s:verdictDetails}
    : score>=55
    ? {l:'Boa Oportunidade',      c:T.g,  s:verdictDetails}
    : score>=38
    ? {l:'Potencial Médio',       c:T.a,  s:verdictDetails}
    : {l:'Baixo Potencial',       c:T.r,  s:verdictDetails}

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(1,1,8,0.92)',backdropFilter:'blur(12px)',zIndex:900,overflowY:'auto',padding:'32px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:860,background:T.modal,border:`1px solid ${T.line}`,borderRadius:18,overflow:'hidden',boxShadow:'0 40px 80px rgba(0,0,0,0.8)'}}>
        {/* Header */}
        <div style={{display:'flex',gap:20,alignItems:'flex-start',padding:'24px 28px',borderBottom:`1px solid ${T.line}`,background:`linear-gradient(180deg,rgba(240,180,41,0.04) 0%,transparent 100%)`}}>
          <div style={{width:84,height:84,background:'#F8F8F8',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {product.images?.[0]?<img src={product.images[0]} alt="" style={{maxWidth:70,maxHeight:70,objectFit:'contain'}}/>:<div style={{width:32,height:32,background:'#e0e0e0',borderRadius:6}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:15,fontWeight:600,color:T.t1,lineHeight:1.55,marginBottom:12,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{product.title}</p>
            <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
              {product.asin&&<Chip text={`ASIN ${product.asin}`} c={T.t3}/>}
              {product.category&&<Chip text={product.category} c={T.gold}/>}
              {product.brand&&<Chip text={product.brand} c={T.pur}/>}
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:`1px solid ${T.line}`,color:T.t2,width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit'}}>✕</button>
        </div>
        {/* KPIs */}
        <div className="ora-kpis4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:`1px solid ${T.line}`}}>
          {[{v:bsr>0?`#${fmtN(bsr)}`:'—',l:'BSR Amazon',c:T.t1,num:true},{v:`~${fmtK(sales)}/mês`,l:'Vendas estimadas',c:dem.c,num:true},{v:dem.l,l:'Nível de Demanda',c:dem.c,num:false},{v:lsLoading?'…':`${score}/100`,l:lsData?'Score Real Listing':'Score Oráculo',c:sc,num:true}].map((k,i)=>(
            <div key={i} style={{padding:'18px 20px',borderRight:i<3?`1px solid ${T.line}`:'none',textAlign:'center' as const}}>
              <div className={k.num?'ora-num':undefined} style={{fontSize:20,fontWeight:700,color:k.c,letterSpacing:'-0.02em',marginBottom:4,lineHeight:1}}>{k.v}</div>
              <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>{k.l}</div>
            </div>
          ))}
        </div>
        {/* Avaliação real (coletada pela extensão) */}
        {(rating>0||reviewCount>0)&&(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:'12px 20px',borderBottom:`1px solid ${T.line}`,background:'rgba(34,197,94,0.05)'}}>
            <span style={{fontSize:14,fontWeight:700,color:T.gold}}>★ {rating>0?rating.toFixed(1):'—'}</span>
            <span style={{fontSize:12,color:T.t2}}>{reviewCount>0?`${fmtN(reviewCount)} avaliações`:'sem avaliações'}</span>
            <span style={{fontSize:8,fontWeight:700,color:T.g,letterSpacing:'0.08em',textTransform:'uppercase' as const,border:`1px solid rgba(34,197,94,0.3)`,borderRadius:5,padding:'3px 7px'}}>● Dado real da Amazon</span>
          </div>
        )}

        {/* Score breakdown — aparece quando os dados reais do listing chegam */}
        {lsData?.breakdown&&(
          <div style={{padding:'16px 28px',borderBottom:`1px solid ${T.line}`,background:`${tint(T.card,50)}`}}>
            <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:12}}>Score do Listing — Critérios Reais</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
              {([
                {key:'demand',  label:'Demanda'},
                {key:'images',  label:'Imagens'},
                {key:'bullets', label:'Bullets'},
                {key:'title',   label:'Título'},
                {key:'generic', label:'Marca'},
              ] as const).map(({key,label})=>{
                const d=lsData.breakdown[key]
                const pct=Math.round((d.score/d.max)*100)
                const c=pct>=80?T.g:pct>=50?T.a:T.r
                return(
                  <div key={key} style={{background:T.bg,borderRadius:10,padding:'10px 12px',border:`1px solid ${T.line}`}}>
                    <div style={{marginBottom:4,color:c}}><Ico n={key} size={15} c={c}/></div>
                    <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.08em',marginBottom:6}}>{label}</div>
                    <div className="ora-num" style={{fontSize:14,fontWeight:700,color:c,marginBottom:4}}>{d.score}<span style={{fontSize:9,color:T.t3,fontWeight:400}}>/{d.max}</span></div>
                    <div style={{height:3,background:T.card,borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:c,borderRadius:99,transition:'width 0.6s ease'}}/>
                    </div>
                    <div style={{fontSize:9,color:T.t3,marginTop:5,lineHeight:1.4}}>{d.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* Listing Info: idade + faturamento anual */}
        <div style={{padding:'14px 28px',borderBottom:`1px solid ${T.line}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div style={{background:T.bg,border:`1px solid ${T.line}`,borderRadius:10,padding:'12px 16px'}}>
            <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:6,display:'flex',alignItems:'center',gap:6}}><Ico n="clock" size={12} c={T.t3}/> Idade do Anúncio</div>
            <div style={{fontSize:18,fontWeight:700,color:T.t1,letterSpacing:'-0.02em'}}>{asinToAge(product.asin||'')}</div>
            <div style={{fontSize:10,color:T.t3,marginTop:2}}>Estimado pelo prefixo ASIN</div>
          </div>
          <div style={{background:T.bg,border:`1px solid ${T.line}`,borderRadius:10,padding:'12px 16px'}}>
            <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:6,display:'flex',alignItems:'center',gap:6}}><Ico n="cash" size={12} c={T.gold}/> Faturamento Anual Est.</div>
            <div className="ora-num" style={{fontSize:18,fontWeight:700,color:T.gold,letterSpacing:'-0.02em'}}>R$ {fmtN(Math.round(sales*price*12))}</div>
            <div style={{fontSize:10,color:T.t3,marginTop:2}}>~{fmtK(sales)} un/mês × R$ {fmtR(price)} × 12</div>
          </div>
        </div>
        <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:22}}>
          {/* BSR gauge */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <Lbl>Ranking na Amazon</Lbl>
              <span style={{fontSize:10,color:T.t3}}>BSR menor = produto mais vendido</span>
            </div>
            <div style={{height:6,background:T.card,borderRadius:99,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,background:`linear-gradient(to right,${T.g},${T.a},${T.r})`,opacity:.3}}/>
              {bsr>0&&(()=>{const p=Math.min(94,Math.log10(bsr)/Math.log10(500000)*100);return<div style={{position:'absolute',top:-3,left:`${p}%`,transform:'translateX(-50%)',width:12,height:12,background:dem.c,borderRadius:'50%',border:`2px solid ${T.modal}`,boxShadow:`0 0 10px ${dem.c}`}}/>})()}
            </div>
          </div>
          {/* Simulator */}
          <div>
            <Lbl style={{marginBottom:14}}>Simulador de Lucratividade</Lbl>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              {[{l:'Preço de Venda (R$)',v:price,s:setPrice,isPrice:true},{l:'Custo do Produto (R$)',v:cost,s:setCost,isPrice:false}].map(f=>(
                <div key={f.l} style={{background:T.bg,border:`1px solid ${T.lineG}`,borderRadius:10,padding:'12px 16px'}}>
                  <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:8}}>{f.l}</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                    <span style={{fontSize:13,color:T.t3,fontWeight:500}}>R$</span>
                    <input type="number" min={0} value={f.v} onChange={e=>{userTouched.current=true;(f.s as any)(+e.target.value||0)}} style={{background:'none',border:'none',color:T.gold,fontSize:22,fontWeight:700,width:'100%',outline:'none',fontFamily:'inherit'}}/>
                  </div>
                  {f.isPrice && realPrice && <div style={{fontSize:9,color:T.g,marginTop:4,display:'flex',alignItems:'center',gap:4}}><Ico n="pin" size={10} c={T.g}/> Preço real da Amazon</div>}
                  {f.isPrice && !realPrice && lsLoading && <div style={{fontSize:9,color:T.t3,marginTop:4}}>buscando preço real…</div>}
                </div>
              ))}
            </div>
            {promo.active&&(
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',marginBottom:8,background:'rgba(34,197,94,0.06)',border:`1px solid rgba(34,197,94,0.2)`,borderRadius:10,fontSize:11,color:T.g}}>
                <Ico n="gift" size={14} c={T.g}/>
                <span><strong>Promoção ativa:</strong> {promo.type==='comissao'?'Isenção de Comissão':promo.type==='fba'?'Isenção de Tarifa FBA':'Isenção de Comissão + FBA'} — tarifas zeradas no simulador</span>
              </div>
            )}
            <div style={{background:T.bg,borderRadius:12,overflow:'hidden',border:`1px solid ${T.line}`}}>
              <div style={{padding:'0 16px'}}>
                {(()=>{
                  const refZeroed=promo.active&&(promo.type==='comissao'||promo.type==='ambas')
                  const fbaZeroed=promo.active&&(promo.type==='fba'||promo.type==='ambas')
                  return[
                    {l:'Preço de venda',v:`R$ ${fmtR(price)}`,neg:false,zeroed:false,orig:null},
                    {l:`Taxa Amazon (${(ref*100).toFixed(0)}%)`,v:refZeroed?`R$ 0,00`:`− R$ ${fmtR(+(price*ref).toFixed(2))}`,neg:true,zeroed:refZeroed,orig:refZeroed?`− R$ ${fmtR(+(price*ref).toFixed(2))}`:null},
                    {l:'Taxa FBA',v:fbaZeroed?`R$ 0,00`:`− R$ ${fmtR(fbaBase)}`,neg:true,zeroed:fbaZeroed,orig:fbaZeroed?`− R$ ${fmtR(fbaBase)}`:null},
                    {l:'Custo do produto',v:`− R$ ${fmtR(cost)}`,neg:true,zeroed:false,orig:null},
                  ].map((row,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${T.line}`}}>
                      <span style={{fontSize:12,color:row.neg?T.t2:T.t1}}>{row.l}</span>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        {row.orig&&<span style={{fontSize:11,color:T.t3,textDecoration:'line-through'}}>{row.orig}</span>}
                        <span style={{fontSize:12,color:row.zeroed?T.g:row.neg?T.r:T.t1,fontWeight:row.zeroed?700:row.neg?400:500}}>{row.v}</span>
                      </div>
                    </div>
                  ))
                })()}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:T.card}}>
                {[{l:'Lucro / unidade',v:`R$ ${fmtR(profit)}`,s:`Margem ${margin}%`,c:profit>=0?T.gold:T.r},{l:'ROI sobre custo',v:`${roi}%`,s:'Retorno do capital',c:roi>=0?T.g:T.r}].map((b,i)=>(
                  <div key={i} style={{padding:'14px 16px',borderRight:i===0?`1px solid ${T.line}`:'none'}}>
                    <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:6}}>{b.l}</div>
                    <div style={{fontSize:20,fontWeight:700,color:b.c,letterSpacing:'-0.02em',marginBottom:2}}>{b.v}</div>
                    <div style={{fontSize:10,color:T.t3}}>{b.s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Forecast */}
          <div>
            <Lbl style={{marginBottom:14}}>Previsão Mensal</Lbl>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[{l:'Conservador',m:.3,c:T.t2},{l:'Realista',m:.6,c:T.a},{l:'Otimista',m:1,c:T.g}].map(sc=>{
                const u=Math.round(sales*sc.m);const luc=+(u*profit).toFixed(0)
                return(
                  <div key={sc.l} style={{background:T.bg,border:`1px solid ${T.line}`,borderRadius:12,padding:'16px',position:'relative' as const,overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:sc.c,opacity:.5}}/>
                    <div style={{fontSize:9,fontWeight:700,color:sc.c,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:10}}>{sc.l}</div>
                    <div style={{fontSize:11,color:T.t3,marginBottom:2}}>{Math.round(sc.m*100)}% · {fmtN(u)} un.</div>
                    <div style={{fontSize:11,color:T.t3,marginBottom:14}}>Receita R$ {fmtN(Math.round(u*price))}</div>
                    <div style={{borderTop:`1px solid ${T.line}`,paddingTop:12}}>
                      <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',marginBottom:4}}>{luc<0?'PREJUÍZO':'LUCRO LÍQUIDO'}</div>
                      <div style={{fontSize:22,fontWeight:700,color:luc>=0?sc.c:T.r,letterSpacing:'-0.02em'}}>{luc<0?'− ':''}R$ {fmtN(Math.abs(luc))}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Como Melhorar */}
          {(()=>{
            // ── Personalized recommendations ────────────────────────────────────────
            type Rec = {priority:'Alta'|'Média'|'Baixa';title:string;desc:string;icon:string}
            const recs:Rec[] = []
            const hasAPlus = lsData?.breakdown?.images?.label?.toLowerCase().includes('a+') ?? false
            const titleLen = (product.title||'').length

            // Image recommendations
            if(numImages < 4){
              recs.push({priority:'Alta',icon:'📸',
                title:`Adicione mais imagens (você tem ${numImages}, o ideal é 7)`,
                desc:`Anúncios com 7 imagens convertem até 58% mais. Inclua: fundo branco, lifestyle, infográfico de benefícios, comparativo de tamanho e detalhe de materiais.`})
            } else if(numImages < 7){
              recs.push({priority:'Média',icon:'🖼️',
                title:`Complete as ${7-numImages} imagem(ns) restante(s) para 7 no total`,
                desc:`Você tem ${numImages} imagens — faltam ${7-numImages} para atingir o máximo. Priorize um infográfico e uma foto de lifestyle em uso.`})
            }

            // Review recommendations
            if(reviewCount === 0){
              recs.push({priority:'Alta',icon:'⭐',
                title:'Conquiste as primeiras avaliações urgente',
                desc:`Produtos sem reviews têm conversão próxima de zero em buscas frias. Use o programa "Solicitar Avaliação" no Seller Central para cada pedido dos primeiros 30 dias.`})
            } else if(reviewCount < 15){
              recs.push({priority:'Alta',icon:'⭐',
                title:`Escale para 15+ reviews (você tem ${reviewCount})`,
                desc:`Abaixo de 15 reviews o algoritmo da Amazon não indexa bem o produto. Solicite avaliação para todos os pedidos ativos.`})
            } else if(reviewCount < 100){
              recs.push({priority:'Média',icon:'⭐',
                title:`${reviewCount} reviews — meta: 100+ para dominar a busca`,
                desc:`Com 100+ reviews a taxa de conversão aumenta significativamente. Continue solicitando avaliações e responda todos os reviews negativos.`})
            }

            // Title recommendations
            if(titleLen < 80){
              recs.push({priority:'Alta',icon:'🔤',
                title:'Título muito curto — expanda com palavras-chave',
                desc:`Seu título tem ${titleLen} caracteres. O ideal é 130-200. Inclua: modelo, material, benefício principal, público-alvo e compatibilidades. Cada palavra-chave extra é tráfego extra.`})
            } else if(titleLen < 130){
              recs.push({priority:'Média',icon:'🔤',
                title:'Otimize o título com mais palavras-chave de cauda longa',
                desc:`Título com ${titleLen} caracteres pode crescer até 200. Adicione especificações técnicas, casos de uso e variações de busca que o cliente usaria.`})
            }

            // Bullets (based on breakdown)
            if(lsData?.breakdown?.bullets?.score !== undefined){
              const bPct = Math.round((lsData.breakdown.bullets.score/lsData.breakdown.bullets.max)*100)
              if(bPct < 50){
                recs.push({priority:'Alta',icon:'📝',
                  title:'Bullets pontos fracos — reescreva focando em benefícios',
                  desc:`Seus bullet points estão ${bPct}% do ideal. Cada bullet deve começar com o benefício principal em maiúsculas, seguido da explicação. Ex: "RESISTENTE À ÁGUA — Material impermeável protege contra chuva e umidade".`})
              } else if(bPct < 80){
                recs.push({priority:'Média',icon:'📝',
                  title:'Melhore os bullet points com prova social e especificações',
                  desc:`Bullets a ${bPct}% do ideal. Adicione dados específicos (dimensões, peso, capacidade), certificações e o que o produto inclui na embalagem.`})
              }
            }

            // A+ content
            if(!hasAPlus && !modalGeneric){
              recs.push({priority:'Média',icon:'✨',
                title:'Adicione Conteúdo A+ para aumentar conversão',
                desc:`Conteúdo A+ eleva a conversão em 3-10% e reduz devoluções. Disponível para marcas no Brand Registry. Crie um módulo de comparativo e um de história da marca.`})
            } else if(modalGeneric){
              recs.push({priority:'Média',icon:'🏷️',
                title:'Registre sua marca no Brand Registry',
                desc:`Produtos genéricos são vulneráveis a competidores e não podem ter A+. Registrar a marca desbloqueia: A+ content, Sponsored Brands, Brand Store e proteção anti-hijacking.`})
            }

            // Coupon
            if(bsr > 100){
              recs.push({priority:'Média',icon:'🎫',
                title:'Ative um cupom de desconto para impulsionar BSR',
                desc:`Cupons aparecem como badge verde nos resultados de busca e aumentam o CTR em até 25%. Use um desconto de 5-10% para acelerar as vendas e subir no ranking.`})
            }

            // Price competitiveness
            if(product.price > 0){
              const catRef = REF[catId] || 0.15
              const impliedMargin = ((product.price - product.price*catRef - (product.price<50?12:18) - product.price*.3) / product.price)*100
              if(impliedMargin > 40){
                recs.push({priority:'Baixa',icon:'💰',
                  title:'Margem alta — considere investir em tráfego pago',
                  desc:`Com margem estimada de ${impliedMargin.toFixed(0)}%, você tem espaço para aumentar o orçamento de ads (TACOS alvo: 8-12%) e crescer mais rápido sem perder rentabilidade.`})
              }
            }

            // BSR-specific tip
            if(bsr > 5000 && bsr <= 30000){
              recs.push({priority:'Alta',icon:'📈',
                title:`BSR #${fmtN(bsr)} — concentre-se em uma palavra-chave para rankear`,
                desc:`Com BSR nessa faixa, dominar 1 keyword específica de cauda longa é mais eficiente que tentar várias. Foque o PPC nessa keyword e peça reviews de clientes que vieram por ela.`})
            }

            // Sort by priority
            const pOrd = {'Alta':0,'Média':1,'Baixa':2}
            recs.sort((a,b)=>pOrd[a.priority]-pOrd[b.priority])

            return(
              <div>
                <Lbl style={{marginBottom:12}}>Como Melhorar Este Anúncio</Lbl>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {recs.map((r,i)=>{
                    const hc=r.priority==='Alta'?T.r:r.priority==='Média'?T.a:T.t3
                    return(
                      <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',background:T.bg,border:`1px solid ${tint(hc,15)}`,borderLeft:`3px solid ${hc}`,borderRadius:10,padding:'11px 14px'}}>
                        <div style={{lineHeight:1,flexShrink:0,marginTop:1,color:T.gold}}><EmojiIco e={r.icon} size={17} c={T.gold}/></div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                            <span style={{fontSize:12,fontWeight:600,color:T.t1}}>{r.title}</span>
                            <span style={{fontSize:9,fontWeight:700,color:hc,background:tint(hc,8),padding:'2px 7px',borderRadius:4,letterSpacing:'0.05em',flexShrink:0}}>{r.priority}</span>
                          </div>
                          <div style={{fontSize:11,color:T.t3,lineHeight:1.55}}>{r.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          {/* Verdict */}
          <div style={{background:tint(verdict.c,3),border:`1px solid ${tint(verdict.c,9)}`,borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}>
            <ScoreRing score={score}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:verdict.c,marginBottom:4}}>{verdict.l}</div>
              <div style={{fontSize:12,color:T.t4,lineHeight:1.6}}>{verdict.s}</div>
            </div>
          </div>
          {/* Imagens do Anúncio — usa lsData.images quando disponível (todas), fallback para product.images */}
          {((lsData?.images?.length > 0 ? lsData.images : product.images)?.length > 0) && (
            <ImageDownloader images={lsData?.images?.length > 0 ? lsData.images : product.images} asin={product.asin} title={product.title} />
          )}

          {/* CTAs */}
          <div style={{display:'flex',gap:10}}>
            <a href={`https://www.amazon.com.br/dp/${product.asin}`} target="_blank" rel="noreferrer"
              style={{flex:1,display:'block',textAlign:'center' as const,background:T.goldG,color:'#03030A',fontWeight:700,fontSize:11,padding:'13px',borderRadius:9,letterSpacing:'0.1em',textDecoration:'none',textTransform:'uppercase' as const,boxShadow:'0 4px 20px rgba(240,180,41,0.25)'}}>
              Ver na Amazon
            </a>
            <button onClick={onClose} style={{flex:1,background:'none',border:`1px solid ${T.line}`,color:T.t2,fontWeight:500,fontSize:11,padding:'13px',borderRadius:9,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',textTransform:'uppercase' as const}}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Image Downloader ───────────────────────────────────────────────────── */
function ImageDownloader({images,asin,title}:{images:string[];asin:string;title:string}){
  const [downloading,setDownloading]=useState<number|'all'|null>(null)

  function slug(t:string){return(t||asin).slice(0,40).replace(/[^a-z0-9]/gi,'-').toLowerCase()}

  async function downloadOne(url:string, idx:number){
    setDownloading(idx)
    try{
      const filename=`${slug(title)}-img${idx+1}.jpg`
      const res=await fetch(`/api/product/image-proxy?url=${encodeURIComponent(url)}&filename=${filename}`)
      if(!res.ok) throw new Error()
      const blob=await res.blob()
      const a=document.createElement('a')
      a.href=URL.createObjectURL(blob)
      a.download=filename
      a.click()
      URL.revokeObjectURL(a.href)
    }catch{alert('Erro ao baixar imagem. Tente novamente.')}
    finally{setDownloading(null)}
  }

  async function downloadAll(){
    setDownloading('all')
    for(let i=0;i<images.length;i++){
      const filename=`${slug(title)}-img${i+1}.jpg`
      try{
        const res=await fetch(`/api/product/image-proxy?url=${encodeURIComponent(images[i])}&filename=${filename}`)
        if(!res.ok) continue
        const blob=await res.blob()
        const a=document.createElement('a')
        a.href=URL.createObjectURL(blob)
        a.download=filename
        a.click()
        URL.revokeObjectURL(a.href)
        await new Promise(r=>setTimeout(r,400)) // pequeno delay entre downloads
      }catch{}
    }
    setDownloading(null)
  }

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <Lbl>Imagens do Anúncio ({images.length})</Lbl>
        <button onClick={downloadAll} disabled={downloading==='all'}
          style={{background:downloading==='all'?'rgba(240,180,41,0.05)':T.goldSub,border:`1px solid ${T.lineG}`,color:T.gold,fontSize:10,fontWeight:700,padding:'5px 14px',borderRadius:7,cursor:downloading==='all'?'wait':'pointer',fontFamily:'inherit',letterSpacing:'0.06em',opacity:downloading==='all'?0.6:1}}>
          {downloading==='all'?'Baixando…':'⬇ Baixar Todas'}
        </button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(96px,1fr))',gap:8}}>
        {images.map((url,i)=>(
          <div key={i} style={{position:'relative' as const,background:'#F8F8FC',borderRadius:10,overflow:'hidden',aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${T.line}`}}>
            <img src={url} alt={`img ${i+1}`} style={{maxWidth:'90%',maxHeight:'90%',objectFit:'contain'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
            <button onClick={()=>downloadOne(url,i)} disabled={downloading===i||downloading==='all'}
              style={{position:'absolute',bottom:4,right:4,background:'rgba(3,3,10,0.82)',backdropFilter:'blur(4px)',border:`1px solid ${T.lineG}`,color:T.gold,fontSize:11,width:26,height:26,borderRadius:7,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:downloading===i?0.5:1}}
              title={`Baixar imagem ${i+1}`}>
              {downloading===i?'…':'⬇'}
            </button>
            <div style={{position:'absolute',top:3,left:3,background:'rgba(3,3,10,0.7)',borderRadius:4,padding:'1px 5px',fontSize:9,color:T.t3,fontWeight:600}}>
              {i+1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Small helpers ──────────────────────────────────────────────────────── */
function Chip({text,c}:{text:string;c:string}){return<span style={{background:tint(c,9),color:c,border:`1px solid ${tint(c,16)}`,borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:600,letterSpacing:'0.03em'}}>{text}</span>}
function Lbl({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){return<div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,...style}}>{children}</div>}
function Chevron({open}:{open:boolean}){return<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transition:'transform .2s',transform:open?'rotate(180deg)':'none',color:T.t3,flexShrink:0}}><path d="M2 3.5L5 6.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}

/* ─── Product card ───────────────────────────────────────────────────────── */
function Card({product,onClick,locked,saved,onToggleSave}:{product:any;onClick:()=>void;locked?:boolean;saved?:boolean;onToggleSave?:()=>void}){
  const [hov,setHov]=useState(false)
  const bsr=product.bsr||0
  const sales=product.salesEst||bsrSales(bsr)
  // Genérico: prefere o flag do backend (detector forte c/ blocklist de marcas);
  // cai no heurístico local só quando o backend não mandou.
  const isGeneric = typeof product.isGeneric==='boolean' ? product.isGeneric
    : (!product.brand||product.brand.trim()===''||product.brand.toLowerCase()==='genérico')
  const score=cardScore(bsr,sales,isGeneric)
  const sc=sColor(score)
  // Cor da venda alinhada aos pisos de demanda (Alta≥150 verde · Média≥65 âmbar).
  const salesColor=sales>=150?T.g:sales>=65?T.a:T.t4
  const dem=demInfo(product,sales)

  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      role="button" tabIndex={0}
      aria-label={locked?'Produto bloqueado — fazer upgrade para ver a análise':`Ver análise de ${product.title||'produto'}`}
      onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick()}}}
      style={{background:hov?T.cardHov:T.card,border:`1px solid ${hov&&!locked?T.lineG:T.line}`,borderRadius:14,overflow:'hidden',cursor:'pointer',
        transition:'background .15s,border-color .15s,transform .15s,box-shadow .15s',
        transform:hov&&!locked?'translateY(-2px)':'none',
        boxShadow:hov&&!locked?'var(--elev2),0 0 0 1px rgba(240,180,41,0.08)':'var(--elev1)',
        display:'flex',flexDirection:'column',position:'relative' as const,
        filter:locked?'blur(5px) brightness(0.5)':'none',
        userSelect:locked?'none':'auto',
      }}>
      {/* Score badge */}
      <div style={{position:'absolute',top:10,right:10,zIndex:2}}><ScoreRing score={score}/></div>
      {/* Salvar / remover — pill com texto, visível sobre a imagem */}
      {onToggleSave&&!locked&&(
        <button onClick={e=>{e.stopPropagation();onToggleSave()}}
          title={saved?'Remover dos salvos':'Salvar este produto'} aria-label={saved?'Remover dos salvos':'Salvar este produto'} aria-pressed={saved}
          style={{position:'absolute',top:128,left:10,zIndex:3,display:'flex',alignItems:'center',gap:5,
            padding:'5px 11px 5px 9px',borderRadius:99,cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700,letterSpacing:'0.01em',
            border:`1px solid ${saved?'rgba(240,180,41,0.7)':'rgba(255,255,255,0.14)'}`,
            background:saved?'var(--goldG)':'rgba(3,3,10,0.72)',color:saved?'#1a1305':'#F5F5FC',
            backdropFilter:'blur(6px)',boxShadow:'0 3px 10px rgba(0,0,0,0.4)',transition:'transform .15s ease-out, background .15s'}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none'}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={saved?'#1a1305':'none'}>
            <path d="M6.5 4.5h11a1 1 0 0 1 1 1V20l-6.5-3.8L5.5 20V5.5a1 1 0 0 1 1-1z" stroke={saved?'#1a1305':'#F5F5FC'} strokeWidth="1.7" strokeLinejoin="round"/>
          </svg>
          {saved?'Salvo':'Salvar'}
        </button>
      )}
      {/* Generic badge */}
      {isGeneric&&!locked&&<div style={{position:'absolute',top:10,left:10,zIndex:2,background:'rgba(3,3,10,0.8)',backdropFilter:'blur(4px)',border:`1px solid ${tint(T.pur,21)}`,borderRadius:4,padding:'2px 7px',fontSize:8,fontWeight:700,color:T.pur,letterSpacing:'0.1em'}}>GENÉRICO</div>}
      {/* Image */}
      <div style={{background:'#F8F8FC',height:162,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
        {product.images?.[0]?<img src={product.images[0]} alt="" style={{maxHeight:138,maxWidth:'88%',objectFit:'contain',transition:'transform .3s cubic-bezier(.34,1.56,.64,1)',transform:hov?'scale(1.08)':'scale(1)'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>:<div style={{width:44,height:44,background:'#e8e8f0',borderRadius:8}}/>}
      </div>
      <div style={{padding:'14px 14px 16px',flex:1,display:'flex',flexDirection:'column',gap:0}}>
        {sales>0&&bsr>0&&<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8,flexWrap:'wrap' as const}}>
          <div style={{display:'flex',alignItems:'baseline',gap:5}}><span className="ora-num" style={{fontSize:22,fontWeight:700,color:salesColor,letterSpacing:'-0.03em',lineHeight:1}}>~{fmtK(sales)}</span><span style={{fontSize:10,color:T.t3,fontWeight:500}}>est./mês</span></div>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase' as const,color:dem.c,background:`${dem.c}1f`,borderRadius:5,padding:'2px 6px'}}>{dem.l}</span>
        </div>}
        <p style={{fontSize:12,fontWeight:500,color:T.t1,lineHeight:1.58,flex:1,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden',marginBottom:10}}>{product.title}</p>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          {bsr>0&&<span style={{fontSize:10,color:T.t3}}>BSR <strong style={{color:T.t2,fontWeight:600}}>#{fmtN(bsr)}</strong></span>}
          {bsr>0&&product.brand&&<span style={{color:T.t3,fontSize:10}}>·</span>}
          {product.brand&&<span style={{fontSize:10,color:T.t3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,maxWidth:90}}>{product.brand}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`1px solid ${T.line}`,paddingTop:11}}>
          <span style={{fontSize:10,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,color:hov&&!locked?T.gold:T.t3,transition:'color .15s'}}>{locked?'Bloqueado':'Ver análise'}</span>
          <div style={{width:24,height:24,borderRadius:'50%',background:hov&&!locked?T.goldSub:'none',border:`1px solid ${hov&&!locked?T.lineG:T.line}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
            {locked?<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="4.5" width="6" height="5" rx="1" style={{stroke:T.t3}} strokeWidth="1.2"/><path d="M3.5 4.5V3a1.5 1.5 0 013 0v1.5" style={{stroke:T.t3}} strokeWidth="1.2" strokeLinecap="round"/></svg>
            :<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke={hov?T.gold:T.t3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{transition:'stroke .15s'}}/></svg>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton card ──────────────────────────────────────────────────────── */
function SkeletonCard({i}:{i:number}){
  return<div style={{background:T.card,borderRadius:14,overflow:'hidden',border:`1px solid ${T.line}`,animationDelay:`${i*.05}s`,animation:'pulse 1.8s ease-in-out infinite'}}><div style={{background:'#F8F8FC',height:162}}/><div style={{padding:'14px 14px 16px',display:'flex',flexDirection:'column',gap:10}}><div style={{height:10,background:T.t3,borderRadius:4,width:'50%',opacity:.5}}/><div style={{height:8,background:T.t3,borderRadius:4,width:'90%',opacity:.3}}/><div style={{height:8,background:T.t3,borderRadius:4,width:'70%',opacity:.3}}/></div></div>
}

/* ─── Competitor Panel ───────────────────────────────────────────────────── */
function GaugeArc({value,max=100,color,label,size=90}:{value:number;max?:number;color:string;label:string;size?:number}){
  const pct=Math.min(value/max,1);const r=34;const circ=Math.PI*r;const dash=circ*pct
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <svg width={size} height={size/2+10} viewBox={`0 0 80 46`}>
        <path d="M8 40 A32 32 0 0 1 72 40" fill="none" style={{stroke:T.line}} strokeWidth="7" strokeLinecap="round"/>
        <path d="M8 40 A32 32 0 0 1 72 40" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} style={{transition:'stroke-dasharray 1s ease'}}/>
        <text x="40" y="36" textAnchor="middle" fontSize="13" fontWeight="800" fill={color} fontFamily="inherit">{value}</text>
      </svg>
      <span style={{fontSize:9,color:T.t3,letterSpacing:'0.1em',textTransform:'uppercase' as const,fontWeight:600}}>{label}</span>
    </div>
  )
}

function BarChart({items,color}:{items:{label:string;value:number;sub?:string}[];color:string}){
  const max=Math.max(...items.map(i=>i.value),1)
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {items.map((item,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:70,fontSize:10,color:T.t3,textAlign:'right' as const,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{item.label}</div>
          <div style={{flex:1,height:22,background:T.bg,borderRadius:4,overflow:'hidden',position:'relative' as const}}>
            <div style={{height:'100%',width:`${(item.value/max)*100}%`,background:color,borderRadius:4,opacity:.85,transition:'width 1s ease',minWidth:item.value>0?4:0}}/>
            <span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:9,color:T.t4,fontWeight:600}}>
              R$ {item.value.toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function CompetitorPanel({user,isFree,onUpgrade}:{user:any;isFree:boolean;onUpgrade:()=>void}){
  const [asin,    setAsin]    = useState('')
  const [loading, setLoading] = useState(false)
  const [data,    setData]    = useState<any>(null)
  const [error,   setError]   = useState('')

  async function analyze(){
    const a = asin.trim().toUpperCase()
    if(!a){setError('Digite um ASIN');return}
    if(!/^[A-Z0-9]{10}$/.test(a)){setError('ASIN inválido — deve ter 10 caracteres (ex: B08N5WRWNW)');return}
    if(isFree){onUpgrade();return}
    setLoading(true);setError('');setData(null)
    try{
      const r = await fetch(`/api/competitor?asin=${a}`)
      const d = await r.json()
      if(!r.ok){setError(d.error||'Erro ao buscar dados');return}
      setData(d)
    }catch{setError('Erro de conexão')}
    finally{setLoading(false)}
  }

  const fmtN=(n:number)=>Math.round(n).toLocaleString('pt-BR')
  const fmtK=(n:number)=>n>=1000?`${(n/1000).toFixed(1).replace('.0','')}k`:`${n}`

  return(
    <div style={{flex:1,overflowY:'auto',padding:'24px'}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:18,fontWeight:700,color:T.t1,letterSpacing:'-0.03em',marginBottom:6}}>Análise de Concorrentes</h2>
        <p style={{fontSize:12,color:T.t2}}>Cole o ASIN do produto que deseja analisar — o Oráculo vai buscar todos os concorrentes e gerar um relatório completo.</p>
      </div>

      {/* ASIN Input */}
      <div style={{background:T.card,border:`1px solid ${T.lineG}`,borderRadius:14,padding:'20px 24px',marginBottom:24}}>
        <div style={{display:'flex',gap:12,alignItems:'flex-end'}}>
          <div style={{flex:1}}>
            <label style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',display:'block',marginBottom:8,textTransform:'uppercase' as const}}>ASIN do Produto</label>
            <input
              value={asin} onChange={e=>setAsin(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==='Enter'&&analyze()}
              placeholder="Ex: B08N5WRWNW"
              maxLength={10}
              style={{width:'100%',background:T.bg,border:`1px solid ${T.line}`,borderRadius:9,padding:'12px 16px',color:T.t1,fontSize:15,fontFamily:'inherit',fontWeight:600,letterSpacing:'0.1em',outline:'none'}}
            />
            <p style={{fontSize:10,color:T.t3,marginTop:6}}>Encontre o ASIN na URL da Amazon: amazon.com.br/dp/<strong style={{color:T.gold}}>XXXXXXXXXX</strong></p>
          </div>
          <button onClick={analyze} disabled={loading}
            style={{background:loading?T.t3:T.goldG,color:loading?'#666':'#02020A',border:'none',cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',fontWeight:700,fontSize:11,letterSpacing:'0.1em',padding:'12px 28px',borderRadius:9,textTransform:'uppercase' as const,boxShadow:loading?'none':'0 4px 20px rgba(240,180,41,0.3)',transition:'all .15s',flexShrink:0,whiteSpace:'nowrap' as const}}>
            {loading?'Analisando…':'Analisar →'}
          </button>
        </div>
        {error&&<div style={{marginTop:10,fontSize:12,color:T.r,background:`${tint(T.r,6)}`,border:`1px solid ${tint(T.r,15)}`,borderRadius:7,padding:'8px 12px'}}>{error}</div>}
      </div>

      {/* Loading skeleton */}
      {loading&&(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {[200,160,240].map((h,i)=>(
            <div key={i} style={{background:T.card,borderRadius:14,height:h,border:`1px solid ${T.line}`,animation:'pulse 1.8s ease-in-out infinite',animationDelay:`${i*.1}s`}}/>
          ))}
        </div>
      )}

      {/* Results */}
      {data&&!loading&&(()=>{
        const p   = data.product
        const mkt = data.market || {}
        const an  = data.analysis
        const opp = an.opportunityScore
        const comp= an.competitionScore
        const oppColor  = opp>=70?T.g:opp>=50?T.a:T.r
        const compColor = comp>=70?T.g:comp>=50?T.a:T.r

        const verdict = opp>=70?{l:'Excelente Oportunidade',c:T.g,s:'Poucos concorrentes e boa demanda — vale entrar neste mercado agora.'}
          :opp>=55?{l:'Boa Oportunidade',c:T.g,s:'Mercado com potencial. Diferencie-se para conquistar espaço.'}
          :opp>=38?{l:'Oportunidade Moderada',c:T.a,s:'Concorrência relevante. Estude bem os líderes antes de entrar.'}
          :{l:'Alta Barreira de Entrada',c:T.r,s:'Mercado saturado ou demanda baixa. Considere outro produto.'}

        const bsrColor=p.bsr>0&&p.bsr<5000?T.g:p.bsr<30000?T.a:T.r
        const salesColor=p.salesEst>=500?T.g:p.salesEst>=100?T.a:T.r
        const salesLabel=`~${fmtK(p.salesEst)}/mês est.`

        const compList: any[] = data.competitors || []
        const salesChart = compList.slice(0,8).map((c:any,i:number)=>({
          label: c.title?.split(' ').slice(0,2).join(' ')||`Rival ${i+1}`,
          value: c.salesEst||0,
          asin:  c.asin,
        }))
        const maxSales = Math.max(...salesChart.map(s=>s.value), p.salesEst, 1)

        return(
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* Product card */}
            <div style={{background:T.card,border:`1px solid ${T.lineG}`,borderRadius:14,padding:'20px 24px',display:'flex',gap:20,alignItems:'flex-start'}}>
              <div style={{width:80,height:80,background:'#F8F8FC',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {p.image?<img src={p.image} alt="" style={{maxWidth:68,maxHeight:68,objectFit:'contain'}}/>:<div style={{width:36,height:36,background:'#e0e0e0',borderRadius:6}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:14,fontWeight:600,color:T.t1,lineHeight:1.55,marginBottom:10,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{p.title}</p>
                <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
                  <span style={{background:`${tint(T.t3,9)}`,color:T.t3,border:`1px solid ${tint(T.t3,16)}`,borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:600}}>ASIN {data.asin}</span>
                  {p.brand&&<span style={{background:`${tint(T.pur,9)}`,color:T.pur,border:`1px solid ${tint(T.pur,16)}`,borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:600}}>{p.brand}</span>}
                </div>
              </div>
            </div>

            {/* KPIs — linha 1 */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[
                {v:p.bsr>0?`#${fmtN(p.bsr)}`:'—',              l:'BSR Amazon',            c:bsrColor},
                {v:salesLabel,                                    l:'Vendas Estimadas (BSR)', c:salesColor},
                {v:`${mkt.competitorCount||0} rivais`,            l:'Anúncios Concorrentes', c:(mkt.competitorCount||0)<=5?T.g:(mkt.competitorCount||0)<=12?T.a:T.r},
                {v:p.listingAge||'—',                             l:'Período do Anúncio',   c:T.pur},
              ].map((k,i)=>(
                <div key={i} style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:12,padding:'16px',textAlign:'center' as const}}>
                  <div style={{fontSize:i===3?11:i===1?14:20,fontWeight:700,color:k.c,letterSpacing:'-0.01em',marginBottom:4,lineHeight:1.3}}>{k.v}</div>
                  <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>{k.l}</div>
                </div>
              ))}
            </div>
            {/* KPIs — linha 2: faturamento */}
            {(p.monthlyRevenue>0||p.annualRevenue>0)&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                {[
                  {v:`R$ ${fmtN(p.monthlyRevenue)}`,  l:'Faturamento Estimado/mês',  c:T.gold},
                  {v:`R$ ${fmtN(p.annualRevenue)}`,   l:'Faturamento Estimado/ano',  c:T.g},
                  {v:p.price>0?`R$ ${p.price.toFixed(2)}`:'—', l:'Preço de Venda (Buy Box)', c:T.t1},
                ].map((k,i)=>(
                  <div key={i} style={{background:`${tint(T.gold,2)}`,border:`1px solid ${T.lineG}`,borderRadius:12,padding:'16px',textAlign:'center' as const}}>
                    <div style={{fontSize:18,fontWeight:700,color:k.c,letterSpacing:'-0.02em',marginBottom:4,lineHeight:1}}>{k.v}</div>
                    <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>{k.l}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Scores + Sales comparison */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:12}}>
              <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'20px 24px'}}>
                <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:18}}>Scores de Análise</div>
                <div style={{display:'flex',justifyContent:'space-around'}}>
                  <GaugeArc value={opp}  color={oppColor}  label="Oportunidade"/>
                  <GaugeArc value={comp} color={compColor} label="Dificuldade"/>
                </div>
                <div style={{marginTop:14,fontSize:11,color:T.t4,textAlign:'center' as const,lineHeight:1.7}}>
                  Média de vendas rivais: <strong style={{color:T.pur}}>{mkt.avgSales>0?`~${fmtK(mkt.avgSales)}/mês`:'—'}</strong>
                </div>
              </div>
              {/* Sales bar chart */}
              <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'20px 24px'}}>
                <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:14}}>Vendas: Você vs Concorrentes</div>
                {/* Target product bar */}
                {(()=>{
                  const pPct=(p.salesEst/maxSales)*100
                  // Label só é escuro quando está de fato sobre a barra dourada; sobre a trilha usa cor do tema
                  const onBar=pPct>=85
                  return(
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <div style={{width:54,fontSize:9,color:T.gold,textAlign:'right' as const,flexShrink:0,fontWeight:700}}>Analisado</div>
                      <div style={{flex:1,height:20,background:T.bg,borderRadius:4,overflow:'hidden',position:'relative' as const,border:`1px solid ${T.lineG}`}}>
                        <div style={{height:'100%',width:`${pPct}%`,background:T.gold,borderRadius:4,opacity:.9,transition:'width 1s ease',minWidth:p.salesEst>0?4:0}}/>
                        <span style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',fontSize:8,color:onBar?'#02020A':T.t1,fontWeight:700}}>{fmtK(p.salesEst)}</span>
                      </div>
                    </div>
                  )
                })()}
                {salesChart.map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{width:54,fontSize:9,color:T.t3,textAlign:'right' as const,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{item.label}</div>
                    <div style={{flex:1,height:18,background:T.bg,borderRadius:4,overflow:'hidden',position:'relative' as const}}>
                      <div style={{height:'100%',width:`${(item.value/maxSales)*100}%`,background:T.pur,borderRadius:4,opacity:.7,transition:'width 1s ease',minWidth:item.value>0?4:0}}/>
                      <span style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',fontSize:8,color:T.t4,fontWeight:600}}>{fmtK(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor cards */}
            {compList.length>0&&(
              <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'20px 24px'}}>
                <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:14}}>Anúncios Concorrentes ({compList.length})</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
                  {compList.slice(0,8).map((c:any,i:number)=>{
                    const sc=c.salesEst>=500?T.g:c.salesEst>=100?T.a:T.r
                    return(
                      <a key={i} href={`https://www.amazon.com.br/dp/${c.asin}`} target="_blank" rel="noreferrer"
                        style={{background:T.bg,border:`1px solid ${T.line}`,borderRadius:10,padding:'12px',textDecoration:'none',display:'flex',flexDirection:'column',gap:8,transition:'border-color .15s',cursor:'pointer'}}>
                        <div style={{width:'100%',height:70,background:'#F8F8FC',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                          {c.image?<img src={c.image} alt="" style={{maxWidth:'80%',maxHeight:60,objectFit:'contain'}}/>:<div style={{width:28,height:28,background:'#e0e0e0',borderRadius:4}}/>}
                        </div>
                        <p style={{fontSize:10,color:T.t4,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden',flex:1}}>{c.title}</p>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:11,fontWeight:700,color:sc}}>{c.fromTag?`+${fmtN(c.salesEst)}`:`~${fmtK(c.salesEst)}`}<span style={{fontSize:8,color:T.t3,fontWeight:400}}>/mês</span></span>
                          {c.bsr>0&&<span style={{fontSize:9,color:T.t3}}>#{fmtN(c.bsr)}</span>}
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Verdict */}
            <div style={{background:tint(verdict.c,3),border:`1px solid ${tint(verdict.c,13)}`,borderRadius:14,padding:'20px 24px',display:'flex',alignItems:'center',gap:20}}>
              <GaugeArc value={opp} color={verdict.c} label="Score" size={100}/>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,color:verdict.c,marginBottom:6}}>{verdict.l}</div>
                <div style={{fontSize:12,color:T.t4,lineHeight:1.65}}>{verdict.s}</div>
              </div>
            </div>

            {/* Recommendations — educacionais e personalizadas */}
            <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'20px 24px'}}>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:4}}>Plano de Ação Personalizado — {p.title?.split(' ').slice(0,4).join(' ')}</div>
                <div style={{fontSize:11,color:T.t3}}>O Oráculo analisou o anúncio e criou um guia específico para você superar estes concorrentes.</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {(data.recommendations||[]).map((rec:any,i:number)=>{
                  const priorityColor = rec.priority==='alta'?T.r:rec.priority==='média'?T.a:T.g
                  return(
                    <div key={i} style={{background:T.bg,border:`1px solid ${T.line}`,borderRadius:12,overflow:'hidden'}}>
                      {/* Header */}
                      <div style={{display:'flex',gap:12,alignItems:'center',padding:'14px 16px',borderBottom:`1px solid ${T.line}`}}>
                        <div style={{flexShrink:0,color:T.gold}}><EmojiIco e={rec.icon} size={19} c={T.gold}/></div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:600,color:T.t1,lineHeight:1.4}}>{rec.title}</div>
                        </div>
                        <div style={{background:tint(priorityColor,8),border:`1px solid ${tint(priorityColor,19)}`,borderRadius:99,padding:'2px 10px',fontSize:8,fontWeight:700,color:priorityColor,letterSpacing:'0.1em',textTransform:'uppercase' as const,flexShrink:0}}>
                          {rec.priority}
                        </div>
                      </div>
                      {/* Detail */}
                      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                        <p style={{fontSize:12,color:T.t4,lineHeight:1.7,margin:0}}>{rec.detail}</p>
                        <div style={{display:'flex',gap:8,alignItems:'flex-start',background:`${tint(T.gold,2)}`,border:`1px solid ${T.lineG}`,borderRadius:8,padding:'8px 12px'}}>
                          <span style={{flexShrink:0,color:T.gold}}><Ico n="bulb" size={13} c={T.gold}/></span>
                          <p style={{fontSize:11,color:T.gold,lineHeight:1.6,margin:0,fontStyle:'italic' as const}}><strong>Por que isso importa:</strong> {rec.why}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CTAs */}
            <div style={{display:'flex',gap:10}}>
              <a href={`https://www.amazon.com.br/dp/${data.asin}`} target="_blank" rel="noreferrer"
                style={{flex:1,display:'block',textAlign:'center' as const,background:T.goldG,color:'#03030A',fontWeight:700,fontSize:11,padding:'14px',borderRadius:9,letterSpacing:'0.1em',textDecoration:'none',textTransform:'uppercase' as const,boxShadow:'0 4px 20px rgba(240,180,41,0.25)'}}>
                Ver Produto na Amazon →
              </a>
              <button onClick={()=>{setData(null);setAsin('')}}
                style={{flex:1,background:'none',border:`1px solid ${T.line}`,color:T.t2,fontWeight:500,fontSize:11,padding:'14px',borderRadius:9,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',textTransform:'uppercase' as const}}>
                Nova Análise
              </button>
            </div>

          </div>
        )
      })()}

      {/* Empty state */}
      {!data&&!loading&&(
        <div style={{textAlign:'center' as const,padding:'60px 20px',color:T.t3}}>
          <div style={{marginBottom:16,opacity:.4,display:'flex',justifyContent:'center'}}><Ico n="search" size={44} c={T.t3}/></div>
          <div style={{fontSize:14,fontWeight:600,color:T.t2,marginBottom:8}}>Cole um ASIN acima para começar</div>
          <div style={{fontSize:12,color:T.t3}}>O Oráculo vai analisar todos os concorrentes e te dizer se vale a pena entrar neste mercado.</div>
        </div>
      )}
    </div>
  )
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function DashboardClient({user,gestaoEnabled=false}:{user:any;gestaoEnabled?:boolean}){
  const router = useRouter()
  const [nav,      setNav]      = useState('bestsellers')
  // Gate da Gestão (app SP-API ainda em Draft): esconde a aba p/ quem não está na allowlist.
  const navGroups = NAV_GROUPS
    .map(g=>({...g, ids: g.ids.filter(id=> id!=='financeiro' || gestaoEnabled)}))
    .filter(g=>g.ids.length>0)
  const [cat,      setCat]      = useState('all')
  const [prods,    setProds]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [sideOpen, setSideOpen] = useState(true)
  const [mobileNav, setMobileNav] = useState(false) // sidebar off-canvas no mobile (≤920px)
  const [catOpen,  setCatOpen]  = useState(false)
  // Tema escuro/claro — escolha do cliente, persistida em localStorage
  const [theme, setTheme] = useState<'dark'|'light'>('dark')
  useEffect(()=>{
    try{ const t=localStorage.getItem('oraculo_theme'); if(t==='light'||t==='dark') setTheme(t) }catch{}
  },[])
  useEffect(()=>{
    try{ localStorage.setItem('oraculo_theme', theme); document.documentElement.setAttribute('data-theme', theme) }catch{}
  },[theme])
  const toggleTheme = ()=> setTheme(t=> t==='dark' ? 'light' : 'dark')
  const [detail,     setDetail]     = useState<any>(null)
  const [upgrade,    setUpgrade]    = useState(false)
  const [promo,      setPromo]      = useState<PromoState>({active:false,type:null})
  const [promoOpen,  setPromoOpen]  = useState(false)
  const [page,       setPage]       = useState(1)
  const [licKey,     setLicKey]     = useState<string|null>(null)
  const [licPlan,    setLicPlan]    = useState<string|null>(null)
  const [licLoading, setLicLoading] = useState(false)
  const [keyCopied,  setKeyCopied]  = useState(false)
  // Troca de senha
  const [pwCur,   setPwCur]   = useState('')
  const [pwNew,   setPwNew]   = useState('')
  const [pwConf,  setPwConf]  = useState('')
  const [pwBusy,  setPwBusy]  = useState(false)
  const [pwMsg,   setPwMsg]   = useState<{ok:boolean;text:string}|null>(null)
  const PAGE = 24
  // Pool local de produtos por aba+categoria (dedup por asin) — paginação intuitiva
  const poolRef      = useRef<Record<string,any[]>>({})
  const exhaustedRef = useRef<Record<string,boolean>>({})
  const [poolExhausted, setPoolExhausted] = useState(false)
  const [moreLoading,   setMoreLoading]   = useState(false)
  // Ordenação client-side sobre o pool carregado (default = ordem do servidor)
  const [sortBy, setSortBy] = useState<'default'|'sales'|'score'|'bsr'>('default')
  // Tamanho do pool no momento em que a ordenação foi escolhida — itens que
  // chegarem depois são anexados ao final da visão ordenada (páginas estáveis)
  const sortBaseRef = useRef(0)
  // Nome de exibição em memória (atualizado pela aba Perfil sem reload)
  const [displayName, setDisplayName] = useState<string>(user.name||'')
  const [nameInput,   setNameInput]   = useState<string>(user.name||'')
  const [nameBusy,    setNameBusy]    = useState(false)
  const [nameMsg,     setNameMsg]     = useState<{ok:boolean;text:string}|null>(null)

  /* ── Saudação real por hora local (setada no client p/ evitar mismatch SSR) ── */
  const [greet, setGreet] = useState('Olá')
  useEffect(()=>{
    const h = new Date().getHours()
    setGreet(h<12?'Bom dia':h<18?'Boa tarde':'Boa noite')
  },[])
  const firstName = (displayName||'').trim().split(/\s+/)[0] || 'Seller'

  async function saveName(){
    const n = nameInput.trim().replace(/\s+/g,' ')
    // Guarda de reentrância: Enter no input não respeita o disabled do botão —
    // evita POST duplicado em voo e POST redundante com nome igual ao atual.
    if(nameBusy || n===displayName.trim()) return
    setNameMsg(null)
    if(n.length<2||n.length>60){setNameMsg({ok:false,text:'O nome deve ter entre 2 e 60 caracteres'});return}
    setNameBusy(true)
    try{
      const r = await fetch('/api/user/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})})
      const d = await r.json().catch(()=>({}))
      if(!r.ok){setNameMsg({ok:false,text:d.error||'Erro ao salvar o nome'});return}
      setDisplayName(d.name||n); setNameInput(d.name||n)
      setNameMsg({ok:true,text:'Nome atualizado com sucesso!'})
    }catch{
      setNameMsg({ok:false,text:'Erro de conexão. Tente novamente.'})
    }finally{
      setNameBusy(false)
    }
  }

  /* ── Avatar do usuário (foto persistida em user metadata) ── */
  const [avatar,     setAvatar]     = useState<string|null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function onAvatarFile(e:React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]
    e.target.value = ''
    if(!file) return
    setAvatarBusy(true)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = ()=>{
      URL.revokeObjectURL(url)
      try{
        // redimensiona via canvas para 128x128 (cover, crop central)
        const canvas = document.createElement('canvas')
        canvas.width = 128; canvas.height = 128
        const ctx = canvas.getContext('2d')
        if(!ctx) throw new Error('canvas')
        const s  = Math.min(img.width, img.height)
        const sx = (img.width - s)/2, sy = (img.height - s)/2
        ctx.drawImage(img, sx, sy, s, s, 0, 0, 128, 128)
        let q = 0.82
        let dataUrl = canvas.toDataURL('image/jpeg', q)
        // garante <100KB — reduz qualidade se necessário
        while(dataUrl.length > 100_000 && q > 0.3){ q -= 0.12; dataUrl = canvas.toDataURL('image/jpeg', q) }
        setAvatar(dataUrl)
        fetch('/api/user/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'profile_avatar',value:dataUrl})})
          .catch(()=>{})
          .finally(()=>setAvatarBusy(false))
      }catch{ setAvatarBusy(false) }
    }
    img.onerror = ()=>{ URL.revokeObjectURL(url); setAvatarBusy(false) }
    img.src = url
  }

  /* ── Produtos Salvos (snapshot real do garimpo, persistido em metadata) ── */
  type SavedItem = {asin:string;title:string;image:string;brand:string;category:string;bsr:number;salesEst:number;savedAt:string}
  const [saved, setSaved] = useState<SavedItem[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(()=>{
    fetch('/api/user/metadata?key=profile_avatar').then(r=>r.json())
      .then(d=>{ if(typeof d.value==='string' && d.value.startsWith('data:image')) setAvatar(d.value) })
      .catch(()=>{})
    fetch('/api/user/metadata?key=saved_products').then(r=>r.json())
      .then(d=>{ if(Array.isArray(d.value)) setSaved(d.value.filter((s:any)=>s&&s.asin)) })
      .catch(()=>{})
  },[])

  function persistSaved(list:SavedItem[]){
    if(saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(()=>{
      fetch('/api/user/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'saved_products',value:list})}).catch(()=>{})
    },350)
  }
  const isSaved = (asin:string)=> saved.some(s=>s.asin===asin)
  function toggleSaved(p:any){
    if(!p?.asin) return
    setSaved(prev=>{
      const exists = prev.some(s=>s.asin===p.asin)
      const next = exists
        ? prev.filter(s=>s.asin!==p.asin)
        : [{
            asin: p.asin,
            title: p.title||'',
            image: p.images?.[0]||p.image||'',
            brand: p.brand||'',
            category: p.category||'',
            bsr: p.bsr||0,
            salesEst: p.salesEst||bsrSales(p.bsr||0),
            savedAt: new Date().toISOString(),
          }, ...prev].slice(0,100) // cap 100 — o mais antigo sai
      persistSaved(next)
      return next
    })
  }

  async function changePassword(){
    setPwMsg(null)
    if(!pwCur||!pwNew||!pwConf){setPwMsg({ok:false,text:'Preencha todos os campos'});return}
    if(pwNew.length<6){setPwMsg({ok:false,text:'A nova senha deve ter pelo menos 6 caracteres'});return}
    if(pwNew!==pwConf){setPwMsg({ok:false,text:'A confirmação não confere com a nova senha'});return}
    setPwBusy(true)
    try{
      const r=await fetch('/api/user/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:pwCur,newPassword:pwNew})})
      const d=await r.json().catch(()=>({}))
      if(!r.ok){setPwMsg({ok:false,text:d.error||'Erro ao trocar a senha'});return}
      setPwMsg({ok:true,text:'Senha alterada com sucesso!'})
      setPwCur('');setPwNew('');setPwConf('')
    }catch{
      setPwMsg({ok:false,text:'Erro de conexão. Tente novamente.'})
    }finally{
      setPwBusy(false)
    }
  }

  // Plano não reconhecido (id novo da Greenn, legado etc.) NUNCA cai em free —
  // free foi descontinuado; fallback é o plano pago mais restrito (mensal).
  const cfg = PLAN_CFG[user.plan] ?? PLAN_CFG.monthly
  const isFree = user.plan === 'free'

  // Cobrança coerente: aviso aos 5 dias + bloqueio total quando vencido
  const isStaff    = user.role === 'admin' || user.role === 'staff'
  const isLifetime = user.plan === 'lifetime'
  const expiresAt  = user.expiresAt ? new Date(user.expiresAt) : null
  const daysLeft   = expiresAt ? Math.ceil((expiresAt.getTime()-Date.now())/(1000*60*60*24)) : null
  // Bloqueio total só após a MESMA folga do servidor (GRACE_MS = 2 dias em lib/auth):
  // a renovação recorrente pode demorar a cair via webhook — não travar na virada.
  const expired      = !isStaff && !isLifetime && !isFree && daysLeft !== null && daysLeft <= -2
  // Entre o vencimento e a folga: banner forte NÃO-bloqueante (renovação processando)
  const renewGrace   = !isStaff && !isLifetime && !isFree && daysLeft !== null && daysLeft <= 0 && daysLeft > -2
  const expiringSoon = !expired && !renewGrace && !isStaff && !isLifetime && !isFree && daysLeft !== null && daysLeft <= 5 && daysLeft > 0

  // ASINs já mostrados, por aba+categoria → garante novidade a cada "Atualizar"
  const seenRef = useRef<Record<string, Set<string>>>({})
  // Guarda de sequência: só a requisição mais recente pode gravar estado
  const loadIdRef = useRef(0)
  const [loadError, setLoadError] = useState(false)

  // Dedup por asin preservando a ordem
  const dedupAsin = (list:any[])=>{
    const s = new Set<string>()
    return list.filter(p=>{ if(!p?.asin||s.has(p.asin)) return false; s.add(p.asin); return true })
  }

  async function load(n=nav, c=cat, query='', bust=false){
    const reqId = ++loadIdRef.current
    setLoading(true); setDone(false); setPage(1); setLoadError(false)
    setMoreLoading(false)
    setSortBy('default')  // carga nova = pool novo: ordenação volta ao padrão da aba
    const key = `${n}__${c}`
    if(bust) seenRef.current[key] = new Set()          // recomeça: pool novo, esquece o visto
    poolRef.current[key] = []                          // pool local recomeça a cada carga completa
    exhaustedRef.current[key] = false
    setPoolExhausted(false)
    const seen = (seenRef.current[key] ||= new Set())
    try{
      const params = new URLSearchParams({type:n,category:c,q:query})
      if(bust) params.set('bust','1')
      // envia os já vistos (últimos 800 — cobre o pool do backend mesmo com
      // degraus relaxados; acima disso o seen é resetado abaixo) p/ não repetir
      if(seen.size) params.set('exclude',[...seen].slice(-800).join(','))
      const r = await fetch(`/api/products?${params}`)
      if(reqId !== loadIdRef.current) return           // resposta obsoleta: outra aba/categoria venceu
      if(r.status === 401){ router.push('/login'); return }
      if(!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      if(reqId !== loadIdRef.current) return
      const list: any[] = d.products||[]
      // pool esgotado (cliente já viu quase tudo) e não foi bust → reconstrói com produtos frescos
      if(!bust && query==='' && (d.remaining ?? list.length) < 12){
        return load(n,c,query,true)
      }
      list.forEach(p=>seen.add(p.asin))
      if(seen.size > 800) seenRef.current[key] = new Set(list.map(p=>p.asin))
      const pool = dedupAsin(list)
      poolRef.current[key] = pool
      setProds(pool)
    }catch{
      if(reqId !== loadIdRef.current) return
      setProds([]); setLoadError(true)
    }
    if(reqId !== loadIdRef.current) return
    setLoading(false); setDone(true)
  }

  // Busca mais produtos p/ ampliar o pool (paginação intuitiva) — mesma chamada
  // do Atualizar, com exclude dos já vistos. Retorna true se o pool cresceu.
  // bust=true força o backend a RECONSTRUIR o pool (rotação de keywords) — usado
  // pelo scroll infinito quando o pool atual esgota, pra continuar trazendo produto
  // NOVO em vez de dar "fim dos dados". Retorna true se o pool cresceu.
  async function loadMore(bust=false): Promise<boolean>{
    const reqId = loadIdRef.current
    const key = `${nav}__${cat}`
    const seen = (seenRef.current[key] ||= new Set())
    setMoreLoading(true)
    try{
      const params = new URLSearchParams({type:nav,category:cat,q:''})
      if(bust) params.set('bust','1')
      if(seen.size) params.set('exclude',[...seen].slice(-800).join(','))
      const r = await fetch(`/api/products?${params}`)
      if(reqId !== loadIdRef.current) return false     // usuário trocou de aba no meio
      if(r.status === 401){ router.push('/login'); return false }
      if(!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      if(reqId !== loadIdRef.current) return false
      const list: any[] = d.products||[]
      list.forEach(p=>p?.asin&&seen.add(p.asin))
      if(seen.size > 1600) seenRef.current[key] = new Set([...seen].slice(-1200)) // cap p/ infinito longo
      const pool = poolRef.current[key] || []
      const have = new Set(pool.map(p=>p.asin))
      const fresh = list.filter(p=>p?.asin&&!have.has(p.asin))
      if(fresh.length===0) return false
      const next = [...pool,...fresh]
      poolRef.current[key] = next
      setProds(next)
      return true
    }catch{
      return false
    }finally{
      setMoreLoading(false)
    }
  }

  // Alimenta o scroll infinito: revela o já carregado; se acabou, busca mais; se o
  // pool esgotou, rebusca (bust) girando keywords. Só marca "fim" quando nem o
  // bust traz novidade (catálogo/keywords realmente esgotados p/ a categoria).
  const feedingRef = useRef(false)
  async function feedMore(){
    if(feedingRef.current || moreLoading || loading || !done || isFree) return
    const key = `${nav}__${cat}`
    if(page*PAGE < prods.length){ setPage(p=>p+1); return }   // ainda há carregado: revela
    if(exhaustedRef.current[key]) return
    feedingRef.current = true
    try{
      let grew = await loadMore(false)
      if(!grew) grew = await loadMore(true)                    // pool seco → rebusca fresca
      if(grew) setPage(p=>p+1)
      else { exhaustedRef.current[key] = true; setPoolExhausted(true) }
    } finally { feedingRef.current = false }
  }

  // Grid ref (mantido p/ ancoragem; scroll infinito dispensa navegação por páginas).
  const gridRef = useRef<HTMLDivElement>(null)

  // Carregamento inicial usa cache se disponível → não sobrecarrega a API
  useEffect(()=>{ load('bestsellers','all','',false) },[]) // eslint-disable-line

  // Renovação DESLIZANTE da sessão: cada visita ao painel/app estende a validade
  // (sessão >7d é re-emitida por +30d). O app PWA em uso nunca expira.
  useEffect(()=>{ fetch('/api/auth/refresh',{method:'POST'}).catch(()=>{}) },[])

  function goNav(id:string){
    setMobileNav(false) // fecha o menu off-canvas ao navegar (mobile)
    if(!cfg.tabs.includes(id)){setUpgrade(true);return}
    setNav(id); setPage(1)
    setSortBy('default')  // cada aba tem semântica própria — não herda ordenação
    if(id==='competitor'||id==='saved'||id==='perfil'){loadIdRef.current++;setLoading(false);setProds([]);setDone(false);return}
    if(id==='extension'){
      loadIdRef.current++;setLoading(false)
      setProds([]);setDone(false)
      if(!licKey){
        setLicLoading(true)
        fetch('/api/my-license').then(r=>r.json()).then(d=>{
          if(d.key){setLicKey(d.key);setLicPlan(d.plan)}
        }).finally(()=>setLicLoading(false))
      }
      return
    }
    // volta pra uma aba já garimpada → restaura o pool acumulado sem nova chamada
    const key = `${id}__${cat}`
    const pool = poolRef.current[key]
    if(pool&&pool.length){
      loadIdRef.current++
      setLoading(false); setLoadError(false); setMoreLoading(false)
      setProds(pool); setDone(true)
      setPoolExhausted(!!exhaustedRef.current[key])
      return
    }
    // troca de aba usa cache → rápido; "Atualizar" força bust
    load(id,cat,'',false)
  }

  function handleCardClick(p:any, isLocked:boolean){
    if(isLocked||!cfg.modal){setUpgrade(true);return}
    setDetail(p)
  }

  // Quem rola é o <main> (layout 100vh/overflow:hidden) — window.scrollTo não funciona aqui
  const mainRef = useRef<HTMLElement>(null)
  const curNav  = NAV.find(n=>n.id===nav)
  const curCat  = CATS.find(c=>c.id===cat)
  const isCross = cat === 'all'
  // Ordenação client-side sobre o pool (default = ordem do servidor).
  // Ordena só o SNAPSHOT do momento em que o usuário escolheu a ordenação —
  // itens que chegarem depois (goNext/loadMore) entram ao FINAL, sem se
  // intercalar nas páginas já vistas (a página atual não muda sob o usuário).
  const pSales = (p:any)=> p.salesEst||bsrSales(p.bsr||0)
  const pIsGen = (p:any)=> !p.brand||p.brand.trim()===''||p.brand.toLowerCase()==='genérico'
  const sortCmp = (a:any,b:any)=>
    sortBy==='sales' ? pSales(b)-pSales(a)
    : sortBy==='score' ? cardScore(b.bsr||0,pSales(b),pIsGen(b))-cardScore(a.bsr||0,pSales(a),pIsGen(a))
    : (a.bsr||Number.MAX_SAFE_INTEGER)-(b.bsr||Number.MAX_SAFE_INTEGER)
  const sortedProds = sortBy==='default' ? prods
    : [...prods.slice(0,sortBaseRef.current)].sort(sortCmp).concat(prods.slice(sortBaseRef.current))
  const totalP  = Math.ceil(sortedProds.length/PAGE)
  // Scroll infinito (pago): mostra acumulado até page*PAGE. Free: só a 1ª leva (com locks).
  const shown   = isFree ? sortedProds.slice(0,PAGE) : sortedProds.slice(0,page*PAGE)

  // Observa o sentinela no fim do grid → alimenta o scroll infinito automaticamente.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const el = sentinelRef.current
    if(!el || isFree) return
    const io = new IntersectionObserver(
      entries=>{ if(entries[0]?.isIntersecting) feedMore() },
      { root: mainRef.current, rootMargin: '600px 0px' }   // pré-carrega antes de chegar no fim
    )
    io.observe(el)
    return ()=>io.disconnect()
  })   // sem deps: re-observa a cada render (o grid/estado muda) — barato

  return(
    <>
      {upgrade&&<UpgradeModal onClose={()=>setUpgrade(false)}/>}
      {detail&&<DetailModal product={detail} onClose={()=>setDetail(null)} promo={promo}/>}
      {promoOpen&&<PromoModal promo={promo} setPromo={setPromo} onClose={()=>setPromoOpen(false)}/>}

      {/* BLOQUEIO VENCIDO — overlay premium sem fechar: só renovar ou sair */}
      {expired&&(
        <div role="dialog" aria-modal="true" aria-label="Seu acesso venceu"
          style={{position:'fixed',inset:0,zIndex:1200,background:'rgba(1,1,8,0.72)',backdropFilter:'blur(16px)',overflowY:'auto',padding:'40px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
          <div style={{width:'100%',maxWidth:520,background:T.modal,border:`1px solid ${T.lineG}`,borderRadius:20,overflow:'hidden',boxShadow:'0 40px 90px rgba(0,0,0,0.85)',animation:'fadeUp .35s ease-out both'}}>
            {/* Header */}
            <div style={{padding:'34px 32px 24px',textAlign:'center' as const,borderBottom:`1px solid ${T.line}`,background:'linear-gradient(180deg,rgba(240,180,41,0.08) 0%,transparent 100%)'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                <div style={{width:56,height:56,borderRadius:16,background:T.goldSub,border:`1px solid ${tint(T.gold,25)}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <OracleMark size={30}/>
                </div>
              </div>
              <h2 style={{fontSize:21,fontWeight:800,color:T.t1,letterSpacing:'-0.03em',marginBottom:8}}>Seu acesso venceu</h2>
              <p style={{fontSize:12.5,color:T.t2,lineHeight:1.65,maxWidth:380,margin:'0 auto'}}>
                O plano <strong style={{color:T.t1}}>{cfg.label}</strong> venceu em <strong style={{color:T.a}}>{expiresAt?.toLocaleDateString('pt-BR')}</strong>.
                Renove agora para voltar a garimpar — seus produtos salvos continuam guardados.
              </p>
            </div>
            {/* Renovação */}
            <div style={{padding:'24px 28px 20px',display:'flex',flexDirection:'column',gap:10}}>
              {user.plan!=='annual'&&(
                <a href={GREENN[user.plan]??GREENN.monthly} target="_blank" rel="noreferrer"
                  style={{display:'block',textAlign:'center' as const,background:T.goldG,color:'#02020A',fontWeight:800,fontSize:12,padding:'14px',borderRadius:10,textDecoration:'none',letterSpacing:'0.08em',textTransform:'uppercase' as const,boxShadow:'0 4px 20px rgba(240,180,41,0.3)',transition:'transform .15s'}}>
                  Renovar {cfg.label} — {PLAN_PRICE[user.plan]??PLAN_PRICE.monthly}
                </a>
              )}
              {/* Anual destacado — economia REAL */}
              <a href={GREENN.annual} target="_blank" rel="noreferrer"
                style={{position:'relative' as const,display:'block',textAlign:'center' as const,textDecoration:'none',borderRadius:12,padding:'16px 14px 14px',
                  background:user.plan==='annual'?T.goldG:tint(T.gold,4),
                  border:`1px solid ${user.plan==='annual'?'transparent':tint(T.gold,30)}`,
                  boxShadow:user.plan==='annual'?'0 4px 20px rgba(240,180,41,0.3)':`0 0 24px ${tint(T.gold,8)}`,transition:'transform .15s'}}>
                <span style={{position:'absolute',top:-9,left:'50%',transform:'translateX(-50%)',background:T.gold,color:'#02020A',fontSize:8,fontWeight:800,padding:'3px 10px',borderRadius:99,letterSpacing:'0.12em',whiteSpace:'nowrap' as const}}>MELHOR VALOR</span>
                <span style={{display:'block',fontSize:12,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase' as const,color:user.plan==='annual'?'#02020A':T.gold,marginBottom:3}}>
                  {user.plan==='annual'?'Renovar Anual — R$ 597/ano':'Vire Anual — R$ 597/ano'}
                </span>
                <span className="ora-num" style={{display:'block',fontSize:10.5,color:user.plan==='annual'?'rgba(2,2,10,0.75)':T.t2}}>
                  economize R$ {ANNUAL_ECON_FMT}/ano ({ANNUAL_ECON_PCT}%) vs mensal
                </span>
              </a>
            </div>
            {/* Suporte + sair */}
            <div style={{padding:'0 28px 26px',display:'flex',flexDirection:'column',gap:12,alignItems:'center'}}>
              <a href={WA_LINK} target="_blank" rel="noreferrer"
                style={{display:'inline-flex',alignItems:'center',gap:7,fontSize:11.5,fontWeight:600,color:T.g,textDecoration:'none'}}>
                <WaIcon size={15} c={T.g}/> Precisa de ajuda? Fale com o suporte
              </a>
              <button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/login')}}
                style={{background:'none',border:'none',color:T.t3,cursor:'pointer',fontSize:11,fontFamily:'inherit',letterSpacing:'0.04em',textDecoration:'underline',textUnderlineOffset:3}}>
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante de suporte — some quando há modal aberto */}
      {!detail&&!upgrade&&!promoOpen&&!expired&&(
        <a href={WA_LINK} target="_blank" rel="noreferrer" className="ora-wa-fab" aria-label="Suporte no WhatsApp" title="Suporte no WhatsApp"
          style={{position:'fixed',bottom:24,right:24,width:52,height:52,borderRadius:'50%',background:T.g,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--elev2)',zIndex:90}}>
          <WaIcon size={26} c="#fff"/>
        </a>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        body,input,button{font-family:var(--font-ui)}
        .ora-num{font-family:var(--font-num);font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.t3};border-radius:2px}
        input[type=number]::-webkit-inner-spin-button{opacity:.2}
        input::placeholder{color:${T.t3}}
        @keyframes pulse{0%,100%{opacity:.7}50%{opacity:.35}}
        @keyframes glow{0%,100%{opacity:.7}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes oraSpin{to{transform:rotate(360deg)}}
        @keyframes oraDot{0%{box-shadow:0 0 0 0 color-mix(in srgb, var(--g) 45%, transparent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}
        .ora-card-in{animation:fadeUp .35s ease-out both;display:grid;min-width:0}
        .ora-tab-in{animation:fadeUp .25s ease-out}
        .ora-nav{transition:transform .15s ease-out, background .15s ease-out}
        .ora-nav:not(.on):hover{transform:translateX(2px);background:color-mix(in srgb, var(--gold) 4%, transparent)}
        .ora-dot{animation:oraDot 2.4s ease-out infinite}
        .ora-spin{animation:oraSpin .9s linear infinite}
        .ora-avatar .cam{opacity:0}
        .ora-avatar:hover .cam,.ora-avatar .cam.busy{opacity:1}
        .ora-wa-fab{transition:transform .18s ease-out, box-shadow .18s ease-out}
        .ora-wa-fab:hover{transform:scale(1.06)}
        .ora-wa-side{transition:background .15s ease-out, border-color .15s ease-out}
        .ora-wa-side:hover{background:color-mix(in srgb, var(--g) 16%, transparent)!important}
        button:not(:disabled):active{transform:scale(.98)}
        /* ── Responsivo (mobile/tablet ≤920px) ─────────────────────────────────
           Só atua abaixo de 920px — desktop fica intocado. Sidebar vira off-canvas
           (hambúrguer no topbar), grids de KPI caem pra 2 colunas e tabelas ganham
           scroll horizontal. !important é necessário p/ vencer os estilos inline. */
        .ora-burger{display:none}
        .ora-backdrop{display:none}
        @media (max-width:920px){
          .ora-burger{display:flex}
          .ora-side{position:fixed!important;top:0;left:0;bottom:0;width:272px!important;z-index:1200!important;transform:translateX(-105%);transition:transform .25s ease!important;box-shadow:0 0 70px rgba(0,0,0,.55)}
          .ora-side.mopen{transform:translateX(0)}
          /* cursor:pointer + SEM backdrop-filter: o blur em elemento fixed trava o
             hit-testing do toque em algumas versões do iOS — o toque fora do menu
             não fechava. O ✕ no topo do menu é a garantia (não depende disso). */
          .ora-backdrop{display:block;position:fixed;inset:0;background:rgba(1,1,8,0.72);z-index:1195;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
          .ora-mclose{display:flex!important}
          .ora-main-pad{padding:16px 12px 90px!important}
          .ora-hidemob{display:none!important}
          .ora-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
          .ora-kpis4{grid-template-columns:repeat(2,1fr)!important}
          .ora-tscroll{overflow-x:auto!important;-webkit-overflow-scrolling:touch}
          .ora-tscroll table{min-width:640px}
          .ora-tabs{overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
          .ora-tabs::-webkit-scrollbar{display:none}
          .ora-wrap{flex-wrap:wrap!important}
          /* Header de página: título em cima, barra de ações quebra pra baixo
             (o flexShrink:0 da barra esmagava o título e vazava da tela) */
          .ora-phead{flex-wrap:wrap!important;align-items:flex-start!important}
          .ora-ptools{flex-wrap:wrap!important;max-width:100%}
        }
        @media (prefers-reduced-motion: reduce){
          *,*::before,*::after{animation:none!important;transition:none!important}
          button:not(:disabled):active{transform:none}
        }
      `}</style>

      <div style={{display:'flex',height:'100vh',background:T.bg,color:T.t1,overflow:'hidden'}}>

        {/* SIDEBAR */}
        <aside className={`ora-side${mobileNav?' mopen':''}`} style={{width:sideOpen?248:64,background:T.sidebar,borderRight:`1px solid ${T.line}`,display:'flex',flexDirection:'column',transition:'width .22s cubic-bezier(.4,0,.2,1)',overflow:'hidden',flexShrink:0,zIndex:20,position:'relative' as const}}>

          {/* Veio dourado sutil no topo */}
          <div aria-hidden style={{position:'absolute',top:0,left:0,right:0,height:220,pointerEvents:'none',background:`radial-gradient(120% 90% at 50% 0%, ${tint(T.gold,6)} 0%, transparent 70%)`}}/>

          {/* Logo */}
          <div style={{padding:'0 14px',height:64,borderBottom:`1px solid ${T.line}`,display:'flex',alignItems:'center',gap:12,flexShrink:0,cursor:'pointer',position:'relative' as const}} onClick={()=>setSideOpen(!sideOpen)}
            role="button" tabIndex={0} aria-label={sideOpen?'Recolher menu lateral':'Expandir menu lateral'} aria-expanded={sideOpen}
            onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSideOpen(!sideOpen)}}}>
            <div style={{width:40,height:40,borderRadius:10,background:T.goldSub,border:`1px solid ${tint(T.gold,15)}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <OracleMark size={22}/>
            </div>
            {sideOpen&&<div style={{overflow:'hidden',minWidth:0,flex:1}}>
              <div style={{fontSize:16,fontWeight:800,letterSpacing:'0.24em',lineHeight:1,whiteSpace:'nowrap' as const,color:T.gold,
                background:'var(--goldTextG)',WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent'}}>ORÁCULO</div>
              <div style={{fontSize:8,fontWeight:600,letterSpacing:'0.2em',color:T.t3,marginTop:4,textTransform:'uppercase' as const,whiteSpace:'nowrap' as const}}>Amazon Intelligence</div>
            </div>}
            {/* ✕ fechar (só mobile) — garantia de fechamento independente do
                backdrop, que no iOS já se mostrou não confiável pra toque. */}
            {mobileNav&&(
              <button className="ora-mclose" onPointerDown={e=>{e.stopPropagation();setMobileNav(false)}} onClick={e=>e.stopPropagation()} aria-label="Fechar menu"
                style={{display:'none',alignItems:'center',justifyContent:'center',width:34,height:34,flexShrink:0,borderRadius:9,
                  border:`1px solid ${T.line}`,background:'rgba(255,255,255,0.04)',color:T.t2,fontSize:17,lineHeight:1,cursor:'pointer',
                  fontFamily:'inherit',touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>✕</button>
            )}
          </div>

          {/* Nav */}
          <nav style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'8px',display:'flex',flexDirection:'column',gap:2,position:'relative' as const}}>
            {navGroups.map(g=>(
              <React.Fragment key={g.group}>
                {sideOpen&&<Lbl style={{padding:'12px 8px 6px',marginBottom:2}}>{g.group}</Lbl>}
                {g.ids.map(id=>{
                  const n = NAV.find(x=>x.id===id)!
                  const active = nav===id
                  const locked = !cfg.tabs.includes(id)
                  return(
                    <button key={id} onClick={()=>goNav(id)} title={!sideOpen?n.label:undefined}
                      className={`ora-nav${active?' on':''}`}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:sideOpen?'8px 10px':'10px',justifyContent:sideOpen?'flex-start':'center',borderRadius:8,border:'none',cursor:'pointer',
                        background:active?`${tint(T.gold,8)}`:'none',
                        borderLeft:sideOpen?(active?`3px solid ${T.gold}`:'3px solid transparent'):'none',
                        paddingLeft:sideOpen?(active?'7px':'10px'):undefined,
                        boxShadow:active?`0 0 18px -8px ${tint(T.gold,55)}`:'none',
                        fontFamily:'inherit',textAlign:'left' as const,outline:'none',opacity:locked?.5:1}}>
                      <NavIcon id={id} active={active}/>
                      {sideOpen&&<>
                        <span style={{fontSize:12,fontWeight:active?600:400,color:active?T.t1:T.t2,whiteSpace:'nowrap' as const,flex:1,letterSpacing:'-0.01em'}}>{n.label}</span>
                        {id==='saved'&&saved.length>0&&(
                          <span className="ora-num" style={{background:T.goldSub,border:`1px solid ${tint(T.gold,25)}`,color:T.gold,fontSize:9,fontWeight:700,minWidth:18,height:16,padding:'0 5px',borderRadius:99,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{saved.length}</span>
                        )}
                        {locked&&<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1.5" y="5" width="8" height="5.5" rx="1.5" style={{stroke:T.t3}} strokeWidth="1.2"/><path d="M3.5 5V3.5a2 2 0 014 0V5" style={{stroke:T.t3}} strokeWidth="1.2" strokeLinecap="round"/></svg>}
                      </>}
                    </button>
                  )
                })}
              </React.Fragment>
            ))}

            {/* App & Avisos — entrada PERMANENTE pro guia de instalação + push.
                O banner some por 30 dias quando dispensado; sem esta porta o
                cliente ficava sem como ativar/testar a notificação de venda. */}
            <button onClick={()=>{setMobileNav(false); window.dispatchEvent(new Event('ora-open-app'))}}
              title={!sideOpen?'App & Avisos':undefined} className="ora-nav"
              style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:sideOpen?'8px 10px':'10px',justifyContent:sideOpen?'flex-start':'center',borderRadius:8,border:'none',cursor:'pointer',background:'none',
                borderLeft:sideOpen?'3px solid transparent':'none',fontFamily:'inherit',textAlign:'left' as const,outline:'none'}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}} aria-hidden>
                <rect x="7" y="2.5" width="10" height="19" rx="2.4" style={{stroke:T.t3}} strokeWidth="1.5"/>
                <path d="M11 18.4h2" style={{stroke:T.t3}} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M18.5 7.5a4.2 4.2 0 011.6 3.2M18.5 5a6.8 6.8 0 014.1 5.7" style={{stroke:T.gold}} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {sideOpen&&<span style={{fontSize:12,fontWeight:400,color:T.t2,whiteSpace:'nowrap' as const,flex:1,letterSpacing:'-0.01em'}}>App &amp; Avisos</span>}
            </button>

            {/* Categories */}
            {sideOpen&&(
              <>
                <button onClick={()=>setCatOpen(!catOpen)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 10px 6px',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',marginTop:4}}>
                  <Lbl>Categorias</Lbl>
                  <Chevron open={catOpen}/>
                </button>
                <div style={{overflow:'hidden',maxHeight:catOpen?500:0,transition:'max-height .28s cubic-bezier(.4,0,.2,1)'}}>
                  {CATS.map(c=>{
                    const active=cat===c.id
                    return(
                      <button key={c.id} onClick={()=>{
                        setCat(c.id); setPage(1); setSortBy('default')
                        const target=nav==='search'?'bestsellers':nav
                        if(nav==='search') setNav('bestsellers')
                        const k=`${target}__${c.id}`
                        const pool=poolRef.current[k]
                        if(pool&&pool.length){
                          loadIdRef.current++
                          setLoading(false);setLoadError(false);setMoreLoading(false)
                          setProds(pool);setDone(true)
                          setPoolExhausted(!!exhaustedRef.current[k])
                          return
                        }
                        load(target,c.id,'',false)
                      }} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'6px 10px 6px 20px',borderRadius:7,border:'none',cursor:'pointer',marginBottom:1,background:active?`${tint(T.gold,3)}`:'none',fontFamily:'inherit',textAlign:'left' as const}}>
                        <div style={{width:4,height:4,borderRadius:'50%',background:active?T.gold:T.t3,flexShrink:0}}/>
                        <span style={{fontSize:11,color:active?T.gold:T.t4,fontWeight:active?600:400,letterSpacing:'-0.01em'}}>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </nav>

          {/* Suporte + Perfil */}
          <div style={{padding:'10px 12px 12px',borderTop:`1px solid ${T.line}`,flexShrink:0,display:'flex',flexDirection:'column',gap:8,position:'relative' as const}}>
            <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarFile} style={{display:'none'}} aria-hidden/>

            {/* Suporte WhatsApp */}
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="ora-wa-side" aria-label="Suporte no WhatsApp" title={!sideOpen?'Suporte no WhatsApp':undefined}
              style={{display:'flex',alignItems:'center',justifyContent:sideOpen?'flex-start':'center',gap:9,padding:sideOpen?'9px 12px':'9px 0',borderRadius:10,textDecoration:'none',
                background:tint(T.g,10),border:`1px solid ${tint(T.g,25)}`}}>
              <WaIcon size={15} c={T.g}/>
              {sideOpen&&<span style={{fontSize:11,fontWeight:700,color:T.g,letterSpacing:'0.02em',whiteSpace:'nowrap' as const}}>Suporte no WhatsApp</span>}
            </a>

            {/* Voltar ao painel Admin — só admin/staff */}
            {isStaff&&(
              <a href="/admin" className="ora-wa-side" aria-label="Painel Admin" title={!sideOpen?'Painel Admin':undefined}
                style={{display:'flex',alignItems:'center',justifyContent:sideOpen?'flex-start':'center',gap:9,padding:sideOpen?'9px 12px':'9px 0',borderRadius:10,textDecoration:'none',
                  background:tint(T.gold,10),border:`1px solid ${tint(T.gold,25)}`}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 10.5 12 4l9 6.5M5 9.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" stroke={T.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {sideOpen&&<span style={{fontSize:11,fontWeight:700,color:T.gold,letterSpacing:'0.02em',whiteSpace:'nowrap' as const}}>Painel Admin</span>}
              </a>
            )}

            {/* Card de perfil */}
            {sideOpen?(
              <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:12,padding:'10px',boxShadow:'var(--elev1)',display:'flex',flexDirection:'column',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <button className="ora-avatar" onClick={()=>fileRef.current?.click()} title="Alterar foto" aria-label="Alterar foto de perfil"
                    style={{position:'relative',width:36,height:36,borderRadius:'50%',padding:0,cursor:'pointer',overflow:'hidden',flexShrink:0,
                      border:`1px solid ${avatar?T.lineG:tint(cfg.color,35)}`,background:avatar?'transparent':tint(cfg.color,12),
                      display:'flex',alignItems:'center',justifyContent:'center',
                      boxShadow:isFree?undefined:`0 0 10px ${cfg.glow}`}}>
                    {avatar
                      ?<img src={avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      :<span style={{fontSize:13,color:cfg.color,fontWeight:700}}>{displayName?.[0]?.toUpperCase()||'?'}</span>}
                    <span className={`cam${avatarBusy?' busy':''}`} style={{position:'absolute',inset:0,background:'rgba(3,3,10,0.55)',display:'flex',alignItems:'center',justifyContent:'center',transition:'opacity .15s'}}>
                      {avatarBusy
                        ?<svg className="ora-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 1-9 9" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                        :<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.2-1.8h5.6L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="12.5" r="3" stroke="#fff" strokeWidth="1.5"/></svg>}
                    </span>
                  </button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,letterSpacing:'-0.01em'}}>{displayName}</div>
                    <span style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:3,fontSize:8,fontWeight:700,color:cfg.color,letterSpacing:'0.1em',textTransform:'uppercase' as const,background:tint(cfg.color,10),border:`1px solid ${tint(cfg.color,22)}`,borderRadius:99,padding:'2px 7px'}}>{cfg.label}</span>
                  </div>
                  <button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/login')}} title="Sair" aria-label="Sair da conta"
                    style={{background:'none',border:`1px solid ${T.line}`,cursor:'pointer',color:T.t3,width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:0,transition:'all .15s'}}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=tint(T.r,35);el.style.color=T.r}}
                    onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.line;el.style.color=T.t3}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M14 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7M16 8l4 4-4 4M20 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                {isFree&&(
                  <button onClick={()=>setUpgrade(true)} style={{width:'100%',background:T.goldG,border:'none',cursor:'pointer',color:'#02020A',fontSize:9,fontFamily:'inherit',padding:'7px',borderRadius:7,letterSpacing:'0.08em',fontWeight:800,textTransform:'uppercase' as const}}>Fazer Upgrade</button>
                )}
              </div>
            ):(
              <button className="ora-avatar" onClick={()=>fileRef.current?.click()} title="Alterar foto" aria-label="Alterar foto de perfil"
                style={{position:'relative',width:34,height:34,margin:'0 auto',borderRadius:'50%',padding:0,cursor:'pointer',overflow:'hidden',flexShrink:0,
                  border:`1px solid ${avatar?T.lineG:tint(cfg.color,30)}`,background:avatar?'transparent':tint(cfg.color,10),
                  display:'flex',alignItems:'center',justifyContent:'center'}}>
                {avatar
                  ?<img src={avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<span style={{fontSize:12,color:cfg.color,fontWeight:700}}>{displayName?.[0]?.toUpperCase()||'?'}</span>}
                <span className={`cam${avatarBusy?' busy':''}`} style={{position:'absolute',inset:0,background:'rgba(3,3,10,0.55)',display:'flex',alignItems:'center',justifyContent:'center',transition:'opacity .15s'}}>
                  {avatarBusy
                    ?<svg className="ora-spin" width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 1-9 9" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                    :<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.2-1.8h5.6L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="12.5" r="3" stroke="#fff" strokeWidth="1.5"/></svg>}
                </span>
              </button>
            )}
          </div>
        </aside>

        {/* Backdrop do menu mobile (só existe em ≤920px via CSS) */}
        {mobileNav&&<div className="ora-backdrop" onPointerDown={()=>setMobileNav(false)} onClick={()=>setMobileNav(false)} role="button" aria-label="Fechar menu" />}

        {/* MAIN */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

          {/* Vencido DENTRO da folga de 2 dias (GRACE_MS do servidor) — banner forte
              não-bloqueante: a renovação recorrente pode estar processando na Greenn */}
          {renewGrace&&(
            <div style={{background:tint(T.r,8),borderBottom:`1px solid ${tint(T.r,22)}`,padding:'8px 24px',display:'flex',alignItems:'center',gap:12,flexShrink:0,flexWrap:'wrap' as const}}>
              <span style={{fontSize:11,color:T.t1,flex:1,minWidth:220}}>
                Seu plano <strong style={{color:T.r}}>{cfg.label}</strong> venceu{expiresAt?<> em <strong className="ora-num" style={{color:T.r}}>{expiresAt.toLocaleDateString('pt-BR')}</strong></>:null}. Se você já renovou, a confirmação chega em instantes — caso contrário, renove agora para não perder o acesso.
              </span>
              <a href={GREENN[user.plan] ?? GREENN.monthly} target="_blank" rel="noreferrer"
                style={{fontSize:10,fontWeight:800,color:'#02020A',background:T.goldG,padding:'6px 14px',borderRadius:6,textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase' as const,flexShrink:0,boxShadow:'0 2px 12px rgba(240,180,41,0.3)'}}>
                Renovar agora
              </a>
            </div>
          )}

          {/* Aviso de vencimento — 5 dias, âmbar→dourado, com atalho pro Anual */}
          {expiringSoon&&(
            <div style={{background:`linear-gradient(90deg, ${tint(T.a,10)} 0%, ${tint(T.gold,10)} 100%)`,borderBottom:`1px solid ${tint(T.gold,22)}`,padding:'8px 24px',display:'flex',alignItems:'center',gap:12,flexShrink:0,flexWrap:'wrap' as const}}>
              <span style={{fontSize:11,color:T.t1,flex:1,minWidth:220}}>
                Seu plano <strong style={{color:T.a}}>{cfg.label}</strong> vence em <strong className="ora-num" style={{color:T.a}}>{daysLeft} {daysLeft===1?'dia':'dias'}</strong>{expiresAt?<> ({expiresAt.toLocaleDateString('pt-BR')})</>:null}. Renove para não perder o acesso.
              </span>
              <a href={GREENN[user.plan] ?? GREENN.monthly} target="_blank" rel="noreferrer"
                style={{fontSize:10,fontWeight:800,color:'#02020A',background:T.goldG,padding:'6px 14px',borderRadius:6,textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase' as const,flexShrink:0,boxShadow:'0 2px 12px rgba(240,180,41,0.3)'}}>
                Renovar agora
              </a>
              {user.plan!=='annual'&&(
                <a href={GREENN.annual} target="_blank" rel="noreferrer"
                  style={{fontSize:10,fontWeight:700,color:T.gold,background:T.goldSub,border:`1px solid ${tint(T.gold,25)}`,padding:'5px 12px',borderRadius:99,textDecoration:'none',flexShrink:0}}>
                  Vire Anual e economize {ANNUAL_ECON_PCT}%
                </a>
              )}
            </div>
          )}

          {/* Free plan banner */}
          {isFree&&(
            <div style={{background:`${tint(T.gold,6)}`,borderBottom:`1px solid ${tint(T.gold,12)}`,padding:'8px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{fontSize:11,color:T.gold}}>Plano Gratuito — <span style={{color:T.t2}}>Você está vendo apenas {cfg.limit} produtos. Faça upgrade para desbloquear tudo.</span></div>
              <button onClick={()=>setUpgrade(true)} style={{background:T.goldG,border:'none',cursor:'pointer',color:'#02020A',fontSize:10,fontFamily:'inherit',padding:'5px 14px',borderRadius:6,letterSpacing:'0.06em',fontWeight:800,textTransform:'uppercase' as const,flexShrink:0,marginLeft:16}}>Ver Planos</button>
            </div>
          )}

          {/* Topbar */}
          <header style={{height:60,background:T.sidebar,borderBottom:`1px solid ${T.line}`,display:'flex',alignItems:'center',gap:12,padding:'0 24px',flexShrink:0}}>
            {/* Hambúrguer — só aparece no mobile (≤920px, via CSS) e abre a sidebar off-canvas */}
            <button className="ora-burger" onClick={()=>{setSideOpen(true);setMobileNav(true)}} aria-label="Abrir menu"
              style={{background:'transparent',border:`1px solid ${T.line}`,color:T.t2,borderRadius:9,width:36,height:36,cursor:'pointer',flexShrink:0,alignItems:'center',justifyContent:'center'}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
            {/* Saudação real por hora local */}
            <div style={{minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:T.t1,letterSpacing:'-0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{greet}, {firstName}</div>
              <div style={{fontSize:10,color:T.t3,marginTop:1}}>O que vamos garimpar hoje?</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:14}}>
              <button onClick={toggleTheme} title={theme==='dark'?'Tema claro':'Tema escuro'} aria-label="Alternar tema"
                style={{display:'flex',alignItems:'center',justifyContent:'center',width:34,height:34,borderRadius:9,background:T.card,border:`1px solid ${T.line}`,color:T.t2,cursor:'pointer',transition:'all .15s'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.lineG;el.style.color=T.gold}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.line;el.style.color=T.t2}}>
                {theme==='dark'
                  ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6"/><path d="M12 2v2.2M12 19.8V22M22 12h-2.2M4.2 12H2M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  :<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <div className="ora-dot" style={{width:6,height:6,borderRadius:'50%',background:T.g}}/>
                <span style={{fontSize:10,color:T.t3,fontWeight:500}}>Amazon BR</span>
              </div>
            </div>
          </header>

          {/* Promo banner */}
          {promo.active?(
            <div style={{background:'rgba(34,197,94,0.07)',borderBottom:'1px solid rgba(34,197,94,0.2)',padding:'7px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
              <Ico n="gift" size={14} c={T.g}/>
              <span style={{fontSize:11,color:T.g,flex:1}}>
                <strong>Promoção ativa:</strong> {promo.type==='comissao'?'Isenção de Comissão de Referência':promo.type==='fba'?'Isenção de Tarifa FBA':'Isenção de Comissão + FBA'} — todos os cálculos foram ajustados
              </span>
              <button onClick={()=>setPromoOpen(true)} style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',color:T.g,fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:6,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.04em'}}>Editar</button>
              <button onClick={()=>setPromo({active:false,type:null})} style={{background:'transparent',border:`1px solid rgba(34,197,94,0.15)`,color:T.t3,fontSize:10,fontWeight:600,padding:'4px 10px',borderRadius:6,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.04em'}}>Desativar</button>
            </div>
          ):(
            <div style={{borderBottom:`1px solid ${T.line}`,padding:'6px 24px',display:'flex',alignItems:'center',flexShrink:0}}>
              <button onClick={()=>setPromoOpen(true)} style={{background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6,padding:'2px 0'}}>
                <span style={{flexShrink:0,color:T.gold}}><Ico n="bulb" size={13} c={T.gold}/></span>
                <span style={{fontSize:11,color:T.t3}}>Amazon com promoção de isenção? <span style={{color:T.gold}}>Ative aqui →</span></span>
              </button>
            </div>
          )}

          {/* Content */}
          <main key={nav} ref={mainRef} className={`ora-tab-in${nav==='competitor'?'':' ora-main-pad'}`} style={{flex:1,overflowY:'auto',padding:nav==='competitor'?'0':'28px 28px 40px',position:'relative' as const,display:'flex',flexDirection:'column'}}>

            {/* Competitor Panel */}
            {nav==='competitor'&&(
              <CompetitorPanel user={user} isFree={isFree} onUpgrade={()=>setUpgrade(true)}/>
            )}

            {/* Extension Panel */}
            {nav==='extension'&&(
              <div style={{maxWidth:560,margin:'0 auto',paddingTop:40}}>
                <div style={{textAlign:'center' as const,marginBottom:36}}>
                  <div style={{marginBottom:12,display:'flex',justifyContent:'center'}}><Ico n="puzzle" size={40} c={T.gold}/></div>
                  <h2 style={{fontSize:22,fontWeight:800,color:T.t1,letterSpacing:'-0.03em',marginBottom:8}}>Extensão Chrome</h2>
                  <p style={{fontSize:13,color:T.t3,lineHeight:1.6}}>Analise qualquer produto Amazon diretamente na página com nossa extensão. Instale e ative com sua chave de licença.</p>
                </div>

                {/* Chave de licença */}
                <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'24px',marginBottom:16,boxShadow:'var(--elev1)'}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:12,display:'flex',alignItems:'center',gap:7}}><Ico n="key" size={13} c={T.gold}/> Sua Chave de Licença</div>
                  {licLoading?(
                    <div style={{height:48,background:T.bg,borderRadius:10,animation:'pulse 1.5s infinite'}}/>
                  ):licKey?(
                    <>
                      <div style={{background:T.bg,border:`1px solid ${T.lineG}`,borderRadius:10,padding:'14px 18px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                        <span className="ora-num" style={{fontSize:16,fontWeight:600,color:T.gold,letterSpacing:'0.06em',wordBreak:'break-all' as const}}>{licKey}</span>
                        <button onClick={()=>{navigator.clipboard.writeText(licKey);setKeyCopied(true);setTimeout(()=>setKeyCopied(false),2000)}}
                          style={{flexShrink:0,background:keyCopied?T.g:T.goldG,border:'none',color:'#03030A',fontWeight:700,fontSize:10,padding:'8px 14px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',transition:'all .2s',whiteSpace:'nowrap' as const}}>
                          {keyCopied?'✓ Copiado!':'Copiar'}
                        </button>
                      </div>
                      <div style={{fontSize:11,color:T.t3}}>
                        Plano: <span style={{color:T.gold,fontWeight:600}}>{(licPlan ? PLAN_CFG[licPlan]?.label : undefined) ?? licPlan}</span>
                        {' · '}Funciona em <span style={{color:T.t4,fontWeight:600}}>1 dispositivo</span> por vez
                      </div>
                    </>
                  ):(
                    <div style={{textAlign:'center' as const,padding:'20px 0'}}>
                      <div style={{fontSize:12,color:T.t3,marginBottom:8}}>Nenhuma licença encontrada para este e-mail.</div>
                      <div style={{fontSize:11,color:T.t3}}>Se você acabou de comprar, aguarde alguns minutos e atualize a página.</div>
                    </div>
                  )}
                </div>

                {/* Botão instalar */}
                <a href="https://chromewebstore.google.com/detail/or%C3%A1culo-amazon-intelligen/jggkabmggnkaobhjmhhcikipbhhnoapp"
                  target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,background:T.goldG,color:'#03030A',fontWeight:800,fontSize:13,padding:'16px',borderRadius:12,textDecoration:'none',letterSpacing:'0.06em',boxShadow:'0 4px 24px rgba(240,180,41,0.3)',marginBottom:16}}>
                  <Ico n="puzzle" size={18} c="#03030A"/>
                  INSTALAR EXTENSÃO NO CHROME
                </a>

                {/* Passos */}
                <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'20px 24px',boxShadow:'var(--elev1)'}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:14}}>Como ativar</div>
                  {[
                    'Clique em "Instalar Extensão no Chrome" acima',
                    'Abra qualquer produto na Amazon.com.br',
                    'Clique no ícone do Oráculo na barra do Chrome',
                    'Cole sua chave de licença e clique em Ativar',
                  ].map((s,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:i<3?10:0}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(240,180,41,0.1)',border:'1px solid rgba(240,180,41,0.25)',color:T.gold,fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
                      <span style={{fontSize:12,color:T.t3,lineHeight:1.6,paddingTop:2}}>{s}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* Meu Perfil */}
            {nav==='perfil'&&(()=>{
              const PLAN_DAYS: Record<string,number> = { monthly:30, biannual:180, annual:365 }
              const cycleDays  = PLAN_DAYS[user.plan]
              const cycleStart = expiresAt&&cycleDays ? new Date(expiresAt.getTime()-cycleDays*86400000) : null
              const cyclePct   = expiresAt&&cycleStart ? Math.min(100,Math.max(0,((Date.now()-cycleStart.getTime())/(cycleDays*86400000))*100)) : null
              const status = isLifetime ? 'Vitalício ∞'
                : (daysLeft!==null&&daysLeft<=0) ? 'Vencido'
                : (daysLeft!==null&&daysLeft<=10) ? `Vence em ${daysLeft} ${daysLeft===1?'dia':'dias'}`
                : 'Ativo'
              const statusColor = isLifetime ? T.g
                : (daysLeft!==null&&daysLeft<=0) ? T.r
                : (daysLeft!==null&&daysLeft<=10) ? T.a
                : T.g
              const plans = [
                { id:'monthly',  label:'Mensal',    price:'R$ 79,90', period:'/ 30 dias'  },
                { id:'biannual', label:'Semestral', price:'R$ 397',   period:'/ 180 dias' },
                { id:'annual',   label:'Anual',     price:'R$ 597',   period:'/ 365 dias', best:true },
              ]
              const cardStyle: React.CSSProperties = { background:T.card, border:`1px solid ${T.line}`, borderRadius:14, padding:'22px 24px', boxShadow:'var(--elev1)' }
              return(
                <div style={{maxWidth:620,margin:'0 auto',width:'100%',display:'flex',flexDirection:'column',gap:16}}>
                  <div style={{marginBottom:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                      <span style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const}}>Conta</span>
                      <span style={{color:T.t3,fontSize:9}}>/</span>
                      <span style={{fontSize:9,fontWeight:700,color:T.gold,letterSpacing:'0.14em',textTransform:'uppercase' as const}}>Meu Perfil</span>
                    </div>
                    <h1 style={{fontSize:21,fontWeight:800,color:T.t1,letterSpacing:'-0.03em',lineHeight:1}}>Meu Perfil</h1>
                  </div>

                  {/* Card identidade */}
                  <div style={cardStyle}>
                    <Lbl style={{marginBottom:16}}>Identidade</Lbl>
                    <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:18}}>
                      <button className="ora-avatar" onClick={()=>fileRef.current?.click()} title="Alterar foto" aria-label="Alterar foto de perfil"
                        style={{position:'relative',width:76,height:76,borderRadius:'50%',padding:0,cursor:'pointer',overflow:'hidden',flexShrink:0,
                          border:`2px solid ${avatar?T.lineG:tint(cfg.color,35)}`,background:avatar?'transparent':tint(cfg.color,12),
                          display:'flex',alignItems:'center',justifyContent:'center',
                          boxShadow:isFree?undefined:`0 0 18px ${cfg.glow}`}}>
                        {avatar
                          ?<img src={avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          :<span style={{fontSize:26,color:cfg.color,fontWeight:700}}>{displayName?.[0]?.toUpperCase()||'?'}</span>}
                        <span className={`cam${avatarBusy?' busy':''}`} style={{position:'absolute',inset:0,background:'rgba(3,3,10,0.55)',display:'flex',alignItems:'center',justifyContent:'center',transition:'opacity .15s'}}>
                          {avatarBusy
                            ?<svg className="ora-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 1-9 9" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                            :<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 8.5A2 2 0 0 1 6 6.5h2l1.2-1.8h5.6L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="12.5" r="3" stroke="#fff" strokeWidth="1.5"/></svg>}
                        </span>
                      </button>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.t1,letterSpacing:'-0.01em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{displayName}</div>
                        <div style={{fontSize:11,color:T.t3,marginTop:3}}>Toque na foto para alterar</div>
                      </div>
                    </div>
                    {/* Nome editável */}
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:8}}>Nome</div>
                      <div style={{display:'flex',gap:8}}>
                        <input value={nameInput} maxLength={60}
                          onChange={e=>{setNameInput(e.target.value);setNameMsg(null)}}
                          onKeyDown={e=>{if(e.key==='Enter')saveName()}}
                          placeholder="Seu nome"
                          style={{flex:1,minWidth:0,background:T.bg,border:`1px solid ${T.line}`,borderRadius:10,padding:'11px 14px',color:T.t1,fontSize:13,fontFamily:'inherit',outline:'none'}}/>
                        <button onClick={saveName} disabled={nameBusy||nameInput.trim()===displayName.trim()}
                          style={{flexShrink:0,background:nameBusy?T.line:T.goldG,border:'none',color:'#03030A',fontWeight:800,fontSize:11,padding:'0 20px',borderRadius:10,cursor:nameBusy?'default':'pointer',fontFamily:'inherit',letterSpacing:'0.06em',opacity:(nameBusy||nameInput.trim()===displayName.trim())?.6:1,transition:'all .2s'}}>
                          {nameBusy?'Salvando…':'Salvar'}
                        </button>
                      </div>
                      {nameMsg&&<div style={{fontSize:11.5,fontWeight:600,color:nameMsg.ok?T.g:T.r,marginTop:8}}>{nameMsg.text}</div>}
                    </div>
                    {/* E-mail somente leitura */}
                    <div>
                      <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:8}}>E-mail</div>
                      <div style={{background:T.bg,border:`1px dashed ${T.line}`,borderRadius:10,padding:'11px 14px',color:T.t3,fontSize:13,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{user.email}</span>
                        <span style={{fontSize:8,fontWeight:700,color:T.t3,letterSpacing:'0.08em',textTransform:'uppercase' as const,border:`1px solid ${T.line}`,borderRadius:5,padding:'2px 7px',flexShrink:0}}>somente leitura</span>
                      </div>
                    </div>
                  </div>

                  {/* Card plano */}
                  <div style={cardStyle}>
                    <Lbl style={{marginBottom:16}}>Meu Plano</Lbl>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap' as const}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:10,fontWeight:800,color:cfg.color,letterSpacing:'0.1em',textTransform:'uppercase' as const,background:tint(cfg.color,10),border:`1px solid ${tint(cfg.color,22)}`,borderRadius:99,padding:'5px 13px'}}>{cfg.label}</span>
                      <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:10.5,fontWeight:700,color:statusColor}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:statusColor}}/>
                        {status}
                      </span>
                    </div>
                    {isLifetime?(
                      <div style={{fontSize:12,color:T.t3,lineHeight:1.6}}>Seu acesso não expira. Aproveite o Oráculo para sempre.</div>
                    ):expiresAt?(
                      <>
                        {cyclePct!==null&&(
                          <div style={{marginBottom:10}}>
                            <div style={{height:6,background:T.bg,border:`1px solid ${T.line}`,borderRadius:99,overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${cyclePct}%`,background:cyclePct>=85?T.a:T.goldG,borderRadius:99,transition:'width .6s ease'}}/>
                            </div>
                            <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                              <span style={{fontSize:9.5,color:T.t3}}>{cycleStart?.toLocaleDateString('pt-BR')}</span>
                              <span className="ora-num" style={{fontSize:9.5,color:T.t4,fontWeight:600}}>{Math.round(cyclePct)}% do ciclo</span>
                              <span style={{fontSize:9.5,color:T.t3}}>{expiresAt.toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        )}
                        <div style={{fontSize:12,color:T.t4}}>
                          Válido até <strong className="ora-num" style={{color:T.t1}}>{expiresAt.toLocaleDateString('pt-BR')}</strong>
                          {daysLeft!==null&&daysLeft>0&&<> · <span className="ora-num" style={{color:statusColor,fontWeight:700}}>{daysLeft}</span> {daysLeft===1?'dia restante':'dias restantes'}</>}
                        </div>
                      </>
                    ):(
                      <div style={{fontSize:12,color:T.t3}}>Sem data de vencimento registrada.</div>
                    )}
                  </div>

                  {/* Card trocar de plano */}
                  <div style={cardStyle}>
                    <Lbl style={{marginBottom:16}}>Trocar de Plano</Lbl>
                    {isLifetime?(
                      <div style={{display:'flex',alignItems:'center',gap:12,background:tint(T.g,5),border:`1px solid ${tint(T.g,18)}`,borderRadius:12,padding:'16px 18px'}}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><circle cx="12" cy="12" r="9.5" stroke={T.g} strokeWidth="1.5"/><path d="M8 12.2l2.6 2.6L16 9.6" stroke={T.g} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:T.g,marginBottom:2}}>Você tem acesso vitalício</div>
                          <div style={{fontSize:11.5,color:T.t3,lineHeight:1.5}}>Nada a renovar, nada a pagar. O Oráculo é seu.</div>
                        </div>
                      </div>
                    ):(
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {plans.map(p=>{
                          const isCurrent = user.plan===p.id
                          return(
                            <div key={p.id} style={{position:'relative' as const,display:'flex',alignItems:'center',gap:14,borderRadius:12,padding:'14px 16px',
                              background:p.best?tint(T.gold,4):T.bg,
                              border:`1px solid ${p.best?tint(T.gold,28):T.line}`,
                              boxShadow:p.best?`0 0 22px ${tint(T.gold,7)}`:undefined}}>
                              {p.best&&(
                                <span style={{position:'absolute',top:-9,left:16,background:T.gold,color:'#02020A',fontSize:8,fontWeight:800,padding:'2px 9px',borderRadius:99,letterSpacing:'0.12em',whiteSpace:'nowrap' as const}}>MELHOR VALOR</span>
                              )}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:'flex',alignItems:'baseline',gap:6,flexWrap:'wrap' as const}}>
                                  <span style={{fontSize:13,fontWeight:800,color:p.best?T.gold:T.t1}}>{p.label}</span>
                                  <span className="ora-num" style={{fontSize:13,fontWeight:700,color:T.t1}}>{p.price}</span>
                                  <span style={{fontSize:10,color:T.t3}}>{p.period}</span>
                                </div>
                                {p.best&&(
                                  <div className="ora-num" style={{fontSize:10,color:T.gold,marginTop:3,fontWeight:600}}>
                                    economize R$ {ANNUAL_ECON_FMT}/ano ({ANNUAL_ECON_PCT}%) vs mensal
                                  </div>
                                )}
                              </div>
                              {isCurrent?(
                                <span style={{flexShrink:0,fontSize:9,fontWeight:800,color:T.t3,letterSpacing:'0.08em',textTransform:'uppercase' as const,border:`1px solid ${T.line}`,borderRadius:99,padding:'6px 12px'}}>Plano atual</span>
                              ):(
                                <a href={GREENN[p.id]} target="_blank" rel="noreferrer"
                                  style={{flexShrink:0,display:'block',textAlign:'center' as const,fontSize:10,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase' as const,textDecoration:'none',padding:'8px 16px',borderRadius:8,transition:'all .15s',
                                    background:p.best?T.goldG:'none',
                                    color:p.best?'#02020A':T.gold,
                                    border:p.best?'none':`1px solid ${tint(T.gold,25)}`,
                                    boxShadow:p.best?'0 3px 14px rgba(240,180,41,0.3)':undefined}}>
                                  {isCurrent?'Renovar':'Assinar'}
                                </a>
                              )}
                            </div>
                          )
                        })}
                        <div style={{fontSize:10,color:T.t3,textAlign:'center' as const,marginTop:2}}>Pagamento seguro via Greenn · ativação automática no mesmo e-mail</div>
                      </div>
                    )}
                  </div>

                  {/* Card segurança — movido da aba Extensão */}
                  <div style={cardStyle}>
                    <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:6,display:'flex',alignItems:'center',gap:7}}><Ico n="lock" size={13} c={T.t2}/> Segurança da Conta</div>
                    <div style={{fontSize:12,color:T.t3,lineHeight:1.6,marginBottom:16}}>Troque a senha gerada automaticamente por uma de sua preferência. Se houver outra sessão aberta, ela será encerrada.</div>
                    {([
                      {ph:'Senha atual',        val:pwCur,  set:setPwCur},
                      {ph:'Nova senha',         val:pwNew,  set:setPwNew},
                      {ph:'Confirmar nova senha',val:pwConf, set:setPwConf},
                    ] as const).map((f,i)=>(
                      <input key={i} type="password" placeholder={f.ph} value={f.val}
                        onChange={e=>{f.set(e.target.value);setPwMsg(null)}}
                        onKeyDown={e=>{if(e.key==='Enter')changePassword()}}
                        autoComplete={i===0?'current-password':'new-password'}
                        style={{width:'100%',boxSizing:'border-box' as const,background:T.bg,border:`1px solid ${T.line}`,borderRadius:10,padding:'12px 14px',marginBottom:10,color:T.t1,fontSize:13,fontFamily:'inherit',outline:'none'}}/>
                    ))}
                    {pwMsg&&(
                      <div style={{fontSize:12,fontWeight:600,color:pwMsg.ok?T.g:T.r,marginBottom:12,marginTop:2}}>{pwMsg.text}</div>
                    )}
                    <button onClick={changePassword} disabled={pwBusy}
                      style={{width:'100%',background:pwBusy?T.line:T.goldG,border:'none',color:'#03030A',fontWeight:800,fontSize:12,padding:'13px',borderRadius:10,cursor:pwBusy?'default':'pointer',fontFamily:'inherit',letterSpacing:'0.06em',opacity:pwBusy?.6:1,transition:'all .2s'}}>
                      {pwBusy?'Salvando…':'ALTERAR SENHA'}
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Agente IA Panel */}
            {nav==='agente'&&(
              <div style={{maxWidth:600,margin:'0 auto',paddingTop:40}}>
                {/* Header */}
                <div style={{textAlign:'center' as const,marginBottom:40}}>
                  <div style={{marginBottom:12,display:'flex',justifyContent:'center'}}><Ico n="robot" size={46} c={T.gold}/></div>
                  <h2 style={{fontSize:24,fontWeight:900,color:T.t1,letterSpacing:'-0.03em',marginBottom:8}}>Agente IA — Criador de Anúncios</h2>
                  <p style={{fontSize:13,color:T.t3,lineHeight:1.7,maxWidth:440,margin:'0 auto'}}>
                    Nosso agente especialista em Amazon Brasil cria o anúncio completo pelo ChatGPT — título SEO, bullets, descrição, keywords e até <strong style={{color:T.t1}}>6 imagens profissionais</strong> do seu produto.
                  </p>
                </div>

                {/* CTA principal */}
                <a
                  href="https://chatgpt.com/g/g-6a02736d422081918e58416c49426a3a-oraculo-ia-especialista-em-marketplace"
                  target="_blank"
                  rel="noreferrer"
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,background:'linear-gradient(135deg,#10A37F 0%,#0D8C6D 100%)',color:'#fff',fontWeight:800,fontSize:14,padding:'18px 24px',borderRadius:14,textDecoration:'none',letterSpacing:'0.04em',boxShadow:'0 4px 32px rgba(16,163,127,0.35)',marginBottom:12,transition:'transform .15s',cursor:'pointer'}}
                  onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" opacity="0.3"/>
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                    <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  ABRIR AGENTE NO CHATGPT
                </a>
                <div style={{textAlign:'center' as const,fontSize:11,color:T.t3,marginBottom:16}}>
                  Abre no ChatGPT — use sua conta existente, sem custos adicionais
                </div>

                {/* Assistente do Oráculo (IA que lê seus números + tira dúvidas) */}
                <button
                  onClick={()=>window.dispatchEvent(new Event('oraculo:abrir-assistente'))}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,width:'100%',background:T.card,color:T.t1,fontWeight:700,fontSize:13.5,padding:'14px 20px',borderRadius:14,border:`1px solid ${T.line}`,cursor:'pointer',marginBottom:8,fontFamily:'inherit'}}
                >
                  <span style={{width:24,height:24,borderRadius:999,background:T.gold,display:'grid',placeItems:'center',color:'#1a1200',fontWeight:800,fontSize:13}}>✦</span>
                  Falar com o Assistente do Oráculo
                </button>
                <div style={{textAlign:'center' as const,fontSize:11,color:T.t3,marginBottom:32}}>
                  Pergunte sobre faturamento, lucro, estoque e Ads — ou tire dúvidas do Oráculo
                </div>

                {/* O que o agente faz */}
                <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:16,padding:'24px',marginBottom:16}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:18}}>O que o agente entrega</div>
                  {[
                    { icon:'🔍', title:'Análise do Produto', desc:'Pesquisa o produto, identifica público, concorrência e ângulo de ataque antes de criar' },
                    { icon:'📝', title:'Anúncio Completo',   desc:'Título SEO (3 variações), 5 bullets, descrição e palavras-chave backend otimizados' },
                    { icon:'🖼️', title:'Pack de 6 Imagens',  desc:'Fundo branco, lifestyle ambientada e 4 imagens de benefícios — prontas para upload' },
                    { icon:'📊', title:'Estratégia',         desc:'Gatilhos usados, alertas de mercado e sugestões para teste A/B' },
                  ].map((item,i)=>(
                    <div key={i} style={{display:'flex',gap:14,marginBottom:i<3?16:0,alignItems:'flex-start'}}>
                      <div style={{width:38,height:38,borderRadius:10,background:'rgba(16,163,127,0.1)',border:'1px solid rgba(16,163,127,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:T.g}}><EmojiIco e={item.icon} size={18} c={T.g}/></div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.t1,marginBottom:3}}>{item.title}</div>
                        <div style={{fontSize:12,color:T.t3,lineHeight:1.6}}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Como usar */}
                <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:16,padding:'24px'}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:16}}>Como usar</div>
                  {[
                    'Clique em "Abrir Agente no ChatGPT" acima',
                    'Envie o nome do produto ou ASIN que deseja anunciar',
                    'Envie uma foto do produto quando solicitado',
                    'Aguarde — o agente entrega análise, copy e 6 imagens',
                  ].map((s,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:i<3?10:0}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(16,163,127,0.1)',border:'1px solid rgba(16,163,127,0.25)',color:'#10A37F',fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
                      <span style={{fontSize:12,color:T.t3,lineHeight:1.6,paddingTop:2}}>{s}</span>
                    </div>
                  ))}
                  <div style={{marginTop:16,padding:'12px 14px',background:'rgba(16,163,127,0.06)',border:'1px solid rgba(16,163,127,0.15)',borderRadius:10,fontSize:11,color:T.t3,lineHeight:1.6,display:'flex',gap:8,alignItems:'flex-start'}}>
                    <span style={{flexShrink:0,color:T.g,marginTop:1}}><Ico n="bulb" size={13} c={T.g}/></span>
                    <span><strong style={{color:T.t1}}>Dica:</strong> Você precisa de uma conta no ChatGPT (gratuita ou Plus). O agente usa seus próprios créditos do ChatGPT — sem cobranças extras do Oráculo.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Gestão (hub financeiro) — gated p/ allowlist enquanto SP-API em Draft */}
            {nav==='financeiro'&&gestaoEnabled&&(
              <div style={{padding:'0 4px'}}>
                <GestaoHub promoActive={promo.active} promoType={promo.type} theme={theme}/>
              </div>
            )}

            {/* Produtos Salvos — snapshot do garimpo */}
            {nav==='saved'&&(
              <>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,marginBottom:24}}>
                  <div style={{minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                      <span style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const}}>Mineração</span>
                      <span style={{color:T.t3,fontSize:9}}>/</span>
                      <span style={{fontSize:9,fontWeight:700,color:T.gold,letterSpacing:'0.14em',textTransform:'uppercase' as const}}>Salvos</span>
                    </div>
                    <h1 style={{fontSize:21,fontWeight:800,color:T.t1,letterSpacing:'-0.03em',marginBottom:6,lineHeight:1}}>Produtos Salvos</h1>
                    <p style={{fontSize:11,color:T.t3}}>
                      <span className="ora-num" style={{color:T.t4}}>{saved.length}</span> <span style={{color:T.t4}}>{saved.length===1?'produto salvo':'produtos salvos'}</span>
                      {' · '}BSR e vendas capturados no momento em que você salvou
                    </p>
                  </div>
                </div>
                {saved.length===0?(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',gap:6}}>
                    <div style={{width:64,height:64,borderRadius:16,background:T.goldSub,border:`1px solid ${tint(T.gold,18)}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M6.5 4.5h11a1 1 0 0 1 1 1V20l-6.5-3.8L5.5 20V5.5a1 1 0 0 1 1-1z" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{fontSize:15,fontWeight:700,color:T.t1}}>Nenhum produto salvo ainda</div>
                    <p style={{fontSize:12,color:T.t3,maxWidth:320,textAlign:'center' as const,lineHeight:1.6,marginBottom:14}}>
                      Toque no ícone de bookmark em qualquer card da mineração para guardar o produto aqui com o snapshot do momento.
                    </p>
                    <button onClick={()=>goNav('bestsellers')}
                      style={{background:T.goldG,color:'#02020A',fontWeight:700,fontSize:11,padding:'12px 26px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',textTransform:'uppercase' as const,boxShadow:'0 4px 20px rgba(240,180,41,0.25)'}}>
                      Garimpe em Mais Vendidos
                    </button>
                  </div>
                ):(
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
                    {saved.map((s,i)=>{
                      const sp = {...s, images: s.image?[s.image]:[]}
                      return(
                        <div key={s.asin} className="ora-card-in" style={{animationDelay:`${(i%12)*40}ms`}}>
                          <Card product={sp} onClick={()=>handleCardClick(sp,false)}
                            saved onToggleSave={()=>toggleSaved(sp)}/>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Page header + product content (hidden when competitor tab active) */}
            {nav!=='competitor'&&nav!=='extension'&&nav!=='agente'&&nav!=='financeiro'&&nav!=='saved'&&nav!=='perfil'&&<>
            <div className="ora-phead" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,marginBottom:24}}>
              <div style={{minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                  <span style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const}}>Mineração</span>
                  <span style={{color:T.t3,fontSize:9}}>/</span>
                  <span style={{fontSize:9,fontWeight:700,color:T.gold,letterSpacing:'0.14em',textTransform:'uppercase' as const}}>{curNav?.label}</span>
                </div>
                <h1 style={{fontSize:21,fontWeight:800,color:T.t1,letterSpacing:'-0.03em',marginBottom:6,lineHeight:1}}>{curNav?.label}</h1>
                <p style={{fontSize:11,color:T.t3}}>
                  {isCross?'Todas as categorias':curCat?.label}
                  {done&&<> · <span className="ora-num" style={{color:T.t4}}>{prods.length}</span> <span style={{color:T.t4}}>produtos{!isFree&&!poolExhausted?'+':''}</span></>}
                </p>
              </div>
              {/* Ações contextuais: Ordenar + CSV + Atualizar */}
              <div className="ora-ptools" style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                {done&&prods.length>0&&(
                  <select value={sortBy} aria-label="Ordenar produtos" title="Ordenar produtos"
                    onChange={e=>{sortBaseRef.current=prods.length;setSortBy(e.target.value as 'default'|'sales'|'score'|'bsr');setPage(1)}}
                    style={{background:T.card,border:`1px solid ${T.line}`,color:sortBy==='default'?T.t3:T.gold,fontWeight:600,fontSize:10,padding:'8px 10px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.04em',outline:'none',transition:'all .15s'}}>
                    <option value="default">Ordenar: Padrão</option>
                    <option value="sales">Ordenar: Mais vendidos</option>
                    <option value="score">Ordenar: Melhor score</option>
                    <option value="bsr">Ordenar: Menor BSR</option>
                  </select>
                )}
                {cfg.export&&done&&prods.length>0&&(
                  <button onClick={()=>exportCSV(prods,cat)}
                    style={{display:'flex',alignItems:'center',gap:6,background:'none',border:`1px solid ${T.line}`,color:T.t2,fontWeight:600,fontSize:10,padding:'8px 14px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',textTransform:'uppercase' as const,transition:'all .15s'}}
                    onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.lineG;el.style.color=T.gold}}
                    onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.line;el.style.color=T.t2}}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5.5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    CSV
                  </button>
                )}
                {/* Atualizar NÃO manda bust: a novidade vem do exclude + shuffle do serve;
                    o rebuild do pool (caro na SP-API) fica reservado p/ remaining<12 no load */}
                <button onClick={()=>load(nav,cat,'',false)} title="Limpa o garimpo atual e redistribui produtos novos"
                  style={{display:'flex',alignItems:'center',gap:7,background:'none',border:`1px solid ${T.line}`,color:T.t3,fontSize:10,fontWeight:600,padding:'8px 16px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.1em',textTransform:'uppercase' as const,transition:'all .15s'}}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.lineG;el.style.color=T.gold}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.line;el.style.color=T.t3}}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M9.5 2A5 5 0 1 0 10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9.5 2V5H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Atualizar
                </button>
              </div>
            </div>

            {/* Skeleton */}
            {loading&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i} i={i}/>)}</div>}

            {/* Grid */}
            {!loading&&done&&prods.length>0&&(
              <>
                <div ref={gridRef} style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,position:'relative' as const}}>
                  {shown.map((p,i)=>{
                    const isLocked = isFree && i >= cfg.limit
                    return(
                      <div key={p.asin} className="ora-card-in" style={{animationDelay:`${(i%12)*40}ms`}}>
                        <Card product={p} locked={isLocked} onClick={()=>handleCardClick(p,isLocked)}
                          saved={isSaved(p.asin)} onToggleSave={cfg.tabs.includes('saved')?()=>toggleSaved(p):undefined}/>
                      </div>
                    )
                  })}
                  {/* Upgrade overlay for free */}
                  {isFree&&(
                    <div style={{position:'absolute',bottom:0,left:0,right:0,height:'55%',background:'linear-gradient(to top,rgba(3,3,10,0.98) 30%,transparent)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',paddingBottom:24,pointerEvents:'none',zIndex:4}}>
                    </div>
                  )}
                </div>

                {/* Free upgrade CTA */}
                {isFree&&done&&(
                  <div style={{textAlign:'center' as const,padding:'28px 24px 8px',position:'relative' as const,zIndex:5}}>
                    <p style={{fontSize:13,color:T.t2,marginBottom:16}}>
                      <span style={{color:T.gold,fontWeight:600}}>{prods.length > cfg.limit ? (prods.length - cfg.limit) : 'mais'} produtos</span> estão bloqueados neste plano.
                    </p>
                    <button onClick={()=>setUpgrade(true)}
                      style={{background:T.goldG,color:'#02020A',fontWeight:700,fontSize:12,padding:'13px 32px',borderRadius:10,border:'none',cursor:'pointer',letterSpacing:'0.1em',textTransform:'uppercase' as const,boxShadow:'0 4px 24px rgba(240,180,41,0.35)',marginBottom:8}}>
                      Desbloquear todos os produtos
                    </button>
                    <div style={{fontSize:10,color:T.t3}}>A partir de R$ 79,90/mês · Cancele quando quiser</div>
                  </div>
                )}

                {/* Scroll infinito — sentinela + status. Sem "fim dos dados" seco:
                    quando o pool esgota, o feedMore rebusca girando keywords. */}
                {!isFree&&(
                  <>
                    <div ref={sentinelRef} aria-hidden style={{height:1}}/>
                    <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,minHeight:44,marginTop:24}}>
                      {moreLoading ? (
                        <><svg className="ora-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 1 1-9 9" stroke={T.gold} strokeWidth="2" strokeLinecap="round"/></svg>
                        <span style={{fontSize:11,color:T.t3}}>garimpando mais produtos…</span></>
                      ) : poolExhausted ? (
                        <span style={{fontSize:11,color:T.t3}}>Você já viu os melhores de {isCross?'todas as categorias':`“${curCat?.label}”`} por aqui. Toque em <button onClick={()=>load(nav,cat,'',true)} style={{background:'none',border:'none',color:T.gold,fontWeight:600,cursor:'pointer',fontFamily:'inherit',fontSize:11,padding:0}}>Atualizar</button> pra rodar novas buscas.</span>
                      ) : page*PAGE < sortedProds.length ? (
                        <button onClick={()=>setPage(p=>p+1)} style={{background:'none',border:`1px solid ${T.line}`,color:T.t2,fontSize:11,padding:'8px 18px',borderRadius:8,cursor:'pointer',fontFamily:'inherit'}}>Mostrar mais</button>
                      ) : null}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Search empty */}
            {!loading&&!done&&nav==='search'&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:340,gap:16}}>
                <div style={{width:64,height:64,borderRadius:16,background:'rgba(240,180,41,0.06)',border:`1px solid rgba(240,180,41,0.15)`,display:'flex',alignItems:'center',justifyContent:'center'}}><OracleMark size={32}/></div>
                <p style={{fontSize:13,color:T.t4,textAlign:'center' as const,maxWidth:260,lineHeight:1.6}}>Digite o nome de um produto ou ASIN na barra de busca acima.</p>
              </div>
            )}

            {/* Erro de carregamento — distinto do estado vazio */}
            {!loading&&done&&loadError&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px',gap:10}}>
                <div style={{fontSize:14,fontWeight:700,color:T.t1}}>Não foi possível carregar os produtos</div>
                <p style={{fontSize:12,color:T.t3,maxWidth:320,textAlign:'center' as const,lineHeight:1.6}}>Houve um problema de conexão com o servidor. Verifique sua internet e tente de novo.</p>
                <button onClick={()=>load(nav,cat,'',false)}
                  style={{marginTop:6,background:T.goldG,color:'#02020A',fontWeight:700,fontSize:11,padding:'11px 24px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',textTransform:'uppercase' as const}}>
                  Tentar novamente
                </button>
              </div>
            )}

            {/* No results */}
            {!loading&&done&&!loadError&&prods.length===0&&<div style={{textAlign:'center' as const,padding:'80px 24px',color:T.t3,fontSize:13}}>Nenhum produto encontrado. Tente outra busca ou categoria.</div>}
            </>}
          </main>
        </div>
      </div>
    </>
  )
}
