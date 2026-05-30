import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORÁCULO — Inteligência de Mercado Amazon FBA Brasil',
  description: 'Encontre produtos vencedores no Amazon FBA antes da concorrência. Dados reais, atualizados diariamente. 8 ferramentas especializadas + Agente IA.',
  openGraph: {
    title: 'ORÁCULO Amazon Intelligence',
    description: 'Veja o que o mercado esconde. 40x mais rápido que pesquisa manual.',
    images: ['/og-image.png'],
  },
}

const LINKS = {
  monthly:  'https://payfast.greenn.com.br/pm36pq4/offer/B0febG',
  biannual: 'https://payfast.greenn.com.br/pm36pq4/offer/rpgHFd',
  annual:   'https://payfast.greenn.com.br/pm36pq4/offer/WBkId3',
}

const FAQS = [
  { q:'O acesso é imediato após o pagamento?',
    a:'Sim. Você recebe as credenciais por e-mail em minutos após a confirmação. Sem espera, sem burocracia.' },
  { q:'Preciso instalar algum software?',
    a:'Não. O Oráculo é 100% web — acesse pelo navegador em qualquer dispositivo. A extensão Chrome é opcional e complementar.' },
  { q:'Os dados são atualizados com que frequência?',
    a:'Diariamente. Mais Vendidos, Em Alta e Recém Adicionados são atualizados todo dia. O Agente IA gera novas análises a cada 24h.' },
  { q:'A extensão Chrome está incluída no plano?',
    a:'Sim. Todos os planos incluem a extensão sem custo extra. Basta instalar e usar sua chave de acesso.' },
  { q:'Posso cancelar quando quiser?',
    a:'Sim. Planos mensais podem ser cancelados a qualquer momento. Planos semestrais e anuais garantem acesso pelo período contratado.' },
  { q:'O Agente IA tem limite de uso?',
    a:'Não. Análises ilimitadas em todos os planos. Sem cota, sem créditos — use quanto quiser.' },
  { q:'Funciona para qual marketplace?',
    a:'Amazon Brasil (amazon.com.br). Foco total no mercado brasileiro, com dados específicos para o contexto local.' },
]

export default function PlanosPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        :root{
          --bg:#020209;
          --s1:#06061A;--s2:#0A0A1E;--s3:#0E0E26;
          --bd:rgba(255,255,255,0.055);
          --bdg:rgba(240,180,41,0.14);
          --gold:#F0B429;--gold2:#C8960F;
          --glow:rgba(240,180,41,0.12);
          --text:#E2E2F0;--mut:#56566E;--mut2:#8E8EA8;
          --green:#00C896;--red:#FF4D6D;--blue:#5B9EF0;
        }
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden}
        a{text-decoration:none;color:inherit}
        ::selection{background:rgba(240,180,41,0.18)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#1a1a30;border-radius:2px}

        /* ── ANIMATIONS ── */
        @keyframes scanBeam{
          0%{transform:translateY(-5%);opacity:0}8%{opacity:0.8}
          90%{opacity:0.8}100%{transform:translateY(120vh);opacity:0}
        }
        @keyframes gridDrift{
          from{background-position:0 0}to{background-position:40px 40px}
        }
        @keyframes floatA{
          0%,100%{transform:translateY(0) rotate(-1deg)}
          50%{transform:translateY(-12px) rotate(1deg)}
        }
        @keyframes floatB{
          0%,100%{transform:translateY(0) rotate(1deg)}
          50%{transform:translateY(-8px) rotate(-0.5deg)}
        }
        @keyframes floatC{
          0%,100%{transform:translateY(-4px)}
          50%{transform:translateY(8px)}
        }
        @keyframes fadeUp{
          from{opacity:0;transform:translateY(36px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes glowPulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
        @keyframes borderGlow{
          0%,100%{box-shadow:0 0 28px rgba(240,180,41,0.14),inset 0 0 28px rgba(240,180,41,0.02)}
          50%{box-shadow:0 0 52px rgba(240,180,41,0.28),inset 0 0 40px rgba(240,180,41,0.05)}
        }
        @keyframes shimmerBar{
          0%{transform:translateX(-100%)}100%{transform:translateX(200%)}
        }
        @keyframes revealRight{
          from{clip-path:inset(0 100% 0 0);opacity:0}
          to{clip-path:inset(0 0% 0 0);opacity:1}
        }
        @keyframes badgePulse{
          0%,100%{box-shadow:0 0 0 0 rgba(240,180,41,0.3)}
          50%{box-shadow:0 0 0 6px rgba(240,180,41,0)}
        }
        @keyframes mockupFloat{
          0%,100%{transform:rotateX(7deg) rotateY(-2deg) translateY(0)}
          50%{transform:rotateX(7deg) rotateY(-2deg) translateY(-10px)}
        }
        @keyframes dataRowIn{
          from{opacity:0;transform:translateX(-12px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes lineGrow{from{width:0}to{width:100%}}

        /* ── NAV ── */
        .nav{
          position:fixed;top:0;left:0;right:0;z-index:200;
          height:60px;display:flex;align-items:center;justify-content:space-between;
          padding:0 40px;
          background:rgba(2,2,9,0.82);
          backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
          border-bottom:1px solid var(--bd);
        }
        .nav-logo{display:flex;align-items:center;gap:10px}
        .nav-eye{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(240,180,41,0.22)}
        .nav-eye-in{width:8px;height:5px;border-radius:50%;background:var(--gold);box-shadow:0 0 5px var(--gold)}
        .nav-wm{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;letter-spacing:4px;color:var(--text)}
        .nav-wm em{color:var(--gold);font-style:normal}
        .nav-r{display:flex;align-items:center;gap:8px}
        .btn-ghost{padding:7px 18px;border-radius:4px;border:1px solid var(--bd);color:var(--mut2);font-size:13px;font-weight:500;transition:all .2s}
        .btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
        .btn-gold{padding:8px 22px;border-radius:4px;background:var(--gold);color:#000;font-size:13px;font-weight:700;letter-spacing:.3px;transition:all .2s;box-shadow:0 2px 16px rgba(240,180,41,.25)}
        .btn-gold:hover{background:#FFD055;box-shadow:0 4px 28px rgba(240,180,41,.42)}

        /* ── HERO ── */
        .hero{
          min-height:100vh;padding-top:60px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          position:relative;overflow:hidden;padding-bottom:60px;
        }
        .hero-bg{
          position:absolute;inset:0;
          background:
            radial-gradient(ellipse 100% 60% at 50% -10%,rgba(240,180,41,0.08) 0%,transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 75%,rgba(91,158,240,0.05) 0%,transparent 60%),
            radial-gradient(ellipse 50% 40% at 10% 80%,rgba(0,200,150,0.03) 0%,transparent 60%),
            #020209;
        }
        .hero-grid{
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);
          background-size:40px 40px;
          animation:gridDrift 12s linear infinite;
          mask-image:radial-gradient(ellipse 85% 70% at 50% 40%,black 15%,transparent 72%);
          -webkit-mask-image:radial-gradient(ellipse 85% 70% at 50% 40%,black 15%,transparent 72%);
        }
        .hero-scan{
          position:absolute;left:0;right:0;height:1.5px;
          background:linear-gradient(90deg,transparent 0%,rgba(240,180,41,0.35) 20%,rgba(255,248,200,0.55) 50%,rgba(240,180,41,0.35) 80%,transparent 100%);
          animation:scanBeam 8s ease-in-out infinite;
          pointer-events:none;z-index:1;
        }
        .hero-vig{
          position:absolute;inset:0;
          background:radial-gradient(ellipse at center,transparent 30%,rgba(2,2,9,0.85) 100%);
          pointer-events:none;
        }
        .hero-in{
          position:relative;z-index:2;
          display:flex;flex-direction:column;align-items:center;
          text-align:center;padding:0 24px;
        }
        .hero-pill{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 16px;border-radius:100px;
          border:1px solid var(--bdg);background:rgba(240,180,41,0.04);
          font-family:'JetBrains Mono',monospace;
          font-size:10.5px;color:var(--gold);letter-spacing:1.5px;
          margin-bottom:30px;
          animation:fadeUp .8s ease both;
        }
        .hero-pill-dot{
          width:6px;height:6px;border-radius:50%;
          background:var(--green);box-shadow:0 0 8px var(--green);
          animation:glowPulse 2s ease infinite;
        }
        .hero-h1{
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(80px,14vw,164px);
          line-height:.86;letter-spacing:-1px;
          text-shadow:0 0 120px rgba(240,180,41,0.1),0 4px 0 rgba(0,0,0,.7);
          animation:fadeUp .8s ease .1s both;
          margin-bottom:6px;
        }
        .hero-h1-w1{color:#fff;display:block}
        .hero-h1-w2{
          display:block;
          background:linear-gradient(135deg,#FFE880 0%,#F0B429 35%,#D49010 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;filter:drop-shadow(0 0 40px rgba(240,180,41,0.45));
        }
        .hero-h1-w3{
          display:block;
          background:linear-gradient(135deg,#FFFFFF 0%,rgba(180,180,210,0.55) 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .hero-sub{
          font-size:18px;color:var(--mut2);
          max-width:500px;line-height:1.68;
          margin-top:24px;margin-bottom:38px;
          animation:fadeUp .8s ease .22s both;
        }
        .hero-sub strong{color:var(--text);font-weight:500}
        .hero-ctas{
          display:flex;align-items:center;justify-content:center;
          gap:12px;flex-wrap:wrap;
          animation:fadeUp .8s ease .34s both;
        }
        .cta-main{
          display:inline-flex;align-items:center;gap:9px;
          padding:16px 38px;border-radius:5px;
          background:var(--gold);color:#000;
          font-weight:700;font-size:15px;letter-spacing:.5px;
          box-shadow:0 4px 32px rgba(240,180,41,.38);
          transition:all .2s;
        }
        .cta-main:hover{background:#FFD055;transform:translateY(-2px);box-shadow:0 8px 48px rgba(240,180,41,.5)}
        .cta-ghost{
          display:inline-flex;align-items:center;gap:8px;
          padding:15px 28px;border-radius:5px;
          border:1px solid rgba(255,255,255,.1);color:var(--text);
          font-size:15px;font-weight:500;transition:all .2s;
        }
        .cta-ghost:hover{border-color:var(--gold);color:var(--gold)}

        /* Hero floating data badges */
        .hero-badges{
          position:relative;z-index:2;
          width:100%;max-width:900px;
          height:100px;margin-top:52px;
          animation:fadeIn .8s ease .55s both;
        }
        .hbadge{
          position:absolute;
          padding:10px 16px;border-radius:10px;
          background:rgba(6,6,26,0.92);
          border:1px solid rgba(240,180,41,0.18);
          backdrop-filter:blur(12px);
          font-family:'JetBrains Mono',monospace;
          font-size:11px;
          box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 0 1px rgba(240,180,41,0.06);
          white-space:nowrap;
        }
        .hbadge-a{left:2%;top:10px;animation:floatA 7s ease infinite}
        .hbadge-b{right:4%;top:0;animation:floatB 8s ease infinite .5s}
        .hbadge-c{left:30%;bottom:-10px;animation:floatC 6s ease infinite 1s}
        .hbadge-label{color:var(--mut);font-size:9px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
        .hbadge-val{font-size:13px;font-weight:500}
        .hbadge-tag{
          display:inline-block;padding:2px 8px;border-radius:3px;
          font-size:9px;font-weight:700;letter-spacing:.5px;margin-left:6px;
          background:rgba(0,200,150,0.12);color:var(--green);
        }
        .hbadge-tag-gold{background:rgba(240,180,41,0.12);color:var(--gold)}

        /* Mockup stage */
        .mockup-stage{
          position:relative;z-index:2;
          margin-top:70px;perspective:1100px;
          animation:fadeUp .8s ease .65s both;
        }
        .mockup-shell{
          width:min(920px,88vw);border-radius:10px;
          border:1px solid rgba(255,255,255,0.07);
          background:#04041A;overflow:hidden;
          transform:rotateX(7deg) rotateY(-2deg);
          box-shadow:0 60px 120px rgba(0,0,0,.75),0 0 0 1px rgba(240,180,41,0.05),inset 0 1px 0 rgba(255,255,255,.04);
          animation:mockupFloat 8s ease infinite;
          transition:transform .5s ease;
        }
        .mockup-shell:hover{animation:none;transform:rotateX(0) rotateY(0);transition:transform .5s ease}
        .mock-chrome{display:flex;align-items:center;gap:7px;padding:9px 14px;background:#03030F;border-bottom:1px solid rgba(255,255,255,.05)}
        .dot{width:10px;height:10px;border-radius:50%}.dot-r{background:#FF5F56}.dot-y{background:#FFBD2E}.dot-g{background:#27C93F}
        .mock-url{flex:1;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--mut);letter-spacing:.8px}
        .mock-body{display:flex;height:320px}
        .mock-side{width:50px;background:#030310;border-right:1px solid rgba(255,255,255,.04);padding:14px 0;display:flex;flex-direction:column;align-items:center;gap:12px}
        .mock-ico{width:26px;height:26px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px}
        .mock-ico-on{background:rgba(240,180,41,0.12)}
        .mock-panel{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .mock-tabs{display:flex;padding:0 14px;background:#03030E;border-bottom:1px solid rgba(255,255,255,.04)}
        .mock-tab{padding:9px 12px;font-size:10px;font-weight:500;color:var(--mut);white-space:nowrap}
        .mock-tab-on{color:var(--gold);border-bottom:1.5px solid var(--gold)}
        .mock-th{display:grid;grid-template-columns:2fr 1fr 1.1fr 1fr 1fr;padding:7px 14px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--mut);text-transform:uppercase;background:rgba(255,255,255,.015);border-bottom:1px solid rgba(255,255,255,.03)}
        .mock-row{display:grid;grid-template-columns:2fr 1fr 1.1fr 1fr 1fr;padding:7px 14px;border-bottom:1px solid rgba(255,255,255,.025);align-items:center;opacity:0;animation:dataRowIn .4s ease forwards}
        .mock-row:hover{background:rgba(240,180,41,.025)}
        .mock-row:nth-child(1){animation-delay:.8s}.mock-row:nth-child(2){animation-delay:.95s}.mock-row:nth-child(3){animation-delay:1.1s}.mock-row:nth-child(4){animation-delay:1.25s}.mock-row:nth-child(5){animation-delay:1.4s}.mock-row:nth-child(6){animation-delay:1.55s}
        .mp{display:flex;align-items:center;gap:7px;font-size:10.5px;color:var(--text)}
        .mb{width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .mprice{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--gold)}
        .mpill{display:inline-block;padding:2px 6px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:8.5px;font-weight:500}
        .pill-g{background:rgba(0,200,150,.1);color:var(--green)}
        .pill-o{background:rgba(240,180,41,.1);color:var(--gold)}
        .pill-b{background:rgba(91,158,240,.1);color:var(--blue)}
        .pill-r{background:rgba(255,77,109,.1);color:var(--red)}
        .mtrend{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--green)}
        .mstar{font-size:10px;color:var(--gold)}
        .mock-glow{position:absolute;bottom:-60px;left:50%;transform:translateX(-50%);width:500px;height:130px;background:radial-gradient(ellipse,rgba(240,180,41,.1),transparent 70%);filter:blur(28px);pointer-events:none}

        /* ── STRIP ── */
        .strip{border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);background:var(--s1);padding:18px 0;overflow:hidden}
        .strip-track{display:flex;width:max-content;animation:ticker 32s linear infinite}
        .strip-item{display:flex;align-items:center;gap:10px;padding:0 44px;white-space:nowrap;border-right:1px solid var(--bd)}
        .strip-n{font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--gold);letter-spacing:1px}
        .strip-l{font-size:12.5px;color:var(--mut2);letter-spacing:.3px}

        /* ── PROBLEM ── */
        .problem-sec{padding:100px 24px;background:var(--bg)}
        .problem-in{max-width:1100px;margin:0 auto}
        .sec-tag{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:2px;color:var(--gold);opacity:.7;text-transform:uppercase;margin-bottom:14px}
        .sec-h{font-family:'Bebas Neue',sans-serif;font-size:clamp(44px,6.5vw,78px);line-height:.93;letter-spacing:1px;color:#fff;margin-bottom:16px}
        .sec-h em{color:var(--gold);font-style:normal}
        .sec-p{font-size:17px;color:var(--mut2);max-width:540px;line-height:1.7}
        .compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin-top:52px;border-radius:12px;overflow:hidden;background:var(--bd)}
        .compare-col{padding:36px 32px;position:relative;overflow:hidden}
        .compare-bad{background:rgba(255,77,109,0.04)}
        .compare-bad::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,77,109,0.5),transparent)}
        .compare-good{background:rgba(0,200,150,0.03)}
        .compare-good::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(240,180,41,0.6),transparent)}
        .compare-header{font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;display:flex;align-items:center;gap:10px}
        .compare-badge-bad{padding:3px 10px;border-radius:3px;background:rgba(255,77,109,0.12);color:var(--red);font-size:10px;letter-spacing:1px}
        .compare-badge-good{padding:3px 10px;border-radius:3px;background:rgba(240,180,41,0.1);color:var(--gold);font-size:10px;letter-spacing:1px}
        .compare-item{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--bd)}
        .compare-item:last-child{border-bottom:none}
        .compare-ico{font-size:14px;flex-shrink:0;margin-top:1px}
        .compare-text{font-size:14.5px;color:var(--mut2);line-height:1.5}
        .compare-text strong{color:var(--text);font-weight:500}

        /* ── SECTION BASE ── */
        .sec{padding:100px 24px;position:relative}
        .sec-in{max-width:1100px;margin:0 auto}

        /* ── FEATURES SPOTLIGHT ── */
        .feat-spot{display:flex;flex-direction:column;gap:1px;margin-top:56px;border-radius:12px;overflow:hidden;background:var(--bd)}
        .feat-row{
          display:grid;grid-template-columns:1fr 1fr;gap:0;
          background:var(--s1);
        }
        .feat-row-rev .feat-copy{order:2}.feat-row-rev .feat-visual{order:1}
        .feat-copy{padding:48px 44px;display:flex;flex-direction:column;justify-content:center}
        .feat-num{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--gold);opacity:.45;letter-spacing:1px;margin-bottom:12px}
        .feat-icon{font-size:36px;margin-bottom:16px}
        .feat-title{
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(28px,3vw,40px);color:var(--text);
          line-height:1;letter-spacing:.5px;margin-bottom:12px;
        }
        .feat-new{display:inline-block;background:var(--gold);color:#000;font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:1px;padding:2px 6px;border-radius:2px;margin-left:8px;vertical-align:middle}
        .feat-desc{font-size:15px;color:var(--mut2);line-height:1.7;max-width:360px;margin-bottom:20px}
        .feat-pills{display:flex;flex-wrap:wrap;gap:7px}
        .feat-pill{padding:4px 12px;border-radius:100px;border:1px solid var(--bd);font-size:12px;color:var(--mut2);font-weight:500}
        .feat-pill-on{border-color:var(--bdg);color:var(--gold);background:rgba(240,180,41,.04)}
        .feat-visual{
          background:rgba(0,0,0,0.3);
          border-left:1px solid var(--bd);
          padding:32px;
          display:flex;align-items:center;justify-content:center;
          min-height:280px;position:relative;overflow:hidden;
        }
        .feat-row-rev .feat-visual{border-left:none;border-right:1px solid var(--bd)}
        .feat-visual::before{
          content:'';position:absolute;top:-80px;right:-80px;
          width:240px;height:240px;border-radius:50%;
          background:radial-gradient(circle,rgba(240,180,41,0.05),transparent 70%);
          pointer-events:none;
        }
        /* Mini data table visual */
        .mini-table{width:100%;font-family:'JetBrains Mono',monospace;font-size:10px}
        .mt-head{display:flex;justify-content:space-between;padding:6px 0;color:var(--mut);letter-spacing:.8px;border-bottom:1px solid var(--bd);margin-bottom:4px}
        .mt-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.025)}
        .mt-name{color:var(--text);font-size:9.5px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .mt-price{color:var(--gold)}
        .mt-trend{color:var(--green)}
        .mt-bsr{color:var(--mut2)}
        /* Extension visual */
        .ext-card{
          background:rgba(4,4,20,.95);border:1px solid rgba(240,180,41,.18);
          border-radius:10px;padding:18px 20px;width:220px;
          font-family:'JetBrains Mono',monospace;font-size:10px;
          box-shadow:0 16px 48px rgba(0,0,0,.5);
        }
        .ext-header{font-size:9px;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:6px}
        .ext-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)}
        .ext-key{color:var(--mut)}
        .ext-val{color:var(--text);font-weight:500}
        .ext-val-green{color:var(--green)}
        .ext-val-gold{color:var(--gold)}
        /* Financial visual */
        .fin-card{background:rgba(4,4,20,.95);border:1px solid var(--bd);border-radius:10px;padding:20px;width:240px;font-size:13px}
        .fin-title{font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--mut2);margin-bottom:14px}
        .fin-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd)}
        .fin-label{font-size:12px;color:var(--mut2)}
        .fin-val{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:var(--text)}
        .fin-highlight{background:rgba(0,200,150,.06);border-color:rgba(0,200,150,.12)}
        .fin-highlight .fin-label{color:var(--green)}
        .fin-highlight .fin-val{color:var(--green);font-size:16px}

        /* ── HOW ── */
        .how-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:56px;position:relative}
        .how-steps::before{content:'';position:absolute;top:27px;left:calc(16.66% + 27px);right:calc(16.66% + 27px);height:1px;background:linear-gradient(90deg,var(--gold) 0%,rgba(240,180,41,.08) 100%)}
        .how-step{text-align:center}
        .how-num{width:54px;height:54px;border-radius:50%;border:1px solid var(--gold);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--gold);background:rgba(240,180,41,.05);box-shadow:0 0 20px rgba(240,180,41,.08);position:relative;z-index:1}
        .how-t{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text);margin-bottom:10px}
        .how-d{font-size:14px;color:var(--mut2);line-height:1.65}

        /* ── PRICING ── */
        .price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:48px;border-radius:12px;overflow:hidden;background:var(--bd);box-shadow:0 40px 80px rgba(0,0,0,.5)}
        .price-card{background:var(--s1);padding:40px 32px;position:relative}
        .price-card-hot{background:#09091E;animation:borderGlow 4s ease infinite}
        .price-pop{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--gold);color:#000;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 14px;border-radius:0 0 8px 8px;white-space:nowrap}
        .price-label{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:22px}
        .price-label-hot{color:var(--gold)}
        .price-amt{display:flex;align-items:flex-start;gap:2px;margin-bottom:4px}
        .price-brl{font-size:17px;font-weight:600;color:var(--mut2);margin-top:10px}
        .price-brl-hot{color:var(--gold)}
        .price-big{font-family:'Bebas Neue',sans-serif;font-size:72px;line-height:1;letter-spacing:-1px;color:var(--text)}
        .price-big-hot{color:var(--gold)}
        .price-period{font-size:13px;color:var(--mut);margin-bottom:4px}
        .price-eq{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--mut);margin-bottom:24px}
        .price-eq em{color:var(--green);font-style:normal}
        .price-div{height:1px;background:var(--bd);margin:18px 0}
        .price-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px}
        .price-list li{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:var(--mut2);line-height:1.4}
        .price-list li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0;font-size:12px;margin-top:1px}
        .price-btn{display:block;width:100%;padding:14px;text-align:center;border-radius:5px;font-weight:700;font-size:15px;letter-spacing:.4px;cursor:pointer;transition:all .2s}
        .price-btn-line{border:1px solid rgba(255,255,255,.1);color:var(--text)}
        .price-btn-line:hover{border-color:var(--gold);color:var(--gold)}
        .price-btn-fill{background:var(--gold);color:#000;border:none;box-shadow:0 4px 20px rgba(240,180,41,.25)}
        .price-btn-fill:hover{background:#FFD055;box-shadow:0 8px 36px rgba(240,180,41,.4);transform:translateY(-1px)}

        /* ── FAQ ── */
        .faq-bg{background:var(--s1);border-top:1px solid var(--bd)}
        .faq-list{margin-top:44px;border:1px solid var(--bd);border-radius:8px;overflow:hidden}
        details.faq{border-bottom:1px solid var(--bd)}
        details.faq:last-child{border-bottom:none}
        summary.faq-q{padding:20px 26px;font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:600;letter-spacing:.3px;color:var(--text);cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;transition:color .2s}
        summary.faq-q::-webkit-details-marker{display:none}
        summary.faq-q:hover{color:var(--gold)}
        summary.faq-q::after{content:'+';font-size:22px;color:var(--gold);font-weight:300;flex-shrink:0;margin-left:16px}
        details[open] summary.faq-q{color:var(--gold)}
        details[open] summary.faq-q::after{content:'−'}
        .faq-a{padding:0 26px 20px;font-size:15px;color:var(--mut2);line-height:1.72;max-width:680px}

        /* ── FINAL CTA ── */
        .fcta{text-align:center;padding:120px 24px;position:relative;overflow:hidden}
        .fcta-bg{position:absolute;inset:0;background:radial-gradient(ellipse 70% 90% at 50% 50%,rgba(240,180,41,0.065),transparent 65%)}
        .fcta-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 80% 90% at 50% 50%,black,transparent);-webkit-mask-image:radial-gradient(ellipse 80% 90% at 50% 50%,black,transparent)}
        .fcta-in{position:relative;z-index:1}
        .fcta-h{font-family:'Bebas Neue',sans-serif;font-size:clamp(52px,8.5vw,112px);line-height:.9;color:#fff;margin-bottom:22px;text-shadow:0 0 80px rgba(240,180,41,0.12)}
        .fcta-h em{color:var(--gold);font-style:normal}
        .fcta-sub{font-size:17px;color:var(--mut2);max-width:420px;margin:0 auto 36px;line-height:1.65}

        /* ── FOOTER ── */
        .footer{border-top:1px solid var(--bd);padding:28px 40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
        .footer-copy{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--mut);letter-spacing:.5px}
        .footer-links{display:flex;gap:22px}
        .footer-lnk{font-size:13px;color:var(--mut);transition:color .2s}
        .footer-lnk:hover{color:var(--gold)}

        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .compare-grid{grid-template-columns:1fr}
          .feat-row{grid-template-columns:1fr}
          .feat-row-rev .feat-copy,.feat-row-rev .feat-visual{order:unset}
          .feat-visual{border-left:none;border-top:1px solid var(--bd);min-height:200px}
          .feat-row-rev .feat-visual{border-right:none;border-top:1px solid var(--bd)}
          .how-steps{grid-template-columns:1fr}.how-steps::before{display:none}
          .price-grid{grid-template-columns:1fr}
          .hero-badges{display:none}
        }
        @media(max-width:768px){
          .nav{padding:0 20px}.btn-ghost{display:none}
          .mockup-stage{display:none}
          .footer{flex-direction:column;text-align:center}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-eye"><div className="nav-eye-in" /></div>
          <span className="nav-wm">ORÁC<em>U</em>LO</span>
        </a>
        <div className="nav-r">
          <a href="/login" className="btn-ghost">Entrar</a>
          <a href={LINKS.biannual} className="btn-gold">Começar Agora</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-scan" />
        <div className="hero-vig" />

        <div className="hero-in">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            SISTEMA ATIVO · AMAZON FBA BRASIL
          </div>

          <h1 className="hero-h1">
            <span className="hero-h1-w1">VEJA O QUE</span>
            <span className="hero-h1-w2">NINGUÉM</span>
            <span className="hero-h1-w3">VÊ</span>
          </h1>

          <p className="hero-sub">
            Inteligência de mercado em tempo real para <strong>Amazon FBA Brasil</strong>.
            Encontre produtos vencedores <strong>40x mais rápido</strong> que qualquer concorrente —
            com dados reais, atualizados diariamente.
          </p>

          <div className="hero-ctas">
            <a href={LINKS.biannual} className="cta-main">Começar Agora →</a>
            <a href="/login" className="cta-ghost">Já tenho conta</a>
          </div>
        </div>

        {/* Floating data badges */}
        <div className="hero-badges">
          <div className="hbadge hbadge-a">
            <div className="hbadge-label">Em Alta · BSR</div>
            <div className="hbadge-val" style={{color:'#E0E0EE'}}>
              Suporte Pescoço <span className="hbadge-tag">+312%</span>
            </div>
          </div>
          <div className="hbadge hbadge-b">
            <div className="hbadge-label">Genérico · Margem</div>
            <div className="hbadge-val" style={{color:'#E0E0EE'}}>
              Kit Skincare <span className="hbadge-tag-gold">62% margem</span>
            </div>
          </div>
          <div className="hbadge hbadge-c">
            <div className="hbadge-label">Mais Vendido · Hoje</div>
            <div className="hbadge-val" style={{color:'#E0E0EE'}}>
              1.247 produtos analisados <span className="hbadge-tag">ao vivo</span>
            </div>
          </div>
        </div>

        {/* 3D Dashboard Mockup */}
        <div className="mockup-stage" style={{position:'relative'}}>
          <div className="mockup-shell">
            <div className="mock-chrome">
              <div className="dot dot-r" /><div className="dot dot-y" /><div className="dot dot-g" />
              <span className="mock-url">app.oraculojf.com.br — Mais Vendidos</span>
            </div>
            <div className="mock-body">
              <div className="mock-side">
                {['🏆','🆕','🔥','💊','🔍'].map((ic, i) => (
                  <div key={i} className={`mock-ico ${i === 0 ? 'mock-ico-on' : ''}`}>{ic}</div>
                ))}
              </div>
              <div className="mock-panel">
                <div className="mock-tabs">
                  {['Mais Vendidos','Em Alta','Recém Add.','Genéricos','Rival'].map((t, i) => (
                    <span key={t} className={`mock-tab ${i === 0 ? 'mock-tab-on' : ''}`}>{t}</span>
                  ))}
                </div>
                <div className="mock-th">
                  <span>PRODUTO</span><span>PREÇO</span><span>STATUS</span><span>AVAL.</span><span>VAR.</span>
                </div>
                {[
                  {n:'Suporte Pescoço Elástico',p:'R$24,90',s:'🔥 Em Alta',pill:'pill-o',c:'#F0B429',r:'4.7★',t:'+312%'},
                  {n:'Organizador Gaveta Kit',p:'R$18,50',s:'✅ Top Vendas',pill:'pill-g',c:'#00C896',r:'4.5★',t:'+189%'},
                  {n:'Cabo USB-C 2m Trançado',p:'R$12,90',s:'🆕 Recém Add.',pill:'pill-b',c:'#5B9EF0',r:'4.3★',t:'+156%'},
                  {n:'Esteira Dobrável Portátil',p:'R$89,90',s:'🔥 Em Alta',pill:'pill-o',c:'#F0B429',r:'4.6★',t:'+445%'},
                  {n:'Porta Caneca Giratória',p:'R$9,90',s:'✅ Top Vendas',pill:'pill-g',c:'#00C896',r:'4.2★',t:'+98%'},
                  {n:'Kit Skincare Masculino',p:'R$67,00',s:'⚡ Genérico',pill:'pill-r',c:'#FF4D6D',r:'4.4★',t:'+234%'},
                ].map((r, i) => (
                  <div className="mock-row" key={i}>
                    <span className="mp">
                      <span className="mb" style={{background:r.c}} />
                      {r.n}
                    </span>
                    <span className="mprice">{r.p}</span>
                    <span className={`mpill ${r.pill}`}>{r.s}</span>
                    <span className="mstar">{r.r}</span>
                    <span className="mtrend">{r.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mock-glow" />
        </div>
      </section>

      {/* ── STRIP ── */}
      <div className="strip">
        <div className="strip-track">
          {[
            {n:'12.847',l:'produtos analisados'},
            {n:'847',l:'sellers ativos'},
            {n:'8',l:'ferramentas exclusivas'},
            {n:'40x',l:'mais rápido que manual'},
            {n:'99.9%',l:'uptime garantido'},
            {n:'Diário',l:'atualização dos dados'},
            {n:'12.847',l:'produtos analisados'},
            {n:'847',l:'sellers ativos'},
            {n:'8',l:'ferramentas exclusivas'},
            {n:'40x',l:'mais rápido que manual'},
            {n:'99.9%',l:'uptime garantido'},
            {n:'Diário',l:'atualização dos dados'},
          ].map((s, i) => (
            <div className="strip-item" key={i}>
              <span className="strip-n">{s.n}</span>
              <span className="strip-l">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM / SOLUTION ── */}
      <section className="problem-sec" id="sobre">
        <div className="problem-in">
          <span className="sec-tag">// o problema</span>
          <h2 className="sec-h">CHEGA DE<br /><em>ADIVINHAR.</em></h2>
          <p className="sec-p">
            A maioria dos sellers perde horas em pesquisa manual, decide com dados velhos
            e descobre produtos vencedores depois que a concorrência já dominou.
          </p>
          <div className="compare-grid">
            <div className="compare-col compare-bad">
              <div className="compare-header" style={{color:'var(--red)'}}>
                <span>Sem o Oráculo</span>
                <span className="compare-badge-bad">ANTES</span>
              </div>
              {[
                {ico:'⏱', t:'<strong>40+ horas</strong> de pesquisa manual por produto'},
                {ico:'📅', t:'Dados do <strong>mês passado</strong> — mercado já mudou'},
                {ico:'🎲', t:'<strong>Intuição e feeling</strong> como estratégia principal'},
                {ico:'💸', t:'Alto risco de capital em produtos <strong>sem validação</strong>'},
                {ico:'🐌', t:'Descobre tendências <strong>quando já é tarde demais</strong>'},
              ].map((item, i) => (
                <div className="compare-item" key={i}>
                  <span className="compare-ico">{item.ico}</span>
                  <span className="compare-text" dangerouslySetInnerHTML={{__html: item.t}} />
                </div>
              ))}
            </div>
            <div className="compare-col compare-good">
              <div className="compare-header" style={{color:'var(--gold)'}}>
                <span>Com o Oráculo</span>
                <span className="compare-badge-good">AGORA</span>
              </div>
              {[
                {ico:'⚡', t:'<strong>5 minutos</strong> de análise completa com dados reais'},
                {ico:'📡', t:'Atualização <strong>diária automática</strong> — dados de hoje'},
                {ico:'📊', t:'BSR real, score de oportunidade e <strong>tendências precisas</strong>'},
                {ico:'✅', t:'Decisão baseada em dados — <strong>risco calculado</strong>'},
                {ico:'🚀', t:'Veja tendências <strong>antes</strong> de todo mundo ver'},
              ].map((item, i) => (
                <div className="compare-item" key={i}>
                  <span className="compare-ico">{item.ico}</span>
                  <span className="compare-text" dangerouslySetInnerHTML={{__html: item.t}} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SPOTLIGHT ── */}
      <section className="sec" style={{background:'var(--s1)',borderTop:'1px solid var(--bd)',borderBottom:'1px solid var(--bd)'}} id="ferramentas">
        <div className="sec-in">
          <span className="sec-tag">// ferramentas</span>
          <h2 className="sec-h">TUDO QUE VOCÊ<br /><em>PRECISA PARA VENCER</em></h2>
          <p className="sec-p">8 ferramentas integradas. Um painel. Zero desculpas.</p>

          <div className="feat-spot">

            {/* Feature 1: Radar de Mercado */}
            <div className="feat-row">
              <div className="feat-copy">
                <div className="feat-num">01 — 02 — 03 //</div>
                <div className="feat-icon">🎯</div>
                <div className="feat-title">O RADAR<br />DO MERCADO</div>
                <p className="feat-desc">
                  Três visões do mesmo mercado — Mais Vendidos, Em Alta e Recém Adicionados.
                  Veja o que está vendendo agora, o que está crescendo e o que ainda ninguém descobriu.
                </p>
                <div className="feat-pills">
                  <span className="feat-pill feat-pill-on">Mais Vendidos</span>
                  <span className="feat-pill feat-pill-on">Em Alta</span>
                  <span className="feat-pill feat-pill-on">Recém Adicionados</span>
                  <span className="feat-pill">Atualização diária</span>
                </div>
              </div>
              <div className="feat-visual">
                <div className="mini-table">
                  <div className="mt-head">
                    <span>PRODUTO</span><span>PREÇO</span><span>VAR.</span>
                  </div>
                  {[
                    {n:'Suporte Pescoço Elástico',p:'R$24,90',t:'+312%'},
                    {n:'Organizador Gaveta Kit',p:'R$18,50',t:'+189%'},
                    {n:'Cabo USB-C Trançado',p:'R$12,90',t:'+156%'},
                    {n:'Esteira Dobrável',p:'R$89,90',t:'+445%'},
                    {n:'Kit Skincare Masc.',p:'R$67,00',t:'+234%'},
                  ].map((r, i) => (
                    <div className="mt-row" key={i} style={{animationDelay:`${0.1*i}s`}}>
                      <span className="mt-name">{r.n}</span>
                      <span className="mt-price">{r.p}</span>
                      <span className="mt-trend">{r.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2: Inteligência Competitiva */}
            <div className="feat-row feat-row-rev" style={{background:'var(--s2)'}}>
              <div className="feat-copy">
                <div className="feat-num">04 — 05 //</div>
                <div className="feat-icon">🔍</div>
                <div className="feat-title">INTELIGÊNCIA<br />COMPETITIVA</div>
                <p className="feat-desc">
                  Genéricos com alta margem onde a concorrência é fraca. Análise de rival por ASIN
                  com comparação de preço, avaliações e pontos cegos estratégicos.
                </p>
                <div className="feat-pills">
                  <span className="feat-pill feat-pill-on">Produtos Genéricos</span>
                  <span className="feat-pill feat-pill-on">Análise Rival</span>
                  <span className="feat-pill">Margem 60%+</span>
                  <span className="feat-pill">Exportar CSV/XLS</span>
                </div>
              </div>
              <div className="feat-visual">
                <div style={{width:'100%',maxWidth:'280px'}}>
                  {[
                    {label:'Margem média Genéricos',val:'62%',color:'var(--green)'},
                    {label:'Sem concorrente forte',val:'38%',color:'var(--gold)'},
                    {label:'Volume diário estimado',val:'3.400 un.',color:'var(--text)'},
                    {label:'Score de oportunidade',val:'9.2/10',color:'var(--gold)'},
                  ].map((item, i) => (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--bd)'}}>
                      <span style={{fontSize:'12px',color:'var(--mut2)',fontFamily:'\'JetBrains Mono\',monospace'}}>{item.label}</span>
                      <span style={{fontSize:'14px',fontWeight:700,color:item.color,fontFamily:'\'JetBrains Mono\',monospace'}}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 3: Extensão + IA */}
            <div className="feat-row">
              <div className="feat-copy">
                <div className="feat-num">06 — 07 //</div>
                <div className="feat-icon">🔌</div>
                <div className="feat-title">EXTENSÃO CHROME<br />+ AGENTE IA<span className="feat-new">NOVO</span></div>
                <p className="feat-desc">
                  Análise direto na página do produto Amazon sem trocar de aba.
                  O Agente IA analisa padrões, detecta tendências e entrega oportunidades diárias com raciocínio.
                </p>
                <div className="feat-pills">
                  <span className="feat-pill feat-pill-on">Instalação 1 clique</span>
                  <span className="feat-pill feat-pill-on">GPT-4o integrado</span>
                  <span className="feat-pill">Chrome &amp; Edge</span>
                  <span className="feat-pill">Análises ilimitadas</span>
                </div>
              </div>
              <div className="feat-visual">
                <div className="ext-card">
                  <div className="ext-header">
                    <span>🔮</span> ORÁCULO CHROME
                  </div>
                  {[
                    {k:'BSR',v:'#4.230',vc:'ext-val-gold'},
                    {k:'Tendência',v:'↑ Em Alta',vc:'ext-val-green'},
                    {k:'Vendas/mês',v:'~280 un.',vc:''},
                    {k:'Score',v:'8.4/10',vc:'ext-val-gold'},
                    {k:'Oportunidade',v:'ALTA ✓',vc:'ext-val-green'},
                  ].map((r, i) => (
                    <div className="ext-row" key={i}>
                      <span className="ext-key">{r.k}</span>
                      <span className={`${r.vc || 'ext-val'}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 4: Simulador Financeiro */}
            <div className="feat-row feat-row-rev" style={{background:'var(--s2)'}}>
              <div className="feat-copy">
                <div className="feat-num">08 //</div>
                <div className="feat-icon">💰</div>
                <div className="feat-title">VALIDE ANTES<br />DE COMPRAR<span className="feat-new">NOVO</span></div>
                <p className="feat-desc">
                  Calcule margem real, taxas FBA, impostos e lucro líquido antes de qualquer decisão de compra.
                  18 variáveis, câmbio automático, exportação em PDF e XLS.
                </p>
                <div className="feat-pills">
                  <span className="feat-pill feat-pill-on">18+ variáveis</span>
                  <span className="feat-pill feat-pill-on">Câmbio automático</span>
                  <span className="feat-pill">Exportar PDF/XLS</span>
                  <span className="feat-pill">Projeções mensais</span>
                </div>
              </div>
              <div className="feat-visual">
                <div className="fin-card">
                  <div className="fin-title">Simulação de Margem</div>
                  {[
                    {l:'Preço de venda',v:'R$67,00',h:false},
                    {l:'Taxa Amazon (15%)',v:'- R$10,05',h:false},
                    {l:'FBA Fee',v:'- R$12,40',h:false},
                    {l:'Custo produto',v:'- R$18,00',h:false},
                    {l:'Lucro líquido',v:'R$26,55',h:true},
                  ].map((r, i) => (
                    <div key={i} className={`fin-row ${r.h ? 'fin-highlight' : ''}`}>
                      <span className="fin-label">{r.l}</span>
                      <span className="fin-val">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="sec" id="como-funciona">
        <div className="sec-in">
          <span className="sec-tag">// como funciona</span>
          <h2 className="sec-h">DO ZERO AO PRODUTO<br /><em>VENCEDOR EM 3 PASSOS</em></h2>
          <div className="how-steps">
            {[
              {n:'01',t:'Assine e Acesse',d:'Escolha seu plano, pague e receba o acesso por e-mail em minutos. Sem burocracia, sem aprovação manual.'},
              {n:'02',t:'Explore os Dados',d:'Navegue pelas 8 ferramentas, filtre por categoria e encontre produtos com alto potencial de venda.'},
              {n:'03',t:'Decida com Dados',d:'Valide a margem no simulador, confirme na extensão Chrome e compre com confiança e risco calculado.'},
            ].map((s, i) => (
              <div className="how-step" key={i}>
                <div className="how-num">{s.n}</div>
                <div className="how-t">{s.t}</div>
                <p className="how-d">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="sec" id="planos" style={{background:'var(--bg)'}}>
        <div className="sec-in" style={{textAlign:'center'}}>
          <span className="sec-tag">// planos</span>
          <h2 className="sec-h" style={{textAlign:'center'}}>ACESSO TOTAL.<br /><em>ESCOLHA O SEU RITMO.</em></h2>
          <p className="sec-p" style={{margin:'0 auto'}}>
            Todas as 8 ferramentas em qualquer plano. Sem limite de pesquisas. Sem surpresas.
          </p>

          <div className="price-grid">
            {/* Mensal */}
            <div className="price-card">
              <div className="price-label">Mensal</div>
              <div className="price-amt">
                <span className="price-brl">R$</span>
                <span className="price-big">79</span>
              </div>
              <div className="price-period">,90 por mês</div>
              <div className="price-eq">&nbsp;</div>
              <div className="price-div" />
              <ul className="price-list">
                <li>8 ferramentas completas</li>
                <li>Extensão Chrome incluída</li>
                <li>Agente IA ilimitado</li>
                <li>Simulador Financeiro</li>
                <li>Análise de concorrentes</li>
                <li>Renovação mensal flexível</li>
              </ul>
              <a href={LINKS.monthly} className="price-btn price-btn-line">Assinar Mensal</a>
            </div>

            {/* Semestral */}
            <div className="price-card price-card-hot">
              <div className="price-pop">MAIS POPULAR</div>
              <div className="price-label price-label-hot">Semestral</div>
              <div className="price-amt">
                <span className="price-brl price-brl-hot">R$</span>
                <span className="price-big price-big-hot">397</span>
              </div>
              <div className="price-period">por 6 meses</div>
              <div className="price-eq">equivale a <em>R$66,17/mês — economize 17%</em></div>
              <div className="price-div" />
              <ul className="price-list">
                <li>Tudo do plano Mensal</li>
                <li>6 meses de acesso garantido</li>
                <li>Prioridade no suporte</li>
                <li>Atualizações inclusas</li>
                <li>Novas ferramentas inclusas</li>
                <li>Economia de R$81,40</li>
              </ul>
              <a href={LINKS.biannual} className="price-btn price-btn-fill">Assinar Semestral</a>
            </div>

            {/* Anual */}
            <div className="price-card">
              <div className="price-label">Anual</div>
              <div className="price-amt">
                <span className="price-brl">R$</span>
                <span className="price-big">597</span>
              </div>
              <div className="price-period">por ano</div>
              <div className="price-eq">
                equivale a <span style={{color:'var(--green)'}}>R$49,75/mês — economize 38%</span>
              </div>
              <div className="price-div" />
              <ul className="price-list">
                <li>Tudo do plano Semestral</li>
                <li>12 meses de acesso total</li>
                <li>Suporte prioritário VIP</li>
                <li>Acesso antecipado a novidades</li>
                <li>Melhor custo-benefício</li>
                <li>Economia de R$361,80</li>
              </ul>
              <a href={LINKS.annual} className="price-btn price-btn-line">Assinar Anual</a>
            </div>
          </div>

          <p style={{marginTop:'22px',fontSize:'12px',color:'var(--mut)',fontFamily:'\'JetBrains Mono\',monospace',letterSpacing:'.5px'}}>
            Pagamento seguro via Greenn · Acesso imediato após confirmação · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sec faq-bg" id="faq">
        <div className="sec-in">
          <span className="sec-tag">// perguntas frequentes</span>
          <h2 className="sec-h">DÚVIDAS<br /><em>RESPONDIDAS</em></h2>
          <div className="faq-list">
            {FAQS.map((item, i) => (
              <details className="faq" key={i}>
                <summary className="faq-q">{item.q}</summary>
                <p className="faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="fcta">
        <div className="fcta-bg" />
        <div className="fcta-grid" />
        <div className="fcta-in">
          <h2 className="fcta-h">
            COMECE A VER<br />O QUE OUTROS<br /><em>NÃO VEEM.</em>
          </h2>
          <p className="fcta-sub">
            Enquanto você lê isso, sellers usando o Oráculo já encontraram
            os próximos produtos vencedores.
          </p>
          <a href={LINKS.biannual} className="cta-main" style={{fontSize:'16px',padding:'17px 46px'}}>
            Começar Agora →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <span className="footer-copy">© 2026 ORÁCULO AMAZON INTELLIGENCE</span>
        <div className="footer-links">
          <a href="/login" className="footer-lnk">Entrar</a>
          <a href="#planos" className="footer-lnk">Planos</a>
          <a href="#ferramentas" className="footer-lnk">Ferramentas</a>
          <a href="#faq" className="footer-lnk">FAQ</a>
        </div>
      </footer>
    </>
  )
}
