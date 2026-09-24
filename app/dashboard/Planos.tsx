'use client'
/* ABA PLANOS (24/09/2026) — pedido do João: "a pessoa não precisa entrar em link meu;
   tudo dentro do Oráculo ela muda de plano. Quem é vitalício vê que está no topo; mensal
   recebe upsell do anual antes de vencer; anual recebe upsell do vitalício."

   DESENHO (v2, 24/09 à tarde — "tá simples, cria elementos, deixa animado"):
   a assinatura da tela é a ESCADA: os 4 planos são degraus que sobem da esquerda pra
   direita, ligados por uma trilha dourada; o marcador "você" pousa no seu degrau e o
   próximo degrau pulsa. Entrada em cascata; o Fundador tem uma borda de aurora dourada.
   Checkout continua na Greenn (mesmo e-mail). Preços/links: lib/planos.ts (fonte única). */
import React, { useState } from 'react'
import { PLANOS, RANK, planoDe, fmt, checkout, recomendacao, type PlanoId } from '@/lib/planos'

const CSS = `
.pl{--au:#F0B429;--au2:#FFD466;--au3:#9A6B06;max-width:1120px;padding:6px 0 48px;font-family:inherit}
.pl *{box-sizing:border-box}
@keyframes pl-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes pl-pulse{0%,100%{box-shadow:0 0 0 0 rgba(240,180,41,.45)}60%{box-shadow:0 0 0 14px rgba(240,180,41,0)}}
@keyframes pl-aurora{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes pl-draw{to{stroke-dashoffset:0}}
@keyframes pl-shine{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(240%) skewX(-18deg)}}
.pl-in{animation:pl-rise .55s cubic-bezier(.2,.7,.2,1) both}
.pl-hero{position:relative;overflow:hidden;border:1px solid var(--lineG);border-radius:20px;padding:26px 28px 24px;background:
  radial-gradient(900px 260px at 8% -20%,rgba(240,180,41,.22),transparent 60%),
  radial-gradient(500px 220px at 100% 120%,rgba(240,180,41,.10),transparent 60%),var(--card)}
.pl-hero.top{border-color:rgba(240,180,41,.55)}
.pl-hero::after{content:'';position:absolute;inset:0;pointer-events:none;background:
  repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 1px,transparent 1px 64px)}
.pl-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--au)}
.pl-title{font-size:clamp(26px,3.2vw,40px);font-weight:900;letter-spacing:-.035em;line-height:1.02;color:var(--t1);margin:6px 0 8px}
.pl-title em{font-style:normal;background:linear-gradient(90deg,var(--au2),var(--au),var(--au3));-webkit-background-clip:text;background-clip:text;color:transparent}
.pl-sub{font-size:13.5px;color:var(--t2);max-width:640px;line-height:1.55}
.pl-hero-grid{display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center;position:relative;z-index:1}
.pl-ring{--p:0;width:118px;height:118px;border-radius:50%;display:grid;place-items:center;
  background:conic-gradient(var(--au) calc(var(--p)*1%),rgba(255,255,255,.07) 0);position:relative}
.pl-ring::before{content:'';position:absolute;inset:9px;border-radius:50%;background:var(--card)}
.pl-ring b{position:relative;font-size:22px;font-weight:900;color:var(--t1);letter-spacing:-.03em}
.pl-ring small{position:relative;display:block;font-size:10px;color:var(--t3);text-align:center;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.pl-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.04em;border:1px solid}
.pl-pill.ok{color:#4ADE80;border-color:rgba(74,222,128,.35);background:rgba(74,222,128,.08)}
.pl-pill.warn{color:var(--au);border-color:rgba(240,180,41,.4);background:rgba(240,180,41,.1)}
.pl-stairs{position:relative;margin:26px 0 8px}
.pl-path{position:absolute;left:0;right:0;top:0;height:100%;pointer-events:none}
.pl-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:end;position:relative;z-index:1}
.pl-step{position:relative;border:1px solid var(--line);border-radius:18px;background:var(--card);padding:18px 18px 16px;transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
.pl-step:hover{transform:translateY(-4px);border-color:var(--line2)}
.pl-step.below{opacity:.62}
.pl-step.current{border-color:rgba(74,222,128,.5);box-shadow:0 0 0 1px rgba(74,222,128,.25),0 24px 50px -30px rgba(74,222,128,.5)}
.pl-step.next{border-color:rgba(240,180,41,.6);box-shadow:0 30px 60px -32px rgba(240,180,41,.7)}
.pl-step.next .pl-cta{animation:pl-pulse 2.4s ease-out infinite}
.pl-step.founder{background:linear-gradient(var(--card),var(--card)) padding-box,linear-gradient(120deg,rgba(240,180,41,.15),var(--au),rgba(255,212,102,.9),rgba(240,180,41,.15)) border-box;border:1px solid transparent;background-size:100% 100%,200% 100%;animation:pl-aurora 6s linear infinite}
.pl-step.founder.current{box-shadow:0 0 0 1px rgba(240,180,41,.35),0 30px 70px -30px rgba(240,180,41,.8)}
.pl-tag{position:absolute;top:-11px;left:16px;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:7px;border:1px solid}
.pl-tag.cur{color:#4ADE80;background:#0d1a12;border-color:rgba(74,222,128,.45)}
.pl-tag.nxt{color:#111;background:var(--au);border-color:var(--au)}
.pl-name{font-size:14px;font-weight:800;color:var(--t1);letter-spacing:-.01em}
.pl-price{margin-top:8px;display:flex;align-items:baseline;gap:5px;flex-wrap:wrap}
.pl-price b{font-size:28px;font-weight:900;letter-spacing:-.04em;color:var(--t1);line-height:1}
.pl-price span{font-size:11px;color:var(--t3)}
.pl-mes{margin-top:4px;font-size:11.5px;font-weight:800;color:var(--au)}
.pl-frase{margin-top:10px;font-size:12px;color:var(--t2);line-height:1.5;min-height:36px}
.pl-list{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:5px}
.pl-list li{font-size:11.5px;color:var(--t2);display:flex;gap:7px;align-items:flex-start}
.pl-list li i{font-style:normal;color:#4ADE80;font-weight:900}
.pl-cta{position:relative;overflow:hidden;display:block;margin-top:14px;text-align:center;padding:11px 12px;border-radius:12px;font-weight:900;font-size:12.5px;text-decoration:none;color:#111;background:linear-gradient(135deg,var(--au2),var(--au) 60%,#D89A12);transition:transform .15s ease,filter .15s ease}
.pl-cta:hover{transform:translateY(-1px);filter:brightness(1.06)}
.pl-cta::after{content:'';position:absolute;top:0;bottom:0;width:38%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);animation:pl-shine 3.2s ease-in-out infinite}
.pl-cta.ghost{background:transparent;color:var(--t1);border:1px solid var(--line2)}
.pl-cta.ghost::after{display:none}
.pl-stay{margin-top:14px;font-size:12px;font-weight:800;color:#4ADE80}
.pl-incl{margin-top:14px;font-size:11.5px;color:var(--t4)}
.pl-reco{margin-top:22px;border-radius:18px;padding:20px 22px;border:1px solid var(--line);background:var(--card);display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}
.pl-reco.urgent{border-color:rgba(240,180,41,.6);background:linear-gradient(90deg,rgba(240,180,41,.14),var(--card) 55%)}
.pl-reco h3{margin:0;font-size:17px;font-weight:900;letter-spacing:-.02em;color:var(--t1)}
.pl-reco p{margin:6px 0 0;font-size:13px;color:var(--t2);line-height:1.55;max-width:680px}
.pl-nums{display:flex;gap:18px;margin-top:12px;flex-wrap:wrap}
.pl-num b{display:block;font-size:20px;font-weight:900;letter-spacing:-.03em;color:var(--t1)}
.pl-num small{font-size:10.5px;color:var(--t3);font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.pl-foot{margin-top:18px;font-size:11.5px;color:var(--t3);line-height:1.65;border-top:1px solid var(--line);padding-top:14px}
.pl-foot a{color:var(--au)}
@media (max-width:980px){.pl-steps{grid-template-columns:repeat(2,1fr)}.pl-path{display:none}}
@media (max-width:560px){.pl-steps{grid-template-columns:1fr}.pl-hero-grid{grid-template-columns:1fr}.pl-reco{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.pl-in,.pl-step.founder,.pl-cta::after,.pl-step.next .pl-cta,.pl-path path{animation:none!important}}
`

/* A trilha da escada: uma linha que sobe degrau a degrau (SVG desenhado na entrada). */
function Trilha({ atual }: { atual: number }) {
  // 4 degraus: x em % do centro de cada card, y sobe 18px por degrau (os cards ficam "alinhados por baixo", a trilha faz a subida visual)
  const xs = [12.5, 37.5, 62.5, 87.5]
  const ys = [88, 66, 44, 22]
  const d = xs.map((x, i) => `${i ? 'L' : 'M'} ${x} ${ys[i]}`).join(' ')
  return (
    <svg className="pl-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="rgba(240,180,41,.22)" strokeWidth=".6" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke="#F0B429" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeLinecap="round"
        strokeDasharray="400" strokeDashoffset="400" style={{ animation: 'pl-draw 1.4s .3s ease-out forwards', opacity: .9 }}
        pathLength={400 * (Math.max(0, atual - 1) / 3)} />
    </svg>
  )
}

export default function Planos({ user }: { user: { email: string; name?: string; plan: string; expiresAt?: string | Date | null } }) {
  const [agora] = useState(() => Date.now())
  const atual = planoDe(user.plan)
  const rankAtual = RANK[(user.plan as PlanoId)] ?? 0
  const top = user.plan === 'lifetime'
  const expiresAt = user.expiresAt ? new Date(user.expiresAt) : null
  const daysLeft = expiresAt && !top ? Math.ceil((expiresAt.getTime() - agora) / 86400000) : null
  const dias = atual?.dias || null
  const inicio = expiresAt && dias ? new Date(expiresAt.getTime() - dias * 86400000) : null
  const pct = expiresAt && inicio && dias ? Math.min(100, Math.max(0, ((agora - inicio.getTime()) / (dias * 86400000)) * 100)) : null
  const rec = recomendacao(user.plan, daysLeft)
  const primeiroNome = (user.name || '').trim().split(' ')[0] || 'você'
  const mensal = planoDe('monthly')!

  return (
    <div className="pl">
      <style>{CSS}</style>

      {/* HERO — onde você está */}
      <section className={`pl-hero pl-in${top ? ' top' : ''}`} style={{ animationDelay: '0s' }}>
        <div className="pl-hero-grid">
          <div>
            <div className="pl-eyebrow">{top ? 'Membro fundador' : 'Seu plano'}</div>
            <h2 className="pl-title">
              {top ? <>🏆 <em>Fundador Vitalício</em></> : atual ? <>{atual.nome} <em>Oráculo</em></> : <>Sem plano <em>ativo</em></>}
            </h2>
            <p className="pl-sub">
              {top
                ? <>Acesso a tudo, para sempre, com todas as atualizações incluídas. Não existe degrau acima deste, {primeiroNome}.</>
                : atual && expiresAt
                  ? <>{fmt(atual.preco)}{atual.ciclo}. {daysLeft != null && daysLeft >= 0 ? <>{user.plan === 'monthly' ? 'Renova' : 'Vence'} em <b style={{ color: 'var(--t1)' }}>{expiresAt.toLocaleDateString('pt-BR')}</b>.</> : <>Venceu em {expiresAt.toLocaleDateString('pt-BR')}.</>} A escada abaixo mostra até onde dá pra subir.</>
                  : <>Escolha um degrau abaixo pra liberar o Oráculo completo.</>}
            </p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {top && <span className="pl-pill ok">✓ sem mensalidade</span>}
              {top && <span className="pl-pill ok">✓ atualizações incluídas</span>}
              {!top && daysLeft != null && daysLeft >= 0 && daysLeft <= 7 && <span className="pl-pill warn">⏳ {daysLeft} dia{daysLeft === 1 ? '' : 's'} pro vencimento</span>}
              {!top && daysLeft != null && daysLeft > 7 && <span className="pl-pill ok">✓ ativo</span>}
            </div>
          </div>
          {pct != null && (
            <div className="pl-ring" style={{ '--p': Math.round(pct) } as unknown as React.CSSProperties} aria-label={`ciclo ${Math.round(pct)}% usado`}>
              <div><b>{daysLeft != null && daysLeft >= 0 ? daysLeft : 0}</b><small>dias</small></div>
            </div>
          )}
          {top && (
            <div className="pl-ring" style={{ '--p': 100 } as unknown as React.CSSProperties} aria-label="acesso vitalício">
              <div><b>∞</b><small>vitalício</small></div>
            </div>
          )}
        </div>
      </section>

      {/* A ESCADA */}
      <div className="pl-stairs">
        <Trilha atual={rankAtual} />
        <div className="pl-steps">
          {PLANOS.map((p, i) => {
            const r = RANK[p.id]
            const ehAtual = p.id === user.plan
            const acima = r > rankAtual
            const recomendado = rec.alvo?.id === p.id
            const cls = ['pl-step', 'pl-in', ehAtual ? 'current' : '', recomendado ? 'next' : '', !acima && !ehAtual ? 'below' : '', p.id === 'lifetime' ? 'founder' : ''].filter(Boolean).join(' ')
            return (
              <div key={p.id} className={cls} style={{ animationDelay: `${.12 + i * .09}s`, marginTop: `${(3 - i) * 18}px` }}>
                {ehAtual && <span className="pl-tag cur">você está aqui</span>}
                {!ehAtual && recomendado && <span className="pl-tag nxt">próximo degrau</span>}
                <div className="pl-name">{p.id === 'lifetime' ? '🏆 ' : ''}{p.nome}</div>
                <div className="pl-price"><b>{fmt(p.preco)}</b><span>{p.ciclo}</span></div>
                {p.porMes && p.id !== 'monthly' && <div className="pl-mes">≈ {fmt(Math.round(p.porMes * 100) / 100)}/mês</div>}
                {p.id === 'monthly' && <div className="pl-mes" style={{ color: 'var(--t3)' }}>{fmt(mensal.preco * 12)} por ano</div>}
                <div className="pl-frase">{p.frase}</div>
                <ul className="pl-list">{p.destaques.map(d => <li key={d}><i>✓</i>{d}</li>)}</ul>
                {ehAtual ? <div className="pl-stay">✓ Você está aqui</div>
                  : acima ? <a className={`pl-cta${recomendado ? '' : ' ghost'}`} href={checkout(p.id as Exclude<PlanoId, 'free'>, user.email)} target="_blank" rel="noreferrer">
                      {p.id === 'lifetime' ? 'Virar Fundador' : `Subir para o ${p.nome}`}
                    </a>
                  : <div className="pl-incl">já incluso no seu plano</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* O PRÓXIMO DEGRAU, com os números */}
      <section className={`pl-reco pl-in${rec.urgente ? ' urgent' : ''}`} style={{ animationDelay: '.5s' }}>
        <div>
          <h3>{rec.urgente ? '⏳ ' : rec.alvo ? '⬆️ ' : '🏆 '}{rec.titulo}</h3>
          <p>{rec.texto}</p>
          {rec.alvo && rec.alvo.id !== 'lifetime' && (
            <div className="pl-nums">
              <div className="pl-num"><b>{fmt(mensal.preco * 12)}</b><small>12 meses no mensal</small></div>
              <div className="pl-num"><b>{fmt(rec.alvo.preco)}</b><small>{rec.alvo.nome} por ano</small></div>
              <div className="pl-num"><b style={{ color: 'var(--au)' }}>{fmt(mensal.preco * 12 - rec.alvo.preco)}</b><small>a menos por ano</small></div>
            </div>
          )}
          {rec.alvo && rec.alvo.id === 'lifetime' && atual && (
            <div className="pl-nums">
              <div className="pl-num"><b>{fmt(atual.preco)}</b><small>{atual.nome} por ciclo</small></div>
              <div className="pl-num"><b>{fmt(rec.alvo.preco)}</b><small>Fundador, uma vez só</small></div>
              <div className="pl-num"><b style={{ color: 'var(--au)' }}>{atual.dias ? `${Math.ceil(rec.alvo.preco / (atual.preco / (atual.dias / 30)))} meses` : '—'}</b><small>pra se pagar</small></div>
            </div>
          )}
        </div>
        {rec.alvo && (
          <a className="pl-cta" style={{ marginTop: 0, minWidth: 220 }} href={checkout(rec.alvo.id as Exclude<PlanoId, 'free'>, user.email)} target="_blank" rel="noreferrer">
            {rec.alvo.id === 'lifetime' ? 'Virar Fundador' : `Subir para o ${rec.alvo.nome}`} · {fmt(rec.alvo.preco)}
          </a>
        )}
      </section>

      <div className="pl-foot pl-in" style={{ animationDelay: '.6s' }}>
        Como funciona a troca: o pagamento é na Greenn, <b style={{ color: 'var(--t2)' }}>com o mesmo e-mail desta conta ({user.email})</b>. O Oráculo reconhece a compra e muda seu plano sozinho em poucos minutos, somando os dias que ainda faltavam do plano atual.
        Se você tinha assinatura recorrente, nossa equipe cancela a anterior pra não cobrar duas vezes. Dúvida: <a href="mailto:atendimento@oraculojf.com.br">atendimento@oraculojf.com.br</a>.
      </div>
    </div>
  )
}
