import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORÁCULO Amazon Intelligence — Planos e Preços',
  description: 'Mineração de produtos Amazon com inteligência artificial. Encontre os melhores produtos para vender no FBA.',
}

// ── Links do Hotmart — atualize com seus links reais ──────────────────────────
const LINKS = {
  monthly:  'https://pay.hotmart.com/SEU-LINK-MENSAL',
  annual:   'https://pay.hotmart.com/SEU-LINK-ANUAL',
  lifetime: 'https://pay.hotmart.com/SEU-LINK-VITALICIO',
}

const gold   = '#F0B429'
const goldG  = 'linear-gradient(135deg,#F5C842,#C48F10)'
const bg     = '#03030A'
const card   = '#09091A'
const line   = 'rgba(255,255,255,0.08)'
const t1     = '#F2F2FC'
const t2     = '#A0A0C8'
const t3     = '#686890'
const g      = '#22C55E'
const pur    = '#8B78FF'

export default function PlanosPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:${bg};color:${t1};-webkit-font-smoothing:antialiased}
        a{text-decoration:none}
        ::selection{background:rgba(240,180,41,0.25)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#30304A;border-radius:2px}
      `}</style>

      {/* Grid bg */}
      <div style={{position:'fixed',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)`,backgroundSize:'52px 52px',pointerEvents:'none',zIndex:0}}/>
      {/* Gold glow */}
      <div style={{position:'fixed',top:'-10%',left:'50%',transform:'translateX(-50%)',width:'70vw',height:'70vw',borderRadius:'50%',background:'radial-gradient(circle,rgba(240,180,41,0.07) 0%,transparent 65%)',pointerEvents:'none',zIndex:0}}/>

      <div style={{position:'relative',zIndex:1,minHeight:'100vh'}}>

        {/* NAV */}
        <nav style={{borderBottom:`1px solid ${line}`,background:'rgba(3,3,10,0.8)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:50}}>
          <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:9,background:'rgba(240,180,41,0.08)',border:`1px solid rgba(240,180,41,0.2)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" style={{filter:'drop-shadow(0 0 6px rgba(240,180,41,0.7))'}}>
                  <ellipse cx="16" cy="16" rx="13" ry="9" stroke="#F0B429" strokeWidth="1.6"/>
                  <circle cx="16" cy="16" r="5.5" fill="#F0B429"/>
                  <circle cx="16" cy="16" r="2.4" fill="#03030A"/>
                  <circle cx="14.5" cy="14.2" r="1.1" fill="rgba(255,255,255,0.4)"/>
                </svg>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:800,letterSpacing:'0.2em',color:gold,lineHeight:1}}>ORÁCULO</div>
                <div style={{fontSize:7,color:t3,letterSpacing:'0.18em',marginTop:2}}>AMAZON INTELLIGENCE</div>
              </div>
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <a href="/login" style={{fontSize:12,color:t2,fontWeight:500,padding:'7px 16px',borderRadius:8,border:`1px solid ${line}`,transition:'all .15s'}}>Entrar</a>
              <a href={LINKS.monthly} target="_blank" style={{fontSize:12,color:'#02020A',fontWeight:700,padding:'8px 18px',borderRadius:8,background:goldG,letterSpacing:'0.06em'}}>Começar agora</a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{maxWidth:900,margin:'0 auto',padding:'96px 24px 64px',textAlign:'center'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:`${gold}12`,border:`1px solid ${gold}25`,borderRadius:99,padding:'6px 16px',marginBottom:32}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:g,boxShadow:`0 0 8px ${g}`}}/>
            <span style={{fontSize:11,color:gold,fontWeight:600,letterSpacing:'0.1em'}}>MINERAÇÃO DE PRODUTOS AMAZON</span>
          </div>
          <h1 style={{fontSize:'clamp(36px,6vw,68px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.05,marginBottom:24,background:`linear-gradient(135deg,${t1} 0%,${t2} 100%)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Encontre produtos<br/>vencedores no Amazon
          </h1>
          <p style={{fontSize:'clamp(15px,2vw,18px)',color:t2,lineHeight:1.7,maxWidth:560,margin:'0 auto 40px',fontWeight:400}}>
            O ORÁCULO analisa milhares de produtos em tempo real, estima vendas mensais pelo BSR e calcula sua margem de lucro antes de você investir um centavo.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <a href={LINKS.monthly} target="_blank"
              style={{background:goldG,color:'#02020A',fontWeight:800,fontSize:14,padding:'14px 32px',borderRadius:12,letterSpacing:'0.08em',textTransform:'uppercase',boxShadow:'0 8px 32px rgba(240,180,41,0.35)',display:'inline-block'}}>
              Começar agora
            </a>
            <a href="/login"
              style={{background:'none',color:t2,fontWeight:600,fontSize:14,padding:'14px 32px',borderRadius:12,border:`1px solid ${line}`,display:'inline-block'}}>
              Já tenho conta
            </a>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 80px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
            {[
              { icon:'📊', title:'Estimativa real de vendas', desc:'Calculamos vendas mensais pelo BSR da Amazon — sem achismo, com dados reais do mercado brasileiro.' },
              { icon:'🔍', title:'Mineração por categoria', desc:'Pesquise por eletrônicos, casa, beleza, fitness e muito mais. Filtre os melhores produtos por demanda.' },
              { icon:'💰', title:'Simulador de lucratividade', desc:'Insira seu custo e preço de venda. Calculamos taxa Amazon, FBA, margem e ROI automaticamente.' },
              { icon:'🧩', title:'Extensão Chrome', desc:'Analise qualquer produto diretamente na página da Amazon. Acesse o painel completo com um clique.' },
              { icon:'🏷️', title:'Produtos genéricos', desc:'Aba exclusiva com produtos sem marca — menor concorrência, maior margem para sua marca própria.' },
              { icon:'📈', title:'Análise de tendências', desc:'Descubra o que está em alta antes dos seus concorrentes e entre no mercado no momento certo.' },
            ].map((f,i)=>(
              <div key={i} style={{background:card,border:`1px solid ${line}`,borderRadius:14,padding:'24px 22px'}}>
                <div style={{fontSize:28,marginBottom:14}}>{f.icon}</div>
                <div style={{fontSize:14,fontWeight:700,color:t1,marginBottom:8,letterSpacing:'-0.01em'}}>{f.title}</div>
                <div style={{fontSize:12,color:t2,lineHeight:1.65}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="planos" style={{maxWidth:1100,margin:'0 auto',padding:'0 24px 96px'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <h2 style={{fontSize:'clamp(28px,4vw,44px)',fontWeight:800,color:t1,letterSpacing:'-0.03em',marginBottom:12}}>Planos e Preços</h2>
            <p style={{fontSize:14,color:t2}}>Escolha o plano ideal para o seu momento</p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,alignItems:'start'}}>

            {/* MENSAL */}
            <div style={{background:card,border:`1px solid ${line}`,borderRadius:18,padding:'32px 28px'}}>
              <div style={{fontSize:9,fontWeight:700,color:pur,letterSpacing:'0.16em',marginBottom:16}}>MENSAL</div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:6}}>
                <span style={{fontSize:42,fontWeight:900,color:t1,letterSpacing:'-0.04em'}}>R$ 47</span>
                <span style={{fontSize:13,color:t3}}>/mês</span>
              </div>
              <p style={{fontSize:12,color:t3,marginBottom:24,lineHeight:1.5}}>Cancele quando quiser. Ideal para quem está começando.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:28}}>
                {['Painel web completo','Produtos ilimitados por busca','Todas as abas de mineração','Análise detalhada + simulador','Extensão Chrome inclusa','Suporte por e-mail'].map((f,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill={pur} opacity=".15"/><path d="M4 7l2.2 2.2L10 5" stroke={pur} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{fontSize:12,color:t2}}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={LINKS.monthly} target="_blank"
                style={{display:'block',textAlign:'center',background:'none',color:pur,border:`1.5px solid ${pur}50`,fontWeight:700,fontSize:12,padding:'13px',borderRadius:10,letterSpacing:'0.08em',textTransform:'uppercase' as const}}>
                Assinar Mensal
              </a>
            </div>

            {/* ANUAL — destaque */}
            <div style={{background:card,border:`1.5px solid ${gold}50`,borderRadius:18,padding:'32px 28px',position:'relative',boxShadow:`0 0 60px rgba(240,180,41,0.12)`}}>
              <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:goldG,color:'#02020A',fontSize:10,fontWeight:800,padding:'5px 18px',borderRadius:99,letterSpacing:'0.1em',whiteSpace:'nowrap'}}>
                MAIS POPULAR
              </div>
              <div style={{fontSize:9,fontWeight:700,color:gold,letterSpacing:'0.16em',marginBottom:16}}>ANUAL</div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:2}}>
                <span style={{fontSize:42,fontWeight:900,color:t1,letterSpacing:'-0.04em'}}>R$ 297</span>
                <span style={{fontSize:13,color:t3}}>/ano</span>
              </div>
              <div style={{fontSize:11,color:g,fontWeight:600,marginBottom:6}}>Equivale a R$ 24,75/mês — economize 47%</div>
              <p style={{fontSize:12,color:t3,marginBottom:24,lineHeight:1.5}}>Melhor custo-benefício para quem já vende ou quer crescer.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:28}}>
                {['Tudo do plano Mensal','Exportar resultados em CSV','Acesso prioritário a novidades','1 ano de acesso garantido'].map((f,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill={gold} opacity=".15"/><path d="M4 7l2.2 2.2L10 5" stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{fontSize:12,color:t2}}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={LINKS.annual} target="_blank"
                style={{display:'block',textAlign:'center',background:goldG,color:'#02020A',fontWeight:800,fontSize:12,padding:'14px',borderRadius:10,letterSpacing:'0.08em',textTransform:'uppercase' as const,boxShadow:'0 4px 20px rgba(240,180,41,0.3)'}}>
                Assinar Anual
              </a>
            </div>

            {/* VITALÍCIO */}
            <div style={{background:card,border:`1px solid ${g}35`,borderRadius:18,padding:'32px 28px',position:'relative',boxShadow:`0 0 40px rgba(34,197,94,0.06)`}}>
              <div style={{fontSize:9,fontWeight:700,color:g,letterSpacing:'0.16em',marginBottom:16}}>VITALÍCIO</div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:2}}>
                <span style={{fontSize:42,fontWeight:900,color:t1,letterSpacing:'-0.04em'}}>R$ 497</span>
                <span style={{fontSize:13,color:t3}}>único</span>
              </div>
              <div style={{fontSize:11,color:g,fontWeight:600,marginBottom:6}}>Pague uma vez, use para sempre</div>
              <p style={{fontSize:12,color:t3,marginBottom:24,lineHeight:1.5}}>Para quem está comprometido com o Amazon FBA no longo prazo.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:28}}>
                {['Tudo do plano Anual','Acesso vitalício garantido','Todas as atualizações futuras','Suporte VIP','Sem mensalidade nunca'].map((f,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill={g} opacity=".15"/><path d="M4 7l2.2 2.2L10 5" stroke={g} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{fontSize:12,color:t2}}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={LINKS.lifetime} target="_blank"
                style={{display:'block',textAlign:'center',background:`${g}15`,color:g,border:`1.5px solid ${g}50`,fontWeight:700,fontSize:12,padding:'13px',borderRadius:10,letterSpacing:'0.08em',textTransform:'uppercase' as const}}>
                Comprar Vitalício
              </a>
            </div>

          </div>
        </section>

        {/* FAQ */}
        <section style={{maxWidth:700,margin:'0 auto',padding:'0 24px 96px'}}>
          <h2 style={{fontSize:28,fontWeight:800,color:t1,letterSpacing:'-0.03em',textAlign:'center',marginBottom:40}}>Dúvidas frequentes</h2>
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {[
              { q:'O que é o ORÁCULO?', a:'O ORÁCULO é uma plataforma de mineração de produtos Amazon. Ele analisa o BSR (ranking de vendas) para estimar quantas unidades cada produto vende por mês, e calcula sua margem de lucro com taxas Amazon e FBA.' },
              { q:'O acesso inclui a extensão Chrome?', a:'Sim! Ao comprar qualquer plano você recebe tanto o acesso ao painel web quanto a chave de licença para a extensão Chrome, que permite analisar produtos diretamente na página da Amazon.' },
              { q:'Em quantos dispositivos posso usar?', a:'O painel web aceita até 2 logins simultâneos. A extensão Chrome funciona em até 2 máquinas ao mesmo tempo com a mesma chave.' },
              { q:'Funciona para o Amazon Brasil?', a:'Sim, o ORÁCULO é especializado no marketplace Amazon.com.br, com dados de vendas e estimativas calibrados para o mercado brasileiro.' },
              { q:'Posso cancelar quando quiser?', a:'Sim. O plano Mensal pode ser cancelado a qualquer momento pela Hotmart, sem multa ou burocracia.' },
            ].map((item,i)=>(
              <details key={i} style={{background:card,border:`1px solid ${line}`,borderRadius:12,overflow:'hidden'}}>
                <summary style={{padding:'16px 20px',cursor:'pointer',fontSize:13,fontWeight:600,color:t1,listStyle:'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {item.q}
                  <span style={{color:t3,fontSize:18,fontWeight:300}}>+</span>
                </summary>
                <div style={{padding:'0 20px 16px',fontSize:13,color:t2,lineHeight:1.7,borderTop:`1px solid ${line}`}}>
                  <div style={{paddingTop:12}}>{item.a}</div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section style={{maxWidth:700,margin:'0 auto',padding:'0 24px 96px',textAlign:'center'}}>
          <div style={{background:card,border:`1px solid ${gold}25`,borderRadius:20,padding:'48px 32px',boxShadow:`0 0 80px rgba(240,180,41,0.08)`}}>
            <div style={{fontSize:32,fontWeight:900,color:t1,letterSpacing:'-0.03em',marginBottom:12}}>Comece hoje</div>
            <p style={{fontSize:14,color:t2,marginBottom:32,lineHeight:1.6}}>Mais de 60 produtos analisados por busca, simulador de lucro completo e extensão Chrome inclusa.</p>
            <a href={LINKS.annual} target="_blank"
              style={{display:'inline-block',background:goldG,color:'#02020A',fontWeight:800,fontSize:13,padding:'15px 40px',borderRadius:12,letterSpacing:'0.1em',textTransform:'uppercase',boxShadow:'0 8px 32px rgba(240,180,41,0.35)'}}>
              Ver planos e assinar
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{borderTop:`1px solid ${line}`,padding:'24px',textAlign:'center'}}>
          <p style={{fontSize:11,color:t3}}>© {new Date().getFullYear()} Belchiq LTDA · ORÁCULO Amazon Intelligence · <a href="/login" style={{color:t3}}>Entrar na plataforma</a></p>
        </footer>

      </div>
    </>
  )
}
