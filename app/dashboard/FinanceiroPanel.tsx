'use client'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, LabelList,
} from 'recharts'

/* ── Tokens ───────────────────────────────────────────────────────────────── */
const C = {
  bg:'#03030A', card:'#0B0B1A', card2:'#0F0F22', modal:'#09091A',
  line:'rgba(255,255,255,0.07)', lineG:'rgba(240,180,41,0.22)',
  gold:'#F0B429', goldG:'linear-gradient(135deg,#F5C842 0%,#C48F10 100%)',
  g:'#22C55E', a:'#F59E0B', r:'#EF4444', pur:'#8B78FF', blue:'#3B82F6',
  t1:'#F2F2FC', t2:'#A0A0C8', t3:'#686890', t4:'#C8C8E8',
}

/* ── Types ────────────────────────────────────────────────────────────────── */
interface DailyRow   { day:number; atual:number; anterior:number; anoPassado:number }
interface SalesData  {
  period:string; revenue:number; orders:number; units:number; avgTicket:number
  daily:DailyRow[]; lastMonthRevenue:number; lastYearRevenue:number
}
interface Campaign   { name:string; status:string; spend:number; sales:number; acos:number; roas:number; orders:number }
interface AdsData    { campaigns:Campaign[]; totalSpend:number; totalSales:number; totalAcos:number; totalRoas:number }
interface DRECfg     { amazonFee:number; fbaFee:number }

interface ProductCost {
  id:string; name:string; units:number; unitCost:number; extraPerUnit:number
}
interface Expense {
  id:string; label:string; value:number
}
interface Insight    { type:'g'|'a'|'r'; text:string }

/* ── CSV helpers ──────────────────────────────────────────────────────────── */
function parseCSVLine(line:string): string[] {
  const r:string[]=[];let cur='';let q=false
  for(const ch of line){
    if(ch==='"') q=!q
    else if(ch===','&&!q){r.push(cur.trim());cur=''}
    else cur+=ch
  }
  r.push(cur.trim());return r
}
function brl(s:string):number{
  if(!s)return 0
  const clean=s.replace(/R\$\s?/g,'').trim()
  if(clean.includes(','))return parseFloat(clean.replace(/\./g,'').replace(',','.'))||0
  return parseFloat(clean)||0
}
function pct(s:string):number{ return parseFloat((s||'').replace('%','').replace(',','.'))||0 }
const fmtR=(n:number)=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtK=(n:number)=>{
  const abs=Math.abs(n); const sign=n<0?'-':''
  if(abs>=1000)return `${sign}${(abs/1000).toFixed(1).replace('.0','')}k`
  return fmtR(n)
}
const uid=()=>Math.random().toString(36).slice(2)

/* ── Parsers ──────────────────────────────────────────────────────────────── */
function parseSales(text:string):SalesData{
  const lines=text.split('\n').map(l=>l.trim())
  const gIdx=lines.findIndex(l=>l.includes('Exibição de gráfico'))
  const tIdx=lines.findIndex(l=>l.includes('Exibição de tabela'))
  const daily:DailyRow[]=[]
  if(gIdx>=0){
    for(let i=gIdx+2;i<(tIdx>0?tIdx:lines.length);i++){
      const c=parseCSVLine(lines[i])
      const day=parseInt(c[0]);if(isNaN(day))continue
      daily.push({day,atual:brl(c[1]),anterior:brl(c[3]),anoPassado:brl(c[5])})
    }
  }
  let revenue=0,orders=0,units=0,avgTicket=0,lastMonthRevenue=0,lastYearRevenue=0
  const periodLine=lines.find(l=>l.startsWith('Data,'))
  const period=periodLine?periodLine.split(',')[1]||'Período atual':'Período atual'
  if(tIdx>=0){
    for(let i=tIdx+2;i<Math.min(tIdx+12,lines.length);i++){
      const raw=lines[i];if(!raw)continue
      const c=parseCSVLine(raw)
      if(raw.startsWith('Este mês, até agora,')&&!raw.includes('BRT')){
        orders=parseInt(c[2])||0; units=parseInt(c[3])||0; revenue=brl(c[4]); avgTicket=parseFloat(c[6])||0
      } else if(c[0]==='Mês passado'){
        lastMonthRevenue=brl(c[3])
      } else if(c[0]==='Mesmo mês do ano anterior'){
        lastYearRevenue=brl(c[3])
      }
    }
  }
  return{period,revenue,orders,units,avgTicket,daily,lastMonthRevenue,lastYearRevenue}
}

function parseAds(text:string):AdsData{
  const lines=text.split('\n').map(l=>l.trim()).filter(l=>l)
  if(lines.length<2)return{campaigns:[],totalSpend:0,totalSales:0,totalAcos:0,totalRoas:0}
  const hdrs=parseCSVLine(lines[0]).map(h=>h.toLowerCase())
  const col=(row:string[],name:string)=>{const i=hdrs.findIndex(h=>h.includes(name));return i>=0?row[i]||'':''}
  const campaigns:Campaign[]=[]
  for(let i=1;i<lines.length;i++){
    const r=parseCSVLine(lines[i]);if(r.length<5)continue
    campaigns.push({
      name:col(r,'nome da campanha'),status:col(r,'status da campanha'),
      spend:brl(col(r,'gastos')),sales:brl(col(r,'total de vendas')),
      acos:pct(col(r,'acos')),roas:parseFloat(col(r,'roas').replace(',','.'))||0,
      orders:parseInt(col(r,'total de pedidos'))||0,
    })
  }
  const totalSpend=campaigns.reduce((s,c)=>s+c.spend,0)
  const totalSales=campaigns.reduce((s,c)=>s+c.sales,0)
  return{campaigns,totalSpend,totalSales,
    totalAcos:totalSales>0?(totalSpend/totalSales)*100:0,
    totalRoas:totalSpend>0?totalSales/totalSpend:0}
}

function calcInsights(s:SalesData|null,a:AdsData|null,cfg:DRECfg,cmv:number,otherCosts:number):Insight[]{
  const ins:Insight[]=[]
  if(!s&&!a)return ins
  if(s){
    if(s.lastMonthRevenue>0){
      const g=((s.revenue-s.lastMonthRevenue)/s.lastMonthRevenue)*100
      if(g>0)ins.push({type:'g',text:`Receita ${g.toFixed(0)}% acima do mês passado no mesmo período 🚀`})
      else ins.push({type:'r',text:`Receita ${Math.abs(g).toFixed(0)}% abaixo do mês passado no mesmo período`})
    }
    if(s.avgTicket>100)ins.push({type:'g',text:`Ticket médio de R$ ${fmtR(s.avgTicket)} — produtos de valor agregado alto ✅`})
  }
  if(a){
    if(a.totalAcos>0&&a.totalAcos<5)ins.push({type:'g',text:`ACoS geral de ${a.totalAcos.toFixed(1)}% — perfeito! Pode escalar as campanhas com segurança 🎯`})
    else if(a.totalAcos>=5&&a.totalAcos<10)ins.push({type:'a',text:`ACoS geral de ${a.totalAcos.toFixed(1)}% — aceitável, mas tente reduzir para abaixo de 5% para escalar`})
    else if(a.totalAcos>=10)ins.push({type:'r',text:`ACoS geral de ${a.totalAcos.toFixed(1)}% está alto — com margem de 20% da Amazon, ads acima de 10% eliminam o lucro. Revise lances ⚠️`})
    const noSales=a.campaigns.filter(c=>c.status.toUpperCase()==='ENABLED'&&c.sales===0&&c.spend>5)
    if(noSales.length>0)ins.push({type:'r',text:`${noSales.length} campanha(s) ativa(s) sem vendas gastando R$ ${fmtR(noSales.reduce((s,c)=>s+c.spend,0))} — pause ou corrija o targeting`})
    const best=a.campaigns.filter(c=>c.sales>0).sort((a,b)=>a.acos-b.acos)[0]
    if(best)ins.push({type:'g',text:`"${best.name}" é sua campeã: ACoS ${best.acos.toFixed(1)}%, ROAS ${best.roas.toFixed(2)}x — invista mais nela`})
  }
  if(s&&a&&cmv>0){
    const receita=s.revenue
    const liqMkt=receita*(1-(cfg.amazonFee+cfg.fbaFee)/100)
    const lucroBruto=liqMkt-cmv
    const lucroPos=lucroBruto-a.totalSpend
    const mpaVal=receita>0?(lucroPos/receita)*100:0
    const tacosVal=receita>0?(a.totalSpend/receita)*100:0
    const roiVal=cmv>0?(lucroBruto/cmv)*100:0
    if(mpaVal>20)ins.push({type:'g',text:`MPA de ${mpaVal.toFixed(1)}% — Margem Pós Ads excelente! Negócio muito saudável 💰`})
    else if(mpaVal>10)ins.push({type:'a',text:`MPA de ${mpaVal.toFixed(1)}% — razoável. Tente reduzir TACOS ou CMV para melhorar`})
    else if(mpaVal>0)ins.push({type:'r',text:`MPA de ${mpaVal.toFixed(1)}% está apertado — ads ou CMV muito altos para a margem atual`})
    else ins.push({type:'r',text:`MPA negativo (${mpaVal.toFixed(1)}%) — ads + custos superam a receita líquida neste período ⚠️`})
    if(tacosVal>0&&tacosVal<10)ins.push({type:'g',text:`TACOS de ${tacosVal.toFixed(1)}% está ótimo — ads eficientes em relação ao faturamento total 🎯`})
    else if(tacosVal>=10&&tacosVal<20)ins.push({type:'a',text:`TACOS de ${tacosVal.toFixed(1)}% — aceitável. Benchmark ideal é abaixo de 10% do faturamento`})
    else if(tacosVal>=20)ins.push({type:'r',text:`TACOS de ${tacosVal.toFixed(1)}% está alto — ads estão consumindo mais de 20% do faturamento total`})
    if(roiVal>200)ins.push({type:'g',text:`ROI de ${roiVal.toFixed(0)}% — retorno excepcional sobre o investimento em mercadoria 🚀`})
    else if(roiVal>100)ins.push({type:'g',text:`ROI de ${roiVal.toFixed(0)}% — boa rentabilidade sobre o CMV investido ✅`})
  }
  return ins
}

/* ── Upload Zone ─────────────────────────────────────────────────────────── */
function UploadZone({label,hint,icon,loaded,onFile}:{label:string;hint:string;icon:string;loaded:boolean;onFile:(t:string)=>void}){
  const [drag,setDrag]=useState(false)
  const inp=useRef<HTMLInputElement>(null)
  const read=(f:File)=>{const r=new FileReader();r.onload=e=>onFile(e.target?.result as string||'');r.readAsText(f,'utf-8')}
  const onDrop=useCallback((e:React.DragEvent)=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)read(f)},[])
  return(
    <div onClick={()=>inp.current?.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={onDrop}
      style={{
        background:loaded?'rgba(34,197,94,0.06)':drag?'rgba(240,180,41,0.06)':C.card,
        border:`1.5px dashed ${loaded?C.g:drag?C.gold:C.line}`,
        borderRadius:14,padding:'22px 20px',cursor:'pointer',transition:'all .2s',
        display:'flex',flexDirection:'column' as const,alignItems:'center',gap:8,textAlign:'center' as const,
      }}>
      <input ref={inp} type="file" accept=".csv,.txt" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)read(f)}}/>
      <div style={{fontSize:28}}>{loaded?'✅':icon}</div>
      <div style={{fontSize:12,fontWeight:700,color:loaded?C.g:C.t1}}>{loaded?'Arquivo carregado!':label}</div>
      <div style={{fontSize:10,color:C.t3,lineHeight:1.5}}>{hint}</div>
      {!loaded&&<div style={{fontSize:9,color:C.t3,marginTop:2,padding:'4px 10px',background:'rgba(255,255,255,0.04)',borderRadius:20}}>Arraste ou clique para selecionar</div>}
    </div>
  )
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KPICard({icon,label,value,sub,color,tip}:{icon:string;label:string;value:string;sub?:string;color:string;tip:string}){
  const [hover,setHover]=useState(false)
  return(
    <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:'18px 20px',position:'relative' as const,flex:'1 1 160px'}}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:18}}>{icon}</span>
        <span style={{fontSize:9,fontWeight:700,color:C.t3,letterSpacing:'0.12em',textTransform:'uppercase' as const,flex:1}}>{label}</span>
        <span style={{fontSize:10,color:C.t3,cursor:'help'}}>ℹ️</span>
      </div>
      <div style={{fontSize:22,fontWeight:900,color,letterSpacing:'-0.03em',marginBottom:4}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:C.t3}}>{sub}</div>}
      {hover&&<div style={{
        position:'absolute' as const,bottom:'calc(100% + 8px)',left:0,zIndex:50,
        background:C.modal,border:`1px solid ${C.line}`,borderRadius:10,
        padding:'10px 14px',fontSize:11,color:C.t2,lineHeight:1.6,
        width:220,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',pointerEvents:'none' as const,
      }}>{tip}</div>}
    </div>
  )
}

/* ── DRE Row ─────────────────────────────────────────────────────────────── */
function DRERow({icon,label,value,pctVal,color,bold,indent,tip,separator}:{
  icon:string;label:string;value:number;pctVal?:number;color:string;bold?:boolean;indent?:boolean;tip:string;separator?:boolean
}){
  const [hover,setHover]=useState(false)
  return(
    <>
      {separator&&<div style={{height:1,background:C.line,margin:'4px 0'}}/>}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:8,
        background:bold?'rgba(255,255,255,0.03)':'transparent',
        marginLeft:indent?12:0,position:'relative' as const,cursor:'default'}}
        onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
        <span style={{fontSize:14,width:20,textAlign:'center' as const}}>{icon}</span>
        <span style={{flex:1,fontSize:bold?13:12,fontWeight:bold?700:400,color:bold?C.t1:C.t4}}>{label}</span>
        {pctVal!==undefined&&<span style={{fontSize:10,color:C.t3,minWidth:40,textAlign:'right' as const}}>{pctVal.toFixed(1)}%</span>}
        <span style={{fontSize:bold?15:13,fontWeight:bold?800:500,color,minWidth:110,textAlign:'right' as const}}>
          {value<0?'-':''} R$ {fmtR(Math.abs(value))}
        </span>
        <span style={{fontSize:10,color:C.t3,cursor:'help',width:14}}>ℹ</span>
        {hover&&<div style={{
          position:'absolute' as const,right:0,bottom:'calc(100% + 6px)',zIndex:50,
          background:C.modal,border:`1px solid ${C.line}`,borderRadius:10,
          padding:'10px 14px',fontSize:11,color:C.t2,lineHeight:1.6,
          width:260,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',pointerEvents:'none' as const,
        }}>{tip}</div>}
      </div>
    </>
  )
}

/* ── Custom Recharts Tooltip ─────────────────────────────────────────────── */
function ChartTooltip({active,payload,label}:any){
  if(!active||!payload?.length)return null
  return(
    <div style={{background:C.modal,border:`1px solid ${C.line}`,borderRadius:10,padding:'10px 14px',fontSize:11}}>
      <div style={{color:C.t3,marginBottom:6}}>Dia {label}</div>
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{color:p.color,marginBottom:2}}>
          {p.name}: <strong>R$ {fmtR(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

/* ── ACoS Badge ──────────────────────────────────────────────────────────── */
function AcosBadge({v}:{v:number}){
  const color=v===0?C.t3:v<20?C.g:v<30?C.a:C.r
  const label=v===0?'Sem vendas':v<20?'Ótimo':v<30?'Bom':v<40?'Atenção':'Alto'
  return(
    <span style={{fontSize:10,fontWeight:700,color,padding:'3px 8px',background:`${color}15`,borderRadius:20}}>
      {v===0?'—':`${v.toFixed(1)}%`} {label}
    </span>
  )
}

/* ── Inline editable cell ────────────────────────────────────────────────── */
function InlineInput({value,onChange,placeholder,width,prefix}:{value:number;onChange:(v:number)=>void;placeholder?:string;width?:number;prefix?:string}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:3}}>
      {prefix&&<span style={{fontSize:10,color:C.t3}}>{prefix}</span>}
      <input
        type="number" min={0} step={1}
        value={value||''}
        placeholder={placeholder||'0'}
        onChange={e=>onChange(parseFloat(e.target.value)||0)}
        onClick={e=>e.stopPropagation()}
        style={{
          width:width||70,background:'rgba(255,255,255,0.04)',
          border:`1px solid rgba(255,255,255,0.1)`,borderRadius:6,
          color:C.t1,fontSize:12,fontWeight:600,padding:'5px 8px',
          fontFamily:'inherit',outline:'none',textAlign:'right' as const,
        }}/>
    </div>
  )
}

/* ── How To Download ─────────────────────────────────────────────────────── */
function HowTo(){
  return(
    <div style={{background:'rgba(240,180,41,0.04)',border:`1px solid rgba(240,180,41,0.15)`,borderRadius:14,padding:'20px 24px',marginTop:24}}>
      <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:'0.1em',marginBottom:14}}>📥 COMO BAIXAR CADA RELATÓRIO NO SELLER CENTRAL</div>
      {[
        {icon:'📊',label:'Painel de Vendas (CSV)',steps:['Acesse Seller Central → Relatórios → Painel de Vendas','Selecione o período desejado','Clique em "Baixar" → Escolha CSV']},
        {icon:'📢',label:'Relatório de Campanhas (CSV)',steps:['Acesse Seller Central → Publicidade → Gerenciador de Campanhas','Clique em "Relatórios de Medição"','Crie relatório de Campanha → Baixe o CSV']},
      ].map((item,i)=>(
        <div key={i} style={{marginBottom:i<1?16:0}}>
          <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:8}}>{item.icon} {item.label}</div>
          {item.steps.map((s,j)=>(
            <div key={j} style={{display:'flex',gap:8,marginBottom:4}}>
              <span style={{width:16,height:16,borderRadius:'50%',background:'rgba(240,180,41,0.1)',border:'1px solid rgba(240,180,41,0.25)',color:C.gold,fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{j+1}</span>
              <span style={{fontSize:11,color:C.t3}}>{s}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Persistence helpers ─────────────────────────────────────────────────── */
// Chave no metadata do usuário (banco) e no localStorage (fallback offline)
const META_KEY = 'financeiro_v1'

type SavedMeta = {
  costs:  Record<string,{unitCost:number;extraPerUnit:number}>
  expenses: Expense[]
  cfg: DRECfg
}

function costsMap(products:ProductCost[]): Record<string,{unitCost:number;extraPerUnit:number}> {
  const map:Record<string,{unitCost:number;extraPerUnit:number}>={}
  products.forEach(p=>{ if(p.name) map[p.name.trim().toLowerCase()]={unitCost:p.unitCost,extraPerUnit:p.extraPerUnit} })
  return map
}

// localStorage como cache local rápido (fallback se API falhar)
const LS_KEY = 'oraculo_fin_meta_v1'
function lsLoad(): SavedMeta|null {
  try{ return JSON.parse(localStorage.getItem(LS_KEY)||'null') }catch{ return null }
}
function lsSave(m:SavedMeta){ try{ localStorage.setItem(LS_KEY,JSON.stringify(m)) }catch{} }

// API do banco — sem await bloqueante nos effects
async function apiLoad(): Promise<SavedMeta|null> {
  try{
    const r=await fetch(`/api/user/metadata?key=${META_KEY}`)
    if(!r.ok)return null
    const {value}=await r.json()
    return value as SavedMeta|null
  }catch{ return null }
}
async function apiSave(m:SavedMeta): Promise<void> {
  try{ await fetch('/api/user/metadata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:META_KEY,value:m})}) }catch{}
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function FinanceiroPanel({promoActive=false,promoType=null}:{promoActive?:boolean;promoType?:'comissao'|'fba'|'ambas'|null}){
  const [mounted,    setMounted]    = useState(false)
  const [salesData,  setSalesData]  = useState<SalesData|null>(null)
  const [adsData,    setAdsData]    = useState<AdsData|null>(null)
  const [showHowTo,  setShowHowTo]  = useState(false)
  const [dreOpen,    setDreOpen]    = useState(true)
  const [costOpen,   setCostOpen]   = useState(true)
  const [cfg,        setCfg]        = useState<DRECfg>({amazonFee:15,fbaFee:12})
  const [products,   setProducts]   = useState<ProductCost[]>([])
  const [expenses,   setExpenses]   = useState<Expense[]>([])
  const [savedCount,   setSavedCount]   = useState(0)
  const [restoredMsg,  setRestoredMsg]  = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)

  /* ── Load from DB (ou localStorage como fallback) ao montar ───────────── */
  useEffect(()=>{
    setMounted(true)
    ;(async()=>{
      // Tenta banco primeiro; fallback localStorage
      let meta = await apiLoad()
      if(!meta) meta = lsLoad()
      if(!meta) return
      if(meta.cfg) setCfg(prev=>({...prev,...meta.cfg}))
      if(meta.expenses?.length) setExpenses(meta.expenses)
      // Guarda os custos de produtos para usar quando ads carregar
      if(meta.costs && Object.keys(meta.costs).length)
        (window as any).__oraculo_saved_costs = meta.costs
    })()
  },[])

  /* ── Debounced save (banco + localStorage) sempre que dados mudarem ─────── */
  const persistAll = useCallback((p:ProductCost[], e:Expense[], c:DRECfg)=>{
    if(saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(()=>{
      const meta:SavedMeta={costs:costsMap(p),expenses:e,cfg:c}
      lsSave(meta)
      apiSave(meta)
      setSavedCount(x=>x+1)
    }, 1500)  // salva 1.5s após parar de digitar
  },[])

  useEffect(()=>{ if(mounted) persistAll(products,expenses,cfg) },[products,expenses,cfg,mounted])

  /* ── Auto-populate products das campanhas quando ads carrega ───────────── */
  useEffect(()=>{
    if(!adsData||products.length>0)return
    const saved:Record<string,{unitCost:number;extraPerUnit:number}> =
      (window as any).__oraculo_saved_costs ?? {}
    const fromCampaigns = adsData.campaigns
      .filter(c=>c.spend>0||c.orders>0)
      .map(c=>{
        const key=c.name.trim().toLowerCase()
        const prev=saved[key]
        return{ id:uid(), name:c.name, units:c.orders,
          unitCost:prev?.unitCost??0, extraPerUnit:prev?.extraPerUnit??0 }
      })
    if(fromCampaigns.length>0){
      setProducts(fromCampaigns)
      const restored=fromCampaigns.filter(p=>p.unitCost>0).length
      if(restored>0){
        setSavedCount(restored+1)
        setRestoredMsg(`✅ ${restored} produto${restored>1?'s':''} com custo restaurado${restored>1?'s':''} do seu histórico`)
        setTimeout(()=>setRestoredMsg(''),6000)
      }
    }
  },[adsData])

  const hasData = salesData||adsData

  /* ── Cost calculations ─────────────────────────────────────────────────── */
  const autoCmv       = products.reduce((s,p)=>s+p.units*(p.unitCost+p.extraPerUnit),0)
  const autoDespesas  = expenses.reduce((s,e)=>s+e.value,0)
  const hasCosts      = products.length>0
  const cmv           = hasCosts ? autoCmv : 0
  const otherCosts    = autoDespesas

  /* ── Promo fee overrides ───────────────────────────────────────────────── */
  const effectiveAmazonFee = promoActive&&(promoType==='comissao'||promoType==='ambas') ? 0 : cfg.amazonFee
  const effectiveFbaFee    = promoActive&&(promoType==='fba'||promoType==='ambas')      ? 0 : cfg.fbaFee

  /* ── DRE calculations ──────────────────────────────────────────────────── */
  const receita          = salesData?.revenue ?? 0
  const comissao         = receita*(effectiveAmazonFee/100)
  const fba              = receita*(effectiveFbaFee/100)
  const ads              = adsData?.totalSpend ?? 0
  const liqMarketplace   = receita - comissao - fba
  const lucroBrutoSemAds = liqMarketplace - cmv
  const lucroBruto       = lucroBrutoSemAds - ads
  const lucroLiquido     = lucroBruto - otherCosts
  const margem           = receita>0 ? (lucroBrutoSemAds/receita)*100 : 0
  const mpa              = receita>0 ? (lucroBruto/receita)*100 : 0
  const tacos            = receita>0 ? (ads/receita)*100 : 0
  const roi              = cmv>0  ? (lucroBrutoSemAds/cmv)*100 : 0
  const lucroColor       = lucroLiquido>0 ? C.g : C.r
  const cmvFilled        = hasCosts && autoCmv>0

  /* ── Chart data ────────────────────────────────────────────────────────── */
  const dailyChart = (salesData?.daily??[]).filter(d=>d.atual>0||d.anterior>0)

  const donutData = receita>0 ? [
    {name:'Comissão Amazon',value:comissao,color:C.pur},
    {name:'Taxa FBA',value:fba,color:C.blue},
    {name:'Publicidade',value:ads,color:C.a},
    {name:'CMV',value:cmv,color:C.r},
    {name:'Lucro Líquido',value:Math.max(0,lucroLiquido),color:C.g},
  ].filter(d=>d.value>0) : []

  const campaignChart = (adsData?.campaigns??[])
    .filter(c=>c.spend>0)
    .sort((a,b)=>a.acos-b.acos)
    .map(c=>({
      name: c.name.length>18?c.name.slice(0,18)+'…':c.name,
      acos: c.acos, spend: c.spend, sales: c.sales,
      color: c.acos===0?C.t3:c.acos<20?C.g:c.acos<30?C.a:C.r,
    }))

  const insights = calcInsights(salesData,adsData,{amazonFee:effectiveAmazonFee,fbaFee:effectiveFbaFee},cmv,otherCosts)

  const lastM   = salesData?.lastMonthRevenue??0
  const lastY   = salesData?.lastYearRevenue??0
  const compMax = Math.max(receita,lastM,lastY)||1

  /* ── Product helpers ───────────────────────────────────────────────────── */
  const updateProduct=(id:string,field:keyof ProductCost,val:any)=>
    setProducts(ps=>ps.map(p=>p.id===id?{...p,[field]:val}:p))
  const removeProduct=(id:string)=>setProducts(ps=>ps.filter(p=>p.id!==id))
  const addProduct=()=>setProducts(ps=>[...ps,{id:uid(),name:'Novo produto',units:0,unitCost:0,extraPerUnit:0}])

  const updateExpense=(id:string,field:keyof Expense,val:any)=>
    setExpenses(es=>es.map(e=>e.id===id?{...e,[field]:val}:e))
  const removeExpense=(id:string)=>setExpenses(es=>es.filter(e=>e.id!==id))
  const addExpense=()=>setExpenses(es=>[...es,{id:uid(),label:'',value:0}])

  /* ── styles helpers ────────────────────────────────────────────────────── */
  const inputStyle=(w?:number)=>({
    width:w||80,background:'rgba(255,255,255,0.04)',
    border:`1px solid rgba(255,255,255,0.1)`,borderRadius:6,
    color:C.t1,fontSize:12,fontWeight:600,padding:'5px 8px',
    fontFamily:'inherit',outline:'none',
  })

  return(
    <div style={{maxWidth:960,margin:'0 auto',paddingBottom:60}}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
            <h2 style={{fontSize:22,fontWeight:900,color:C.t1,letterSpacing:'-0.03em'}}>💰 Painel Financeiro</h2>
            {promoActive&&(
              <span style={{fontSize:10,fontWeight:700,color:C.g,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:99,padding:'3px 10px',letterSpacing:'0.06em'}}>
                🎁 {promoType==='comissao'?'Comissão zerada':promoType==='fba'?'FBA zerado':'Comissão + FBA zerados'}
              </span>
            )}
          </div>
          <p style={{fontSize:12,color:C.t3}}>Carregue seus relatórios Amazon e veja seu DRE em segundos</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {hasData&&<button onClick={()=>{setSalesData(null);setAdsData(null);setProducts([]);setExpenses([])}}
            style={{background:'transparent',border:`1px solid ${C.line}`,color:C.t3,fontSize:11,padding:'8px 14px',borderRadius:8,cursor:'pointer',fontFamily:'inherit'}}>
            ↩ Novo período
          </button>}
          <button onClick={()=>setShowHowTo(v=>!v)}
            style={{background:'transparent',border:`1px solid rgba(240,180,41,0.3)`,color:C.gold,fontSize:11,padding:'8px 14px',borderRadius:8,cursor:'pointer',fontFamily:'inherit'}}>
            {showHowTo?'Fechar guia':'📥 Como baixar relatórios'}
          </button>
        </div>
      </div>

      {showHowTo&&<HowTo/>}

      {/* ── Upload area ─────────────────────────────────────────────────── */}
      {!hasData&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
            <UploadZone label="Painel de Vendas" icon="📊"
              hint="Relatórios → Painel de Vendas → Baixar CSV"
              loaded={!!salesData} onFile={t=>setSalesData(parseSales(t))}/>
            <UploadZone label="Relatório de Campanhas" icon="📢"
              hint="Publicidade → Relatórios → Sponsored Products CSV"
              loaded={!!adsData} onFile={t=>setAdsData(parseAds(t))}/>
          </div>
          <div style={{textAlign:'center' as const,padding:'24px',background:C.card,borderRadius:14,border:`1px solid ${C.line}`}}>
            <div style={{fontSize:28,marginBottom:8}}>📂</div>
            <div style={{fontSize:13,color:C.t3}}>Carregue ao menos 1 relatório para ver seu painel financeiro</div>
            <div style={{fontSize:11,color:C.t3,marginTop:4}}>Todos os dados ficam só no seu navegador — nenhum dado é enviado a servidores</div>
          </div>
        </div>
      )}

      {/* ── Upload (mini, após dados carregados) ────────────────────────── */}
      {hasData&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <UploadZone label="Painel de Vendas" icon="📊"
            hint="Clique para trocar o arquivo"
            loaded={!!salesData} onFile={t=>setSalesData(parseSales(t))}/>
          <UploadZone label="Relatório de Campanhas" icon="📢"
            hint="Clique para trocar o arquivo"
            loaded={!!adsData} onFile={t=>setAdsData(parseAds(t))}/>
        </div>
      )}

      {/* ═══════════════ DASHBOARD (após upload) ═══════════════════════ */}
      {hasData&&(<>

        {/* ── Toast restauração ────────────────────────────────────────── */}
        {restoredMsg&&(
          <div style={{
            background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.25)',
            borderRadius:10,padding:'10px 16px',marginBottom:12,
            fontSize:12,fontWeight:600,color:C.g,
            display:'flex',alignItems:'center',gap:8,
          }}>
            {restoredMsg} — custos salvos da última sessão foram aplicados
          </div>
        )}

        {/* ═══ BLOCO DE CUSTOS ════════════════════════════════════════════ */}
        <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,marginBottom:20,overflow:'hidden'}}>

          {/* Header accordion */}
          <div onClick={()=>setCostOpen(v=>!v)} style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'18px 24px',cursor:'pointer',
            borderBottom:costOpen?`1px solid ${C.line}`:'none',
          }}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.12em',marginBottom:2}}>
                💼 PRODUTOS & CUSTOS — CMV automático por produto
              </div>
              <div style={{fontSize:12,color:C.t4}}>
                {cmvFilled
                  ? `CMV calculado: R$ ${fmtR(autoCmv)} · Despesas: R$ ${fmtR(autoDespesas)} · Total: R$ ${fmtR(autoCmv+autoDespesas)}`
                  : 'Informe o custo por produto para calcular lucro, margem e ROI automaticamente'}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {cmvFilled&&(
                <span style={{fontSize:11,fontWeight:700,color:C.g,padding:'4px 10px',background:'rgba(34,197,94,0.08)',borderRadius:20}}>
                  ✅ CMV preenchido
                </span>
              )}
              {!cmvFilled&&(
                <span style={{fontSize:11,fontWeight:700,color:C.gold,padding:'4px 10px',background:'rgba(240,180,41,0.08)',borderRadius:20}}>
                  💡 Preencha os custos
                </span>
              )}
              {savedCount>1&&(
                <span style={{fontSize:10,color:C.t3,padding:'4px 10px',background:'rgba(255,255,255,0.03)',borderRadius:20}}>
                  💾 Salvo automaticamente
                </span>
              )}
              <span style={{color:C.t3,fontSize:14,transition:'transform .2s',transform:costOpen?'rotate(180deg)':'none'}}>▾</span>
            </div>
          </div>

          {costOpen&&(
            <div>
              {/* ─── Taxa Amazon + FBA ──────────────────────────────────── */}
              <div style={{padding:'14px 24px',background:'rgba(255,255,255,0.01)',borderBottom:`1px solid ${C.line}`,display:'flex',alignItems:'center',gap:20,flexWrap:'wrap' as const}}>
                <span style={{fontSize:11,color:C.t3,fontWeight:600}}>⚙️ Taxas Amazon</span>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11}}>
                  <span style={{color:C.t3}}>Comissão:</span>
                  <input type="number" min={0} max={30} step={0.5} value={cfg.amazonFee}
                    onChange={e=>setCfg(p=>({...p,amazonFee:parseFloat(e.target.value)||0}))}
                    style={{...inputStyle(46)}}/>
                  <span style={{color:C.t3}}>%</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11}}>
                  <span style={{color:C.t3}}>FBA:</span>
                  <input type="number" min={0} max={30} step={0.5} value={cfg.fbaFee}
                    onChange={e=>setCfg(p=>({...p,fbaFee:parseFloat(e.target.value)||0}))}
                    style={{...inputStyle(46)}}/>
                  <span style={{color:C.t3}}>%</span>
                </div>
                <span style={{fontSize:10,color:C.t3,marginLeft:'auto'}}>
                  Líq. Marketplace: R$ {fmtR(liqMarketplace)} ({receita>0?(liqMarketplace/receita*100).toFixed(1):0}% do faturamento)
                </span>
              </div>

              {/* ─── Tabela de produtos ─────────────────────────────────── */}
              <div style={{padding:'18px 24px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.1em',marginBottom:2}}>
                      📦 PRODUTOS — Custo × Unidades = CMV do produto
                    </div>
                    {adsData&&products.length>0&&(
                      <div style={{fontSize:10,color:C.t3}}>
                        Unidades pré-preenchidas com pedidos atribuídos às campanhas — ajuste se necessário
                        {products.some(p=>p.unitCost>0)&&
                          <span style={{color:C.g,marginLeft:8}}>· 💾 custos salvos carregados</span>}
                      </div>
                    )}
                  </div>
                  <button onClick={addProduct}
                    style={{background:'rgba(240,180,41,0.08)',border:'1px solid rgba(240,180,41,0.25)',
                      color:C.gold,fontSize:11,fontWeight:700,padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>
                    + Adicionar produto
                  </button>
                </div>

                {products.length===0&&(
                  <div style={{textAlign:'center' as const,padding:'24px',background:'rgba(255,255,255,0.02)',borderRadius:10,border:`1px dashed ${C.line}`}}>
                    <div style={{fontSize:22,marginBottom:6}}>📦</div>
                    <div style={{fontSize:12,color:C.t3}}>
                      {adsData
                        ? 'Nenhum produto detectado nas campanhas. Clique em "+ Adicionar produto" para inserir manualmente.'
                        : 'Carregue o relatório de campanhas para preencher os produtos automaticamente, ou adicione manualmente.'}
                    </div>
                  </div>
                )}

                {products.length>0&&(
                  <div style={{overflowX:'auto' as const}}>
                    <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:11}}>
                      <thead>
                        <tr style={{borderBottom:`1px solid ${C.line}`}}>
                          {['Produto','Unidades vendidas','Custo Unit. (R$)','Custo Adicional/Un (R$)','CMV do Produto',''].map((h,i)=>(
                            <th key={i} style={{
                              textAlign:i===0?'left' as const:'right' as const,
                              padding:'8px 10px',fontSize:9,fontWeight:700,color:C.t3,
                              letterSpacing:'0.08em',whiteSpace:'nowrap' as const,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p,i)=>{
                          const prodCmv=p.units*(p.unitCost+p.extraPerUnit)
                          return(
                            <tr key={p.id} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`}}>
                              {/* Nome */}
                              <td style={{padding:'8px 10px'}}>
                                <input value={p.name}
                                  onChange={e=>updateProduct(p.id,'name',e.target.value)}
                                  style={{...inputStyle(140),textAlign:'left' as const,fontSize:12}}/>
                              </td>
                              {/* Unidades */}
                              <td style={{padding:'8px 10px',textAlign:'right' as const}}>
                                <InlineInput value={p.units} onChange={v=>updateProduct(p.id,'units',v)} placeholder="0" width={60}/>
                              </td>
                              {/* Custo unitário */}
                              <td style={{padding:'8px 10px',textAlign:'right' as const}}>
                                <InlineInput value={p.unitCost} onChange={v=>updateProduct(p.id,'unitCost',v)} placeholder="ex: 45" width={80} prefix="R$"/>
                              </td>
                              {/* Custo adicional por unidade */}
                              <td style={{padding:'8px 10px',textAlign:'right' as const}}>
                                <div style={{display:'flex',flexDirection:'column' as const,alignItems:'flex-end',gap:2}}>
                                  <InlineInput value={p.extraPerUnit} onChange={v=>updateProduct(p.id,'extraPerUnit',v)} placeholder="ex: 8" width={80} prefix="R$"/>
                                  <span style={{fontSize:9,color:C.t3}}>frete, impostos…</span>
                                </div>
                              </td>
                              {/* CMV do produto */}
                              <td style={{padding:'8px 10px',textAlign:'right' as const}}>
                                <span style={{fontSize:13,fontWeight:700,color:prodCmv>0?C.t1:C.t3}}>
                                  {prodCmv>0?`R$ ${fmtR(prodCmv)}`:'—'}
                                </span>
                                {prodCmv>0&&<div style={{fontSize:9,color:C.t3}}>{p.units}un × R$ {fmtR(p.unitCost+p.extraPerUnit)}</div>}
                              </td>
                              {/* Remove */}
                              <td style={{padding:'8px 6px',textAlign:'center' as const}}>
                                <button onClick={()=>removeProduct(p.id)}
                                  style={{background:'transparent',border:'none',color:C.t3,cursor:'pointer',fontSize:14,padding:'2px 6px',
                                    borderRadius:4,fontFamily:'inherit'}}
                                  title="Remover produto">✕</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {/* Total CMV dos produtos */}
                      {autoCmv>0&&(
                        <tfoot>
                          <tr style={{borderTop:`1px solid ${C.line}`}}>
                            <td colSpan={4} style={{padding:'10px 10px',fontSize:11,fontWeight:700,color:C.t3,textAlign:'right' as const}}>
                              CMV Total dos Produtos
                            </td>
                            <td style={{padding:'10px 10px',textAlign:'right' as const}}>
                              <span style={{fontSize:14,fontWeight:900,color:C.gold}}>R$ {fmtR(autoCmv)}</span>
                            </td>
                            <td/>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>

              {/* ─── Despesas ──────────────────────────────────────────── */}
              <div style={{padding:'16px 24px',borderTop:`1px solid ${C.line}`,background:'rgba(255,255,255,0.01)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.1em',marginBottom:2}}>
                      💸 DESPESAS — Custos operacionais do período
                    </div>
                    <div style={{fontSize:10,color:C.t3}}>
                      Ex: contador, ferramentas, devoluções, frete de retorno, banco...
                    </div>
                  </div>
                  <button onClick={addExpense}
                    style={{background:'rgba(139,120,255,0.08)',border:'1px solid rgba(139,120,255,0.25)',
                      color:C.pur,fontSize:11,fontWeight:700,padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap' as const}}>
                    + Adicionar despesa
                  </button>
                </div>

                {expenses.length===0&&(
                  <div style={{fontSize:11,color:C.t3,padding:'10px 0'}}>
                    Nenhuma despesa cadastrada. Clique em "+ Adicionar despesa" para incluir.
                  </div>
                )}

                {expenses.length>0&&(
                  <div style={{display:'flex',flexDirection:'column' as const,gap:8}}>
                    {expenses.map((e)=>(
                      <div key={e.id} style={{display:'flex',alignItems:'center',gap:10}}>
                        <input
                          value={e.label}
                          onChange={ev=>updateExpense(e.id,'label',ev.target.value)}
                          placeholder="Nome da despesa (ex: Contador)"
                          style={{...inputStyle(200),textAlign:'left' as const,flex:1,maxWidth:280}}/>
                        <span style={{fontSize:11,color:C.t3}}>R$</span>
                        <input
                          type="number" min={0} step={10}
                          value={e.value||''}
                          placeholder="0,00"
                          onChange={ev=>updateExpense(e.id,'value',parseFloat(ev.target.value)||0)}
                          style={{...inputStyle(110)}}/>
                        <button onClick={()=>removeExpense(e.id)}
                          style={{background:'transparent',border:'none',color:C.t3,cursor:'pointer',fontSize:14,padding:'2px 8px',
                            borderRadius:4,fontFamily:'inherit'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total despesas */}
                {autoDespesas>0&&(
                  <div style={{display:'flex',justifyContent:'flex-end',marginTop:12,paddingTop:10,borderTop:`1px solid ${C.line}`}}>
                    <span style={{fontSize:11,fontWeight:700,color:C.t3,marginRight:12}}>Total Despesas</span>
                    <span style={{fontSize:14,fontWeight:900,color:C.pur}}>R$ {fmtR(autoDespesas)}</span>
                  </div>
                )}
              </div>

              {/* ─── Resumo total ──────────────────────────────────────── */}
              {(autoCmv>0||autoDespesas>0)&&(
                <div style={{
                  display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' as const,
                  padding:'14px 24px',
                  background:'rgba(240,180,41,0.04)',
                  borderTop:`1px solid rgba(240,180,41,0.15)`,
                }}>
                  <span style={{fontSize:11,fontWeight:700,color:C.gold}}>📊 Custos totais do período:</span>
                  {autoCmv>0&&<span style={{fontSize:12,color:C.t3}}>CMV <strong style={{color:C.t1}}>R$ {fmtR(autoCmv)}</strong></span>}
                  {autoCmv>0&&autoDespesas>0&&<span style={{color:C.t3}}>+</span>}
                  {autoDespesas>0&&<span style={{fontSize:12,color:C.t3}}>Despesas <strong style={{color:C.t1}}>R$ {fmtR(autoDespesas)}</strong></span>}
                  <span style={{fontSize:13,fontWeight:900,color:C.gold,marginLeft:'auto'}}>
                    Total = R$ {fmtR(autoCmv+autoDespesas)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* KPI Cards — 3 linhas x 4 colunas */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
          <KPICard icon="💰" label="Faturamento" value={salesData?`R$ ${fmtK(receita)}`:'—'}
            sub={salesData?.period??'Carregue o relatório de vendas'} color={C.gold}
            tip="Total de vendas no período antes de qualquer desconto ou taxa. Topo do DRE."/>
          <KPICard icon="🏦" label="Líq. Marketplace" value={salesData?`R$ ${fmtK(liqMarketplace)}`:'—'}
            sub={salesData?(promoActive?`🎁 ${(liqMarketplace/receita*100).toFixed(1)}% — c/ promoção`:`${(liqMarketplace/receita*100).toFixed(1)}% do faturamento`):'—'}
            color={C.blue}
            tip={promoActive?"🎁 Calculado com tarifas zeradas pela promoção Amazon.":"Faturamento menos comissão Amazon e FBA. O que a Amazon deposita antes de subtrair CMV e ads."}/>
          <KPICard icon="📊" label="Lucro Bruto" value={salesData?(cmvFilled?`R$ ${fmtK(lucroBrutoSemAds)}`:'preencha custos ↑'):'—'}
            sub={salesData&&cmvFilled?`Margem ${margem.toFixed(1)}%`:'Líq. Marketplace − CMV'}
            color={cmvFilled?(lucroBrutoSemAds>0?C.g:C.r):C.t3}
            tip="Líq. Marketplace menos o CMV. Mostra a lucratividade antes dos gastos com publicidade."/>
          <KPICard icon="📈" label="Margem" value={salesData&&cmvFilled?`${margem.toFixed(2)}%`:'—'}
            sub={salesData&&cmvFilled?(margem>30?'Excelente ✅':margem>20?'Boa 🟡':'Atenção 🔴'):'Informe os custos'}
            color={cmvFilled?(margem>30?C.g:margem>20?C.a:C.r):C.t3}
            tip="Lucro Bruto ÷ Faturamento. Acima de 30% é excelente para Amazon FBA."/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
          <KPICard icon="🛒" label="Nº de Vendas" value={salesData?String(salesData.orders):'—'}
            sub={salesData?`${salesData.period}`:'—'} color={C.pur}
            tip="Total de pedidos confirmados no período."/>
          <KPICard icon="📦" label="Nº de Unidades" value={salesData?String(salesData.units):'—'}
            sub={salesData?`em ${salesData.orders} pedidos`:'—'} color={C.pur}
            tip="Total de itens físicos vendidos. Um pedido pode ter mais de uma unidade."/>
          <KPICard icon="🎫" label="Ticket Médio" value={salesData?`R$ ${fmtR(salesData.avgTicket)}`:'—'}
            sub="por pedido" color={C.pur}
            tip="Faturamento ÷ Número de Pedidos. Aumentar o ticket médio é uma das formas mais eficientes de crescer."/>
          <KPICard icon="💹" label="ROI" value={salesData&&cmvFilled?`${roi.toFixed(2)}%`:'—'}
            sub={cmvFilled?`ROI sobre o CMV`:'Preencha os custos'}
            color={cmvFilled?(roi>150?C.g:roi>80?C.a:C.r):C.t3}
            tip="ROI = (Lucro Bruto ÷ CMV) × 100. Para cada R$100 investido em mercadoria, quanto você lucrou. Acima de 100% é excelente."/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
          <KPICard icon="📢" label="Valor em Ads" value={adsData?`R$ ${fmtR(ads)}`:'—'}
            sub={adsData?`${adsData.campaigns.filter(c=>c.status.toUpperCase()==='ENABLED').length} campanhas ativas`:'Carregue o relatório de ads'}
            color={C.a}
            tip="Total investido em Sponsored Products no período."/>
          <KPICard icon="🎯" label="TACOS" value={adsData&&salesData?`${tacos.toFixed(2)}%`:'—'}
            sub={adsData&&salesData?(tacos<10?'Excelente ✅':tacos<20?'Bom 🟡':'Alto 🔴'):'—'}
            color={adsData&&salesData?(tacos<10?C.g:tacos<20?C.a:C.r):C.t3}
            tip="TACOS = Ads ÷ Faturamento Total. Diferente do ACoS que divide pelas vendas atribuídas. Abaixo de 10% é excelente, acima de 20% os ads estão consumindo toda a margem."/>
          <KPICard icon="✨" label="Lucro Bruto Pós Ads" value={salesData&&cmvFilled?`R$ ${fmtK(lucroBruto)}`:'—'}
            sub={salesData&&cmvFilled?`Lucro Bruto − R$ ${fmtR(ads)} em ads`:'Preencha os custos'}
            color={cmvFilled?(lucroBruto>0?C.g:C.r):C.t3}
            tip="Lucro Bruto menos o total gasto em publicidade. Mostra o lucro real depois de pagar para aparecer na Amazon."/>
          <KPICard icon="🏆" label="MPA" value={salesData&&cmvFilled?`${mpa.toFixed(2)}%`:'—'}
            sub={cmvFilled?(mpa>20?'Excelente ✅':mpa>10?'Razoável 🟡':'Apertado 🔴'):'Margem Pós Ads'}
            color={cmvFilled?(mpa>20?C.g:mpa>10?C.a:C.r):C.t3}
            tip="MPA (Margem Pós Ads) = Lucro Pós Ads ÷ Faturamento. Métrica mais importante do dia a dia."/>
        </div>

        {/* ── Comparativo de receita ────────────────────────────────────── */}
        {salesData&&(lastM>0||lastY>0)&&(
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'20px 24px',marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.12em',marginBottom:16}}>📅 COMPARATIVO DE RECEITA</div>
            {[
              {label:'Este mês (até agora)',v:receita,color:C.gold},
              {label:'Mês passado (total)',v:lastM,color:C.pur},
              {label:'Mesmo mês ano anterior',v:lastY,color:C.t3},
            ].map((row,i)=>(
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:11,color:C.t3}}>{row.label}</span>
                  <span style={{fontSize:12,fontWeight:700,color:row.color}}>R$ {fmtR(row.v)}</span>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.05)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{width:`${(row.v/compMax)*100}%`,height:'100%',background:row.color,borderRadius:4,transition:'width 1s ease'}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Charts row ───────────────────────────────────────────────── */}
        <div style={{display:'grid',gridTemplateColumns:salesData&&adsData?'2fr 1fr':'1fr',gap:16,marginBottom:20}}>

          {salesData&&dailyChart.length>0&&mounted&&(
            <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'20px 24px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.12em'}}>📈 RECEITA DIÁRIA</div>
                <div style={{display:'flex',gap:12}}>
                  {[{c:C.gold,l:'Atual'},{c:C.pur,l:'Mês ant.'},{c:'rgba(104,104,144,0.6)',l:'Ano ant.'}].map((item,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:C.t3}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:item.c}}/>{item.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{fontSize:11,color:C.t3,marginBottom:14}}>Acompanhe o ritmo de vendas dia a dia comparado a períodos anteriores</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyChart} margin={{top:4,right:4,bottom:0,left:0}}>
                  <defs>
                    <linearGradient id="gAtual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.gold} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gAnterior" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.pur} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={C.pur} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="day" tick={{fill:C.t3,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.t3,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} width={30}/>
                  <RTooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="anoPassado" name="Ano ant." stroke="rgba(104,104,144,0.4)" fill="transparent" strokeWidth={1} strokeDasharray="4 4" dot={false}/>
                  <Area type="monotone" dataKey="anterior" name="Mês ant." stroke={C.pur} fill="url(#gAnterior)" strokeWidth={1.5} dot={false}/>
                  <Area type="monotone" dataKey="atual" name="Atual" stroke={C.gold} fill="url(#gAtual)" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {receita>0&&donutData.length>0&&mounted&&(
            <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'20px 24px'}}>
              <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.12em',marginBottom:6}}>🥧 PARA ONDE VAI A RECEITA</div>
              <div style={{fontSize:11,color:C.t3,marginBottom:12}}>Visualize como cada real é distribuído</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                    {donutData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <RTooltip formatter={(v:any,n:any)=>[`R$ ${fmtR(Number(v))}`,n]}
                    contentStyle={{background:C.modal,border:`1px solid ${C.line}`,borderRadius:8,fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexDirection:'column' as const,gap:6,marginTop:4}}>
                {donutData.map((d,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:10}}>
                    <div style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}/>
                    <span style={{flex:1,color:C.t3}}>{d.name}</span>
                    <span style={{color:C.t4,fontWeight:600}}>{(d.value/receita*100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── DRE ─────────────────────────────────────────────────────────── */}
        <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,marginBottom:20,overflow:'hidden'}}>
          <div onClick={()=>setDreOpen(v=>!v)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',cursor:'pointer',borderBottom:dreOpen?`1px solid ${C.line}`:'none'}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.12em',marginBottom:2}}>📋 DRE — DEMONSTRATIVO DO RESULTADO</div>
              <div style={{fontSize:12,color:C.t4}}>Resultado completo do período • passe o mouse sobre cada linha para entender</div>
            </div>
            <span style={{color:C.t3,fontSize:14,transition:'transform .2s',transform:dreOpen?'rotate(180deg)':'none'}}>▾</span>
          </div>

          {dreOpen&&(
            <div style={{padding:'12px 8px'}}>
              {promoActive&&(
                <div style={{display:'flex',alignItems:'center',gap:8,margin:'0 8px 8px',padding:'9px 14px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:10,fontSize:11,color:C.g}}>
                  <span>🎁</span>
                  <span><strong>Promoção ativa:</strong> {promoType==='comissao'?'Comissão zerada':promoType==='fba'?'FBA zerado':'Comissão + FBA zerados'} — tarifas ajustadas no DRE</span>
                </div>
              )}
              {salesData&&<>
                <DRERow icon="💰" label="Receita Bruta (Faturamento)" value={receita} pctVal={100} color={C.gold} bold
                  tip="Total de vendas no período. Topo do DRE."/>
                <DRERow icon="📦" label={effectiveAmazonFee===0?`Comissão Amazon (${cfg.amazonFee}%) 🎁`:`Comissão Amazon (${cfg.amazonFee}%)`} value={-comissao} pctVal={effectiveAmazonFee} color={effectiveAmazonFee===0?C.g:C.r} indent
                  tip={effectiveAmazonFee===0?"🎁 Comissão zerada pela promoção Amazon.":"Comissão por categoria. Use 15% como padrão geral."}/>
                <DRERow icon="🏭" label={effectiveFbaFee===0?`Taxa FBA (${cfg.fbaFee}%) 🎁`:`Taxa FBA (${cfg.fbaFee}%)`} value={-fba} pctVal={effectiveFbaFee} color={effectiveFbaFee===0?C.g:C.r} indent
                  tip={effectiveFbaFee===0?"🎁 Tarifa FBA zerada pela promoção Amazon.":"Custo de fulfillment Amazon. Varia com tamanho e peso do produto."}/>
                <DRERow icon="🏦" label="Líq. Marketplace" value={liqMarketplace} pctVal={receita>0?liqMarketplace/receita*100:0}
                  color={C.blue} bold separator
                  tip="O que a Amazon deposita na sua conta após descontar comissão e FBA."/>
                {cmv>0&&<DRERow icon="🏷️" label={`CMV — ${products.length} produto(s) · ${products.reduce((s,p)=>s+p.units,0)} unidades`} value={-cmv} pctVal={receita>0?cmv/receita*100:0} color={C.r} indent
                  tip="Custo total dos produtos vendidos: soma de (unidades × custo unitário + custo adicional) por produto."/>}
                {cmv>0&&<DRERow icon="📊" label="Lucro Bruto" value={lucroBrutoSemAds} pctVal={receita>0?lucroBrutoSemAds/receita*100:0}
                  color={lucroBrutoSemAds>0?C.g:C.r} bold separator
                  tip="Líq. Marketplace menos CMV. Mostra a lucratividade antes dos gastos com publicidade."/>}
                {adsData&&<DRERow icon="📢" label={`Publicidade (TACOS ${tacos.toFixed(1)}%)`} value={-ads} pctVal={receita>0?ads/receita*100:0} color={C.a} indent
                  tip="Total gasto em campanhas Sponsored Products."/>}
                {cmv>0&&<DRERow icon="✨" label={`Lucro Pós Ads — MPA ${mpa.toFixed(1)}%`} value={lucroBruto} pctVal={receita>0?lucroBruto/receita*100:0}
                  color={lucroBruto>0?C.g:C.r} bold separator
                  tip="Lucro Bruto menos ads. MPA é a rentabilidade real do negócio incluindo custo de aquisição via publicidade."/>}
                {otherCosts>0&&<DRERow icon="⚙️" label={`Despesas Operacionais (${expenses.length} item${expenses.length!==1?'s':''})`} value={-otherCosts} pctVal={receita>0?otherCosts/receita*100:0} color={C.r} indent
                  tip="Contador, ferramentas, devoluções, frete de retorno e outras despesas cadastradas."/>}
                {cmv>0&&<DRERow icon="🏆" label="LUCRO LÍQUIDO" value={lucroLiquido} pctVal={receita>0?lucroLiquido/receita*100:0}
                  color={lucroColor} bold separator
                  tip="O que realmente ficou no bolso depois de pagar todos os custos. Margem acima de 20% é excelente."/>}
                {!cmvFilled&&(
                  <div style={{padding:'16px',textAlign:'center' as const,color:C.t3,fontSize:11,borderTop:`1px solid ${C.line}`,marginTop:8}}>
                    💡 Preencha os produtos no bloco "Produtos & Custos" acima para ver o DRE completo com Lucro e Margem
                  </div>
                )}
              </>}
              {!salesData&&<div style={{padding:'20px',textAlign:'center' as const,color:C.t3,fontSize:12}}>
                Carregue o Painel de Vendas para ver o DRE completo
              </div>}
            </div>
          )}
        </div>

        {/* ── Publicidade ──────────────────────────────────────────────────── */}
        {adsData&&adsData.campaigns.length>0&&(
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,marginBottom:20,overflow:'hidden'}}>
            <div style={{padding:'18px 24px',borderBottom:`1px solid ${C.line}`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.12em',marginBottom:2}}>📢 PERFORMANCE DE PUBLICIDADE</div>
              <div style={{fontSize:12,color:C.t4}}>ACoS ideal: abaixo de 5% (aceitável até 10%) · ROAS ideal: acima de 10x</div>
            </div>
            <div style={{padding:'16px 24px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
                {[
                  {l:'Total Investido',v:`R$ ${fmtR(adsData.totalSpend)}`,c:C.a},
                  {l:'Vendas via Ads',v:`R$ ${fmtR(adsData.totalSales)}`,c:C.g},
                  {l:'ACoS Geral',v:`${adsData.totalAcos.toFixed(1)}%`,c:adsData.totalAcos<5?C.g:adsData.totalAcos<10?C.a:C.r},
                  {l:'ROAS Geral',v:`${adsData.totalRoas.toFixed(2)}x`,c:adsData.totalRoas>4?C.g:adsData.totalRoas>2?C.a:C.r},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.card2,borderRadius:10,padding:'12px 14px',border:`1px solid ${C.line}`}}>
                    <div style={{fontSize:9,color:C.t3,marginBottom:4}}>{s.l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>

              {mounted&&campaignChart.length>0&&(
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.1em',marginBottom:12}}>ACoS POR CAMPANHA — quanto menor, melhor</div>
                  <ResponsiveContainer width="100%" height={Math.max(120,campaignChart.length*44)}>
                    <BarChart data={campaignChart} layout="vertical" margin={{top:0,right:60,bottom:0,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{fill:C.t3,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} domain={[0,'auto']}/>
                      <YAxis type="category" dataKey="name" tick={{fill:C.t4,fontSize:10}} axisLine={false} tickLine={false} width={120}/>
                      <RTooltip formatter={(v:any)=>[`${Number(v).toFixed(1)}%`,'ACoS']}
                        contentStyle={{background:C.modal,border:`1px solid ${C.line}`,borderRadius:8,fontSize:11}}/>
                      <Bar dataKey="acos" radius={[0,6,6,0]}>
                        {campaignChart.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
                        <LabelList dataKey="acos" position="right" formatter={(v:any)=>`${Number(v).toFixed(1)}%`}
                          style={{fill:C.t3,fontSize:10}}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex',gap:16,marginTop:8}}>
                    {[{c:C.g,l:'< 20% Ótimo'},{c:C.a,l:'20-30% Bom'},{c:C.r,l:'> 30% Atenção'},{c:C.t3,l:'Sem vendas'}].map((item,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:C.t3}}>
                        <div style={{width:8,height:8,borderRadius:2,background:item.c}}/>{item.l}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.1em',marginBottom:10}}>DETALHAMENTO POR CAMPANHA</div>
                <div style={{overflowX:'auto' as const}}>
                  <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.line}`}}>
                        {['Campanha','Status','Gasto','Vendas','ACoS','ROAS','Pedidos'].map(h=>(
                          <th key={h} style={{textAlign:'left' as const,padding:'8px 10px',fontSize:9,fontWeight:700,color:C.t3,letterSpacing:'0.1em',whiteSpace:'nowrap' as const}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adsData.campaigns.filter(c=>c.spend>0).sort((a,b)=>a.acos-b.acos||b.sales-a.sales).map((c,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`}}>
                          <td style={{padding:'9px 10px',color:C.t1,fontWeight:500,maxWidth:180}}>{c.name}</td>
                          <td style={{padding:'9px 10px'}}>
                            <span style={{fontSize:9,padding:'3px 7px',borderRadius:20,fontWeight:700,
                              background:c.status.toUpperCase()==='ENABLED'?'rgba(34,197,94,0.1)':'rgba(104,104,144,0.1)',
                              color:c.status.toUpperCase()==='ENABLED'?C.g:C.t3}}>
                              {c.status.toUpperCase()==='ENABLED'?'Ativa':'Pausada'}
                            </span>
                          </td>
                          <td style={{padding:'9px 10px',color:C.a,fontWeight:600}}>R$ {fmtR(c.spend)}</td>
                          <td style={{padding:'9px 10px',color:C.g,fontWeight:600}}>R$ {fmtR(c.sales)}</td>
                          <td style={{padding:'9px 10px'}}><AcosBadge v={c.acos}/></td>
                          <td style={{padding:'9px 10px',color:c.roas>4?C.g:c.roas>2?C.a:C.r,fontWeight:600}}>{c.roas>0?`${c.roas.toFixed(2)}x`:'—'}</td>
                          <td style={{padding:'9px 10px',color:C.t4}}>{c.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Insights ──────────────────────────────────────────────────────── */}
        {insights.length>0&&(
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'20px 24px'}}>
            <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.12em',marginBottom:14}}>💡 INSIGHTS AUTOMÁTICOS</div>
            <div style={{display:'flex',flexDirection:'column' as const,gap:8}}>
              {insights.map((ins,i)=>(
                <div key={i} style={{
                  display:'flex',alignItems:'flex-start',gap:12,
                  background:ins.type==='g'?'rgba(34,197,94,0.06)':ins.type==='a'?'rgba(245,158,11,0.06)':'rgba(239,68,68,0.06)',
                  border:`1px solid ${ins.type==='g'?'rgba(34,197,94,0.2)':ins.type==='a'?'rgba(245,158,11,0.2)':'rgba(239,68,68,0.2)'}`,
                  borderRadius:10,padding:'12px 14px'
                }}>
                  <span style={{fontSize:16,flexShrink:0}}>{ins.type==='g'?'✅':ins.type==='a'?'⚠️':'🔴'}</span>
                  <span style={{fontSize:12,color:ins.type==='g'?C.g:ins.type==='a'?C.a:C.r,lineHeight:1.6}}>{ins.text}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:14,padding:'10px 14px',background:'rgba(255,255,255,0.02)',borderRadius:8,fontSize:11,color:C.t3}}>
              📌 Insights gerados automaticamente com base nos dados carregados. Use como ponto de partida para análise.
            </div>
          </div>
        )}

      </>)}
    </div>
  )
}
