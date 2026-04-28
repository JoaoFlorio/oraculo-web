'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  /* surfaces */
  bg:      '#03030A',
  sidebar: '#070710',
  card:    '#0B0B1A',
  cardHov: '#0F0F22',
  input:   '#0B0B1A',
  modal:   '#09091A',
  /* lines */
  line:    'rgba(255,255,255,0.07)',
  lineG:   'rgba(240,180,41,0.22)',
  /* accent */
  gold:    '#F0B429',
  goldD:   '#C48F10',
  goldG:   'linear-gradient(135deg,#F5C842 0%,#C48F10 100%)',
  goldSub: 'rgba(240,180,41,0.10)',
  /* status */
  g:       '#22C55E',
  a:       '#F59E0B',
  r:       '#EF4444',
  /* text */
  t1:      '#F2F2FC',   /* primary — bright white */
  t2:      '#A0A0C8',   /* secondary — clearly readable */
  t3:      '#686890',   /* muted — still legible */
  t4:      '#C8C8E8',   /* near-primary secondary */
  /* purple accent */
  pur:     '#8B78FF',
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const CATS = [
  { id:'electronics',     label:'Eletrônicos'     },
  { id:'computers',       label:'Computadores'    },
  { id:'home',            label:'Casa e Cozinha'  },
  { id:'sports',          label:'Esportes'        },
  { id:'beauty',          label:'Beleza'          },
  { id:'toys',            label:'Brinquedos'      },
  { id:'tools',           label:'Ferramentas'     },
  { id:'pet-supplies',    label:'Pet Shop'        },
  { id:'health',          label:'Saúde'           },
  { id:'office-products', label:'Escritório'      },
]
const NAV = [
  { id:'bestsellers', label:'Mais Vendidos',     icon:'M' },
  { id:'new',         label:'Recém Adicionados', icon:'N' },
  { id:'trending',    label:'Em Alta',           icon:'E' },
  { id:'generics',    label:'Genéricos',         icon:'G' },
  { id:'search',      label:'Buscar Produto',    icon:'B' },
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
const fmtK  =(n:number)=>n>=1000?`${(n/1000).toFixed(1).replace('.0','')}k`:`${n}`
const fmtN  =(n:number)=>Math.round(n).toLocaleString('pt-BR')
const fmtR  =(n:number)=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const sColor=(s:number)=>s>=70?T.g:s>=50?T.a:T.r
const dInfo =(s:number)=>s>=2000?{l:'Muito Alta',c:T.g}:s>=800?{l:'Alta',c:T.g}:s>=300?{l:'Média',c:T.a}:s>=100?{l:'Baixa',c:T.a}:{l:'Muito Baixa',c:T.r}
function oScore(bsr:number,m:number){const b=bsr<500?40:bsr<2000?30:bsr<10000?20:bsr<50000?10:5;const mg=m>=35?40:m>=25?32:m>=15?22:m>=5?12:4;return Math.min(100,b+mg+20)}

/* ─── Logo mark ──────────────────────────────────────────────────────────── */
function OracleMark({size=28}:{size?:number}){
  return(
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      style={{filter:'drop-shadow(0 0 8px rgba(240,180,41,0.65)) drop-shadow(0 0 2px rgba(240,180,41,0.9))'}}>
      {/* outer ring */}
      <ellipse cx="16" cy="16" rx="13" ry="9" stroke="#F0B429" strokeWidth="1.6"/>
      {/* iris */}
      <circle cx="16" cy="16" r="5.5" fill="#F0B429"/>
      {/* pupil */}
      <circle cx="16" cy="16" r="2.4" fill="#03030A"/>
      {/* shine */}
      <circle cx="14.5" cy="14.2" r="1.1" fill="rgba(255,255,255,0.45)"/>
      {/* lash ticks */}
      <line x1="16" y1="7"  x2="16" y2="5"  stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
      <line x1="16" y1="25" x2="16" y2="27" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
      <line x1="3"  y1="16" x2="1"  y2="16" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
      <line x1="29" y1="16" x2="31" y2="16" stroke="#F0B429" strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>
    </svg>
  )
}

/* ─── Nav icon ───────────────────────────────────────────────────────────── */
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
  const c=sColor(score)
  const r=9, circ=2*Math.PI*r
  const dash=circ*(score/100)
  return(
    <svg width="28" height="28" viewBox="0 0 28 28" style={{flexShrink:0}}>
      <circle cx="14" cy="14" r={r} fill="none" stroke={T.line} strokeWidth="2.5"/>
      <circle cx="14" cy="14" r={r} fill="none" stroke={c} strokeWidth="2.5"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ*.25} strokeLinecap="round"/>
      <text x="14" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill={c} fontFamily="inherit">{score}</text>
    </svg>
  )
}

/* ─── Product detail modal ───────────────────────────────────────────────── */
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
      style={{position:'fixed',inset:0,background:'rgba(1,1,8,0.92)',backdropFilter:'blur(12px)',zIndex:1000,overflowY:'auto',padding:'32px 16px',display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
      <div style={{width:'100%',maxWidth:860,background:T.modal,border:`1px solid ${T.line}`,borderRadius:18,overflow:'hidden',boxShadow:'0 40px 80px rgba(0,0,0,0.8)'}}>

        {/* Header */}
        <div style={{display:'flex',gap:20,alignItems:'flex-start',padding:'24px 28px',borderBottom:`1px solid ${T.line}`,background:`linear-gradient(180deg,rgba(240,180,41,0.04) 0%,transparent 100%)`}}>
          <div style={{width:84,height:84,background:'#F8F8F8',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.08)'}}>
            {product.images?.[0]
              ?<img src={product.images[0]} alt="" style={{maxWidth:70,maxHeight:70,objectFit:'contain'}}/>
              :<div style={{width:32,height:32,background:'#e0e0e0',borderRadius:6}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:15,fontWeight:600,color:T.t1,lineHeight:1.55,marginBottom:12,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{product.title}</p>
            <div style={{display:'flex',gap:6,flexWrap:'wrap' as const}}>
              {product.asin&&<Tag text={`ASIN ${product.asin}`} color={T.t3}/>}
              {product.category&&<Tag text={product.category} color={T.gold}/>}
              {product.brand&&<Tag text={product.brand} color={T.pur}/>}
            </div>
          </div>
          <button onClick={onClose}
            style={{background:'none',border:`1px solid ${T.line}`,color:T.t2,width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit'}}>
            ✕
          </button>
        </div>

        {/* KPI bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:`1px solid ${T.line}`}}>
          {[
            {v:bsr>0?`#${fmtN(bsr)}`:'—',    l:'BSR Amazon',    c:T.t1},
            {v:`~${fmtK(sales)}/mês`,          l:'Vendas estimadas', c:dem.c},
            {v:dem.l,                          l:'Nível de Demanda', c:dem.c},
            {v:`${score}/100`,                 l:'Score Oráculo',    c:sc},
          ].map((k,i)=>(
            <div key={i} style={{padding:'18px 20px',borderRight:i<3?`1px solid ${T.line}`:'none',textAlign:'center' as const}}>
              <div style={{fontSize:20,fontWeight:700,color:k.c,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em',marginBottom:4,lineHeight:1}}>{k.v}</div>
              <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>{k.l}</div>
            </div>
          ))}
        </div>

        <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:22}}>

          {/* BSR gauge */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <Label>Ranking na Amazon</Label>
              <span style={{fontSize:10,color:T.t3}}>BSR menor = produto mais vendido</span>
            </div>
            <div style={{height:6,background:T.card,borderRadius:99,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,background:`linear-gradient(to right,${T.g},${T.a},${T.r})`,opacity:.3}}/>
              {bsr>0&&(()=>{
                const p=Math.min(94,Math.log10(bsr)/Math.log10(500000)*100)
                return<div style={{position:'absolute',top:-3,left:`${p}%`,transform:'translateX(-50%)',width:12,height:12,background:dem.c,borderRadius:'50%',border:`2px solid ${T.modal}`,boxShadow:`0 0 10px ${dem.c}`}}/>
              })()}
            </div>
          </div>

          {/* Simulator */}
          <div>
            <Label style={{marginBottom:14}}>Simulador de Lucratividade</Label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              {[{l:'Preço de Venda (R$)',v:price,s:setPrice},{l:'Custo do Produto (R$)',v:cost,s:setCost}].map(f=>(
                <div key={f.l} style={{background:T.bg,border:`1px solid ${T.lineG}`,borderRadius:10,padding:'12px 16px'}}>
                  <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:8}}>{f.l}</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                    <span style={{fontSize:13,color:T.t3,fontWeight:500}}>R$</span>
                    <input type="number" min={0} value={f.v} onChange={e=>(f.s as any)(+e.target.value||0)}
                      style={{background:'none',border:'none',color:T.gold,fontSize:22,fontWeight:700,width:'100%',outline:'none',fontFamily:'inherit'}}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:T.bg,borderRadius:12,overflow:'hidden',border:`1px solid ${T.line}`}}>
              <div style={{padding:'0 16px'}}>
                {[
                  {l:'Preço de venda',                       v:`R$ ${fmtR(price)}`,    neg:false},
                  {l:`Taxa Amazon (${(ref*100).toFixed(0)}%)`, v:`− R$ ${fmtR(refFee)}`, neg:true},
                  {l:'Taxa FBA',                             v:`− R$ ${fmtR(fba)}`,    neg:true},
                  {l:'Custo do produto',                     v:`− R$ ${fmtR(cost)}`,   neg:true},
                ].map((row,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${T.line}`}}>
                    <span style={{fontSize:12,color:row.neg?T.t2:T.t1}}>{row.l}</span>
                    <span style={{fontSize:12,color:row.neg?T.r:T.t1,fontWeight:row.neg?400:500,fontVariantNumeric:'tabular-nums'}}>{row.v}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:T.card}}>
                {[
                  {l:'Lucro / unidade', v:`R$ ${fmtR(profit)}`, s:`Margem ${margin}%`,    c:profit>=0?T.gold:T.r},
                  {l:'ROI sobre custo', v:`${roi}%`,             s:'Retorno do capital', c:roi>=0?T.g:T.r},
                ].map((b,i)=>(
                  <div key={i} style={{padding:'14px 16px',borderRight:i===0?`1px solid ${T.line}`:'none'}}>
                    <div style={{fontSize:9,color:T.t3,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,marginBottom:6}}>{b.l}</div>
                    <div style={{fontSize:20,fontWeight:700,color:b.c,letterSpacing:'-0.02em',marginBottom:2}}>{b.v}</div>
                    <div style={{fontSize:10,color:T.t3}}>{b.s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly forecast */}
          <div>
            <Label style={{marginBottom:14}}>Previsão Mensal</Label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[{l:'Conservador',m:.3,c:T.t4},{l:'Realista',m:.6,c:T.a},{l:'Otimista',m:1,c:T.g}].map(sc=>{
                const u=Math.round(sales*sc.m)
                const luc=+(u*profit).toFixed(0)
                return(
                  <div key={sc.l} style={{background:T.bg,border:`1px solid ${T.line}`,borderRadius:12,padding:'16px',position:'relative' as const,overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:sc.c,opacity:.5}}/>
                    <div style={{fontSize:9,fontWeight:700,color:sc.c,letterSpacing:'0.14em',textTransform:'uppercase' as const,marginBottom:10}}>{sc.l}</div>
                    <div style={{fontSize:11,color:T.t3,marginBottom:2}}>{Math.round(sc.m*100)}% do mercado</div>
                    <div style={{fontSize:11,color:T.t3,marginBottom:2}}>{fmtN(u)} unidades</div>
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
            <button onClick={onClose}
              style={{flex:1,background:'none',border:`1px solid ${T.line}`,color:T.t2,fontWeight:500,fontSize:11,padding:'13px',borderRadius:9,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.08em',textTransform:'uppercase' as const}}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Tag chip ───────────────────────────────────────────────────────────── */
function Tag({text,color}:{text:string;color:string}){
  return<span style={{background:`${color}18`,color:color,border:`1px solid ${color}28`,borderRadius:4,padding:'2px 8px',fontSize:10,fontWeight:600,letterSpacing:'0.03em'}}>{text}</span>
}

/* ─── Label ──────────────────────────────────────────────────────────────── */
function Label({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){
  return<div style={{fontSize:9,fontWeight:700,color:T.t3,letterSpacing:'0.14em',textTransform:'uppercase' as const,...style}}>{children}</div>
}

/* ─── Product card ───────────────────────────────────────────────────────── */
function Card({product,onClick}:{product:any;onClick:()=>void}){
  const [hov,setHov]=useState(false)
  const bsr    = product.bsr||0
  const sales  = product.salesEst||bsrSales(bsr)
  const score  = oScore(bsr,25)
  const sc     = sColor(score)
  const isGeneric = !product.brand || product.brand.toLowerCase()==='genérico'

  const salesColor=sales>=1000?T.g:sales>=300?T.a:T.t4

  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:hov?T.cardHov:T.card,border:`1px solid ${hov?T.lineG:T.line}`,borderRadius:14,overflow:'hidden',cursor:'pointer',
        transition:'background .15s,border-color .15s,transform .15s,box-shadow .15s',
        transform:hov?'translateY(-2px)':'none',
        boxShadow:hov?'0 20px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(240,180,41,0.08)':'none',
        display:'flex',flexDirection:'column',position:'relative' as const}}>

      {/* Score badge */}
      <div style={{position:'absolute',top:10,right:10,zIndex:2}}>
        <ScoreRing score={score}/>
      </div>

      {/* Generic badge */}
      {isGeneric&&(
        <div style={{position:'absolute',top:10,left:10,zIndex:2,background:'rgba(3,3,10,0.8)',backdropFilter:'blur(4px)',border:`1px solid ${T.pur}35`,borderRadius:4,padding:'2px 7px',fontSize:8,fontWeight:700,color:T.pur,letterSpacing:'0.1em'}}>
          GENÉRICO
        </div>
      )}

      {/* Image area */}
      <div style={{background:'#F8F8FC',height:162,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
        {product.images?.[0]
          ?<img src={product.images[0]} alt="" style={{maxHeight:138,maxWidth:'88%',objectFit:'contain',
              transition:'transform .3s cubic-bezier(.34,1.56,.64,1)',transform:hov?'scale(1.08)':'scale(1)'}}
              onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
          :<div style={{width:44,height:44,background:'#e8e8f0',borderRadius:8}}/>
        }
      </div>

      {/* Content */}
      <div style={{padding:'14px 14px 16px',flex:1,display:'flex',flexDirection:'column',gap:0}}>

        {/* Sales metric */}
        {sales>0&&bsr>0&&(
          <div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:8}}>
            <span style={{fontSize:22,fontWeight:700,color:salesColor,letterSpacing:'-0.03em',lineHeight:1}}>~{fmtK(sales)}</span>
            <span style={{fontSize:10,color:T.t3,fontWeight:500}}>vendas/mês</span>
          </div>
        )}

        {/* Title */}
        <p style={{fontSize:12,fontWeight:500,color:T.t1,lineHeight:1.58,flex:1,
          display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,
          overflow:'hidden',marginBottom:10}}>
          {product.title}
        </p>

        {/* Meta row */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          {bsr>0&&<span style={{fontSize:10,color:T.t3}}>BSR <strong style={{color:T.t2,fontWeight:600}}>#{fmtN(bsr)}</strong></span>}
          {bsr>0&&product.brand&&<span style={{color:T.t3,fontSize:10}}>·</span>}
          {product.brand&&<span style={{fontSize:10,color:T.t3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,maxWidth:90}}>{product.brand}</span>}
        </div>

        {/* CTA */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`1px solid ${T.line}`,paddingTop:11}}>
          <span style={{fontSize:10,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase' as const,color:hov?T.gold:T.t3,transition:'color .15s'}}>
            Ver análise
          </span>
          <div style={{width:24,height:24,borderRadius:'50%',background:hov?T.goldSub:'none',border:`1px solid ${hov?T.lineG:T.line}`,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke={hov?T.gold:T.t3} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{transition:'stroke .15s'}}/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Chevron ────────────────────────────────────────────────────────────── */
function Chevron({open}:{open:boolean}){
  return(
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
      style={{transition:'transform .2s',transform:open?'rotate(180deg)':'none',color:T.t3,flexShrink:0}}>
      <path d="M2 3.5L5 6.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─── Skeleton card ──────────────────────────────────────────────────────── */
function SkeletonCard({i}:{i:number}){
  return(
    <div style={{background:T.card,borderRadius:14,overflow:'hidden',border:`1px solid ${T.line}`,animationDelay:`${i*.05}s`,animation:'pulse 1.8s ease-in-out infinite'}}>
      <div style={{background:'#F8F8FC',height:162}}/>
      <div style={{padding:'14px 14px 16px',display:'flex',flexDirection:'column',gap:10}}>
        <div style={{height:10,background:T.t3,borderRadius:4,width:'50%',opacity:.5}}/>
        <div style={{height:8,background:T.t3,borderRadius:4,width:'90%',opacity:.3}}/>
        <div style={{height:8,background:T.t3,borderRadius:4,width:'70%',opacity:.3}}/>
      </div>
    </div>
  )
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function DashboardClient({user}:{user:any}){
  const router   = useRouter()
  const [nav,    setNav]    = useState('bestsellers')
  const [cat,    setCat]    = useState('electronics')
  const [prods,  setProds]  = useState<any[]>([])
  const [loading,setLoading]= useState(false)
  const [done,   setDone]   = useState(false)
  const [q,      setQ]      = useState('')
  const [sideOpen,setSideOpen] = useState(true)
  const [catOpen, setCatOpen]  = useState(false)
  const [detail,  setDetail]   = useState<any>(null)
  const [page,    setPage]     = useState(1)
  const PAGE = 20

  async function load(n=nav, c=cat, query=''){
    if(n==='search'&&!query.trim()) return
    setLoading(true); setDone(false); setPage(1)
    try{
      const r = await fetch(`/api/products?${new URLSearchParams({type:n,category:c,q:query})}`)
      const d = await r.json()
      setProds(d.products||[])
    }catch{ setProds([]) }
    setLoading(false); setDone(true)
  }

  function goNav(id:string){
    setNav(id); setPage(1)
    if(id==='search'){ setProds([]); setDone(false); return }
    load(id,cat)
  }

  const planColors:Record<string,string> = {lifetime:T.g, annual:T.gold, monthly:T.pur, free:T.t3}
  const planLabels:Record<string,string> = {lifetime:'Vitalício', annual:'Anual', monthly:'Mensal', free:'Gratuito'}
  const pc  = planColors[user.plan]||T.t3
  const pl  = planLabels[user.plan]||user.plan
  const isCross = nav==='bestsellers'||nav==='trending'
  const curNav  = NAV.find(n=>n.id===nav)
  const curCat  = CATS.find(c=>c.id===cat)
  const totalP  = Math.ceil(prods.length/PAGE)
  const paged   = prods.slice((page-1)*PAGE, page*PAGE)

  return(
    <>
      {detail&&<DetailModal product={detail} onClose={()=>setDetail(null)}/>}
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
      `}</style>

      <div style={{display:'flex',height:'100vh',background:T.bg,color:T.t1,overflow:'hidden'}}>

        {/* ════════════════════════════════════════
            SIDEBAR
        ════════════════════════════════════════ */}
        <aside style={{
          width: sideOpen ? 240 : 64,
          background: T.sidebar,
          borderRight: `1px solid ${T.line}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width .22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 20,
        }}>

          {/* ── Logo ── */}
          <div style={{padding:'0 12px',height:60,borderBottom:`1px solid ${T.line}`,display:'flex',alignItems:'center',gap:12,flexShrink:0,cursor:'pointer'}}
            onClick={()=>setSideOpen(!sideOpen)}>
            <div style={{width:40,height:40,borderRadius:10,background:'rgba(240,180,41,0.06)',border:`1px solid rgba(240,180,41,0.15)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <OracleMark size={22}/>
            </div>
            {sideOpen&&(
              <div style={{overflow:'hidden',minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,letterSpacing:'0.2em',color:T.gold,lineHeight:1,whiteSpace:'nowrap' as const}}>ORÁCULO</div>
                <div style={{fontSize:8,color:T.t3,letterSpacing:'0.18em',marginTop:3,fontWeight:500,whiteSpace:'nowrap' as const}}>AMAZON INTELLIGENCE</div>
              </div>
            )}
          </div>

          {/* ── Nav ── */}
          <nav style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'8px',display:'flex',flexDirection:'column',gap:2}}>

            {sideOpen&&<Label style={{padding:'12px 8px 6px',marginBottom:2}}>Navegação</Label>}

            {NAV.map(n=>{
              const active = nav===n.id
              return(
                <button key={n.id} onClick={()=>goNav(n.id)}
                  title={!sideOpen?n.label:undefined}
                  style={{
                    width:'100%',display:'flex',alignItems:'center',gap:10,
                    padding: sideOpen ? '8px 10px' : '10px',
                    justifyContent: sideOpen ? 'flex-start' : 'center',
                    borderRadius:8,border:'none',cursor:'pointer',
                    background: active ? `${T.gold}12` : 'none',
                    borderLeft: sideOpen ? (active?`2px solid ${T.gold}`:'2px solid transparent') : 'none',
                    paddingLeft: sideOpen ? (active?'8px':'10px') : undefined,
                    fontFamily:'inherit',textAlign:'left' as const,outline:'none',
                    transition:'all .12s',
                  }}>
                  <NavIcon id={n.id} active={active}/>
                  {sideOpen&&<span style={{fontSize:12,fontWeight:active?600:400,color:active?T.t1:T.t2,whiteSpace:'nowrap' as const,letterSpacing:'-0.01em'}}>{n.label}</span>}
                </button>
              )
            })}

            {/* Categories */}
            {sideOpen&&(
              <>
                <button onClick={()=>setCatOpen(!catOpen)}
                  style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 10px 6px',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',marginTop:4}}>
                  <Label>Categorias</Label>
                  <Chevron open={catOpen}/>
                </button>
                <div style={{overflow:'hidden',maxHeight:catOpen?500:0,transition:'max-height .28s cubic-bezier(.4,0,.2,1)'}}>
                  {CATS.map(c=>{
                    const active=cat===c.id
                    return(
                      <button key={c.id} onClick={()=>{setCat(c.id);setPage(1);if(nav!=='search')load(nav,c.id)}}
                        style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'6px 10px 6px 20px',borderRadius:7,border:'none',cursor:'pointer',marginBottom:1,
                          background:active?`${T.gold}08`:'none',fontFamily:'inherit',textAlign:'left' as const}}>
                        <div style={{width:4,height:4,borderRadius:'50%',background:active?T.gold:T.t3,flexShrink:0}}/>
                        <span style={{fontSize:11,color:active?T.gold:T.t4,fontWeight:active?600:400,letterSpacing:'-0.01em'}}>{c.label}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </nav>

          {/* ── User ── */}
          <div style={{padding:'10px 12px',borderTop:`1px solid ${T.line}`,flexShrink:0}}>
            {sideOpen?(
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:`${pc}20`,border:`1px solid ${pc}35`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:pc,fontWeight:700,flexShrink:0,letterSpacing:'0.02em'}}>
                  {user.name?.[0]?.toUpperCase()||'?'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,letterSpacing:'-0.01em'}}>{user.name}</div>
                  <div style={{fontSize:8,fontWeight:700,color:pc,letterSpacing:'0.12em',textTransform:'uppercase' as const,marginTop:1}}>{pl}</div>
                </div>
                <button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/login')}}
                  style={{background:'none',border:`1px solid ${T.line}`,cursor:'pointer',color:T.t3,fontSize:9,fontFamily:'inherit',padding:'4px 8px',borderRadius:5,letterSpacing:'0.06em',fontWeight:600,textTransform:'uppercase' as const}}>
                  Sair
                </button>
              </div>
            ):(
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:`${pc}18`,border:`1px solid ${pc}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:pc,fontWeight:700}}>
                  {user.name?.[0]?.toUpperCase()||'?'}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ════════════════════════════════════════
            MAIN
        ════════════════════════════════════════ */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

          {/* Topbar */}
          <header style={{height:60,background:T.sidebar,borderBottom:`1px solid ${T.line}`,display:'flex',alignItems:'center',gap:12,padding:'0 24px',flexShrink:0}}>
            <div style={{flex:1,position:'relative',maxWidth:480}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:T.t3,pointerEvents:'none'}}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input value={q} onChange={e=>setQ(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&q.trim()){setNav('search');load('search',cat,q)}}}
                placeholder="Buscar produto ou ASIN na Amazon…"
                style={{width:'100%',background:T.bg,border:`1px solid ${T.line}`,borderRadius:9,padding:'9px 14px 9px 36px',color:T.t1,fontSize:12,outline:'none',transition:'border-color .15s'}}
                onFocus={e=>(e.target as HTMLElement).style.borderColor=T.lineG}
                onBlur={e=>(e.target as HTMLElement).style.borderColor=T.line}
              />
            </div>
            <button onClick={()=>{if(q.trim()){setNav('search');load('search',cat,q)}}}
              style={{background:T.goldG,color:'#02020A',fontWeight:700,fontSize:10,padding:'9px 18px',borderRadius:8,border:'none',cursor:'pointer',letterSpacing:'0.1em',textTransform:'uppercase' as const,flexShrink:0,boxShadow:'0 2px 12px rgba(240,180,41,0.3)'}}>
              Buscar
            </button>

            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:T.g,boxShadow:`0 0 6px ${T.g}`}}/>
              <span style={{fontSize:10,color:T.t3,fontWeight:500}}>Amazon BR</span>
            </div>
          </header>

          {/* Content */}
          <main style={{flex:1,overflowY:'auto',padding:'28px 28px 40px'}}>

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
              <button onClick={()=>load()}
                style={{display:'flex',alignItems:'center',gap:7,background:'none',border:`1px solid ${T.line}`,color:T.t3,fontSize:10,fontWeight:600,padding:'8px 16px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.1em',textTransform:'uppercase' as const,transition:'all .15s'}}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.lineG;el.style.color=T.gold}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor=T.line;el.style.color=T.t3}}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M9.5 2A5 5 0 1 0 10 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M9.5 2V5H6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Atualizar
              </button>
            </div>

            {/* ── Empty / Idle ── */}
            {!done&&!loading&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:340,gap:18}}>
                <div style={{width:64,height:64,borderRadius:16,background:'rgba(240,180,41,0.06)',border:`1px solid rgba(240,180,41,0.15)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <OracleMark size={32}/>
                </div>
                {nav==='search'?(
                  <p style={{fontSize:13,color:T.t4,textAlign:'center' as const,maxWidth:260,lineHeight:1.6}}>Digite o nome de um produto ou ASIN na barra de busca acima.</p>
                ):(
                  <>
                    <p style={{fontSize:13,color:T.t4,textAlign:'center' as const,maxWidth:240,lineHeight:1.6}}>Clique abaixo para carregar os melhores produtos desta aba.</p>
                    <button onClick={()=>load()}
                      style={{background:T.goldG,color:'#02020A',fontWeight:700,fontSize:11,padding:'12px 28px',borderRadius:9,border:'none',cursor:'pointer',letterSpacing:'0.1em',textTransform:'uppercase' as const,boxShadow:'0 4px 20px rgba(240,180,41,0.3)'}}>
                      Iniciar Análise
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Skeleton ── */}
            {loading&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
                {Array.from({length:12}).map((_,i)=><SkeletonCard key={i} i={i}/>)}
              </div>
            )}

            {/* ── Grid ── */}
            {!loading&&done&&prods.length>0&&(
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
                  {paged.map(p=><Card key={p.asin} product={p} onClick={()=>setDetail(p)}/>)}
                </div>

                {/* Pagination */}
                {totalP>1&&(
                  <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:4,marginTop:32}}>
                    {([
                      {l:'←',fn:()=>setPage(p=>Math.max(1,p-1)),dis:page===1,act:false},
                      ...Array.from({length:totalP}).map((_,i)=>({l:String(i+1),fn:()=>setPage(i+1),dis:false,act:page===i+1})),
                      {l:'→',fn:()=>setPage(p=>Math.min(totalP,p+1)),dis:page===totalP,act:false},
                    ] as {l:string;fn:()=>void;dis:boolean;act:boolean}[]).map((b,i)=>(
                      <button key={i} onClick={()=>{if(!b.dis){b.fn();window.scrollTo(0,0)}}}
                        style={{background:b.act?`${T.gold}14`:'none',border:`1px solid ${b.act?'rgba(240,180,41,0.3)':T.line}`,color:b.act?T.gold:b.dis?T.t3:T.t2,fontWeight:b.act?700:400,fontSize:12,width:34,height:34,borderRadius:7,cursor:b.dis?'default':'pointer',fontFamily:'inherit',transition:'all .12s',fontVariantNumeric:'tabular-nums'}}>
                        {b.l}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Empty results ── */}
            {!loading&&done&&prods.length===0&&(
              <div style={{textAlign:'center' as const,padding:'80px 24px',color:T.t3,fontSize:13}}>
                Nenhum produto encontrado. Tente outra busca ou categoria.
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
