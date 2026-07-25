'use client'
import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from 'react'
import dynamic from 'next/dynamic'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts'
import { getFinanceData, summary, productMetrics, abcCurve, type ProductMetrics } from './financeiroMock'

const FinanceiroPanel = dynamic(()=>import('./FinanceiroPanel'),{ssr:false,loading:()=><div style={{padding:40,textAlign:'center',color:'#888'}}>Carregando DRE…</div>})

/* ════════════════════════════════════════════════════════════════════════
   Temas — o seller escolhe a paleta (salvo no navegador). Fácil adicionar
   novas paletas: basta inserir outra entrada em THEMES.
   ════════════════════════════════════════════════════════════════════════ */
export interface Theme {
  key:string; name:string; dark:boolean
  pageBg:string; card:string; card2:string; line:string; line2:string
  t1:string; t2:string; t3:string
  gold:string; goldText:string; grn:string; red:string; vio:string; blue:string
  grid:string; tipBg:string
  pillGrn:[string,string]; pillGold:[string,string]; pillRed:[string,string]
}
const THEMES:Record<string,Theme> = {
  dark: {
    key:'dark', name:'Escuro', dark:true,
    pageBg:'#0A0A14', card:'#16162A', card2:'#1D1D34', line:'rgba(255,255,255,0.12)', line2:'rgba(255,255,255,0.18)',
    t1:'#F5F5FC', t2:'#C4C4DE', t3:'#8B8BAC',
    gold:'#F0C262', goldText:'#FAD98E', grn:'#3FD79B', red:'#FF7A6E', vio:'#A99BFF', blue:'#5E9BE0',
    grid:'rgba(255,255,255,0.07)', tipBg:'#1D1D34',
    pillGrn:['rgba(63,215,155,0.18)','#3FD79B'], pillGold:['rgba(240,194,98,0.18)','#FAD98E'], pillRed:['rgba(255,122,110,0.18)','#FF9A90'],
  },
  light: {
    key:'light', name:'Claro', dark:false,
    pageBg:'#F6F7F9', card:'#FFFFFF', card2:'#FFFFFF', line:'#E5E7EB', line2:'#D1D5DB',
    t1:'#111827', t2:'#4B5563', t3:'#6B7280',
    gold:'#E7B85C', goldText:'#B5840F', grn:'#15803D', red:'#DC2626', vio:'#7C3AED', blue:'#2563EB',
    grid:'#EFF1F4', tipBg:'#FFFFFF',
    pillGrn:['#DCFCE7','#15803D'], pillGold:['#FEF3D7','#B5840F'], pillRed:['#FEE2E2','#DC2626'],
  },
}
const FH = "'Space Grotesk','Inter',sans-serif"
const FG = "'Montserrat','Inter',sans-serif"   // fonte do Gestor Seller (Montserrat nos títulos/valores)
const ThemeCtx = createContext<Theme>(THEMES.dark)
const useT = ()=>useContext(ThemeCtx)

/* ── Format ──────────────────────────────────────────────────────────────── */
const brl  = (n:number)=>'R$ '+Math.round(n).toLocaleString('pt-BR')
const brl2 = (n:number)=>'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const pc   = (n:number)=>n.toFixed(1).replace('.',',')+'%'
// Presets de período (estilo Gestor Seller).
const PRESETS:[string,string][] = [
  ['hoje','Hoje'],['ontem','Ontem'],['7d','Últimos 7 dias'],['15d','Últimos 15 dias'],
  ['30d','Últimos 30 dias'],['mes','Esse mês'],['mespass','Mês passado'],['ano','Esse ano'],
]
function computeRange(key:string, custom:{from:Date;to:Date}|null):{from:string;to:string}{
  const now=new Date(); const to=now.toISOString()
  const startOf=(d:Date)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).toISOString()
  const endOf=(d:Date)=>new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59).toISOString()
  switch(key){
    case 'hoje':    return {from:startOf(now),to}
    case 'ontem':   {const y=new Date(now);y.setDate(y.getDate()-1);return {from:startOf(y),to:endOf(y)}}
    case '7d':      return {from:new Date(now.getTime()-7*86400000).toISOString(),to}
    case '15d':     return {from:new Date(now.getTime()-15*86400000).toISOString(),to}
    case '30d':     return {from:new Date(now.getTime()-30*86400000).toISOString(),to}
    case 'mes':     return {from:new Date(now.getFullYear(),now.getMonth(),1).toISOString(),to}
    case 'mespass': return {from:new Date(now.getFullYear(),now.getMonth()-1,1).toISOString(),to:new Date(now.getFullYear(),now.getMonth(),0,23,59,59).toISOString()}
    case 'ano':     return {from:new Date(now.getFullYear(),0,1).toISOString(),to}
    case 'custom':  return custom?{from:startOf(custom.from),to:endOf(custom.to)}:{from:startOf(now),to}
    default:        return {from:startOf(now),to}
  }
}
// Períodos cujo fim é AGORA — os únicos que ganham dado novo com o tempo e
// portanto os únicos que se auto-atualizam. 'ontem'/'mespass' estão fechados.
const PERIODOS_ABERTOS=new Set(['hoje','7d','15d','30d','mes','ano'])
function periodLabel(key:string, custom:{from:Date;to:Date}|null):string{
  const p=PRESETS.find(x=>x[0]===key); if(p) return p[1]
  if(key==='custom'&&custom) return `${custom.from.toLocaleDateString('pt-BR')} a ${custom.to.toLocaleDateString('pt-BR')}`
  return 'Selecione um período'
}
// Mapeia o período para a janela de ads cacheada no backend.
// 'ontem' agora bate com o dia anterior (antes caía em 'today' → mostrava o gasto
// parcial de hoje em vez do gasto real de ontem).
function adsWindow(key:string):string{
  const m:Record<string,string>={hoje:'today',ontem:'yesterday','7d':'7d','15d':'15d','30d':'30d',mes:'month',mespass:'lastmonth',ano:'year'}
  return m[key]||'30d'
}
/* ── Seletor de período (presets + calendário "Personalizado", estilo Gestor) ── */
const sameDay=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()
function menuItem(t:Theme,active:boolean):React.CSSProperties{
  return {display:'flex',alignItems:'center',gap:6,width:'100%',textAlign:'left' as const,background:active?t.pillGrn[0]:'transparent',border:'none',borderRadius:8,padding:'8px 10px',fontSize:12.5,fontFamily:FG,color:t.t1,cursor:'pointer',fontWeight:active?600:400}
}
function MiniCalendar({t,onPick}:{t:Theme;onPick:(from:Date,to:Date)=>void}){
  const today=new Date()
  const [view,setView]=useState({y:today.getFullYear(),m:today.getMonth()})
  const [start,setStart]=useState<Date|null>(null)
  const [end,setEnd]=useState<Date|null>(null)
  const monthName=new Date(view.y,view.m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})
  const firstDow=(new Date(view.y,view.m,1).getDay()+6)%7
  const daysInMonth=new Date(view.y,view.m+1,0).getDate()
  const cells:(Date|null)[]=[]
  for(let i=0;i<firstDow;i++) cells.push(null)
  for(let d=1;d<=daysInMonth;d++) cells.push(new Date(view.y,view.m,d))
  const click=(d:Date)=>{
    if(!start||end){ setStart(d); setEnd(null) }
    else if(d<start){ setEnd(start); setStart(d); onPick(d,start) }
    else { setEnd(d); onPick(start,d) }
  }
  const inRange=(d:Date)=> !!(start&&end&&d>=start&&d<=end)
  const isEdge=(d:Date)=> !!((start&&sameDay(d,start))||(end&&sameDay(d,end)))
  const nav=(delta:number)=>setView(v=>{let m=v.m+delta,y=v.y; if(m<0){m=11;y--} if(m>11){m=0;y++} return {y,m}})
  const navBtn:React.CSSProperties={background:'none',border:'none',color:t.t2,fontSize:18,cursor:'pointer',padding:'0 6px',lineHeight:1}
  return (<div style={{width:252}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
      <button onClick={()=>nav(-1)} style={navBtn}>‹</button>
      <span style={{fontFamily:FG,fontSize:13,fontWeight:600,color:t.t1,textTransform:'capitalize' as const}}>{monthName}</span>
      <button onClick={()=>nav(1)} style={navBtn}>›</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
      {['S','T','Q','Q','S','S','D'].map((w,i)=><div key={i} style={{textAlign:'center' as const,fontSize:10,color:t.t3,fontWeight:600}}>{w}</div>)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
      {cells.map((d,i)=> d? (
        <button key={i} onClick={()=>click(d)} style={{fontFamily:FG,fontSize:12,border:'none',borderRadius:6,padding:'6px 0',cursor:'pointer',
          background:isEdge(d)?t.grn:inRange(d)?t.pillGrn[0]:'transparent',
          color:isEdge(d)?(t.dark?'#0A0A14':'#fff'):t.t1,fontWeight:isEdge(d)?700:400}}>{d.getDate()}</button>
      ) : <div key={i}/>)}
    </div>
    <div style={{fontSize:10.5,color:t.t3,marginTop:6,fontFamily:FG}}>{!start?'Escolha a data inicial':!end?'Agora a data final':''}</div>
  </div>)
}
function PeriodPicker({value,custom,onChange}:{value:string;custom:{from:Date;to:Date}|null;onChange:(key:string,range:{from:Date;to:Date}|null)=>void}){
  const t=useT()
  const [open,setOpen]=useState(false)
  const [showCal,setShowCal]=useState(false)
  return (<div style={{position:'relative' as const}}>
    <button onClick={()=>{setOpen(o=>!o);setShowCal(false)}} style={{display:'flex',alignItems:'center',gap:8,justifyContent:'space-between',background:t.card,color:t.t1,border:`1px solid ${t.line}`,borderRadius:9,padding:'8px 12px',fontSize:12.5,fontFamily:FG,cursor:'pointer',minWidth:172}}>
      <span style={{display:'flex',alignItems:'center',gap:7}}><i className="ti ti-calendar" style={{fontSize:14,color:t.t3}} aria-hidden="true"/>{periodLabel(value,custom)}</span>
      <i className="ti ti-chevron-down" style={{fontSize:14,color:t.grn}} aria-hidden="true"/>
    </button>
    {open && <>
      <div onClick={()=>setOpen(false)} style={{position:'fixed' as const,inset:0,zIndex:40}}/>
      <div style={{position:'absolute' as const,top:'calc(100% + 6px)',right:0,zIndex:41,background:t.card,border:`1px solid ${t.line}`,borderRadius:12,boxShadow:'0 12px 32px rgba(0,0,0,0.35)',padding:6,minWidth:showCal?276:188}}>
        {!showCal ? <>
          {PRESETS.map(([k,lbl])=>(
            <button key={k} onClick={()=>{onChange(k,null);setOpen(false)}} style={menuItem(t,value===k)}>
              <span style={{width:16,display:'inline-flex'}}>{value===k&&<i className="ti ti-check" style={{fontSize:13,color:t.grn}} aria-hidden="true"/>}</span>{lbl}
            </button>
          ))}
          <button onClick={()=>setShowCal(true)} style={menuItem(t,value==='custom')}>
            <span style={{width:16,display:'inline-flex'}}>{value==='custom'&&<i className="ti ti-check" style={{fontSize:13,color:t.grn}} aria-hidden="true"/>}</span>Personalizado
          </button>
        </> : (
          <div style={{padding:4}}>
            <MiniCalendar t={t} onPick={(from,to)=>{onChange('custom',{from,to});setOpen(false);setShowCal(false)}}/>
            <button onClick={()=>setShowCal(false)} style={{...menuItem(t,false),color:t.t3,marginTop:4}}>‹ atalhos</button>
          </div>
        )}
      </div>
    </>}
  </div>)
}

// Converte os produtos reais (com nome/foto) em ProductMetrics p/ as abas Vendas/Curva ABC.
function realProductMetrics(realDre:any, costs:Record<string,number>, aliquota=0):ProductMetrics[]{
  const prods=realDre?.produtos||[]
  const recLiq=realDre?.linhas?.receitaLiquida||0
  const liqRatio=recLiq>0?(realDre.liqMarketplace||0)/recLiq:0   // rateia o líquido do marketplace por receita
  return prods.map((p:any)=>{
    const cost=costs[p.sku]||0, cmv=p.units*cost
    const tax=p.receita*(aliquota/100)                          // imposto = alíquota % sobre a receita
    const grossP=p.receita*liqRatio-cmv-tax
    const margin=p.receita>0?grossP/p.receita*100:0
    const roi=cmv>0?grossP/cmv*100:0
    return {id:p.sku,name:p.name||p.sku,sku:p.sku,asin:p.asin||'',image:p.image||'',units:p.units,price:p.units>0?p.receita/p.units:0,unitCost:cost,adsSpend:0,adsSales:0,refundUnits:0,stockFBA:0,bsr:0,revenue:p.receita,commission:0,fbaFee:0,cmv,tax,refundValue:0,grossProfit:grossP,acos:0,roas:0,margin,roi,coverageDays:0} as ProductMetrics
  })
}
function realAbc(metrics:ProductMetrics[]){
  const m=[...metrics].sort((a,b)=>b.revenue-a.revenue)
  const total=m.reduce((s,p)=>s+p.revenue,0)||1
  let cum=0
  return m.map(p=>{cum+=p.revenue;const sh=cum/total*100;return {...p,shareTotal:p.revenue/total*100,cls:(sh<=80?'A':sh<=95?'B':'C') as 'A'|'B'|'C'}})
}

/* ── Building blocks ─────────────────────────────────────────────────────── */
function Pill({kind,children}:{kind:'grn'|'gold'|'red';children:React.ReactNode}){
  const t=useT(); const [bg,fg] = kind==='grn'?t.pillGrn:kind==='gold'?t.pillGold:t.pillRed
  return <span style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:20,background:bg,color:fg,display:'inline-block'}}>{children}</span>
}
function Thumb({p}:{p:{id:string;image?:string;name:string}}){
  const pal=['#7C3AED','#E7B85C','#2FBE8F','#4F86C6','#F2685C','#9B8CFF','#0EA5E9','#F59E0B']
  const c=pal[parseInt(p.id||'0')%pal.length]
  if(p.image) return <img src={p.image} alt="" width={34} height={34} style={{borderRadius:8,objectFit:'cover',flexShrink:0,border:'1px solid rgba(0,0,0,0.06)'}}/>
  return <span aria-hidden style={{width:34,height:34,borderRadius:8,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:c+'22'}}><i className="ti ti-photo" style={{fontSize:16,color:c}}/></span>
}
function ProdCell({p}:{p:{id:string;image?:string;name:string;sku?:string}}){
  const t=useT()
  return(
    <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`}}>
      <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
        <Thumb p={p}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:12.5,fontWeight:500,color:t.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
          {p.sku&&<div style={{fontSize:10,color:t.t3,marginTop:1}}>{p.sku}</div>}
        </div>
      </div>
    </td>
  )
}
function NumTd({children,color,strong,hide}:{children:React.ReactNode;color?:string;strong?:boolean;hide?:boolean}){
  const t=useT()
  return <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,textAlign:'right',fontFamily:FG,fontWeight:strong?600:500,fontSize:13,color:color||t.t1,filter:hide?'blur(6px)':'none'}}>{children}</td>
}
function PillTd({children}:{children:React.ReactNode}){
  const t=useT(); return <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,textAlign:'right'}}>{children}</td>
}
function Table({head,children}:{head:{label:string;right?:boolean;w?:string}[];children:React.ReactNode}){
  const t=useT()
  return(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,overflow:'hidden'}}>
      {/* ora-tscroll: no mobile a tabela ganha min-width e rola horizontal (tableLayout
          fixed + width 100% esmagaria as colunas em telas estreitas) */}
      <div className="ora-tscroll" style={{overflowX:'auto' as const}}>
        <table style={{width:'100%',borderCollapse:'collapse' as const,tableLayout:'fixed' as const}}>
          <thead><tr style={{background:t.dark?'rgba(255,255,255,0.02)':'#FAFBFC'}}>
            {head.map((h,i)=><th key={i} style={{width:h.w,textAlign:h.right?'right':'left',padding:'10px 8px',fontSize:10.5,fontWeight:600,color:t.t3,textTransform:'uppercase' as const,letterSpacing:'0.04em'}}>{h.label}</th>)}
          </tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}
function Hint({children}:{children:React.ReactNode}){
  const t=useT()
  return <div style={{fontSize:12,color:t.t2,marginBottom:14,display:'flex',alignItems:'center',gap:7}}>
    <i className="ti ti-bulb" style={{fontSize:15,color:t.gold}} aria-hidden="true"/>{children}
  </div>
}
// Estado vazio quando o cliente ainda NÃO conectou a conta (evita mostrar mock como se fosse dele).
function ConnectEmpty({texto}:{texto?:string}){
  const t=useT()
  return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'30px 20px',textAlign:'center' as const,color:t.t3,fontSize:13,fontFamily:FG}}>
    <i className="ti ti-plug" style={{fontSize:26,color:t.gold,display:'block',marginBottom:10}} aria-hidden="true"/>
    {texto||'Conecte sua conta Amazon (no topo da Gestão) para ver seus dados reais aqui.'}
  </div>
}
function LoadingBox(){
  const t=useT()
  return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Carregando dados da Amazon…</div>
}

/* ── KPI ─────────────────────────────────────────────────────────────────── */
// Card de KPI no estilo Gestor Seller: centralizado, valor grande (Poppins),
// borda de acento colorida, ícone de info no canto. (delta/icon ignorados — layout limpo.)
function KPI({label,value,color,hide}:{label:string;value:string;delta?:string;up?:boolean;icon?:string;color:string;hide:boolean}){
  const t=useT()
  return(
    <div style={{background:t.card,border:`1.5px solid ${color}`,borderRadius:14,padding:'16px 14px 18px',textAlign:'center' as const,position:'relative' as const,minHeight:96,display:'flex',flexDirection:'column' as const,justifyContent:'center',boxShadow:'var(--elev1)'}}>
      <i className="ti ti-info-circle" style={{position:'absolute' as const,top:9,right:11,fontSize:14,color:t.t3,opacity:0.7}} aria-hidden="true"/>
      <div style={{fontFamily:FG,fontSize:12.5,color:t.t2,fontWeight:500,marginBottom:9,lineHeight:1.25}}>{label}</div>
      <div style={{fontFamily:FG,fontWeight:700,fontSize:25,letterSpacing:'-0.01em',color:t.t1,fontVariantNumeric:'tabular-nums',filter:hide?'blur(7px)':'none'}}>{value}</div>
    </div>
  )
}

/* ── DRE Real (dados ao vivo da conta Amazon) ────────────────────────────── */
// De onde veio o número de Comissão/FBA: valor REAL que a Amazon debitou (só existe
// pra pedido já faturado) ou estimativa por ASIN. Sem isso o seller não sabe se o
// líquido é o que a Amazon cobrou ou uma aproximação — e nós não conseguimos validar
// o híbrido, porque "flag desligada" e "período sem pedido faturado" davam a mesma tela.
function FeesOrigem({fees}:{fees?:any}){
  const t=useT()
  if(!fees)return null
  const {pedidosReais:reais=0,pedidosEstimados:est=0,flagLigada}=fees
  const txt=reais>0
    ?`Comissão/FBA: valores reais do repasse em ${reais} pedido${reais>1?'s':''}${est>0?` · estimados em ${est} (ainda não faturados)`:''}`
    :flagLigada
      ?'Comissão/FBA: estimados — nenhum pedido deste período foi faturado pela Amazon ainda'
      :'Comissão/FBA: estimados por ASIN'
  return <div style={{fontSize:10.5,color:reais>0?t.grn:t.t3,marginTop:8}}>{txt}</div>
}

function RealDRECard({data,hide,adsReal}:{data:any;hide:boolean;adsReal?:any}){
  const t=useT()
  const L=data.linhas||{}
  const Row=({label,val,sign,strong,color}:{label:string;val:number;sign?:'-'|'=';strong?:boolean;color?:string})=>(
    <div style={{display:'flex',justifyContent:'space-between',padding:'8px 2px',borderBottom:`1px solid ${t.line}`,fontSize:strong?14:13}}>
      <span style={{color:strong?t.t1:t.t2,fontWeight:strong?600:400}}>{sign==='='?'= ':sign==='-'?'(–) ':''}{label}</span>
      <span style={{color:color||t.t1,fontWeight:strong?700:500,fontFamily:FG,fontVariantNumeric:'tabular-nums',filter:hide?'blur(6px)':'none'}}>{brl(val||0)}</span>
    </div>
  )
  return(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderLeft:`3px solid ${t.grn}`,borderRadius:14,padding:'16px 18px',marginBottom:18}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap' as const}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:t.grn}}/>
        <span style={{fontSize:13.5,fontWeight:600,color:t.t1}}>DRE Real — sua conta Amazon</span>
        <span style={{fontSize:10.5,color:t.t3}}>· ao vivo da Finances API</span>
      </div>
      <Row label="Receita bruta" val={L.receitaBruta}/>
      <Row label="Devoluções" val={L.devolucoes} sign="-" color={t.red}/>
      <Row label="Receita líquida" val={L.receitaLiquida} sign="=" strong/>
      <Row label="Comissão Amazon" val={L.comissao} sign="-" color={t.red}/>
      <Row label="Taxa Amazon pra Todos" val={L.taxaPrograma} sign="-" color={t.red}/>
      <Row label="Tarifa FBA" val={L.fba} sign="-" color={t.red}/>
      {L.armazenagem>0 && <Row label="Armazenagem" val={L.armazenagem} sign="-" color={t.red}/>}
      <Row label="Assinatura" val={L.assinatura} sign="-" color={t.red}/>
      <Row label="Líq. do Marketplace" val={data.liqMarketplace} sign="=" strong color={t.grn}/>
      <Row label={adsReal?.ready?'Ads (Advertising API)':'Ads (parcial)'} val={adsReal?.ready?(Number(adsReal.spend)||0):L.ads} sign="-" color={t.red}/>
      <FeesOrigem fees={data.fees}/>
      <div style={{fontSize:10.5,color:t.t3,marginTop:10}}>{adsReal?.ready?'Ads real da Advertising API · CMV e despesas você informa em Gerenciamento.':'Ads completo virá da Advertising API · CMV e despesas você informa em Gerenciamento.'}</div>
    </div>
  )
}

/* ── Resumo ──────────────────────────────────────────────────────────────── */
// Preenche a série diária dia-a-dia no período (hoje como último), zero onde não houve venda.
const MES_ABR=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmtDM(ds:string){const p=ds.split('-');return `${p[2]} ${MES_ABR[(+p[1]||1)-1]}`}
function nextDay(ds:string){const dt=new Date(ds+'T00:00:00Z');dt.setUTCDate(dt.getUTCDate()+1);return dt.toISOString().slice(0,10)}
function fillDaily(daily:any[]=[],fromISO?:string,toISO?:string){
  const map:Record<string,number>={}; for(const d of daily) map[d.date]=d.receita
  const s=(fromISO||'').slice(0,10), e=(toISO||'').slice(0,10)
  if(!s||!e) return (daily||[]).map((d:any)=>({label:fmtDM(d.date),date:d.date,receita:d.receita}))
  const out:{label:string;date:string;receita:number}[]=[]; let cur=s, guard=0
  while(cur<=e && guard++<400){ out.push({label:fmtDM(cur),date:cur,receita:map[cur]||0}); cur=nextDay(cur) }
  return out
}
function Resumo({hide,realDre,cmv=0,adsReal,costs={},chart30,connected,adsConnected,imposto=0,onDetail}:{hide:boolean;realDre?:any;cmv?:number;adsReal?:any;costs?:Record<string,number>;chart30?:any;connected?:boolean|null;adsConnected?:boolean|null;imposto?:number;onDetail?:(p:any)=>void}){
  const t=useT()
  // (Removidos os KPIs/composição MOCK com deltas fabricados "+12,4%" etc. — eram
  // código morto: o render usa só RK.kpis (real), loadingKpis ou emptyKpis.)
  // ── KPIs e rosca REAIS quando conectado ──
  const RK = realDre ? (()=>{
    const L=realDre.linhas||{}
    // Ads "cheio" da Advertising API quando disponível; senão o parcial da Finances.
    const ads = adsReal?.ready ? (Number(adsReal.spend)||0) : (L.ads||0)
    const adsPending = adsConnected && !(adsReal?.ready)   // ads conectado mas ainda gerando relatório
    const fat=L.receitaBruta||0, liq=realDre.liqMarketplace||0   // Faturamento = BRUTO (devoluções são linha à parte)
    const vendas=realDre.vendas||0, unidades=realDre.unidades||0
    const ticket=vendas>0?fat/vendas:0, tacos=fat>0?ads/fat*100:0
    const lucroBruto=liq-cmv, lucroPosAds=lucroBruto-ads
    const margem=fat>0?lucroBruto/fat*100:0, roi=cmv>0?lucroBruto/cmv*100:0
    const mpa=fat>0?lucroPosAds/fat*100:0, cm=cmv>0, dash='—'
    return {
      kpis:[
        {label:'Faturamento',value:brl2(fat),icon:'ti-cash',color:t.vio},
        {label:'Líq. do Marketplace',value:brl2(liq),icon:'ti-building-bank',color:t.blue},
        {label:'Lucro Bruto',value:cm?brl2(lucroBruto):dash,icon:'ti-trending-up',color:t.grn},
        {label:'Margem',value:cm?pc(margem):dash,icon:'ti-percentage',color:t.grn},
        {label:'Número de Vendas',value:String(vendas),icon:'ti-shopping-cart',color:t.blue},
        {label:'Número de Unidades Vendidas',value:String(unidades),icon:'ti-package',color:t.blue},
        {label:'Ticket Médio',value:brl2(ticket),icon:'ti-receipt',color:t.grn},
        {label:'Retorno Sobre Investimento',value:cm?pc(roi):dash,icon:'ti-rotate-clockwise',color:t.grn},
        {label:'Valor em Ads',value:adsPending?'…':brl2(ads),icon:'ti-speakerphone',color:t.grn},
        {label:'TACOS',value:adsPending?'…':pc(tacos),icon:'ti-target',color:t.grn},
        {label:'Lucro bruto pós ADS',value:adsPending?'…':(cm?brl2(lucroPosAds):dash),icon:'ti-coin',color:t.grn},
        {label:'MPA',value:adsPending?'…':(cm?pc(mpa):dash),icon:'ti-chart-pie',color:t.grn},
      ],
      comp:[
        {name:'Lucro líquido',value:Math.max(0,Math.round(lucroPosAds)),color:t.grn},
        {name:'CMV',value:Math.round(cmv),color:t.vio},
        {name:'Comissão',value:Math.round(L.comissao||0),color:t.gold},
        {name:'Ads',value:Math.round(ads),color:t.red},
        {name:'FBA',value:Math.round(L.fba||0),color:t.blue},
        {name:'Outros',value:Math.round((L.taxaPrograma||0)+(L.armazenagem||0)+(L.assinatura||0)+(L.devolucoes||0)),color:t.t3},
      ].filter(x=>x.value>0),
    }
  })() : null
  // Cards-base (labels + cor de acento). Viram esqueleto "…" (carregando) ou "—" (não conectado).
  const KPI_BASE = [
    {label:'Faturamento',color:t.vio},{label:'Líq. do Marketplace',color:t.blue},{label:'Lucro Bruto',color:t.grn},{label:'Margem',color:t.grn},
    {label:'Número de Vendas',color:t.blue},{label:'Número de Unidades Vendidas',color:t.blue},{label:'Ticket Médio',color:t.grn},{label:'Retorno Sobre Investimento',color:t.grn},
    {label:'Valor em Ads',color:t.grn},{label:'TACOS',color:t.grn},{label:'Lucro bruto pós ADS',color:t.grn},{label:'MPA',color:t.grn},
  ]
  const loadingKpis = KPI_BASE.map(k=>({...k,value:'…'}))
  // NÃO conectado → tudo zerado ("—"), NUNCA o mock (evita o cliente achar que é a conta dele).
  const emptyKpis = KPI_BASE.map(k=>({...k,value:'—'}))
  const shownKpis:any[] = RK ? RK.kpis : (connected ? loadingKpis : emptyKpis)
  // Gráfico: SEMPRE 30 dias por data (não muda com o filtro de período) — igual ao Gestor.
  const cSrc = chart30 || realDre
  const realChart = !!cSrc?.daily
  const netRatio = cSrc && (cSrc.linhas?.receitaBruta||0)>0 ? (cSrc.liqMarketplace||0)/(cSrc.linhas.receitaBruta) : 0
  const chartData:any[] = realChart
    ? fillDaily(cSrc.daily,cSrc.period?.from,cSrc.period?.to).map((x:any)=>({...x,lucro:Math.round(x.receita*netRatio*100)/100}))
    : []   // não conectado / carregando → gráfico vazio (sem mock)
  const chartXKey = 'label'
  // Top 15 produtos vendidos no período (real) com métricas por produto (estilo Gestor).
  const L = realDre?.linhas||{}
  const fatTot = realDre ? (L.receitaBruta||0) : 0
  const feesTot = (L.comissao||0)+(L.fba||0)+(L.taxaPrograma||0)+(L.armazenagem||0)+(L.assinatura||0)+(L.outrasTaxas||0)
  const adsTot = adsReal?.ready ? (Number(adsReal.spend)||0) : 0
  const top15 = realDre?.produtos ? (realDre.produtos as any[]).slice(0,15).map(p=>{
    const receita=p.receita||0, units=p.units||0
    const preco=units>0?receita/units:0
    const custoU=costs[p.sku]||0, cmvP=custoU*units
    const repres=fatTot>0?receita/fatTot*100:0
    const share=fatTot>0?receita/fatTot:0
    const impP=receita*(imposto/100)                       // imposto = alíquota % sobre a receita
    const lucro=receita-cmvP-feesTot*share-impP            // lucro bruto (antes de ads)
    const margem=receita>0?lucro/receita*100:0
    const custoAds=adsTot*share
    const lucroPos=lucro-custoAds
    const mpa=receita>0?lucroPos/receita*100:0
    return {p,receita,units,preco,custoU,repres,lucro,margem,custoAds,lucroPos,mpa}
  }) : []
  return(<>
    {/* 1) KPIs — cards estilo Gestor, 4 por linha */}
    <div className="ora-kpis" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:13,marginBottom:16}}>
      {shownKpis.map((k:any,i:number)=><KPI key={i} {...k} hide={hide}/>)}
    </div>
    {/* 2) Gráfico de receitas — sempre 30 dias por data, largura cheia */}
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'16px 18px',marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontFamily:FG,fontSize:15,fontWeight:600,color:t.t1}}>Resumo de Receitas</span>
        <span style={{fontFamily:FG,fontSize:11,color:t.t3}}>{realChart?'últimos 30 dias':'período selecionado'}</span>
      </div>
      <div style={{height:300}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{top:6,right:10,left:0,bottom:0}}>
            <defs>
              <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.vio} stopOpacity={0.34}/><stop offset="100%" stopColor={t.vio} stopOpacity={0.02}/></linearGradient>
              <linearGradient id="gLucro" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.grn} stopOpacity={0.3}/><stop offset="100%" stopColor={t.grn} stopOpacity={0.02}/></linearGradient>
            </defs>
            <CartesianGrid stroke={t.grid} vertical={false}/>
            <XAxis dataKey={chartXKey} tick={{fill:t.t3,fontSize:11,fontFamily:FG}} tickLine={false} axisLine={{stroke:t.line}} interval="preserveStartEnd" minTickGap={28} tickMargin={8}/>
            <YAxis tick={{fill:t.t3,fontSize:10.5,fontFamily:FG}} tickLine={false} axisLine={false} width={82} tickFormatter={(v:number)=>'R$ '+Math.round(v).toLocaleString('pt-BR')}/>
            <RTooltip contentStyle={{background:t.tipBg,border:`1px solid ${t.line2}`,borderRadius:10,fontSize:12,color:t.t1,fontFamily:FG}} labelStyle={{color:t.t3,fontWeight:600,marginBottom:4}} formatter={(v:any,n:any)=>[brl2(Number(v)),n]}/>
            <Area type="monotone" dataKey="receita" name="Receita" stroke={t.vio} strokeWidth={2.4} fill="url(#gReceita)" dot={false} activeDot={{r:4}}/>
            {realChart && <Area type="monotone" dataKey="lucro" name="Lucro líquido" stroke={t.grn} strokeWidth={2.4} fill="url(#gLucro)" dot={false} activeDot={{r:4}}/>}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    {/* 3) Top 15 produtos vendidos */}
    {(realDre || connected) && (
      <div>
        <div style={{fontFamily:FG,fontSize:15,fontWeight:600,color:t.t1,marginBottom:10}}>Top 15 produtos vendidos</div>
        {!realDre ? (
          <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Carregando produtos da Amazon…</div>
        ) : top15.length===0 ? (
          <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5}}>Nenhuma venda no período selecionado.</div>
        ) : (
          <Table head={[
            {label:'Produto',w:'24%'},{label:'Preço méd.',right:true},{label:'Custo un.',right:true},{label:'Unid.',right:true},
            {label:'Faturado',right:true},{label:'Repres.',right:true},{label:'Lucro',right:true},{label:'Margem',right:true},
            {label:'Custo Ads',right:true},{label:'Lucro pós ADS',right:true},{label:'MPA',right:true},{label:'',right:true},
          ]}>
            {top15.map((r,i)=>(
              <tr key={i}>
                <ProdCell p={{id:r.p.sku,image:r.p.image,name:r.p.name||r.p.sku,sku:r.p.sku}}/>
                <NumTd hide={hide}>{brl2(r.preco)}</NumTd>
                <NumTd color={r.custoU>0?t.t1:t.t3} hide={hide}>{r.custoU>0?brl2(r.custoU):'—'}</NumTd>
                <NumTd>{r.units}</NumTd>
                <NumTd strong hide={hide}>{brl2(r.receita)}</NumTd>
                <NumTd color={t.t2}>{r.repres.toFixed(1).replace('.',',')}%</NumTd>
                <NumTd color={r.custoU>0?(r.lucro>=0?t.grn:t.red):t.t3} hide={hide}>{r.custoU>0?brl2(r.lucro):'—'}</NumTd>
                <PillTd>{r.custoU>0?<Pill kind={r.margem>20?'grn':r.margem>0?'gold':'red'}>{pc(r.margem)}</Pill>:<span style={{fontSize:10.5,color:t.t3}}>—</span>}</PillTd>
                <NumTd color={r.custoAds>0?t.t1:t.t3} hide={hide}>{r.custoAds>0?brl2(r.custoAds):'—'}</NumTd>
                <NumTd color={r.custoU>0?(r.lucroPos>=0?t.grn:t.red):t.t3} hide={hide}>{r.custoU>0?brl2(r.lucroPos):'—'}</NumTd>
                <PillTd>{r.custoU>0?<Pill kind={r.mpa>15?'grn':r.mpa>0?'gold':'red'}>{pc(r.mpa)}</Pill>:<span style={{fontSize:10.5,color:t.t3}}>—</span>}</PillTd>
                <PillTd><ZoomBtn onClick={()=>onDetail?.(r.p)}/></PillTd>
              </tr>
            ))}
          </Table>
        )}
        <div style={{fontFamily:FG,fontSize:10.5,color:t.t3,marginTop:8}}>Informe o custo (CMV) na aba Gerenciamento para ver lucro, margem e MPA. Comissão/FBA/ads rateados por faturamento.</div>
      </div>
    )}
  </>)
}

/* ── Abas tabulares ─────────────────────────────────────────────────────── */
function Vendas({realM,mockM,hide,connected,onDetail}:{realM?:ProductMetrics[]|null;mockM?:ProductMetrics[];hide:boolean;connected?:boolean|null;onDetail?:(p:any)=>void}){
  const t=useT()
  void mockM   // nunca renderiza mock — só dado real (evita produtos fabricados)
  if(connected===false) return <ConnectEmpty/>
  if(!realM) return <LoadingBox/>
  const rows=[...realM].sort((a,b)=>b.revenue-a.revenue)
  return(<>
    <Hint>Ranking por receita. Clique na 🔍 pra ver tudo que é descontado (comissão, FBA, ads, imposto, custo) até a margem final — e os pedidos daquele produto.</Hint>
    <Table head={[{label:'Produto',w:'46%'},{label:'Un.',right:true},{label:'Receita',right:true},{label:'Margem',right:true},{label:'',right:true}]}>
      {rows.map(p=><tr key={p.id}><ProdCell p={p}/><NumTd>{p.units}</NumTd><NumTd strong hide={hide}>{brl2(p.revenue)}</NumTd><PillTd>{p.unitCost>0?<Pill kind={p.margin>20?'grn':p.margin>0?'gold':'red'}>{pc(p.margin)}</Pill>:<span style={{fontSize:10.5,color:t.t3}}>—</span>}</PillTd><PillTd><ZoomBtn onClick={()=>onDetail?.({sku:p.sku,name:p.name,image:p.image,asin:p.asin})}/></PillTd></tr>)}
    </Table>
  </>)
}
// Botão lupinha (abre o detalhamento do produto).
function ZoomBtn({onClick}:{onClick:()=>void}){
  const t=useT()
  return(
    <button onClick={onClick} title="Ver detalhamento" style={{width:30,height:30,borderRadius:8,border:`1px solid ${t.line2}`,background:t.dark?'rgba(255,255,255,0.04)':'#FFFFFF',color:t.t2,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <i className="ti ti-zoom-money" style={{fontSize:15}}/>
    </button>
  )
}

/* ── Modal de detalhamento do produto (lupinha estilo Gestor) ─────────────── */
// Mostra TUDO que é descontado (comissão, FBA, ads, imposto, custo) → margem final,
// no agregado do período + a lista dos pedidos daquele produto (do Espelho Local).
// Todos os rateios usam share de faturamento — reconcilia com o Top 15 e a DRE.
function ProdutoDetalhe({produto,realDre,adsReal,costs,imposto,hide,onClose}:{produto:{sku:string;name:string;image?:string;asin?:string};realDre:any;adsReal?:any;costs:Record<string,number>;imposto:number;hide:boolean;onClose:()=>void}){
  const t=useT()
  const [orders,setOrders]=useState<any|null>(null)
  const p=(realDre?.produtos||[]).find((x:any)=>x.sku===produto.sku)
  const from=realDre?.period?.from, to=realDre?.period?.to

  useEffect(()=>{
    const esc=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    document.addEventListener('keydown',esc)
    return ()=>document.removeEventListener('keydown',esc)
  },[onClose])
  useEffect(()=>{
    let alive=true; setOrders(null)
    const qs=new URLSearchParams({sku:produto.sku}); if(from) qs.set('from',from); if(to) qs.set('to',to)
    fetch(`/api/amazon/orders?${qs}`).then(r=>r.json()).then(d=>{ if(alive) setOrders(d) }).catch(()=>{ if(alive) setOrders({available:false}) })
    return ()=>{ alive=false }
  },[produto.sku,from,to])

  const L=realDre?.linhas||{}
  const fatTot=L.receitaBruta||0
  const feesTot=(L.comissao||0)+(L.fba||0)+(L.taxaPrograma||0)+(L.armazenagem||0)+(L.assinatura||0)+(L.outrasTaxas||0)
  const adsTot=adsReal?.ready?(Number(adsReal.spend)||0):0
  const receita=p?.receita||0, units=p?.units||0
  const share=fatTot>0?receita/fatTot:0
  const custoU=costs[produto.sku]||0, cmvP=custoU*units
  // Decompõe o feesTot do produto em comissão/FBA proporcionais (só p/ exibir separado).
  const comShare=feesTot>0?(L.comissao||0)/feesTot:0
  const fbaShare=feesTot>0?((L.fba||0)+(L.taxaPrograma||0))/feesTot:0
  const outShare=1-comShare-fbaShare
  const feesP=feesTot*share
  const comissaoP=feesP*comShare, fbaP=feesP*fbaShare, outrosP=feesP*outShare
  const adsP=adsTot*share
  const impP=receita*(imposto/100)
  const liqMkt=receita-feesP
  const lucro=receita-feesP-adsP-impP-cmvP
  const margem=receita>0?lucro/receita*100:0
  const temCusto=custoU>0

  const Row=({label,val,sign,strong,color}:{label:string;val:number;sign?:'-'|'=';strong?:boolean;color?:string;hide?:boolean})=>(
    <div style={{display:'flex',justifyContent:'space-between',padding:'8px 2px',borderBottom:`1px solid ${t.line}`,fontSize:strong?14:13}}>
      <span style={{color:strong?t.t1:t.t2,fontWeight:strong?600:400}}>{sign==='='?'= ':sign==='-'?'(–) ':''}{label}</span>
      <span style={{color:color||t.t1,fontWeight:strong?700:500,fontFamily:FG,fontVariantNumeric:'tabular-nums',filter:hide?'blur(6px)':'none'}}>{brl2(val||0)}</span>
    </div>
  )
  const card:React.CSSProperties={background:t.card,border:`1px solid ${t.line}`,borderRadius:16,width:'min(760px,96vw)',maxHeight:'92vh',overflowY:'auto',padding:'20px 22px',boxShadow:'0 24px 70px rgba(0,0,0,0.35)'}
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'4vh 12px',backdropFilter:'blur(2px)'}}>
      <div onClick={e=>e.stopPropagation()} style={card}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:16}}>
          <Thumb p={{id:produto.sku,name:produto.name,image:produto.image}}/>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:14.5,fontWeight:600,color:t.t1,lineHeight:1.3}}>{produto.name}</div>
            <div style={{fontSize:10.5,color:t.t3,marginTop:2}}>SKU {produto.sku}{produto.asin?` · ASIN ${produto.asin}`:''}{from&&to?` · ${from.slice(0,10).split('-').reverse().join('/')} a ${to.slice(0,10).split('-').reverse().join('/')}`:''}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:t.t3,fontSize:22,cursor:'pointer',lineHeight:1,padding:0}} title="Fechar">×</button>
        </div>

        {/* Waterfall — tudo que é descontado até a margem final */}
        <div style={{background:t.dark?'rgba(255,255,255,0.02)':'#FAFBFC',border:`1px solid ${t.line}`,borderRadius:12,padding:'14px 16px',marginBottom:16}}>
          <Row label={`Faturado (${units} un.)`} val={receita} strong hide={hide}/>
          <Row label="Comissão Amazon" val={comissaoP} sign="-" color={t.red} hide={hide}/>
          <Row label="Taxa FBA" val={fbaP} sign="-" color={t.red} hide={hide}/>
          {outrosP>0.005 && <Row label="Outras taxas" val={outrosP} sign="-" color={t.red} hide={hide}/>}
          <Row label="Líq. do Marketplace" val={liqMkt} sign="=" strong color={t.grn} hide={hide}/>
          <Row label={adsReal?.ready?'Ads (Advertising API)':'Ads (parcial)'} val={adsP} sign="-" color={t.red} hide={hide}/>
          {imposto>0 && <Row label={`Imposto (${pc(imposto)})`} val={impP} sign="-" color={t.red} hide={hide}/>}
          <Row label="Custo do produto (CMV)" val={cmvP} sign="-" color={temCusto?t.red:t.t3} hide={hide}/>
          <div style={{height:1,background:t.line,margin:'8px 0'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:13.5,fontWeight:700,color:t.t1}}>Lucro do período</span>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {temCusto&&<Pill kind={margem>20?'grn':margem>0?'gold':'red'}>{pc(margem)}</Pill>}
              <span style={{fontSize:15,fontWeight:700,fontFamily:FG,color:temCusto?(lucro>=0?t.grn:t.red):t.t3,filter:hide?'blur(6px)':'none'}}>{temCusto?brl2(lucro):'informe o custo'}</span>
            </div>
          </div>
        </div>
        {!temCusto && <div style={{fontSize:10.5,color:t.t3,marginBottom:14}}>Informe o custo (CMV) deste produto na aba <b>Gerenciamento</b> pra ver o lucro e a margem finais.</div>}

        {/* Lista de pedidos do produto (Espelho Local) */}
        <div style={{fontSize:12.5,fontWeight:600,color:t.t1,marginBottom:8}}>Pedidos deste produto</div>
        {orders===null ? (
          <div style={{color:t.t3,fontSize:12,fontFamily:FG,padding:'12px 0'}}>Carregando pedidos…</div>
        ) : !orders.available ? (
          <div style={{color:t.t3,fontSize:11.5,fontFamily:FG,padding:'10px 0'}}>Detalhe por pedido {orders.reason==='demo'?'não disponível na conta demo':'sincronizando — disponível em instantes'}.</div>
        ) : (orders.orders||[]).length===0 ? (
          <div style={{color:t.t3,fontSize:11.5,fontFamily:FG,padding:'10px 0'}}>Nenhum pedido deste produto no período.</div>
        ) : (
          <Table head={[{label:'Data',w:'20%'},{label:'Un.',right:true},{label:'Total',right:true},{label:'Líq. Mkt',right:true},...(imposto>0?[{label:'Imposto',right:true}]:[]),{label:'Custo',right:true},{label:'Lucro',right:true},{label:'Margem',right:true}]}>
            {(orders.orders||[]).map((o:any,i:number)=>{
              // Pedido pendente: a Amazon segura o valor até confirmar (pagamento+envio).
              // Não computa custo/lucro contra receita 0 — mostra "—" e o selo Pendente
              // (evita "prejuízo" fantasma de −CMV). Igual ao Gestor, que zera tudo.
              const pend=/pending/i.test(o.status||'') || (o.receita||0)<=0
              const rShare=receita>0?o.receita/receita:0        // rateia os custos do produto por receita do pedido
              const oFees=feesP*rShare, oAds=adsP*rShare, oImp=o.receita*(imposto/100), oCmv=custoU*o.qty
              const oLiq=o.receita-oFees
              const oLucro=o.receita-oFees-oAds-oImp-oCmv
              const oMarg=o.receita>0?oLucro/o.receita*100:0
              const dash=<span style={{fontSize:11,color:t.t3}}>—</span>
              return(
                <tr key={i}>
                  <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,fontSize:11.5,color:t.t2}}>
                    <div>{o.date?.slice(0,10).split('-').reverse().join('/')}</div>
                    <div style={{fontSize:9.5,color:pend?t.gold:t.t3}}>{o.channel==='AFN'?'FBA':'FBM'}{pend?' · Pendente':''}</div>
                  </td>
                  <NumTd>{o.qty}</NumTd>
                  <NumTd strong hide={hide}>{pend?dash:brl2(o.receita)}</NumTd>
                  <NumTd color={t.t2} hide={hide}>{pend?dash:brl2(oLiq)}</NumTd>
                  {imposto>0 && <NumTd color={t.red} hide={hide}>{pend?dash:brl2(oImp)}</NumTd>}
                  <NumTd color={temCusto?t.t1:t.t3} hide={hide}>{pend?dash:(temCusto?brl2(oCmv):'—')}</NumTd>
                  <NumTd color={temCusto?(oLucro>=0?t.grn:t.red):t.t3} hide={hide}>{pend?dash:(temCusto?brl2(oLucro):'—')}</NumTd>
                  <PillTd>{pend?<Pill kind="gold">Pendente</Pill>:(temCusto?<Pill kind={oMarg>20?'grn':oMarg>0?'gold':'red'}>{pc(oMarg)}</Pill>:dash)}</PillTd>
                </tr>
              )
            })}
          </Table>
        )}
        <div style={{fontSize:10,color:t.t3,marginTop:10}}>Comissão, FBA e ads rateados por participação na receita. Pedidos <b>Pendentes</b> ainda não têm valor liberado pela Amazon (aguardam confirmação) — entram no cálculo quando o pedido é faturado. Imposto e custo (CMV) conforme o que você informou em Gerenciamento.</div>
      </div>
    </div>
  )
}

const clsColor=(t:Theme,cls:string)=> cls==='A'?t.grn:cls==='B'?t.blue:cls==='C'?t.gold:t.t3
function ClassBadge({t,cls}:{t:Theme;cls:string}){
  const c=clsColor(t,cls)
  return <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:26,height:26,borderRadius:'50%',background:c+'22',color:c,fontWeight:700,fontSize:12,fontFamily:FG}}>{cls}</span>
}
function CurvaABC({realDre,costs={},adsReal,inv,connected,mockD,hide}:{realDre?:any;costs?:Record<string,number>;adsReal?:any;inv?:any;connected?:boolean|null;mockD?:ReturnType<typeof abcCurve>;hide:boolean}){
  const t=useT()
  if(connected && !realDre) return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Carregando dados da Amazon…</div>
  if(realDre){
    const L=realDre.linhas||{}
    const fat=L.receitaBruta||0
    const feesTot=(L.comissao||0)+(L.fba||0)+(L.taxaPrograma||0)+(L.armazenagem||0)+(L.assinatura||0)+(L.outrasTaxas||0)
    const adsTot=adsReal?.ready?(Number(adsReal.spend)||0):0
    const sorted=[...(realDre.produtos||[])].sort((a:any,b:any)=>b.receita-a.receita)
    // Classificação ABC (cumulativa, inclui o produto que cruza o limiar — corrige o dominante virar A)
    let cum=0, aDone=false, bDone=false
    const rows=sorted.map((p:any)=>{
      cum+=p.receita; const sh=fat>0?cum/fat*100:0
      let cls:'A'|'B'|'C'; if(!aDone){cls='A'; if(sh>=80)aDone=true} else if(!bDone){cls='B'; if(sh>=95)bDone=true} else cls='C'
      const share=fat>0?p.receita/fat:0
      const cmv=(costs[p.sku]||0)*p.units
      const temCusto=(costs[p.sku]||0)>0
      const lucroBruto=p.receita-cmv-feesTot*share
      const lucroPos=lucroBruto-adsTot*share
      const mpa=p.receita>0?lucroPos/p.receita*100:0
      return {p,units:p.units,receita:p.receita,cls,lucroBruto,lucroPos,mpa,temCusto}
    })
    // Curva Z = produtos com estoque FBA mas SEM giro (0 vendas no período)
    const sold=new Set(sorted.map((p:any)=>p.sku))
    const zItems=(inv?.inventario||[]).filter((it:any)=>it.total>0 && !sold.has(it.sku))
    const agg=(cls:string)=>{
      const its=rows.filter(r=>r.cls===cls)
      return {count:its.length,units:its.reduce((s,r)=>s+r.units,0),fat:its.reduce((s,r)=>s+r.receita,0),
        lb:its.reduce((s,r)=>s+r.lucroBruto,0),lp:its.reduce((s,r)=>s+r.lucroPos,0),hasCusto:its.some(r=>r.temCusto)}
    }
    const cards=[
      {cls:'A',...agg('A')},{cls:'B',...agg('B')},{cls:'C',...agg('C')},
      {cls:'Z',count:zItems.length,units:0,fat:0,lb:0,lp:0,hasCusto:false},
    ]
    const Row=({label,value,color}:{label:string;value:string;color?:string})=>(
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'5px 0',borderTop:`1px solid ${t.line}`,fontSize:12}}>
        <span style={{color:t.t2,fontFamily:FG}}>{label}</span>
        <span style={{color:color||t.t1,fontWeight:600,fontFamily:FG,filter:hide?'blur(5px)':'none'}}>{value}</span>
      </div>
    )
    return(<>
      <Hint>Curva A ≈ 80% do faturamento · B ≈ 15% · C ≈ resto · Z = em estoque sem giro. Foca estoque e ads nos produtos A.</Hint>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:13,marginBottom:18}}>
        {cards.map(c=>{
          const color=clsColor(t,c.cls)
          const lbPct=c.fat>0?c.lb/c.fat*100:0, lpPct=c.fat>0?c.lp/c.fat*100:0
          return(
            <div key={c.cls} style={{background:t.card,border:`1px solid ${t.line}`,borderTop:`3px solid ${color}`,borderRadius:14,padding:'14px 16px 12px'}}>
              <div style={{textAlign:'center' as const,fontFamily:FG,fontSize:18,fontWeight:700,color:t.t1,marginBottom:10}}>Curva {c.cls}</div>
              <Row label="Unidades Vendidas" value={String(c.units)}/>
              <Row label="Produtos diferentes" value={String(c.count)}/>
              <Row label="Faturamento" value={brl2(c.fat)}/>
              <Row label="Lucro Bruto" value={c.hasCusto?`${brl2(c.lb)} (${pc(lbPct)})`:'—'} color={c.hasCusto?(c.lb>=0?t.grn:t.red):t.t3}/>
              <Row label="Lucro Pós Ads" value={c.hasCusto?`${brl2(c.lp)} (${pc(lpPct)})`:'—'} color={c.hasCusto?(c.lp>=0?t.grn:t.red):t.t3}/>
            </div>
          )
        })}
      </div>
      <Table head={[{label:'Produto',w:'34%'},{label:'Unid. vendidas',right:true},{label:'Fat. total',right:true},{label:'Lucro',right:true},{label:'Lucro pós Ads',right:true},{label:'MPA',right:true},{label:'Curva',right:true}]}>
        {rows.map((r,i)=>(
          <tr key={i}>
            <ProdCell p={{id:r.p.sku,image:r.p.image,name:r.p.name||r.p.sku,sku:r.p.sku}}/>
            <NumTd>{r.units}</NumTd>
            <NumTd strong hide={hide}>{brl2(r.receita)}</NumTd>
            <NumTd color={r.temCusto?(r.lucroBruto>=0?t.grn:t.red):t.t3} hide={hide}>{r.temCusto?brl2(r.lucroBruto):'—'}</NumTd>
            <NumTd color={r.temCusto?(r.lucroPos>=0?t.grn:t.red):t.t3} hide={hide}>{r.temCusto?brl2(r.lucroPos):'—'}</NumTd>
            <PillTd>{r.temCusto?<Pill kind={r.mpa>15?'grn':r.mpa>0?'gold':'red'}>{pc(r.mpa)}</Pill>:<span style={{fontSize:11,color:t.t3}}>—</span>}</PillTd>
            <PillTd><ClassBadge t={t} cls={r.cls}/></PillTd>
          </tr>
        ))}
      </Table>
      <div style={{fontFamily:FG,fontSize:10.5,color:t.t3,marginTop:8}}>Lucro/MPA usam o custo (CMV) informado em Gerenciamento + comissão/FBA/ads rateados por faturamento.</div>
    </>)
  }
  // Não conectado → vazio (sem mock). (mockD ignorado de propósito.)
  void mockD
  return <ConnectEmpty/>
}
/* Gerenciador de campanhas — SÓ ADMIN, em teste.
   ⚠️ ALTERA GASTO REAL DE ANÚNCIO. Toda alteração passa por confirmação e vai
   pra tabela de auditoria no backend. Mostra TODAS as campanhas (a aba Ads
   mostra só quem teve gasto na janela; aqui vêm as pausadas também). */
// ⭐ ACOS SE COMPARA COM A MARGEM, não com um número fixo (correção do João).
// ACOS é a fatia da venda que foi pro anúncio; margem é o que sobrava antes dele.
// Margem 20% com ACOS 25% = prejuízo de 5 pontos — mesmo sendo "só 25%".
// Régua fixa só quando a margem é desconhecida (CMV não cadastrado).
const ACOS_CRITICO_SEM_MARGEM=30, ACOS_ATENCAO_SEM_MARGEM=20
// Quanto da margem o ACOS pode comer antes de virar alerta amarelo.
const FATIA_ATENCAO=0.7
// Piso de gasto pra opinar. Recomendar "pause" numa campanha que gastou R$1,77
// é conselho ruim — ela mal foi testada. Abaixo disto o NEO fica calado, que é
// mais honesto que palpitar com dado insuficiente.
const GASTO_MINIMO_P_OPINAR=20

/** Cruza desempenho (relatório: nome+gasto+vendas) com gestão (id+estado) e devolve
 *  o que merece decisão. Só campanha ATIVA — sugerir pausar o que já está pausado é ruído.
 *  `margem` (%) = régua real do seller; null quando não dá pra saber. */
function recomendacoes(byCampaign:any[], campanhas:any[], margem:number|null){
  const critico = margem!=null ? margem : ACOS_CRITICO_SEM_MARGEM
  const atencao = margem!=null ? margem*FATIA_ATENCAO : ACOS_ATENCAO_SEM_MARGEM
  const porNome=new Map(campanhas.map((c:any)=>[String(c.nome||'').trim().toLowerCase(),c]))
  const out:any[]=[]
  for(const r of (byCampaign||[])){
    const g=Number(r.spend)||0, v=Number(r.sales)||0
    if(g<GASTO_MINIMO_P_OPINAR) continue
    const c=porNome.get(String(r.campaign||'').trim().toLowerCase())
    if(!c||c.estado!=='ENABLED') continue
    const acos=v>0?(g/v)*100:null
    if(v<=0){
      out.push({c,g,v,acos,sev:'critico',txt:`gastou ${brl2(g)} e não vendeu nada`})
    } else if(acos!==null&&acos>=critico){
      // Diz o PREJUÍZO em pontos, não só o ACOS — é o número que decide.
      const perda=margem!=null?` — come ${(acos-margem).toFixed(0)} pontos além da sua margem de ${margem.toFixed(0)}%`:''
      out.push({c,g,v,acos,sev:'critico',txt:`ACOS de ${acos.toFixed(0)}%${perda}. ${brl2(g)} investidos pra ${brl2(v)} em vendas`})
    } else if(acos!==null&&acos>=atencao){
      const quanto=margem!=null?` — está comendo quase toda a margem de ${margem.toFixed(0)}%`:', acima da faixa saudável'
      out.push({c,g,v,acos,sev:'atencao',txt:`ACOS de ${acos.toFixed(0)}%${quanto}`})
    }
  }
  // Quem queima mais dinheiro primeiro — é a ordem em que vale decidir.
  return out.sort((a,b)=>(a.sev===b.sev?b.g-a.g:a.sev==='critico'?-1:1))
}

// Piso pra opinar numa PALAVRA (menor que o de campanha: aqui os valores são
// naturalmente menores, mas ainda precisa de gasto que signifique alguma coisa).
const GASTO_MINIMO_KW=5
// Corte máximo num passo. A conta pura pode mandar cair pra 1/3 do lance; cortar
// tanto de uma vez costuma matar a palavra (perde posição e para de aparecer).
// Metade por vez, duas rodadas se precisar — o NEO recalcula na próxima.
const CORTE_MAXIMO=0.5

/** Lance sugerido pra trazer o ACOS até a margem.
 *  Regra de três clássica: se o ACOS está 3x a margem, o lance precisa cair a ~1/3.
 *  Limitado por CORTE_MAXIMO e nunca abaixo de R$0,02 (mínimo da Amazon). */
function lanceSugerido(lance:number, acos:number, alvo:number):number{
  if(!(lance>0)||!(acos>0)||!(alvo>0)) return 0
  const ideal=lance*(alvo/acos)
  return Math.max(0.02,Math.round(Math.max(lance*CORTE_MAXIMO,ideal)*100)/100)
}

/** Painel de palavras-chave de UMA campanha: desempenho + lance + sugestão do NEO. */
function Keywords({campaignId,nome,margem}:{campaignId:string;nome:string;margem?:number|null}){
  const t=useT()
  const [kws,setKws]=useState<any[]|null>(null)
  const [erro,setErro]=useState<string|null>(null)
  const [gerando,setGerando]=useState(false)
  const [salvando,setSalvando]=useState<string|null>(null)
  const [rasc,setRasc]=useState<Record<string,string>>({})
  const alvo=margem??20   // sem CMV cadastrado, mira genérica de 20%

  const carregar=async()=>{
    setErro(null)
    try{
      const r=await fetch(`/api/admin/ads-keywords?campaignId=${encodeURIComponent(campaignId)}`)
      const d=await r.json()
      if(d.ok) setKws(d.keywords||[]); else setErro(d.erro||d.error||'falhou')
    }catch{ setErro('sem resposta do servidor') }
  }
  useEffect(()=>{ carregar() },[campaignId])   // eslint-disable-line react-hooks/exhaustive-deps

  async function gerar(){
    setGerando(true); setErro(null)
    try{
      const r=await fetch('/api/admin/ads-keywords',{method:'POST'})
      const d=await r.json()
      if(!d.ok) setErro(d.erro||'não deu pra gerar')
      await carregar()
    }catch{ setErro('sem resposta do servidor') }
    setGerando(false)
  }
  async function salvarLance(k:any, bid:number){
    if(!confirm(`Mudar o lance de "${k.texto}"\n\nDe R$ ${k.lance} para R$ ${bid}?\n\nIsso altera de verdade na Amazon.`)) return
    setSalvando(k.keywordId)
    try{
      const r=await fetch('/api/admin/ads-keywords',{method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({keywordId:k.keywordId,bid})})
      const d=await r.json()
      if(d.ok){ setKws(v=>(v||[]).map(x=>x.keywordId===k.keywordId?{...x,lance:bid}:x)); setRasc(v=>{const n={...v};delete n[k.keywordId];return n}) }
      else setErro(d.erro||d.error||'não foi aplicado')
    }catch{ setErro('sem resposta do servidor') }
    setSalvando(null)
  }

  const semDados=kws!==null&&kws.every(k=>k.gasto<=0)
  return(
    <div style={{padding:'10px 0 12px 14px',borderLeft:`2px solid ${t.line}`,marginLeft:4}}>
      {erro && <div style={{fontSize:11,color:t.red,marginBottom:8,wordBreak:'break-all' as const}}>{erro}</div>}
      {kws===null && <div style={{fontSize:11,color:t.t3}}>Carregando palavras…</div>}
      {kws!==null && kws.length===0 && <div style={{fontSize:11,color:t.t3}}>Nenhuma palavra-chave nesta campanha (pode ser segmentação automática).</div>}
      {semDados && kws.length>0 && (
        <div style={{fontSize:11,color:t.t3,marginBottom:8,lineHeight:1.5}}>
          Os lances estão aqui, mas o <b>desempenho por palavra</b> ainda não foi baixado.
          <button onClick={gerar} disabled={gerando} style={{marginLeft:8,padding:'3px 9px',borderRadius:6,cursor:gerando?'default':'pointer',fontFamily:'inherit',fontSize:10.5,fontWeight:700,border:`1px solid ${t.line}`,background:'transparent',color:t.t2}}>
            {gerando?'gerando… (minutos)':'baixar desempenho'}
          </button>
        </div>
      )}
      {(kws||[]).slice(0,25).map(k=>{
        const acos=k.vendas>0?(k.gasto/k.vendas)*100:null
        const opinavel=k.gasto>=GASTO_MINIMO_KW
        const ruim=opinavel&&(k.vendas<=0||(acos!==null&&acos>=alvo))
        const sug=ruim&&k.lance>0?(acos!==null?lanceSugerido(k.lance,acos,alvo):Math.max(0.02,Math.round(k.lance*CORTE_MAXIMO*100)/100)):0
        const val=rasc[k.keywordId]
        const mudou=val!=null&&val!==''&&Number(val)!==Number(k.lance)
        return(
          <div key={k.keywordId} style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap' as const,padding:'5px 0',borderTop:`1px solid ${t.line}`}}>
            <span style={{flex:'1 1 150px',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,fontSize:11.5,color:ruim?t.t1:t.t2}}>
              {ruim&&<span style={{color:t.red,marginRight:4}}>▲</span>}{k.texto}
              <span style={{color:t.t3,fontSize:9.5,marginLeft:5}}>{k.matchType}</span>
            </span>
            <span style={{fontFamily:FG,fontSize:10.5,color:t.t3,minWidth:96}}>{brl2(k.gasto)} → {brl2(k.vendas)}</span>
            <span style={{fontFamily:FG,fontSize:10.5,minWidth:52,color:acos===null?(k.gasto>0?t.red:t.t3):acos>=alvo?t.red:t.grn}}>
              {acos===null?(k.gasto>0?'sem venda':'—'):`${acos.toFixed(0)}%`}
            </span>
            <div style={{display:'flex',alignItems:'center',gap:3}}>
              <span style={{fontSize:10,color:t.t3}}>R$</span>
              <input value={val??String(k.lance??'')} onChange={e=>setRasc(v=>({...v,[k.keywordId]:e.target.value}))}
                inputMode="decimal" style={{width:52,padding:'3px 5px',borderRadius:5,border:`1px solid ${mudou?t.gold:t.line}`,background:'transparent',color:t.t1,fontSize:11,fontFamily:FG,outline:'none'}}/>
              {mudou && <button disabled={salvando===k.keywordId} onClick={()=>salvarLance(k,Number(val))}
                style={{padding:'3px 7px',borderRadius:5,cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700,border:`1px solid ${t.gold}`,background:'transparent',color:t.gold}}>ok</button>}
            </div>
            {sug>0&&sug<k.lance&&!mudou && (
              <button disabled={salvando===k.keywordId} onClick={()=>salvarLance(k,sug)}
                title={`ACOS ${acos?acos.toFixed(0)+'%':'sem venda'} contra alvo de ${alvo.toFixed(0)}%`}
                style={{padding:'3px 9px',borderRadius:5,cursor:'pointer',fontFamily:'inherit',fontSize:10,fontWeight:700,border:`1px solid rgba(240,180,41,0.45)`,background:'rgba(240,180,41,0.07)',color:t.gold}}>
                {salvando===k.keywordId?'…':`baixar p/ ${brl2(sug)}`}
              </button>
            )}
          </div>
        )
      })}
      {kws!==null&&kws.length>0 && (
        <div style={{fontSize:9.5,color:t.t3,marginTop:8,lineHeight:1.5}}>
          Alvo de ACOS: {alvo.toFixed(0)}%{margem!=null?' (sua margem)':' (genérico — cadastre o CMV pra afinar)'}. O lance sugerido usa regra de três (ACOS ÷ alvo), com corte de no máximo 50% por vez — cortar demais de uma vez costuma matar a palavra. Palavra com menos de {brl2(GASTO_MINIMO_KW)} gastos fica sem opinião.
        </div>
      )}
    </div>
  )
}

function AdsAdmin({margem}:{margem?:number|null}){
  const t=useT()
  const [st,setSt]=useState<{loading:boolean;data:any}|null>(null)
  // ⭐ O NEO analisa SEMPRE 30 DIAS, ignorando o seletor de período da tela.
  // Dois motivos: (1) em "Hoje" o gasto é de centavos e ele ficava mudo, então o
  // cliente nunca descobria que o NEO existe; (2) conselho sobre campanha precisa
  // de janela longa pra ser sério. O seletor é pra VER número; isto é diagnóstico.
  const [ads30,setAds30]=useState<any[]|null>(null)
  useEffect(()=>{
    let vivo=true
    fetch('/api/ads/report?window=30d').then(r=>r.json())
      .then(d=>{ if(vivo&&Array.isArray(d?.byCampaign)) setAds30(d.byCampaign) }).catch(()=>{})
    return ()=>{ vivo=false }
  },[])
  const [busca,setBusca]=useState('')
  const [salvando,setSalvando]=useState<string|null>(null)
  const [aviso,setAviso]=useState<{ok:boolean;txt:string}|null>(null)
  const [rascunho,setRascunho]=useState<Record<string,string>>({})   // orçamento sendo digitado
  const [aberta,setAberta]=useState<string|null>(null)               // campanha expandida (palavras)

  async function carregar(){
    setSt({loading:true,data:null}); setAviso(null)
    try{
      const r=await fetch('/api/admin/ads-campaigns')
      setSt({loading:false,data:await r.json()})
    }catch{ setSt({loading:false,data:{ok:false,erro:'sem resposta do servidor'}}) }
  }

  // Aplica no servidor e atualiza a linha na tela sem recarregar as 93.
  async function aplicar(c:any, patch:{state?:string;budget?:number}, confirmacao:string){
    if(!confirm(confirmacao)) return
    setSalvando(c.campaignId); setAviso(null)
    try{
      const r=await fetch('/api/admin/ads-campaign',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({campaignId:c.campaignId,...patch})})
      const d=await r.json()
      if(d.ok){
        setAviso({ok:true,txt:`${c.nome}: ${patch.state?`agora ${patch.state==='ENABLED'?'ativa':'pausada'}`:`orçamento ${brl2(patch.budget||0)}`}`})
        setSt(s=>s?{...s,data:{...s.data,campanhas:(s.data.campanhas||[]).map((x:any)=>x.campaignId===c.campaignId
          ?{...x,...(patch.state?{estado:patch.state}:{}),...(patch.budget!=null?{orcamento:patch.budget}:{})}:x)}}:s)
        setRascunho(v=>{ const n={...v}; delete n[c.campaignId]; return n })
      } else setAviso({ok:false,txt:d.erro||d.error||'não foi aplicado'})
    }catch{ setAviso({ok:false,txt:'sem resposta do servidor'}) }
    setSalvando(null)
  }

  // Carrega sozinho ao abrir a aba: as recomendações precisam do estado/ID que só
  // a API de gestão dá, e obrigar um clique antes esconderia justo o que importa.
  useEffect(()=>{ carregar() },[])   // eslint-disable-line react-hooks/exhaustive-deps

  const d=st?.data
  const todas:any[]=d?.campanhas||[]
  const recs=d?.ok&&ads30?recomendacoes(ads30,todas,margem??null):[]
  const vis=todas.filter(c=>!busca||String(c.nome||'').toLowerCase().includes(busca.toLowerCase()))
  const btn={padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:11.5,fontWeight:700,border:`1px solid ${t.line}`,background:'transparent',color:t.t2}

  return(
    <div style={{marginTop:18,padding:'14px 16px',borderRadius:12,border:`1px dashed ${t.line}`,background:'rgba(255,255,255,0.02)'}}>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',color:t.t3,textTransform:'uppercase' as const}}>Admin · gerenciar campanhas</span>
      <p style={{fontSize:11,color:t.t3,margin:'8px 0 0',lineHeight:1.5}}>
        Pausar/reativar e mudar orçamento diário — <b style={{color:t.gold}}>altera de verdade na Amazon</b>. Toda alteração é confirmada e registrada. Aqui aparecem <b>todas</b> as campanhas, inclusive as pausadas.
      </p>
      <button onClick={carregar} disabled={st?.loading} style={{...btn,marginTop:10,cursor:st?.loading?'default':'pointer'}}>
        {st?.loading?'Carregando…':todas.length?'Recarregar':'Carregar campanhas'}
      </button>

      {aviso && <div style={{marginTop:10,padding:'8px 11px',borderRadius:8,fontSize:11.5,lineHeight:1.5,
        background:aviso.ok?'rgba(52,211,153,0.10)':'rgba(248,113,113,0.10)',color:aviso.ok?t.grn:t.red}}>{aviso.txt}</div>}

      {d && !d.ok && (
        <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${t.line}`}}>
          <div style={{fontSize:12.5,color:t.red,fontWeight:600,marginBottom:6}}>✗ Não passou{d.status?` (HTTP ${d.status})`:''}</div>
          {d.dica && <div style={{fontSize:11.5,color:t.t2,marginBottom:8,lineHeight:1.5}}>{d.dica}</div>}
          <pre style={{fontFamily:FG,fontSize:10,color:t.t3,whiteSpace:'pre-wrap' as const,wordBreak:'break-all' as const,margin:0}}>{JSON.stringify(d.erro??d,null,2).slice(0,900)}</pre>
        </div>
      )}

      {/* ⭐ O NEO RECOMENDA — o que transforma o botão em conselho.
          Recomenda, o humano aprova: nunca aplica sozinho (é dinheiro real e a
          Amazon não tem "desfazer"). */}
      {d?.ok && recs.length>0 && (
        <div style={{marginTop:14,padding:'12px 14px',borderRadius:10,border:`1px solid rgba(240,180,41,0.28)`,background:'rgba(240,180,41,0.05)'}}>
          <div style={{fontSize:11.5,fontWeight:700,color:t.gold,marginBottom:2}}>O NEO olhou suas campanhas · últimos 30 dias</div>
          <div style={{fontSize:10.5,color:t.t3,marginBottom:10}}>{recs.length} pedem decisão. Nada é aplicado sem você clicar.</div>
          {recs.slice(0,6).map((r:any)=>(
            <div key={r.c.campaignId} style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' as const,padding:'7px 0',borderTop:`1px solid ${t.line}`}}>
              <span style={{fontSize:13,lineHeight:1,color:r.sev==='critico'?t.red:t.gold}}>{r.sev==='critico'?'▲':'●'}</span>
              <span style={{flex:'1 1 210px',minWidth:0,fontSize:11.5,color:t.t2,lineHeight:1.45}}>
                <b style={{color:t.t1}}>{r.c.nome}</b> — {r.txt}
              </span>
              {r.sev==='critico' && (
                <button disabled={salvando===r.c.campaignId}
                  onClick={()=>aplicar(r.c,{state:'PAUSED'},`PAUSAR "${r.c.nome}"?\n\n${r.txt}.\n\nIsso altera de verdade na Amazon.`)}
                  style={{padding:'5px 12px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700,border:`1px solid rgba(248,113,113,0.4)`,background:'transparent',color:t.red}}>
                  {salvando===r.c.campaignId?'…':'pausar'}
                </button>
              )}
            </div>
          ))}
          <div style={{fontSize:10,color:t.t3,marginTop:9,lineHeight:1.5}}>
            {margem!=null
              ? <>Régua: sua <b>margem é {margem.toFixed(0)}%</b> — ACOS acima disso vende no prejuízo. Reduzir o orçamento é alternativa mais branda que pausar.</>
              : <>⚠️ <b>Cadastre o custo (CMV) na aba Gerenciamento</b> — sem ele não dá pra saber sua margem, e ACOS só faz sentido comparado a ela. Enquanto isso uso a régua genérica ({ACOS_ATENCAO_SEM_MARGEM}% atenção, {ACOS_CRITICO_SEM_MARGEM}% prejuízo), que pode errar pro seu produto.</>}
            {' '}Campanha com menos de {brl2(GASTO_MINIMO_P_OPINAR)} gastos fica de fora — ainda não deu pra saber.
          </div>
        </div>
      )}
      {d?.ok && ads30 && recs.length===0 && (
        <div style={{marginTop:12,fontSize:11.5,color:t.grn,lineHeight:1.5}}>
          ✓ O NEO olhou os últimos 30 dias: nenhuma campanha ativa vendendo no prejuízo.
        </div>
      )}

      {d?.ok && (
        <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${t.line}`}}>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' as const,marginBottom:10}}>
            <span style={{fontSize:11.5,color:t.t2}}>{todas.length} campanha(s){vis.length!==todas.length?` · ${vis.length} no filtro`:''}</span>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="filtrar por nome…"
              style={{marginLeft:'auto',padding:'6px 10px',borderRadius:8,border:`1px solid ${t.line}`,background:'transparent',color:t.t1,fontSize:11.5,fontFamily:'inherit',outline:'none',minWidth:170}}/>
          </div>
          {vis.slice(0,40).map((c:any)=>{
            const ativa=c.estado==='ENABLED'
            const val=rascunho[c.campaignId]
            const mudou=val!=null&&val!==''&&Number(val)!==Number(c.orcamento)
            return(
              <div key={c.campaignId}>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' as const,padding:'7px 0',borderTop:`1px solid ${t.line}`}}>
                <button onClick={()=>setAberta(a=>a===c.campaignId?null:c.campaignId)}
                  title="Ver palavras-chave e lances"
                  style={{background:'transparent',border:'none',color:t.t3,cursor:'pointer',fontFamily:'inherit',fontSize:11,padding:'0 2px',lineHeight:1}}>
                  {aberta===c.campaignId?'▾':'▸'}
                </button>
                <span style={{flex:'1 1 190px',minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,fontSize:12,color:t.t1}}>{c.nome}</span>
                <span style={{fontSize:10,fontWeight:700,color:ativa?t.grn:t.t3,minWidth:56}}>{ativa?'ATIVA':'PAUSADA'}</span>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <span style={{fontSize:10.5,color:t.t3}}>R$</span>
                  <input value={val??String(c.orcamento??'')} onChange={e=>setRascunho(v=>({...v,[c.campaignId]:e.target.value}))}
                    inputMode="decimal" style={{width:62,padding:'4px 6px',borderRadius:6,border:`1px solid ${mudou?t.gold:t.line}`,background:'transparent',color:t.t1,fontSize:11.5,fontFamily:FG,outline:'none'}}/>
                  {mudou && <button disabled={salvando===c.campaignId}
                    onClick={()=>aplicar(c,{budget:Number(val)},`Mudar o orçamento diário de "${c.nome}"\n\nDe R$ ${c.orcamento} para R$ ${Number(val)}?\n\nIsso altera de verdade na Amazon.`)}
                    style={{padding:'4px 9px',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontSize:10.5,fontWeight:700,border:`1px solid ${t.gold}`,background:'transparent',color:t.gold}}>salvar</button>}
                </div>
                <button disabled={salvando===c.campaignId}
                  onClick={()=>aplicar(c,{state:ativa?'PAUSED':'ENABLED'},`${ativa?'PAUSAR':'REATIVAR'} a campanha "${c.nome}"?\n\nIsso altera de verdade na Amazon.`)}
                  style={{padding:'4px 11px',borderRadius:6,cursor:'pointer',fontFamily:'inherit',fontSize:10.5,fontWeight:700,
                    border:`1px solid ${ativa?'rgba(248,113,113,0.35)':'rgba(52,211,153,0.35)'}`,background:'transparent',color:ativa?t.red:t.grn}}>
                  {salvando===c.campaignId?'…':ativa?'pausar':'reativar'}
                </button>
                <span style={{fontFamily:FG,fontSize:9.5,color:t.t3,opacity:.6}}>#{c.campaignId}</span>
              </div>
              {aberta===c.campaignId && <Keywords campaignId={c.campaignId} nome={c.nome} margem={margem}/>}
              </div>
            )
          })}
          {vis.length>40 && <div style={{fontSize:10.5,color:t.t3,marginTop:8}}>Mostrando 40 de {vis.length} — use o filtro pra achar as outras.</div>}
        </div>
      )}
    </div>
  )
}
function Ads({m,hide,adsReal,adsConnected,adsLoading,isAdmin,margemAds}:{m:ProductMetrics[];hide:boolean;adsReal?:any;adsConnected?:boolean|null;adsLoading?:boolean;isAdmin?:boolean;margemAds?:number|null}){
  const t=useT()
  // Não conectou a conta de Ads ainda
  if(adsConnected===false) return(
    <div style={{background:t.card,border:`1px solid ${t.gold}`,borderRadius:14,padding:'22px 20px',textAlign:'center' as const}}>
      <i className="ti ti-speakerphone" style={{fontSize:28,color:t.gold}} aria-hidden="true"/>
      <div style={{fontSize:15,fontWeight:600,color:t.t1,marginTop:8}}>Conecte sua conta de Ads</div>
      <div style={{fontSize:12.5,color:t.t2,margin:'5px 0 16px'}}>Gasto, ACoS e ROAS reais das suas campanhas Sponsored Products — direto da Amazon.</div>
      <a href="/api/ads/connect" style={{background:t.gold,color:t.dark?'#1c1606':'#3a2a05',fontWeight:600,fontSize:12.5,padding:'10px 18px',borderRadius:9,textDecoration:'none'}}>Conectar Ads</a>
    </div>
  )
  // Conectado mas o relatório ainda está sendo gerado no fundo
  if(!adsReal?.ready) return(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px 20px',textAlign:'center' as const,color:t.t2,fontSize:12.5}}>
      <i className={`ti ti-${adsLoading?'loader-2':'clock'}`} style={{fontSize:24,color:t.gold,display:'block',marginBottom:8}} aria-hidden="true"/>
      {adsLoading?'Gerando o relatório de ads na Amazon… na 1ª vez leva alguns minutos; depois fica instantâneo (atualiza no fundo).':'Relatório de ads indisponível no momento. Tente atualizar em instantes.'}
    </div>
  )
  const camps:any[]=adsReal.byCampaign||[]
  const tot=[
    {label:'Gasto',value:brl2(adsReal.spend),icon:'ti-speakerphone',color:t.gold},
    {label:'Vendas por Ads',value:brl2(adsReal.sales),icon:'ti-cash',color:t.grn},
    {label:'ACoS',value:pc(adsReal.acos),icon:'ti-target',color:adsReal.acos<20?t.grn:adsReal.acos<30?t.gold:t.red},
    {label:'ROAS',value:(Number(adsReal.roas)||0).toFixed(2)+'x',icon:'ti-rotate-clockwise',color:t.grn},
  ]
  const upd=adsReal.updatedAt?new Date(adsReal.updatedAt):null
  return(<>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:11,marginBottom:16}}>
      {tot.map((k,i)=><KPI key={i} {...k} hide={hide}/>)}
    </div>
    <Hint>ACoS &lt;20% ótimo · 20–30% atenção · &gt;30% prejuízo (revisar lance).</Hint>
    <Table head={[{label:'Campanha',w:'42%'},{label:'Gasto',right:true},{label:'Vendas',right:true},{label:'ROAS',right:true},{label:'ACoS',right:true}]}>
      {camps.map((c,i)=>{
        const acos=c.sales>0?c.spend/c.sales*100:0, roas=c.spend>0?c.sales/c.spend:0
        return(<tr key={i}>
          <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,fontSize:13,color:t.t1,fontWeight:500,whiteSpace:'nowrap' as const,overflow:'hidden',textOverflow:'ellipsis'}}>{c.campaign}</td>
          <NumTd hide={hide}>{brl2(c.spend)}</NumTd><NumTd hide={hide}>{brl2(c.sales)}</NumTd>
          <NumTd>{c.sales>0?roas.toFixed(1)+'x':'—'}</NumTd>
          <PillTd><Pill kind={c.sales<=0?'red':acos<20?'grn':acos<30?'gold':'red'}>{c.sales>0?pc(acos):'—'}</Pill></PillTd>
        </tr>)
      })}
    </Table>
    {upd && <div style={{fontSize:10.5,color:t.t3,marginTop:10,display:'flex',gap:6,alignItems:'center'}}>
      <i className="ti ti-refresh" style={{fontSize:12}} aria-hidden="true"/>Atualizado {upd.toLocaleString('pt-BR')} · dado real da Advertising API{adsReal.stale?' · revalidando no fundo':''}
    </div>}
    {isAdmin && <AdsAdmin margem={margemAds}/>}
  </>)
}
function Analitico({realDre,hide,connected,mockM,costs={},imposto=0}:{realDre?:any;hide:boolean;connected?:boolean|null;mockM?:ProductMetrics[];costs?:Record<string,number>;imposto?:number}){
  const t=useT()
  if(connected && !realDre) return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Carregando dados da Amazon…</div>
  if(realDre){
    const produtos:any[] = realDre.produtos||[]
    const reembolsos:any[] = realDre.reembolsos||[]
    // reembolsos agregados por SKU (p/ coluna da tabela geral)
    const refBySku:Record<string,{units:number;valor:number}> = {}
    for(const r of reembolsos){ const a=refBySku[r.sku]||(refBySku[r.sku]={units:0,valor:0}); a.units+=r.units||0; a.valor+=r.valor||0 }
    const totalDev = reembolsos.reduce((s,r)=>s+(r.valor||0),0)
    const totalDevUn = reembolsos.reduce((s,r)=>s+(r.units||0),0)
    const receitaTotal = produtos.reduce((s,p)=>s+(p.receita||0),0)
    const unidadesTotal = produtos.reduce((s,p)=>s+(p.units||0),0)
    // lucro/margem com o MESMO critério das outras abas: receita − CMV − taxas rateadas por faturamento
    const L=realDre.linhas||{}
    const fat=L.receitaBruta||0
    const feesTot=(L.comissao||0)+(L.fba||0)+(L.taxaPrograma||0)+(L.armazenagem||0)+(L.assinatura||0)+(L.outrasTaxas||0)
    const rows=[...produtos].sort((a:any,b:any)=>(b.receita||0)-(a.receita||0)).map((p:any)=>{
      const receita=p.receita||0, units=p.units||0
      const ticket=units>0?receita/units:0
      const shareRec=receitaTotal>0?receita/receitaTotal*100:0
      const custoU=costs[p.sku]||0, temCusto=custoU>0
      const custoTotal=custoU*units
      const share=fat>0?receita/fat:0
      const impP=receita*(imposto/100)
      const lucro=receita-custoTotal-feesTot*share-impP
      const margem=receita>0?lucro/receita*100:0
      const ref=refBySku[p.sku]||{units:0,valor:0}
      return {p,receita,units,ticket,shareRec,custoTotal,temCusto,lucro,margem,ref}
    })
    const comCusto=rows.filter(r=>r.temCusto)
    const recCusto=comCusto.reduce((s,r)=>s+r.receita,0)
    const margemMedia = recCusto>0 ? comCusto.reduce((s,r)=>s+r.lucro,0)/recCusto*100 : null
    if(produtos.length===0 && reembolsos.length===0)
      return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Nenhuma venda no período selecionado — nada para analisar por aqui.</div>
    const Chip=({label,value,color}:{label:string;value:string;color?:string})=>(
      <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:11,padding:'9px 14px',display:'flex',flexDirection:'column' as const,gap:3,minWidth:130,flex:'1 1 130px'}}>
        <span style={{fontSize:10,color:t.t3,fontFamily:FG,fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'0.05em'}}>{label}</span>
        <span style={{fontSize:15,fontWeight:700,fontFamily:FG,color:color||t.t1,fontVariantNumeric:'tabular-nums',filter:hide?'blur(6px)':'none'}}>{value}</span>
      </div>
    )
    return(<>
      <Hint>Analítico geral do período · desempenho por produto com ticket médio, participação na receita e reembolsos.</Hint>
      {/* Mini-KPIs do período */}
      <div style={{display:'flex',gap:11,flexWrap:'wrap' as const,marginBottom:16}}>
        <Chip label="Receita do período" value={brl2(receitaTotal)} color={t.t1}/>
        <Chip label="Unidades" value={String(unidadesTotal)}/>
        <Chip label="Produtos vendidos" value={String(produtos.length)}/>
        <Chip label="Reembolsos" value={`${totalDevUn} un · ${brl2(totalDev)}`} color={totalDev>0?t.red:t.t1}/>
        <Chip label="Margem média" value={margemMedia!=null?pc(margemMedia):'—'} color={margemMedia!=null?(margemMedia>=0?t.grn:t.red):t.t3}/>
      </div>
      {margemMedia==null && <div style={{fontSize:10.5,color:t.t3,marginBottom:14,fontFamily:FG}}>Margem média aparece quando você informa os custos (CMV) em Gerenciamento.</div>}
      {/* Tabela por produto (receita DESC) */}
      {produtos.length===0 ? (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG,marginBottom:22}}>Nenhuma venda no período selecionado.</div>
      ) : (
        <Table head={[
          {label:'Produto',w:'24%'},{label:'Unid.',right:true},{label:'Receita',right:true},{label:'Ticket médio',right:true},
          {label:'% da receita',right:true},{label:'Custo total',right:true},{label:'Lucro bruto',right:true},{label:'Margem',right:true},{label:'Reembolsos',right:true},
        ]}>
          {rows.map((r,i)=>(
            <tr key={i}>
              <ProdCell p={{id:r.p.sku,image:r.p.image,name:r.p.name||r.p.sku,sku:r.p.sku}}/>
              <NumTd>{r.units}</NumTd>
              <NumTd strong hide={hide}>{brl2(r.receita)}</NumTd>
              <NumTd hide={hide}>{brl2(r.ticket)}</NumTd>
              <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,textAlign:'right'}}>
                <div style={{fontSize:12,fontFamily:FG,fontWeight:600,color:t.t2,fontVariantNumeric:'tabular-nums'}}>{r.shareRec.toFixed(1).replace('.',',')}%</div>
                <div style={{height:3,borderRadius:2,background:t.dark?'rgba(255,255,255,0.08)':'#EFF1F4',marginTop:4,overflow:'hidden'}}>
                  <div style={{width:`${Math.min(100,Math.max(0,r.shareRec))}%`,height:'100%',borderRadius:2,background:t.vio}}/>
                </div>
              </td>
              <NumTd color={r.temCusto?t.gold:t.t3} hide={hide}>{r.temCusto?brl2(r.custoTotal):'—'}</NumTd>
              <NumTd color={r.temCusto?(r.lucro>=0?t.grn:t.red):t.t3} hide={hide}>{r.temCusto?brl2(r.lucro):'—'}</NumTd>
              <PillTd>{r.temCusto?<Pill kind={r.margem>20?'grn':r.margem>0?'gold':'red'}>{pc(r.margem)}</Pill>:<span style={{fontSize:11,color:t.t3}}>—</span>}</PillTd>
              <NumTd color={r.ref.units>0?t.red:t.t3} hide={hide}>{r.ref.units>0?`${r.ref.units} un · ${brl2(r.ref.valor)}`:'0'}</NumTd>
            </tr>
          ))}
        </Table>
      )}
      {produtos.length>0 && <div style={{fontFamily:FG,fontSize:10.5,color:t.t3,marginTop:8}}>Custo total, lucro e margem usam o CMV informado em Gerenciamento + comissão/FBA rateados por faturamento.</div>}
      {/* Detalhe: reembolsos por produto (seção existente) */}
      <div style={{fontFamily:FG,fontSize:15,fontWeight:600,color:t.t1,margin:'22px 0 8px'}}>Reembolsos por produto</div>
      <Hint>Base de repasse · acha o que vende mas volta. Total devolvido no período: <b style={{color:t.red}}>{brl2(totalDev)}</b></Hint>
      {reembolsos.length===0 ? (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Nenhuma devolução no período selecionado. 🎉</div>
      ) : (
        <Table head={[{label:'Produto',w:'46%'},{label:'Devolvidas',right:true},{label:'R$ devolvido',right:true},{label:'Taxa devol.',right:true}]}>
          {reembolsos.map((r,i)=>{
            const vendidas=produtos.find((p:any)=>p.sku===r.sku)?.units||0
            const taxa=vendidas>0?(r.units/vendidas*100):0
            return(<tr key={i}>
              <ProdCell p={{id:r.sku,image:r.image,name:r.name||r.sku,sku:r.sku}}/>
              <NumTd>{r.units} un</NumTd>
              <NumTd color={t.red} hide={hide}>{brl2(r.valor)}</NumTd>
              <PillTd>{vendidas>0?<Pill kind={taxa<5?'grn':taxa<15?'gold':'red'}>{pc(taxa)}</Pill>:<span style={{fontSize:11,color:t.t3}}>—</span>}</PillTd>
            </tr>)
          })}
        </Table>
      )}
    </>)
  }
  void mockM
  return <ConnectEmpty/>   // não conectado → vazio (sem mock)
}
function Gerenciamento({realDre,inv,costs,extras,onCost,onExtra,mockM,hide,connected,imposto=0,onImposto}:{realDre?:any;inv?:any;costs:Record<string,number>;extras:Record<string,number>;onCost:(sku:string,v:number)=>void;onExtra:(sku:string,v:number)=>void;mockM:ProductMetrics[];hide:boolean;connected?:boolean|null;imposto?:number;onImposto?:(v:number)=>void}){
  const t=useT()
  void mockM
  if(connected===false) return <ConnectEmpty texto="Conecte sua conta Amazon para informar o custo dos seus produtos."/>
  if(!realDre) return <LoadingBox/>

  // ── A LISTA = quem VENDEU no período ∪ quem tem ESTOQUE FBA ──────────────
  // Antes só listava quem vendeu no período. Efeito colateral (reportado pelo
  // João): produto novo, ou parado sem venda no dia, não tinha ONDE cadastrar o
  // custo — e o "Capital em estoque" do Estoque FBA saía subestimado, avisando
  // "N SKUs sem custo não somados" sem dar como resolver. Agora o seller
  // cadastra o custo assim que o produto entra no estoque.
  const vendidos = (realDre.produtos||[]) as any[]
  const estoque = (inv?.inventario||[]) as any[]
  const porSku = new Map<string,any>()
  for(const p of vendidos) porSku.set(p.sku,{sku:p.sku,name:p.name,image:p.image,units:p.units||0,receita:p.receita||0,emEstoque:0})
  for(const it of estoque){
    const emEstoque=(it.fulfillable||0)+(it.inbound||0)+(it.reserved||0)
    const atual=porSku.get(it.sku)
    if(atual) atual.emEstoque=emEstoque
    else porSku.set(it.sku,{sku:it.sku,name:it.name,image:it.image,units:0,receita:0,emEstoque})
  }
  // Quem vendeu primeiro (maior receita), depois quem só tem estoque parado.
  const prods=[...porSku.values()].sort((a,b)=> (b.units-a.units) || (b.receita-a.receita) || (b.emEstoque-a.emEstoque))
  if(!prods.length) return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Nenhum produto vendido no período nem em estoque FBA.</div>
  const cmvTotal=prods.reduce((sum,p)=>sum+p.units*((costs[p.sku]||0)+(extras[p.sku]||0)),0)
  const semCustoQtd=prods.filter(p=>((p.units||0)>0||(p.emEstoque||0)>0) && !((costs[p.sku]||0)>0)).length
  const inp:React.CSSProperties={width:84,background:t.dark?'rgba(255,255,255,0.05)':'#FFFFFF',border:`1px solid ${t.line2}`,borderRadius:7,color:t.t1,fontSize:12.5,fontWeight:600,padding:'6px 8px',fontFamily:'inherit',outline:'none',textAlign:'right'}
  return(<>
    <Hint>Informe o custo unitário de cada produto — <b>os que você vendeu e os que estão em estoque</b>. É o que falta pro Oráculo calcular o seu <b>lucro real</b>: a Amazon não sabe quanto você paga. Em <b>Custos extras</b> vai o que você gasta por unidade além do produto (prep center, etiqueta, embalagem, frete de entrada). Os que ainda faltam estão marcados em <b style={{color:t.gold}}>dourado</b>.{semCustoQtd>0 && <> Faltam <b style={{color:t.gold}}>{semCustoQtd}</b>.</>}</Hint>
    {/* Alíquota de imposto — dedução % sobre a receita em todas as abas (Simples/DAS, etc.) */}
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:12,padding:'12px 16px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' as const}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:12.5,fontWeight:600,color:t.t1}}>Alíquota de imposto (%)</div>
        <div style={{fontSize:10.5,color:t.t3,marginTop:2}}>Ex.: alíquota do Simples/DAS sobre a receita. Entra como dedução no lucro e na margem de todas as abas. Deixe 0 se não quiser considerar.</div>
      </div>
      <input type="number" min={0} max={100} step={0.1} value={imposto||''} placeholder="0" onChange={e=>onImposto?.(Math.max(0,Math.min(100,parseFloat(e.target.value)||0)))} style={{...inp,width:96}}/>
    </div>
    <Table head={[{label:'Produto',w:'34%'},{label:'Un. vendidas',right:true},{label:'Em estoque',right:true},{label:'Receita',right:true},{label:'Custo unit.',right:true},{label:'Custos extras',right:true},{label:'CMV',right:true}]}>
      {prods.map((p)=>{
        const cost=costs[p.sku]||0
        const extra=extras[p.sku]||0
        const cmv=p.units*(cost+extra)
        // Destaca quem PRECISA de custo: vendeu OU tem estoque parado. Antes só
        // olhava venda — e produto em estoque sem custo é justamente o que
        // desanda o "Capital em estoque".
        const falta=((p.units||0)>0||(p.emEstoque||0)>0) && cost<=0
        return(
          <tr key={p.sku} style={falta?{background:t.dark?'rgba(240,180,41,0.055)':'#FFFDF5'}:undefined}>
            <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <Thumb p={{id:p.sku,name:p.name||p.sku,image:p.image}}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:500,color:t.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name||p.sku}</div>
                  <div style={{fontSize:10,color:t.t3,marginTop:1}}>{p.sku}</div>
                </div>
              </div>
            </td>
            <NumTd>{p.units||'—'}</NumTd>
            <NumTd>{p.emEstoque||'—'}</NumTd>
            <NumTd hide={hide}>{p.receita>0?brl2(p.receita):'—'}</NumTd>
            <PillTd><input type="number" min={0} step={0.5} value={cost||''} placeholder={falta?'informe':'0,00'} onChange={e=>onCost(p.sku,parseFloat(e.target.value)||0)}
              style={falta?{...inp,border:`1px solid ${t.gold}`,boxShadow:`0 0 0 3px ${t.dark?'rgba(240,180,41,0.10)':'rgba(240,180,41,0.14)'}`}:inp}/></PillTd>
            <PillTd><input type="number" min={0} step={0.5} value={extra||''} placeholder="0,00" onChange={e=>onExtra(p.sku,parseFloat(e.target.value)||0)} style={inp}/></PillTd>
            <NumTd color={t.gold} hide={hide}>{cmv>0?brl2(cmv):'—'}</NumTd>
          </tr>
        )
      })}
    </Table>
    <div style={{display:'flex',justifyContent:'flex-end',alignItems:'baseline',gap:8,marginTop:12,fontSize:13}}>
      <span style={{color:t.t2,fontWeight:500}}>Custo total do período (produto + extras)</span>
      <span style={{color:t.gold,fontWeight:700,fontFamily:FG,filter:hide?'blur(6px)':'none'}}>{brl2(cmvTotal)}</span>
    </div>
    <div style={{fontSize:11,color:t.t3,marginTop:8}}>Salvo automaticamente · <b>Custo unit. + Custos extras</b> entram juntos no lucro, margem, ROI, MPA, Curva ABC e no capital em estoque · volte ao Resumo pra ver os números reais.</div>
  </>)
}
function Fulfillment({inv,realDre,connected,mockM,costs={},hide}:{inv?:any;realDre?:any;connected?:boolean|null;mockM?:ProductMetrics[];costs?:Record<string,number>;hide:boolean}){
  const t=useT()
  if(connected){
    if(!inv) return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Carregando estoque FBA da Amazon…</div>
    const itens:any[] = inv.inventario||[]
    // velocidade de venda (un/dia) pelo período atual p/ estimar cobertura
    const vendaPorSku:Record<string,number> = {}
    for(const p of (realDre?.produtos||[])) vendaPorSku[p.sku]=p.units
    const from=realDre?.period?.from, to=realDre?.period?.to
    const days = from&&to ? Math.max(1,Math.round((Date.parse(to)-Date.parse(from))/86400000)) : 30
    // ── KPIs do estoque (topo) — só dados reais: preço médio do período (realDre) e custo do Gerenciamento ──
    const unidadesEstoque = itens.reduce((s,it)=>s+(it.fulfillable||0),0)
    const precoPorSku:Record<string,number> = {}
    for(const p of (realDre?.produtos||[])) if((p.units||0)>0 && (p.receita||0)>0) precoPorSku[p.sku]=p.receita/p.units
    let vendaProj=0, semPreco=0
    for(const it of itens){
      const preco=precoPorSku[it.sku]
      if(preco!=null) vendaProj+=(it.fulfillable||0)*preco
      else if((it.fulfillable||0)>0) semPreco++   // sem venda no período → sem preço → fica fora (nada de preço inventado)
    }
    const capital = itens.reduce((s,it)=>s+(it.fulfillable||0)*(costs[it.sku]||0),0)
    const temCusto = itens.some(it=>(costs[it.sku]||0)>0)
    // SKUs com estoque mas SEM custo definido: o capital exibido é parcial — avisa
    const semCusto = itens.filter(it=>(it.fulfillable||0)>0 && !((costs[it.sku]||0)>0)).length
    const noteStyle:React.CSSProperties={fontSize:10,color:t.t3,marginTop:5,textAlign:'center' as const,fontFamily:FG,lineHeight:1.3}
    return(<>
      {!inv.error && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:13,marginBottom:16,alignItems:'start'}}>
          <div>
            <KPI label="Unidades em estoque" value={String(unidadesEstoque)} color={t.blue} hide={hide}/>
          </div>
          <div>
            <KPI label="Venda projetada do estoque" value={brl2(vendaProj)} color={t.grn} hide={hide}/>
            {semPreco>0 && <div style={noteStyle}>{semPreco} SKU{semPreco>1?'s':''} sem preço no período não somado{semPreco>1?'s':''}</div>}
          </div>
          <div>
            <KPI label="Capital em estoque (custo)" value={temCusto?brl2(capital):'—'} color={t.gold} hide={hide}/>
            {!temCusto && <div style={noteStyle}>Defina os custos em Gerenciamento</div>}
            {temCusto && semCusto>0 && <div style={noteStyle}>{semCusto} SKU{semCusto>1?'s':''} sem custo não somado{semCusto>1?'s':''}</div>}
          </div>
        </div>
      )}
      <Hint>Estoque FBA real · cobertura estimada pela velocidade de venda · alerta de ruptura e excesso.</Hint>
      {inv.error ? (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Estoque FBA temporariamente indisponível (verificando permissão da API).</div>
      ) : itens.length===0 ? (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Nenhum item em estoque FBA.</div>
      ) : (
        <Table head={[{label:'Produto',w:'40%'},{label:'FBA disp.',right:true},{label:'A caminho',right:true},{label:'Reservado',right:true},{label:'Cobertura',right:true},{label:'Status',right:true}]}>
          {itens.map((it,i)=>{
            const vel=(vendaPorSku[it.sku]||0)/days
            const cob = vel>0 ? Math.round(it.fulfillable/vel) : null
            const k = it.fulfillable<=0?'red':(cob!=null&&cob<10)?'red':(cob!=null&&cob>120)?'gold':'grn'
            const lbl = it.fulfillable<=0?'Ruptura':(cob!=null&&cob<10)?'Baixo':(cob!=null&&cob>120)?'Excesso':'Saudável'
            return(<tr key={i}>
              <ProdCell p={{id:it.sku,image:it.image,name:it.name||it.sku,sku:it.sku}}/>
              <NumTd strong>{it.fulfillable}</NumTd>
              <NumTd color={t.t2}>{it.inbound}</NumTd>
              <NumTd color={t.t2}>{it.reserved}</NumTd>
              <NumTd>{cob!=null?`${cob} dias`:'—'}</NumTd>
              <PillTd><Pill kind={k}>{lbl}</Pill></PillTd>
            </tr>)
          })}
        </Table>
      )}
    </>)
  }
  void mockM
  return <ConnectEmpty/>   // não conectado → vazio (sem mock)
}
function toCSV(headers:string[],rows:(string|number)[][]):string{
  const esc=(v:any)=>{const s=String(v??'');return /[",;\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
  return [headers.map(esc).join(';'),...rows.map(r=>r.map(esc).join(';'))].join('\n')
}
function downloadCSV(filename:string,content:string){
  if(typeof document==='undefined') return
  const blob=new Blob(['﻿'+content],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url)
}
function Relatorio({realDre,inv,costs={}}:{realDre?:any;inv?:any;costs?:Record<string,number>}){
  const t=useT()
  const produtos:any[]=realDre?.produtos||[]
  const reembolsos:any[]=realDre?.reembolsos||[]
  const inventario:any[]=inv?.inventario||[]
  const L=realDre?.linhas||{}
  const reps:{label:string;icon:string;off:boolean;gen:()=>string;file:string}[]=[
    {label:'Produtos / Vendas',icon:'ti-list',off:!produtos.length,file:'produtos-vendas',
      gen:()=>toCSV(['Produto','SKU','ASIN','Unidades','Faturado','Preço médio','Custo un. (produto + extras)'],produtos.map(p=>[p.name||p.sku,p.sku,p.asin||'',p.units,p.receita,p.units>0?(p.receita/p.units).toFixed(2):'0',costs[p.sku]||0]))},
    {label:'Reembolsos',icon:'ti-arrow-back-up',off:!reembolsos.length,file:'reembolsos',
      gen:()=>toCSV(['Produto','SKU','Unidades devolvidas','R$ devolvido'],reembolsos.map(r=>[r.name||r.sku,r.sku,r.units,r.valor]))},
    {label:'Estoque FBA',icon:'ti-package',off:!inventario.length,file:'estoque-fba',
      gen:()=>toCSV(['Produto','SKU','FBA disponível','A caminho','Reservado','Total'],inventario.map(it=>[it.name||it.sku,it.sku,it.fulfillable,it.inbound,it.reserved,it.total]))},
    {label:'DRE / Operacional',icon:'ti-file-spreadsheet',off:!realDre,file:'dre',
      gen:()=>toCSV(['Linha','Valor (R$)'],[['Receita bruta',L.receitaBruta||0],['Devoluções',L.devolucoes||0],['Receita líquida',L.receitaLiquida||0],['Comissão',L.comissao||0],['Tarifa FBA',L.fba||0],['Armazenagem',L.armazenagem||0],['Assinatura',L.assinatura||0],['Líq. Marketplace',realDre?.liqMarketplace||0],['Ads',L.ads||0]])},
  ]
  return(<>
    <Hint>Relatórios reais exportáveis em CSV (abre direto no Excel).</Hint>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:11}}>
      {reps.map((r,i)=>(
        <div key={i} onClick={()=>{ if(!r.off) downloadCSV(`oraculo-${r.file}.csv`,r.gen()) }}
          style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:12,padding:'14px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:r.off?'default':'pointer',opacity:r.off?0.45:1}}>
          <span style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:500,color:t.t1,fontFamily:FG}}><i className={`ti ${r.icon}`} style={{fontSize:18,color:t.gold}} aria-hidden="true"/>{r.label}</span>
          <i className="ti ti-download" style={{fontSize:16,color:r.off?t.t3:t.grn}} aria-hidden="true"/>
        </div>
      ))}
    </div>
    {!realDre && <div style={{fontSize:11,color:t.t3,marginTop:10,fontFamily:FG}}>Conecte a conta Amazon para exportar dados reais.</div>}
  </>)
}

/* ── Hub ─────────────────────────────────────────────────────────────────── */
const TABS = [
  {id:'resumo',label:'Resumo',icon:'ti-layout-dashboard'},
  {id:'vendas',label:'Vendas',icon:'ti-cash'},
  {id:'abc',label:'Curva ABC',icon:'ti-chart-bar'},
  {id:'ads',label:'Ads',icon:'ti-speakerphone'},
  {id:'analit',label:'Analítico',icon:'ti-chart-dots'},
  {id:'gerenc',label:'Gerenciamento',icon:'ti-adjustments'},
  {id:'fulfil',label:'Estoque FBA',icon:'ti-truck-delivery'},
  {id:'relat',label:'Relatório',icon:'ti-file-text'},
  {id:'dre',label:'DRE',icon:'ti-building-bank'},
]
const THEME_KEY='oraculo_theme'

export default function GestaoHub({promoActive=false,promoType=null,theme,isAdmin=false}:{promoActive?:boolean;promoType?:'comissao'|'fba'|'ambas'|null;userEmail?:string;theme?:'dark'|'light';isAdmin?:boolean}){
  const [tab,setTab]=useState('resumo')
  const [hide,setHide]=useState(false)
  const [themeKey,setThemeKey]=useState('dark')
  const [amazonConnected,setAmazonConnected]=useState<boolean|null>(null)
  const [realDre,setRealDre]=useState<any>(null)
  const [period,setPeriod]=useState('hoje')
  const [customRange,setCustomRange]=useState<{from:Date;to:Date}|null>(null)
  const range=useMemo(()=>computeRange(period,customRange),[period,customRange])
  // Curva ABC abre em 30 dias (ABC de 1 dia não faz sentido), mas isso NÃO deve
  // vazar para as outras abas: guardamos o período anterior e restauramos ao sair.
  const prePeriodRef=useRef<{period:string;custom:{from:Date;to:Date}|null}|null>(null)
  function goTab(id:string){
    const enteringAbc = id==='abc' && tab!=='abc'
    const leavingAbc  = tab==='abc' && id!=='abc'
    if(enteringAbc){
      prePeriodRef.current={period,custom:customRange}
      if(period==='hoje'||period==='ontem'){ setPeriod('30d'); setCustomRange(null) }
    } else if(leavingAbc && prePeriodRef.current){
      setPeriod(prePeriodRef.current.period)
      setCustomRange(prePeriodRef.current.custom)
      prePeriodRef.current=null
    }
    setTab(id)
  }
  useEffect(()=>{
    let alive=true
    fetch('/api/amazon/status').then(r=>r.json()).then(d=>{ if(alive) setAmazonConnected(!!d.connected) }).catch(()=>{ if(alive) setAmazonConnected(false) })
    return ()=>{ alive=false }
  },[])
  useEffect(()=>{
    if(!amazonConnected) return
    let alive=true, tries=0
    setRealDre(null)
    const load=()=>{
      fetch(`/api/amazon/finance?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`).then(r=>r.json()).then(f=>{
        if(!alive||!f||!f.linhas) return
        // venda sem faturamento = falha transitória na estimativa de preço (Pending) → retenta 1x
        if((f.vendas||0)>0 && (f.faturamento||0)<=0 && tries++<2){ setTimeout(load,4000); return }
        setRealDre(f)
      }).catch(()=>{})
    }
    load()
    return ()=>{ alive=false }
  },[amazonConnected,range.from,range.to])
  // ── AUTO-REFRESH da DRE (fim do "só atualiza no F5") ───────────────────────
  // Só em período ABERTO (que inclui agora); Ontem/mês passado não mudam mais.
  // ⚠️ Recalcula o range a cada tick: em 'hoje' o `to` é o instante em que a tela
  // abriu — repetir a MESMA janela deixaria a venda nova FORA dela pra sempre.
  // Não zera o estado: a tela nunca pisca, o número só troca quando o novo chega.
  useEffect(()=>{
    if(!amazonConnected) return
    const aberto=PERIODOS_ABERTOS.has(period)||(period==='custom'&&!!customRange&&sameDay(customRange.to,new Date()))
    if(!aberto) return
    let alive=true
    const silentLoad=()=>{
      if(typeof document!=='undefined'&&document.visibilityState==='hidden') return  // aba escondida não gasta chamada
      const r=computeRange(period,customRange)
      fetch(`/api/amazon/finance?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`)
        .then(x=>x.json()).then(f=>{ if(alive&&f&&f.linhas) setRealDre(f) }).catch(()=>{})
    }
    const timer=setInterval(silentLoad,60000)
    // Voltar pro app recarrega na hora — é o caminho de quem tocou no push da venda.
    const onVis=()=>{ if(document.visibilityState==='visible') silentLoad() }
    document.addEventListener('visibilitychange',onVis)
    window.addEventListener('focus',onVis)
    return ()=>{ alive=false; clearInterval(timer); document.removeEventListener('visibilitychange',onVis); window.removeEventListener('focus',onVis) }
  },[amazonConnected,period,customRange])
  // Estoque FBA (Inventory API) — carrega uma vez ao conectar (cache 30min no backend)
  const [inventory,setInventory]=useState<any>(null)
  useEffect(()=>{
    if(!amazonConnected) return
    let alive=true
    fetch('/api/amazon/inventory').then(r=>r.json()).then(d=>{ if(!alive) return; setInventory(Array.isArray(d?.inventario)?d:{inventario:[],error:d?.error||'indisponível'}) }).catch(()=>{ if(alive) setInventory({inventario:[],error:'indisponível'}) })
    return ()=>{ alive=false }
  },[amazonConnected])
  // Série fixa de 30 dias para o gráfico (não muda com o filtro de período — igual ao Gestor)
  const [dre30,setDre30]=useState<any>(null)
  useEffect(()=>{
    if(!amazonConnected) return
    let alive=true
    const now=new Date(); const from=new Date(now.getTime()-30*86400000).toISOString(); const to=now.toISOString()
    fetch(`/api/amazon/finance?daily=1&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r=>r.json()).then(f=>{ if(alive&&f&&f.daily) setDre30(f) }).catch(()=>{})
    return ()=>{ alive=false }
  },[amazonConnected])
  // ── Ads (Advertising API) — cacheado no backend; lê na hora e, se estiver gerando, faz polling ──
  const [adsConnected,setAdsConnected]=useState<boolean|null>(null)
  const [adsData,setAdsData]=useState<any>(null)      // {spend,sales,acos,roas,byCampaign,stale,updatedAt}
  const [adsLoading,setAdsLoading]=useState(false)
  useEffect(()=>{
    let alive=true
    fetch('/api/ads/status').then(r=>r.json()).then(d=>{ if(alive) setAdsConnected(!!d.connected) }).catch(()=>{ if(alive) setAdsConnected(false) })
    return ()=>{ alive=false }
  },[])
  useEffect(()=>{
    if(!adsConnected) return
    let alive=true, tries=0
    let timer:ReturnType<typeof setTimeout>|null=null   // captura pra limpar no cleanup (evita timer órfão)
    const win=adsWindow(period)
    // Manda também o from/to exato do período: a conta demo usa isso p/ o Ads bater com
    // o dia/intervalo escolhido (inclusive "custom"/calendário). Backend real usa a janela.
    const qs=`window=${win}&from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`
    setAdsData(null); setAdsLoading(true)
    const tick=()=>{
      fetch(`/api/ads/report?${qs}`).then(r=>r.json()).then(d=>{
        if(!alive) return
        if(d && d.ready){ setAdsData(d); setAdsLoading(false) }
        // Jitter (12-15s) pra 100 clientes não baterem no MESMO tick e virarem
        // rajada sincronizada no backend/Ads API. 1ª geração leva ~10min.
        else if(d && d.generating && tries++<70){ timer=setTimeout(tick,12000+Math.floor(Math.random()*3000)) }
        else setAdsLoading(false)
      }).catch(()=>{ if(alive) setAdsLoading(false) })
    }
    tick()
    return ()=>{ alive=false; if(timer) clearTimeout(timer) }
  },[adsConnected,period,range.from,range.to])
  const adsSpend = adsData?.ready ? Number(adsData.spend)||0 : null
  // Custo (CMV) por SKU — informado pelo seller, salvo no metadata do usuário
  const [costs,setCosts]=useState<Record<string,number>>({})
  const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(()=>{ fetch('/api/user/metadata?key=gestao_cmv').then(r=>r.json()).then(d=>{ if(d&&d.value&&typeof d.value==='object') setCosts(d.value) }).catch(()=>{}) },[])
  const setCost=(sku:string,val:number)=>{
    setCosts(prev=>{
      const next={...prev,[sku]:val}
      if(saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current=setTimeout(()=>{ fetch('/api/user/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'gestao_cmv',value:next})}).catch(()=>{}) },1200)
      return next
    })
  }
  // CUSTOS EXTRAS por unidade — prep center, etiquetagem, embalagem, frete de
  // entrada. Fica separado do CMV na tela (o seller precisa enxergar quanto do
  // custo é o produto e quanto é a operação), mas soma junto em TODO cálculo:
  // é custo por unidade vendida igual ao CMV.
  const [extras,setExtras]=useState<Record<string,number>>({})
  const extraTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(()=>{ fetch('/api/user/metadata?key=gestao_extras').then(r=>r.json()).then(d=>{ if(d&&d.value&&typeof d.value==='object') setExtras(d.value) }).catch(()=>{}) },[])
  const setExtra=(sku:string,val:number)=>{
    setExtras(prev=>{
      const next={...prev,[sku]:val}
      if(extraTimer.current) clearTimeout(extraTimer.current)
      extraTimer.current=setTimeout(()=>{ fetch('/api/user/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'gestao_extras',value:next})}).catch(()=>{}) },1200)
      return next
    })
  }
  // ⚠️ FONTE ÚNICA do custo unitário pro resto do painel. Todas as abas recebem
  // ESTE mapa no lugar do `costs` cru — assim custo extra entra em lucro,
  // margem, ROI, MPA, Curva ABC e capital em estoque sem tocar em cada cálculo.
  // Só a aba Gerenciamento recebe os dois mapas separados, pra editar cada um.
  const custoUnit = useMemo(()=>{
    const out:Record<string,number>={}
    for(const sku of new Set([...Object.keys(costs),...Object.keys(extras)])){
      const soma=(costs[sku]||0)+(extras[sku]||0)
      if(soma>0) out[sku]=soma
    }
    return out
  },[costs,extras])
  // Alíquota de imposto (%) — informada pelo seller (default 0 → não deduz nada).
  const [imposto,setImposto]=useState<number>(0)
  const impTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(()=>{ fetch('/api/user/metadata?key=gestao_imposto').then(r=>r.json()).then(d=>{ const v=Number(d?.value); if(isFinite(v)&&v>0) setImposto(v) }).catch(()=>{}) },[])
  const saveImposto=(val:number)=>{
    setImposto(val)
    if(impTimer.current) clearTimeout(impTimer.current)
    impTimer.current=setTimeout(()=>{ fetch('/api/user/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'gestao_imposto',value:val})}).catch(()=>{}) },1200)
  }
  // Produto selecionado para o modal de detalhamento (lupinha).
  const [detail,setDetail]=useState<{sku:string;name:string;image?:string;asin?:string}|null>(null)
  const cmv = realDre?.produtos ? realDre.produtos.reduce((sum:number,p:any)=>sum+p.units*(custoUnit[p.sku]||0),0) : 0
  // Margem ANTES de ads = a régua pra julgar ACOS (ACOS acima dela é prejuízo).
  // ⚠️ null quando o CMV não foi cadastrado: sem custo o "lucro" fica inflado e a
  // margem sairia otimista (~85%), calando o NEO justamente em quem mais precisa.
  // Melhor assumir que não sei e pedir o custo do que dar régua errada.
  const margemRef = useMemo(()=>{
    const fat=realDre?.linhas?.receitaBruta||0
    if(!(cmv>0)||!(fat>0)) return null
    return ((realDre?.liqMarketplace||0)-cmv)/fat*100
  },[realDre,cmv])
  const realM = realDre?.produtos ? realProductMetrics(realDre,custoUnit,imposto) : null
  // Produtos que VENDERAM no período mas estão sem custo informado — sem isso o
  // Oráculo não tem como calcular lucro/margem/ROI/MPA (mostra "—").
  const prodsComVenda = (realDre?.produtos||[]).filter((p:any)=>(p.units||0)>0).length
  const semCusto = (realDre?.produtos||[]).filter((p:any)=>(p.units||0)>0 && !((custoUnit[p.sku]||0)>0))
  const realAbcData = realM ? realAbc(realM) : null
  useEffect(()=>{
    let s = (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')) || ''
    if(!s) try{ s = localStorage.getItem(THEME_KEY)||'' }catch{}
    if(s && THEMES[s]) setThemeKey(s)
  },[])
  // Sincroniza com o tema global controlado pelo topbar do painel (fonte única de verdade)
  useEffect(()=>{
    if(theme && THEMES[theme]) setThemeKey(theme)
  },[theme])
  const t=THEMES[themeKey]||THEMES.dark

  const d=useMemo(()=>getFinanceData(),[])
  const m=useMemo(()=>productMetrics(d),[d])
  const abc=useMemo(()=>abcCurve(d),[d])

  return(
    <ThemeCtx.Provider value={t}>
      {/* Rodapé com 92px: a bolinha do Suporte é fixed no canto inferior direito e
          ocupa ~80px — com os 28px de antes ela cobria a última linha de conteúdo
          de qualquer aba (foi o que escondeu o botão da sonda de Ads). */}
      <div style={{background:t.dark?'transparent':t.pageBg,borderRadius:t.dark?0:16,border:t.dark?'none':`1px solid ${t.line}`,padding:t.dark?'2px 0 92px':'18px 20px 92px',minHeight:'calc(100vh - 80px)'}}>
        <link rel="stylesheet" precedence="default" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"/>
        <link rel="stylesheet" precedence="default" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&display=swap"/>
        <link rel="stylesheet" precedence="default" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css"/>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' as const,marginBottom:14}}>
          <div>
            <h2 style={{fontFamily:FG,fontSize:21,fontWeight:600,color:t.t1,letterSpacing:'-0.02em'}}>Gestão</h2>
            <p style={{fontSize:12,color:t.t2,marginTop:1}}>Visão financeira da sua operação Amazon · <span style={{color:realDre?t.grn:t.goldText,fontWeight:500}}>{realDre?'dados reais da Amazon':amazonConnected?'carregando dados reais…':'conecte sua conta para ver seus dados'}</span></p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setHide(v=>!v)} title="Ocultar valores"
              style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:9,width:34,height:34,color:t.t2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className={`ti ti-${hide?'eye-off':'eye'}`} style={{fontSize:18}} aria-hidden="true"/>
            </button>
            <PeriodPicker value={period} custom={customRange} onChange={(k,r)=>{ setPeriod(k); setCustomRange(r) }}/>
          </div>
        </div>

        {/* Conexão Amazon */}
        {amazonConnected===false && (
          <div style={{background:t.card,border:`1px solid ${t.gold}`,borderRadius:12,padding:'14px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' as const}}>
            <div style={{display:'flex',alignItems:'center',gap:11}}>
              <i className="ti ti-plug" style={{fontSize:22,color:t.gold}} aria-hidden="true"/>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:t.t1}}>Conecte sua conta Amazon</div>
                <div style={{fontSize:11.5,color:t.t2}}>Veja sua DRE real e automática, sem subir planilha.</div>
              </div>
            </div>
            <a href="/api/amazon/connect" style={{background:t.gold,color:t.dark?'#1c1606':'#3a2a05',fontWeight:600,fontSize:12.5,padding:'10px 16px',borderRadius:9,textDecoration:'none',whiteSpace:'nowrap' as const}}>Conectar conta Amazon</a>
          </div>
        )}
        {amazonConnected===true && (
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap' as const}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:11.5,fontWeight:600,color:t.grn,background:t.pillGrn[0],padding:'5px 11px',borderRadius:20}}>
              <i className="ti ti-circle-check" style={{fontSize:14}} aria-hidden="true"/>Conta Amazon conectada
            </span>
            <button onClick={()=>{ fetch('/api/amazon/disconnect',{method:'POST'}).then(()=>location.reload()) }} style={{background:'none',border:'none',color:t.t3,fontSize:11,cursor:'pointer',fontFamily:'inherit',textDecoration:'underline'}}>desconectar</button>
            {adsConnected===true && (<>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:11.5,fontWeight:600,color:t.grn,background:t.pillGrn[0],padding:'5px 11px',borderRadius:20}}>
                <i className="ti ti-speakerphone" style={{fontSize:13}} aria-hidden="true"/>Ads conectado
              </span>
              <button onClick={()=>{ if(confirm('Desconectar apenas o Ads? Sua conta Amazon (SP-API) continua conectada. Você poderá reconectar o Ads com a conta certa.')) fetch('/api/ads/disconnect',{method:'POST'}).then(()=>location.reload()) }} style={{background:'none',border:'none',color:t.t3,fontSize:11,cursor:'pointer',fontFamily:'inherit',textDecoration:'underline'}}>desconectar Ads</button>
            </>)}
            {adsConnected===false && (
              <a href="/api/ads/connect" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:11.5,fontWeight:600,color:t.dark?'#1c1606':'#3a2a05',background:t.gold,padding:'6px 12px',borderRadius:20,textDecoration:'none'}}>
                <i className="ti ti-speakerphone" style={{fontSize:13}} aria-hidden="true"/>Conectar Ads
              </a>
            )}
          </div>
        )}

        {/* Sub-tabs */}
        <div style={{display:'flex',gap:6,overflowX:'auto' as const,borderBottom:`1px solid ${t.line}`,paddingBottom:11,marginBottom:18}}>
          {TABS.map(tb=>{
            const on=tab===tb.id
            return(
              <button key={tb.id} onClick={()=>goTab(tb.id)}
                style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5,whiteSpace:'nowrap' as const,padding:'7px 12px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',border:'1px solid transparent',
                  background:on?t.gold:'transparent',color:on?(t.dark?'#1c1606':'#3a2a05'):t.t2,fontWeight:on?600:500}}>
                <i className={`ti ${tb.icon}`} style={{fontSize:14}} aria-hidden="true"/>{tb.label}
                {/* Contador de produtos sem custo na aba Gerenciamento */}
                {tb.id==='gerenc' && semCusto.length>0 && (
                  <span style={{background:on?'rgba(0,0,0,0.22)':t.pillGold[0],color:on?'inherit':t.pillGold[1],fontSize:9.5,fontWeight:700,minWidth:17,height:16,padding:'0 5px',borderRadius:99,display:'flex',alignItems:'center',justifyContent:'center'}}>{semCusto.length}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* ⚠️ Produtos vendidos SEM custo informado → Lucro/Margem/ROI/Lucro pós
            ADS/MPA aparecem como "—". Era a dúvida nº1 dos clientes ("os números
            não aparecem"): a Amazon informa o que você VENDEU, não o que PAGOU. */}
        {semCusto.length>0 && tab!=='gerenc' && (
          <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap' as const,background:t.dark?'rgba(240,180,41,0.07)':'#FFFBEB',border:`1px solid ${t.dark?'rgba(240,180,41,0.3)':'#FDE68A'}`,borderRadius:12,padding:'13px 15px',marginBottom:16}}>
            <i className="ti ti-alert-triangle" style={{fontSize:17,color:t.gold,marginTop:1,flexShrink:0}} aria-hidden="true"/>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:12.5,fontWeight:600,color:t.t1,marginBottom:3}}>
                {semCusto.length===prodsComVenda ? 'Você ainda não informou o custo dos seus produtos' : `${semCusto.length} de ${prodsComVenda} produtos estão sem custo cadastrado`}
              </div>
              <div style={{fontSize:11.5,color:t.t2,lineHeight:1.55}}>
                <b>Lucro, Margem, ROI, Lucro pós ADS e MPA</b> só aparecem depois que você informa quanto paga por cada produto — a Amazon envia o que você <i>vendeu</i>, nunca o que você <i>pagou</i>.
              </div>
            </div>
            <button onClick={()=>goTab('gerenc')}
              style={{flexShrink:0,background:t.gold,color:t.dark?'#1c1606':'#3a2a05',border:'none',borderRadius:9,padding:'9px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              Informar custos
            </button>
          </div>
        )}

        {/* Conteúdo */}
        {tab==='resumo' && <Resumo hide={hide} realDre={realDre} cmv={cmv} adsReal={adsData} costs={custoUnit} chart30={dre30} connected={amazonConnected} adsConnected={adsConnected} imposto={imposto} onDetail={setDetail}/>}
        {tab==='vendas' && <Vendas realM={realM} mockM={m} connected={amazonConnected} hide={hide} onDetail={setDetail}/>}
        {tab==='abc'    && <CurvaABC realDre={realDre} costs={custoUnit} adsReal={adsData} inv={inventory} connected={amazonConnected} mockD={abc} hide={hide}/>}
        {tab==='ads'    && <Ads m={m} hide={hide} adsReal={adsData} adsConnected={adsConnected} adsLoading={adsLoading} isAdmin={isAdmin} margemAds={margemRef}/>}
        {tab==='analit' && <Analitico realDre={realDre} hide={hide} connected={amazonConnected} mockM={m} costs={custoUnit} imposto={imposto}/>}
        {tab==='gerenc' && <Gerenciamento realDre={realDre} inv={inventory} costs={costs} extras={extras} onCost={setCost} onExtra={setExtra} mockM={m} hide={hide} connected={amazonConnected} imposto={imposto} onImposto={saveImposto}/>}
        {tab==='fulfil' && <Fulfillment inv={inventory} realDre={realDre} connected={amazonConnected} mockM={m} costs={custoUnit} hide={hide}/>}
        {tab==='relat'  && <Relatorio realDre={realDre} inv={inventory} costs={custoUnit}/>}
        {tab==='dre'    && <div style={{marginTop:-8}}><FinanceiroPanel promoActive={promoActive} promoType={promoType}/></div>}

        {/* Modal de detalhamento (lupinha) — sobre qualquer aba */}
        {detail && realDre && <ProdutoDetalhe produto={detail} realDre={realDre} adsReal={adsData} costs={custoUnit} imposto={imposto} hide={hide} onClose={()=>setDetail(null)}/>}
      </div>
    </ThemeCtx.Provider>
  )
}
