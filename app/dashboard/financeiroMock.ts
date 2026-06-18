/* ════════════════════════════════════════════════════════════════════════════
   Camada de dados do hub Gestão — DADOS FAKE (mock).
   Espelha o formato que a Finances API (SP-API) vai entregar, pra trocar
   "mock → real" sem mexer na UI. Quando a API liberar, basta substituir
   getFinanceData() por uma chamada ao backend (/api/amazon/finance).
   ════════════════════════════════════════════════════════════════════════════ */

export interface FinProduct {
  id: string
  name: string
  sku: string
  asin: string
  image?: string         // URL da imagem (vem do Catalog API; placeholder no mock)
  units: number          // unidades vendidas no período
  price: number          // preço médio de venda
  unitCost: number       // CMV unitário (vem do Gerenciamento)
  adsSpend: number       // gasto de ads atribuído
  adsSales: number       // vendas atribuídas a ads
  refundUnits: number    // unidades devolvidas
  stockFBA: number       // estoque FBA
  bsr: number
}

export interface FinDaily { day: number; receita: number; lucro: number; ads: number }

export interface FinData {
  period: string
  products: FinProduct[]
  daily: FinDaily[]
  // taxas usadas no cálculo (viram valores REAIS quando a Finances API entrar)
  referralRate: number   // comissão Amazon média
  fbaRate: number        // tarifa FBA média
  taxRate: number        // imposto
  armazenagem: number    // tarifa de armazenagem do período (Finances API)
  remocao: number        // remoção de inventário (Finances API)
  orders: number         // nº de pedidos
}

const P = (id:string,name:string,sku:string,asin:string,units:number,price:number,unitCost:number,adsSpend:number,adsSales:number,refundUnits:number,stockFBA:number,bsr:number):FinProduct =>
  ({id,name,sku,asin,units,price,unitCost,adsSpend,adsSales,refundUnits,stockFBA,bsr})

const MOCK_PRODUCTS: FinProduct[] = [
  P('1','Brinquedo Pelúcia Carrinho Bebê','BRQ-CAR-02','B0F1A2B3C4',660,34.9,11,410,6800,40,55,21),
  P('2','Pelúcia Sensorial Bebê (Raposa)','PEL-RAP-01','B0F2C3D4E5',150,79.9,28,120,1100,6,320,487),
  P('3','Espátula Silicone Redonda','ESP-SIL-08','B0G3D4E5F6',190,24.9,7,50,1900,11,260,344),
  P('4','Kit 2 Prateleiras de Canto Premium','PRA-CAN-03','B0F4E5F6G7',90,118,46,180,3200,3,210,1381),
  P('5','Porta Tempero Inox Giratório 16pts','TMP-INX-04','B0G5F6G7H8',140,78.9,31,90,2100,9,18,728),
  P('6','Cama Pet Cachorro/Gato 70×50','PET-CAM-05','B0F6G7H8I9',70,99.9,38,60,1400,5,90,1302),
  P('7','Planner Diário Vertical Espiral','PLN-VRT-06','B0G7H8I9J0',60,39.9,12,30,600,2,140,1693),
  P('8','Caderno Anotações A5 Capa Dura','CAD-A5-07','B0F8I9J0K1',60,45,14,40,520,7,8,1653),
]

function mockDaily(totalRevenue:number):FinDaily[] {
  const base = totalRevenue / 30
  return Array.from({length:30},(_,i)=>{
    const f = 0.55 + 0.85 * Math.abs(Math.sin((i+1) * 1.25))
    const receita = Math.round(base * f)
    return { day: i+1, receita, lucro: Math.round(receita*0.27), ads: Math.round(receita*0.08) }
  })
}

/** Ponto único de dados. Trocar por fetch('/api/amazon/finance') quando a API sair. */
export function getFinanceData(): FinData {
  const products = MOCK_PRODUCTS
  const revenue = products.reduce((s,p)=>s+p.units*p.price,0)
  return {
    period: 'Últimos 30 dias',
    products,
    daily: mockDaily(revenue),
    referralRate: 0.15,
    fbaRate: 0.12,
    taxRate: 0.06,
    armazenagem: 340,
    remocao: 60,
    orders: 96,
  }
}

/* ── Derivações (a "lógica" por trás de cada aba) ─────────────────────────── */

export interface ProductMetrics extends FinProduct {
  revenue:number; commission:number; fbaFee:number; cmv:number; tax:number; refundValue:number
  grossProfit:number; acos:number; roas:number; margin:number; roi:number; coverageDays:number
}

export function productMetrics(d:FinData):ProductMetrics[] {
  return d.products.map(p=>{
    const revenue=p.units*p.price
    const commission=revenue*d.referralRate
    const fbaFee=revenue*d.fbaRate
    const cmv=p.units*p.unitCost
    const tax=revenue*d.taxRate
    const refundValue=p.refundUnits*p.price
    const grossProfit=revenue-commission-fbaFee-cmv-tax-refundValue
    const acos=p.adsSales>0?p.adsSpend/p.adsSales*100:0
    const roas=p.adsSpend>0?p.adsSales/p.adsSpend:0
    const margin=revenue>0?grossProfit/revenue*100:0
    const roi=cmv>0?grossProfit/cmv*100:0
    const coverageDays=Math.round(p.stockFBA/Math.max(p.units/30,0.1))
    return {...p,revenue,commission,fbaFee,cmv,tax,refundValue,grossProfit,acos,roas,margin,roi,coverageDays}
  })
}

export interface Summary {
  faturamento:number; liqMarketplace:number; lucroBruto:number; margem:number
  orders:number; unidades:number; ticketMedio:number; roi:number
  ads:number; tacos:number; lucroPosAds:number; mpa:number
  comissao:number; fba:number; cmv:number; tax:number; refunds:number
  armazenagem:number; remocao:number; lucroLiquido:number
}

export function summary(d:FinData):Summary {
  const m=productMetrics(d)
  const faturamento=m.reduce((s,p)=>s+p.revenue,0)
  const comissao=m.reduce((s,p)=>s+p.commission,0)
  const fba=m.reduce((s,p)=>s+p.fbaFee,0)
  const cmv=m.reduce((s,p)=>s+p.cmv,0)
  const tax=m.reduce((s,p)=>s+p.tax,0)
  const refunds=m.reduce((s,p)=>s+p.refundValue,0)
  const ads=m.reduce((s,p)=>s+p.adsSpend,0)
  const unidades=m.reduce((s,p)=>s+p.units,0)
  const liqMarketplace=faturamento-comissao-fba
  const lucroBruto=liqMarketplace-cmv-tax-refunds
  const lucroPosAds=lucroBruto-ads
  const lucroLiquido=lucroPosAds-d.armazenagem-d.remocao
  return {
    faturamento, liqMarketplace, lucroBruto,
    margem: faturamento>0?lucroBruto/faturamento*100:0,
    orders: d.orders, unidades, ticketMedio: d.orders>0?faturamento/d.orders:0,
    roi: cmv>0?lucroBruto/cmv*100:0,
    ads, tacos: faturamento>0?ads/faturamento*100:0,
    lucroPosAds, mpa: faturamento>0?lucroPosAds/faturamento*100:0,
    comissao, fba, cmv, tax, refunds,
    armazenagem: d.armazenagem, remocao: d.remocao, lucroLiquido,
  }
}

/** Curva ABC: classifica por receita acumulada (A≤80%, B≤95%, C resto). */
export function abcCurve(d:FinData){
  const m=[...productMetrics(d)].sort((a,b)=>b.revenue-a.revenue)
  const total=m.reduce((s,p)=>s+p.revenue,0)||1
  let cum=0
  return m.map(p=>{
    cum+=p.revenue
    const share=cum/total*100
    const cls = share<=80?'A':share<=95?'B':'C'
    return {...p, shareTotal:p.revenue/total*100, cls}
  })
}
