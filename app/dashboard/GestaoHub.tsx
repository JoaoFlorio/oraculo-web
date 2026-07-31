'use client'
import React, { useState, useMemo, useEffect, useRef, useContext, createContext } from 'react'
import dynamic from 'next/dynamic'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts'
import { getFinanceData, summary, productMetrics, abcCurve, type ProductMetrics } from './financeiroMock'
import { adsDoProduto, temAdsPorSku, adsSemVenda } from '@/lib/adsProduto'
import { margemDoProduto, custosFixosDoPeriodo, totaisDoPeriodo, lucroDoPeriodo, ajustesDoPedido, ajustesDoProduto, type AjustePedido } from '@/lib/margemProduto'
import { impactoTarifaAgo26, type ProdutoTarifa } from '@/lib/tarifaFbaAgo26'
import { maturidadeDoPeriodo, type SeloMaturidade } from '@/lib/maturidadePeriodo'
import { snapshotDoPeriodo, narrarMudancas, reconciliar, normalizarMarcos, chaveDoPeriodo, type SnapshotPeriodo, type MarcosPeriodo, type Diario, type Reconciliacao } from '@/lib/diarioPeriodo'

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
// ⚠️ Espalhava o "líquido do marketplace" da conta por receita (liqRatio) e ainda
// devolvia refundUnits/refundValue CHUMBADOS em zero — então a aba Vendas mostrava
// coluna de reembolso ao lado de um lucro que ignorava esse mesmo reembolso, na
// MESMA linha. Agora usa a fonte única (margemDoProduto), com taxa medida por
// produto e devolução real por SKU.
function realProductMetrics(realDre:any, costs:Record<string,number>, aliquota=0, adsReal?:any):ProductMetrics[]{
  const prods=realDre?.produtos||[]
  return prods.map((p:any)=>{
    const M=margemDoProduto({linhas:realDre?.linhas||{},produto:p,reembolsos:realDre?.reembolsos,
      custoUnit:costs[p.sku]||0,imposto:aliquota,ads:adsDoProduto(adsReal,p.sku,p.asin).valor})
    const base=M.lucro??M.lucroAntesAds??0
    return {id:p.sku,name:p.name||p.sku,sku:p.sku,asin:p.asin||'',image:p.image||'',
      units:p.units,price:p.units>0?M.receitaBruta/p.units:0,unitCost:costs[p.sku]||0,
      adsSpend:M.ads||0,adsSales:0,refundUnits:M.devolucaoUnits,stockFBA:0,bsr:0,
      revenue:M.receitaLiquida,commission:M.comissao||0,fbaFee:M.fba||0,cmv:M.cmv,tax:M.imposto,
      refundValue:M.devolucaoValor,grossProfit:base,acos:0,roas:0,
      margin:M.margem??0,roi:M.cmv>0?base/M.cmv*100:0,coverageDays:0} as ProductMetrics
  })
}
function realAbc(metrics:ProductMetrics[]){
  const m=[...metrics].sort((a,b)=>b.revenue-a.revenue)
  const total=m.reduce((s,p)=>s+p.revenue,0)||1
  let cum=0
  return m.map(p=>{cum+=p.revenue;const sh=cum/total*100;return {...p,shareTotal:p.revenue/total*100,cls:(sh<=80?'A':sh<=95?'B':'C') as 'A'|'B'|'C'}})
}

/* ── SELO DE MATURIDADE + DIÁRIO DO PERÍODO ──────────────────────────────────
   Responde as duas perguntas que o número que se mexe levanta: "dá pra confiar
   nisto agora?" e "por que mudou desde ontem?". Sem elas, exatidão sobre um
   período inacabado é lida como imprecisão. */
function SeloEDiario({selo,diario,hide}:{selo:SeloMaturidade;diario:Diario|null;hide:boolean}){
  const t=useT()
  const [aberto,setAberto]=useState(false)
  const cor=selo.nivel==='fechado'?t.grn:selo.nivel==='liquidando'?t.gold:t.blue
  const ponto=selo.nivel==='fechado'?'🟢':selo.nivel==='liquidando'?'🟠':'🟡'
  const quando=(iso:string)=>{
    const d=new Date(iso); if(isNaN(d.getTime())) return 'a última vez'
    const h=Math.floor((Date.now()-d.getTime())/3600000)
    if(h<1) return 'há pouco'
    if(h<24) return `há ${h}h`
    const dias=Math.floor(h/24)
    return dias===1?'ontem':`há ${dias} dias`
  }
  return(
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',gap:9,flexWrap:'wrap' as const}}>
        <button onClick={()=>setAberto(v=>!v)}
          style={{display:'flex',alignItems:'center',gap:7,padding:'6px 12px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',
            border:`1px solid ${cor}${t.dark?'55':'44'}`,background:cor+(t.dark?'18':'12'),color:cor,fontSize:11.5,fontWeight:700}}>
          <span aria-hidden="true">{ponto}</span>{selo.rotulo}
          <i className={`ti ti-chevron-${aberto?'up':'down'}`} style={{fontSize:13}} aria-hidden="true"/>
        </button>
        {diario && (
          <span style={{fontSize:11.5,color:t.t2}}>
            mudou desde {quando(diario.desde)}
            {diario.diferenca!==null && Math.abs(diario.diferenca)>0.5 && (
              <b style={{color:diario.diferenca>0?t.grn:t.red,marginLeft:5}}>
                {diario.diferenca>0?'+':'−'}{hide?'•••':brl2(Math.abs(diario.diferenca))} de lucro
              </b>
            )}
          </span>
        )}
      </div>
      {aberto && (
        <div style={{marginTop:9,padding:'11px 13px',borderRadius:10,border:`1px solid ${t.line}`,background:t.dark?'rgba(255,255,255,0.02)':'#FAFAFA'}}>
          <div style={{fontSize:11.5,color:t.t2,lineHeight:1.6}}>{selo.motivo}</div>
          <div style={{fontSize:11.5,color:t.t1,lineHeight:1.6,marginTop:6}}><b>{selo.acao}</b></div>
        </div>
      )}
      {diario && (
        <div style={{marginTop:9,padding:'11px 13px',borderRadius:10,border:`1px solid ${t.line}`,background:t.dark?'rgba(255,255,255,0.02)':'#FAFAFA'}}>
          <div style={{fontSize:11,fontWeight:700,color:t.t3,letterSpacing:.3,textTransform:'uppercase' as const,marginBottom:7}}>
            O que mudou desde {quando(diario.desde)}
          </div>
          {diario.causas.map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:7,fontSize:11.5,color:t.t2,lineHeight:1.6,marginTop:i?4:0}}>
              <i className={`ti ti-arrow-${c.valor>0?'up':'down'}`}
                style={{fontSize:14,marginTop:1,flexShrink:0,color:c.valor>0?t.grn:t.red}} aria-hidden="true"/>
              <span>{hide?'•••':c.frase}</span>
            </div>
          ))}
          {/* ⚠️ O resíduo aparece AQUI também. A primeira versão deste bloco
              anunciava a variação do lucro inteira e listava só 4 das 12 parcelas:
              o seller lia "−R$1.089" ao lado de causas que somavam −165. */}
          {!diario.fecha && (
            <div style={{display:'flex',alignItems:'flex-start',gap:7,fontSize:11.5,color:t.gold,lineHeight:1.6,marginTop:4}}>
              <i className="ti ti-help-circle" style={{fontSize:14,marginTop:1,flexShrink:0}} aria-hidden="true"/>
              <span>ainda não explicado: {hide?'•••':brl2(diario.residuo)}</span>
            </div>
          )}
          <div style={{fontSize:10.5,color:t.t3,marginTop:8,lineHeight:1.55}}>
            O Oráculo não congela o número velho pra parecer estável — ele mostra o valor certo de agora e conta o que mudou.
          </div>
        </div>
      )}
    </div>
  )
}

/* ── RECONCILIAÇÃO ───────────────────────────────────────────────────────────
   "Você estimou R$5.800 em junho. Fechou R$5.611. A diferença tem nome."

   ⭐ A peça que ninguém tem. E ela só vale se FECHAR: se as causas não somam a
   diferença, quem confere descobre dinheiro sem explicação e conclui que a
   ferramenta esconde coisa — pior do que não ter mostrado nada. Por isso o resíduo
   aparece DECLARADO quando existe, em vez de ser diluído numa das linhas. */
function ReconciliacaoCard({rec,hide}:{rec:Reconciliacao;hide:boolean}){
  const t=useT()
  const [aberto,setAberto]=useState(false)
  const piorou=rec.diferenca<0
  const data=(iso:string)=>{ const d=new Date(iso); return isNaN(d.getTime())?'antes':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) }
  const daAmazon=rec.causas.filter(c=>c.autor==='amazon')
  const suas=rec.causas.filter(c=>c.autor==='voce')
  const soma=(l:typeof rec.causas)=>l.reduce((s,c)=>s+c.valor,0)
  const v=(n:number)=>hide?'•••':`${n<0?'−':'+'}${brl2(Math.abs(n))}`
  const Grupo=({titulo,itens,nota}:{titulo:string;itens:typeof rec.causas;nota:string})=>itens.length?(
    <div style={{marginTop:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10,marginBottom:2}}>
        <span style={{fontSize:11,fontWeight:700,color:t.t3,letterSpacing:.3,textTransform:'uppercase' as const}}>{titulo}</span>
        <b style={{fontFamily:FG,fontSize:12.5,color:soma(itens)<0?t.red:t.grn}}>{v(soma(itens))}</b>
      </div>
      <div style={{fontSize:10.5,color:t.t3,marginBottom:7,lineHeight:1.5}}>{nota}</div>
      {itens.map((c,i)=>(
        <div key={i} style={{padding:'7px 0',borderTop:i?`1px solid ${t.line}`:'none'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10}}>
            <span style={{fontSize:12,color:t.t1}}>{c.rotulo}</span>
            <b style={{fontFamily:FG,fontSize:12.5,color:c.valor<0?t.red:t.grn,whiteSpace:'nowrap' as const}}>{v(c.valor)}</b>
          </div>
          <div style={{fontSize:10.5,color:t.t3,lineHeight:1.5,marginTop:2}}>{c.explicacao}</div>
        </div>
      ))}
    </div>
  ):null
  return(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'14px 16px',marginBottom:16}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap' as const}}>
        <i className="ti ti-scale" style={{fontSize:18,color:t.gold,marginTop:1,flexShrink:0}} aria-hidden="true"/>
        <div style={{flex:1,minWidth:220}}>
          <div style={{fontSize:12.5,fontWeight:600,color:t.t1,marginBottom:4}}>Fechamento do período</div>
          <div style={{fontSize:11.5,color:t.t2,lineHeight:1.6}}>
            Em {data(rec.estimadoEm)} este período mostrava <b>{hide?'•••':brl2(rec.lucroEstimado)}</b> de lucro.
            {' '}Fechou em <b style={{color:piorou?t.red:t.grn}}>{hide?'•••':brl2(rec.lucroAtual)}</b>
            {Math.abs(rec.diferenca)<=0.5
              ? <> — <b style={{color:t.grn}}>a estimativa se confirmou.</b></>
              : <> — {piorou?'menos':'mais'} <b style={{color:piorou?t.red:t.grn}}>{hide?'•••':brl2(Math.abs(rec.diferenca))}</b>.
                  {/* ⚠️ Sem causa nenhuma, "a diferença tem nome" é promessa falsa —
                      e era o que a tela dizia, com o resíduo escondido atrás de um
                      botão que nem era renderizado. */}
                  {rec.causas.length>0
                    ? ' E a diferença tem nome:'
                    : ' E essa diferença o Oráculo ainda não consegue explicar — me mostre este período.'}</>}
          </div>
        </div>
        {(rec.causas.length>0 || !rec.fecha) && (
          <button onClick={()=>setAberto(a=>!a)}
            style={{flexShrink:0,background:'transparent',color:t.t2,border:`1px solid ${t.line2}`,borderRadius:9,padding:'8px 13px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            {aberto?'Fechar':'Ver a conta'}
          </button>
        )}
      </div>
      {aberto && (
        <div style={{marginTop:4}}>
          <Grupo titulo="O que a Amazon mudou" itens={daAmazon}
            nota="Devolução que chegou depois, e tarifa estimada dando lugar à que ela cobrou de fato quando o repasse fechou."/>
          {/* Separado de propósito: se o lucro caiu porque o SELLER informou o custo
              que faltava, chamar isso de "o repasse fechou menor" seria mentira. */}
          <Grupo titulo="O que você mudou" itens={suas}
            nota="Não é a Amazon: é a sua informação de custo, alíquota ou lançamento avulso ficando mais exata."/>
          {/* O resíduo não some. Diluí-lo numa das linhas faria a conta "fechar" por
              omissão — exatamente o que este card existe pra tornar impossível. */}
          {!rec.fecha && (
            <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${t.line}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10}}>
                <span style={{fontSize:12,color:t.gold,fontWeight:600}}>Ainda não explicado</span>
                <b style={{fontFamily:FG,fontSize:12.5,color:t.gold}}>{v(rec.residuo)}</b>
              </div>
              <div style={{fontSize:10.5,color:t.t3,lineHeight:1.55,marginTop:3}}>
                Esta parte da diferença o Oráculo não conseguiu atribuir a uma causa. Fica declarada aqui em vez de ser diluída nas linhas acima —
                a conta tem que fechar de verdade, não por omissão. Se aparecer com valor alto, me mostre: é sinal de linha de repasse que ainda não estamos lendo.
              </div>
            </div>
          )}
          {/* ⚠️ Isto mostrava `rec.diferenca` com o rótulo "Soma das causas" — na tela
              do João saiu R$ 45,58 ao lado de linhas que somavam R$ 45,12. Quem
              confere na calculadora acha os 46 centavos, e a partir dali desconfia
              de tudo. O rótulo agora diz a verdade: é a soma, e o arredondamento
              que sobra aparece em linha própria. */}
          {rec.causas.length>0 && (()=>{
            const soma=Math.round(rec.causas.reduce((s2,c)=>s2+c.valor,0)*100)/100
            const sobra=Math.round((rec.diferenca-soma)*100)/100
            return(<>
              <div style={{marginTop:11,paddingTop:9,borderTop:`1px solid ${t.line}`,display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10}}>
                <span style={{fontSize:11.5,color:t.t2}}>Soma das causas</span>
                <b style={{fontFamily:FG,fontSize:13,color:soma<0?t.red:t.grn}}>{v(soma)}</b>
              </div>
              {Math.abs(sobra)>=0.01 && (
                <div style={{marginTop:5,display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10}}>
                  <span style={{fontSize:11,color:t.t3}}>{Math.abs(sobra)<0.5?'Arredondamento':'Ainda não explicado'}</span>
                  <b style={{fontFamily:FG,fontSize:12,color:Math.abs(sobra)<0.5?t.t3:t.gold}}>{v(sobra)}</b>
                </div>
              )}
            </>)
          })()}
        </div>
      )}
    </div>
  )
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
function Table({head,children,minWidth}:{head:{label:string;right?:boolean;w?:string}[];children:React.ReactNode;minWidth?:number}){
  const t=useT()
  return(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,overflow:'hidden'}}>
      {/* ora-tscroll: no mobile a tabela ganha min-width e rola horizontal (tableLayout
          fixed + width 100% esmagaria as colunas em telas estreitas).
          ⚠️ `minWidth` existe pra tabela de muitas colunas (a Curva ABC tem 9): sem
          ele, `tableLayout:fixed` espremia tudo e a lupa subia por cima da pílula
          de diagnóstico em telas médias. Com min-width ela ROLA em vez de esmagar. */}
      <div className="ora-tscroll" style={{overflowX:'auto' as const,
        scrollbarWidth:'thin' as const,
        scrollbarColor:t.dark?'rgba(255,255,255,0.18) transparent':'rgba(0,0,0,0.18) transparent'}}>
        <table style={{width:'100%',borderCollapse:'collapse' as const,tableLayout:'fixed' as const,minWidth}}>
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
function KPI({label,value,color,hide,tip}:{label:string;value:string;delta?:string;up?:boolean;icon?:string;color:string;hide:boolean;tip?:string}){
  const t=useT()
  /* ⚠️ O ⓘ era um ENFEITE — aria-hidden, sem handler. A primeira cliente clicou
     esperando a explicação ("vi que o i ainda não está funcionando") e comparou
     com o concorrente, onde ele abre o detalhamento. Ícone que parece botão e não
     faz nada é pior que ícone nenhum: vira promessa quebrada na cara do cliente.
     Clique (não hover) de propósito: no celular hover não existe. */
  const [aberto,setAberto]=useState(false)
  useEffect(()=>{
    if(!aberto) return
    const fechar=()=>setAberto(false)
    document.addEventListener('click',fechar)
    return ()=>document.removeEventListener('click',fechar)
  },[aberto])
  return(
    <div style={{background:t.card,border:`1.5px solid ${color}`,borderRadius:14,padding:'16px 14px 18px',textAlign:'center' as const,position:'relative' as const,minHeight:96,display:'flex',flexDirection:'column' as const,justifyContent:'center',boxShadow:'var(--elev1)'}}>
      {tip
        ? <button aria-label={`O que é ${label}`} onClick={e=>{e.stopPropagation();setAberto(v=>!v)}}
            style={{position:'absolute' as const,top:5,right:6,background:'transparent',border:'none',cursor:'pointer',padding:4,lineHeight:1}}>
            <i className="ti ti-info-circle" style={{fontSize:14,color:aberto?t.gold:t.t3,opacity:aberto?1:0.7}} aria-hidden="true"/>
          </button>
        : <i className="ti ti-info-circle" style={{position:'absolute' as const,top:9,right:11,fontSize:14,color:t.t3,opacity:0.35}} aria-hidden="true"/>}
      {aberto&&tip&&(
        <div onClick={e=>e.stopPropagation()}
          style={{position:'absolute' as const,top:30,right:6,left:6,zIndex:30,background:t.dark?'#1c1e26':'#fff',border:`1px solid ${t.line2}`,borderRadius:10,padding:'10px 12px',fontSize:11,color:t.t2,lineHeight:1.55,textAlign:'left' as const,boxShadow:'0 8px 24px rgba(0,0,0,0.35)',whiteSpace:'pre-line' as const}}>
          {tip}
        </div>
      )}
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
      {(L.promocoes||0)>0.005 && <Row label="Desconto que você deu" val={L.promocoes} color={t.gold}/>}
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
      {/* ⚠️ O backend corta a paginação da Finances em 12s no caminho da tela e
          marca `extrasParciais`. Ninguém lia esse campo — devoluções, armazenagem
          e taxas reais saíam SUBCONTADAS com cara de número final. */}
      {data.extrasParciais && (
        <div style={{display:'flex',gap:8,alignItems:'flex-start',background:t.dark?'rgba(255,183,3,0.07)':'#FFFBEB',border:`1px solid ${t.dark?'rgba(255,183,3,0.25)':'#FDE68A'}`,borderRadius:10,padding:'9px 12px',marginTop:11}}>
          <i className="ti ti-clock-exclamation" style={{fontSize:14,color:t.gold,marginTop:1}} aria-hidden="true"/>
          <span style={{fontSize:11,color:t.t2,lineHeight:1.45}}>
            <b style={{color:t.t1}}>Ainda somando o extrato deste período.</b> Devoluções, armazenagem e taxas podem estar <b>incompletas</b> — o cálculo completo está rodando no fundo e a tela se atualiza sozinha. Período longo demora mais.
          </span>
        </div>
      )}
      {/* ⚠️ FORA da margem, de propósito. Reembolso de estoque do FBA é resultado de
          OUTRO período e de outra natureza — não é venda. Somei dentro do Líq. do
          Marketplace em 28/07 e a margem de um dia foi pra 62,5% com o líquido
          MAIOR que o faturamento. É informação real, mas em bloco separado. */}
      {Math.abs(L.ajustes||0)>0.005 && (
        <div style={{marginTop:12,paddingTop:11,borderTop:`1px dashed ${t.line2||t.line}`}}>
          <div style={{fontSize:11,color:t.t3,fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'0.05em',marginBottom:6}}>Fora da operação de venda</div>
          <Row label={(L.ajustes||0)>0?'Reembolsos e ajustes da Amazon':'Ajustes e dívida cobrada'} val={Math.abs(L.ajustes)} sign={(L.ajustes||0)>0?undefined:'-'} color={(L.ajustes||0)>0?t.grn:t.red}/>
          <div style={{fontSize:10.5,color:t.t3,marginTop:7}}>Estoque que a Amazon perdeu ou danificou, e correções do repasse. É dinheiro real, mas <b>não é venda deste período</b> — por isso fica fora da margem e do lucro acima, que medem a sua operação.</div>
        </div>
      )}
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
function Resumo({hide,realDre,cmv=0,impostoTotal=0,credito=0,custoEventual=0,semCusto=0,receitaSemCusto=0,adsReal,costs={},chart30,connected,adsConnected,imposto=0,onDetail,selo,diario,recon}:{hide:boolean;realDre?:any;cmv?:number;impostoTotal?:number;credito?:number;custoEventual?:number;semCusto?:number;receitaSemCusto?:number;adsReal?:any;costs?:Record<string,number>;chart30?:any;connected?:boolean|null;adsConnected?:boolean|null;imposto?:number;onDetail?:(p:any)=>void;selo?:SeloMaturidade;diario?:Diario|null;recon?:Reconciliacao|null}){
  const t=useT()
  // (Removidos os KPIs/composição MOCK com deltas fabricados "+12,4%" etc. — eram
  // código morto: o render usa só RK.kpis (real), loadingKpis ou emptyKpis.)
  // ── KPIs e rosca REAIS quando conectado ──
  const RK = realDre ? (()=>{
    const L=realDre.linhas||{}
    // ⚠️ Ads SEM dado é `null`, não zero. `linhas.ads` vem CHUMBADO em 0 do backend,
    // então o fallback antigo afirmava "R$ 0,00 em ads · TACOS 0,0%" pra quem só
    // não tinha o relatório pronto — a doutrina oposta à de lib/adsProduto.ts, que
    // devolve null justamente pra tela poder dizer "não sei".
    const ads: number|null = adsReal?.ready ? (Number(adsReal.spend)||0) : null
    const adsPending = adsConnected && !(adsReal?.ready)   // ads conectado mas ainda gerando relatório
    const fat=L.receitaBruta||0, liq=realDre.liqMarketplace||0   // Faturamento = BRUTO (devoluções são linha à parte)
    // ⚠️ Denominador = receita LÍQUIDA, igual margemDoProduto. Dividir por bruto aqui
    // e por líquido no produto fazia a margem da capa nascer maior que a de todos os
    // produtos somados em qualquer período com devolução.
    const base=(L.receitaLiquida ?? fat) || 0
    const vendas=realDre.vendas||0, unidades=realDre.unidades||0
    /* ⭐ UNIDADES LÍQUIDAS NO CARD. A primeira cliente pegou na primeira semana: o
       card dizia 23 com 1 reembolso, e o concorrente dizia 22. E a nossa própria
       conta já era líquida por dentro — o CMV cobra unitsLiquidas desde 28/07 —
       então o card mostrava um número que o resto da tela não usava. O detalhe
       (brutas/reembolsadas) vai no ⓘ, que agora abre de verdade. */
    const unidadesReemb=(realDre.reembolsos||[]).reduce((s2:number,r2:any)=>s2+Math.abs(Number(r2.units)||0),0)
    const unidadesLiq=Math.max(0,unidades-unidadesReemb)
    const devolucoesVal=L.devolucoes||0
    const ticket=vendas>0?fat/vendas:0
    const tacos=(ads!==null&&base>0)?ads/base*100:null
    // ⚠️ O IMPOSTO ENTRA AQUI. Ficava de fora e o "Lucro Bruto" da capa saía maior
    // que a soma do que cada produto mostra — a Gestão dizia margem 27,8% onde a
    // ferramenta de referência do seller dizia 23,8%, exatamente os 4% de alíquota.
    // E a aba Gerenciamento promete por escrito: "entra como dedução no lucro e na
    // margem de todas as abas". Vem somado produto a produto (mesma base do modal:
    // receita LÍQUIDA de devolução), não recalculado por fora.
    // ⚠️ CRÉDITO EXTRA E CUSTO EVENTUAL ENTRAM AQUI. O card de cada produto já os
    // conta desde que a aba Vendas passou a aceitar lançamento por pedido — a capa
    // não, então a soma dos produtos não fechava com o KPI logo acima deles. É o
    // mesmo defeito que o imposto tinha, com outro nome.
    const lucroBruto=lucroDoPeriodo(liq,{cmv,imposto:impostoTotal,credito,custoEventual})
    const lucroPosAds=ads===null?null:lucroBruto-ads
    const margem=base>0?lucroBruto/base*100:0, roi=cmv>0?lucroBruto/cmv*100:0
    const mpa=(lucroPosAds!==null&&base>0)?lucroPosAds/base*100:null
    const cm=cmv>0, dash='—'
    return {
      // ⓘ de cada card: rótulo, o PORQUÊ e o detalhe dinâmico — a regra 6 do vault
      // (rótulo + porquê + ação) aplicada aos KPIs.
      kpis:[
        {label:'Faturamento',value:brl2(fat),icon:'ti-cash',color:t.vio,
          tip:`Tudo que você vendeu no período, já líquido de cupom/desconto concedido.${devolucoesVal>0.005?`\nDevoluções: −${brl2(devolucoesVal)} → líquido de devolução: ${brl2(Math.max(0,fat-devolucoesVal))}.`:''}\nA devolução aparece como linha própria e já desconta do Lucro — aqui fica o bruto pra você ver o volume real de venda.`},
        {label:'Líq. do Marketplace',value:brl2(liq),icon:'ti-building-bank',color:t.blue,
          tip:'O que sobra DA VENDA depois da parte da Amazon: comissão, tarifa FBA, Taxa Amazon pra Todos, armazenagem, assinatura e devoluções. Ainda não desconta seu custo de produto, imposto nem ads.'},
        {label:'Lucro Bruto',value:cm?brl2(lucroBruto):dash,icon:'ti-trending-up',color:t.grn,
          tip:'Líq. do Marketplace − custo dos produtos (CMV das unidades líquidas) − imposto + lançamentos avulsos. É o lucro ANTES do anúncio.'},
        {label:'Margem',value:cm?pc(margem):dash,icon:'ti-percentage',color:t.grn,
          tip:'Lucro Bruto ÷ receita líquida de devolução. Mesma régua usada no card de cada produto — capa e detalhe não têm como discordar.'},
        {label:'Número de Vendas',value:String(vendas),icon:'ti-shopping-cart',color:t.blue,
          tip:'Pedidos que caíram no período (cancelados ficam de fora). Pedido devolvido depois CONTA como venda — a devolução desconta no Faturamento e no Lucro, não aqui.'},
        {label:'Número de Unidades Vendidas',value:String(unidadesLiq),icon:'ti-package',color:t.blue,
          tip:`Unidades LÍQUIDAS — as que ficaram vendidas de verdade.${unidadesReemb>0?`\n${unidades} vendidas − ${unidadesReemb} reembolsada${unidadesReemb>1?'s':''} = ${unidadesLiq}.`:`\n${unidades} vendidas, nenhuma reembolsada no período.`}\nÉ a mesma contagem que o CMV usa: unidade devolvida não cobra custo.`},
        {label:'Ticket Médio',value:brl2(ticket),icon:'ti-receipt',color:t.grn,
          tip:'Faturamento ÷ número de vendas.'},
        {label:'Retorno Sobre Investimento',value:cm?pc(roi):dash,icon:'ti-rotate-clockwise',color:t.grn,
          tip:'Lucro Bruto ÷ custo dos produtos vendidos (CMV). Quanto cada real investido em mercadoria devolveu no período.'},
        {label:'Valor em Ads',value:adsPending?'…':(ads===null?dash:brl2(ads)),icon:'ti-speakerphone',color:t.grn,
          tip:'Gasto REAL de anúncio no período (relatório da Advertising API), não estimativa.'},
        {label:'TACOS',value:adsPending?'…':(tacos===null?dash:pc(tacos)),icon:'ti-target',color:t.grn,
          tip:'Ads ÷ receita total. Quanto do seu faturamento o anúncio consome — TACOS subindo com faturamento parado é sinal de dependência.'},
        {label:'Lucro bruto pós ADS',value:adsPending?'…':((cm&&lucroPosAds!==null)?brl2(lucroPosAds):dash),icon:'ti-coin',color:t.grn,
          tip:'Lucro Bruto − gasto de anúncio. É o que de fato sobrou no período.'},
        {label:'MPA',value:adsPending?'…':((cm&&mpa!==null)?pc(mpa):dash),icon:'ti-chart-pie',color:t.grn,
          tip:'Margem Pós-Anúncio: lucro pós ads ÷ receita líquida. A margem final da operação.'},
      ],
      comp:[
        {name:'Lucro líquido',value:Math.max(0,Math.round(lucroPosAds??lucroBruto)),color:t.grn},
        {name:'CMV',value:Math.round(cmv),color:t.vio},
        {name:'Comissão',value:Math.round(L.comissao||0),color:t.gold},
        {name:'Ads',value:Math.round(ads||0),color:t.red},   // sem dado, some da rosca (filter x.value>0)
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
  // ⚠️ DOIS defeitos nesta série, os dois corrigidos aqui.
  // (1) O payload de `?daily=1` NÃO traz `linhas` nem `liqMarketplace` (o backend
  //     devolve só {daily,faturamento,vendas}), então `netRatio` dava 0 e a área
  //     verde ficava CHAPADA em R$ 0,00 nos 30 dias, ao lado de um card dizendo
  //     "Lucro Bruto R$ X". Agora cai no `realDre`, que tem as linhas.
  // (2) O nome mentia: mesmo funcionando, `receita × (liq/receita)` é o LÍQUIDO DO
  //     MARKETPLACE — não passa perto de lucro, porque ignora CMV e imposto.
  //     Chamar isso de "Lucro líquido" é a mesma doença de sempre.
  const rSrc = (cSrc?.linhas?.receitaBruta||0)>0 ? cSrc : realDre
  const netRatio = (rSrc?.linhas?.receitaBruta||0)>0 ? (rSrc.liqMarketplace||0)/rSrc.linhas.receitaBruta : null
  const chartData:any[] = realChart
    ? fillDaily(cSrc.daily,cSrc.period?.from,cSrc.period?.to).map((x:any)=>({...x,
        liq:netRatio===null?null:Math.round(x.receita*netRatio*100)/100}))
    : []   // não conectado / carregando → gráfico vazio (sem mock)
  const chartXKey = 'label'
  // Top 15 produtos vendidos no período (real) com métricas por produto (estilo Gestor).
  const L = realDre?.linhas||{}
  const fatTot = realDre ? (L.receitaBruta||0) : 0
  const feesTot = (L.comissao||0)+(L.fba||0)+(L.taxaPrograma||0)+(L.armazenagem||0)+(L.assinatura||0)+(L.outrasTaxas||0)
  const top15 = realDre?.produtos ? (realDre.produtos as any[]).slice(0,15).map(p=>{
    // Mesma função do modal e da Curva ABC — as três não têm como discordar.
    const M=margemDoProduto({linhas:L,produto:p,reembolsos:realDre?.reembolsos,
      custoUnit:costs[p.sku]||0,imposto,ads:adsDoProduto(adsReal,p.sku,p.asin).valor})
    const units=p.units||0
    return {p,units,
      receita:M.receitaLiquida,                              // líquida de devolução
      preco:units>0?M.receitaBruta/units:0,
      custoU:costs[p.sku]||0,
      repres:fatTot>0?M.receitaBruta/fatTot*100:0,
      devolucao:M.devolucaoValor,
      lucro:M.lucroAntesAds, margem:M.margem,
      custoAds:M.ads, lucroPos:M.lucro,
      mpa:(M.lucro!==null&&M.receitaLiquida>0)?M.lucro/M.receitaLiquida*100:null}
  }) : []
  const adsReal_=temAdsPorSku(adsReal)
  const sangria=adsSemVenda(adsReal,realDre?.produtos||[])
  return(<>
    {/* 0) Qual relógio está na tela, e o que mudou desde a última visita. Vem
        ANTES dos KPIs de propósito: é a legenda deles. */}
    {realDre && selo && <SeloEDiario selo={selo} diario={diario||null} hide={hide}/>}
    {/* A reconciliação só existe quando há uma estimativa antiga pra comparar —
        e é ela que responde "por que o número que eu vi não é o que fechou". */}
    {realDre && recon && <ReconciliacaoCard rec={recon} hide={hide}/>}
    {/* 1) KPIs — cards estilo Gestor, 4 por linha */}
    <div className="ora-kpis" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:13,marginBottom:16}}>
      {shownKpis.map((k:any,i:number)=><KPI key={i} {...k} hide={hide}/>)}
    </div>
    {/* ⚠️ Produto sem custo cadastrado entra no lucro com CMV ZERO: a receita conta
        inteira e o custo não. O agregado fica otimista e nada avisava. */}
    {realDre && semCusto>0 && (
      <div style={{display:'flex',gap:9,alignItems:'flex-start',background:t.dark?'rgba(255,183,3,0.06)':'#FFFBEB',border:`1px solid ${t.dark?'rgba(255,183,3,0.22)':'#FDE68A'}`,borderRadius:11,padding:'10px 13px',marginBottom:16}}>
        <i className="ti ti-alert-triangle" style={{fontSize:14,color:t.gold,marginTop:1}} aria-hidden="true"/>
        <span style={{fontSize:11.5,color:t.t2,lineHeight:1.45}}>
          <b style={{color:t.t1}}>{semCusto} produto{semCusto>1?'s':''} sem custo cadastrado</b> — {brl2(receitaSemCusto)} de receita entra no lucro e na margem acima <b>sem nenhum custo descontado</b>, então os dois estão otimistas. Informe o CMV em <b>Gerenciamento</b>.
        </span>
      </div>
    )}
    {/* 2) Gráfico de receitas — sempre 30 dias por data, largura cheia */}
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'16px 18px',marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontFamily:FG,fontSize:15,fontWeight:600,color:t.t1}}>Resumo de Receitas</span>
        <span style={{fontFamily:FG,fontSize:11,color:t.t3}}>{realChart?'últimos 30 dias':'período selecionado'}{netRatio!==null?' · líquido proporcional ao período':''}</span>
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
            {realChart && netRatio!==null && <Area type="monotone" dataKey="liq" name="Líq. do Marketplace" stroke={t.grn} strokeWidth={2.4} fill="url(#gLucro)" dot={false} activeDot={{r:4}}/>}
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
                <NumTd color={r.custoU>0&&r.lucro!==null?(r.lucro>=0?t.grn:t.red):t.t3} hide={hide}>{r.custoU>0&&r.lucro!==null?brl2(r.lucro):'—'}</NumTd>
                <PillTd>{r.custoU>0&&r.margem!==null?<Pill kind={r.margem>20?'grn':r.margem>0?'gold':'red'}>{pc(r.margem)}</Pill>:<span style={{fontSize:10.5,color:t.t3}}>—</span>}</PillTd>
                {/* com dado real, R$0 é resposta (não anunciou) — não vira travessão.
                    `null` = sem dado por produto: "—", nunca um rateio. */}
                <NumTd color={(r.custoAds||0)>0?t.t1:t.t3} hide={hide}>{r.custoAds===null?'—':brl2(r.custoAds)}</NumTd>
                <NumTd color={r.custoU>0&&r.lucroPos!==null?(r.lucroPos>=0?t.grn:t.red):t.t3} hide={hide}>{r.custoU>0&&r.lucroPos!==null?brl2(r.lucroPos):'—'}</NumTd>
                <PillTd>{r.custoU>0&&r.mpa!==null?<Pill kind={r.mpa>15?'grn':r.mpa>0?'gold':'red'}>{pc(r.mpa)}</Pill>:<span style={{fontSize:10.5,color:t.t3}}>—</span>}</PillTd>
                <PillTd><ZoomBtn onClick={()=>onDetail?.(r.p)}/></PillTd>
              </tr>
            ))}
          </Table>
        )}
        {/* ⭐ A sangria que o rateio escondia: ads em produto que não vendeu. Antes
            esse custo era empurrado pra cima de quem vendeu, e o produto que
            queimava aparecia com custo de ads ZERO (não tem receita → share 0). */}
        {sangria.total>0 && (
          <div style={{display:'flex',gap:10,alignItems:'flex-start',background:t.dark?'rgba(255,183,3,0.06)':'#FFFBEB',border:`1px solid ${t.dark?'rgba(255,183,3,0.22)':'#FDE68A'}`,borderRadius:12,padding:'11px 14px',marginTop:12}}>
            <i className="ti ti-alert-triangle" style={{fontSize:15,color:t.gold,marginTop:1}} aria-hidden="true"/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,color:t.t1,fontWeight:600}}>{brl2(sangria.total)} em ads foram para produtos que não venderam no período</div>
              <div style={{fontSize:11,color:t.t2,marginTop:3,fontFamily:FG}}>
                {sangria.itens.slice(0,4).map(x=>`${x.sku} ${brl2(x.spend)}`).join(' · ')}{sangria.itens.length>4?` · +${sangria.itens.length-4}`:''}
              </div>
              <div style={{fontSize:10.5,color:t.t3,marginTop:4}}>Esse custo não entra na margem de nenhum produto acima — ele é real e sai do seu lucro do período.</div>
            </div>
          </div>
        )}
        <div style={{fontFamily:FG,fontSize:10.5,color:t.t3,marginTop:8}}>Informe o custo (CMV) na aba Gerenciamento para ver lucro, margem e MPA. Comissão e FBA rateados por faturamento. {adsReal_?'Ads = gasto REAL de cada produto (relatório da Amazon).':'O gasto de ads por produto ainda está sincronizando — as colunas de Ads ficam vazias até chegar. Não rateamos o total da conta: isso faria a margem de um produto depender do que os outros gastaram.'}</div>
      </div>
    )}
  </>)
}

/* ── Abas tabulares ─────────────────────────────────────────────────────── */
/* VENDAS — PEDIDO A PEDIDO, no formato do Gestor Seller.
   Antes esta aba era um ranking com TUDO do dia somado por produto: o seller via
   "3 unidades, R$239,70" e não conseguia responder "quanto a Amazon me cobrou
   NAQUELE pedido das 19h?". Agora cada pedido é um cartão, cada item uma linha
   com a conta completa até a margem, e a setinha abre o detalhe do pedido.
   ⚠️ As taxas por unidade saem do `produtos[]` da DRE (comissão e FBA MEDIDOS por
   SKU) divididas pelas unidades do período — assim a soma dos pedidos fecha com o
   card do produto e com a DRE por construção, e não por coincidência. */
function Vendas({realDre,costs,extras,imposto,hide,connected,adsReal,onDetail,ajustes,onAddAjuste,onRemoverAjuste}:{realDre?:any;costs:Record<string,number>;extras:Record<string,number>;imposto:number;hide:boolean;connected?:boolean|null;adsReal?:any;onDetail?:(p:any)=>void;ajustes:AjustePedido[];onAddAjuste:(a:Omit<AjustePedido,'id'>)=>void;onRemoverAjuste:(id:string)=>void}){
  const t=useT()
  const [dados,setDados]=useState<any|null>(null)
  const [aberto,setAberto]=useState<string|null>(null)
  const from=realDre?.period?.from, to=realDre?.period?.to
  useEffect(()=>{
    if(!from||!to){ return }
    let vivo=true; setDados(null)
    const qs=new URLSearchParams(); qs.set('from',from); qs.set('to',to)
    fetch(`/api/amazon/orders?${qs}`).then(r=>r.json())
      .then(d=>{ if(vivo) setDados(d) }).catch(()=>{ if(vivo) setDados({available:false}) })
    return ()=>{ vivo=false }
  },[from,to])

  if(connected===false) return <ConnectEmpty/>
  if(!realDre) return <LoadingBox/>

  // Índice por SKU: nome, foto e as taxas MEDIDAS por unidade.
  const porSku=new Map<string,any>()
  for(const p of (realDre.produtos||[])){
    const un=p.units||0
    porSku.set(p.sku,{
      nome:p.name||p.sku, image:p.image||'', asin:p.asin||'',
      comissaoUn:(un>0&&p.feeMedido)?(p.comissao||0)/un:null,
      fbaUn:(un>0&&p.feeMedido)?(p.fba||0)/un:null,
      feeMedido:!!p.feeMedido,
      // Preço médio do período — o MESMO que a DRE usou pro pedido Pendente,
      // cujo valor a Amazon suprime. Sem isto o pedido vinha com receita 0 e
      // comissão/FBA/CMV cheios em cima = prejuízo fantasma.
      precoUn:un>0?(p.receita||0)/un:0,
    })
  }
  const custoDe=(sku:string)=>costs[sku]||0
  const extraDe=(sku:string)=>extras[sku]||0

  // Conta de UM item do pedido — a mesma ordem de dedução do card do produto.
  const contaItem=(it:any)=>{
    const ref=porSku.get(it.sku)
    const qty=it.qty||0
    // PEDIDO PENDENTE: a Amazon suprime o valor e o espelho guarda 0. A DRE cai
    // no preco do anuncio; ler o espelho cru aqui fazia a MESMA venda valer
    // R$79,90 no card do produto e R$0,00 nesta aba - com o custo cheio em cima,
    // virava prejuizo. Usa o mesmo preco medio que a DRE ja aplicou.
    const bruto=it.receita||0
    const estimado=bruto<=0&&qty>0&&(ref?.precoUn||0)>0
    const receita=estimado?(ref.precoUn*qty):bruto
    // Nem o anuncio tinha preco -> nao inventa nada e nao cobra custo de nada.
    const semPreco=receita<=0&&qty>0
    const comissao=(semPreco||ref?.comissaoUn==null)?null:ref.comissaoUn*qty
    const fba=(semPreco||ref?.fbaUn==null)?null:ref.fbaUn*qty
    const liq=(comissao===null||fba===null)?null:receita-comissao-fba
    const imp=receita*(imposto/100)
    const cmv=semPreco?0:custoDe(it.sku)*qty, custoExtra=semPreco?0:extraDe(it.sku)*qty
    const temCusto=!semPreco&&(custoDe(it.sku)>0||extraDe(it.sku)>0)
    const lucro=(liq===null||!temCusto)?null:liq-imp-cmv-custoExtra
    return {ref,receita,qty,comissao,fba,liq,imp,cmv,custoExtra,temCusto,lucro,estimado,semPreco,
      margem:(lucro!==null&&receita>0)?lucro/receita*100:null}
  }

  const pedidos:any[]=dados?.pedidos||[]
  return(<>
    <Hint>Cada venda do período, pedido a pedido — com o que a Amazon cobrou em cada um. Clique na seta pra abrir o detalhe do pedido. O gasto de anúncio não entra aqui: ele é do período, não de um pedido.</Hint>
    {dados===null ? <LoadingBox/>
      : !dados.available ? (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>
          Detalhe por pedido {dados.reason==='demo'?'não disponível na conta demo':'sincronizando — disponível em instantes'}.
        </div>
      ) : pedidos.length===0 ? (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Nenhuma venda no período selecionado.</div>
      ) : pedidos.map((o:any)=>(
        <PedidoCard key={o.orderId} pedido={o} conta={contaItem} hide={hide}
          expandido={aberto===o.orderId} onToggle={()=>setAberto(aberto===o.orderId?null:o.orderId)}
          ajustes={ajustes} onAddAjuste={onAddAjuste} onRemoverAjuste={onRemoverAjuste}
          nomeDe={(sku:string)=>porSku.get(sku)?.nome||sku}
          onProduto={(sku:string)=>{ const r=porSku.get(sku); onDetail?.({sku,name:r?.nome||sku,image:r?.image,asin:r?.asin}) }}/>
      ))}
  </>)
}

/* Cartão de UM pedido. Estrutura do Gestor: cabeçalho com selo/data/hora/canal,
   uma linha por item com a conta até a margem, e a setinha que abre o resumo. */
function PedidoCard({pedido,conta,hide,expandido,onToggle,onProduto,ajustes,onAddAjuste,onRemoverAjuste,nomeDe}:{pedido:any;conta:(it:any)=>any;hide:boolean;expandido:boolean;onToggle:()=>void;onProduto:(sku:string)=>void;ajustes:AjustePedido[];onAddAjuste:(a:Omit<AjustePedido,'id'>)=>void;onRemoverAjuste:(id:string)=>void;nomeDe:(sku:string)=>string}){
  const t=useT()
  const [lancar,setLancar]=useState<'credito'|'custo'|null>(null)
  const meusAjustes=ajustesDoPedido(ajustes,pedido.orderId)
  const pend=/pending/i.test(pedido.status||'')
  const itens=(pedido.itens||[])
  const c=itens.map(conta)
  const som=(f:(x:any)=>number|null)=>c.reduce((s:number,x:any)=>s+(f(x)??0),0)
  const algumSemFee=c.some((x:any)=>x.liq===null)
  const algumSemCusto=c.some((x:any)=>!x.temCusto)
  const algumEstimado=c.some((x:any)=>x.estimado)
  const todosSemPreco=c.length>0&&c.every((x:any)=>x.semPreco)
  const tot={receita:som(x=>x.receita),comissao:som(x=>x.comissao),fba:som(x=>x.fba),
    imp:som(x=>x.imp),cmv:som(x=>x.cmv),extra:som(x=>x.custoExtra)}
  // Lançamentos avulsos entram no lucro DO PEDIDO (e no do período, via
  // totaisDoPeriodo) — mas nunca no custo unitário do produto.
  const ajCred=meusAjustes.filter(a=>a.tipo==='credito').reduce((s,a)=>s+(Number(a.valor)||0),0)
  const ajCusto=meusAjustes.filter(a=>a.tipo==='custo').reduce((s,a)=>s+(Number(a.valor)||0),0)
  const lucroTot=(algumSemFee||algumSemCusto)?null:som(x=>x.lucro)+ajCred-ajCusto
  const d=new Date(pedido.date)
  const data=d.toLocaleDateString('pt-BR'), hora=d.toLocaleTimeString('pt-BR',{hour12:false})

  const th:React.CSSProperties={fontSize:9.5,fontWeight:700,color:t.t3,textTransform:'uppercase',letterSpacing:'0.045em',padding:'0 10px 8px',fontFamily:FG,whiteSpace:'nowrap'}
  const td:React.CSSProperties={fontSize:12.5,color:t.t1,fontFamily:FG,fontVariantNumeric:'tabular-nums',padding:'0 10px',textAlign:'right',whiteSpace:'nowrap'}
  const meta:React.CSSProperties={display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color:t.t2,fontFamily:FG}
  const dash=<span style={{color:t.t3}}>—</span>
  const money=(v:number|null)=>v===null?dash:<span style={{filter:hide?'blur(6px)':'none'}}>{brl2(v)}</span>

  return(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,marginBottom:14,overflow:'hidden',boxShadow:t.dark?'none':'0 1px 2px rgba(16,24,40,0.05)'}}>
      {/* Cabeçalho do pedido */}
      {/* ⚠️ Duas faixas com `minWidth:0`, não um flex-wrap solto: com o selo
          "Pendente" presente, o `marginLeft:auto` do "Amazon BR" empurrava ele pra
          uma segunda linha e o cabeçalho ficava torto. Agora a esquerda encolhe e
          a direita fica ancorada. */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'13px 18px',borderBottom:`1px solid ${t.line}`}}>
        <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' as const,minWidth:0,flex:1}}>
          <span title={pend?'Aguardando a Amazon confirmar':'Confirmado'} style={{width:11,height:11,borderRadius:'50%',background:pend?t.gold:t.grn,flexShrink:0}}/>
          <span style={meta}><i className="ti ti-calendar" style={{fontSize:14}} aria-hidden="true"/>{data}</span>
          <span style={meta}><i className="ti ti-clock" style={{fontSize:14}} aria-hidden="true"/>{hora}</span>
          <span style={meta}><i className="ti ti-truck-delivery" style={{fontSize:14}} aria-hidden="true"/>{pedido.channel==='AFN'?'FBA — Logística da Amazon':'FBM — Envio próprio'}</span>
          {pend && <Pill kind="gold">Pendente</Pill>}
        </div>
        <span style={{display:'inline-flex',alignItems:'center',gap:7,fontSize:12,color:t.t3,fontFamily:FG,flexShrink:0,whiteSpace:'nowrap'}}>
          <i className="ti ti-brand-amazon" style={{fontSize:15,color:t.gold}} aria-hidden="true"/>Amazon BR
        </span>
      </div>

      {/* Itens do pedido */}
      {/* scrollbarColor: no tema escuro a barra nativa saía BRANCA cortando o card. */}
      <div style={{padding:'14px 18px 4px',overflowX:'auto',scrollbarWidth:'thin' as const,
                   scrollbarColor:t.dark?'rgba(255,255,255,0.18) transparent':'rgba(0,0,0,0.18) transparent'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:820}}>
          <thead><tr>
            <th style={{...th,textAlign:'left',width:'32%'}}>Item</th>
            <th style={{...th,textAlign:'right'}}>Qtd</th>
            <th style={{...th,textAlign:'right'}}>Total</th>
            <th style={{...th,textAlign:'right'}}>Preço unit.</th>
            <th style={{...th,textAlign:'right'}}>Líquido do marketplace</th>
            <th style={{...th,textAlign:'right'}}>Imposto</th>
            <th style={{...th,textAlign:'right'}}>Custo do produto</th>
            <th style={{...th,textAlign:'right'}}>Custo extra</th>
            <th style={{...th,textAlign:'right'}}>Lucro</th>
            <th style={{...th,textAlign:'right'}}>Margem</th>
          </tr></thead>
          <tbody>
            {itens.map((it:any,i:number)=>{
              const x=c[i]
              return(
                <tr key={i}>
                  <td style={{padding:'8px 10px'}}>
                    <button onClick={()=>onProduto(it.sku)} title="Ver detalhamento do produto"
                      style={{display:'flex',alignItems:'center',gap:11,background:'none',border:'none',padding:0,cursor:'pointer',textAlign:'left',width:'100%'}}>
                      <span style={{width:46,height:46,borderRadius:9,overflow:'hidden',flexShrink:0,background:t.dark?'#0F0F1E':'#F3F4F6',border:`1px solid ${t.line}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {x.ref?.image
                          ? <img src={x.ref.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : <i className="ti ti-package" style={{fontSize:19,color:t.t3}} aria-hidden="true"/>}
                      </span>
                      <span style={{minWidth:0}}>
                        <span style={{display:'block',fontSize:12.5,fontWeight:600,color:t.t1,lineHeight:1.35,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:280}}>{x.ref?.nome||it.sku}</span>
                        <span style={{display:'block',fontSize:10.5,color:t.t3,marginTop:2,fontFamily:FG}}>SKU {it.sku}</span>
                      </span>
                    </button>
                  </td>
                  <td style={{...td,fontWeight:600}}>{it.qty}</td>
                  {/* "≈" quando o valor veio do preço do anúncio (Pendente, que a
                      Amazon manda sem preço) — afirmar exatidão que não temos foi
                      o que fez o cha-ching anunciar R$37 numa venda de R$32. */}
                  <td style={{...td,fontWeight:700}}>{x.semPreco?dash:<>{x.estimado&&<span style={{color:t.t3,fontWeight:500}}>≈ </span>}{money(x.receita)}</>}</td>
                  <td style={td}>{x.semPreco?dash:money(x.qty>0?x.receita/x.qty:0)}</td>
                  <td style={{...td,color:t.grn}}>{money(x.liq)}</td>
                  <td style={{...td,color:x.imp>0?t.red:t.t3}}>{x.semPreco?dash:money(x.imp)}</td>
                  <td style={{...td,color:x.cmv>0?t.red:t.t3}}>{x.temCusto?money(x.cmv):dash}</td>
                  <td style={{...td,color:x.custoExtra>0?t.red:t.t3}}>{x.temCusto?money(x.custoExtra):dash}</td>
                  <td style={{...td,fontWeight:700,color:x.lucro===null?t.t3:(x.lucro>=0?t.grn:t.red)}}>{money(x.lucro)}</td>
                  <td style={{...td,paddingRight:0}}>
                    {x.margem===null?dash:<Pill kind={x.margem>20?'grn':x.margem>0?'gold':'red'}>{pc(x.margem)}</Pill>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detalhe do pedido (a setinha) */}
      {expandido && (
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.35fr) minmax(260px,0.65fr)',gap:22,padding:'6px 18px 18px',alignItems:'start'}} className="ora-pedido-det">
          <div style={{display:'flex',flexDirection:'column' as const,gap:11}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:11}}>
              <CaixaInfo t={t} rotulo="Data de criação" valor={`${data}, ${hora}`}/>
              <CaixaInfo t={t} rotulo="Situação" valor={pend?'Aguardando confirmação':'Confirmado pela Amazon'}/>
            </div>
            <CaixaInfo t={t} rotulo="" valor="" custom={
              <div style={{fontSize:12,color:t.t2,fontFamily:FG,lineHeight:1.8,textAlign:'center' as const}}>
                <div><b style={{color:t.t1}}>ID do pedido:</b>{' '}
                  <span style={{whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>{pedido.orderId}</span></div>
                {itens.some((i:any)=>i.asin) && <div><b style={{color:t.t1}}>ASIN:</b>{' '}
                  {itens.map((i:any)=>i.asin).filter(Boolean).map((a:string,k:number)=>(
                    <span key={k} style={{whiteSpace:'nowrap'}}>{k>0?' · ':''}{a}</span>))}</div>}
              </div>}/>
          </div>
          <div style={{display:'flex',flexDirection:'column' as const,gap:2}}>
            {/* ⚠️ Num pedido com VÁRIOS itens, se um deles não tem tarifa medida a
                linha inteira ia pra "—" e escondia o que a gente sabe do outro.
                Mostra o que foi medido e marca como parcial — some o número
                incompleto, não o número inteiro. */}
            <LinhaPedido t={t} icone="ti-shopping-cart" cor={t.grn} rotulo="Total dos itens" valor={todosSemPreco?null:tot.receita} sinal="+" hide={hide}/>
            <LinhaPedido t={t} icone="ti-percentage" cor={t.red} rotulo="Comissão" valor={tot.comissao} sinal="-" hide={hide} parcial={algumSemFee}/>
            <LinhaPedido t={t} icone="ti-package" cor={t.red} rotulo="Taxa FBA" valor={tot.fba} sinal="-" hide={hide} parcial={algumSemFee}/>
            {tot.imp>0.005 && <LinhaPedido t={t} icone="ti-receipt-tax" cor={t.red} rotulo="Imposto" valor={tot.imp} sinal="-" hide={hide}/>}
            <LinhaPedido t={t} icone="ti-basket" cor={t.red} rotulo="Custo dos produtos" valor={tot.cmv} sinal="-" hide={hide} parcial={algumSemCusto}/>
            {tot.extra>0.005 && <LinhaPedido t={t} icone="ti-tools" cor={t.red} rotulo="Custo extra" valor={tot.extra} sinal="-" hide={hide}/>}
            {/* Lançamentos avulsos DESTE pedido — cada um com o nome que o seller
                deu e um ✕ pra desfazer. Sem a lista, dá pra lançar e não dá pra
                ver nem corrigir. */}
            {meusAjustes.map((a:AjustePedido)=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0'}}>
                <span style={{width:27,height:27,borderRadius:8,background:(a.tipo==='credito'?t.grn:t.red)+(t.dark?'22':'1A'),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <i className={`ti ${a.tipo==='credito'?'ti-plus':'ti-minus'}`} style={{fontSize:14,color:a.tipo==='credito'?t.grn:t.red}} aria-hidden="true"/>
                </span>
                <span style={{fontSize:12.5,color:t.t2,fontWeight:500,fontFamily:FG,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.nome}</span>
                <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12.5,fontWeight:600,fontFamily:FG,fontVariantNumeric:'tabular-nums',color:a.tipo==='credito'?t.grn:t.red,filter:hide?'blur(6px)':'none',whiteSpace:'nowrap'}}>
                    {a.tipo==='credito'?'+':'−'}{brl2(a.valor)}
                  </span>
                  <button onClick={()=>onRemoverAjuste(a.id)} title="Remover lançamento"
                    style={{background:'none',border:'none',color:t.t3,cursor:'pointer',padding:2,lineHeight:1,fontSize:15}}>×</button>
                </span>
              </div>
            ))}
            <div style={{display:'flex',gap:9,marginTop:9,flexWrap:'wrap' as const}}>
              <button onClick={()=>setLancar('credito')} style={btnLanc(t,'credito')}>Adicionar crédito extra</button>
              <button onClick={()=>setLancar('custo')} style={btnLanc(t,'custo')}>Adicionar custo eventual</button>
            </div>
            <div style={{height:1,background:t.line,margin:'12px 0 6px'}}/>
            <LinhaPedido t={t} icone="ti-coin" cor={lucroTot===null?t.t3:(lucroTot>=0?t.grn:t.red)} rotulo="Lucro do pedido" valor={lucroTot} forte hide={hide}/>
            {algumSemCusto && <div style={{fontSize:10.5,color:t.t3,marginTop:7,lineHeight:1.45}}>Informe o custo deste produto em <b>Gerenciamento</b> pra fechar o lucro do pedido.</div>}
            {algumSemFee && !todosSemPreco && <div style={{fontSize:10.5,color:t.t3,marginTop:7,lineHeight:1.45}}>A tarifa deste produto ainda não voltou da Amazon.</div>}
            {algumEstimado && <div style={{fontSize:10.5,color:t.t3,marginTop:7,lineHeight:1.45}}>Valor marcado com <b>≈</b> vem do preço do anúncio: a Amazon só libera o valor do pedido ao confirmar.</div>}
            {todosSemPreco && <div style={{fontSize:10.5,color:t.t3,marginTop:7,lineHeight:1.45}}>A Amazon ainda não liberou o valor deste pedido e o preço do anúncio não respondeu. Nada é cobrado dele até o valor chegar — em vez de mostrar prejuízo que não existe.</div>}
          </div>
        </div>
      )}

      {/* Setinha — no lugar da lupinha */}
      <button onClick={onToggle} aria-expanded={expandido} title={expandido?'Fechar detalhe':'Ver detalhe do pedido'}
        style={{width:'100%',height:38,background:t.dark?'rgba(255,255,255,0.02)':'#FAFBFC',border:'none',borderTop:`1px solid ${t.line}`,color:t.t3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <i className={`ti ti-chevron-${expandido?'up':'down'}`} style={{fontSize:19}} aria-hidden="true"/>
      </button>

      {lancar && <ModalLancamento t={t} tipo={lancar} itens={itens} nomeDe={nomeDe}
        onCancel={()=>setLancar(null)}
        onSalvar={(sku,nome,valor)=>{ onAddAjuste({orderId:pedido.orderId,sku,tipo:lancar,nome,valor,data:pedido.date}); setLancar(null) }}/>}
    </div>
  )
}
function btnLanc(t:Theme,tipo:'credito'|'custo'):React.CSSProperties{
  const c=tipo==='credito'?t.grn:t.red
  return {flex:'1 1 auto',padding:'8px 12px',borderRadius:9,border:`1px solid ${c}55`,background:c+(t.dark?'1F':'14'),
    color:c,fontSize:11.5,fontWeight:600,fontFamily:FG,cursor:'pointer',whiteSpace:'nowrap'}
}
/* Modal de lançamento — mesmo formulário do Gestor: item, nome e valor. */
function ModalLancamento({t,tipo,itens,nomeDe,onCancel,onSalvar}:{t:Theme;tipo:'credito'|'custo';itens:any[];nomeDe:(sku:string)=>string;onCancel:()=>void;onSalvar:(sku:string,nome:string,valor:number)=>void}){
  const [sku,setSku]=useState(itens[0]?.sku||'')
  const [nome,setNome]=useState('')
  const [valor,setValor]=useState('')
  const num=parseFloat(valor.replace(/\./g,'').replace(',','.'))
  const valido=!!sku&&nome.trim().length>0&&isFinite(num)&&num>0
  const cor=tipo==='credito'?t.grn:t.red
  const campo:React.CSSProperties={width:'100%',padding:'10px 13px',borderRadius:9,border:`1px solid ${t.line2}`,
    background:t.dark?'rgba(255,255,255,0.04)':'#FFFFFF',color:t.t1,fontSize:13,fontFamily:FG,outline:'none'}
  const rot:React.CSSProperties={display:'block',fontSize:11.5,color:t.t2,marginBottom:6,fontWeight:600,fontFamily:FG}
  useEffect(()=>{
    const esc=(e:KeyboardEvent)=>{ if(e.key==='Escape') onCancel() }
    document.addEventListener('keydown',esc); return ()=>document.removeEventListener('keydown',esc)
  },[onCancel])
  return(
    <div onClick={onCancel} style={{position:'fixed',inset:0,zIndex:70,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'8vh 14px',backdropFilter:'blur(2px)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:16,width:'min(560px,96vw)',boxShadow:'0 24px 70px rgba(0,0,0,0.35)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:`1px solid ${t.line}`}}>
          <span style={{fontSize:15,fontWeight:700,color:t.t1}}>{tipo==='credito'?'Adicionar crédito extra':'Adicionar custo eventual'}</span>
          <button onClick={onCancel} style={{background:'none',border:'none',color:t.t3,fontSize:22,cursor:'pointer',lineHeight:1,padding:0}}>×</button>
        </div>
        <div style={{padding:'18px 20px',display:'flex',flexDirection:'column' as const,gap:14}}>
          <div>
            <label style={rot}>Item</label>
            <select value={sku} onChange={e=>setSku(e.target.value)} style={{...campo,cursor:'pointer'}}>
              {itens.map((it:any,i:number)=><option key={i} value={it.sku}>{nomeDe(it.sku)}</option>)}
            </select>
          </div>
          <div>
            <label style={rot}>{tipo==='credito'?'Nome do crédito':'Nome do custo'}</label>
            <input value={nome} onChange={e=>setNome(e.target.value)} maxLength={60}
              placeholder={tipo==='credito'?'Ex: Reembolso de avaria':'Ex: Frete de devolução'} style={campo}/>
          </div>
          <div>
            <label style={rot}>Valor</label>
            <input value={valor} onChange={e=>setValor(e.target.value)} inputMode="decimal"
              placeholder="Ex: 10,00" style={campo}/>
          </div>
          <div style={{fontSize:10.5,color:t.t3,lineHeight:1.5}}>
            Entra <b>só neste pedido</b> e no lucro do período. Não altera o custo unitário do produto, então não afeta as outras vendas dele.
          </div>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',padding:'14px 20px',borderTop:`1px solid ${t.line}`}}>
          <button onClick={onCancel} style={{padding:'9px 16px',borderRadius:9,border:`1px solid ${t.line2}`,background:'transparent',color:t.t2,fontSize:12.5,fontWeight:600,cursor:'pointer',fontFamily:FG}}>Cancelar</button>
          <button disabled={!valido} onClick={()=>onSalvar(sku,nome.trim(),num)}
            style={{padding:'9px 18px',borderRadius:9,border:'none',background:valido?cor:t.line2,color:valido?(t.dark?'#0A0A14':'#FFFFFF'):t.t3,
              fontSize:12.5,fontWeight:700,cursor:valido?'pointer':'not-allowed',fontFamily:FG}}>
            {tipo==='credito'?'Adicionar crédito':'Adicionar custo'}
          </button>
        </div>
      </div>
    </div>
  )
}
function CaixaInfo({t,rotulo,valor,custom}:{t:Theme;rotulo:string;valor:string;custom?:React.ReactNode}){
  return(
    <div style={{border:`1px solid ${t.line}`,borderRadius:11,padding:'13px 15px',background:t.dark?'rgba(255,255,255,0.02)':'#FFFFFF',textAlign:'center' as const}}>
      {custom || (<>
        <div style={{fontSize:12.5,fontWeight:600,color:t.t1,fontFamily:FG}}>{rotulo}</div>
        <div style={{fontSize:12,color:t.t2,marginTop:5,fontFamily:FG}}>{valor}</div>
      </>)}
    </div>
  )
}
function LinhaPedido({t,icone,cor,rotulo,valor,sinal,forte,hide,parcial}:{t:Theme;icone:string;cor:string;rotulo:string;valor:number|null;sinal?:'+'|'-';forte?:boolean;hide:boolean;parcial?:boolean}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0'}}>
      <span style={{width:27,height:27,borderRadius:8,background:cor+(t.dark?'22':'1A'),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <i className={`ti ${icone}`} style={{fontSize:14,color:cor}} aria-hidden="true"/>
      </span>
      <span style={{fontSize:12.5,color:forte?t.t1:t.t2,fontWeight:forte?700:500,fontFamily:FG,minWidth:0}}>{rotulo}
        {parcial&&<span style={{display:'block',fontSize:10,color:t.t3,fontWeight:400,marginTop:1}}>parcial — falta um item</span>}</span>
      <span style={{marginLeft:'auto',fontSize:forte?14:12.5,fontWeight:forte?700:600,fontFamily:FG,fontVariantNumeric:'tabular-nums',color:valor===null?t.t3:cor,filter:hide&&valor!==null?'blur(6px)':'none',whiteSpace:'nowrap'}}>
        {valor===null?'—':`${sinal==='+'?'+':sinal==='-'?'−':''}${brl2(valor)}`}
      </span>
    </div>
  )
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
function ProdutoDetalhe({produto,realDre,adsReal,costs,imposto,hide,onClose,ajustes}:{produto:{sku:string;name:string;image?:string;asin?:string};realDre:any;adsReal?:any;costs:Record<string,number>;imposto:number;hide:boolean;onClose:()=>void;ajustes?:AjustePedido[]}){
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
  const custoU=costs[produto.sku]||0
  // ⭐ FONTE ÚNICA: a mesma função que alimenta Top 15, Curva ABC e Analítico.
  // Antes cada tela repetia a conta com variações — por isso discordavam.
  const M=margemDoProduto({
    linhas:L, produto:p||{sku:produto.sku,units:0,receita:0}, reembolsos:realDre?.reembolsos,
    custoUnit:custoU, imposto, ads:adsDoProduto(adsReal,produto.sku,produto.asin).valor,
    ajustes:ajustesDoProduto(ajustes,produto.sku,from,to),
  })
  const units=p?.units||0
  const semPreco=p?.unitsSemPreco||0
  const semAds=M.ads===null
  const temCusto=M.temCusto
  const lucroExib=M.lucro??M.lucroAntesAds     // sem ads mostra o de antes; sem taxa medida, "—"
  const custosFixos=custosFixosDoPeriodo(L)
  const armFonte=realDre?.armazenagemFonte
  // Base pra distribuir os custos do produto entre os pedidos dele.
  const precoMedio=units>0?M.receitaBruta/units:0
  const feesProduto=M.feeMedido?(M.comissao as number)+(M.fba as number)+M.taxaPrograma+M.outrasTaxas:null

  const Row=({label,val,sign,strong,color,nota}:{label:string;val:number|null;sign?:'-'|'=';strong?:boolean;color?:string;hide?:boolean;nota?:string})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12,padding:'8px 2px',borderBottom:`1px solid ${t.line}`,fontSize:strong?14:13}}>
      <span style={{color:strong?t.t1:t.t2,fontWeight:strong?600:400}}>{sign==='='?'= ':sign==='-'?'(–) ':''}{label}
        {nota&&<span style={{display:'block',fontSize:10,color:t.t3,fontWeight:400,marginTop:1}}>{nota}</span>}</span>
      <span style={{color:val===null?t.t3:(color||t.t1),fontWeight:strong?700:500,fontFamily:FG,fontVariantNumeric:'tabular-nums',filter:hide&&val!==null?'blur(6px)':'none',whiteSpace:'nowrap'}}>{val===null?'—':brl2(val||0)}</span>
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
          <Row label={`Faturado (${units} un.)`} val={M.receitaBruta} strong hide={hide}
               nota={semPreco>0?`+${semPreco} un. que a Amazon ainda não precificou — fora da conta, não zeradas`:undefined}/>
          {/* ⭐ O desconto que o SELLER deu. Já estava descontado da receita acima,
              mas invisível: ele dava cupom e não sabia quanto tinha dado. */}
          {(p?.promo||0)>0.005 && <Row label="Desconto que você deu" val={p.promo} color={t.gold} hide={hide}
               nota="cupom, promoção ou frete grátis — já descontado do Faturado acima"/>}
          {M.devolucaoValor>0.005 && <Row label={`Devoluções (${M.devolucaoUnits} un.)`} val={M.devolucaoValor} sign="-" color={t.red} hide={hide}
               nota="estorno real do repasse — o custo dessas unidades também sai do CMV"/>}
          <Row label="Comissão Amazon" val={M.comissao} sign="-" color={t.red} hide={hide}
               nota={M.feeMedido?undefined:'a Amazon não devolveu a tarifa deste produto agora'}/>
          <Row label="Taxa FBA" val={M.fba} sign="-" color={t.red} hide={hide}/>
          {M.taxaPrograma>0.005 && <Row label="Taxa Amazon pra Todos" val={M.taxaPrograma} sign="-" color={t.red} hide={hide}
               nota={M.taxasMedidas?'cobrada por item no seu repasse':'rateada por faturamento'}/>}
          {M.outrasTaxas>0.005 && <Row label="Outras taxas" val={M.outrasTaxas} sign="-" color={t.red} hide={hide}
               nota={M.taxasMedidas?'chargeback de frete/embrulho e taxas novas, do seu repasse':'rateadas por faturamento'}/>}
          <Row label="Líq. do Marketplace" val={M.liqMarketplace} sign="=" strong color={t.grn} hide={hide}/>
          <Row label="Ads deste produto" val={M.ads} sign="-" color={t.red} hide={hide}
               nota={semAds?'gasto por produto ainda sincronizando — não rateamos o total da conta':undefined}/>
          {/* ⭐ Armazenagem MEDIDA deste produto (relatório mensal da Amazon). Só
              aparece quando existe medição — não medida fica no custo fixo, e a
              nota abaixo diz isso. ⚠️ É custo de ESTOQUE: não escala com venda,
              então produto parado paga sem ter vendido. É o ponto todo. */}
          {M.armazenagem!==null && <Row label="Armazenagem deste produto" val={M.armazenagem} sign="-" color={t.red} hide={hide}
               nota={armFonte?.parcial?'medida por SKU no relatório mensal — proporcional aos dias do período':'medida por SKU no relatório mensal da Amazon'}/>}
          {/* ⭐ ISENTA. O relatório mede o que ele PAGARIA; o repasse não cobra nada
              porque a campanha isenta. Mostrar R$0,00 e calar seria jogar fora a
              única informação que este caso tem: quanto o benefício vale por
              produto — e é esse o número que vira prejuízo no dia em que ele cair. */}
          {M.armazenagem===null && armFonte?.isenta && (armFonte?.estimadaPorSku?.[produto.sku]||0)>0.005 && (
            <Row label="Armazenagem deste produto" val={0} color={t.grn} hide={hide}
                 nota={`ISENTA pela campanha — sem ela seriam ${brl2(armFonte.estimadaPorSku[produto.sku])} neste produto`}/>
          )}
          {imposto>0 && <Row label={`Imposto (${pc(imposto)})`} val={M.imposto} sign="-" color={t.red} hide={hide}/>}
          <Row label={`Custo do produto (CMV${M.devolucaoUnits>0?`, ${M.unitsLiquidas} un.`:''})`} val={M.cmv} sign="-" color={temCusto?t.red:t.t3} hide={hide}/>
          {M.credito>0.005 && <Row label="Créditos extras lançados" val={M.credito} color={t.grn} hide={hide} nota="lançados em pedidos deste produto, na aba Vendas"/>}
          {M.custoEventual>0.005 && <Row label="Custos eventuais lançados" val={M.custoEventual} sign="-" color={t.red} hide={hide} nota="lançados em pedidos deste produto, na aba Vendas"/>}
          <div style={{height:1,background:t.line,margin:'8px 0'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:13.5,fontWeight:700,color:t.t1}}>{!M.feeMedido?'Lucro do período':semAds?'Lucro antes do Ads':'Lucro do período'}</span>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {temCusto&&M.margem!==null&&<Pill kind={M.margem>20?'grn':M.margem>0?'gold':'red'}>{pc(M.margem)}</Pill>}
              <span style={{fontSize:15,fontWeight:700,fontFamily:FG,color:t.t3,filter:'none'}}>
                {!temCusto?'informe o custo':(lucroExib===null?'—':<span style={{color:lucroExib>=0?t.grn:t.red,filter:hide?'blur(6px)':'none'}}>{brl2(lucroExib)}</span>)}
              </span>
            </div>
          </div>
        </div>
        {custosFixos>0.005 && <div style={{fontSize:10.5,color:t.t3,marginBottom:14,display:'flex',gap:6}}>
          <i className="ti ti-info-circle" style={{fontSize:12,marginTop:1}} aria-hidden="true"/>
          <span>{M.armazenagem!==null
            ? <>A armazenagem <b>deste</b> produto já está descontada acima, medida por SKU. O que sobra em custo fixo ({brl2(custosFixos)}) é a assinatura e a armazenagem que <b>não</b> tem dono — de produto que não vendeu no período, ou de ASIN com SKU duplicado, que não dá pra atribuir sem virar rateio.</>
            : <>Assinatura e armazenagem do período ({brl2(custosFixos)}) são custo fixo da conta e <b>não entram na margem de produto nenhum</b> — se entrassem, a margem deste produto mudaria conforme o dia que você escolhesse no filtro.</>}</span>
        </div>}
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
              // ⭐ O PENDENTE ENTRA COM VALOR. Antes a linha ia toda a "—" enquanto o
              // card acima JÁ contava esse pedido pelo preço do anúncio — as duas
              // metades da tela afirmavam coisas diferentes, e a fatia de taxa do
              // pendente sumia da tabela mas continuava cobrada em cima. Agora a
              // linha usa o MESMO valor que entrou no card, marcado como provisório,
              // e a soma das linhas fecha com "Faturado".
              const pend=/pending/i.test(o.status||'') || (o.receita||0)<=0
              const oReceita=(o.receita||0)>0?o.receita:precoMedio*(o.qty||0)
              const rShare=M.receitaBruta>0?oReceita/M.receitaBruta:0
              const oFees=feesProduto===null?null:feesProduto*rShare
              const oAds=M.ads===null?null:M.ads*rShare
              // ⚠️ Estas duas eram as ÚNICAS colunas não escaladas pelo rShare:
              // usavam receita e unidade BRUTAS enquanto o card já usa as líquidas
              // de devolução. Somando a tabela, Imposto e Custo davam mais que as
              // linhas de cima. Como Σ rShare = 1, escalar fecha exato.
              const oImp=M.imposto*rShare, oCmv=temCusto?M.cmv*rShare:0
              const oLiq=oFees===null?null:oReceita-oFees
              const oLucro=(oFees===null)?null:oReceita-oFees-(oAds||0)-oImp-oCmv
              const oMarg=(oLucro!==null&&oReceita>0)?oLucro/oReceita*100:null
              const dash=<span style={{fontSize:11,color:t.t3}}>—</span>
              const money=(v:number|null)=>v===null?dash:brl2(v)
              return(
                <tr key={i}>
                  <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,fontSize:11.5,color:t.t2}}>
                    <div>{o.date?.slice(0,10).split('-').reverse().join('/')}</div>
                    <div style={{fontSize:9.5,color:pend?t.gold:t.t3}}>{o.channel==='AFN'?'FBA':'FBM'}{pend?' · Pendente':''}</div>
                  </td>
                  <NumTd>{o.qty}</NumTd>
                  <NumTd strong hide={hide}>{money(oReceita)}</NumTd>
                  <NumTd color={t.t2} hide={hide}>{money(oLiq)}</NumTd>
                  {imposto>0 && <NumTd color={t.red} hide={hide}>{money(oImp)}</NumTd>}
                  <NumTd color={temCusto?t.t1:t.t3} hide={hide}>{temCusto?money(oCmv):dash}</NumTd>
                  <NumTd color={temCusto&&oLucro!==null?(oLucro>=0?t.grn:t.red):t.t3} hide={hide}>{temCusto?money(oLucro):dash}</NumTd>
                  <PillTd>{pend?<Pill kind="gold">Pendente</Pill>:(temCusto&&oMarg!==null?<Pill kind={oMarg>20?'grn':oMarg>0?'gold':'red'}>{pc(oMarg)}</Pill>:dash)}</PillTd>
                </tr>
              )
            })}
          </Table>
        )}
        <div style={{fontSize:10,color:t.t3,marginTop:10}}>Comissão e Taxa FBA são as <b>deste produto</b> (tarifa da Amazon por ASIN), não um rateio do total da conta. {semAds?<>O gasto de ads <b>deste</b> produto ainda não chegou — e não rateamos o total, porque isso faria a margem dele cair só porque OUTRO produto gastou.</>:<><b>Ads é o gasto medido deste produto</b> (relatório de produto anunciado da Amazon).</>} Pedido <b>Pendente</b> entra pelo preço do anúncio, marcado como provisório — a Amazon só libera o valor ao faturar. {M.devolucaoValor>0.005&&<>As devoluções entram no cálculo acima e <b>não</b> são distribuídas por pedido (a Amazon informa o estorno por produto, não por pedido), então a soma da tabela fecha com o <b>Faturado</b>, não com o lucro final. </>}Imposto e custo (CMV) conforme o que você informou em Gerenciamento.</div>
      </div>
    </div>
  )
}

const clsColor=(t:Theme,cls:string)=> cls==='A'?t.grn:cls==='B'?t.blue:cls==='C'?t.gold:t.t3
function ClassBadge({t,cls}:{t:Theme;cls:string}){
  const c=clsColor(t,cls)
  return <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:26,height:26,borderRadius:'50%',background:c+'22',color:c,fontWeight:700,fontSize:12,fontFamily:FG}}>{cls}</span>
}
/* ── CURVA ABC ───────────────────────────────────────────────────────────────
   ⚠️ ABC só por RECEITA responde "o que vende", não "o que dá dinheiro" — e o
   seller decide estoque e preço com a segunda pergunta. Aqui a classe cruza com
   a MARGEM do produto e vira um diagnóstico:

     A + margem acima da média = carro-chefe   → proteger estoque, escalar ads
     A + margem abaixo         = ARMADILHA     → vende muito e ganha pouco
     B/C + margem acima        = oportunidade  → escalar
     B/C + margem abaixo       = peso morto    → rever preço ou matar
     estoque sem giro          = capital parado

   O eixo é escolhível: classificar por LUCRO em vez de receita revela na hora
   quem é "A" na venda e não é "A" no bolso.
   ────────────────────────────────────────────────────────────────────────── */
type DiagABC='chefe'|'adsPrejuizo'|'adsPesado'|'prejuizo'|'armadilha'|'oportunidade'|'apertado'|'incerto'
/* ⚠️ REESCRITO depois que o João olhou o painel dele e a curva A INTEIRA saiu
   como "Armadilha" — e uma Máquina de Donuts com +R$356 de lucro saiu como
   "Peso morto". Dois defeitos:

   1) BUG DE RÉGUA: a margem de cada produto era a DEPOIS do ads, e a média da
      conta usada como régua era a de ANTES. Descontar o anúncio de um lado e não
      do outro joga quase todo mundo "abaixo da média" por construção.

   2) DIAGNÓSTICO SEM CAUSA: "mate esse produto" quando o problema é a CAMPANHA
      é conselho errado. Produto com margem boa que o anúncio derruba não é
      produto ruim — é campanha mal ajustada, e a ação é outra.

   A régua do ads é a que o João já usa com os mentorados: ACOS contra a margem
   ANTES do anúncio. Se o anúncio consome mais do que o produto ganha, o
   problema tem nome. */
const DIAG:Record<DiagABC,{rotulo:string;kind:'grn'|'gold'|'red'|'cinza';motivo:string;acao:string}>={
  chefe:{rotulo:'Carro-chefe',kind:'grn',
    motivo:'Está entre os que mais vendem E a margem dele é acima da média da sua conta.',
    acao:'Proteja o estoque desse antes de qualquer outro e escale o anúncio: cada real investido nele volta melhor que na média.'},
  adsPrejuizo:{rotulo:'Ads comendo o lucro',kind:'red',
    motivo:'O produto GANHA dinheiro na operação, mas o anúncio consome mais do que a margem dele aguenta — o ACOS passou da margem antes do ads.',
    acao:'Não é o produto, é a campanha. Antes de mexer em preço: baixe o lance, corte as palavras que gastam sem converter, ou pause a campanha e veja o que sobra de venda orgânica.'},
  adsPesado:{rotulo:'Ads pesado',kind:'gold',
    motivo:'Sobra lucro, mas o anúncio já come mais da metade da margem que o produto gera.',
    acao:'Ainda dá lucro, então não pare — otimize. Veja as palavras de maior gasto e menor conversão; cada ponto de ACOS que você tira vira margem direta.'},
  prejuizo:{rotulo:'No prejuízo',kind:'red',
    motivo:'Não fecha nem sem o anúncio: a margem antes do ads já é negativa.',
    acao:'Aqui o anúncio não é o vilão. É preço, custo de compra, tarifa ou devolução. Revise o custo cadastrado primeiro — depois o preço.'},
  armadilha:{rotulo:'Armadilha',kind:'red',
    motivo:'Está entre os que mais vendem, dá lucro, mas rende bem menos que a média da sua conta.',
    acao:'Como tem volume, cada ponto de margem recuperado aqui vale muito mais que em qualquer outro produto. Comece por preço e custo de compra.'},
  oportunidade:{rotulo:'Oportunidade',kind:'gold',
    motivo:'Ganha acima da média da sua conta e vende pouco.',
    acao:'Ganha bem e quase ninguém compra. Vale testar anúncio ou melhorar o anúncio antes de investir em produto novo.'},
  apertado:{rotulo:'Margem apertada',kind:'cinza',
    motivo:'Dá lucro, mas abaixo da média da conta, e sem volume pra compensar.',
    acao:'Não é urgente nem é campeão. Se quiser mexer, veja preço e custo — mas priorize os de volume antes deste.'},
  incerto:{rotulo:'Informe o custo',kind:'cinza',
    motivo:'Sem o custo (CMV) cadastrado não dá pra saber se esse produto dá dinheiro.',
    acao:'Informe o custo dele na aba Gerenciamento — é o que falta pro Oráculo classificar.'},
}
const RESUMO_DIAG:Record<DiagABC,string>={
  chefe:'vende muito · margem acima da média',
  adsPrejuizo:'o anúncio consome mais que a margem',
  adsPesado:'o anúncio come mais da metade da margem',
  prejuizo:'negativo já antes do anúncio',
  armadilha:'vende muito · rende abaixo da média',
  oportunidade:'margem acima da média · vende pouco',
  apertado:'lucro abaixo da média · sem volume',
  incerto:'falta o custo',
}

/* A regra, num lugar só. `pre` = margem ANTES do ads, `pos` = DEPOIS, ambas em %.
   `acos` = quanto o anúncio consome da receita do produto. */
function diagnosticar(o:{cls:'A'|'B'|'C';temCusto:boolean;pre:number|null;pos:number|null;acos:number|null;media:number|null}):DiagABC{
  if(!o.temCusto||o.pre===null) return 'incerto'
  // Negativo ANTES do anúncio: o anúncio não tem culpa nenhuma.
  if(o.pre<0) return 'prejuizo'
  if(o.acos!==null){
    if(o.acos>o.pre) return 'adsPrejuizo'          // consome mais do que o produto gera
    if(o.acos>o.pre/2) return 'adsPesado'          // come mais da metade da margem
  }
  const m=o.pos??o.pre
  // ⚠️ PISO EM ZERO na régua. Num mês em que a conta inteira fecha no vermelho, a
  // média fica negativa e um produto de 1% de margem viraria "carro-chefe" por
  // estar "acima da média". Estar acima de uma média ruim não é ser bom.
  const regua=o.media===null?0:Math.max(0,o.media)
  if(m>=regua) return o.cls==='A'?'chefe':'oportunidade'
  return o.cls==='A'?'armadilha':'apertado'
}

/* Classifica uma lista de produtos igual a tela faz — usada pro período ATUAL e
   pro ANTERIOR, pra comparacao ser maca com maca. */
function classificarABC(dre:any,costs:Record<string,number>,imposto:number,eixo:'receita'|'lucro',ajustes?:AjustePedido[]){
  const L=dre?.linhas||{}
  const from=dre?.period?.from, to=dre?.period?.to
  const base=(dre?.produtos||[]).map((p:any)=>{
    // ⚠️ ads NAO entra: o periodo anterior exigiria uma segunda chamada de ads e
    // o relatorio so guarda ~95 dias. Os dois lados usam lucro ANTES do ads —
    // comparar um lado com ads e outro sem seria pior que nao comparar.
    const M=margemDoProduto({linhas:L,produto:p,reembolsos:dre?.reembolsos,
      custoUnit:costs[p.sku]||0,imposto,ads:null,
      ajustes:ajustesDoProduto(ajustes,p.sku,from,to)})
    return {sku:p.sku,receita:M.receitaLiquida,lucro:M.lucroAntesAds}
  })
  const valorDe=(r:any)=>eixo==='lucro'?(r.lucro??null):r.receita
  const ord=base.filter((r:any)=>valorDe(r)!==null).sort((a:any,b:any)=>(valorDe(b)||0)-(valorDe(a)||0))
  const tot=ord.reduce((s:number,r:any)=>s+Math.max(0,valorDe(r)||0),0)
  let cum=0,aDone=false,bDone=false
  const mapa=new Map<string,{cls:'A'|'B'|'C';valor:number}>()
  for(const r of ord){
    cum+=Math.max(0,valorDe(r)||0)
    const acum=tot>0?cum/tot*100:0
    let cls:'A'|'B'|'C'; if(!aDone){cls='A'; if(acum>=80)aDone=true} else if(!bDone){cls='B'; if(acum>=95)bDone=true} else cls='C'
    mapa.set(r.sku,{cls,valor:valorDe(r)||0})
  }
  return mapa
}
const ORDEM_CLS:Record<string,number>={A:0,B:1,C:2}
function corDiag(t:Theme,k:DiagABC):string{
  return DIAG[k].kind==='grn'?t.grn:DIAG[k].kind==='red'?t.red:DIAG[k].kind==='gold'?t.gold:t.t3
}
function chipDiag(t:Theme,ativo:boolean,cor:string):React.CSSProperties{
  return {padding:'6px 12px',borderRadius:20,border:`1px solid ${ativo?cor:t.line2}`,
    background:ativo?cor+(t.dark?'22':'1A'):'transparent',color:ativo?cor:t.t2,
    fontSize:11.5,fontWeight:600,fontFamily:FG,cursor:'pointer',whiteSpace:'nowrap'}
}

function CurvaABC({realDre,costs={},adsReal,inv,connected,mockD,hide,imposto=0,ajustes,onDetail}:{realDre?:any;costs?:Record<string,number>;adsReal?:any;inv?:any;connected?:boolean|null;mockD?:ReturnType<typeof abcCurve>;hide:boolean;imposto?:number;ajustes?:AjustePedido[];onDetail?:(p:any)=>void}){
  const t=useT()
  const [eixo,setEixo]=useState<'receita'|'lucro'>('receita')
  const [filtro,setFiltro]=useState<DiagABC|null>(null)
  // ⚠️ Comparacao NASCE DESLIGADA e busca sob demanda: e uma segunda DRE inteira.
  // Ligar por padrao dobraria o tempo de abrir a aba pra quem nem quer comparar.
  const [comparar,setComparar]=useState(false)
  const [antes,setAntes]=useState<any|null|'erro'>(null)
  const pFrom=realDre?.period?.from, pTo=realDre?.period?.to
  useEffect(()=>{
    if(!comparar||!pFrom||!pTo){ return }
    const ini=Date.parse(pFrom), fim=Date.parse(pTo)
    if(!isFinite(ini)||!isFinite(fim)||fim<=ini) return
    const dur=fim-ini
    const aFrom=new Date(ini-dur-1).toISOString(), aTo=new Date(ini-1).toISOString()
    let vivo=true; setAntes(null)
    fetch(`/api/amazon/finance?from=${encodeURIComponent(aFrom)}&to=${encodeURIComponent(aTo)}`)
      .then(r=>r.json()).then(d=>{ if(vivo) setAntes(d&&d.produtos?d:'erro') })
      .catch(()=>{ if(vivo) setAntes('erro') })
    return ()=>{ vivo=false }
  },[comparar,pFrom,pTo])
  if(connected && !realDre) return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'22px',textAlign:'center' as const,color:t.t3,fontSize:12.5,fontFamily:FG}}>Carregando dados da Amazon…</div>
  if(!realDre){ void mockD; return <ConnectEmpty/> }

  const L=realDre.linhas||{}
  const from=realDre?.period?.from, to=realDre?.period?.to
  // Uma passada por produto, com a fonte única. Nada de conta paralela aqui.
  const base=(realDre.produtos||[]).map((p:any)=>{
    const M=margemDoProduto({linhas:L,produto:p,reembolsos:realDre?.reembolsos,
      custoUnit:costs[p.sku]||0,imposto,ads:adsDoProduto(adsReal,p.sku,p.asin).valor,
      ajustes:ajustesDoProduto(ajustes,p.sku,from,to)})
    // `pre` e `pos` explícitas: a régua do diagnóstico compara SEMPRE a mesma
    // grandeza dos dois lados (foi misturar as duas que fez a curva A inteira
    // virar "armadilha" no painel do João).
    const pre=M.receitaLiquida>0&&M.lucroAntesAds!==null?M.lucroAntesAds/M.receitaLiquida*100:null
    const pos=M.receitaLiquida>0&&M.lucro!==null?M.lucro/M.receitaLiquida*100:null
    const acos=M.receitaLiquida>0&&M.ads!==null?M.ads/M.receitaLiquida*100:null
    return {p,units:p.units||0,receita:M.receitaLiquida,lucro:M.lucroAntesAds,
      lucroPos:M.lucro,margem:M.margem,temCusto:M.temCusto,pre,pos,acos,ads:M.ads}
  })

  // Margem média PONDERADA da conta (só quem tem custo) — é a régua do diagnóstico.
  // ⚠️ A régua tem que ser da MESMA grandeza que a margem mostrada na linha.
  // Se há ads medido por produto, a margem exibida é PÓS ads → a média também.
  // Antes eu comparava margem pós-ads contra média pré-ads: quase todo produto
  // caía "abaixo da média" por construção, e a curva A inteira virava armadilha.
  const usaPos=temAdsPorSku(adsReal)
  const comCusto=base.filter((r:any)=>r.temCusto&&(usaPos?r.pos!==null:r.pre!==null))
  const recCC=comCusto.reduce((s:number,r:any)=>s+r.receita,0)
  const margemMedia=recCC>0
    ? comCusto.reduce((s:number,r:any)=>s+((usaPos?r.lucroPos:r.lucro)||0),0)/recCC*100
    : null

  // Classificação: por RECEITA (padrão) ou por LUCRO. No eixo lucro, produto sem
  // custo não entra — classificar por um lucro que não existe seria inventar.
  const valorDe=(r:any)=>eixo==='lucro'?(r.lucro??null):r.receita
  const classificaveis=base.filter((r:any)=>valorDe(r)!==null)
  const semClasse=base.filter((r:any)=>valorDe(r)===null)
  const ordenado=[...classificaveis].sort((a:any,b:any)=>(valorDe(b)||0)-(valorDe(a)||0))
  const totalEixo=ordenado.reduce((s:number,r:any)=>s+Math.max(0,valorDe(r)||0),0)
  let cum=0,aDone=false,bDone=false
  const rows=ordenado.map((r:any)=>{
    cum+=Math.max(0,valorDe(r)||0)
    const acum=totalEixo>0?cum/totalEixo*100:0
    let cls:'A'|'B'|'C'; if(!aDone){cls='A'; if(acum>=80)aDone=true} else if(!bDone){cls='B'; if(acum>=95)bDone=true} else cls='C'
    const diag=diagnosticar({cls,temCusto:r.temCusto,pre:r.pre,pos:r.pos,acos:r.acos,media:margemMedia})
    return {...r,cls,acum,diag}
  })

  // Curva Z: estoque parado. O que importa não é quantos são — é quanto CAPITAL
  // está preso ali. `custoUnit` já soma CMV + custos extras.
  const vendeu=new Set(base.map((r:any)=>r.p.sku))
  const zItens=(inv?.inventario||[]).filter((it:any)=>(it.total||0)>0&&!vendeu.has(it.sku))
    .map((it:any)=>({...it,capital:(costs[it.sku]||0)*(it.total||0)}))
    .sort((a:any,b:any)=>b.capital-a.capital)
  const zCapital=zItens.reduce((s:number,it:any)=>s+it.capital,0)
  const zUnidades=zItens.reduce((s:number,it:any)=>s+(it.total||0),0)
  const zSemCusto=zItens.filter((it:any)=>!(costs[it.sku]>0)).length

  const agg=(cls:string)=>{
    const its=rows.filter((r:any)=>r.cls===cls)
    return {count:its.length,units:its.reduce((s:number,r:any)=>s+r.units,0),
      fat:its.reduce((s:number,r:any)=>s+r.receita,0),
      lb:its.some((r:any)=>r.lucro===null)?null:its.reduce((s:number,r:any)=>s+(r.lucro||0),0),
      lp:its.some((r:any)=>r.lucroPos===null)?null:its.reduce((s:number,r:any)=>s+(r.lucroPos||0),0),
      hasCusto:its.some((r:any)=>r.temCusto)}
  }
  const A=agg('A'), B=agg('B'), C=agg('C')
  const fatTotal=rows.reduce((s:number,r:any)=>s+r.receita,0)
  const top1=rows[0], top3=rows.slice(0,3).reduce((s:number,r:any)=>s+r.receita,0)
  const armadilhas=rows.filter((r:any)=>r.diag==='armadilha')
  const recArmadilha=armadilhas.reduce((s:number,r:any)=>s+r.receita,0)
  // ⭐ Quanto de lucro o ANÚNCIO está comendo nos produtos onde ele é o vilão.
  // É o número acionável que faltava: em vez de mandar matar o produto, mostra
  // quanto dá pra recuperar mexendo só na campanha.
  const adsVilao=rows.filter((r:any)=>r.diag==='adsPrejuizo'||r.diag==='adsPesado')
  const lucroComidoAds=adsVilao.reduce((s:number,r:any)=>s+((r.lucro||0)-(r.lucroPos??r.lucro??0)),0)
  const noPrejuizoPorAds=rows.filter((r:any)=>r.diag==='adsPrejuizo')
  const semAdsPorProduto=!temAdsPorSku(adsReal)

  // ── Comparação com o período anterior de MESMA duração ──────────────────────
  const antesOk=comparar&&antes&&antes!=='erro'
  const mapaAntes=antesOk?classificarABC(antes,costs,imposto,eixo,ajustes):null
  const movimento=(sku:string,valorAtual:number)=>{
    if(!mapaAntes) return null
    const a=mapaAntes.get(sku)
    if(!a) return {tipo:'novo' as const,clsAntes:null,delta:null}
    const delta=a.valor!==0?(valorAtual-a.valor)/Math.abs(a.valor)*100:null
    return {tipo:'existia' as const,clsAntes:a.cls,delta,valorAntes:a.valor}
  }
  // Produtos que vendiam antes e não venderam agora — sinal que ninguém mostra.
  const skusAgora=new Set(rows.map((r:any)=>r.sku||r.p.sku))
  const sumiram=mapaAntes?[...mapaAntes.entries()].filter(([sku])=>!skusAgora.has(sku)):[]
  // Pareia linha↔movimento pelo ÍNDICE (nada de indexOf sobre objetos: com dois
  // produtos de mesmo movimento ele casaria o errado, além de ser O(n²)).
  const linhas2=rows.map((r:any)=>({r,m:movimento(r.p.sku,eixo==='lucro'?(r.lucro||0):r.receita)}))
  const subiu=(x:any)=>!!x.m?.clsAntes&&ORDEM_CLS[x.m.clsAntes]>ORDEM_CLS[x.r.cls]
  const caiu =(x:any)=>!!x.m?.clsAntes&&ORDEM_CLS[x.m.clsAntes]<ORDEM_CLS[x.r.cls]
  const nSubiu=linhas2.filter(subiu).length
  const nCaiu=linhas2.filter(caiu).length
  const nNovos=linhas2.filter((x:any)=>x.m?.tipo==='novo').length

  const kpi=(rotulo:string,valor:string,nota:string,cor:string)=>(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:13,padding:'13px 16px'}}>
      <div style={{fontSize:10,color:t.t3,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.05em',fontFamily:FG}}>{rotulo}</div>
      <div style={{fontSize:19,fontWeight:700,color:cor,fontFamily:FG,marginTop:5,fontVariantNumeric:'tabular-nums',filter:hide?'blur(6px)':'none'}}>{valor}</div>
      <div style={{fontSize:10.5,color:t.t3,marginTop:3,lineHeight:1.4}}>{nota}</div>
    </div>
  )
  const Linha=({label,value,color}:{label:string;value:string;color?:string})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'5px 0',borderTop:`1px solid ${t.line}`,fontSize:12}}>
      <span style={{color:t.t2,fontFamily:FG}}>{label}</span>
      <span style={{color:color||t.t1,fontWeight:600,fontFamily:FG,filter:hide?'blur(5px)':'none'}}>{value}</span>
    </div>
  )
  const btnEixo=(v:'receita'|'lucro',rotulo:string)=>(
    <button onClick={()=>setEixo(v)} style={{padding:'6px 13px',borderRadius:8,border:`1px solid ${eixo===v?t.gold:t.line2}`,
      background:eixo===v?t.gold+(t.dark?'22':'1A'):'transparent',color:eixo===v?t.gold:t.t2,
      fontSize:11.5,fontWeight:600,fontFamily:FG,cursor:'pointer'}}>{rotulo}</button>
  )

  return(<>
    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' as const,marginBottom:12}}>
      <span style={{fontSize:11.5,color:t.t2,fontFamily:FG,fontWeight:600}}>Classificar por:</span>
      {btnEixo('receita','Receita')}
      {btnEixo('lucro','Lucro')}
      <span style={{fontSize:10.5,color:t.t3,marginLeft:4}}>
        {eixo==='receita'?'quem mais fatura':'quem mais deixa dinheiro — costuma ser outra ordem'}
      </span>
      <button onClick={()=>setComparar(v=>!v)} style={{marginLeft:'auto',padding:'6px 13px',borderRadius:8,
        border:`1px solid ${comparar?t.blue:t.line2}`,background:comparar?t.blue+(t.dark?'22':'1A'):'transparent',
        color:comparar?t.blue:t.t2,fontSize:11.5,fontWeight:600,fontFamily:FG,cursor:'pointer',
        display:'inline-flex',alignItems:'center',gap:6}}>
        <i className={`ti ti-${comparar?'eye-off':'arrows-left-right'}`} style={{fontSize:14}} aria-hidden="true"/>
        {comparar?'Ocultar comparação':'Comparar com período anterior'}
      </button>
    </div>

    {/* Movimento entre períodos — só quando o seller pede. */}
    {comparar && (
      antes===null ? (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:12,padding:'13px 16px',marginBottom:14,fontSize:12,color:t.t3,fontFamily:FG}}>
          Buscando o período anterior de mesma duração…
        </div>
      ) : antes==='erro' ? (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:12,padding:'13px 16px',marginBottom:14,fontSize:12,color:t.t3,fontFamily:FG}}>
          Não consegui montar o período anterior agora. Tente de novo em instantes.
        </div>
      ) : (
        <div style={{background:t.card,border:`1px solid ${t.line}`,borderLeft:`3px solid ${t.blue}`,borderRadius:12,padding:'13px 16px',marginBottom:14}}>
          <div style={{display:'flex',gap:18,flexWrap:'wrap' as const,alignItems:'baseline'}}>
            <span style={{fontSize:12.5,fontWeight:700,color:t.t1,fontFamily:FG}}>vs. período anterior</span>
            <span style={{fontSize:12,color:t.grn,fontFamily:FG}}><b>{nSubiu}</b> {nSubiu===1?'subiu':'subiram'} de curva</span>
            <span style={{fontSize:12,color:t.red,fontFamily:FG}}><b>{nCaiu}</b> {nCaiu===1?'caiu':'caíram'}</span>
            <span style={{fontSize:12,color:t.t2,fontFamily:FG}}><b>{nNovos}</b> novo{nNovos===1?'':'s'}</span>
            {sumiram.length>0 && <span style={{fontSize:12,color:t.gold,fontFamily:FG}}><b>{sumiram.length}</b> {sumiram.length===1?'parou':'pararam'} de vender</span>}
          </div>
          {sumiram.length>0 && (
            <div style={{fontSize:10.5,color:t.t3,marginTop:7,lineHeight:1.5}}>
              Vendiam antes e não venderam agora: {sumiram.slice(0,5).map(([sku]:any)=>sku).join(' · ')}{sumiram.length>5?` · +${sumiram.length-5}`:''}
            </div>
          )}
          <div style={{fontSize:10.5,color:t.t3,marginTop:7,lineHeight:1.5}}>
            Compara com os {Math.max(1,Math.round((Date.parse(pTo||'')-Date.parse(pFrom||''))/86400000))} dia(s) imediatamente anteriores. Os dois lados usam lucro <b>antes do ads</b>, pra comparar maçã com maçã.
          </div>
        </div>
      )
    )}

    {/* Leitura do período, não só a classificação */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,marginBottom:16}} className="ora-kpis4">
      {kpi('Concentração',top1&&fatTotal>0?pc(top1.receita/fatTotal*100):'—',
        top1?`${top1.p.name?String(top1.p.name).slice(0,26):top1.p.sku} é seu maior produto`:'sem venda no período',
        (top1&&fatTotal>0&&top1.receita/fatTotal>0.4)?t.red:t.t1)}
      {kpi('Top 3 do faturamento',fatTotal>0?pc(top3/fatTotal*100):'—',
        `${A.count} produto${A.count===1?'':'s'} fazem 80% do total`,t.t1)}
      {adsVilao.length>0
        ? kpi('Lucro que o Ads comeu',brl2(lucroComidoAds),
            `${adsVilao.length} produto${adsVilao.length===1?'':'s'} com anúncio pesado${noPrejuizoPorAds.length?` · ${noPrejuizoPorAds.length} no prejuízo SÓ por causa dele`:''}`,
            noPrejuizoPorAds.length?t.red:t.gold)
        : kpi('Receita em armadilha',armadilhas.length?brl2(recArmadilha):'—',
            armadilhas.length?`${armadilhas.length} produto${armadilhas.length===1?'':'s'} vendem muito e ganham pouco`:'nenhum produto A abaixo da média',
            armadilhas.length?t.red:t.grn)}
      {kpi('Capital parado',zItens.length?brl2(zCapital):'—',
        zItens.length?`${zUnidades} un. em estoque sem giro${zSemCusto?` · ${zSemCusto} sem custo informado`:''}`:'nada parado no FBA',
        zCapital>0?t.gold:t.t1)}
    </div>

    {/* Barra de Pareto — a proporção antes dos números */}
    {fatTotal>0 && (
      <div style={{marginBottom:16}}>
        <div style={{display:'flex',height:12,borderRadius:7,overflow:'hidden',border:`1px solid ${t.line}`}}>
          {(['A','B','C'] as const).map(cl=>{
            const v=cl==='A'?A.fat:cl==='B'?B.fat:C.fat
            return v>0?<div key={cl} title={`Curva ${cl}: ${brl2(v)}`} style={{width:`${v/fatTotal*100}%`,background:clsColor(t,cl)}}/>:null
          })}
        </div>
        <div style={{display:'flex',gap:16,marginTop:7,flexWrap:'wrap' as const}}>
          {(['A','B','C'] as const).map(cl=>{
            const a=cl==='A'?A:cl==='B'?B:C
            return(<span key={cl} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:11,color:t.t2,fontFamily:FG}}>
              <span style={{width:9,height:9,borderRadius:3,background:clsColor(t,cl)}}/>
              Curva {cl} · {a.count} produto{a.count===1?'':'s'} · {fatTotal>0?pc(a.fat/fatTotal*100):'0%'}
            </span>)
          })}
        </div>
      </div>
    )}

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:13,marginBottom:18}}>
      {([{cls:'A',...A},{cls:'B',...B},{cls:'C',...C}] as any[]).map(c=>{
        const color=clsColor(t,c.cls)
        const lbPct=(c.lb!==null&&c.fat>0)?c.lb/c.fat*100:0, lpPct=(c.lp!==null&&c.fat>0)?c.lp/c.fat*100:0
        const temLb=c.hasCusto&&c.lb!==null, temLp=c.hasCusto&&c.lp!==null
        return(
          <div key={c.cls} style={{background:t.card,border:`1px solid ${t.line}`,borderTop:`3px solid ${color}`,borderRadius:14,padding:'14px 16px 12px'}}>
            <div style={{textAlign:'center' as const,fontFamily:FG,fontSize:18,fontWeight:700,color:t.t1,marginBottom:10}}>Curva {c.cls}</div>
            <Linha label="Produtos diferentes" value={String(c.count)}/>
            <Linha label="Unidades vendidas" value={String(c.units)}/>
            <Linha label="Faturamento" value={brl2(c.fat)}/>
            <Linha label="Lucro" value={temLb?`${brl2(c.lb)} (${pc(lbPct)})`:'—'} color={temLb?(c.lb>=0?t.grn:t.red):t.t3}/>
            <Linha label="Lucro pós Ads" value={temLp?`${brl2(c.lp)} (${pc(lpPct)})`:'—'} color={temLp?(c.lp>=0?t.grn:t.red):t.t3}/>
          </div>
        )
      })}
      {/* Z não é uma curva de venda — é capital parado. Card com cara própria. */}
      <div style={{background:t.card,border:`1px solid ${t.line}`,borderTop:`3px solid ${t.t3}`,borderRadius:14,padding:'14px 16px 12px'}}>
        <div style={{textAlign:'center' as const,fontFamily:FG,fontSize:18,fontWeight:700,color:t.t1,marginBottom:10}}>Curva Z</div>
        <Linha label="Produtos parados" value={String(zItens.length)}/>
        <Linha label="Unidades no FBA" value={String(zUnidades)}/>
        <Linha label="Capital preso" value={zItens.length?brl2(zCapital):'—'} color={zCapital>0?t.gold:t.t3}/>
        <div style={{fontSize:10.5,color:t.t3,marginTop:9,lineHeight:1.45}}>
          Tem estoque e não vendeu nada no período. {zSemCusto>0?`${zSemCusto} sem custo informado — o capital real é maior.`:'Dinheiro parado que podia estar girando.'}
        </div>
      </div>
    </div>

    {/* FILTRO POR DIAGNÓSTICO — clicar mostra só aquele grupo E explica o que é.
        Sem isso o selo julgava sem dizer por quê, e não dava pra isolar o grupo
        que interessa naquele momento. */}
    <div style={{display:'flex',gap:8,flexWrap:'wrap' as const,marginBottom:12,alignItems:'center'}}>
      <button onClick={()=>setFiltro(null)} style={chipDiag(t,filtro===null,t.t2)}>
        Todos <span style={{opacity:0.7}}>({rows.length})</span>
      </button>
      {(['chefe','adsPrejuizo','adsPesado','prejuizo','armadilha','oportunidade','apertado','incerto'] as DiagABC[]).map(k=>{
        const n=rows.filter((r:any)=>r.diag===k).length
        if(!n) return null
        return(<button key={k} onClick={()=>setFiltro(filtro===k?null:k)} style={chipDiag(t,filtro===k,corDiag(t,k))}>
          {DIAG[k].rotulo} <span style={{opacity:0.7}}>({n})</span>
        </button>)
      })}
    </div>
    {filtro && (
      <div style={{background:t.card,border:`1px solid ${t.line}`,
        borderLeft:`3px solid ${corDiag(t,filtro)}`,
        borderRadius:12,padding:'13px 16px',marginBottom:14}}>
        <div style={{fontSize:12.5,fontWeight:700,color:t.t1,fontFamily:FG,marginBottom:5}}>
          {DIAG[filtro].rotulo} — por que esses produtos caíram aqui
        </div>
        <div style={{fontSize:12,color:t.t2,lineHeight:1.55}}>{DIAG[filtro].motivo}</div>
        <div style={{fontSize:12,color:t.t1,lineHeight:1.55,marginTop:7}}>
          <b>O que fazer:</b> {DIAG[filtro].acao}
        </div>
        {margemMedia!==null && filtro!=='incerto' && (
          <div style={{fontSize:10.5,color:t.t3,marginTop:7}}>
            A régua é a margem média ponderada da sua conta no período: <b>{pc(margemMedia)}</b>
            {margemMedia<0?', com piso em 0% — estar acima de uma média negativa não conta como estar bem':''}.
            Ela muda quando você muda o filtro de data.{temAdsPorSku(adsReal)?' Como há gasto de ads por produto, a régua e as margens são DEPOIS do anúncio, dos dois lados.':''}
          </div>
        )}
      </div>
    )}

    <Table minWidth={mapaAntes?1180:1020} head={[{label:'Produto',w:'24%'},{label:'Curva',right:true,w:'7%'},
      ...(mapaAntes?[{label:'vs. anterior',right:true,w:'13%'}]:[]),
      {label:'Un.',right:true,w:'6%'},
      {label:eixo==='lucro'?'Lucro':'Receita',right:true,w:'11%'},{label:'% acum.',right:true,w:'7%'},
      {label:margemMedia!==null?`Margem · média ${pc(margemMedia)}`:'Margem',right:true,w:'10%'},
      {label:'Lucro pós Ads',right:true,w:'11%'},{label:'Diagnóstico',right:true,w:'14%'},{label:'',right:true,w:'6%'}]}>
      {linhas2.filter(({r}:any)=>!filtro||r.diag===filtro).map(({r,m}:any,i:number)=>{
        const d=DIAG[r.diag as DiagABC]
        const dir=m?.clsAntes?(ORDEM_CLS[m.clsAntes]>ORDEM_CLS[r.cls]?'sobe':ORDEM_CLS[m.clsAntes]<ORDEM_CLS[r.cls]?'cai':'igual'):null
        return(
          <tr key={i}>
            <ProdCell p={{id:r.p.sku,image:r.p.image,name:r.p.name||r.p.sku,sku:r.p.sku}}/>
            <PillTd><ClassBadge t={t} cls={r.cls}/></PillTd>
            {mapaAntes && <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,textAlign:'right' as const,whiteSpace:'nowrap' as const}}>
              {!m ? <span style={{fontSize:11,color:t.t3}}>—</span>
                : m.tipo==='novo' ? <Pill kind="gold">novo</Pill>
                : (<span style={{display:'inline-flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                    <span style={{fontSize:11,color:t.t3,fontFamily:FG}}>{m.clsAntes}</span>
                    <i className={`ti ti-arrow-${dir==='sobe'?'up':dir==='cai'?'down':'right'}`}
                       style={{fontSize:13,color:dir==='sobe'?t.grn:dir==='cai'?t.red:t.t3}} aria-hidden="true"/>
                    {m.delta!==null && <span style={{fontSize:11.5,fontWeight:600,fontFamily:FG,fontVariantNumeric:'tabular-nums',
                      color:m.delta>=0?t.grn:t.red,filter:hide?'blur(5px)':'none'}}>
                      {m.delta>=0?'+':''}{m.delta.toFixed(0)}%</span>}
                  </span>)}
            </td>}
            <NumTd>{r.units}</NumTd>
            <NumTd strong hide={hide}>{eixo==='lucro'?(r.lucro!==null?brl2(r.lucro):'—'):brl2(r.receita)}</NumTd>
            <NumTd color={t.t2}>{r.acum.toFixed(0)}%</NumTd>
            <PillTd>{r.margem!==null?<Pill kind={r.margem>20?'grn':r.margem>0?'gold':'red'}>{pc(r.margem)}</Pill>:<span style={{fontSize:11,color:t.t3}}>—</span>}</PillTd>
            <NumTd color={r.lucroPos!==null?(r.lucroPos>=0?t.grn:t.red):t.t3} hide={hide}>{r.lucroPos!==null?brl2(r.lucroPos):'—'}</NumTd>
            <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,textAlign:'right' as const}}>
              <Pill kind={d.kind==='cinza'?'gold':d.kind}>{d.rotulo}</Pill>
              {/* O PORQUÊ na própria linha — não em tooltip, que some no celular. */}
              {/* O número que SUSTENTA o diagnóstico, não só o adjetivo. */}
              <div style={{fontSize:9.5,color:t.t3,marginTop:3,lineHeight:1.35,whiteSpace:'normal' as const}}>
                {(r.diag==='adsPrejuizo'||r.diag==='adsPesado')&&r.acos!==null&&r.pre!==null
                  ? `ACOS ${pc(r.acos)} · margem ${pc(r.pre)} antes do ads`
                  : RESUMO_DIAG[r.diag as DiagABC]}
              </div>
            </td>
            <PillTd><ZoomBtn onClick={()=>onDetail?.({sku:r.p.sku,name:r.p.name||r.p.sku,image:r.p.image,asin:r.p.asin})}/></PillTd>
          </tr>
        )
      })}
    </Table>
    {semClasse.length>0 && (
      <div style={{fontSize:11,color:t.t3,marginTop:9,fontFamily:FG}}>
        {semClasse.length} produto{semClasse.length===1?'':'s'} fora da classificação por lucro — falta o custo (CMV) em Gerenciamento.
      </div>
    )}
    <div style={{fontFamily:FG,fontSize:10.5,color:t.t3,marginTop:8,lineHeight:1.5}}>
      Curva A ≈ 80% do {eixo==='lucro'?'lucro':'faturamento'} · B ≈ 15% · C ≈ resto · Z = em estoque sem giro.
      O <b>diagnóstico</b> cruza a curva com a margem do produto contra a média da sua conta{margemMedia!==null?` (${pc(margemMedia)})`:''} — é isso que separa o que vende do que dá dinheiro.
      {semAdsPorProduto?' O gasto de ads por produto ainda está sincronizando: "Lucro pós Ads" fica vazio até chegar, em vez de sair de um rateio.':''}
    </div>
  </>)
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
/* ── ADMIN · ARMAZENAGEM POR SKU ─────────────────────────────────────────────
   O relatório mensal da Amazon é a fonte da armazenagem por produto, e ele chega
   com o cabeçalho que a Amazon quiser: hífen, underscore ou traduzido. Um botão
   aqui vale mais que uma linha de curl porque a informação que importa —
   `colunasNaoReconhecidas` — é justamente a que não aparece em log nenhum sem
   alguém ir olhar. É o antídoto do `ship-price`, que zerou 24 meses de frete em
   silêncio por uma chave com o nome errado. */
function ArmazenagemAdmin({fonte}:{fonte?:any}){
  const t=useT()
  const [st,setSt]=useState<{loading:boolean;data:any}|null>(null)
  const [meses,setMeses]=useState(3)
  async function rodar(){
    setSt({loading:true,data:null})
    try{
      const r=await fetch(`/api/amazon/storage-sync?meses=${meses}`,{method:'POST'})
      setSt({loading:false,data:await r.json()})
    }catch{ setSt({loading:false,data:{ok:false,erro:'sem resposta do servidor'}}) }
  }
  const d=st?.data
  const naoReconhecidas:string[]=Array.isArray(d?.colunasNaoReconhecidas)?d.colunasNaoReconhecidas:[]
  return(
    <div style={{marginTop:22,padding:'14px 16px',borderRadius:12,border:`1px dashed ${t.line2}`,background:t.dark?'rgba(255,255,255,0.02)':'#FAFAFA'}}>
      <div style={{fontSize:10.5,fontWeight:700,color:t.t3,letterSpacing:.4,textTransform:'uppercase' as const,marginBottom:8}}>
        Admin · Armazenagem por SKU
      </div>
      <div style={{fontSize:11.5,color:t.t2,lineHeight:1.6,marginBottom:11}}>
        Baixa o relatório mensal de tarifa de armazenagem da Amazon e grava por produto. A tarifa é mensal —
        o Oráculo já faz isso 1x por dia sozinho. Este botão serve pra rodar agora e, principalmente, pra
        conferir se o <b>nome da coluna</b> do relatório foi reconhecido.
      </div>
      {/* Estado atual, direto do payload da DRE: diz se a Gestão está medindo. */}
      {fonte && (
        <div style={{fontSize:11,color:t.t2,lineHeight:1.6,marginBottom:11,paddingLeft:10,borderLeft:`2px solid ${fonte.medido?t.grn:fonte.isenta?t.gold:t.line2}`}}>
          {fonte.isenta
            ? <>No período que está na tela: <b style={{color:t.gold}}>armazenagem ISENTA</b> — o repasse não cobra nada.
                O relatório mede <b>{brl2(fonte.economiaNoPeriodo||0)}</b> que você deixou de pagar.
                <br/><span style={{color:t.t3}}>{fonte.motivo}</span></>
            : fonte.medido
            ? <>No período que está na tela: <b style={{color:t.grn}}>medindo</b> · {brl2(fonte.total||0)} no total,
                {' '}{brl2(fonte.atribuido||0)} atribuídos a produtos{(fonte.naoAtribuido||0)>0.005?<>, {brl2(fonte.naoAtribuido)} sem dono</>:null}
                {fonte.parcial?<> · <b>proporcional aos dias</b> (o período não cobre o mês inteiro)</>:null}
                {Array.isArray(fonte.meses)&&fonte.meses.length?<> · meses: {fonte.meses.join(', ')}</>:null}
                {Array.isArray(fonte.asinsAmbiguos)&&fonte.asinsAmbiguos.length
                  ? <><br/><span style={{color:t.gold}}>{fonte.asinsAmbiguos.length===1?'1 ASIN com SKU duplicado ficou fora':`${fonte.asinsAmbiguos.length} ASINs com SKU duplicado ficaram fora`}</span> — dividir seria rateio, atribuir aos dois contaria a mesma tarifa duas vezes.</>
                  : null}</>
            : <>No período que está na tela: <b>sem medição</b> — a armazenagem segue como custo fixo.
                {/* O motivo importa: "sem medição" por falta de sync e "sem medição"
                    porque o repasse do período não cobrou armazenagem são coisas
                    diferentes, e a segunda não se resolve sincronizando. */}
                {fonte.motivo
                  ? <><br/><span style={{color:t.t3}}>{fonte.motivo}</span>
                      {(fonte.totalMedidoNoRelatorio||0)>0 && <><br/><span style={{color:t.t3}}>O relatório tem {brl2(fonte.totalMedidoNoRelatorio)} medidos nos meses deste período — o que falta é a cobrança aparecer no repasse.</span></>}</>
                  : <> Rode o sync abaixo.</>}</>}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:9,flexWrap:'wrap' as const}}>
        <button onClick={rodar} disabled={st?.loading}
          style={{background:t.gold,color:t.dark?'#1c1606':'#3a2a05',border:'none',borderRadius:9,padding:'9px 14px',fontSize:12,fontWeight:700,cursor:st?.loading?'wait':'pointer',fontFamily:'inherit',opacity:st?.loading?.6:1}}>
          {st?.loading?'Baixando o relatório…':'Sincronizar agora'}
        </button>
        <label style={{fontSize:11.5,color:t.t2,display:'flex',alignItems:'center',gap:6}}>
          meses
          <input type="number" min={0} max={12} value={meses} onChange={e=>setMeses(Math.max(0,Math.min(12,parseInt(e.target.value)||0)))}
            style={{width:56,padding:'6px 8px',borderRadius:7,border:`1px solid ${t.line2}`,background:'transparent',color:t.t1,fontFamily:'inherit',fontSize:12}}/>
        </label>
        {st?.loading && <span style={{fontSize:11,color:t.t3}}>a Amazon leva de segundos a alguns minutos por mês pedido</span>}
      </div>
      {d && (
        <div style={{marginTop:12,fontSize:11.5,lineHeight:1.6}}>
          {/* ⭐ O caso que este botão existe pra revelar. */}
          {naoReconhecidas.length>0 ? (
            <div style={{padding:'10px 12px',borderRadius:9,background:'rgba(248,113,113,0.10)',color:t.red}}>
              <b>O relatório veio com dados e nenhuma coluna de tarifa foi reconhecida.</b><br/>
              <span style={{color:t.t2}}>Manda esta lista pro suporte — o nome real da coluna está aqui:</span>
              <div style={{marginTop:7,fontFamily:'ui-monospace,monospace',fontSize:10.5,color:t.t1,wordBreak:'break-all' as const}}>
                {naoReconhecidas.join(' · ')}
              </div>
            </div>
          /* ⚠️ SUCESSO NÃO SE PRESUME. Este ramo era `d.ok===false || d.erro`, e o
             proxy responde `{error}` (não `erro`) em 401/403/500 — então uma falha
             de autorização caía no ramo de baixo e a tela dizia "nenhuma linha, NÃO
             É ERRO". Tranquilizar o dono sobre uma chamada que falhou é a mesma
             doença do `ship-price` com outra roupa: só que aqui eu mesmo escrevi a
             frase que mentia. Agora só é sucesso o que se declara sucesso. */
          ) : (d.ok!==true || d.error || d.erro) ? (
            <div style={{padding:'10px 12px',borderRadius:9,background:'rgba(248,113,113,0.10)',color:t.red}}>
              <b>A chamada não completou.</b> <span style={{color:t.t2}}>{String(d.error||d.erro||'resposta inesperada do servidor')}</span>
            </div>
          ) : (d.linhas||0)>0 ? (
            <div style={{padding:'10px 12px',borderRadius:9,background:'rgba(52,211,153,0.10)',color:t.grn}}>
              <b>{d.linhas} linha(s) gravada(s)</b>{Array.isArray(d.meses)&&d.meses.length?<span style={{color:t.t2}}> · meses: {d.meses.join(', ')}</span>:null}
              <div style={{color:t.t2,marginTop:4}}>Recarregue a Gestão pra ver a armazenagem no card de cada produto.</div>
            </div>
          ) : (
            <div style={{padding:'10px 12px',borderRadius:9,background:t.dark?'rgba(255,255,255,0.04)':'#F1F5F9',color:t.t2}}>
              Nenhuma linha de armazenagem gravada. Veja abaixo o que a Amazon respondeu em cada tentativa —
              <b> cancelado</b> significa janela sem dado (é resposta dela, não falha nossa).
            </div>
          )}
          {/* ⚠️ O DIAGNÓSTICO APARECE SEMPRE. Antes os erros por mês morriam num
              console.warn do servidor e a resposta trazia só `linhas: 0`, que a tela
              traduzia como "não é erro" — quatro falhas da Amazon viravam uma frase
              tranquilizadora. O que ela respondeu tem que chegar em quem decide. */}
          {Array.isArray(d.diagnostico) && d.diagnostico.length>0 && (
            <div style={{marginTop:10,border:`1px solid ${t.line}`,borderRadius:9,overflow:'hidden'}}>
              {d.diagnostico.map((x:any,i:number)=>{
                const cor = x.status==='ok'?t.grn : x.status==='erro'?t.red : x.status==='nao-reconhecido'?t.gold : t.t3
                return(
                  <div key={i} style={{padding:'7px 11px',borderTop:i?`1px solid ${t.line}`:'none',display:'flex',gap:9,alignItems:'baseline',flexWrap:'wrap' as const}}>
                    <span style={{fontFamily:'ui-monospace,monospace',fontSize:10.5,color:t.t2,minWidth:150}}>{x.via}</span>
                    <b style={{fontSize:10.5,color:cor,textTransform:'uppercase' as const,letterSpacing:.3}}>{x.status}</b>
                    {x.linhasGravadas>0 && <span style={{fontSize:10.5,color:t.t2}}>{x.linhasGravadas} gravada(s)</span>}
                    {x.linhasBrutas!==undefined && <span style={{fontSize:10.5,color:t.t3}}>{x.linhasBrutas} linha(s) brutas</span>}
                    {x.detalhe && <span style={{fontSize:10.5,color:t.t3,flex:1,minWidth:200,wordBreak:'break-word' as const}}>{x.detalhe}</span>}
                    {Array.isArray(x.colunas)&&x.colunas.length>0 && <span style={{fontSize:10,color:t.gold,fontFamily:'ui-monospace,monospace',flex:1,minWidth:200,wordBreak:'break-all' as const}}>{x.colunas.join(' · ')}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Analitico({realDre,hide,connected,mockM,costs={},imposto=0,adsReal}:{realDre?:any;hide:boolean;connected?:boolean|null;mockM?:ProductMetrics[];costs?:Record<string,number>;imposto?:number;adsReal?:any}){
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
    // Mesma fonte única do modal / Top 15 / Curva ABC. ⚠️ Antes esta aba exibia a
    // coluna "Reembolsos" ao lado de um "Lucro bruto" que ignorava esse mesmo
    // reembolso — na MESMA linha da tabela.
    const L=realDre.linhas||{}
    const rows=[...produtos].sort((a:any,b:any)=>(b.receita||0)-(a.receita||0)).map((p:any)=>{
      const M=margemDoProduto({linhas:L,produto:p,reembolsos:realDre?.reembolsos,
        custoUnit:costs[p.sku]||0,imposto,ads:adsDoProduto(adsReal,p.sku,p.asin).valor})
      const units=p.units||0
      return {p,receita:M.receitaLiquida,units,
        ticket:units>0?M.receitaBruta/units:0,
        shareRec:receitaTotal>0?M.receitaBruta/receitaTotal*100:0,
        custoTotal:M.cmv,temCusto:M.temCusto,
        lucro:M.lucroAntesAds,margem:M.margem,
        ref:refBySku[p.sku]||{units:0,valor:0}}
    })
    const comCusto=rows.filter(r=>r.temCusto&&r.lucro!==null)
    const recCusto=comCusto.reduce((s,r)=>s+r.receita,0)
    const margemMedia = recCusto>0 ? comCusto.reduce((s,r)=>s+(r.lucro||0),0)/recCusto*100 : null
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
              <NumTd color={r.temCusto&&r.lucro!==null?(r.lucro>=0?t.grn:t.red):t.t3} hide={hide}>{r.temCusto&&r.lucro!==null?brl2(r.lucro):'—'}</NumTd>
              <PillTd>{r.temCusto&&r.margem!==null?<Pill kind={r.margem>20?'grn':r.margem>0?'gold':'red'}>{pc(r.margem)}</Pill>:<span style={{fontSize:11,color:t.t3}}>—</span>}</PillTd>
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
function Gerenciamento({realDre,inv,costs,extras,onCost,onExtra,mockM,hide,connected,imposto=0,onImposto,isAdmin}:{realDre?:any;inv?:any;costs:Record<string,number>;extras:Record<string,number>;onCost:(sku:string,v:number)=>void;onExtra:(sku:string,v:number)=>void;mockM:ProductMetrics[];hide:boolean;connected?:boolean|null;imposto?:number;onImposto?:(v:number)=>void;isAdmin?:boolean}){
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
    {isAdmin && <ArmazenagemAdmin fonte={realDre?.armazenagemFonte}/>}
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
            // ⚠️ Velocidade dos 14 dias, vinda do backend — MESMA fonte do NEO.
            // Era "unidades do período ÷ dias do período": no filtro "Hoje" isso é
            // 1 dia, e às 9h a tela dizia "50 dias · Saudável" enquanto o NEO
            // mandava push crítico de 5 dias pro MESMO SKU.
            const vel=typeof it.velocidadeDia==='number'?it.velocidadeDia:(vendaPorSku[it.sku]||0)/days
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
function Relatorio({realDre,inv,costs={},adsReal}:{realDre?:any;inv?:any;costs?:Record<string,number>;adsReal?:any}){
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
      // ⚠️ O CSV exportava Ads SEMPRE R$0 (o backend chumba `linhas.ads=0`; o gasto
      // real vem da Advertising API, como na tela) e omitia duas linhas que a DRE
      // desconta — Taxa Amazon pra Todos e Outras taxas. Resultado: a planilha não
      // fechava com a tela nem consigo mesma. Agora usa a MESMA expressão do card.
      gen:()=>toCSV(['Linha','Valor (R$)'],[['Receita bruta',L.receitaBruta||0],['Devoluções',L.devolucoes||0],['Receita líquida',L.receitaLiquida||0],['Comissão',L.comissao||0],['Tarifa FBA',L.fba||0],['Taxa Amazon pra Todos',L.taxaPrograma||0],['Outras taxas',L.outrasTaxas||0],['Armazenagem',L.armazenagem||0],['Assinatura',L.assinatura||0],['Líq. Marketplace',realDre?.liqMarketplace||0],['Ads',adsReal?.ready?(Number(adsReal.spend)||0):''],['Reembolsos e ajustes',L.ajustes||0]])},
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
/* ── REPASSES — "quanto a Amazon me pagou" ───────────────────────────────────
   A terceira pergunta da Gestão. Vendas diz o que está acontecendo agora; o Resumo
   diz se está ganhando dinheiro; isto diz quanto CAIU NA CONTA.

   ⭐ E é a única tela conferível do produto. O repasse traz o saldo inicial e o
   valor transferido: se a soma dos eventos que o Oráculo lê der esse valor, nada
   está sendo perdido na leitura. É o critério de pronto adotado em 27/07 — fechar
   com o "Valor a ser transferido", e não com a ferramenta do concorrente.

   ⚠️ A conferência é opt-in porque custa paginação por repasse. */
/* ── INVESTIGAR UM REPASSE QUE NÃO FECHA ─────────────────────────────────────
   ⭐ O mapa do dinheiro: cada campo monetário que a Amazon mandou naquele grupo,
   somado pelo caminho, com ✓ nos que a conferência já lê. A diferença mora, por
   construção, numa linha com ✗ — o culpado aparece com nome e valor, em vez de
   virar a quarta rodada de chute. */
function InvestigarRepasse({id}:{id:string}){
  const t=useT()
  const [st,setSt]=useState<{loading:boolean;data:any}|null>(null)
  const rodar=async()=>{
    setSt({loading:true,data:null})
    try{
      const r=await fetch(`/api/amazon/repasse-caminhos?groupId=${encodeURIComponent(id)}`)
      setSt({loading:false,data:await r.json()})
    }catch{ setSt({loading:false,data:{error:'sem resposta do servidor'}}) }
  }
  const d=st?.data
  const caminhos:any[]=Array.isArray(d?.caminhos)?d.caminhos:[]
  return(
    <div style={{marginTop:10,paddingTop:9,borderTop:`1px dashed ${t.line2}`}}>
      <button onClick={rodar} disabled={st?.loading}
        style={{background:'transparent',color:t.t2,border:`1px dashed ${t.line2}`,borderRadius:8,padding:'7px 12px',fontSize:11.5,cursor:st?.loading?'wait':'pointer',fontFamily:'inherit'}}>
        {st?.loading?'Perguntando à Amazon…':'Admin · ver cada linha de dinheiro deste repasse'}
      </button>
      {d&&(d.error||d.erro)&&<div style={{marginTop:8,fontSize:11.5,color:t.red}}>{String(d.error||d.erro)}</div>}
      {caminhos.length>0&&(
        <div style={{marginTop:9}}>
          {caminhos.map((c:any,i:number)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',gap:10,padding:'3px 0',fontSize:10.5,fontFamily:'ui-monospace,monospace',color:c.lido?t.t3:t.gold,lineHeight:1.5}}>
              <span style={{wordBreak:'break-all' as const}}>{c.lido?'✓':'✗'} {c.caminho} <span style={{opacity:.7}}>·{c.eventos}×</span></span>
              <b style={{whiteSpace:'nowrap' as const}}>{c.soma<0?'−':'+'}{brl2(Math.abs(c.soma))}</b>
            </div>
          ))}
          <div style={{fontSize:10.5,color:t.t3,marginTop:7,lineHeight:1.55}}>
            <b style={{color:t.gold}}>✗</b> = caminho que a conferência ainda não lê — a diferença mora numa dessas linhas.
            Algumas são detalhamento de valores já contados (por isso isto é diagnóstico, não uma segunda conta).
            {d.truncado&&<> <b style={{color:t.gold}}>⚠️ Leitura cortada no meio</b> — as somas estão incompletas.</>}
          </div>
        </div>
      )}
    </div>
  )
}

function Repasses({connected}:{connected?:boolean|null}){
  const t=useT()
  const [st,setSt]=useState<{loading:boolean;data:any}|null>(null)
  const [conferindo,setConferindo]=useState(false)
  const [cru,setCru]=useState<any[]|null>(null)
  const [buscandoCru,setBuscandoCru]=useState(false)

  const carregar=async(conferir=false)=>{
    conferir?setConferindo(true):setSt({loading:true,data:null})
    try{
      const r=await fetch(`/api/amazon/repasses?meses=3${conferir?'&conferir=1':''}`)
      setSt({loading:false,data:await r.json()})
    }catch{ setSt({loading:false,data:{erro:'sem resposta do servidor'}}) }
    setConferindo(false)
  }

  /* ⭐ DIAGNÓSTICO: o que SEPARA duas liquidações do mesmo ciclo?
     A Amazon paga por bandeira e eu ainda não sei qual campo carrega isso — três
     chutes meus já falharam. Em vez de despejar o JSON inteiro, isto compara os
     grupos do MESMO ciclo e mostra só os campos cujos valores DIFEREM: o campo da
     bandeira é, por definição, um deles. Perguntar ao dado custa uma rodada;
     adivinhar custou três. */
  const descobrir=async()=>{
    setBuscandoCru(true)
    try{
      const r=await fetch('/api/amazon/repasses?meses=3&cru=1')
      const d=await r.json()
      const porCiclo=new Map<string,any[]>()
      for(const rep of (d?.repasses||[])){
        if(!rep?.cru) continue
        const k=rep.ciclo||''
        porCiclo.set(k,[...(porCiclo.get(k)||[]),rep])
      }
      const achados:any[]=[]
      for(const [k,grupos] of porCiclo){
        if(grupos.length<2) continue   // sem dois pra comparar, não há o que separar
        const chaves=[...new Set(grupos.flatMap((g:any)=>Object.keys(g.cru||{})))]
        const diferentes=chaves.map(c=>{
          const vals=grupos.map((g:any)=>{
            const v=(g.cru||{})[c]
            return v&&typeof v==='object'?JSON.stringify(v):String(v??'—')
          })
          return {campo:c,valores:vals,difere:new Set(vals).size>1}
        }).filter(x=>x.difere)
        achados.push({ciclo:k,inicio:grupos[0].inicio,fim:grupos[0].fim,qtd:grupos.length,diferentes})
      }
      setCru(achados)
    }catch{ setCru([]) }
    setBuscandoCru(false)
  }
  useEffect(()=>{ if(connected) carregar(false) },[connected])

  if(connected===false) return <ConnectEmpty texto="Conecte sua conta Amazon pra ver os repasses."/>
  if(!st||st.loading) return <LoadingBox/>
  const d=st.data||{}
  if(d.erro||d.error) return <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:22,color:t.red,fontSize:12.5}}>{String(d.erro||d.error)}</div>
  const reps:any[]=Array.isArray(d.repasses)?d.repasses:[]
  /* ⭐ A AMAZON BR LIQUIDA POR MEIO DE PAGAMENTO DO COMPRADOR.
     Boleto, Visa, Mastercard, Elo, Amex, Diners, débito — cada bandeira tem prazo
     próprio, então o MESMO ciclo de 14 dias gera VÁRIOS grupos de liquidação. O
     Seller Central mostra um por vez: o seletor "Tipo de conta" troca entre eles.

     Conferido na conta real: 23–30/jul tinha R$1.170,73 no Boleto, R$921,16 no Visa
     e R$2.019,14 no Mastercard. Os três legítimos, os três no extrato dela.

     ⚠️ Eu tratei essas linhas como ruído, depois como problema de TraceId, depois
     como moeda — três hipóteses, três erros. Eram todas pagamentos de verdade. O
     que faltava não era filtro: era AGRUPAR POR CICLO e dizer o porquê. */
  const comValor=reps.filter(r=>Math.abs(r.valorTransferido||0)>0.005||r.ehPagamento)
  // ⚠️ Cada valor na moeda do PRÓPRIO grupo. Na conta do João é tudo BRL, mas a
  // Finances devolve a conta INTEIRA da região — um cliente com venda nos EUA
  // receberia grupos em USD, e formatá-los com "R$" seria o número errado na tela
  // que existe pra conferir com o banco. Moeda entra na chave do ciclo: bloco de
  // dólar não se mistura com bloco de real.
  const dinheiro=(v:number,m?:string)=>{
    const mo=String(m||'BRL')
    if(mo==='BRL') return brl2(v)
    try{ return v.toLocaleString('pt-BR',{style:'currency',currency:mo}) }catch{ return `${mo} ${v.toFixed(2)}` }
  }
  const ciclos=(()=>{
    const m=new Map<string,{inicio:string|null;fim:string|null;itens:any[];total:number;pago:string|null;moeda:string}>()
    for(const r of comValor){
      // Mesma regra do backend: agrupa pela DATA, não pelo timestamp. A Amazon abre
      // os grupos do mesmo ciclo em horários diferentes.
      const k=(r.ciclo||`${String(r.inicio||'').slice(0,10)}|${String(r.fim||'').slice(0,10)}`)+'|'+String(r.moeda||'BRL')
      const g=m.get(k)||{inicio:r.inicio,fim:r.fim,itens:[] as any[],total:0,pago:r.dataTransferencia,moeda:String(r.moeda||'BRL')}
      g.itens.push(r)
      // ⚠️ SÓ O QUE FOI TRANSFERIDO ENTRA NO TOTAL. Grupo com FundTransferStatus
      // "Unknown" é saldo que não saiu — normalmente negativo — e rola pro ciclo
      // seguinte como saldo inicial. Somá-lo fazia o total discordar do Seller
      // Central por exatamente o valor dele: 23–30/jul dá R$4.111,03 nos cards da
      // Amazon e a tela mostrava R$4.107,47, os R$3,56 do grupo não transferido.
      if(r.foiTransferido!==false) g.total=Math.round((g.total+(r.valorTransferido||0))*100)/100
      if(!g.pago&&r.dataTransferencia) g.pago=r.dataTransferencia
      m.set(k,g)
    }
    return [...m.values()].sort((a,b)=>Date.parse(b.inicio||'')-Date.parse(a.inicio||''))
  })()
  const confs:any[]=Array.isArray(d.conferencias)?d.conferencias:[]
  const confDe=(id:string)=>confs.find(c=>c?.repasse?.id===id)
  // ⚠️ timeZone UTC de propósito. As datas do repasse são MARCOS de período, não
  // instantes: `2026-07-16T00:00:00Z` formatado no fuso de SP vira "15 de jul." —
  // um dia a menos. Numa tela feita pra conferir contra o extrato da Amazon, um dia
  // de diferença faz o seller procurar o repasse errado.
  const data=(iso:string|null)=>{ if(!iso) return '—'; const x=new Date(iso); return isNaN(x.getTime())?'—':x.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}) }

  return(<>
    <Hint>Cada repasse é um fechamento da Amazon: o que ela juntou no período e transferiu pra sua conta. <b>Esta é a tela que fecha com o banco</b> — a Gestão conta por data do pedido, o repasse conta por data do lançamento.</Hint>

    <div style={{display:'flex',alignItems:'center',gap:10,margin:'12px 0 14px',flexWrap:'wrap' as const}}>
      <button onClick={()=>carregar(true)} disabled={conferindo}
        style={{background:conferindo?'transparent':t.gold,color:conferindo?t.t2:(t.dark?'#1c1606':'#3a2a05'),border:`1px solid ${conferindo?t.line2:t.gold}`,borderRadius:9,padding:'9px 14px',fontSize:12,fontWeight:700,cursor:conferindo?'wait':'pointer',fontFamily:'inherit'}}>
        {conferindo?'Conferindo com a Amazon…'
          :(d.naoConferidos||0)>0&&confs.length>0?`Conferir as próximas ${Math.min(d.limiteConferencia||8,d.naoConferidos)}`
          :'Conferir se o Oráculo lê tudo'}
      </button>
      <span style={{fontSize:11,color:t.t3,flex:1,minWidth:240,lineHeight:1.5}}>
        Soma os lançamentos de cada repasse fechado e compara com o valor transferido. Bateu = nenhuma linha está passando batido.
      </span>
    </div>

    {/* Uma linha por CICLO, com o total, e dentro dela cada meio de pagamento. É
        assim que a tela bate com o Seller Central: lá o seletor "Tipo de conta"
        mostra um por vez; aqui os dois níveis aparecem juntos. */}
    {ciclos.map((g,gi)=>(
      <div key={gi} style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:12,marginBottom:10,overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12,padding:'11px 14px',flexWrap:'wrap' as const,borderBottom:`1px solid ${t.line}`}}>
          <div>
            <b style={{fontSize:13,color:t.t1}}>{data(g.inicio)} — {data(g.fim)}</b>
            <span style={{fontSize:11,color:t.t3,marginLeft:8}}>
              {g.itens.length} {g.itens.length===1?'liquidação':'liquidações'}{g.pago?` · pago em ${data(g.pago)}`:''}
              {g.moeda!=='BRL'&&<b style={{color:t.gold,marginLeft:6}}>{g.moeda} · outro marketplace</b>}
            </span>
          </div>
          <div style={{textAlign:'right' as const}}>
            <b style={{fontFamily:FG,fontSize:15,color:t.grn}}>{dinheiro(g.total,g.moeda)}</b>
            {g.itens.some((x:any)=>x.foiTransferido===false) &&
              <div style={{fontSize:10,color:t.t3}}>só o que foi transferido</div>}
          </div>
        </div>
        <Table minWidth={720} head={[{label:'Grupo de liquidação',w:'26%'},{label:'Transferido',right:true},
          {label:'Pago em',right:true},{label:'O Oráculo leu',right:true},{label:'Diferença',right:true}]}>
          {g.itens.map((r:any)=>{
            const c=confDe(r.id)
            // ⚠️ `== null` pega null E undefined. Com `=== null`, um campo ausente
            // passava direto pro brl2 e derrubava a ABA INTEIRA com "O Oráculo teve
            // um soluço". Campo que a Amazon não mandou não pode virar tela de erro.
            const aberto=r.valorTransferido==null
            return(
              <tr key={r.id}>
                <td style={{padding:'8px 10px',fontSize:11,color:t.t2,fontFamily:'ui-monospace,monospace'}}>
                  {r.numeroLiquidacao||String(r.id).slice(0,14)}
                  {r.foiTransferido===false && <div style={{fontSize:10,color:t.gold,fontFamily:'inherit'}}>não transferido · rola pro próximo ciclo</div>}
                </td>
                <NumTd hide={false} strong>{aberto?'—':dinheiro(r.valorTransferido,r.moeda)}</NumTd>
                <NumTd hide={false}>{data(r.dataTransferencia)}</NumTd>
                <NumTd hide={false}>{c?.leitura?dinheiro(c.esperado,r.moeda):'—'}</NumTd>
                <td style={{padding:'8px 10px',textAlign:'right' as const,fontSize:12,fontFamily:FG,whiteSpace:'nowrap' as const}}>
                  {/* ⚠️ "—" aqui parecia leitura falhando. É só o limite de conferência. */}
                  {!c ? <span style={{color:t.t3,fontSize:10.5}}>não conferido</span>
                    : c.erro ? <span style={{color:t.red,fontSize:11}}>{String(c.erro).slice(0,40)}</span>
                    : c.truncado ? <span style={{color:t.gold,fontSize:11}}>soma parcial</span>
                    : c.fecha ? <span style={{color:t.grn,fontWeight:700}}>fecha ✓</span>
                    : <span style={{color:t.red,fontWeight:700}}>{c.diferenca>0?'+':'−'}{brl2(Math.abs(c.diferenca||0))}</span>}
                </td>
              </tr>
            )
          })}
        </Table>
      </div>
    ))}
    {!ciclos.length && <div style={{fontSize:12,color:t.t3,marginTop:12}}>Nenhum repasse nos últimos 3 meses.</div>}

    {/* ⭐ O progresso ACUMULA: repasse fechado é imutável, então cada conferência
        fica guardada no servidor pra sempre. "Não conferido" é fila, não falha —
        e a fila só anda pra frente. */}
    {(d.naoConferidos||0)>0 ? (
      <div style={{fontSize:11,color:t.t3,marginTop:9,lineHeight:1.6}}>
        <b style={{color:t.t2}}>{confs.length}</b> conferida{confs.length===1?'':'s'} · <b style={{color:t.gold}}>{d.naoConferidos}</b> na fila.
        Cada clique confere até {d.limiteConferencia||8} e o resultado fica <b>guardado</b> — repasse fechado não muda nunca,
        então conferiu uma vez, ficou verde pra sempre. Clique de novo até zerar a fila.
      </div>
    ) : confs.length>0 ? (
      <div style={{fontSize:11,color:t.grn,marginTop:9,lineHeight:1.6}}>
        ✓ Todas as liquidações pagas foram conferidas — e os resultados ficam guardados.
      </div>
    ) : null}

    {/* ⭐ A EXPLICAÇÃO QUE FALTAVA. Sem ela, ver quatro linhas no mesmo ciclo parece
        erro do Oráculo — e foi o que me fez caçar defeito onde não havia. */}
    <div style={{marginTop:14,padding:'12px 14px',borderRadius:11,background:t.dark?'rgba(255,255,255,0.02)':'#FAFAFA',border:`1px solid ${t.line}`}}>
      <div style={{fontSize:12,fontWeight:600,color:t.t1,marginBottom:4}}>Por que um período tem várias liquidações</div>
      <div style={{fontSize:11.5,color:t.t2,lineHeight:1.6}}>
        A Amazon paga <b>separado por meio de pagamento do comprador</b> — boleto, Visa, Mastercard, Elo, Amex, Diners, débito.
        Cada bandeira tem prazo próprio, então o mesmo ciclo de 14 dias vira <b>vários</b> grupos de liquidação (e o Amex costuma
        levar meses, o que explica um período longo aparecer no meio da lista).
        <br/><br/>
        No Seller Central você vê <b>um por vez</b>: é o seletor <b>“Tipo de conta”</b> em Pagamentos → Todos os extratos que troca
        entre eles. Aqui os dois níveis aparecem juntos — o <b>total do ciclo</b> em cima e cada liquidação embaixo.
        <br/><br/>
        {/* ⚠️ Verificado nos campos crus da conta real: os únicos que diferem entre
            liquidações do mesmo ciclo são id, valor, status da transferência e o
            final da conta. Não existe campo de bandeira. Dizer isso é melhor que
            rotular por dedução e errar — e melhor que deixar o seller achando que
            é omissão nossa. */}
        <b style={{color:t.t2}}>A Amazon não informa a bandeira pela API</b> — só o final da conta que recebeu, quando existe.
        Pra saber qual liquidação é de qual meio de pagamento, troque o <b>Tipo de conta</b> no Seller Central: o <b>valor e a data</b> casam
        exatamente com as linhas acima. O número do grupo de liquidação também não vem pela API, então ele aparece em “—” quando a Amazon não manda.
      </div>
      {/* Só admin: procura, nos campos crus da Amazon, qual deles identifica a
          bandeira. Mostra apenas o que DIFERE entre liquidações do mesmo ciclo. */}
      <div style={{marginTop:11,paddingTop:10,borderTop:`1px dashed ${t.line2}`}}>
        <button onClick={descobrir} disabled={buscandoCru}
          style={{background:'transparent',color:t.t2,border:`1px dashed ${t.line2}`,borderRadius:8,padding:'7px 12px',fontSize:11.5,cursor:buscandoCru?'wait':'pointer',fontFamily:'inherit'}}>
          {buscandoCru?'Perguntando à Amazon…':'Admin · descobrir o que separa as liquidações'}
        </button>
        {cru!==null && (
          <div style={{marginTop:10}}>
            {!cru.length && <div style={{fontSize:11.5,color:t.t3}}>Nenhum ciclo com duas ou mais liquidações pra comparar.</div>}
            {cru.map((a:any,i:number)=>(
              <div key={i} style={{marginTop:9,padding:'10px 12px',borderRadius:9,background:t.dark?'rgba(255,255,255,0.03)':'#F4F4F5'}}>
                <div style={{fontSize:11.5,fontWeight:700,color:t.t1,marginBottom:6}}>
                  {data(a.inicio)} — {data(a.fim)} · {a.qtd} liquidações · {a.diferentes.length} campo(s) diferem
                </div>
                {a.diferentes.map((x:any,j:number)=>(
                  <div key={j} style={{fontSize:10.5,fontFamily:'ui-monospace,monospace',color:t.t2,lineHeight:1.7,wordBreak:'break-all' as const}}>
                    <b style={{color:t.gold}}>{x.campo}</b>: {x.valores.join('  |  ')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {confs.some(c=>c?.leitura?.listasNaoLidas?.length>0) && (
      <div style={{marginTop:16,padding:'13px 15px',borderRadius:12,background:t.dark?'rgba(240,180,41,0.07)':'#FFFBEB',border:`1px solid ${t.dark?'rgba(240,180,41,0.3)':'#FDE68A'}`}}>
        <div style={{fontSize:12.5,fontWeight:600,color:t.t1,marginBottom:5}}>Lançamentos que o Oráculo ainda não lê</div>
        <div style={{fontSize:11.5,color:t.t2,lineHeight:1.6}}>
          A Amazon mandou estas categorias nos seus repasses e nós ainda não sabemos interpretá-las. Elas explicam parte da diferença acima —
          e aparecem aqui com o nome dela justamente pra não virarem número sem dono:
          <div style={{marginTop:7,fontFamily:'ui-monospace,monospace',fontSize:10.5,color:t.gold}}>
            {[...new Set(confs.flatMap(c=>(c?.leitura?.listasNaoLidas||[]).map((l:any)=>`${l.lista} (${l.eventos})`)))].join(' · ')}
          </div>
        </div>
      </div>
    )}

    {confs.length>0 && (
      <div style={{marginTop:16}}>
        <div style={{fontSize:11,fontWeight:700,color:t.t3,letterSpacing:.4,textTransform:'uppercase' as const,marginBottom:9}}>Como cada repasse foi somado</div>
        {confs.filter(c=>c?.leitura).map((c,i)=>(
          <div key={i} style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:12,padding:'12px 14px',marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10,marginBottom:8,flexWrap:'wrap' as const}}>
              <span style={{fontSize:12,color:t.t1}}>{data(c.repasse?.inicio)} — {data(c.repasse?.fim)}</span>
              <b style={{fontFamily:FG,fontSize:13,color:c.fecha?t.grn:t.red}}>
                {c.fecha?'a leitura fecha com o valor transferido':`diferença de ${brl2(Math.abs(c.diferenca??0))}`}
              </b>
            </div>
            {[['Vendas','vendas'],['Devoluções','devolucoes'],['Taxas de venda','taxasDeVenda'],['Serviços (assinatura, armazenagem)','servicos'],['Ads','ads'],['Ajustes e remoções','ajustes']].map(([rot,k])=>{
              const v=Number(c.leitura[k as string])||0
              if(Math.abs(v)<0.005) return null
              return(
                <div key={k as string} style={{display:'flex',justifyContent:'space-between',gap:10,padding:'4px 0',fontSize:11.5}}>
                  <span style={{color:t.t2}}>{rot}</span>
                  <b style={{fontFamily:FG,color:v<0?t.red:t.grn}}>{v<0?'−':'+'}{brl2(Math.abs(v))}</b>
                </div>
              )
            })}
            <div style={{marginTop:7,paddingTop:7,borderTop:`1px solid ${t.line}`,display:'flex',justifyContent:'space-between',gap:10,fontSize:11.5}}>
              <span style={{color:t.t2}}>Saldo que veio do repasse anterior</span>
              <b style={{fontFamily:FG,color:t.t2}}>{brl2(c.repasse.saldoInicial)}</b>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',gap:10,fontSize:12.5,marginTop:4}}>
              <b style={{color:t.t1}}>Deveria ter sido transferido</b>
              <b style={{fontFamily:FG,color:t.t1}}>{brl2(c.esperado)}</b>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',gap:10,fontSize:12.5,marginTop:2}}>
              <b style={{color:t.t1}}>A Amazon transferiu</b>
              <b style={{fontFamily:FG,color:t.grn}}>{brl2(c.repasse.valorTransferido||0)}</b>
            </div>
            {c.truncado && <div style={{fontSize:10.5,color:t.gold,marginTop:7,lineHeight:1.5}}>
              ⚠️ Este repasse tem lançamentos demais e a leitura foi cortada no meio — a soma acima está incompleta, então a diferença não significa nada aqui.
            </div>}
            {/* Só quando NÃO fecha: repasse verde não tem diferença pra caçar. */}
            {!c.fecha && !c.truncado && !c.erro && <InvestigarRepasse id={String(c.repasse?.id||'')}/>}
          </div>
        ))}
      </div>
    )}
  </>)
}

const TABS = [
  {id:'resumo',label:'Resumo',icon:'ti-layout-dashboard'},
  {id:'vendas',label:'Vendas',icon:'ti-cash'},
  {id:'abc',label:'Curva ABC',icon:'ti-chart-bar'},
  {id:'ads',label:'Ads',icon:'ti-speakerphone'},
  {id:'analit',label:'Analítico',icon:'ti-chart-dots'},
  {id:'gerenc',label:'Gerenciamento',icon:'ti-adjustments'},
  {id:'fulfil',label:'Estoque FBA',icon:'ti-truck-delivery'},
  {id:'relat',label:'Relatório',icon:'ti-file-text'},
  {id:'repasse',label:'Repasses',icon:'ti-arrow-bar-to-down'},
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
  // ── LANÇAMENTOS AVULSOS POR PEDIDO (crédito extra / custo eventual) ──────────
  // ⚠️ Guardados FORA do custo unitário de propósito: são daquele pedido, não do
  // SKU. Se virassem CMV, valeriam pras próximas vendas todas e distorceriam a
  // margem de tudo que vem depois. Entram na conta como linha própria.
  const [ajustes,setAjustes]=useState<AjustePedido[]>([])
  useEffect(()=>{ fetch('/api/user/metadata?key=gestao_ajustes').then(r=>r.json()).then(d=>{ if(Array.isArray(d?.value)) setAjustes(d.value) }).catch(()=>{}) },[])
  const salvarAjustes=(lista:AjustePedido[])=>{
    setAjustes(lista)
    fetch('/api/user/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'gestao_ajustes',value:lista})}).catch(()=>{})
  }
  const addAjuste=(a:Omit<AjustePedido,'id'>)=>{
    // id sem depender de lib: pedido+sku+timestamp já é único o bastante aqui.
    salvarAjustes([...ajustes,{...a,id:`${a.orderId}-${a.sku}-${Date.now()}`}])
  }
  const removeAjuste=(id:string)=>salvarAjustes(ajustes.filter(a=>a.id!==id))

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
  // ⚠️ Somado PRODUTO A PRODUTO com a mesma conta do modal. Antes era
  // `Σ units × custo` com unidade BRUTA — cobrava o custo do que foi DEVOLVIDO,
  // enquanto o detalhe já usava unidade líquida. Capa e detalhe discordavam.
  const totais = useMemo(
    ()=>totaisDoPeriodo(realDre?.linhas||{},realDre?.produtos||[],realDre?.reembolsos,custoUnit,imposto,
      ajustes,{from:realDre?.period?.from,to:realDre?.period?.to}),
    [realDre,custoUnit,imposto,ajustes],
  )
  const cmv = totais.cmv
  // Margem ANTES de ads = a régua pra julgar ACOS (ACOS acima dela é prejuízo).
  // ⚠️ null quando o CMV não foi cadastrado: sem custo o "lucro" fica inflado e a
  // margem sairia otimista (~85%), calando o NEO justamente em quem mais precisa.
  // Melhor assumir que não sei e pedir o custo do que dar régua errada.
  // ⚠️ Esta régua decide o NEO mandar PAUSAR campanha. Era uma QUARTA fórmula, à
  // parte da fonte única: sem imposto (margem alta demais), cobrando armazenagem e
  // assinatura do período (que não são custo de produto) e dividindo por receita
  // BRUTA. Três desvios empilhados numa régua que manda mexer em gasto real.
  const margemRef = useMemo(()=>{
    const L=realDre?.linhas||{}
    const base=(L.receitaLiquida ?? L.receitaBruta) || 0
    if(!(cmv>0)||!(base>0)) return null
    const liqSemFixos=(realDre?.liqMarketplace||0)+custosFixosDoPeriodo(L)
    // Crédito/custo eventual entram aqui pelo mesmo motivo que entram na capa: a
    // régua tem que ser a mesma margem que o produto exibe, senão o NEO julga o
    // ACOS contra um número que a tela não mostra.
    return (liqSemFixos-cmv-totais.imposto+totais.credito-totais.custoEventual)/base*100
  },[realDre,cmv,totais])
  const realM = realDre?.produtos ? realProductMetrics(realDre,custoUnit,imposto,adsData) : null
  // Produtos que VENDERAM no período mas estão sem custo informado — sem isso o
  // Oráculo não tem como calcular lucro/margem/ROI/MPA (mostra "—").
  const prodsComVenda = (realDre?.produtos||[]).filter((p:any)=>(p.units||0)>0).length
  const semCusto = (realDre?.produtos||[]).filter((p:any)=>(p.units||0)>0 && !((custoUnit[p.sku]||0)>0))
  // ⭐ A tarifa FBA muda em 01/08/2026 e quem vende acima de R$100 sai de ISENTO
  // pra R$6 por unidade. Quem está na campanha a gente não presume — LÊ da tarifa
  // medida por produto no repasse (ver lib/tarifaFbaAgo26).
  const impactoFba = useMemo(()=>{
    const linhas=realDre?.linhas||{}
    const lista:ProdutoTarifa[]=(realDre?.produtos||[]).map((p:any)=>{
      const M=margemDoProduto({linhas,produto:p,reembolsos:realDre?.reembolsos,
        custoUnit:custoUnit[p.sku]||0,imposto,ads:null,
        ajustes:ajustesDoProduto(ajustes,p.sku,realDre?.period?.from,realDre?.period?.to)})
      const un=M.unitsLiquidas
      return {
        sku:p.sku, nome:p.name||p.sku,
        precoMedio:(p.units||0)>0?M.receitaBruta/p.units:0,
        units:un,
        fbaUnit:(M.fba===null||un<=0)?null:M.fba/un,
        comissaoPct:(M.comissao!==null&&M.receitaLiquida>0)?M.comissao/M.receitaLiquida:0,
      }
    })
    return impactoTarifaAgo26(lista,imposto)
  },[realDre,custoUnit,imposto,ajustes])
  const [verTarifa,setVerTarifa]=useState(false)

  /* ── SELO DE MATURIDADE + DIÁRIO ────────────────────────────────────────────
     A Gestão mistura o relógio da operação (data da compra, provisório) com o do
     repasse (data do lançamento, final, ~6 dias depois). Número que se mexe é
     física do dado — o defeito era não dizer qual relógio está na tela nem o que
     mudou desde a última visita. Congelar seria preferir o número velho ao certo;
     a cura é narrar. */
  const selo = useMemo(()=>maturidadeDoPeriodo(realDre?.period),[realDre?.period?.from,realDre?.period?.to])
  const [diario,setDiario]=useState<Diario|null>(null)
  const [recon,setRecon]=useState<Reconciliacao|null>(null)
  const snapsRef=useRef<Record<string,MarcosPeriodo>|null>(null)
  const narradoRef=useRef<string>('')
  useEffect(()=>{ fetch('/api/user/metadata?key=gestao_snapshots').then(r=>r.json())
    .then(d=>{ snapsRef.current = normalizarMarcos(d?.value) }).catch(()=>{ snapsRef.current={} }) },[])
  useEffect(()=>{
    if(!realDre || snapsRef.current===null) return
    const L=realDre.linhas||{}
    const chave=chaveDoPeriodo(realDre.period)
    // Um período só se narra uma vez por visita: sem isto, cada revalidação de 90s
    // reescreveria a referência e o diário nunca teria o que contar.
    if(narradoRef.current===chave) return
    // TODAS as parcelas do lucro, porque a reconciliação decompõe a diferença nelas
    // — parcela que falta é diferença atribuída ao motivo errado.
    const atual=snapshotDoPeriodo(realDre.period,{
      receitaBruta:L.receitaBruta||0, devolucoes:L.devolucoes||0,
      comissao:L.comissao||0, fba:L.fba||0, taxaPrograma:L.taxaPrograma||0,
      armazenagem:L.armazenagem||0, assinatura:L.assinatura||0, outrasTaxas:L.outrasTaxas||0,
      cmv, imposto:totais.imposto, credito:totais.credito, custoEventual:totais.custoEventual,
      unidades:realDre.unidades||0,
      lucro:cmv>0?lucroDoPeriodo(realDre.liqMarketplace||0,{cmv,imposto:totais.imposto,credito:totais.credito,custoEventual:totais.custoEventual}):null,
    },selo.nivel)
    const marcos=snapsRef.current[chave]||null
    const d=narrarMudancas(marcos?.ultimo,atual)
    // A reconciliação usa o marco MAIS ANTIGO — a promessa que a ferramenta fez
    // enquanto o período ainda estava aberto. Comparar com a última visita
    // responderia "mudou desde ontem", que é o diário, não o fechamento.
    const r=reconciliar(marcos?.primeiro,atual)
    narradoRef.current=chave
    setDiario(d); setRecon(r)
    // Só move a régua quando há novidade: um F5 dois minutos depois não pode
    // apagar o ponto de comparação e deixar o seller sem a explicação.
    if(marcos && !d) return
    // ⚠️ `primeiro` NUNCA é sobrescrito: é a estimativa original. Sobrescrever
    // apagaria justamente a promessa contra a qual o fechamento se compara.
    const novo={...snapsRef.current,[chave]:{primeiro:marcos?.primeiro||atual,ultimo:atual}}
    // Guarda os 20 períodos mais recentes — o metadata não é lugar de histórico.
    const chaves=Object.keys(novo).sort((a,b)=>Date.parse(novo[b].ultimo.visto)-Date.parse(novo[a].ultimo.visto)).slice(0,20)
    const podado:Record<string,MarcosPeriodo>={}; for(const k of chaves) podado[k]=novo[k]
    snapsRef.current=podado
    fetch('/api/user/metadata',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({key:'gestao_snapshots',value:podado})}).catch(()=>{})
  },[realDre,cmv,totais,selo.nivel])

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

        {/* ⭐ TARIFA FBA — 01/08/2026. Não é reajuste: é uma isenção que acaba.
            Quem vende acima de R$100 pagava ZERO e passa a pagar R$6 por unidade.
            O aviso só aparece pra quem É afetado, e o "é afetado" vem da tarifa
            MEDIDA no repasse — não de presumir que todo cliente está na campanha.
            Some sozinho em 31/08: aviso permanente vira paisagem. */}
        {impactoFba.relevante && impactoFba.afetados.length>0 && (
          <div style={{background:t.dark?'rgba(248,113,113,0.07)':'#FEF2F2',border:`1px solid ${t.dark?'rgba(248,113,113,0.3)':'#FECACA'}`,borderRadius:12,padding:'13px 15px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap' as const}}>
              <i className="ti ti-calendar-exclamation" style={{fontSize:17,color:t.red,marginTop:1,flexShrink:0}} aria-hidden="true"/>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:12.5,fontWeight:600,color:t.t1,marginBottom:3}}>
                  {impactoFba.jaVirou
                    ? `A tarifa FBA mudou em 01/08 e ${impactoFba.afetados.length} produto${impactoFba.afetados.length>1?'s seus perderam':' seu perdeu'} a isenção`
                    : `Em 01/08 a tarifa FBA muda e ${impactoFba.afetados.length} produto${impactoFba.afetados.length>1?'s seus perdem':' seu perde'} a isenção`}
                </div>
                <div style={{fontSize:11.5,color:t.t2,lineHeight:1.55}}>
                  A campanha deixa de isentar acima de R$100 e passa a cobrar <b>R$6 fixos por unidade a partir de R$79</b>.
                  No volume deste período {impactoFba.jaVirou?'isso custou':'seriam'} <b style={{color:t.red}}>{brl2(impactoFba.totalPeriodo)}</b> em {impactoFba.unidadesAfetadas} unidade{impactoFba.unidadesAfetadas>1?'s':''} que {impactoFba.jaVirou?'antes eram':'hoje são'} isentas.
                  {impactoFba.semMedicao>0 && <> · <span style={{color:t.t3}}>{impactoFba.semMedicao} produto{impactoFba.semMedicao>1?'s':''} sem tarifa medida no período — não dá pra dizer se mudam.</span></>}
                </div>
              </div>
              <button onClick={()=>setVerTarifa(v=>!v)}
                style={{flexShrink:0,background:verTarifa?'transparent':t.red,color:verTarifa?t.t2:'#fff',border:`1px solid ${verTarifa?t.line2:t.red}`,borderRadius:9,padding:'9px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                {verTarifa?'Fechar':'Ver quais e quanto'}
              </button>
            </div>
            {verTarifa && (
              <div style={{marginTop:13}}>
                <Table minWidth={720} head={[{label:'Produto',w:'34%'},{label:'Preço médio',right:true},{label:'Un.',right:true},
                  {label:'Tarifa hoje',right:true},{label:'De 01/08',right:true},{label:'Impacto',right:true},{label:'Preço p/ manter o lucro',right:true}]}>
                  {impactoFba.afetados.map(a=>(
                    <tr key={a.sku}>
                      <td style={{padding:'9px 10px',fontSize:12,color:t.t1}}>{a.nome}</td>
                      <NumTd hide={hide}>{brl2(a.precoMedio)}</NumTd>
                      <NumTd hide={hide}>{a.units}</NumTd>
                      <NumTd hide={hide}>{brl2(a.fbaHoje)}</NumTd>
                      <NumTd hide={hide} color={t.red}>{brl2(a.fbaDepois)}</NumTd>
                      <NumTd hide={hide} color={t.red} strong>−{brl2(a.impactoPeriodo)}</NumTd>
                      <NumTd hide={hide} color={t.grn}>{a.precoSugerido===null?'—':brl2(a.precoSugerido)}</NumTd>
                    </tr>
                  ))}
                </Table>
                <div style={{fontSize:11,color:t.t3,marginTop:9,lineHeight:1.6}}>
                  <b>O preço sugerido não é o preço atual + R$6.</b> Sobre o aumento incidem comissão e imposto, então parte dele volta pra Amazon e pro fisco —
                  repassar exatamente R$6 deixaria você no prejuízo achando que tinha repassado. O valor da coluna é o que devolve o <b>mesmo lucro em reais</b> que você tem hoje.
                  {' '}Produtos abaixo de R$79 e os que já pagam tarifa cheia não aparecem aqui: pra eles não muda nada.
                </div>
              </div>
            )}
          </div>
        )}

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
        {tab==='resumo' && <Resumo hide={hide} realDre={realDre} selo={selo} diario={diario} recon={recon} cmv={cmv} impostoTotal={totais.imposto} credito={totais.credito} custoEventual={totais.custoEventual} semCusto={totais.semCusto} receitaSemCusto={totais.receitaSemCusto} adsReal={adsData} costs={custoUnit} chart30={dre30} connected={amazonConnected} adsConnected={adsConnected} imposto={imposto} onDetail={setDetail}/>}
        {tab==='vendas' && <Vendas realDre={realDre} costs={costs} extras={extras} imposto={imposto} connected={amazonConnected} hide={hide} adsReal={adsData} onDetail={setDetail} ajustes={ajustes} onAddAjuste={addAjuste} onRemoverAjuste={removeAjuste}/>}
        {tab==='abc'    && <CurvaABC realDre={realDre} costs={custoUnit} adsReal={adsData} inv={inventory} connected={amazonConnected} mockD={abc} hide={hide} imposto={imposto} ajustes={ajustes} onDetail={setDetail}/>}
        {tab==='ads'    && <Ads m={m} hide={hide} adsReal={adsData} adsConnected={adsConnected} adsLoading={adsLoading} isAdmin={isAdmin} margemAds={margemRef}/>}
        {tab==='analit' && <Analitico realDre={realDre} hide={hide} connected={amazonConnected} mockM={m} costs={custoUnit} imposto={imposto} adsReal={adsData}/>}
        {tab==='gerenc' && <Gerenciamento realDre={realDre} inv={inventory} costs={costs} extras={extras} onCost={setCost} onExtra={setExtra} mockM={m} hide={hide} connected={amazonConnected} imposto={imposto} onImposto={saveImposto} isAdmin={isAdmin}/>}
        {tab==='fulfil' && <Fulfillment inv={inventory} realDre={realDre} connected={amazonConnected} mockM={m} costs={custoUnit} hide={hide}/>}
        {tab==='relat'  && <Relatorio realDre={realDre} inv={inventory} costs={custoUnit} adsReal={adsData}/>}
        {tab==='repasse'&& <Repasses connected={amazonConnected}/>}
        {tab==='dre'    && <div style={{marginTop:-8}}><FinanceiroPanel promoActive={promoActive} promoType={promoType}/></div>}

        {/* Modal de detalhamento (lupinha) — sobre qualquer aba */}
        {detail && realDre && <ProdutoDetalhe produto={detail} realDre={realDre} adsReal={adsData} costs={custoUnit} imposto={imposto} hide={hide} onClose={()=>setDetail(null)} ajustes={ajustes}/>}
      </div>
    </ThemeCtx.Provider>
  )
}
