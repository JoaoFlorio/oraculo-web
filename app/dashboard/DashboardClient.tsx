'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
const PLAN_CFG: Record<string,{label:string;color:string;glow:string;limit:number;tabs:string[];modal:boolean;export:boolean;search:boolean}> = {
  free:     { label:'Gratuito', color:T.t3,  glow:'rgba(104,104,144,0.3)', limit:4,  tabs:['bestsellers'],                                     modal:false, export:false, search:false },
  monthly:  { label:'Mensal',   color:T.pur, glow:'rgba(139,120,255,0.3)', limit:9999, tabs:['bestsellers','new','trending','generics','search'],   modal:true,  export:false, search:true  },
  annual:   { label:'Anual',    color:T.gold,glow:'rgba(240,180,41,0.3)',  limit:9999, tabs:['bestsellers','new','trending','generics','search'],   modal:true,  export:true,  search:true  },
  lifetime: { label:'Vitalício',color:T.g,   glow:'rgba(34,197,94,0.3)',   limit:9999, tabs:['bestsellers','new','trending','generics','search'],   modal:true,  export:true,  search:true  },
}
// Hotmart checkout links por plano (atualize com seus links reais)
const HOTMART: Record<string,string> = {
  monthly:  'https://pay.hotmart.com/T105514334O?off=cffcrkey',
  annual:   'https://pay.hotmart.com/T105514334O?off=b92zaedd',
  lifetime: 'https://pay.hotmart.com/T105514334O?off=2yii0s4k',
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const CATS = [
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
  { id:'search',      label:'Buscar Produto'    },
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
const bsrSales=(b:number)=>{if(!b)return 0;if(b<=100)return 5000;if(b<=500)return 2000;if(b<=1000)return 1200;if(b<=3000)return 600;if(b<=5000)return 400;if(b<=10000)return 180;if(b<=30000)return 80;if(b<=50000)return 40;if(b<=100000)return 20;return 8}
const fmtK =(n:number)=>n>=1000?`${(n/1000).toFixed(1).replace('.0','')}k`:`${n}`
const fmtN =(n:number)=>Math.round(n).toLocaleString('pt-BR')
const fmtR =(n:number)=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const sColor=(s:number)=>s>=70?T.g:s>=50?T.a:T.r
const dInfo =(s:number)=>s>=2000?{l:'Muito Alta',c:T.g}:s>=800?{l:'Alta',c:T.g}:s>=300?{l:'Média',c:T.a}:s>=100?{l:'Baixa',c:T.a}:{l:'Muito Baixa',c:T.r}
function oScore(bsr:number,m:number){const b=bsr<500?40:bsr<2000?30:bsr<10000?20:bsr<50000?10:5;const mg=m>=35?40:m>=25?32:m>=15?22:m>=5?12:4;return Math.min(100,b+mg+20)}

/* ─── CSV export ─────────────────────────────────────────────────────────── */
function exportCSV(products: any[], category: string) {
  const rows = [
    ['ASIN','Título','Marca','Categoria','BSR','Vendas/mês Estimadas','Score'],
    ...products.map(p => [
      p.asin, `"${(p.title||'').replace(/"/g,'""')}"`, p.brand||'', p.category||'',
      p.bsr||0, p.salesEst||bsrSales(p.bsr||0), oScore(p.bsr||0, 25),
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

/* ─── Detail modal ───────────────────────────────────────────────────────── */
function DetailModal({product,onClose}:{product:any;onClose:()=>void}){
  const catId=CATS.find(c=>product.category?.toLowerCase().includes(c.label.toLowerCase().split(' ')[0]))?.id||'home'
  const defP=DEF_P[catId]||99
  const [price,setPrice]=useState(defP)
  const [cost,setCost]=useState(Math.round(defP*.3))

  const bsr=product.bsr||0
  const sales=product.salesEst||bsrSales(bsr)
  const dem=dInfo(sales)
  const ref=REF[catId]||.15
  const refFee=+(price*ref).toFixed(2)
  const fba=price<50?12:price<150?18:price<400?24:32
  const profit=+(price-refFee-fba-cost).toFixed(2)
  const margin=price>0?+((profit/price)*100).toFixed(1):0
  const roi=cost>0?+((profit/cost)*100).toFixed(1):0
  const score=oScore(bsr,margin)
  const sc=sColor(score)
  const verdict=score>=75?{l:'Excelente Oportunidade',c:T.g,s:'Alta demanda e margem sólida — forte potencial para FBA.'}
    :score>=55?{l:'Boa Oportunidade',c:T.g,s:'Demanda consistente. Vale testar com estoque inicial médio.'}
    :score>=38?{l:'Potencial Médio',c:T.a,s:'Demanda razoável. Avalie a concorrência antes de entrar.'}
    :{l:'Baixo Potencial',c:T.r,s:'BSR alto ou margem apertada. Recomendamos explorar outra opção.'}

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
          {[{v:bsr>0?`#${fmtN(bsr)}`:'—',l:'BSR Amazon',c:T.t1},{v:`~${fmtK(sales)}/mês`,l:'Vendas estimadas',c:dem.c},{v:dem.l,l:'Nível de Demanda',c:dem.c},{v:`${score}/100`,l:'Score Oráculo',c:sc}].map((k,i)=>(
            <div key={i} style={{padding:'18px 20px',borderRight:i<3?`1px solid ${T.line}`:'none',textAlign:'center' as const}}>
              <div style={{fontSize:20,fontWeight:700,color:k.c,letterSpacing:'-0.02em',marginBottom:4,lineHeight:1}}>{k.v}</div>
              <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>{k.l}</div>
            </div>
          ))}
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
              {[{l:'Preço de Venda (R$)',v:price,s:setPrice},{l:'Custo do Produto (R$)',v:cost,s:setCost}].map(f=>(
                <div key={f.l} style={{background:T.bg,border:`1px solid ${T.lineG}`,borderRadius:10,padding:'12px 16px'}}>
                  <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:8}}>{f.l}</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                    <span style={{fontSize:13,color:T.t3,fontWeight:500}}>R$</span>
                    <input type="number" min={0} value={f.v} onChange={e=>(f.s as any)(+e.target.value||0)} style={{background:'none',border:'none',color:T.gold,fontSize:22,fontWeight:700,width:'100%',outline:'none',fontFamily:'inherit'}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:T.bg,borderRadius:12,overflow:'hidden',border:`1px solid ${T.line}`}}>
              <div style={{padding:'0 16px'}}>
                {[{l:'Preço de venda',v:`R$ ${fmtR(price)}`,neg:false},{l:`Taxa Amazon (${(ref*100).toFixed(0)}%)`,v:`− R$ ${fmtR(refFee)}`,neg:true},{l:'Taxa FBA',v:`− R$ ${fmtR(fba)}`,neg:true},{l:'Custo do produto',v:`− R$ ${fmtR(cost)}`,neg:true}].map((row,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${T.line}`}}>
                    <span style={{fontSize:12,color:row.neg?T.t2:T.t1}}>{row.l}</span>
                    <span style={{fontSize:12,color:row.neg?T.r:T.t1,fontWeight:row.neg?400:500}}>{row.v}</span>
                  </div>
                ))}
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
          {/* Verdict */}
          <div style={{background:`${verdict.c}08`,border:`1px solid ${verdict.c}18`,borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}>
            <ScoreRing score={score}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:verdict.c,marginBottom:4}}>{verdict.l}</div>
              <div style={{fontSize:12,color:T.t4,lineHeight:1.6}}>{verdict.s}</div>
            </div>
          </div>
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

/* ─── Small helpers ──────────────────────────────────────────────────────── */
function Chip({text,c}:{text:string;c:string}){return<span style={{background:`${c}18`,color:c,border:`1px solid ${c}28`,borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:600,letterSpacing:'0.03em'}}>{text}</span>}
function Lbl({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){return<div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,...style}}>{children}</div>}
function Chevron({open}:{open:boolean}){return<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transition:'transform .2s',transform:open?'rotate(180deg)':'none',color:T.t3,flexShrink:0}}><path d="M2 3.5L5 6.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}

/* ─── Product card ───────────────────────────────────────────────────────── */
function Card({product,onClick,locked}:{product:any;onClick:()=>void;locked?:boolean}){
  const [hov,setHov]=useState(false)
  const bsr=product.bsr||0
  const sales=product.salesEst||bsrSales(bsr)
  const score=oScore(bsr,25)
  const sc=sColor(score)
  const salesColor=sales>=1000?T.g:sales>=300?T.a:T.t4
  const isGeneric=!product.brand||product.brand.toLowerCase()==='genérico'

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
        {sales>0&&bsr>0&&<div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:8}}><span style={{fontSize:22,fontWeight:700,color:salesColor,letterSpacing:'-0.03em',lineHeight:1}}>~{fmtK(sales)}</span><span style={{fontSize:10,color:T.t3,fontWeight:500}}>vendas/mês</span></div>}
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

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function DashboardClient({user}:{user:any}){
  const router = useRouter()
  const [nav,      setNav]      = useState('bestsellers')
  const [cat,      setCat]      = useState('electronics')
  const [prods,    setProds]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [q,        setQ]        = useState('')
  const [sideOpen, setSideOpen] = useState(true)
  const [catOpen,  setCatOpen]  = useState(false)
  const [detail,   setDetail]   = useState<any>(null)
  const [upgrade,  setUpgrade]  = useState(false)
  const [page,     setPage]     = useState(1)
  const PAGE = 20

  const cfg = PLAN_CFG[user.plan] ?? PLAN_CFG.free
  const isFree = user.plan === 'free'

  // Aviso de plano próximo de expirar
  const expiresAt = user.expiresAt ? new Date(user.expiresAt) : null
  const daysLeft  = expiresAt ? Math.ceil((expiresAt.getTime()-Date.now())/(1000*60*60*24)) : null
  const expiringSoon = daysLeft !== null && daysLeft <= 7 && user.plan !== 'lifetime'

  async function load(n=nav, c=cat, query='', bust=false){
    if(n==='search'&&!query.trim()) return
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

  useEffect(()=>{ load('bestsellers',cat) },[]) // eslint-disable-line

  function goNav(id:string){
    if(!cfg.tabs.includes(id)){setUpgrade(true);return}
    setNav(id); setPage(1)
    if(id==='search'){setProds([]);setDone(false);return}
    load(id,cat)
  }

  function handleCardClick(p:any, isLocked:boolean){
    if(isLocked||!cfg.modal){setUpgrade(true);return}
    setDetail(p)
  }

  const curNav  = NAV.find(n=>n.id===nav)
  const curCat  = CATS.find(c=>c.id===cat)
  const isCross = nav==='bestsellers'||nav==='trending'
  const totalP  = Math.ceil(prods.length/PAGE)
  const paged   = prods.slice((page-1)*PAGE,page*PAGE)

  return(
    <>
      {upgrade&&<UpgradeModal onClose={()=>setUpgrade(false)}/>}
      {detail&&<DetailModal product={detail} onClose={()=>setDetail(null)}/>}
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
                        load(target,c.id)
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
            <div style={{flex:1,position:'relative',maxWidth:480}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:T.t3,pointerEvents:'none'}}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input value={q} onChange={e=>setQ(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&q.trim()){
                  if(!cfg.search){setUpgrade(true);return}
                  setNav('search');load('search',cat,q)
                }}}
                placeholder={cfg.search?'Buscar produto ou ASIN na Amazon…':'Busca disponível a partir do plano Mensal'}
                disabled={!cfg.search}
                style={{width:'100%',background:T.bg,border:`1px solid ${T.line}`,borderRadius:9,padding:'9px 14px 9px 36px',color:T.t1,fontSize:12,outline:'none',transition:'border-color .15s',opacity:cfg.search?1:.5,cursor:cfg.search?'text':'not-allowed'}}
                onFocus={e=>cfg.search&&((e.target as HTMLElement).style.borderColor=T.lineG)}
                onBlur={e=>(e.target as HTMLElement).style.borderColor=T.line}
              />
            </div>
            <button onClick={()=>{
              if(!cfg.search){setUpgrade(true);return}
              if(q.trim()){setNav('search');load('search',cat,q)}
            }}
              style={{background:cfg.search?T.goldG:`${T.t3}40`,color:cfg.search?'#02020A':T.t3,fontWeight:700,fontSize:10,padding:'9px 18px',borderRadius:8,border:'none',cursor:cfg.search?'pointer':'not-allowed',letterSpacing:'0.1em',textTransform:'uppercase' as const,flexShrink:0,boxShadow:cfg.search?'0 2px 12px rgba(240,180,41,0.3)':undefined}}>
              Buscar
            </button>
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

          {/* Content */}
          <main style={{flex:1,overflowY:'auto',padding:'28px 28px 40px',position:'relative' as const}}>

            {/* Page header */}
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
                {!isFree&&totalP>1&&(
                  <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:4,marginTop:32}}>
                    {([
                      {l:'←',fn:()=>setPage(p=>Math.max(1,p-1)),dis:page===1,act:false},
                      ...Array.from({length:totalP}).map((_,i)=>({l:String(i+1),fn:()=>setPage(i+1),dis:false,act:page===i+1})),
                      {l:'→',fn:()=>setPage(p=>Math.min(totalP,p+1)),dis:page===totalP,act:false},
                    ] as {l:string;fn:()=>void;dis:boolean;act:boolean}[]).map((b,i)=>(
                      <button key={i} onClick={()=>{if(!b.dis){b.fn();window.scrollTo(0,0)}}}
                        style={{background:b.act?`${T.gold}14`:'none',border:`1px solid ${b.act?'rgba(240,180,41,0.3)':T.line}`,color:b.act?T.gold:b.dis?T.t3:T.t2,fontWeight:b.act?700:400,fontSize:12,width:34,height:34,borderRadius:7,cursor:b.dis?'default':'pointer',fontFamily:'inherit',transition:'all .12s'}}>
                        {b.l}
                      </button>
                    ))}
                  </div>
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

            {/* No results */}
            {!loading&&done&&prods.length===0&&<div style={{textAlign:'center' as const,padding:'80px 24px',color:T.t3,fontSize:13}}>Nenhum produto encontrado. Tente outra busca ou categoria.</div>}
          </main>
        </div>
      </div>
    </>
  )
}
