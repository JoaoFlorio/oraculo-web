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
interface DRECfg     { amazonFee:number; fbaFee:number; cmv:number; otherCosts:number }
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
const fmtK=(n:number)=>n>=1000?`${(n/1000).toFixed(1).replace('.0','')}k`:`${n}`

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
      // "Este mês, até agora" tem vírgula no label — após parse: c[0]="Este mês" c[1]="até agora" c[2]=orders c[3]=units c[4]=revenue c[6]=avgTicket
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

function calcInsights(s:SalesData|null,a:AdsData|null,cfg:DRECfg):Insight[]{
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
    if(a.totalAcos>0&&a.totalAcos<20)ins.push({type:'g',text:`ACoS geral de ${a.totalAcos.toFixed(1)}% está excelente! Escale as campanhas lucrativas 🎯`})
    else if(a.totalAcos>=20&&a.totalAcos<=30)ins.push({type:'a',text:`ACoS geral de ${a.totalAcos.toFixed(1)}% é aceitável. Tente otimizar para abaixo de 20%`})
    else if(a.totalAcos>30)ins.push({type:'r',text:`ACoS geral de ${a.totalAcos.toFixed(1)}% está alto — revise lances e segmentação ⚠️`})
    const noSales=a.campaigns.filter(c=>c.status.toUpperCase()==='ENABLED'&&c.sales===0&&c.spend>5)
    if(noSales.length>0)ins.push({type:'r',text:`${noSales.length} campanha(s) ativa(s) sem vendas gastando R$ ${fmtR(noSales.reduce((s,c)=>s+c.spend,0))} — pause ou corrija o targeting`})
    const best=a.campaigns.filter(c=>c.sales>0).sort((a,b)=>a.acos-b.acos)[0]
    if(best)ins.push({type:'g',text:`"${best.name}" é sua campeã: ACoS ${best.acos.toFixed(1)}%, ROAS ${best.roas.toFixed(2)}x — invista mais nela`})
  }
  if(s&&a&&cfg.cmv>0){
    const receita=s.revenue
    const liqMkt=receita*(1-(cfg.amazonFee+cfg.fbaFee)/100)
    const lucroBruto=liqMkt-cfg.cmv
    const lucroPos=lucroBruto-a.totalSpend
    const lucroLiq=lucroPos-cfg.otherCosts
    const mpaVal=receita>0?(lucroPos/receita)*100:0
    const tacosVal=receita>0?(a.totalSpend/receita)*100:0
    const roiVal=cfg.cmv>0?(lucroBruto/cfg.cmv)*100:0
    if(mpaVal>20)ins.push({type:'g',text:`MPA de ${mpaVal.toFixed(1)}% — Margem Pós Ads excelente! Negócio muito saudável 💰`})
    else if(mpaVal>10)ins.push({type:'a',text:`MPA de ${mpaVal.toFixed(1)}% — razoável. Tente reduzir TACOS ou CMV para melhorar`})
    else if(mpaVal>0)ins.push({type:'r',text:`MPA de ${mpaVal.toFixed(1)}% está apertado — ads ou CMV muito altos para a margem atual`})
    else ins.push({type:'r',text:`⚠️ MPA negativo (${mpaVal.toFixed(1)}%) — ads + custos superam a receita líquida neste período`})
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
function ChartTooltip({active,payload,label,prefix='R$ '}:any){
  if(!active||!payload?.length)return null
  return(
    <div style={{background:C.modal,border:`1px solid ${C.line}`,borderRadius:10,padding:'10px 14px',fontSize:11}}>
      <div style={{color:C.t3,marginBottom:6}}>Dia {label}</div>
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{color:p.color,marginBottom:2}}>
          {p.name}: <strong>{prefix}{fmtR(p.value)}</strong>
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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function FinanceiroPanel(){
  const [mounted, setMounted] = useState(false)
  const [salesData,  setSalesData]  = useState<SalesData|null>(null)
  const [adsData,    setAdsData]    = useState<AdsData|null>(null)
  const [showHowTo,  setShowHowTo]  = useState(false)
  const [dreOpen,    setDreOpen]    = useState(true)
  const [cfg, setCfg] = useState<DRECfg>({amazonFee:15,fbaFee:12,cmv:0,otherCosts:0})

  useEffect(()=>{ setMounted(true) },[])

  const hasData = salesData||adsData

  /* ── DRE calculations ──────────────────────────────────────────────────── */
  const receita          = salesData?.revenue ?? 0
  const comissao         = receita*(cfg.amazonFee/100)
  const fba              = receita*(cfg.fbaFee/100)
  const ads              = adsData?.totalSpend ?? 0
  const liqMarketplace   = receita - comissao - fba          // líquido antes de ads e CMV
  const receitaLiquida   = liqMarketplace - ads              // após deduzir ads
  const lucroBrutoSemAds = liqMarketplace - cfg.cmv          // lucro bruto antes dos ads (= Gestor Seller "Lucro Bruto")
  const lucroBruto       = receitaLiquida - cfg.cmv          // = lucro bruto pós ads
  const lucroLiquido     = lucroBruto - cfg.otherCosts
  const margem           = receita>0 ? (lucroBrutoSemAds/receita)*100 : 0   // margem bruta (sem ads)
  const mpa              = receita>0 ? (lucroBruto/receita)*100 : 0          // Margem Pós Ads
  const tacos            = receita>0 ? (ads/receita)*100 : 0                 // TACOS = ads/receita total
  const roi              = cfg.cmv>0  ? (lucroBrutoSemAds/cfg.cmv)*100 : 0  // ROI sobre o CMV
  const lucroColor       = lucroLiquido>0 ? C.g : C.r

  /* ── Chart data ────────────────────────────────────────────────────────── */
  const dailyChart = (salesData?.daily??[]).filter(d=>d.atual>0||d.anterior>0)

  const donutData = receita>0 ? [
    {name:'Comissão Amazon',value:comissao,color:C.pur},
    {name:'Taxa FBA',value:fba,color:C.blue},
    {name:'Publicidade',value:ads,color:C.a},
    {name:'CMV',value:cfg.cmv,color:C.r},
    {name:'Lucro Líquido',value:Math.max(0,lucroLiquido),color:C.g},
  ].filter(d=>d.value>0) : []

  const campaignChart = (adsData?.campaigns??[])
    .filter(c=>c.spend>0)
    .sort((a,b)=>a.acos-b.acos)
    .map(c=>({
      name: c.name.length>18?c.name.slice(0,18)+'…':c.name,
      acos: c.acos,
      spend: c.spend,
      sales: c.sales,
      color: c.acos===0?C.t3:c.acos<20?C.g:c.acos<30?C.a:C.r,
    }))

  const insights = calcInsights(salesData,adsData,cfg)

  /* ── Month comparison bar ─────────────────────────────────────────────── */
  const lastM   = salesData?.lastMonthRevenue??0
  const lastY   = salesData?.lastYearRevenue??0
  const compMax = Math.max(receita,lastM,lastY)||1

  return(
    <div style={{maxWidth:960,margin:'0 auto',paddingBottom:60}}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:900,color:C.t1,letterSpacing:'-0.03em',marginBottom:4}}>💰 Painel Financeiro</h2>
          <p style={{fontSize:12,color:C.t3}}>Carregue seus relatórios Amazon e veja seu DRE em segundos</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {hasData&&<button onClick={()=>{setSalesData(null);setAdsData(null)}}
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
            <UploadZone
              label="Painel de Vendas" icon="📊"
              hint="Relatórios → Painel de Vendas → Baixar CSV"
              loaded={!!salesData}
              onFile={t=>setSalesData(parseSales(t))}/>
            <UploadZone
              label="Relatório de Campanhas" icon="📢"
              hint="Publicidade → Relatórios → Sponsored Products CSV"
              loaded={!!adsData}
              onFile={t=>setAdsData(parseAds(t))}/>
          </div>
          <div style={{textAlign:'center' as const,padding:'24px',background:C.card,borderRadius:14,border:`1px solid ${C.line}`}}>
            <div style={{fontSize:28,marginBottom:8}}>📂</div>
            <div style={{fontSize:13,color:C.t3}}>Carregue ao menos 1 relatório para ver seu painel financeiro</div>
            <div style={{fontSize:11,color:C.t3,marginTop:4}}>Todos os dados ficam só no seu navegador — nenhum dado é enviado a servidores</div>
          </div>
        </div>
      )}

      {/* ── Upload (mini, after data loaded) ────────────────────────────── */}
      {hasData&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
          <UploadZone label="Painel de Vendas" icon="📊"
            hint="Clique para trocar o arquivo"
            loaded={!!salesData} onFile={t=>setSalesData(parseSales(t))}/>
          <UploadZone label="Relatório de Campanhas" icon="📢"
            hint="Clique para trocar o arquivo"
            loaded={!!adsData} onFile={t=>setAdsData(parseAds(t))}/>
        </div>
      )}

      {/* ═══════════════ DASHBOARD (after upload) ═══════════════════════ */}
      {hasData&&(<>

        {/* KPI Cards - Linha 1: Vendas */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:12,marginBottom:12}}>
          {salesData&&<>
            <KPICard icon="💰" label="Faturamento" value={`R$ ${fmtK(receita)}`}
              sub={salesData.period} color={C.gold}
              tip="Total de vendas no período antes de qualquer desconto ou taxa. Topo do DRE."/>
            <KPICard icon="🛒" label="Nº de Vendas" value={String(salesData.orders)}
              sub={`${salesData.units} unidades vendidas`} color={C.blue}
              tip="Pedidos confirmados. Unidades = total de itens físicos entregues (um pedido pode ter mais de uma unidade)."/>
            <KPICard icon="🎫" label="Ticket Médio" value={`R$ ${fmtR(salesData.avgTicket)}`}
              sub="por pedido" color={C.pur}
              tip="Valor médio de cada pedido. Aumentar o ticket médio é uma das formas mais eficientes de crescer sem precisar de mais pedidos."/>
          </>}
          {receita>0&&<KPICard icon="🏦" label="Líq. Marketplace" value={`R$ ${fmtK(liqMarketplace)}`}
            sub={`${(liqMarketplace/receita*100).toFixed(1)}% do faturamento`}
            color={C.t1}
            tip="Faturamento menos comissão Amazon e taxa FBA. É o valor que a Amazon deposita na sua conta antes de subtrair ads e custo do produto."/>}
        </div>

        {/* KPI Cards - Linha 2: Rentabilidade */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:12,marginBottom:24}}>
          {receita>0&&cfg.cmv>0&&<>
            <KPICard icon="📊" label="Lucro Bruto" value={`R$ ${fmtK(lucroBrutoSemAds)}`}
              sub={`Margem ${margem.toFixed(1)}%`}
              color={lucroBrutoSemAds>0?C.g:C.r}
              tip="Líq. Marketplace menos o CMV. Mostra a lucratividade antes de considerar gastos com publicidade."/>
            <KPICard icon="✨" label="Lucro Pós Ads" value={`R$ ${fmtK(lucroBruto)}`}
              sub={`MPA ${mpa.toFixed(1)}%`}
              color={lucroBruto>0?C.g:C.r}
              tip="Lucro Bruto menos o investimento em ads. MPA (Margem Pós Ads) é a rentabilidade real incluindo custo de aquisição via publicidade."/>
            <KPICard icon="🏆" label="Lucro Líquido" value={`R$ ${fmtK(lucroLiquido)}`}
              sub={`${(receita>0?(lucroLiquido/receita*100):0).toFixed(1)}% margem final`}
              color={lucroColor}
              tip="O que realmente ficou no bolso depois de pagar todos os custos. Margem acima de 20% é excelente para Amazon FBA."/>
            <KPICard icon="💹" label="ROI" value={`${roi.toFixed(1)}%`}
              sub="retorno sobre o CMV" color={roi>100?C.g:roi>50?C.a:C.r}
              tip="ROI = (Lucro Bruto ÷ CMV) × 100. Para cada R$100 investido em mercadoria, quanto você lucrou. Acima de 100% é excelente."/>
          </>}
          {adsData&&<>
            <KPICard icon="🎯" label="TACOS" value={`${tacos.toFixed(1)}%`}
              sub={`R$ ${fmtR(ads)} em ads`}
              color={tacos<10?C.g:tacos<20?C.a:C.r}
              tip="TACOS = Gasto em Ads ÷ Faturamento Total. Diferente do ACoS que só divide pelas vendas atribuídas. TACOS abaixo de 10% é excelente para Amazon FBA."/>
            <KPICard icon="🚀" label="ROAS" value={`${adsData.totalRoas.toFixed(2)}x`}
              sub={`ACoS ${adsData.totalAcos.toFixed(1)}%`}
              color={adsData.totalRoas>4?C.g:adsData.totalRoas>2?C.a:C.r}
              tip="ROAS = Vendas via Ads ÷ Gasto. Para cada R$1 investido você gerou X em vendas atribuídas. Acima de 4x é excelente."/>
          </>}
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

          {/* Area chart - Daily */}
          {salesData&&dailyChart.length>0&&mounted&&(
            <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'20px 24px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <div style={{fontSize:10,fontWeight:700,color:C.t3,letterSpacing:'0.12em'}}>📈 RECEITA DIÁRIA</div>
                <div style={{display:'flex',gap:12}}>
                  {[{c:C.gold,l:'Atual'},{c:C.pur,l:'Mês ant.'},{c:'rgba(104,104,144,0.6)',l:'Ano ant.'}].map((item,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:C.t3}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:item.c}}/>
                      {item.l}
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

          {/* Donut - cost breakdown */}
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
              {/* Inputs row */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,padding:'12px 16px',background:'rgba(255,255,255,0.02)',borderRadius:10,margin:'0 8px 16px'}}>
                {[
                  {label:'Comissão Amazon',key:'amazonFee',suffix:'%',tip:'Varia por categoria. Use 15% como padrão geral.'},
                  {label:'Taxa FBA',key:'fbaFee',suffix:'%',tip:'Custo de fulfillment. Aprox. 10-15% dependendo do produto.'},
                  {label:'CMV Total',key:'cmv',suffix:'R$',tip:'Custo total dos produtos vendidos no período (produto + frete + importação).'},
                  {label:'Outras Despesas',key:'otherCosts',suffix:'R$',tip:'Contador, ferramentas, devoluções, frete de retorno, etc.'},
                ].map((f,i)=>(
                  <div key={i}>
                    <div style={{fontSize:9,fontWeight:700,color:C.t3,letterSpacing:'0.1em',marginBottom:4}}>{f.label.toUpperCase()} <span style={{opacity:.5}}>({f.suffix})</span></div>
                    <input type="number" min={0} step={f.suffix==='%'?0.5:100}
                      value={(cfg as any)[f.key]}
                      onChange={e=>setCfg(p=>({...p,[f.key]:parseFloat(e.target.value)||0}))}
                      style={{width:'100%',background:C.bg,border:`1px solid ${C.line}`,borderRadius:7,
                        color:C.t1,fontSize:13,fontWeight:700,padding:'7px 10px',fontFamily:'inherit',
                        outline:'none',boxSizing:'border-box' as const}}/>
                    <div style={{fontSize:9,color:C.t3,marginTop:3,lineHeight:1.4}}>{f.tip}</div>
                  </div>
                ))}
              </div>

              {salesData&&<>
                <DRERow icon="💰" label="Receita Bruta (Faturamento)" value={receita} pctVal={100} color={C.gold} bold
                  tip="Total de vendas no período. Inclui todas as unidades vendidas × preço de venda. É o topo do DRE."/>
                <DRERow icon="📦" label={`Comissão Amazon (${cfg.amazonFee}%)`} value={-comissao} pctVal={cfg.amazonFee} color={C.r} indent
                  tip="Amazon cobra uma comissão sobre cada venda. Varia por categoria: 8% eletrônicos, 15% casa/moda/esportes."/>
                <DRERow icon="🏭" label={`Taxa FBA — Fulfillment (${cfg.fbaFee}%)`} value={-fba} pctVal={cfg.fbaFee} color={C.r} indent
                  tip="Custo de armazenagem + separação + embalagem + envio ao cliente pelo Amazon FBA. Varia com tamanho e peso."/>
                <DRERow icon="🏦" label="Líq. Marketplace" value={liqMarketplace} pctVal={receita>0?liqMarketplace/receita*100:0}
                  color={C.blue} bold separator
                  tip="O que a Amazon deposita na sua conta após descontar comissão e FBA. Ainda não considera ads nem custo do produto."/>
                <DRERow icon="🏷️" label="CMV — Custo da Mercadoria Vendida" value={-cfg.cmv} pctVal={receita>0?cfg.cmv/receita*100:0} color={C.r} indent
                  tip="Custo total dos produtos vendidos no período: preço de compra + frete de importação + impostos. Informe acima."/>
                <DRERow icon="📊" label="Lucro Bruto" value={lucroBrutoSemAds} pctVal={receita>0?lucroBrutoSemAds/receita*100:0}
                  color={lucroBrutoSemAds>0?C.g:C.r} bold separator
                  tip="Líq. Marketplace menos CMV. Mostra a lucratividade antes de considerar os gastos com publicidade. Equivalente ao 'Lucro Bruto' do Gestor Seller."/>
                {adsData&&<DRERow icon="📢" label={`Publicidade (TACOS ${tacos.toFixed(1)}%)`} value={-ads} pctVal={receita>0?ads/receita*100:0} color={C.a} indent
                  tip="Total gasto em campanhas Sponsored Products. TACOS = Ads ÷ Faturamento Total — métrica mais honesta que o ACoS."/>}
                <DRERow icon="✨" label={`Lucro Pós Ads — MPA ${mpa.toFixed(1)}%`} value={lucroBruto} pctVal={receita>0?lucroBruto/receita*100:0}
                  color={lucroBruto>0?C.g:C.r} bold separator
                  tip="Lucro Bruto menos ads. MPA (Margem Pós Ads) é a rentabilidade real do negócio incluindo o custo de aquisição via publicidade. Este é o indicador mais importante do dia a dia."/>
                <DRERow icon="⚙️" label="Outras Despesas Operacionais" value={-cfg.otherCosts} pctVal={receita>0?cfg.otherCosts/receita*100:0} color={C.r} indent
                  tip="Ferramentas (Oráculo, etc), contador, taxas bancárias, devoluções, frete de retorno, despesas eventuais."/>
                <DRERow icon="🏆" label="LUCRO LÍQUIDO" value={lucroLiquido} pctVal={receita>0?lucroLiquido/receita*100:0}
                  color={lucroColor} bold separator
                  tip="O que realmente ficou no bolso depois de pagar todos os custos. Margem acima de 20% é excelente para Amazon FBA."/>
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
              <div style={{fontSize:12,color:C.t4}}>ACoS ideal: abaixo de 20% · ROAS ideal: acima de 4x</div>
            </div>
            <div style={{padding:'16px 24px'}}>
              {/* Summary row */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
                {[
                  {l:'Total Investido',v:`R$ ${fmtR(adsData.totalSpend)}`,c:C.a},
                  {l:'Vendas via Ads',v:`R$ ${fmtR(adsData.totalSales)}`,c:C.g},
                  {l:'ACoS Geral',v:`${adsData.totalAcos.toFixed(1)}%`,c:adsData.totalAcos<20?C.g:adsData.totalAcos<30?C.a:C.r},
                  {l:'ROAS Geral',v:`${adsData.totalRoas.toFixed(2)}x`,c:adsData.totalRoas>4?C.g:adsData.totalRoas>2?C.a:C.r},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.card2,borderRadius:10,padding:'12px 14px',border:`1px solid ${C.line}`}}>
                    <div style={{fontSize:9,color:C.t3,marginBottom:4}}>{s.l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* ACoS Bar chart */}
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

              {/* Campaign table */}
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
              📌 Estes insights são gerados automaticamente com base nos dados carregados. Use como ponto de partida para análise.
            </div>
          </div>
        )}

      </>)}
    </div>
  )
}
