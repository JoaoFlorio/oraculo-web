import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORÁCULO — Inteligência de Mercado Amazon FBA Brasil',
  description: 'Encontre produtos vencedores no Amazon FBA antes da concorrência.',
  openGraph: { title: 'ORÁCULO', description: 'Dados que mudam o jogo.', images: ['/og-image.png'] },
}

const LINKS = {
  monthly:  'https://payfast.greenn.com.br/pm36pq4/offer/B0febG',
  biannual: 'https://payfast.greenn.com.br/pm36pq4/offer/rpgHFd',
  annual:   'https://payfast.greenn.com.br/pm36pq4/offer/WBkId3',
}

export default function PlanosPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ── RESET + ROOT ────────────────────────────────── */
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        :root{
          --bg:#050308;
          --s1:#0B0910;
          --s2:#110E17;
          --gold:#D4A843;
          --gold2:#EBBC55;
          --gold3:#B88A2A;
          --white:#F2EDE4;
          --text:#C4BAB0;
          --mut:#7A7080;
          --mut2:#A89E94;
          --green:#5CB87C;
          --red:#E05C5C;
          --bd:rgba(212,168,67,0.14);
          --bd2:rgba(255,255,255,0.055);
        }
        body{
          font-family:'DM Sans',system-ui,sans-serif;
          background:var(--bg);
          color:var(--text);
          -webkit-font-smoothing:antialiased;
          overflow-x:hidden;
        }
        /* Grain texture overlay */
        body::after{
          content:'';
          position:fixed;inset:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-repeat:repeat;
          background-size:200px 200px;
          opacity:0.032;
          pointer-events:none;
          z-index:9998;
        }
        a{text-decoration:none;color:inherit}
        ::selection{background:rgba(212,168,67,0.22);color:var(--white)}
        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-thumb{background:rgba(212,168,67,0.2);border-radius:2px}

        /* ── ANIMATIONS ─────────────────────────────────── */
        @keyframes eyeBreath{
          0%,100%{transform:scale(1);filter:brightness(0.62)}
          50%{transform:scale(1.045);filter:brightness(0.78)}
        }
        @keyframes goldShimmer{
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes fadeUp{
          from{opacity:0;transform:translateY(28px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes floatA{
          0%,100%{transform:translateY(0) rotate(-0.8deg)}
          50%{transform:translateY(-14px) rotate(0.8deg)}
        }
        @keyframes floatB{
          0%,100%{transform:translateY(-6px) rotate(0.5deg)}
          50%{transform:translateY(8px) rotate(-0.5deg)}
        }
        @keyframes marqueeL{
          from{transform:translateX(0)}
          to{transform:translateX(-50%)}
        }
        @keyframes marqueeR{
          from{transform:translateX(-50%)}
          to{transform:translateX(0)}
        }
        @keyframes pulseBorder{
          0%,100%{box-shadow:0 0 0 0 rgba(212,168,67,0.25),0 0 40px rgba(212,168,67,0.08)}
          50%{box-shadow:0 0 0 6px rgba(212,168,67,0),0 0 60px rgba(212,168,67,0.18)}
        }
        @keyframes lineGrow{
          from{transform:scaleX(0);opacity:0}
          to{transform:scaleX(1);opacity:1}
        }
        @keyframes countUp{
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes scanEye{
          0%{transform:translateY(-120%);opacity:0}
          10%{opacity:0.6}
          90%{opacity:0.6}
          100%{transform:translateY(220%);opacity:0}
        }

        /* ── NAV ──────────────────────────────────────────── */
        .nav{
          position:fixed;top:0;left:0;right:0;z-index:100;
          height:60px;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 40px;
          background:rgba(5,3,8,0.75);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border-bottom:1px solid rgba(212,168,67,0.07);
        }
        .nav-brand{
          display:flex;align-items:center;gap:10px;
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:16px;letter-spacing:4px;
          color:var(--white);
        }
        .nav-dot{
          width:8px;height:8px;border-radius:50%;
          background:var(--gold);
          box-shadow:0 0 8px var(--gold);
        }
        .nav-right{display:flex;align-items:center;gap:6px}
        .nav-lnk{
          font-size:13px;font-weight:500;
          color:var(--mut2);padding:7px 14px;
          letter-spacing:0.2px;transition:color .2s;
        }
        .nav-lnk:hover{color:var(--white)}
        .nav-btn{
          font-size:13px;font-weight:600;
          color:var(--bg);background:var(--gold);
          padding:9px 22px;border-radius:4px;
          letter-spacing:0.3px;
          transition:all .25s;
          box-shadow:0 2px 18px rgba(212,168,67,0.22);
        }
        .nav-btn:hover{background:var(--gold2);box-shadow:0 4px 32px rgba(212,168,67,0.38)}

        /* ── HERO ─────────────────────────────────────────── */
        .hero{
          position:relative;
          min-height:100svh;
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;
        }
        /* The eye IS the background */
        .hero-eye{
          position:absolute;inset:0;
          background-image:url('/oracle-eye.png');
          background-size:cover;
          background-position:center 40%;
          animation:eyeBreath 9s ease-in-out infinite;
          transform-origin:center center;
        }
        .hero-eye-scan{
          position:absolute;
          left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent 0%,rgba(212,168,67,0.5) 30%,rgba(255,240,160,0.7) 50%,rgba(212,168,67,0.5) 70%,transparent 100%);
          animation:scanEye 8s ease-in-out infinite 2s;
          pointer-events:none;z-index:2;
        }
        /* Gradient overlay: dark edges, reveal center */
        .hero-overlay{
          position:absolute;inset:0;
          background:
            linear-gradient(to bottom,
              rgba(5,3,8,0.55) 0%,
              rgba(5,3,8,0.05) 30%,
              rgba(5,3,8,0.05) 55%,
              rgba(5,3,8,0.78) 78%,
              rgba(5,3,8,0.97) 100%
            ),
            linear-gradient(to right,
              rgba(5,3,8,0.6) 0%,
              rgba(5,3,8,0) 22%,
              rgba(5,3,8,0) 78%,
              rgba(5,3,8,0.6) 100%
            );
        }
        .hero-in{
          position:relative;z-index:3;
          text-align:center;
          padding:0 24px 80px;
          display:flex;flex-direction:column;align-items:center;
          margin-top:60px;/* nav offset */
        }
        .hero-eyebrow{
          font-family:'JetBrains Mono',monospace;
          font-size:10px;letter-spacing:3px;
          color:var(--gold);opacity:0.7;
          text-transform:uppercase;
          margin-bottom:32px;
          animation:fadeIn 1s ease 0.3s both;
          display:flex;align-items:center;gap:12px;
        }
        .hero-eyebrow::before,.hero-eyebrow::after{
          content:'';width:28px;height:1px;
          background:var(--gold);opacity:0.4;
        }
        .hero-wordmark{
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:clamp(72px,13vw,156px);
          line-height:0.9;letter-spacing:-3px;
          background:linear-gradient(100deg,
            var(--gold3) 0%,
            var(--gold) 20%,
            var(--gold2) 40%,
            #FFF0A0 50%,
            var(--gold2) 60%,
            var(--gold) 80%,
            var(--gold3) 100%
          );
          background-size:200% auto;
          animation:goldShimmer 6s linear infinite, fadeUp 0.8s ease 0.5s both;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
          filter:drop-shadow(0 0 60px rgba(212,168,67,0.3));
        }
        .hero-rule{
          width:80px;height:1px;
          background:linear-gradient(90deg,transparent,var(--gold),transparent);
          margin:24px auto;
          transform-origin:center;
          animation:lineGrow 0.8s ease 1.1s both;
        }
        .hero-headline{
          font-family:'Syne',sans-serif;font-weight:700;
          font-size:clamp(22px,3.2vw,42px);
          color:var(--white);
          letter-spacing:-0.5px;line-height:1.2;
          margin-bottom:18px;
          animation:fadeUp 0.8s ease 1.3s both;
        }
        .hero-sub{
          font-size:17px;color:var(--mut2);
          max-width:480px;line-height:1.72;
          margin-bottom:40px;
          animation:fadeUp 0.8s ease 1.45s both;
        }
        .hero-sub strong{color:var(--text);font-weight:500}
        .hero-actions{
          display:flex;align-items:center;gap:14px;
          flex-wrap:wrap;justify-content:center;
          animation:fadeUp 0.8s ease 1.6s both;
        }
        .cta-gold{
          display:inline-flex;align-items:center;gap:9px;
          padding:15px 38px;
          background:var(--gold);color:var(--bg);
          font-family:'Syne',sans-serif;font-weight:700;
          font-size:14px;letter-spacing:1px;
          border-radius:4px;
          box-shadow:0 4px 36px rgba(212,168,67,0.32);
          transition:all .3s;
          animation:pulseBorder 4s ease infinite 2s;
        }
        .cta-gold:hover{background:var(--gold2);transform:translateY(-2px);box-shadow:0 8px 52px rgba(212,168,67,0.48)}
        .cta-ghost{
          font-size:14px;font-weight:500;
          color:var(--mut2);letter-spacing:0.2px;
          padding:6px 2px;
          border-bottom:1px solid rgba(160,150,140,0.25);
          transition:all .2s;
        }
        .cta-ghost:hover{color:var(--white);border-color:var(--white)}

        /* Floating HUD cards */
        .hud{
          position:absolute;z-index:3;
          background:rgba(5,3,8,0.72);
          border:1px solid rgba(212,168,67,0.22);
          backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
          border-radius:8px;
          padding:14px 18px;
          box-shadow:0 20px 56px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,255,255,0.05);
          font-family:'JetBrains Mono',monospace;
          white-space:nowrap;
        }
        .hud-a{
          left:5%;bottom:38%;
          animation:floatA 7s ease-in-out infinite, fadeIn 1s ease 2s both;
        }
        .hud-b{
          right:5%;bottom:46%;
          animation:floatB 8.5s ease-in-out infinite, fadeIn 1s ease 2.3s both;
        }
        .hud-label{
          font-size:8.5px;letter-spacing:1.5px;
          color:var(--mut);text-transform:uppercase;
          margin-bottom:6px;
        }
        .hud-row{
          display:flex;align-items:center;gap:8px;
          margin-bottom:3px;
        }
        .hud-row:last-child{margin-bottom:0}
        .hud-name{font-size:11px;color:var(--text)}
        .hud-val{font-size:11px;font-weight:500}
        .hud-up{color:var(--green)}
        .hud-gold{color:var(--gold)}
        .hud-live{
          display:flex;align-items:center;gap:5px;
          font-size:8px;color:var(--green);letter-spacing:1px;
          margin-bottom:8px;
        }
        .hud-dot{
          width:5px;height:5px;border-radius:50%;
          background:var(--green);
          box-shadow:0 0 6px var(--green);
        }

        /* ── MARQUEE ──────────────────────────────────────── */
        .marquee-wrap{
          padding:18px 0;
          background:var(--s1);
          border-top:1px solid var(--bd);
          border-bottom:1px solid var(--bd);
          overflow:hidden;
        }
        .marquee-track{
          display:flex;width:max-content;
          animation:marqueeL 28s linear infinite;
        }
        .marquee-track-rev{
          animation:marqueeR 36s linear infinite;
        }
        .marquee-item{
          font-family:'Syne',sans-serif;font-weight:700;
          font-size:11px;letter-spacing:3px;text-transform:uppercase;
          color:var(--mut);padding:0 32px;
          display:flex;align-items:center;gap:32px;
        }
        .marquee-item::after{
          content:'◆';
          font-size:6px;color:var(--gold);opacity:0.5;
        }

        /* ── NUMBERS ──────────────────────────────────────── */
        .numbers{
          padding:80px 32px;
          background:var(--bg);
        }
        .numbers-grid{
          max-width:1000px;margin:0 auto;
          display:grid;grid-template-columns:repeat(4,1fr);
          gap:1px;
          background:var(--bd2);
          border:1px solid var(--bd2);
          border-radius:8px;overflow:hidden;
        }
        .num-cell{
          background:var(--bg);
          padding:40px 28px;
          text-align:center;
        }
        .num-val{
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:clamp(40px,5vw,64px);
          color:var(--gold);
          letter-spacing:-2px;line-height:1;
          margin-bottom:10px;
          display:block;
          animation:countUp 0.8s ease both;
        }
        .num-label{
          font-size:13px;color:var(--mut2);
          letter-spacing:0.3px;line-height:1.4;
        }

        /* ── STATEMENT ────────────────────────────────────── */
        .statement{
          padding:120px 32px;
          background:var(--s1);
          border-top:1px solid var(--bd2);
          border-bottom:1px solid var(--bd2);
          text-align:center;
          position:relative;overflow:hidden;
        }
        .statement::before{
          content:'';
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:600px;height:600px;border-radius:50%;
          background:radial-gradient(circle,rgba(212,168,67,0.05),transparent 70%);
          pointer-events:none;
        }
        .statement-text{
          font-family:'Syne',sans-serif;font-weight:700;
          font-size:clamp(26px,4vw,52px);
          color:var(--white);
          max-width:800px;margin:0 auto;
          line-height:1.25;letter-spacing:-0.5px;
          position:relative;z-index:1;
        }
        .statement-text em{
          color:var(--gold);font-style:normal;
        }
        .statement-caption{
          margin-top:36px;position:relative;z-index:1;
          font-family:'JetBrains Mono',monospace;
          font-size:11px;letter-spacing:2px;
          color:var(--mut);text-transform:uppercase;
        }

        /* ── SECTION BASE ─────────────────────────────────── */
        .sec{padding:100px 32px}
        .sec-inner{max-width:1120px;margin:0 auto}
        .sec-tag{
          font-family:'JetBrains Mono',monospace;
          font-size:10px;letter-spacing:2.5px;
          color:var(--gold);opacity:0.65;
          text-transform:uppercase;
          display:block;margin-bottom:14px;
        }
        .sec-title{
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:clamp(36px,5vw,60px);
          color:var(--white);line-height:1.05;
          letter-spacing:-1px;margin-bottom:16px;
        }
        .sec-title em{color:var(--gold);font-style:normal}
        .sec-sub{font-size:17px;color:var(--mut2);max-width:500px;line-height:1.7}

        /* ── BENTO FEATURES ───────────────────────────────── */
        .bento{
          display:grid;
          grid-template-columns:1.45fr 1fr 1fr;
          grid-template-rows:auto auto;
          gap:12px;
          margin-top:60px;
        }
        .bento-tall{grid-row:span 2}
        .bento-wide{grid-column:span 2}
        .bcard{
          background:var(--s2);
          border:1px solid var(--bd2);
          border-radius:10px;
          padding:32px 28px;
          position:relative;overflow:hidden;
          transition:border-color .3s, transform .3s;
        }
        .bcard::before{
          content:'';
          position:absolute;top:0;left:0;right:0;height:1.5px;
          background:linear-gradient(90deg,transparent,var(--gold),transparent);
          opacity:0;transition:opacity .3s;
        }
        .bcard:hover{border-color:rgba(212,168,67,0.25);transform:translateY(-2px)}
        .bcard:hover::before{opacity:0.6}
        .bcard-glow{
          position:absolute;top:-80px;right:-80px;
          width:240px;height:240px;border-radius:50%;
          background:radial-gradient(circle,rgba(212,168,67,0.04),transparent 70%);
          pointer-events:none;
        }
        .bcard-num{
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:64px;color:var(--gold);opacity:0.06;
          line-height:1;letter-spacing:-3px;
          position:absolute;top:16px;right:16px;
          pointer-events:none;
        }
        .bcard-tag{
          font-family:'JetBrains Mono',monospace;
          font-size:9px;letter-spacing:1.8px;
          color:var(--gold);opacity:0.6;
          text-transform:uppercase;margin-bottom:10px;
          display:block;
        }
        .bcard-title{
          font-family:'Syne',sans-serif;font-weight:700;
          font-size:22px;color:var(--white);
          line-height:1.2;letter-spacing:-0.3px;
          margin-bottom:12px;
        }
        .bcard-desc{
          font-size:14px;color:var(--mut2);
          line-height:1.68;margin-bottom:20px;
        }
        /* Mini data table inside bcard */
        .mini-data{
          background:rgba(0,0,0,0.35);
          border:1px solid rgba(255,255,255,0.04);
          border-radius:6px;
          overflow:hidden;
          font-family:'JetBrains Mono',monospace;
          font-size:10px;
        }
        .mini-data-head{
          display:flex;justify-content:space-between;
          padding:7px 12px;
          background:rgba(255,255,255,0.02);
          color:var(--mut);letter-spacing:0.8px;
          font-size:8.5px;text-transform:uppercase;
          border-bottom:1px solid rgba(255,255,255,0.03);
        }
        .mini-data-row{
          display:flex;justify-content:space-between;align-items:center;
          padding:7px 12px;
          border-bottom:1px solid rgba(255,255,255,0.025);
        }
        .mini-data-row:last-child{border-bottom:none}
        .mini-data-row:hover{background:rgba(212,168,67,0.03)}
        .mdr-name{color:var(--text);font-size:9.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px}
        .mdr-val{color:var(--green);font-size:9.5px;font-weight:500}
        .mdr-tag{
          padding:1.5px 5px;border-radius:2px;font-size:8px;
          background:rgba(212,168,67,0.1);color:var(--gold);
        }
        /* Wide card: horizontal layout */
        .bcard-horizontal{display:flex;gap:24px;align-items:flex-start}
        .bcard-horizontal .bcard-desc{max-width:280px}
        /* Metric badges */
        .bcard-metrics{display:flex;flex-direction:column;gap:8px;flex-shrink:0}
        .metric{
          background:rgba(0,0,0,0.4);
          border:1px solid var(--bd2);
          border-radius:6px;
          padding:10px 14px;
          font-family:'JetBrains Mono',monospace;
          min-width:150px;
        }
        .metric-k{font-size:9px;color:var(--mut);letter-spacing:1px;text-transform:uppercase;margin-bottom:3px}
        .metric-v{font-size:16px;font-weight:500;color:var(--gold);letter-spacing:-0.5px}
        .metric-v-green{color:var(--green)}
        /* Pills */
        .bcard-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
        .pill{
          padding:4px 10px;border-radius:100px;
          font-size:11px;font-weight:500;
          border:1px solid var(--bd2);color:var(--mut2);
        }
        .pill-active{border-color:var(--bd);color:var(--gold);background:rgba(212,168,67,0.04)}

        /* ── COMO FUNCIONA ────────────────────────────────── */
        .how-bg{
          background:var(--s1);
          border-top:1px solid var(--bd2);
          border-bottom:1px solid var(--bd2);
        }
        .how-cols{
          display:grid;grid-template-columns:repeat(3,1fr);
          gap:1px;background:var(--bd2);
          border:1px solid var(--bd2);border-radius:8px;
          overflow:hidden;margin-top:56px;
        }
        .how-col{
          background:var(--s1);
          padding:44px 32px;
          position:relative;
        }
        .how-col::after{
          content:attr(data-n);
          position:absolute;bottom:16px;right:20px;
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:72px;color:var(--gold);opacity:0.05;
          letter-spacing:-3px;line-height:1;
          pointer-events:none;
        }
        .how-step-n{
          font-family:'JetBrains Mono',monospace;
          font-size:10px;letter-spacing:2px;
          color:var(--gold);opacity:0.55;
          margin-bottom:18px;
          display:flex;align-items:center;gap:10px;
        }
        .how-step-n::after{content:'';width:20px;height:1px;background:var(--gold);opacity:0.4}
        .how-step-t{
          font-family:'Syne',sans-serif;font-weight:700;
          font-size:19px;color:var(--white);
          margin-bottom:10px;letter-spacing:-0.3px;
        }
        .how-step-d{font-size:14px;color:var(--mut2);line-height:1.7}

        /* ── PRICING ──────────────────────────────────────── */
        .pricing-header{text-align:center;margin-bottom:52px}
        .price-grid{
          display:grid;grid-template-columns:repeat(3,1fr);
          gap:1px;background:var(--bd2);
          border:1px solid var(--bd2);border-radius:10px;
          overflow:hidden;
          box-shadow:0 48px 96px rgba(0,0,0,0.6);
        }
        .pc{background:var(--s2);padding:44px 32px;position:relative}
        .pc-hot{
          background:#100C18;
          animation:pulseBorder 5s ease infinite;
        }
        .pc-hot::before{
          content:'';
          position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,var(--gold) 30%,var(--gold2) 50%,var(--gold) 70%,transparent);
        }
        .pc-badge{
          position:absolute;top:-1px;left:50%;transform:translateX(-50%);
          background:var(--gold);color:var(--bg);
          font-family:'JetBrains Mono',monospace;
          font-size:8px;font-weight:500;letter-spacing:2px;
          text-transform:uppercase;
          padding:4px 14px;border-radius:0 0 6px 6px;
          white-space:nowrap;
        }
        .pc-plan{
          font-family:'JetBrains Mono',monospace;
          font-size:9.5px;letter-spacing:2.5px;
          color:var(--mut);text-transform:uppercase;
          margin-bottom:22px;
        }
        .pc-plan-hot{color:var(--gold);opacity:0.8}
        .pc-price{
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:72px;color:var(--white);
          line-height:0.95;letter-spacing:-3px;
          margin-bottom:6px;
        }
        .pc-price-hot{color:var(--gold)}
        .pc-period{
          font-size:13px;color:var(--mut);margin-bottom:6px;
        }
        .pc-eq{
          font-family:'JetBrains Mono',monospace;
          font-size:10.5px;color:var(--mut);
          margin-bottom:26px;
        }
        .pc-eq em{color:var(--green);font-style:normal}
        .pc-div{height:1px;background:var(--bd2);margin:18px 0}
        .pc-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px}
        .pc-list li{
          display:flex;align-items:flex-start;gap:10px;
          font-size:13.5px;color:var(--mut2);line-height:1.4;
        }
        .pc-list li::before{
          content:'✓';color:var(--green);
          font-weight:700;flex-shrink:0;font-size:12px;margin-top:1px;
        }
        .pc-cta{
          display:block;width:100%;padding:14px;
          text-align:center;border-radius:5px;
          font-family:'Syne',sans-serif;
          font-weight:700;font-size:14px;letter-spacing:0.5px;
          cursor:pointer;transition:all .25s;
        }
        .pc-cta-line{
          border:1px solid rgba(212,168,67,0.22);color:var(--gold);
        }
        .pc-cta-line:hover{background:rgba(212,168,67,0.06);border-color:rgba(212,168,67,0.45)}
        .pc-cta-fill{
          background:var(--gold);color:var(--bg);border:none;
          box-shadow:0 4px 24px rgba(212,168,67,0.22);
        }
        .pc-cta-fill:hover{background:var(--gold2);box-shadow:0 8px 40px rgba(212,168,67,0.4);transform:translateY(-1px)}
        .price-note{
          text-align:center;margin-top:22px;
          font-family:'JetBrains Mono',monospace;
          font-size:10px;letter-spacing:0.8px;
          color:var(--mut);opacity:0.65;
        }

        /* ── FAQ ──────────────────────────────────────────── */
        .faq-inner{max-width:720px;margin:52px auto 0}
        details.fq{border-bottom:1px solid var(--bd2)}
        details.fq:first-child{border-top:1px solid var(--bd2)}
        summary.fq-q{
          padding:20px 0;
          font-family:'DM Sans',sans-serif;
          font-size:16px;font-weight:500;
          color:var(--text);cursor:pointer;
          list-style:none;
          display:flex;justify-content:space-between;align-items:center;
          transition:color .2s;gap:20px;
        }
        summary.fq-q::-webkit-details-marker{display:none}
        summary.fq-q:hover{color:var(--white)}
        summary.fq-q::after{
          content:'＋';
          font-size:20px;color:var(--gold);
          flex-shrink:0;font-weight:300;
          transition:transform .2s;
        }
        details[open] summary.fq-q{color:var(--white)}
        details[open] summary.fq-q::after{content:'－'}
        .fq-a{
          padding:0 0 20px;
          font-size:15px;color:var(--mut2);
          line-height:1.76;max-width:600px;
        }

        /* ── FINAL CTA ────────────────────────────────────── */
        .fcta{
          position:relative;overflow:hidden;
          text-align:center;padding:140px 32px;
        }
        .fcta-bg{
          position:absolute;inset:0;
          background-image:url('/hero-bg.png');
          background-size:cover;background-position:center;
          opacity:0.18;
        }
        .fcta-overlay{
          position:absolute;inset:0;
          background:
            radial-gradient(ellipse 70% 80% at 50% 50%,rgba(5,3,8,0.3),rgba(5,3,8,0.88) 70%),
            linear-gradient(to bottom,rgba(5,3,8,0.6),rgba(5,3,8,0.4),rgba(5,3,8,0.8));
        }
        .fcta-in{position:relative;z-index:1}
        .fcta-title{
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:clamp(48px,8vw,100px);
          line-height:0.95;letter-spacing:-2px;
          color:var(--white);margin-bottom:18px;
        }
        .fcta-title em{
          background:linear-gradient(100deg,var(--gold3),var(--gold),var(--gold2),var(--gold));
          background-size:200% auto;
          animation:goldShimmer 5s linear infinite;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;font-style:normal;
        }
        .fcta-sub{
          font-size:17px;color:var(--mut2);
          max-width:420px;margin:0 auto 44px;line-height:1.7;
        }

        /* ── FOOTER ───────────────────────────────────────── */
        .footer{
          border-top:1px solid var(--bd2);
          padding:26px 40px;
          display:flex;align-items:center;
          justify-content:space-between;
          flex-wrap:wrap;gap:14px;
          background:var(--s1);
        }
        .footer-brand{
          font-family:'Syne',sans-serif;font-weight:800;
          font-size:13px;letter-spacing:3px;
          color:var(--mut);text-transform:uppercase;
        }
        .footer-links{display:flex;gap:24px}
        .footer-lnk{font-size:13px;color:var(--mut);transition:color .2s}
        .footer-lnk:hover{color:var(--gold)}

        /* ── RESPONSIVE ───────────────────────────────────── */
        @media(max-width:1000px){
          .bento{grid-template-columns:1fr 1fr;grid-template-rows:auto}
          .bento-tall{grid-row:auto}
          .bento-wide{grid-column:span 2}
          .numbers-grid{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:760px){
          .nav{padding:0 20px}
          .nav-lnk{display:none}
          .hud-a,.hud-b{display:none}
          .bento{grid-template-columns:1fr}
          .bento-wide{grid-column:auto}
          .how-cols{grid-template-columns:1fr}
          .price-grid{grid-template-columns:1fr}
          .footer{flex-direction:column;text-align:center}
          .footer-links{flex-wrap:wrap;justify-content:center}
        }
        @media(max-width:560px){
          .numbers-grid{grid-template-columns:repeat(2,1fr)}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <a href="/" className="nav-brand">
          <span className="nav-dot" />
          Oráculo
        </a>
        <div className="nav-right">
          <a href="#ferramentas" className="nav-lnk">Ferramentas</a>
          <a href="#planos" className="nav-lnk">Planos</a>
          <a href="/login" className="nav-lnk">Entrar</a>
          <a href={LINKS.biannual} className="nav-btn">Começar</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        {/* Eye is the background */}
        <div className="hero-eye" />
        <div className="hero-eye-scan" />
        <div className="hero-overlay" />

        {/* Floating HUD cards */}
        <div className="hud hud-a">
          <div className="hud-live">
            <span className="hud-dot" /> AO VIVO
          </div>
          <div className="hud-label">Em Alta · Tendência 7d</div>
          <div className="hud-row">
            <span className="hud-name">Suporte Pescoço</span>
            <span className="hud-val hud-up">+312%</span>
          </div>
          <div className="hud-row">
            <span className="hud-name">Kit Skincare Masc.</span>
            <span className="hud-val hud-up">+234%</span>
          </div>
          <div className="hud-row">
            <span className="hud-name">Esteira Dobrável</span>
            <span className="hud-val hud-up">+445%</span>
          </div>
        </div>

        <div className="hud hud-b">
          <div className="hud-label">Score de Oportunidade</div>
          <div className="hud-row">
            <span className="hud-name">BSR Atual</span>
            <span className="hud-val hud-gold">#4.230</span>
          </div>
          <div className="hud-row">
            <span className="hud-name">Margem Genérico</span>
            <span className="hud-val hud-gold">62%</span>
          </div>
          <div className="hud-row">
            <span className="hud-name">Score IA</span>
            <span className="hud-val hud-up">9.2/10</span>
          </div>
        </div>

        {/* Center content */}
        <div className="hero-in">
          <div className="hero-eyebrow">Sistema de Inteligência · Amazon FBA Brasil</div>

          <div className="hero-wordmark">ORÁCULO</div>

          <div className="hero-rule" />

          <h1 className="hero-headline">
            Dados que mudam o jogo. Hoje.
          </h1>

          <p className="hero-sub">
            O sistema que os melhores sellers Amazon FBA usam para encontrar
            produtos vencedores <strong>antes de todo mundo</strong> —
            com inteligência real, não feeling.
          </p>

          <div className="hero-actions">
            <a href={LINKS.biannual} className="cta-gold">
              Começar Agora
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="/login" className="cta-ghost">Já tenho conta</a>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {Array(2).fill([
            'Dados Reais','Produtos Vencedores','Amazon FBA Brasil',
            'Inteligência de Mercado','BSR em Tempo Real','Extensão Chrome',
            'Agente IA','Simulador Financeiro','847 Sellers Ativos',
          ]).flat().map((t, i) => (
            <span className="marquee-item" key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── NUMBERS ── */}
      <div className="numbers">
        <div className="numbers-grid">
          {[
            {v:'12.847', l:'produtos analisados'},
            {v:'847',    l:'sellers ativos'},
            {v:'8',      l:'ferramentas exclusivas'},
            {v:'40×',    l:'mais rápido que manual'},
          ].map((n, i) => (
            <div className="num-cell" key={i}>
              <span className="num-val" style={{animationDelay:`${i*0.1}s`}}>{n.v}</span>
              <span className="num-label">{n.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATEMENT ── */}
      <section className="statement">
        <p className="statement-text">
          1 em cada 3 sellers pesquisa no escuro.<br />
          Seja o <em>outro.</em>
        </p>
        <div className="statement-caption">
          inteligência que converte · oráculo · amazon fba brasil
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section className="sec" id="ferramentas" style={{background:'var(--bg)'}}>
        <div className="sec-inner">
          <span className="sec-tag">// ferramentas</span>
          <h2 className="sec-title">O que o Oráculo<br /><em>enxerga.</em></h2>
          <p className="sec-sub">Oito ferramentas. Um painel. Zero suposições.</p>

          <div className="bento">

            {/* BIG CARD: Radar de Mercado */}
            <div className="bcard bento-tall">
              <div className="bcard-glow" />
              <div className="bcard-num">01</div>
              <span className="bcard-tag">01 · Mineração de Mercado</span>
              <h3 className="bcard-title">O radar que<br />nunca dorme.</h3>
              <p className="bcard-desc">
                Mais Vendidos, Em Alta e Recém Adicionados — três ângulos do mesmo mercado,
                atualizados diariamente. Descubra o que está vendendo antes que vire notícia.
              </p>
              <div className="mini-data">
                <div className="mini-data-head">
                  <span>Produto</span>
                  <span>Variação 7d</span>
                </div>
                {[
                  {n:'Suporte Pescoço Elástico', v:'+312%', t:'Em Alta'},
                  {n:'Kit Skincare Masculino',   v:'+234%', t:'Genérico'},
                  {n:'Organizador Gaveta Kit',   v:'+189%', t:'Top Venda'},
                  {n:'Esteira Dobrável',         v:'+445%', t:'Em Alta'},
                  {n:'Cabo USB-C 2m Trançado',   v:'+156%', t:'Recém Add.'},
                ].map((r, i) => (
                  <div className="mini-data-row" key={i}>
                    <span className="mdr-name">{r.n}</span>
                    <span className="mdr-val">{r.v}</span>
                    <span className="mdr-tag">{r.t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Análise Rival */}
            <div className="bcard">
              <div className="bcard-glow" />
              <div className="bcard-num">05</div>
              <span className="bcard-tag">05 · Competitive Intel</span>
              <h3 className="bcard-title">Onde eles<br />são fracos.</h3>
              <p className="bcard-desc">Analise qualquer rival por ASIN. Compare preço, avaliações e detecte brechas.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginTop:'16px'}}>
                {[
                  {k:'Margem genéricos', v:'62%'},
                  {k:'Sem marca forte',  v:'38% dos produtos'},
                  {k:'Score oportunidade', v:'9.2 / 10'},
                ].map((m, i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontSize:'12px',color:'var(--mut2)',fontFamily:'\'JetBrains Mono\',monospace'}}>{m.k}</span>
                    <span style={{fontSize:'12px',fontWeight:500,color:'var(--gold)',fontFamily:'\'JetBrains Mono\',monospace'}}>{m.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Genéricos */}
            <div className="bcard">
              <div className="bcard-glow" />
              <div className="bcard-num">04</div>
              <span className="bcard-tag">04 · Produtos Genéricos</span>
              <h3 className="bcard-title">Margem alta.<br />Concorrência baixa.</h3>
              <p className="bcard-desc">Produtos sem marca com oportunidade de entrada. O segredo dos sellers avançados.</p>
              <div className="bcard-pills" style={{marginTop:'16px'}}>
                <span className="pill pill-active">+60% de margem</span>
                <span className="pill pill-active">Sem marca dominante</span>
                <span className="pill">Vol. diário +3.000</span>
              </div>
            </div>

            {/* WIDE CARD: Extensão + IA */}
            <div className="bcard bento-wide">
              <div className="bcard-glow" />
              <div className="bcard-num">07</div>
              <div className="bcard-horizontal">
                <div>
                  <span className="bcard-tag">06 · 07 · Extensão Chrome + Agente IA</span>
                  <h3 className="bcard-title">Na prateleira digital,<br />ao vivo. Com IA.</h3>
                  <p className="bcard-desc">
                    Veja BSR, tendência e oportunidade direto na página do produto Amazon.
                    O Agente IA gera análises diárias com raciocínio — sem limite de uso.
                  </p>
                  <div className="bcard-pills">
                    <span className="pill pill-active">1 clique para instalar</span>
                    <span className="pill pill-active">GPT-4o integrado</span>
                    <span className="pill pill-active">Análises ilimitadas</span>
                    <span className="pill">Chrome &amp; Edge</span>
                  </div>
                </div>
                <div className="bcard-metrics">
                  {[
                    {k:'BSR Atual',    v:'#4.230',     vc:''},
                    {k:'Tendência',   v:'↑ Em Alta',  vc:'metric-v-green'},
                    {k:'Score IA',    v:'8.4/10',     vc:''},
                    {k:'Análises',    v:'Ilimitadas', vc:'metric-v-green'},
                  ].map((m, i) => (
                    <div className="metric" key={i}>
                      <div className="metric-k">{m.k}</div>
                      <div className={`metric-v ${m.vc}`}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card: Simulador Financeiro */}
            <div className="bcard" style={{gridColumn:'3'}}>
              <div className="bcard-glow" />
              <div className="bcard-num">08</div>
              <span className="bcard-tag">08 · Simulador Financeiro</span>
              <h3 className="bcard-title">Saiba antes<br />de comprar.</h3>
              <p className="bcard-desc">Margem real, FBA fees e lucro líquido antes de qualquer decisão.</p>
              <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'12px',marginTop:'14px',fontFamily:'\'JetBrains Mono\',monospace',fontSize:'11px'}}>
                {[
                  {l:'Preço venda',   v:'R$67,00',   c:'var(--text)'},
                  {l:'Taxa Amazon',   v:'−R$10,05',  c:'var(--mut2)'},
                  {l:'FBA fee',       v:'−R$12,40',  c:'var(--mut2)'},
                  {l:'Custo produto', v:'−R$18,00',  c:'var(--mut2)'},
                ].map((r, i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{color:'var(--mut)'}}>{r.l}</span>
                    <span style={{color:r.c}}>{r.v}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0 0',marginTop:'4px'}}>
                  <span style={{color:'var(--green)',fontWeight:600}}>Lucro líquido</span>
                  <span style={{color:'var(--green)',fontWeight:600,fontSize:'14px'}}>R$26,55</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="sec how-bg" id="como-funciona">
        <div className="sec-inner">
          <span className="sec-tag">// como funciona</span>
          <h2 className="sec-title">Do zero ao produto<br /><em>vencedor.</em></h2>
          <div className="how-cols">
            {[
              {n:'01', t:'Assine e Acesse', d:'Escolha seu plano e receba o acesso por e-mail em minutos. Sem burocracia.', dn:'01'},
              {n:'02', t:'Explore os Dados', d:'Navegue pelas 8 ferramentas, filtre por categoria e encontre oportunidades reais.', dn:'02'},
              {n:'03', t:'Decida com Certeza', d:'Valide a margem no simulador, confirme com a extensão Chrome e compre com confiança.', dn:'03'},
            ].map((s, i) => (
              <div className="how-col" data-n={s.dn} key={i}>
                <div className="how-step-n">{s.n}</div>
                <div className="how-step-t">{s.t}</div>
                <p className="how-step-d">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="sec" id="planos" style={{background:'var(--bg)'}}>
        <div className="sec-inner">
          <div className="pricing-header">
            <span className="sec-tag" style={{display:'block',textAlign:'center'}}>// planos</span>
            <h2 className="sec-title" style={{textAlign:'center',maxWidth:'none'}}>
              Quanto vale estar<br /><em>um passo à frente?</em>
            </h2>
            <p style={{textAlign:'center',fontSize:'17px',color:'var(--mut2)',lineHeight:1.7}}>
              Acesso total às 8 ferramentas em qualquer plano. Sem limite.
            </p>
          </div>
          <div className="price-grid">
            {/* Mensal */}
            <div className="pc">
              <div className="pc-plan">Mensal</div>
              <div className="pc-price">79<span style={{fontSize:'32px',letterSpacing:0}}>,90</span></div>
              <div className="pc-period">R$ por mês</div>
              <div className="pc-eq">&nbsp;</div>
              <div className="pc-div" />
              <ul className="pc-list">
                <li>8 ferramentas completas</li>
                <li>Extensão Chrome incluída</li>
                <li>Agente IA ilimitado</li>
                <li>Simulador Financeiro</li>
                <li>Análise de concorrentes</li>
                <li>Renovação mensal</li>
              </ul>
              <a href={LINKS.monthly} className="pc-cta pc-cta-line">Assinar Mensal</a>
            </div>
            {/* Semestral */}
            <div className="pc pc-hot">
              <div className="pc-badge">Mais Popular</div>
              <div className="pc-plan pc-plan-hot">Semestral</div>
              <div className="pc-price pc-price-hot">397</div>
              <div className="pc-period">R$ por 6 meses</div>
              <div className="pc-eq">R$66/mês · <em>economize 17%</em></div>
              <div className="pc-div" />
              <ul className="pc-list">
                <li>Tudo do Mensal</li>
                <li>6 meses de acesso</li>
                <li>Prioridade no suporte</li>
                <li>Novas ferramentas inclusas</li>
                <li>Atualizações garantidas</li>
                <li>Economia de R$81,40</li>
              </ul>
              <a href={LINKS.biannual} className="pc-cta pc-cta-fill">Assinar Semestral</a>
            </div>
            {/* Anual */}
            <div className="pc">
              <div className="pc-plan">Anual</div>
              <div className="pc-price">597</div>
              <div className="pc-period">R$ por ano</div>
              <div className="pc-eq">R$49/mês · <em style={{color:'var(--green)'}}>economize 38%</em></div>
              <div className="pc-div" />
              <ul className="pc-list">
                <li>Tudo do Semestral</li>
                <li>12 meses de acesso</li>
                <li>Suporte VIP prioritário</li>
                <li>Acesso antecipado</li>
                <li>Melhor custo-benefício</li>
                <li>Economia de R$361,80</li>
              </ul>
              <a href={LINKS.annual} className="pc-cta pc-cta-line">Assinar Anual</a>
            </div>
          </div>
          <p className="price-note">Pagamento seguro · Acesso imediato · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sec" style={{background:'var(--s1)',borderTop:'1px solid var(--bd2)'}} id="faq">
        <div className="sec-inner">
          <span className="sec-tag">// perguntas</span>
          <h2 className="sec-title">O que você<br /><em>precisa saber.</em></h2>
          <div className="faq-inner">
            {[
              {q:'O acesso é imediato após o pagamento?', a:'Sim. Você recebe as credenciais por e-mail em minutos. Sem espera, sem aprovação manual.'},
              {q:'Preciso instalar algum software?', a:'Não. O Oráculo é 100% web. A extensão Chrome é opcional, instalada com um clique quando quiser.'},
              {q:'Com que frequência os dados são atualizados?', a:'Diariamente. Mais Vendidos, Em Alta e Recém Adicionados atualizam todo dia. O Agente IA gera novas análises a cada 24h.'},
              {q:'Posso cancelar quando quiser?', a:'Sim. Planos mensais podem ser cancelados a qualquer momento. Semestrais e anuais garantem o acesso pelo período contratado.'},
              {q:'O Agente IA tem limite de análises?', a:'Não. Análises completamente ilimitadas. Sem cota, sem créditos.'},
              {q:'A extensão Chrome está incluída?', a:'Sim. Todos os planos incluem a extensão sem custo adicional.'},
            ].map((item, i) => (
              <details className="fq" key={i}>
                <summary className="fq-q">{item.q}</summary>
                <p className="fq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="fcta">
        <div className="fcta-bg" />
        <div className="fcta-overlay" />
        <div className="fcta-in">
          <h2 className="fcta-title">
            Você já deveria<br />ter <em>começado.</em>
          </h2>
          <p className="fcta-sub">
            Cada dia sem o Oráculo é uma oportunidade
            que outra pessoa está aproveitando.
          </p>
          <a href={LINKS.biannual} className="cta-gold" style={{fontSize:'15px',padding:'16px 44px'}}>
            Começar Agora
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <span className="footer-brand">Oráculo</span>
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
