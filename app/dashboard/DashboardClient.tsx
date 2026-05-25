'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
const FinanceiroPanel = dynamic(()=>import('./FinanceiroPanel'),{ssr:false,loading:()=><div style={{padding:40,textAlign:'center',color:'#686890'}}>Carregando painel financeiro…</div>})

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:      '#03030A',
  sidebar: '#070710',
  card:    '#0B0B1A',
  cardHov: '#0F0F22',
  modal:   '#09091A',
  line:    'rgba(255,255,255,0.07)',
  lineG:   'rgba(240,180,41,0.22)',
  gold:    '#F0B429',
  goldG:   'linear-gradient(135deg,#F5C842 0%,#C48F10 100%)',
  goldSub: 'rgba(240,180,41,0.10)',
  g:       '#22C55E',
  a:       '#F59E0B',
  r:       '#EF4444',
  pur:     '#8B78FF',
  t1:      '#F2F2FC',
  t2:      '#A0A0C8',
  t3:      '#686890',
  t4:      '#C8C8E8',
}

/* ─── Plan config ────────────────────────────────────────────────────────── */
const PLAN_CFG: Record<string,{label:string;color:string;glow:string;limit:number;tabs:string[];modal:boolean;export:boolean}> = {
  free:     { label:'Gratuito', color:T.t3,  glow:'rgba(104,104,144,0.3)', limit:4,    tabs:['bestsellers','extension','agente','financeiro'],                                                      modal:false, export:false },
  monthly:  { label:'Mensal',   color:T.pur, glow:'rgba(139,120,255,0.3)', limit:9999, tabs:['bestsellers','new','trending','generics','competitor','extension','agente','financeiro'],     modal:true,  export:false },
  annual:   { label:'Anual',    color:T.gold,glow:'rgba(240,180,41,0.3)',  limit:9999, tabs:['bestsellers','new','trending','generics','competitor','extension','agente','financeiro'],     modal:true,  export:true  },
  lifetime: { label:'Vitalício',color:T.g,   glow:'rgba(34,197,94,0.3)',   limit:9999, tabs:['bestsellers','new','trending','generics','competitor','extension','agente','financeiro'],     modal:true,  export:true  },
}
// Hotmart checkout links por plano (atualize com seus links reais)
const HOTMART: Record<string,string> = {
  monthly:  'https://pay.hotmart.com/T105514334O?off=cffcrkey',
  annual:   'https://pay.hotmart.com/T105514334O?off=b92zaedd',
  lifetime: 'https://pay.hotmart.com/T105514334O?off=2yii0s4k',
}

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
  { id:'bestsellers', label:'Mais Vendidos'     },
  { id:'new',         label:'Recém Adicionados' },
  { id:'trending',    label:'Em Alta'           },
  { id:'generics',    label:'Genéricos'         },
  { id:'competitor',  label:'Análise Rival'     },
  { id:'extension',   label:'Extensão'          },
  { id:'agente',      label:'Agente IA'         },
  { id:'financeiro',  label:'Financeiro'        },
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
const dInfo =(s:number)=>s>=500?{l:'Muito Alta',c:T.g}:s>=250?{l:'Alta',c:T.g}:s>=120?{l:'Média',c:T.a}:s>=50?{l:'Baixa',c:T.a}:{l:'Muito Baixa',c:T.r}
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
  const rows = [
    ['ASIN','Título','Marca','Categoria','BSR','Vendas/mês Estimadas','Score'],
    ...products.map(p => [
      p.asin, `"${(p.title||'').replace(/"/g,'""')}"`, p.brand||'', p.category||'',
      p.bsr||0, p.salesEst||bsrSales(p.bsr||0), cardScore(p.bsr||0,p.salesEst||0,!p.brand),
    ])
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

/* ─── Watermark ──────────────────────────────────────────────────────────── */
function Watermark({email}:{email:string}){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='120'><text x='50%' y='55%' text-anchor='middle' dominant-baseline='middle' fill='rgba(240,180,41,0.045)' font-size='11' font-family='Inter,sans-serif' transform='rotate(-25,160,60)'>${email} · ORÁCULO</text></svg>`
  const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  return(
    <div style={{position:'fixed',inset:0,zIndex:3,pointerEvents:'none',userSelect:'none',backgroundImage:`url("${url}")`,backgroundRepeat:'repeat',backgroundSize:'320px 120px'}}/>
  )
}

/* ─── Logo mark ──────────────────────────────────────────────────────────── */
function OracleMark({size=22}:{size?:number}){
  return(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      style={{filter:'drop-shadow(0 0 8px rgba(240,180,41,0.65)) drop-shadow(0 0 2px rgba(240,180,41,0.9))'}}>
      <ellipse cx="16" cy="16" rx="13" ry="9" stroke="#F0B429" strokeWidth="1.6"/>
      <circle cx="16" cy="16" r="5.5" fill="#F0B429"/>
      <circle cx="16" cy="16" r="2.4" fill="#03030A"/>
      <circle cx="14.5" cy="14.2" r="1.1" fill="rgba(255,255,255,0.45)"/>
      <line x1="16" y1="7"  x2="16" y2="5"  stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
      <line x1="16" y1="25" x2="16" y2="27" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
      <line x1="3"  y1="16" x2="1"  y2="16" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
      <line x1="29" y1="16" x2="31" y2="16" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
    </svg>
  )
}

/* ─── Nav icons ──────────────────────────────────────────────────────────── */
function NavIcon({id,active}:{id:string,active:boolean}){
  const c = active ? T.gold : T.t2
  const icons:Record<string,React.ReactElement> = {
    bestsellers: <><path d="M6 20l4-7 4 5 3-4 3 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="8" r="1.5" fill={c}/></>,
    new:         <><rect x="6" y="6" width="8" height="8" rx="1.5" stroke={c} strokeWidth="1.5"/><path d="M14 12h6M14 16h4M14 20h6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    trending:    <><path d="M5 19l5-6 4 3 5-8" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 8h4v4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
    generics:    <><circle cx="16" cy="16" r="10" stroke={c} strokeWidth="1.5"/><path d="M13 13h6M13 16h6M13 19h4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    search:      <><circle cx="14" cy="14" r="7" stroke={c} strokeWidth="1.5"/><path d="M19.5 19.5L26 26" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    competitor: <><circle cx="16" cy="10" r="4" stroke={c} strokeWidth="1.5"/><circle cx="10" cy="20" r="3" stroke={c} strokeWidth="1.5"/><circle cx="22" cy="20" r="3" stroke={c} strokeWidth="1.5"/><path d="M13 13l-1.5 4M19 13l1.5 4" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></>,
    extension:  <><rect x="5" y="5" width="18" height="18" rx="3" stroke={c} strokeWidth="1.5"/><path d="M11 5v4a2 2 0 01-2 2H5M19 14h-2a2 2 0 00-2 2v2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    agente:     <><circle cx="14" cy="10" r="5" stroke={c} strokeWidth="1.5"/><path d="M10 15c-3 1.5-5 4-5 7h18c0-3-2-5.5-5-7" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><path d="M14 10v3M12 12h4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></>,
    financeiro: <><path d="M6 20V14M10 20V10M14 20V6M18 20V12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><path d="M6 8l4-3 4 4 4-5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>,
  }
  return(
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" style={{flexShrink:0}}>
      {icons[id]}
    </svg>
  )
}

/* ─── Score ring ─────────────────────────────────────────────────────────── */
function ScoreRing({score}:{score:number}){
  const c=sColor(score);const r=9;const circ=2*Math.PI*r
  return(
    <svg width="28" height="28" viewBox="0 0 28 28" style={{flexShrink:0}}>
      <circle cx="14" cy="14" r={r} fill="none" stroke={T.line} strokeWidth="2.5"/>
      <circle cx="14" cy="14" r={r} fill="none" stroke={c} strokeWidth="2.5"
        strokeDasharray={`${circ*(score/100)} ${circ}`} strokeDashoffset={circ*.25} strokeLinecap="round"/>
      <text x="14" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill={c} fontFamily="inherit">{score}</text>
    </svg>
  )
}

/* ─── Upgrade modal ──────────────────────────────────────────────────────── */
function UpgradeModal({onClose}:{onClose:()=>void}){
  const plans = [
    { id:'monthly',  label:'Mensal',   price:'R$ 47',  period:'/mês',  color:T.pur,  features:['20 produtos por busca','Todas as abas','Análise detalhada','Simulador de lucro'] },
    { id:'annual',   label:'Anual',    price:'R$ 297', period:'/ano',  color:T.gold, features:['60 produtos por busca','Todas as abas','Análise detalhada','Simulador de lucro','Exportar CSV','Acesso prioritário'], best:true },
    { id:'lifetime', label:'Vitalício',price:'R$ 497', period:'único', color:T.g,    features:['60 produtos por busca','Todas as abas','Análise detalhada','Simulador de lucro','Exportar CSV','Acesso vitalício','Todas as atualizações'] },
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
              background:plan.best?`${plan.color}08`:T.card,
              border:`1px solid ${plan.best?plan.color+'35':T.line}`,
              borderRadius:14,padding:'20px 18px',position:'relative' as const,
              boxShadow:plan.best?`0 0 30px ${plan.color}15`:undefined,
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
              <a href={HOTMART[plan.id]} target="_blank" rel="noreferrer"
                style={{display:'block',textAlign:'center' as const,background:plan.best?plan.color:'none',color:plan.best?'#02020A':plan.color,border:plan.best?'none':`1px solid ${plan.color}40`,fontWeight:700,fontSize:11,padding:'11px',borderRadius:9,letterSpacing:'0.08em',textDecoration:'none',textTransform:'uppercase' as const,transition:'all .15s'}}>
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
    ['📦','comissao','Comissão de Referência','Taxa % sobre venda zerada'],
    ['🚚','fba','Tarifa FBA','Frete + fulfillment zerado'],
    ['✨','ambas','Ambas','Comissão E FBA zeradas'],
  ]

  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:'fixed',inset:0,background:'rgba(1,1,8,0.92)',backdropFilter:'blur(14px)',zIndex:910,overflowY:'auto',padding:'32px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:460,background:T.modal,border:`1px solid ${T.lineG}`,borderRadius:20,overflow:'hidden',boxShadow:'0 40px 80px rgba(0,0,0,0.8)'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'22px 24px 18px',borderBottom:`1px solid ${T.line}`,background:`linear-gradient(180deg,rgba(240,180,41,0.06) 0%,transparent 100%)`}}>
          <div>
            <div style={{fontSize:18,marginBottom:4}}>🎁 Promoção Amazon Ativa?</div>
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
                    <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
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

  // Busca score real do listing via SP-API
  useEffect(()=>{
    if(!product.asin) return
    setLsLoading(true)
    fetch(`/api/listing-score?asin=${product.asin}`)
      .then(r=>r.json())
      .then(d=>{ if(d.score) setLsData(d) })
      .catch(()=>{})
      .finally(()=>setLsLoading(false))
  },[product.asin])

  const bsr=product.bsr||0
  const sales=product.salesEst||bsrSales(bsr)
  const dem=dInfo(sales)
  const ref=REF[catId]||.15
  const refFee=promo.active&&(promo.type==='comissao'||promo.type==='ambas') ? 0 : +(price*ref).toFixed(2)
  const fba=promo.active&&(promo.type==='fba'||promo.type==='ambas') ? 0 : (price<50?12:price<150?18:price<400?24:32)
  const fbaBase=price<50?12:price<150?18:price<400?24:32
  const profit=+(price-refFee-fba-cost).toFixed(2)
  const margin=price>0?+((profit/price)*100).toFixed(1):0
  const roi=cost>0?+((profit/cost)*100).toFixed(1):0
  const modalGeneric=!product.brand||product.brand.trim()===''
  const numImages = product.images?.length ?? 0
  const reviewCount = product.reviewCount ?? 0
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
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:`1px solid ${T.line}`}}>
          {[{v:bsr>0?`#${fmtN(bsr)}`:'—',l:'BSR Amazon',c:T.t1},{v:`~${fmtK(sales)}/mês`,l:'Vendas estimadas',c:dem.c},{v:dem.l,l:'Nível de Demanda',c:dem.c},{v:lsLoading?'…':`${score}/100`,l:lsData?'Score Real Listing':'Score Oráculo',c:sc}].map((k,i)=>(
            <div key={i} style={{padding:'18px 20px',borderRight:i<3?`1px solid ${T.line}`:'none',textAlign:'center' as const}}>
              <div style={{fontSize:20,fontWeight:700,color:k.c,letterSpacing:'-0.02em',marginBottom:4,lineHeight:1}}>{k.v}</div>
              <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Score breakdown — aparece quando os dados reais do listing chegam */}
        {lsData?.breakdown&&(
          <div style={{padding:'16px 28px',borderBottom:`1px solid ${T.line}`,background:`${T.card}80`}}>
            <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:12}}>Score do Listing — Critérios Reais</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
              {([
                {key:'demand',  icon:'📊', label:'Demanda'},
                {key:'images',  icon:'🖼️', label:'Imagens'},
                {key:'bullets', icon:'📝', label:'Bullets'},
                {key:'title',   icon:'🔤', label:'Título'},
                {key:'generic', icon:'🏷️', label:'Marca'},
              ] as const).map(({key,icon,label})=>{
                const d=lsData.breakdown[key]
                const pct=Math.round((d.score/d.max)*100)
                const c=pct>=80?T.g:pct>=50?T.a:T.r
                return(
                  <div key={key} style={{background:T.bg,borderRadius:10,padding:'10px 12px',border:`1px solid ${T.line}`}}>
                    <div style={{fontSize:14,marginBottom:4}}>{icon}</div>
                    <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.08em',marginBottom:6}}>{label}</div>
                    <div style={{fontSize:14,fontWeight:700,color:c,marginBottom:4}}>{d.score}<span style={{fontSize:9,color:T.t3,fontWeight:400}}>/{d.max}</span></div>
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
            <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:6}}>🕐 Idade do Anúncio</div>
            <div style={{fontSize:18,fontWeight:700,color:T.t1,letterSpacing:'-0.02em'}}>{asinToAge(product.asin||'')}</div>
            <div style={{fontSize:10,color:T.t3,marginTop:2}}>Estimado pelo prefixo ASIN</div>
          </div>
          <div style={{background:T.bg,border:`1px solid ${T.line}`,borderRadius:10,padding:'12px 16px'}}>
            <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:6}}>💰 Faturamento Anual Est.</div>
            <div style={{fontSize:18,fontWeight:700,color:T.gold,letterSpacing:'-0.02em'}}>R$ {fmtN(Math.round(sales*price*12))}</div>
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
                    <input type="number" min={0} value={f.v} onChange={e=>(f.s as any)(+e.target.value||0)} style={{background:'none',border:'none',color:T.gold,fontSize:22,fontWeight:700,width:'100%',outline:'none',fontFamily:'inherit'}}/>
                  </div>
                  {f.isPrice && product.price>0 && <div style={{fontSize:9,color:T.t3,marginTop:4}}>📌 Preço real da listagem</div>}
                </div>
              ))}
            </div>
            {promo.active&&(
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',marginBottom:8,background:'rgba(34,197,94,0.06)',border:`1px solid rgba(34,197,94,0.2)`,borderRadius:10,fontSize:11,color:T.g}}>
                <span>🎁</span>
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
                    {l:`Taxa Amazon (${(ref*100).toFixed(0)}%)`,v:refZeroed?`R$ 0,00 🎁`:`− R$ ${fmtR(+(price*ref).toFixed(2))}`,neg:true,zeroed:refZeroed,orig:refZeroed?`− R$ ${fmtR(+(price*ref).toFixed(2))}`:null},
                    {l:'Taxa FBA',v:fbaZeroed?`R$ 0,00 🎁`:`− R$ ${fmtR(fbaBase)}`,neg:true,zeroed:fbaZeroed,orig:fbaZeroed?`− R$ ${fmtR(fbaBase)}`:null},
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
                      <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',marginBottom:4}}>LUCRO LÍQUIDO</div>
                      <div style={{fontSize:22,fontWeight:700,color:luc>=0?sc.c:T.r,letterSpacing:'-0.02em'}}>R$ {fmtN(Math.abs(luc))}</div>
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
                      <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',background:T.bg,border:`1px solid ${hc}25`,borderLeft:`3px solid ${hc}`,borderRadius:10,padding:'11px 14px'}}>
                        <div style={{fontSize:17,lineHeight:1,flexShrink:0,marginTop:1}}>{r.icon}</div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                            <span style={{fontSize:12,fontWeight:600,color:T.t1}}>{r.title}</span>
                            <span style={{fontSize:9,fontWeight:700,color:hc,background:`${hc}15`,padding:'2px 7px',borderRadius:4,letterSpacing:'0.05em',flexShrink:0}}>{r.priority}</span>
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
          <div style={{background:`${verdict.c}08`,border:`1px solid ${verdict.c}18`,borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}>
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
function Chip({text,c}:{text:string;c:string}){return<span style={{background:`${c}18`,color:c,border:`1px solid ${c}28`,borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:600,letterSpacing:'0.03em'}}>{text}</span>}
function Lbl({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){return<div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,...style}}>{children}</div>}
function Chevron({open}:{open:boolean}){return<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transition:'transform .2s',transform:open?'rotate(180deg)':'none',color:T.t3,flexShrink:0}}><path d="M2 3.5L5 6.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}

/* ─── Product card ───────────────────────────────────────────────────────── */
function Card({product,onClick,locked}:{product:any;onClick:()=>void;locked?:boolean}){
  const [hov,setHov]=useState(false)
  const bsr=product.bsr||0
  const sales=product.salesEst||bsrSales(bsr)
  const isGeneric=!product.brand||product.brand.trim()===''||product.brand.toLowerCase()==='genérico'
  const score=cardScore(bsr,sales,isGeneric)
  const sc=sColor(score)
  const salesColor=sales>=1000?T.g:sales>=300?T.a:T.t4

  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?T.cardHov:T.card,border:`1px solid ${hov&&!locked?T.lineG:T.line}`,borderRadius:14,overflow:'hidden',cursor:'pointer',
        transition:'background .15s,border-color .15s,transform .15s,box-shadow .15s',
        transform:hov&&!locked?'translateY(-2px)':'none',
        boxShadow:hov&&!locked?'0 20px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(240,180,41,0.08)':'none',
        display:'flex',flexDirection:'column',position:'relative' as const,
        filter:locked?'blur(5px) brightness(0.5)':'none',
        userSelect:locked?'none':'auto',
      }}>
      {/* Score badge */}
      <div style={{position:'absolute',top:10,right:10,zIndex:2}}><ScoreRing score={score}/></div>
      {/* Generic badge */}
      {isGeneric&&!locked&&<div style={{position:'absolute',top:10,left:10,zIndex:2,background:'rgba(3,3,10,0.8)',backdropFilter:'blur(4px)',border:`1px solid ${T.pur}35`,borderRadius:4,padding:'2px 7px',fontSize:8,fontWeight:700,color:T.pur,letterSpacing:'0.1em'}}>GENÉRICO</div>}
      {/* Image */}
      <div style={{background:'#F8F8FC',height:162,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
        {product.images?.[0]?<img src={product.images[0]} alt="" style={{maxHeight:138,maxWidth:'88%',objectFit:'contain',transition:'transform .3s cubic-bezier(.34,1.56,.64,1)',transform:hov?'scale(1.08)':'scale(1)'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>:<div style={{width:44,height:44,background:'#e8e8f0',borderRadius:8}}/>}
      </div>
      <div style={{padding:'14px 14px 16px',flex:1,display:'flex',flexDirection:'column',gap:0}}>
        {sales>0&&bsr>0&&<div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:8}}><span style={{fontSize:22,fontWeight:700,color:salesColor,letterSpacing:'-0.03em',lineHeight:1}}>~{fmtK(sales)}</span><span style={{fontSize:10,color:T.t3,fontWeight:500}}>est./mês</span></div>}
        <p style={{fontSize:12,fontWeight:500,color:T.t1,lineHeight:1.58,flex:1,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden',marginBottom:10}}>{product.title}</p>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          {bsr>0&&<span style={{fontSize:10,color:T.t3}}>BSR <strong style={{color:T.t2,fontWeight:600}}>#{fmtN(bsr)}</strong></span>}
          {bsr>0&&product.brand&&<span style={{color:T.t3,fontSize:10}}>·</span>}
          {product.brand&&<span style={{fontSize:10,color:T.t3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,maxWidth:90}}>{product.brand}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`1px solid ${T.line}`,paddingTop:11}}>
          <span style={{fontSize:10,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,color:hov&&!locked?T.gold:T.t3,transition:'color .15s'}}>{locked?'Bloqueado':'Ver análise'}</span>
          <div style={{width:24,height:24,borderRadius:'50%',background:hov&&!locked?T.goldSub:'none',border:`1px solid ${hov&&!locked?T.lineG:T.line}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
            {locked?<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="4.5" width="6" height="5" rx="1" stroke={T.t3} strokeWidth="1.2"/><path d="M3.5 4.5V3a1.5 1.5 0 013 0v1.5" stroke={T.t3} strokeWidth="1.2" strokeLinecap="round"/></svg>
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
        <path d="M8 40 A32 32 0 0 1 72 40" fill="none" stroke={T.line} strokeWidth="7" strokeLinecap="round"/>
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
        {error&&<div style={{marginTop:10,fontSize:12,color:T.r,background:`${T.r}10`,border:`1px solid ${T.r}25`,borderRadius:7,padding:'8px 12px'}}>{error}</div>}
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

        const verdict = opp>=70?{l:'Excelente Oportunidade 🚀',c:T.g,s:'Poucos concorrentes e boa demanda — vale entrar neste mercado agora.'}
          :opp>=55?{l:'Boa Oportunidade ✅',c:T.g,s:'Mercado com potencial. Diferencie-se para conquistar espaço.'}
          :opp>=38?{l:'Oportunidade Moderada ⚠️',c:T.a,s:'Concorrência relevante. Estude bem os líderes antes de entrar.'}
          :{l:'Alta Barreira de Entrada 🚫',c:T.r,s:'Mercado saturado ou demanda baixa. Considere outro produto.'}

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
                  <span style={{background:`${T.t3}18`,color:T.t3,border:`1px solid ${T.t3}28`,borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:600}}>ASIN {data.asin}</span>
                  {p.brand&&<span style={{background:`${T.pur}18`,color:T.pur,border:`1px solid ${T.pur}28`,borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:600}}>{p.brand}</span>}
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
                  <div key={i} style={{background:`${T.gold}06`,border:`1px solid ${T.lineG}`,borderRadius:12,padding:'16px',textAlign:'center' as const}}>
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
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:54,fontSize:9,color:T.gold,textAlign:'right' as const,flexShrink:0,fontWeight:700}}>Analisado</div>
                  <div style={{flex:1,height:20,background:T.bg,borderRadius:4,overflow:'hidden',position:'relative' as const,border:`1px solid ${T.lineG}`}}>
                    <div style={{height:'100%',width:`${(p.salesEst/maxSales)*100}%`,background:T.gold,borderRadius:4,opacity:.9,transition:'width 1s ease',minWidth:p.salesEst>0?4:0}}/>
                    <span style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',fontSize:8,color:'#02020A',fontWeight:700}}>{fmtK(p.salesEst)}</span>
                  </div>
                </div>
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
            <div style={{background:`${verdict.c}08`,border:`1px solid ${verdict.c}20`,borderRadius:14,padding:'20px 24px',display:'flex',alignItems:'center',gap:20}}>
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
                <div style={{fontSize:11,color:T.t3}}>O Oráculo analisou o anúncio e criou um guia específico para você superar estes concorrentes 👇</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {(data.recommendations||[]).map((rec:any,i:number)=>{
                  const priorityColor = rec.priority==='alta'?T.r:rec.priority==='média'?T.a:T.g
                  return(
                    <div key={i} style={{background:T.bg,border:`1px solid ${T.line}`,borderRadius:12,overflow:'hidden'}}>
                      {/* Header */}
                      <div style={{display:'flex',gap:12,alignItems:'center',padding:'14px 16px',borderBottom:`1px solid ${T.line}`}}>
                        <div style={{fontSize:20,flexShrink:0}}>{rec.icon||'•'}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:600,color:T.t1,lineHeight:1.4}}>{rec.title}</div>
                        </div>
                        <div style={{background:`${priorityColor}15`,border:`1px solid ${priorityColor}30`,borderRadius:99,padding:'2px 10px',fontSize:8,fontWeight:700,color:priorityColor,letterSpacing:'0.1em',textTransform:'uppercase' as const,flexShrink:0}}>
                          {rec.priority}
                        </div>
                      </div>
                      {/* Detail */}
                      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                        <p style={{fontSize:12,color:T.t4,lineHeight:1.7,margin:0}}>{rec.detail}</p>
                        <div style={{display:'flex',gap:8,alignItems:'flex-start',background:`${T.gold}06`,border:`1px solid ${T.lineG}`,borderRadius:8,padding:'8px 12px'}}>
                          <span style={{fontSize:11,flexShrink:0}}>💡</span>
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
          <div style={{fontSize:48,marginBottom:16,opacity:.4}}>🔍</div>
          <div style={{fontSize:14,fontWeight:600,color:T.t2,marginBottom:8}}>Cole um ASIN acima para começar</div>
          <div style={{fontSize:12,color:T.t3}}>O Oráculo vai analisar todos os concorrentes e te dizer se vale a pena entrar neste mercado.</div>
        </div>
      )}
    </div>
  )
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function DashboardClient({user}:{user:any}){
  const router = useRouter()
  const [nav,      setNav]      = useState('bestsellers')
  const [cat,      setCat]      = useState('all')
  const [prods,    setProds]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [sideOpen, setSideOpen] = useState(true)
  const [catOpen,  setCatOpen]  = useState(false)
  const [detail,     setDetail]     = useState<any>(null)
  const [upgrade,    setUpgrade]    = useState(false)
  const [promo,      setPromo]      = useState<PromoState>({active:false,type:null})
  const [promoOpen,  setPromoOpen]  = useState(false)
  const [page,       setPage]       = useState(1)
  const [licKey,     setLicKey]     = useState<string|null>(null)
  const [licPlan,    setLicPlan]    = useState<string|null>(null)
  const [licLoading, setLicLoading] = useState(false)
  const [keyCopied,  setKeyCopied]  = useState(false)
  const PAGE = 50

  const cfg = PLAN_CFG[user.plan] ?? PLAN_CFG.free
  const isFree = user.plan === 'free'

  // Aviso de plano próximo de expirar
  const expiresAt = user.expiresAt ? new Date(user.expiresAt) : null
  const daysLeft  = expiresAt ? Math.ceil((expiresAt.getTime()-Date.now())/(1000*60*60*24)) : null
  const expiringSoon = daysLeft !== null && daysLeft <= 7 && user.plan !== 'lifetime'

  async function load(n=nav, c=cat, query='', bust=false){
    setLoading(true); setDone(false); setPage(1)
    try{
      const params = new URLSearchParams({type:n,category:c,q:query})
      if(bust) params.set('bust','1')
      const r = await fetch(`/api/products?${params}`)
      const d = await r.json()
      setProds(d.products||[])
    }catch{ setProds([]) }
    setLoading(false); setDone(true)
  }

  // Carregamento inicial usa cache se disponível → não sobrecarrega a API
  useEffect(()=>{ load('bestsellers','all','',false) },[]) // eslint-disable-line

  function goNav(id:string){
    if(!cfg.tabs.includes(id)){setUpgrade(true);return}
    setNav(id); setPage(1)
    if(id==='competitor'){setProds([]);setDone(false);return}
    if(id==='extension'){
      setProds([]);setDone(false)
      if(!licKey){
        setLicLoading(true)
        fetch('/api/my-license').then(r=>r.json()).then(d=>{
          if(d.key){setLicKey(d.key);setLicPlan(d.plan)}
        }).finally(()=>setLicLoading(false))
      }
      return
    }
    // troca de aba usa cache → rápido; "Atualizar" força bust
    load(id,cat,'',false)
  }

  function handleCardClick(p:any, isLocked:boolean){
    if(isLocked||!cfg.modal){setUpgrade(true);return}
    setDetail(p)
  }

  const curNav  = NAV.find(n=>n.id===nav)
  const curCat  = CATS.find(c=>c.id===cat)
  const isCross = cat === 'all'
  const totalP  = Math.ceil(prods.length/PAGE)
  const paged   = prods.slice((page-1)*PAGE,page*PAGE)

  return(
    <>
      {upgrade&&<UpgradeModal onClose={()=>setUpgrade(false)}/>}
      {detail&&<DetailModal product={detail} onClose={()=>setDetail(null)} promo={promo}/>}
      {promoOpen&&<PromoModal promo={promo} setPromo={setPromo} onClose={()=>setPromoOpen(false)}/>}
      <Watermark email={user.email}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        body,input,button{font-family:'Inter',system-ui,sans-serif}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.t3};border-radius:2px}
        input[type=number]::-webkit-inner-spin-button{opacity:.2}
        input::placeholder{color:${T.t3}}
        @keyframes pulse{0%,100%{opacity:.7}50%{opacity:.35}}
        @keyframes glow{0%,100%{opacity:.7}50%{opacity:1}}
      `}</style>

      <div style={{display:'flex',height:'100vh',background:T.bg,color:T.t1,overflow:'hidden'}}>

        {/* SIDEBAR */}
        <aside style={{width:sideOpen?240:64,background:T.sidebar,borderRight:`1px solid ${T.line}`,display:'flex',flexDirection:'column',transition:'width .22s cubic-bezier(.4,0,.2,1)',overflow:'hidden',flexShrink:0,zIndex:20}}>

          {/* Logo */}
          <div style={{padding:'0 12px',height:60,borderBottom:`1px solid ${T.line}`,display:'flex',alignItems:'center',gap:12,flexShrink:0,cursor:'pointer'}} onClick={()=>setSideOpen(!sideOpen)}>
            <div style={{width:40,height:40,borderRadius:10,background:'rgba(240,180,41,0.06)',border:`1px solid rgba(240,180,41,0.15)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <OracleMark size={22}/>
            </div>
            {sideOpen&&<div style={{overflow:'hidden',minWidth:0}}>
              <div style={{fontSize:13,fontWeight:800,letterSpacing:'0.2em',color:T.gold,lineHeight:1,whiteSpace:'nowrap' as const}}>ORÁCULO</div>
              <div style={{fontSize:8,color:T.t3,letterSpacing:'0.18em',marginTop:3,fontWeight:500,whiteSpace:'nowrap' as const}}>AMAZON INTELLIGENCE</div>
            </div>}
          </div>

          {/* Nav */}
          <nav style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'8px',display:'flex',flexDirection:'column',gap:2}}>
            {sideOpen&&<Lbl style={{padding:'12px 8px 6px',marginBottom:2}}>Navegação</Lbl>}

            {NAV.map(n=>{
              const active  = nav===n.id
              const locked  = !cfg.tabs.includes(n.id)
              return(
                <button key={n.id} onClick={()=>goNav(n.id)} title={!sideOpen?n.label:undefined}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:sideOpen?'8px 10px':'10px',justifyContent:sideOpen?'flex-start':'center',borderRadius:8,border:'none',cursor:'pointer',
                    background:active?`${T.gold}12`:'none',
                    borderLeft:sideOpen?(active?`2px solid ${T.gold}`:'2px solid transparent'):'none',
                    paddingLeft:sideOpen?(active?'8px':'10px'):undefined,
                    fontFamily:'inherit',textAlign:'left' as const,outline:'none',transition:'all .12s',opacity:locked?.5:1}}>
                  <NavIcon id={n.id} active={active}/>
                  {sideOpen&&<>
                    <span style={{fontSize:12,fontWeight:active?600:400,color:active?T.t1:T.t2,whiteSpace:'nowrap' as const,flex:1,letterSpacing:'-0.01em'}}>{n.label}</span>
                    {locked&&<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1.5" y="5" width="8" height="5.5" rx="1.5" stroke={T.t3} strokeWidth="1.2"/><path d="M3.5 5V3.5a2 2 0 014 0V5" stroke={T.t3} strokeWidth="1.2" strokeLinecap="round"/></svg>}
                  </>}
                </button>
              )
            })}

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
                        setCat(c.id); setPage(1)
                        const target=nav==='search'?'bestsellers':nav
                        if(nav==='search') setNav('bestsellers')
                        load(target,c.id,'',false)
                      }} style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'6px 10px 6px 20px',borderRadius:7,border:'none',cursor:'pointer',marginBottom:1,background:active?`${T.gold}08`:'none',fontFamily:'inherit',textAlign:'left' as const}}>
                        <div style={{width:4,height:4,borderRadius:'50%',background:active?T.gold:T.t3,flexShrink:0}}/>
                        <span style={{fontSize:11,color:active?T.gold:T.t4,fontWeight:active?600:400,letterSpacing:'-0.01em'}}>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </nav>

          {/* User */}
          <div style={{padding:'10px 12px',borderTop:`1px solid ${T.line}`,flexShrink:0}}>
            {sideOpen?(
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:`${cfg.color}20`,border:`1px solid ${cfg.color}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:cfg.color,fontWeight:700,flexShrink:0,boxShadow:isFree?undefined:`0 0 8px ${cfg.glow}`,animation:isFree?undefined:'glow 3s ease-in-out infinite'}}>
                  {user.name?.[0]?.toUpperCase()||'?'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,letterSpacing:'-0.01em'}}>{user.name}</div>
                  <div style={{fontSize:8,fontWeight:700,color:cfg.color,letterSpacing:'0.12em',textTransform:'uppercase' as const,marginTop:1}}>{cfg.label}</div>
                </div>
                {isFree?<button onClick={()=>setUpgrade(true)} style={{background:T.goldG,border:'none',cursor:'pointer',color:'#02020A',fontSize:8,fontFamily:'inherit',padding:'4px 8px',borderRadius:5,letterSpacing:'0.06em',fontWeight:800,textTransform:'uppercase' as const,whiteSpace:'nowrap' as const}}>Upgrade</button>
                :<button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/login')}} style={{background:'none',border:`1px solid ${T.line}`,cursor:'pointer',color:T.t3,fontSize:9,fontFamily:'inherit',padding:'4px 8px',borderRadius:5,letterSpacing:'0.06em',fontWeight:600,textTransform:'uppercase' as const}}>Sair</button>}
              </div>
            ):(
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:`${cfg.color}18`,border:`1px solid ${cfg.color}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:cfg.color,fontWeight:700}}>
                  {user.name?.[0]?.toUpperCase()||'?'}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

          {/* Expiry warning banner */}
          {expiringSoon&&(
            <div style={{background:`${T.a}15`,borderBottom:`1px solid ${T.a}30`,padding:'8px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <span style={{fontSize:11,color:T.a}}>Seu plano <strong>{cfg.label}</strong> expira em <strong>{daysLeft} dias</strong>. Renove para não perder o acesso.</span>
              <a href={HOTMART[user.plan]} target="_blank" rel="noreferrer" style={{fontSize:10,fontWeight:700,color:'#02020A',background:T.a,padding:'4px 12px',borderRadius:5,textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase' as const,flexShrink:0}}>Renovar</a>
            </div>
          )}

          {/* Free plan banner */}
          {isFree&&(
            <div style={{background:`${T.gold}10`,borderBottom:`1px solid ${T.gold}20`,padding:'8px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{fontSize:11,color:T.gold}}>Plano Gratuito — <span style={{color:T.t2}}>Você está vendo apenas {cfg.limit} produtos. Faça upgrade para desbloquear tudo.</span></div>
              <button onClick={()=>setUpgrade(true)} style={{background:T.goldG,border:'none',cursor:'pointer',color:'#02020A',fontSize:10,fontFamily:'inherit',padding:'5px 14px',borderRadius:6,letterSpacing:'0.06em',fontWeight:800,textTransform:'uppercase' as const,flexShrink:0,marginLeft:16}}>Ver Planos</button>
            </div>
          )}

          {/* Topbar */}
          <header style={{height:60,background:T.sidebar,borderBottom:`1px solid ${T.line}`,display:'flex',alignItems:'center',gap:12,padding:'0 24px',flexShrink:0}}>
            {/* Export CSV — only annual/lifetime */}
            {cfg.export&&done&&prods.length>0&&(
              <button onClick={()=>exportCSV(prods,cat)}
                style={{background:'none',border:`1px solid ${T.line}`,color:T.t2,fontWeight:600,fontSize:10,padding:'8px 14px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',textTransform:'uppercase' as const,display:'flex',alignItems:'center',gap:6,flexShrink:0,transition:'all .15s'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.lineG;el.style.color=T.gold}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.line;el.style.color=T.t2}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5.5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                CSV
              </button>
            )}
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:T.g,boxShadow:`0 0 6px ${T.g}`}}/>
              <span style={{fontSize:10,color:T.t3,fontWeight:500}}>Amazon BR</span>
            </div>
          </header>

          {/* Promo banner */}
          {promo.active?(
            <div style={{background:'rgba(34,197,94,0.07)',borderBottom:'1px solid rgba(34,197,94,0.2)',padding:'7px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
              <span style={{fontSize:12}}>🎁</span>
              <span style={{fontSize:11,color:T.g,flex:1}}>
                <strong>Promoção ativa:</strong> {promo.type==='comissao'?'Isenção de Comissão de Referência':promo.type==='fba'?'Isenção de Tarifa FBA':'Isenção de Comissão + FBA'} — todos os cálculos foram ajustados
              </span>
              <button onClick={()=>setPromoOpen(true)} style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',color:T.g,fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:6,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.04em'}}>Editar</button>
              <button onClick={()=>setPromo({active:false,type:null})} style={{background:'transparent',border:`1px solid rgba(34,197,94,0.15)`,color:T.t3,fontSize:10,fontWeight:600,padding:'4px 10px',borderRadius:6,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.04em'}}>Desativar</button>
            </div>
          ):(
            <div style={{borderBottom:`1px solid ${T.line}`,padding:'6px 24px',display:'flex',alignItems:'center',flexShrink:0}}>
              <button onClick={()=>setPromoOpen(true)} style={{background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6,padding:'2px 0'}}>
                <span style={{fontSize:11}}>💡</span>
                <span style={{fontSize:11,color:T.t3}}>Amazon com promoção de isenção? <span style={{color:T.gold}}>Ative aqui →</span></span>
              </button>
            </div>
          )}

          {/* Content */}
          <main style={{flex:1,overflowY:'auto',padding:nav==='competitor'?'0':'28px 28px 40px',position:'relative' as const,display:'flex',flexDirection:'column'}}>

            {/* Competitor Panel */}
            {nav==='competitor'&&(
              <CompetitorPanel user={user} isFree={isFree} onUpgrade={()=>setUpgrade(true)}/>
            )}

            {/* Extension Panel */}
            {nav==='extension'&&(
              <div style={{maxWidth:560,margin:'0 auto',paddingTop:40}}>
                <div style={{textAlign:'center' as const,marginBottom:36}}>
                  <div style={{fontSize:40,marginBottom:12}}>🧩</div>
                  <h2 style={{fontSize:22,fontWeight:800,color:T.t1,letterSpacing:'-0.03em',marginBottom:8}}>Extensão Chrome</h2>
                  <p style={{fontSize:13,color:T.t3,lineHeight:1.6}}>Analise qualquer produto Amazon diretamente na página com nossa extensão. Instale e ative com sua chave de licença.</p>
                </div>

                {/* Chave de licença */}
                <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'24px',marginBottom:16}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:12}}>🔑 Sua Chave de Licença</div>
                  {licLoading?(
                    <div style={{height:48,background:T.bg,borderRadius:10,animation:'pulse 1.5s infinite'}}/>
                  ):licKey?(
                    <>
                      <div style={{background:T.bg,border:`1px solid ${T.lineG}`,borderRadius:10,padding:'14px 18px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                        <span style={{fontFamily:'monospace',fontSize:16,fontWeight:800,color:T.gold,letterSpacing:'0.06em',wordBreak:'break-all' as const}}>{licKey}</span>
                        <button onClick={()=>{navigator.clipboard.writeText(licKey);setKeyCopied(true);setTimeout(()=>setKeyCopied(false),2000)}}
                          style={{flexShrink:0,background:keyCopied?T.g:T.goldG,border:'none',color:'#03030A',fontWeight:700,fontSize:10,padding:'8px 14px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',transition:'all .2s',whiteSpace:'nowrap' as const}}>
                          {keyCopied?'✓ Copiado!':'Copiar'}
                        </button>
                      </div>
                      <div style={{fontSize:11,color:T.t3}}>
                        Plano: <span style={{color:T.gold,fontWeight:600}}>{PLAN_CFG[licPlan]?.label ?? licPlan}</span>
                        {' · '}Funciona em até <span style={{color:T.t4,fontWeight:600}}>2 dispositivos</span>
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
                  <span style={{fontSize:18}}>🧩</span>
                  INSTALAR EXTENSÃO NO CHROME
                </a>

                {/* Passos */}
                <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'20px 24px'}}>
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

            {/* Agente IA Panel */}
            {nav==='agente'&&(
              <div style={{maxWidth:600,margin:'0 auto',paddingTop:40}}>
                {/* Header */}
                <div style={{textAlign:'center' as const,marginBottom:40}}>
                  <div style={{fontSize:48,marginBottom:12}}>🤖</div>
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
                <div style={{textAlign:'center' as const,fontSize:11,color:T.t3,marginBottom:32}}>
                  Abre no ChatGPT — use sua conta existente, sem custos adicionais
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
                      <div style={{width:38,height:38,borderRadius:10,background:'rgba(16,163,127,0.1)',border:'1px solid rgba(16,163,127,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{item.icon}</div>
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
                  <div style={{marginTop:16,padding:'12px 14px',background:'rgba(16,163,127,0.06)',border:'1px solid rgba(16,163,127,0.15)',borderRadius:10,fontSize:11,color:T.t3,lineHeight:1.6}}>
                    💡 <strong style={{color:T.t1}}>Dica:</strong> Você precisa de uma conta no ChatGPT (gratuita ou Plus). O agente usa seus próprios créditos do ChatGPT — sem cobranças extras do Oráculo.
                  </div>
                </div>
              </div>
            )}

            {/* Financeiro Panel */}
            {nav==='financeiro'&&(
              <div style={{padding:'0 4px'}}>
                <FinanceiroPanel promoActive={promo.active} promoType={promo.type}/>
              </div>
            )}

            {/* Page header + product content (hidden when competitor tab active) */}
            {nav!=='competitor'&&nav!=='extension'&&nav!=='agente'&&nav!=='financeiro'&&<>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                  <span style={{fontSize:10,color:T.t3,letterSpacing:'0.04em'}}>Mineração</span>
                  <span style={{color:T.t3,fontSize:10}}>/</span>
                  <span style={{fontSize:10,color:T.t4}}>{curNav?.label}</span>
                </div>
                <h1 style={{fontSize:18,fontWeight:700,color:T.t1,letterSpacing:'-0.03em',marginBottom:4,lineHeight:1}}>{curNav?.label}</h1>
                <p style={{fontSize:11,color:T.t3}}>
                  {isCross?'Todas as categorias':curCat?.label}
                  {done&&<> · <span style={{color:T.t4}}>{prods.length} produtos</span></>}
                  {done&&totalP>1&&<> · pág. <span style={{color:T.t4}}>{page}/{totalP}</span></>}
                </p>
              </div>
              <button onClick={()=>load(nav,cat,'',true)}
                style={{display:'flex',alignItems:'center',gap:7,background:'none',border:`1px solid ${T.line}`,color:T.t3,fontSize:10,fontWeight:600,padding:'8px 16px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.1em',textTransform:'uppercase' as const,transition:'all .15s'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.lineG;el.style.color=T.gold}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.line;el.style.color=T.t3}}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M9.5 2A5 5 0 1 0 10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9.5 2V5H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Atualizar
              </button>
            </div>

            {/* Skeleton */}
            {loading&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>{Array.from({length:12}).map((_,i)=><SkeletonCard key={i} i={i}/>)}</div>}

            {/* Grid */}
            {!loading&&done&&prods.length>0&&(
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,position:'relative' as const}}>
                  {paged.map((p,i)=>{
                    const isLocked = isFree && i >= cfg.limit
                    return<Card key={p.asin} product={p} locked={isLocked} onClick={()=>handleCardClick(p,isLocked)}/>
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
                    <div style={{fontSize:10,color:T.t3}}>A partir de R$ 47/mês · Cancele quando quiser</div>
                  </div>
                )}

                {/* Pagination */}
                {!isFree&&totalP>1&&(()=>{
                  // Constrói lista de páginas com elipses: 1 … p-1 p p+1 … N
                  const nums: (number|'…')[] = []
                  if (totalP <= 9) {
                    for (let i=1;i<=totalP;i++) nums.push(i)
                  } else {
                    nums.push(1)
                    if (page > 3) nums.push('…')
                    for (let i=Math.max(2,page-1);i<=Math.min(totalP-1,page+1);i++) nums.push(i)
                    if (page < totalP-2) nums.push('…')
                    nums.push(totalP)
                  }
                  type Btn={l:string;fn:()=>void;dis:boolean;act:boolean}
                  const btns:Btn[]=[
                    {l:'←',fn:()=>setPage(p=>Math.max(1,p-1)),dis:page===1,act:false},
                    ...nums.map(n=>n==='…'
                      ?{l:'…',fn:()=>{},dis:true,act:false}
                      :{l:String(n),fn:()=>setPage(n as number),dis:false,act:page===n}
                    ),
                    {l:'→',fn:()=>setPage(p=>Math.min(totalP,p+1)),dis:page===totalP,act:false},
                  ]
                  return(
                    <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:4,marginTop:32}}>
                      {btns.map((b,i)=>(
                        <button key={i} onClick={()=>{if(!b.dis){b.fn();window.scrollTo(0,0)}}}
                          style={{background:b.act?`${T.gold}14`:'none',border:`1px solid ${b.act?'rgba(240,180,41,0.3)':T.line}`,color:b.act?T.gold:b.dis?T.t3:T.t2,fontWeight:b.act?700:400,fontSize:12,width:34,height:34,borderRadius:7,cursor:b.dis?'default':'pointer',fontFamily:'inherit',transition:'all .12s'}}>
                          {b.l}
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </>
            )}

            {/* Search empty */}
            {!loading&&!done&&nav==='search'&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:340,gap:16}}>
                <div style={{width:64,height:64,borderRadius:16,background:'rgba(240,180,41,0.06)',border:`1px solid rgba(240,180,41,0.15)`,display:'flex',alignItems:'center',justifyContent:'center'}}><OracleMark size={32}/></div>
                <p style={{fontSize:13,color:T.t4,textAlign:'center' as const,maxWidth:260,lineHeight:1.6}}>Digite o nome de um produto ou ASIN na barra de busca acima.</p>
              </div>
            )}

            {/* No results */}
            {!loading&&done&&prods.length===0&&<div style={{textAlign:'center' as const,padding:'80px 24px',color:T.t3,fontSize:13}}>Nenhum produto encontrado. Tente outra busca ou categoria.</div>}
            </>}
          </main>
        </div>
      </div>
    </>
  )
}
