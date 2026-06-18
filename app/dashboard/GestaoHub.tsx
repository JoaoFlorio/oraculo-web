'use client'
import React, { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts'
import { getFinanceData, summary, productMetrics, abcCurve, type ProductMetrics } from './financeiroMock'

const FinanceiroPanel = dynamic(()=>import('./FinanceiroPanel'),{ssr:false,loading:()=><div style={{padding:40,textAlign:'center',color:'#5C5C7C'}}>Carregando DRE…</div>})

/* ── Paleta premium ──────────────────────────────────────────────────────── */
const C = {
  bg:'#06060E', panel:'#0B0B16', card:'#0E0E1B', card2:'#11111F',
  line:'rgba(255,255,255,0.06)', line2:'rgba(255,255,255,0.11)',
  gold:'#E7B85C', goldb:'#F6D89B', golddim:'rgba(231,184,92,0.10)',
  grn:'#2FBE8F', red:'#F2685C', vio:'#9B8CFF', blue:'#4F86C6',
  t1:'#F3F3FA', t2:'#9595B4', t3:'#5C5C7C',
}
const FH = "'Space Grotesk','Inter',sans-serif"

/* ── Format ──────────────────────────────────────────────────────────────── */
const brl  = (n:number)=>'R$ '+Math.round(n).toLocaleString('pt-BR')
const brl2 = (n:number)=>'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const pc   = (n:number)=>n.toFixed(1).replace('.',',')+'%'

/* ── KPI Card ────────────────────────────────────────────────────────────── */
function KPI({label,value,delta,up,icon,color,hide}:{label:string;value:string;delta?:string;up?:boolean;icon:string;color:string;hide:boolean}){
  return(
    <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:13,padding:'13px 14px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9}}>
        <span style={{fontSize:10,color:C.t3,letterSpacing:'0.04em',textTransform:'uppercase' as const}}>{label}</span>
        <i className={`ti ${icon}`} style={{fontSize:14,color:C.t3}} aria-hidden="true"/>
      </div>
      <div style={{fontFamily:FH,fontWeight:600,fontSize:21,letterSpacing:'-0.02em',color,filter:hide?'blur(7px)':'none'}}>{value}</div>
      {delta&&(
        <div style={{marginTop:6,display:'inline-flex',alignItems:'center',gap:3,fontSize:10,color:up?C.grn:C.red}}>
          <i className={`ti ti-${up?'arrow-up-right':'arrow-down-right'}`} style={{fontSize:12}} aria-hidden="true"/>{delta}
        </div>
      )}
    </div>
  )
}

/* ── Table helpers ───────────────────────────────────────────────────────── */
const th:React.CSSProperties = {fontSize:10.5,color:C.t3,fontWeight:500,textAlign:'left',padding:'7px 8px',textTransform:'uppercase',letterSpacing:'0.05em'}
const td:React.CSSProperties = {fontSize:12,padding:'8px 8px',borderTop:`1px solid ${C.line}`}
function Hint({children}:{children:React.ReactNode}){
  return <div style={{fontSize:11.5,color:C.t2,marginBottom:13,display:'flex',alignItems:'center',gap:7}}>
    <i className="ti ti-bulb" style={{fontSize:14,color:C.gold}} aria-hidden="true"/>{children}
  </div>
}
function Table({head,children}:{head:{label:string;right?:boolean}[];children:React.ReactNode}){
  return(
    <div style={{overflowX:'auto' as const}}>
      <table style={{width:'100%',borderCollapse:'collapse' as const,tableLayout:'fixed' as const}}>
        <thead><tr>{head.map((h,i)=><th key={i} style={{...th,textAlign:h.right?'right':'left'}}>{h.label}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
const ellip:React.CSSProperties = {overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}

/* ── Resumo (dashboard principal) ───────────────────────────────────────── */
function Resumo({hide}:{hide:boolean}){
  const d = useMemo(()=>getFinanceData(),[])
  const s = useMemo(()=>summary(d),[d])
  const kpis = [
    {label:'Faturamento',     value:brl(s.faturamento),    delta:'+12,4%', up:true,  icon:'ti-cash',            color:C.gold},
    {label:'Líq. Marketplace',value:brl(s.liqMarketplace), delta:'+9,1%',  up:true,  icon:'ti-building-bank',   color:C.t1},
    {label:'Lucro Bruto',     value:brl(s.lucroBruto),     delta:'+15,2%', up:true,  icon:'ti-trending-up',     color:C.grn},
    {label:'Margem',          value:pc(s.margem),          delta:'+1,8pp', up:true,  icon:'ti-percentage',      color:C.grn},
    {label:'Nº de Vendas',    value:String(s.orders),      delta:'+8',     up:true,  icon:'ti-shopping-cart',   color:C.t1},
    {label:'Unidades',        value:String(s.unidades),    delta:'+74',    up:true,  icon:'ti-package',         color:C.t1},
    {label:'Ticket Médio',    value:brl(s.ticketMedio),    delta:'+3,2%',  up:true,  icon:'ti-receipt',         color:C.t1},
    {label:'ROI',             value:pc(s.roi),             delta:'+6pp',   up:true,  icon:'ti-rotate-clockwise',color:C.grn},
    {label:'Valor em Ads',    value:brl(s.ads),            delta:'+5,0%',  up:false, icon:'ti-speakerphone',    color:C.gold},
    {label:'TACOS',           value:pc(s.tacos),           delta:'-0,4pp', up:true,  icon:'ti-target',          color:C.gold},
    {label:'Lucro pós-ADS',   value:brl(s.lucroPosAds),    delta:'+17%',   up:true,  icon:'ti-coin',            color:C.grn},
    {label:'MPA',             value:pc(s.mpa),             delta:'+2,1pp', up:true,  icon:'ti-chart-pie',       color:C.grn},
  ]
  const comp = [
    {name:'Lucro líquido', value:Math.max(0,Math.round(s.lucroLiquido)), color:C.grn},
    {name:'CMV',           value:Math.round(s.cmv),       color:C.vio},
    {name:'Comissão',      value:Math.round(s.comissao),  color:C.gold},
    {name:'Ads',           value:Math.round(s.ads),       color:C.red},
    {name:'FBA',           value:Math.round(s.fba),       color:C.blue},
    {name:'Outros',        value:Math.round(s.armazenagem+s.remocao+s.refunds+s.tax), color:C.t3},
  ]
  return(
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:11,marginBottom:18}}>
        {kpis.map((k,i)=><KPI key={i} {...k} hide={hide}/>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14}}>
        <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:13,padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontSize:12.5,fontWeight:500,color:C.t1}}>Resumo de Receitas</span>
            <span style={{fontSize:10,color:C.t3}}>{d.period}</span>
          </div>
          <div style={{height:190}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.daily} margin={{top:4,right:4,left:-18,bottom:0}}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.25}/><stop offset="100%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.grn} stopOpacity={0.25}/><stop offset="100%" stopColor={C.grn} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:C.t3,fontSize:9}} tickLine={false} axisLine={false} interval={5}/>
                <YAxis tick={{fill:C.t3,fontSize:9}} tickLine={false} axisLine={false} tickFormatter={(v:number)=>'R$'+Math.round(v/1000)+'k'}/>
                <RTooltip contentStyle={{background:C.card2,border:`1px solid ${C.line2}`,borderRadius:10,fontSize:11}} labelStyle={{color:C.t3}} formatter={(v:any)=>brl(Number(v))} labelFormatter={(l)=>'Dia '+l}/>
                <Area type="monotone" dataKey="receita" name="Receita" stroke={C.gold} strokeWidth={2} fill="url(#gR)"/>
                <Area type="monotone" dataKey="lucro"   name="Lucro"   stroke={C.grn}  strokeWidth={2} fill="url(#gL)"/>
                <Area type="monotone" dataKey="ads"     name="Ads"     stroke={C.vio}  strokeWidth={2} fill="none"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:13,padding:'14px 16px'}}>
          <div style={{fontSize:12.5,fontWeight:500,color:C.t1,marginBottom:6}}>Para onde vai o faturamento</div>
          <div style={{height:150}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={comp} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={64} stroke={C.card} strokeWidth={2}>
                  {comp.map((c,i)=><Cell key={i} fill={c.color}/>)}
                </Pie>
                <RTooltip contentStyle={{background:C.card2,border:`1px solid ${C.line2}`,borderRadius:10,fontSize:11}} formatter={(v:any)=>brl(Number(v))}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{marginTop:8,display:'flex',flexDirection:'column' as const,gap:5}}>
            {comp.map((c,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:10.5}}>
                <span style={{display:'flex',alignItems:'center',gap:6,color:C.t2}}><span style={{width:8,height:8,borderRadius:2,background:c.color}}/>{c.name}</span>
                <span style={{color:C.t1,filter:hide?'blur(6px)':'none'}}>{brl(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Abas tabulares ─────────────────────────────────────────────────────── */
const nameCell = (v:string)=><td style={{...td,...ellip}}>{v}</td>
const rCell = (v:string,color?:string,hide?:boolean)=><td style={{...td,textAlign:'right',color:color||C.t2,filter:hide?'blur(6px)':'none'}}>{v}</td>

function Vendas({m,hide}:{m:ProductMetrics[];hide:boolean}){
  const t=[...m].sort((a,b)=>b.revenue-a.revenue)
  return(<>
    <Hint>Ranking por receita · ordena os produtos por faturamento e mostra a margem real.</Hint>
    <Table head={[{label:'Produto'},{label:'Un.',right:true},{label:'Receita',right:true},{label:'Margem',right:true}]}>
      {t.map(p=><tr key={p.id}>{nameCell(p.name)}{rCell(String(p.units))}{rCell(brl(p.revenue),C.t1,hide)}{rCell(pc(p.margin),p.margin>20?C.grn:C.gold)}</tr>)}
    </Table>
  </>)
}
function CurvaABC({d,hide}:{d:ReturnType<typeof abcCurve>;hide:boolean}){
  return(<>
    <Hint>Classe A = 80% do faturamento · B = 15% · C = resto. Foca estoque e ads nos produtos A.</Hint>
    <Table head={[{label:'Produto'},{label:'Receita',right:true},{label:'% total',right:true},{label:'Classe',right:true}]}>
      {d.map(p=><tr key={p.id}>{nameCell(p.name)}{rCell(brl(p.revenue),C.t1,hide)}{rCell(pc(p.shareTotal))}
        <td style={{...td,textAlign:'right',fontWeight:600,color:p.cls==='A'?C.grn:p.cls==='B'?C.gold:C.t3}}>{p.cls}</td></tr>)}
    </Table>
  </>)
}
function Ads({m,hide}:{m:ProductMetrics[];hide:boolean}){
  return(<>
    <Hint>ACoS &lt;20% ótimo · 20–30% atenção · &gt;30% prejuízo (revisar lance).</Hint>
    <Table head={[{label:'Campanha'},{label:'Gasto',right:true},{label:'Vendas',right:true},{label:'ACoS',right:true}]}>
      {m.map(p=><tr key={p.id}>{nameCell(p.name)}{rCell(brl(p.adsSpend),C.t1,hide)}{rCell(brl(p.adsSales),C.t1,hide)}{rCell(pc(p.acos),p.acos<20?C.grn:p.acos<30?C.gold:C.red)}</tr>)}
    </Table>
  </>)
}
function Analitico({m,hide}:{m:ProductMetrics[];hide:boolean}){
  const t=[...m].sort((a,b)=>b.refundUnits-a.refundUnits)
  return(<>
    <Hint>Reembolsos por produto · acha o que vende mas dá prejuízo por devolução/CMV.</Hint>
    <Table head={[{label:'Produto'},{label:'Devol.',right:true},{label:'R$ perdido',right:true},{label:'Margem',right:true}]}>
      {t.map(p=><tr key={p.id}>{nameCell(p.name)}{rCell(p.refundUnits+' un')}{rCell(brl(p.refundValue),C.red,hide)}{rCell(pc(p.margin),p.margin>20?C.grn:C.gold)}</tr>)}
    </Table>
  </>)
}
function Gerenciamento({m,hide}:{m:ProductMetrics[];hide:boolean}){
  return(<>
    <Hint>Cadastro + custo (CMV) — o que a Amazon não sabe. Alimenta a DRE e o ROI.</Hint>
    <Table head={[{label:'Produto'},{label:'SKU',right:true},{label:'Custo un.',right:true},{label:'Preço',right:true},{label:'Markup',right:true}]}>
      {m.map(p=><tr key={p.id}>{nameCell(p.name)}{rCell(p.sku,C.t3)}{rCell(brl2(p.unitCost),C.t1,hide)}{rCell(brl2(p.price),C.t1,hide)}{rCell((p.price/p.unitCost).toFixed(1)+'x',C.gold)}</tr>)}
    </Table>
  </>)
}
function Fulfillment({m}:{m:ProductMetrics[]}){
  return(<>
    <Hint>Estoque FBA + dias de cobertura · alerta de ruptura e excesso (armazenagem cara).</Hint>
    <Table head={[{label:'Produto'},{label:'FBA',right:true},{label:'Cobertura',right:true},{label:'Status',right:true}]}>
      {m.map(p=>{
        const st = p.coverageDays<10?['Ruptura',C.red]:p.coverageDays>120?['Excesso',C.gold]:['Saudável',C.grn]
        return <tr key={p.id}>{nameCell(p.name)}{rCell(String(p.stockFBA))}{rCell(p.coverageDays+' dias')}
          <td style={{...td,textAlign:'right',color:st[1]}}>{st[0]}</td></tr>
      })}
    </Table>
  </>)
}
function Relatorio(){
  const reps=[['Vendas','ti-cash'],['Reembolsos','ti-arrow-back-up'],['Estoque FBA','ti-package'],['Produtos','ti-list'],['Comissões','ti-receipt-2'],['Operacional','ti-file-spreadsheet']]
  return(<>
    <Hint>Relatórios exportáveis em CSV/PDF.</Hint>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>
      {reps.map((r,i)=>(
        <div key={i} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:12,padding:'13px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
          <span style={{display:'flex',alignItems:'center',gap:8,fontSize:12.5,color:C.t1}}><i className={`ti ${r[1]}`} style={{fontSize:17,color:C.gold}} aria-hidden="true"/>{r[0]}</span>
          <i className="ti ti-download" style={{fontSize:15,color:C.t3}} aria-hidden="true"/>
        </div>
      ))}
    </div>
  </>)
}

/* ── Hub ─────────────────────────────────────────────────────────────────── */
const TABS = [
  {id:'resumo',  label:'Resumo',       icon:'ti-layout-dashboard'},
  {id:'vendas',  label:'Vendas',       icon:'ti-cash'},
  {id:'abc',     label:'Curva ABC',    icon:'ti-chart-bar'},
  {id:'ads',     label:'Ads',          icon:'ti-speakerphone'},
  {id:'analit',  label:'Analítico',    icon:'ti-chart-dots'},
  {id:'gerenc',  label:'Gerenciamento',icon:'ti-adjustments'},
  {id:'fulfil',  label:'Fulfillment',  icon:'ti-truck-delivery'},
  {id:'relat',   label:'Relatório',    icon:'ti-file-text'},
  {id:'dre',     label:'DRE',          icon:'ti-building-bank'},
]

export default function GestaoHub({promoActive=false,promoType=null}:{promoActive?:boolean;promoType?:'comissao'|'fba'|'ambas'|null}){
  const [tab,setTab]=useState('resumo')
  const [hide,setHide]=useState(false)
  const d = useMemo(()=>getFinanceData(),[])
  const m = useMemo(()=>productMetrics(d),[d])
  const abc = useMemo(()=>abcCurve(d),[d])

  return(
    <div style={{maxWidth:1080,margin:'0 auto'}}>
      <link rel="stylesheet" precedence="default" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"/>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' as const,marginBottom:14}}>
        <div>
          <h2 style={{fontFamily:FH,fontSize:20,fontWeight:600,color:C.t1,letterSpacing:'-0.02em'}}>Gestão</h2>
          <p style={{fontSize:11.5,color:C.t2,marginTop:1}}>Visão financeira da sua operação Amazon · <span style={{color:C.gold}}>dados de exemplo</span></p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>setHide(v=>!v)} title="Ocultar valores"
            style={{background:C.card2,border:`1px solid ${C.line2}`,borderRadius:9,width:34,height:34,color:C.t2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className={`ti ti-${hide?'eye-off':'eye'}`} aria-hidden="true"/>
          </button>
          <select style={{background:C.card2,color:C.t1,border:`1px solid ${C.line2}`,borderRadius:9,padding:'7px 10px',fontSize:12,fontFamily:'inherit',outline:'none'}}>
            <option>Últimos 30 dias</option><option>Este mês</option><option>Mês passado</option><option>Hoje</option>
          </select>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{display:'flex',gap:6,overflowX:'auto' as const,borderBottom:`1px solid ${C.line}`,paddingBottom:11,marginBottom:18}}>
        {TABS.map(t=>{
          const on=tab===t.id
          return(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{display:'flex',alignItems:'center',gap:6,fontSize:12,whiteSpace:'nowrap' as const,padding:'7px 11px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',border:'1px solid transparent',
                background:on?C.gold:'transparent',color:on?'#1c1606':C.t2,fontWeight:on?600:400}}>
              <i className={`ti ${t.icon}`} style={{fontSize:14}} aria-hidden="true"/>{t.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo */}
      {tab==='resumo' && <Resumo hide={hide}/>}
      {tab==='vendas' && <Vendas m={m} hide={hide}/>}
      {tab==='abc'    && <CurvaABC d={abc} hide={hide}/>}
      {tab==='ads'    && <Ads m={m} hide={hide}/>}
      {tab==='analit' && <Analitico m={m} hide={hide}/>}
      {tab==='gerenc' && <Gerenciamento m={m} hide={hide}/>}
      {tab==='fulfil' && <Fulfillment m={m}/>}
      {tab==='relat'  && <Relatorio/>}
      {tab==='dre'    && <div style={{marginTop:-8}}><FinanceiroPanel promoActive={promoActive} promoType={promoType}/></div>}
    </div>
  )
}
