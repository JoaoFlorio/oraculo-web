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
const ThemeCtx = createContext<Theme>(THEMES.dark)
const useT = ()=>useContext(ThemeCtx)

/* ── Format ──────────────────────────────────────────────────────────────── */
const brl  = (n:number)=>'R$ '+Math.round(n).toLocaleString('pt-BR')
const brl2 = (n:number)=>'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const pc   = (n:number)=>n.toFixed(1).replace('.',',')+'%'
function periodRange(p:string):{from:string;to:string}{
  const now=new Date(); const to=now.toISOString()
  if(p==='Hoje')        return {from:new Date(now.getFullYear(),now.getMonth(),now.getDate()).toISOString(), to}
  if(p==='Este mês')    return {from:new Date(now.getFullYear(),now.getMonth(),1).toISOString(), to}
  if(p==='Mês passado') return {from:new Date(now.getFullYear(),now.getMonth()-1,1).toISOString(), to:new Date(now.getFullYear(),now.getMonth(),0,23,59,59).toISOString()}
  return {from:new Date(now.getTime()-30*86400000).toISOString(), to} // Últimos 30 dias
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
  return <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,textAlign:'right',fontFamily:FH,fontWeight:strong?600:500,fontSize:13,color:color||t.t1,filter:hide?'blur(6px)':'none'}}>{children}</td>
}
function PillTd({children}:{children:React.ReactNode}){
  const t=useT(); return <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`,textAlign:'right'}}>{children}</td>
}
function Table({head,children}:{head:{label:string;right?:boolean;w?:string}[];children:React.ReactNode}){
  const t=useT()
  return(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,overflow:'hidden'}}>
      <div style={{overflowX:'auto' as const}}>
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

/* ── KPI ─────────────────────────────────────────────────────────────────── */
function KPI({label,value,delta,up,icon,color,hide}:{label:string;value:string;delta?:string;up?:boolean;icon:string;color:string;hide:boolean}){
  const t=useT()
  return(
    <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:13,padding:'14px 15px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9}}>
        <span style={{fontSize:10.5,color:t.t3,letterSpacing:'0.04em',textTransform:'uppercase' as const,fontWeight:500}}>{label}</span>
        <i className={`ti ${icon}`} style={{fontSize:15,color:t.t3}} aria-hidden="true"/>
      </div>
      <div style={{fontFamily:FH,fontWeight:600,fontSize:22,letterSpacing:'-0.02em',color,filter:hide?'blur(7px)':'none'}}>{value}</div>
      {delta&&<div style={{marginTop:6,display:'inline-flex',alignItems:'center',gap:3,fontSize:11,fontWeight:500,color:up?t.grn:t.red}}>
        <i className={`ti ti-${up?'arrow-up-right':'arrow-down-right'}`} style={{fontSize:12}} aria-hidden="true"/>{delta}
      </div>}
    </div>
  )
}

/* ── DRE Real (dados ao vivo da conta Amazon) ────────────────────────────── */
function RealDRECard({data,hide}:{data:any;hide:boolean}){
  const t=useT()
  const L=data.linhas||{}
  const Row=({label,val,sign,strong,color}:{label:string;val:number;sign?:'-'|'=';strong?:boolean;color?:string})=>(
    <div style={{display:'flex',justifyContent:'space-between',padding:'8px 2px',borderBottom:`1px solid ${t.line}`,fontSize:strong?14:13}}>
      <span style={{color:strong?t.t1:t.t2,fontWeight:strong?600:400}}>{sign==='='?'= ':sign==='-'?'(–) ':''}{label}</span>
      <span style={{color:color||t.t1,fontWeight:strong?700:500,fontFamily:FH,filter:hide?'blur(6px)':'none'}}>{brl(val||0)}</span>
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
      <Row label="Ads (parcial)" val={L.ads} sign="-" color={t.red}/>
      <div style={{fontSize:10.5,color:t.t3,marginTop:10}}>Ads completo virá da Advertising API · CMV e despesas você informa em Gerenciamento.</div>
    </div>
  )
}

/* ── Resumo ──────────────────────────────────────────────────────────────── */
function Resumo({hide,realDre,cmv=0}:{hide:boolean;realDre?:any;cmv?:number}){
  const t=useT()
  const d=useMemo(()=>getFinanceData(),[])
  const s=useMemo(()=>summary(d),[d])
  const kpis=[
    {label:'Faturamento',value:brl(s.faturamento),delta:'+12,4%',up:true,icon:'ti-cash',color:t.gold},
    {label:'Líq. Marketplace',value:brl(s.liqMarketplace),delta:'+9,1%',up:true,icon:'ti-building-bank',color:t.t1},
    {label:'Lucro Bruto',value:brl(s.lucroBruto),delta:'+15,2%',up:true,icon:'ti-trending-up',color:t.grn},
    {label:'Margem',value:pc(s.margem),delta:'+1,8pp',up:true,icon:'ti-percentage',color:t.grn},
    {label:'Nº de Vendas',value:String(s.orders),delta:'+8',up:true,icon:'ti-shopping-cart',color:t.t1},
    {label:'Unidades',value:String(s.unidades),delta:'+74',up:true,icon:'ti-package',color:t.t1},
    {label:'Ticket Médio',value:brl(s.ticketMedio),delta:'+3,2%',up:true,icon:'ti-receipt',color:t.t1},
    {label:'ROI',value:pc(s.roi),delta:'+6pp',up:true,icon:'ti-rotate-clockwise',color:t.grn},
    {label:'Valor em Ads',value:brl(s.ads),delta:'+5,0%',up:false,icon:'ti-speakerphone',color:t.gold},
    {label:'TACOS',value:pc(s.tacos),delta:'-0,4pp',up:true,icon:'ti-target',color:t.gold},
    {label:'Lucro pós-ADS',value:brl(s.lucroPosAds),delta:'+17%',up:true,icon:'ti-coin',color:t.grn},
    {label:'MPA',value:pc(s.mpa),delta:'+2,1pp',up:true,icon:'ti-chart-pie',color:t.grn},
  ]
  const comp=[
    {name:'Lucro líquido',value:Math.max(0,Math.round(s.lucroLiquido)),color:t.grn},
    {name:'CMV',value:Math.round(s.cmv),color:t.vio},
    {name:'Comissão',value:Math.round(s.comissao),color:t.gold},
    {name:'Ads',value:Math.round(s.ads),color:t.red},
    {name:'FBA',value:Math.round(s.fba),color:t.blue},
    {name:'Outros',value:Math.round(s.armazenagem+s.remocao+s.refunds+s.tax),color:t.t3},
  ]
  // ── KPIs e rosca REAIS quando conectado ──
  const RK = realDre ? (()=>{
    const L=realDre.linhas||{}
    const receita=L.receitaLiquida||0, liq=realDre.liqMarketplace||0, ads=L.ads||0
    const vendas=realDre.vendas||0, unidades=realDre.unidades||0
    const ticket=vendas>0?receita/vendas:0, tacos=receita>0?ads/receita*100:0
    const lucroBruto=liq-cmv, lucroPosAds=lucroBruto-ads
    const margem=receita>0?lucroBruto/receita*100:0, roi=cmv>0?lucroBruto/cmv*100:0
    const mpa=receita>0?lucroPosAds/receita*100:0, cm=cmv>0, dash='—'
    return {
      kpis:[
        {label:'Faturamento',value:brl(receita),icon:'ti-cash',color:t.gold},
        {label:'Líq. Marketplace',value:brl(liq),icon:'ti-building-bank',color:t.t1},
        {label:'Lucro Bruto',value:cm?brl(lucroBruto):dash,icon:'ti-trending-up',color:cm?t.grn:t.t3},
        {label:'Margem',value:cm?pc(margem):dash,icon:'ti-percentage',color:cm?t.grn:t.t3},
        {label:'Nº de Vendas',value:String(vendas),icon:'ti-shopping-cart',color:t.t1},
        {label:'Unidades',value:String(unidades),icon:'ti-package',color:t.t1},
        {label:'Ticket Médio',value:brl(ticket),icon:'ti-receipt',color:t.t1},
        {label:'ROI',value:cm?pc(roi):dash,icon:'ti-rotate-clockwise',color:cm?t.grn:t.t3},
        {label:'Valor em Ads',value:brl(ads),icon:'ti-speakerphone',color:t.gold},
        {label:'TACOS',value:pc(tacos),icon:'ti-target',color:t.gold},
        {label:'Lucro pós-ADS',value:cm?brl(lucroPosAds):dash,icon:'ti-coin',color:cm?t.grn:t.t3},
        {label:'MPA',value:cm?pc(mpa):dash,icon:'ti-chart-pie',color:cm?t.grn:t.t3},
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
  const shownKpis:any[] = RK?RK.kpis:kpis
  const shownComp:any[] = RK?RK.comp:comp
  return(<>
    {realDre && <RealDRECard data={realDre} hide={hide}/>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:11,marginBottom:18}}>
      {shownKpis.map((k:any,i:number)=><KPI key={i} {...k} hide={hide}/>)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14}}>
      <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'14px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
          <span style={{fontSize:13,fontWeight:600,color:t.t1}}>Resumo de Receitas</span>
          <span style={{fontSize:10.5,color:t.t3}}>{d.period}</span>
        </div>
        <div style={{height:190}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.daily} margin={{top:4,right:4,left:-18,bottom:0}}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.gold} stopOpacity={0.3}/><stop offset="100%" stopColor={t.gold} stopOpacity={0}/></linearGradient>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.grn} stopOpacity={0.28}/><stop offset="100%" stopColor={t.grn} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid stroke={t.grid} vertical={false}/>
              <XAxis dataKey="day" tick={{fill:t.t3,fontSize:10}} tickLine={false} axisLine={false} interval={5}/>
              <YAxis tick={{fill:t.t3,fontSize:10}} tickLine={false} axisLine={false} tickFormatter={(v:number)=>'R$'+Math.round(v/1000)+'k'}/>
              <RTooltip contentStyle={{background:t.tipBg,border:`1px solid ${t.line2}`,borderRadius:10,fontSize:12,color:t.t1}} labelStyle={{color:t.t3}} formatter={(v:any)=>brl(Number(v))} labelFormatter={(l)=>'Dia '+l}/>
              <Area type="monotone" dataKey="receita" name="Receita" stroke={t.gold} strokeWidth={2.2} fill="url(#gR)"/>
              <Area type="monotone" dataKey="lucro" name="Lucro" stroke={t.grn} strokeWidth={2.2} fill="url(#gL)"/>
              <Area type="monotone" dataKey="ads" name="Ads" stroke={t.vio} strokeWidth={2} fill="none"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:14,padding:'14px 16px'}}>
        <div style={{fontSize:13,fontWeight:600,color:t.t1,marginBottom:6}}>Para onde vai o faturamento</div>
        <div style={{height:150}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={shownComp} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={64} stroke={t.card} strokeWidth={2}>
                {shownComp.map((c:any,i:number)=><Cell key={i} fill={c.color}/>)}
              </Pie>
              <RTooltip contentStyle={{background:t.tipBg,border:`1px solid ${t.line2}`,borderRadius:10,fontSize:12,color:t.t1}} formatter={(v:any)=>brl(Number(v))}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{marginTop:8,display:'flex',flexDirection:'column' as const,gap:6}}>
          {shownComp.map((c:any,i:number)=>(
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:11.5}}>
              <span style={{display:'flex',alignItems:'center',gap:6,color:t.t2}}><span style={{width:9,height:9,borderRadius:2,background:c.color}}/>{c.name}</span>
              <span style={{color:t.t1,fontWeight:500,filter:hide?'blur(6px)':'none'}}>{brl(c.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>)
}

/* ── Abas tabulares ─────────────────────────────────────────────────────── */
function Vendas({m,hide}:{m:ProductMetrics[];hide:boolean}){
  const t=[...m].sort((a,b)=>b.revenue-a.revenue)
  return(<>
    <Hint>Ranking por receita · ordena os produtos por faturamento e mostra a margem real.</Hint>
    <Table head={[{label:'Produto',w:'46%'},{label:'Un.',right:true},{label:'Receita',right:true},{label:'Margem',right:true}]}>
      {t.map(p=><tr key={p.id}><ProdCell p={p}/><NumTd>{p.units}</NumTd><NumTd strong hide={hide}>{brl(p.revenue)}</NumTd><PillTd><Pill kind={p.margin>20?'grn':'gold'}>{pc(p.margin)}</Pill></PillTd></tr>)}
    </Table>
  </>)
}
function CurvaABC({d,hide}:{d:ReturnType<typeof abcCurve>;hide:boolean}){
  const t=useT()
  const groups=(['A','B','C'] as const).map(cls=>{
    const items=d.filter(p=>p.cls===cls)
    return {cls,count:items.length,rev:items.reduce((s,p)=>s+p.revenue,0),un:items.reduce((s,p)=>s+p.units,0),
      color:cls==='A'?t.grn:cls==='B'?t.blue:t.gold}
  })
  return(<>
    <Hint>Classe A = 80% do faturamento · B = 15% · C = resto. Foca estoque e ads nos produtos A.</Hint>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:11,marginBottom:16}}>
      {groups.map(g=>(
        <div key={g.cls} style={{background:t.card,border:`1px solid ${t.line}`,borderTop:`3px solid ${g.color}`,borderRadius:12,padding:'13px 15px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <span style={{width:24,height:24,borderRadius:7,background:g.color+'22',color:g.color,fontWeight:700,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FH}}>{g.cls}</span>
            <span style={{fontSize:12,color:t.t2}}>{g.count} produto{g.count!==1?'s':''} · {g.un} un</span>
          </div>
          <div style={{fontFamily:FH,fontWeight:600,fontSize:18,color:t.t1,filter:hide?'blur(7px)':'none'}}>{brl(g.rev)}</div>
        </div>
      ))}
    </div>
    <Table head={[{label:'Produto',w:'46%'},{label:'Receita',right:true},{label:'% total',right:true},{label:'Classe',right:true}]}>
      {d.map(p=><tr key={p.id}><ProdCell p={p}/><NumTd hide={hide}>{brl(p.revenue)}</NumTd><NumTd>{pc(p.shareTotal)}</NumTd>
        <PillTd><Pill kind={p.cls==='A'?'grn':p.cls==='B'?'gold':'red'}>{p.cls}</Pill></PillTd></tr>)}
    </Table>
  </>)
}
function Ads({m,hide}:{m:ProductMetrics[];hide:boolean}){
  return(<>
    <Hint>ACoS &lt;20% ótimo · 20–30% atenção · &gt;30% prejuízo (revisar lance).</Hint>
    <Table head={[{label:'Campanha',w:'42%'},{label:'Gasto',right:true},{label:'Vendas',right:true},{label:'ROAS',right:true},{label:'ACoS',right:true}]}>
      {m.map(p=><tr key={p.id}><ProdCell p={p}/><NumTd hide={hide}>{brl(p.adsSpend)}</NumTd><NumTd hide={hide}>{brl(p.adsSales)}</NumTd><NumTd>{p.roas.toFixed(1)}x</NumTd>
        <PillTd><Pill kind={p.acos<20?'grn':p.acos<30?'gold':'red'}>{pc(p.acos)}</Pill></PillTd></tr>)}
    </Table>
  </>)
}
function Analitico({m,hide}:{m:ProductMetrics[];hide:boolean}){
  const T=useT()
  const rows=[...m].sort((a,b)=>b.refundUnits-a.refundUnits)
  return(<>
    <Hint>Reembolsos por produto · acha o que vende mas dá prejuízo por devolução/CMV.</Hint>
    <Table head={[{label:'Produto',w:'46%'},{label:'Devol.',right:true},{label:'R$ perdido',right:true},{label:'Margem',right:true}]}>
      {rows.map(p=><tr key={p.id}><ProdCell p={p}/><NumTd>{p.refundUnits} un</NumTd><NumTd color={T.red} hide={hide}>{brl(p.refundValue)}</NumTd>
        <PillTd><Pill kind={p.margin>20?'grn':'gold'}>{pc(p.margin)}</Pill></PillTd></tr>)}
    </Table>
  </>)
}
function Gerenciamento({realDre,costs,onCost,mockM,hide}:{realDre?:any;costs:Record<string,number>;onCost:(sku:string,v:number)=>void;mockM:ProductMetrics[];hide:boolean}){
  const t=useT()
  if(!realDre?.produtos?.length){
    return(<>
      <Hint>Conecte sua conta Amazon pra informar o custo (CMV) dos produtos vendidos — é o que falta pro lucro real.</Hint>
      <Table head={[{label:'Produto',w:'48%'},{label:'Custo un.',right:true},{label:'Preço',right:true},{label:'Markup',right:true}]}>
        {mockM.map(p=><tr key={p.id}><ProdCell p={p}/><NumTd hide={hide}>{brl2(p.unitCost)}</NumTd><NumTd hide={hide}>{brl2(p.price)}</NumTd>
          <PillTd><Pill kind="gold">{(p.price/p.unitCost).toFixed(1)}x</Pill></PillTd></tr>)}
      </Table>
    </>)
  }
  const prods=realDre.produtos as any[]
  const cmvTotal=prods.reduce((sum,p)=>sum+p.units*(costs[p.sku]||0),0)
  const inp:React.CSSProperties={width:84,background:t.dark?'rgba(255,255,255,0.05)':'#FFFFFF',border:`1px solid ${t.line2}`,borderRadius:7,color:t.t1,fontSize:12.5,fontWeight:600,padding:'6px 8px',fontFamily:'inherit',outline:'none',textAlign:'right'}
  return(<>
    <Hint>Informe o custo unitário de cada produto vendido. É o que falta pro Oráculo calcular o seu <b>lucro real</b> — a Amazon não sabe quanto você paga.</Hint>
    <Table head={[{label:'Produto (SKU)',w:'36%'},{label:'Un. vendidas',right:true},{label:'Receita',right:true},{label:'Custo unit.',right:true},{label:'CMV',right:true}]}>
      {prods.map((p)=>{
        const cost=costs[p.sku]||0
        const cmv=p.units*cost
        return(
          <tr key={p.sku}>
            <td style={{padding:'9px 8px',borderTop:`1px solid ${t.line}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <Thumb p={{id:p.sku,name:p.sku}}/>
                <div style={{fontSize:12.5,fontWeight:500,color:t.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.sku}</div>
              </div>
            </td>
            <NumTd>{p.units}</NumTd>
            <NumTd hide={hide}>{brl(p.receita)}</NumTd>
            <PillTd><input type="number" min={0} step={0.5} value={cost||''} placeholder="0,00" onChange={e=>onCost(p.sku,parseFloat(e.target.value)||0)} style={inp}/></PillTd>
            <NumTd color={t.gold} hide={hide}>{cmv>0?brl(cmv):'—'}</NumTd>
          </tr>
        )
      })}
    </Table>
    <div style={{display:'flex',justifyContent:'flex-end',alignItems:'baseline',gap:8,marginTop:12,fontSize:13}}>
      <span style={{color:t.t2,fontWeight:500}}>CMV Total do período</span>
      <span style={{color:t.gold,fontWeight:700,fontFamily:FH,filter:hide?'blur(6px)':'none'}}>{brl(cmvTotal)}</span>
    </div>
    <div style={{fontSize:11,color:t.t3,marginTop:8}}>Salvo automaticamente · volte ao Resumo pra ver Lucro Bruto, Margem, ROI e MPA reais.</div>
  </>)
}
function Fulfillment({m}:{m:ProductMetrics[]}){
  return(<>
    <Hint>Estoque FBA + dias de cobertura · alerta de ruptura e excesso (armazenagem cara).</Hint>
    <Table head={[{label:'Produto',w:'48%'},{label:'FBA',right:true},{label:'Cobertura',right:true},{label:'Status',right:true}]}>
      {m.map(p=>{
        const k = p.coverageDays<10?'red':p.coverageDays>120?'gold':'grn'
        const lbl = p.coverageDays<10?'Ruptura':p.coverageDays>120?'Excesso':'Saudável'
        return <tr key={p.id}><ProdCell p={p}/><NumTd>{p.stockFBA}</NumTd><NumTd>{p.coverageDays} dias</NumTd><PillTd><Pill kind={k}>{lbl}</Pill></PillTd></tr>
      })}
    </Table>
  </>)
}
function Relatorio(){
  const t=useT()
  const reps=[['Vendas','ti-cash'],['Reembolsos','ti-arrow-back-up'],['Estoque FBA','ti-package'],['Produtos','ti-list'],['Comissões','ti-receipt-2'],['Operacional','ti-file-spreadsheet']]
  return(<>
    <Hint>Relatórios exportáveis em CSV/PDF.</Hint>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:11}}>
      {reps.map((r,i)=>(
        <div key={i} style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:12,padding:'14px 15px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
          <span style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:500,color:t.t1}}><i className={`ti ${r[1]}`} style={{fontSize:18,color:t.gold}} aria-hidden="true"/>{r[0]}</span>
          <i className="ti ti-download" style={{fontSize:16,color:t.t3}} aria-hidden="true"/>
        </div>
      ))}
    </div>
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
  {id:'fulfil',label:'Fulfillment',icon:'ti-truck-delivery'},
  {id:'relat',label:'Relatório',icon:'ti-file-text'},
  {id:'dre',label:'DRE',icon:'ti-building-bank'},
]
const THEME_KEY='oraculo_theme'

export default function GestaoHub({promoActive=false,promoType=null}:{promoActive?:boolean;promoType?:'comissao'|'fba'|'ambas'|null;userEmail?:string}){
  const [tab,setTab]=useState('resumo')
  const [hide,setHide]=useState(false)
  const [themeKey,setThemeKey]=useState('dark')
  const [amazonConnected,setAmazonConnected]=useState<boolean|null>(null)
  const [realDre,setRealDre]=useState<any>(null)
  const [period,setPeriod]=useState('Últimos 30 dias')
  useEffect(()=>{
    let alive=true
    fetch('/api/amazon/status').then(r=>r.json()).then(d=>{ if(alive) setAmazonConnected(!!d.connected) }).catch(()=>{ if(alive) setAmazonConnected(false) })
    return ()=>{ alive=false }
  },[])
  useEffect(()=>{
    if(!amazonConnected) return
    let alive=true
    const {from,to}=periodRange(period)
    setRealDre(null)
    fetch(`/api/amazon/finance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r=>r.json()).then(f=>{ if(alive&&f&&f.linhas) setRealDre(f) }).catch(()=>{})
    return ()=>{ alive=false }
  },[amazonConnected,period])
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
  const cmv = realDre?.produtos ? realDre.produtos.reduce((sum:number,p:any)=>sum+p.units*(costs[p.sku]||0),0) : 0
  useEffect(()=>{
    let s = (typeof document!=='undefined' && document.documentElement.getAttribute('data-theme')) || ''
    if(!s) try{ s = localStorage.getItem(THEME_KEY)||'' }catch{}
    if(s && THEMES[s]) setThemeKey(s)
  },[])
  const setTheme=(k:string)=>{
    setThemeKey(k)
    try{ localStorage.setItem(THEME_KEY,k) }catch{}
    if(typeof document!=='undefined') document.documentElement.setAttribute('data-theme',k)  // tema do site inteiro
  }
  const t=THEMES[themeKey]||THEMES.dark

  const d=useMemo(()=>getFinanceData(),[])
  const m=useMemo(()=>productMetrics(d),[d])
  const abc=useMemo(()=>abcCurve(d),[d])

  return(
    <ThemeCtx.Provider value={t}>
      <div style={{background:t.dark?'transparent':t.pageBg,borderRadius:t.dark?0:16,border:t.dark?'none':`1px solid ${t.line}`,padding:t.dark?'2px 0 28px':'18px 20px 28px',minHeight:'calc(100vh - 80px)'}}>
        <link rel="stylesheet" precedence="default" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"/>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' as const,marginBottom:14}}>
          <div>
            <h2 style={{fontFamily:FH,fontSize:21,fontWeight:600,color:t.t1,letterSpacing:'-0.02em'}}>Gestão</h2>
            <p style={{fontSize:12,color:t.t2,marginTop:1}}>Visão financeira da sua operação Amazon · <span style={{color:realDre?t.grn:t.goldText,fontWeight:500}}>{realDre?'dados reais da Amazon':'dados de exemplo'}</span></p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {/* Seletor de paleta */}
            <div style={{display:'flex',gap:3,background:t.card,border:`1px solid ${t.line}`,borderRadius:9,padding:3}}>
              {Object.values(THEMES).map(th=>{
                const on=themeKey===th.key
                return(
                  <button key={th.key} onClick={()=>setTheme(th.key)} title={`Tema ${th.name}`}
                    style={{display:'flex',alignItems:'center',gap:5,fontSize:11.5,fontWeight:on?600:400,padding:'5px 9px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',border:'none',
                      background:on?(t.dark?'rgba(255,255,255,0.08)':'#EEF0F3'):'transparent',color:on?t.t1:t.t3}}>
                    <span style={{width:11,height:11,borderRadius:'50%',background:th.dark?'#16162A':'#FFFFFF',border:`1.5px solid ${th.gold}`}}/>{th.name}
                  </button>
                )
              })}
            </div>
            <button onClick={()=>setHide(v=>!v)} title="Ocultar valores"
              style={{background:t.card,border:`1px solid ${t.line}`,borderRadius:9,width:34,height:34,color:t.t2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className={`ti ti-${hide?'eye-off':'eye'}`} aria-hidden="true"/>
            </button>
            <select value={period} onChange={e=>setPeriod(e.target.value)} style={{background:t.card,color:t.t1,border:`1px solid ${t.line}`,borderRadius:9,padding:'7px 10px',fontSize:12,fontFamily:'inherit',outline:'none'}}>
              <option>Últimos 30 dias</option><option>Este mês</option><option>Mês passado</option><option>Hoje</option>
            </select>
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
          </div>
        )}

        {/* Sub-tabs */}
        <div style={{display:'flex',gap:6,overflowX:'auto' as const,borderBottom:`1px solid ${t.line}`,paddingBottom:11,marginBottom:18}}>
          {TABS.map(tb=>{
            const on=tab===tb.id
            return(
              <button key={tb.id} onClick={()=>setTab(tb.id)}
                style={{display:'flex',alignItems:'center',gap:6,fontSize:12.5,whiteSpace:'nowrap' as const,padding:'7px 12px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',border:'1px solid transparent',
                  background:on?t.gold:'transparent',color:on?(t.dark?'#1c1606':'#3a2a05'):t.t2,fontWeight:on?600:500}}>
                <i className={`ti ${tb.icon}`} style={{fontSize:14}} aria-hidden="true"/>{tb.label}
              </button>
            )
          })}
        </div>

        {/* Conteúdo */}
        {tab==='resumo' && <Resumo hide={hide} realDre={realDre} cmv={cmv}/>}
        {tab==='vendas' && <Vendas m={m} hide={hide}/>}
        {tab==='abc'    && <CurvaABC d={abc} hide={hide}/>}
        {tab==='ads'    && <Ads m={m} hide={hide}/>}
        {tab==='analit' && <Analitico m={m} hide={hide}/>}
        {tab==='gerenc' && <Gerenciamento realDre={realDre} costs={costs} onCost={setCost} mockM={m} hide={hide}/>}
        {tab==='fulfil' && <Fulfillment m={m}/>}
        {tab==='relat'  && <Relatorio/>}
        {tab==='dre'    && <div style={{marginTop:-8}}><FinanceiroPanel promoActive={promoActive} promoType={promoType}/></div>}
      </div>
    </ThemeCtx.Provider>
  )
}
