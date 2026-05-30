import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORÁCULO — Inteligência de Mercado Amazon FBA Brasil',
  description: 'Encontre produtos vencedores no Amazon FBA antes da concorrência. Dados reais, atualizados diariamente.',
  openGraph: { title: 'ORÁCULO', description: 'Encontre o próximo produto antes de todo mundo.' },
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
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}

        :root{
          /* Cool dark palette — gold contrasts properly */
          --bg:    #04040A;
          --s1:    #080812;
          --s2:    #0D0D1E;
          --s3:    #121228;
          --gold:  #F0B429;
          --gold2: #FFD060;
          --gold3: #C8880A;
          --white: #F4F0FF;
          --text:  #C8C4D8;
          --mut:   #686278;
          --mut2:  #9890A8;
          --green: #4ADE80;
          --blue:  #60A5FA;
          --red:   #F87171;
          --bd:    rgba(255,255,255,0.07);
          --bd-g:  rgba(240,180,41,0.16);
        }

        body{
          font-family:'DM Sans',system-ui,sans-serif;
          background:var(--bg);
          color:var(--text);
          -webkit-font-smoothing:antialiased;
          overflow-x:hidden;
        }
        /* Grain */
        body::after{
          content:'';
          position:fixed;inset:0;z-index:9999;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:180px 180px;
          opacity:0.028;pointer-events:none;
        }
        a{text-decoration:none;color:inherit}
        ::selection{background:rgba(240,180,41,0.25);color:#fff}
        ::-webkit-scrollbar{width:2px}
        ::-webkit-scrollbar-thumb{background:rgba(240,180,41,0.18);border-radius:2px}

        /* ── KEYFRAMES ─────────────────────────────────── */
        @keyframes eyeBreath{
          0%,100%{transform:scale(1);filter:brightness(0.58) saturate(0.9)}
          50%{transform:scale(1.04);filter:brightness(0.72) saturate(1)}
        }
        @keyframes scanLine{
          0%{transform:translateY(-100%);opacity:0}
          8%{opacity:0.8}90%{opacity:0.8}
          100%{transform:translateY(600%);opacity:0}
        }
        @keyframes goldShimmer{
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes fadeUp{
          from{opacity:0;transform:translateY(24px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes floatA{
          0%,100%{transform:translateY(0) rotate(-0.6deg)}
          50%{transform:translateY(-12px) rotate(0.6deg)}
        }
        @keyframes floatB{
          0%,100%{transform:translateY(-5px) rotate(0.4deg)}
          50%{transform:translateY(9px) rotate(-0.4deg)}
        }
        @keyframes floatC{
          0%,100%{transform:translateY(-8px)}
          50%{transform:translateY(4px)}
        }
        @keyframes notifSlide{
          from{opacity:0;transform:translateX(20px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes marquee{
          from{transform:translateX(0)}
          to{transform:translateX(-50%)}
        }
        @keyframes marqueeRev{
          from{transform:translateX(-50%)}
          to{transform:translateX(0)}
        }
        @keyframes borderPulse{
          0%,100%{box-shadow:0 0 0 0 rgba(240,180,41,0.22),0 0 40px rgba(240,180,41,0.07)}
          50%{box-shadow:0 0 0 7px rgba(240,180,41,0),0 0 70px rgba(240,180,41,0.2)}
        }
        @keyframes barGrow{
          from{height:0}
          to{height:var(--h)}
        }
        @keyframes pulseGreen{
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.6;transform:scale(1.2)}
        }
        @keyframes meshDrift{
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }
        @keyframes lineReveal{
          from{transform:scaleX(0);opacity:0}
          to{transform:scaleX(1);opacity:1}
        }

        /* ── NAV ─────────────────────────────────────────── */
        .nav{
          position:fixed;top:0;left:0;right:0;z-index:200;
          height:62px;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 44px;
          background:rgba(4,4,10,0.8);
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border-bottom:1px solid var(--bd);
        }
        .nav-brand{
          display:flex;align-items:center;gap:9px;
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:700;font-size:17px;letter-spacing:3px;
          color:var(--white);text-transform:uppercase;
        }
        .nav-orb{
          width:9px;height:9px;border-radius:50%;
          background:var(--gold);
          box-shadow:0 0 10px var(--gold),0 0 20px rgba(240,180,41,0.3);
        }
        .nav-r{display:flex;align-items:center;gap:4px}
        .nav-a{
          font-size:13.5px;font-weight:500;
          color:var(--mut2);padding:8px 16px;
          transition:color .2s;
        }
        .nav-a:hover{color:var(--white)}
        .nav-cta{
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:13px;font-weight:700;
          color:var(--bg);background:var(--gold);
          padding:9px 24px;border-radius:6px;
          letter-spacing:0.3px;
          transition:all .25s;
          box-shadow:0 2px 20px rgba(240,180,41,0.25);
        }
        .nav-cta:hover{background:var(--gold2);box-shadow:0 4px 36px rgba(240,180,41,0.4)}

        /* ── HERO ────────────────────────────────────────── */
        .hero{
          position:relative;
          min-height:100svh;
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;
        }
        .hero-eye{
          position:absolute;inset:0;
          background-image:url('/oracle-eye.png');
          background-size:cover;
          background-position:center 38%;
          animation:eyeBreath 10s ease-in-out infinite;
          transform-origin:center center;
        }
        .hero-scan{
          position:absolute;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,rgba(240,180,41,0.45),rgba(255,240,150,0.65),rgba(240,180,41,0.45),transparent);
          animation:scanLine 9s ease-in-out infinite 3s;
          pointer-events:none;z-index:2;
        }
        .hero-overlay{
          position:absolute;inset:0;
          background:
            linear-gradient(180deg,
              rgba(4,4,10,0.6) 0%,
              rgba(4,4,10,0.08) 28%,
              rgba(4,4,10,0.08) 48%,
              rgba(4,4,10,0.72) 70%,
              rgba(4,4,10,0.97) 100%
            ),
            radial-gradient(ellipse 55% 55% at 50% 55%,rgba(4,4,10,0.55),transparent);
        }
        .hero-in{
          position:relative;z-index:3;
          text-align:center;
          padding:80px 24px 100px;
          display:flex;flex-direction:column;
          align-items:center;
        }
        .hero-label{
          font-family:'JetBrains Mono',monospace;
          font-size:10px;letter-spacing:3px;
          color:var(--gold);opacity:0.7;
          text-transform:uppercase;
          margin-bottom:28px;
          display:flex;align-items:center;gap:14px;
          animation:fadeIn 1s ease .4s both;
        }
        .hero-label::before,.hero-label::after{
          content:'';flex:1;max-width:32px;height:1px;
          background:var(--gold);opacity:0.35;
        }
        .hero-title{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:800;
          font-size:clamp(52px,9.5vw,128px);
          line-height:1.0;
          letter-spacing:-2px;
          color:var(--white);
          margin-bottom:16px;
          animation:fadeUp .9s ease .6s both;
          max-width:900px;
        }
        .hero-title .accent{
          background:linear-gradient(100deg,var(--gold3) 0%,var(--gold) 25%,var(--gold2) 50%,#FFF8C0 60%,var(--gold2) 75%,var(--gold) 100%);
          background-size:200% auto;
          animation:goldShimmer 5s linear infinite;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .hero-rule{
          width:64px;height:1.5px;
          background:linear-gradient(90deg,transparent,var(--gold),transparent);
          margin:20px auto;
          transform-origin:center;
          animation:lineReveal .8s ease 1.2s both;
        }
        .hero-sub{
          font-size:18px;color:var(--mut2);
          max-width:500px;line-height:1.72;
          margin-bottom:38px;
          animation:fadeUp .8s ease 1.4s both;
        }
        .hero-sub strong{color:var(--text);font-weight:500}
        .hero-btns{
          display:flex;align-items:center;gap:14px;
          flex-wrap:wrap;justify-content:center;
          animation:fadeUp .8s ease 1.55s both;
        }
        .btn-primary{
          display:inline-flex;align-items:center;gap:9px;
          padding:15px 38px;
          background:var(--gold);color:var(--bg);
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:700;font-size:15px;letter-spacing:0.3px;
          border-radius:8px;
          box-shadow:0 4px 40px rgba(240,180,41,0.35);
          transition:all .3s;
          animation:borderPulse 4s ease infinite 3s;
        }
        .btn-primary:hover{background:var(--gold2);transform:translateY(-2px);box-shadow:0 8px 56px rgba(240,180,41,0.5)}
        .btn-ghost{
          font-size:14px;font-weight:500;
          color:var(--mut2);
          padding:8px 4px;
          border-bottom:1px solid rgba(150,140,160,0.3);
          transition:all .2s;
        }
        .btn-ghost:hover{color:var(--white);border-color:rgba(255,255,255,0.5)}

        /* Notification cards */
        .notif{
          position:absolute;z-index:4;
          background:rgba(4,4,10,0.88);
          border:1px solid rgba(255,255,255,0.1);
          backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
          border-radius:14px;
          padding:12px 16px;
          box-shadow:0 20px 60px rgba(0,0,0,0.75),inset 0 1px 0 rgba(255,255,255,0.06);
          min-width:240px;max-width:280px;
        }
        .notif-a{
          left:3.5%;bottom:34%;
          animation:floatA 7.5s ease-in-out infinite, notifSlide .6s ease 2.5s both;
        }
        .notif-b{
          right:3.5%;bottom:44%;
          animation:floatB 9s ease-in-out infinite, notifSlide .6s ease 2.8s both;
        }
        .notif-c{
          right:3.5%;bottom:28%;
          animation:floatC 8s ease-in-out infinite, notifSlide .6s ease 3.1s both;
        }
        .notif-head{
          display:flex;align-items:center;gap:8px;
          margin-bottom:7px;
        }
        .notif-icon{
          width:28px;height:28px;border-radius:7px;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;flex-shrink:0;
        }
        .notif-icon-green{background:rgba(74,222,128,0.12)}
        .notif-icon-gold{background:rgba(240,180,41,0.12)}
        .notif-icon-blue{background:rgba(96,165,250,0.12)}
        .notif-ttl{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:600;font-size:12px;
          color:var(--white);flex:1;
        }
        .notif-time{
          font-family:'JetBrains Mono',monospace;
          font-size:9px;color:var(--mut);
        }
        .notif-body{
          font-size:13px;color:var(--text);
          margin-bottom:4px;font-weight:500;
        }
        .notif-meta{
          display:flex;align-items:center;gap:8px;
          font-family:'JetBrains Mono',monospace;
          font-size:10px;
        }
        .notif-val-g{color:var(--green)}
        .notif-val-o{color:var(--gold)}
        .live-dot{
          width:5px;height:5px;border-radius:50%;
          display:inline-block;
          animation:pulseGreen 2s ease infinite;
        }
        .dot-green{background:var(--green);box-shadow:0 0 5px var(--green)}
        .dot-gold{background:var(--gold);box-shadow:0 0 5px var(--gold)}

        /* ── MARQUEE ─────────────────────────────────────── */
        .mq-wrap{
          overflow:hidden;
          border-top:1px solid var(--bd);
          border-bottom:1px solid var(--bd);
          background:var(--s1);
          padding:14px 0;
        }
        .mq-track{
          display:flex;width:max-content;
          animation:marquee 30s linear infinite;
        }
        .mq-item{
          display:flex;align-items:center;gap:0;
          padding:0 24px;
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:600;font-size:11px;
          letter-spacing:2px;text-transform:uppercase;
          color:var(--mut);white-space:nowrap;
        }
        .mq-sep{
          padding:0 24px;
          color:var(--gold);opacity:0.35;font-size:8px;
        }

        /* ── PROOF NUMBERS ───────────────────────────────── */
        .proof{
          padding:80px 32px;background:var(--bg);
          position:relative;overflow:hidden;
        }
        .proof::before{
          content:'';
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:800px;height:400px;
          background:radial-gradient(ellipse,rgba(240,180,41,0.04),transparent 70%);
          pointer-events:none;
        }
        .proof-grid{
          max-width:960px;margin:0 auto;
          display:grid;grid-template-columns:repeat(4,1fr);
          gap:1px;background:var(--bd);
          border:1px solid var(--bd);border-radius:10px;
          overflow:hidden;
        }
        .pnum{
          background:var(--bg);
          padding:38px 24px;text-align:center;
          position:relative;overflow:hidden;
          transition:background .3s;
        }
        .pnum:hover{background:var(--s1)}
        .pnum-n{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:800;
          font-size:clamp(36px,4.5vw,58px);
          line-height:1;letter-spacing:-1.5px;
          color:var(--gold);
          display:block;margin-bottom:10px;
        }
        .pnum-l{
          font-size:13px;color:var(--mut2);
          line-height:1.4;letter-spacing:0.2px;
        }

        /* ── STATEMENT ───────────────────────────────────── */
        .statement{
          padding:120px 32px;
          background:var(--s1);
          border-top:1px solid var(--bd);
          border-bottom:1px solid var(--bd);
          text-align:center;position:relative;
          overflow:hidden;
        }
        .statement::before{
          content:'';position:absolute;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:700px;height:500px;border-radius:50%;
          background:radial-gradient(ellipse,rgba(240,180,41,0.05),transparent 70%);
          pointer-events:none;
        }
        .stmt-eyebrow{
          font-family:'JetBrains Mono',monospace;
          font-size:9.5px;letter-spacing:2.5px;
          color:var(--gold);opacity:0.6;
          text-transform:uppercase;
          margin-bottom:20px;display:block;
        }
        .stmt-text{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:700;
          font-size:clamp(28px,4.5vw,56px);
          color:var(--white);
          max-width:820px;margin:0 auto;
          line-height:1.22;letter-spacing:-0.8px;
          position:relative;z-index:1;
        }
        .stmt-text em{
          color:transparent;
          background:linear-gradient(90deg,var(--gold3),var(--gold),var(--gold2));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;font-style:normal;
        }

        /* ── SECTION BASE ────────────────────────────────── */
        .sec{padding:100px 32px;position:relative}
        .sec-in{max-width:1120px;margin:0 auto}
        .stag{
          font-family:'JetBrains Mono',monospace;
          font-size:9.5px;letter-spacing:2.5px;
          color:var(--gold);opacity:0.6;
          text-transform:uppercase;
          display:block;margin-bottom:14px;
        }
        .sh{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:800;
          font-size:clamp(34px,4.8vw,58px);
          color:var(--white);
          line-height:1.08;letter-spacing:-1px;
          margin-bottom:16px;
        }
        .sh em{color:var(--gold);font-style:normal}
        .sp{font-size:17px;color:var(--mut2);max-width:500px;line-height:1.72}

        /* ── BENTO FEATURES ──────────────────────────────── */
        .bento{
          display:grid;
          grid-template-columns:1.4fr 1fr 1fr;
          grid-template-rows:auto auto;
          gap:10px;
          margin-top:58px;
        }
        .bt{grid-row:span 2}
        .bw{grid-column:span 2}
        .bc{
          background:var(--s2);
          border:1px solid var(--bd);
          border-radius:12px;
          padding:28px 26px;
          position:relative;overflow:hidden;
          transition:border-color .3s,transform .3s,box-shadow .3s;
        }
        .bc:hover{
          border-color:rgba(240,180,41,0.2);
          transform:translateY(-2px);
          box-shadow:0 16px 48px rgba(0,0,0,0.4);
        }
        .bc::before{
          content:'';
          position:absolute;top:0;left:0;right:0;height:1.5px;
          background:linear-gradient(90deg,transparent,var(--gold),transparent);
          opacity:0;transition:opacity .3s;
        }
        .bc:hover::before{opacity:0.5}
        .bc-mesh{
          position:absolute;top:-60px;right:-60px;
          width:200px;height:200px;border-radius:50%;
          background:radial-gradient(circle,rgba(240,180,41,0.04),transparent 70%);
          pointer-events:none;
        }
        .bc-num{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:800;
          font-size:56px;line-height:1;letter-spacing:-3px;
          color:var(--gold);opacity:0.06;
          position:absolute;top:12px;right:14px;
          pointer-events:none;
        }
        .bc-tag{
          font-family:'JetBrains Mono',monospace;
          font-size:9px;letter-spacing:1.8px;
          color:var(--gold);opacity:0.55;
          text-transform:uppercase;
          display:block;margin-bottom:10px;
        }
        .bc-title{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:700;
          font-size:20px;color:var(--white);
          line-height:1.25;letter-spacing:-0.3px;
          margin-bottom:10px;
        }
        .bc-desc{font-size:13.5px;color:var(--mut2);line-height:1.7;margin-bottom:16px}
        .bc-new{
          display:inline-block;
          font-family:'JetBrains Mono',monospace;
          font-size:8px;font-weight:500;letter-spacing:1px;
          color:var(--gold);border:1px solid var(--gold);
          padding:2px 7px;border-radius:3px;
          margin-bottom:8px;opacity:0.8;
        }

        /* Sparkline bars */
        .sparkline{
          display:flex;align-items:flex-end;gap:3px;
          height:42px;margin-top:12px;
        }
        .bar{
          flex:1;border-radius:2px 2px 0 0;
          background:rgba(240,180,41,0.18);
          min-height:4px;
          transition:background .2s;
          height:var(--h);
        }
        .bar:hover{background:rgba(240,180,41,0.45)}
        .bar-hi{background:rgba(240,180,41,0.55) !important}
        .bar-g{background:rgba(74,222,128,0.35) !important}
        .bar-g-hi{background:rgba(74,222,128,0.7) !important}

        /* Mini table */
        .mtable{
          font-family:'JetBrains Mono',monospace;
          font-size:10px;
          background:rgba(0,0,0,0.3);
          border:1px solid rgba(255,255,255,0.04);
          border-radius:8px;overflow:hidden;
        }
        .mth{
          display:grid;grid-template-columns:2fr 1fr 1fr;
          padding:7px 12px;
          background:rgba(255,255,255,0.02);
          border-bottom:1px solid rgba(255,255,255,0.04);
          color:var(--mut);letter-spacing:1px;font-size:8.5px;text-transform:uppercase;
        }
        .mtr{
          display:grid;grid-template-columns:2fr 1fr 1fr;
          padding:7px 12px;
          border-bottom:1px solid rgba(255,255,255,0.025);
          align-items:center;
          transition:background .15s;
        }
        .mtr:last-child{border-bottom:none}
        .mtr:hover{background:rgba(240,180,41,0.03)}
        .mtr-n{color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9.5px}
        .mtr-p{color:var(--gold);font-size:9.5px}
        .mtr-t{color:var(--green);font-size:9.5px;text-align:right}

        /* Metric block */
        .mblock{
          background:rgba(0,0,0,0.35);
          border:1px solid var(--bd);
          border-radius:8px;padding:12px 14px;
          font-family:'JetBrains Mono',monospace;
        }
        .mblock-k{font-size:8.5px;color:var(--mut);letter-spacing:1px;text-transform:uppercase;margin-bottom:3px}
        .mblock-v{font-size:18px;font-weight:500;color:var(--gold);letter-spacing:-0.5px}
        .mblock-v-g{color:var(--green)}

        /* Pills */
        .pills{display:flex;flex-wrap:wrap;gap:6px}
        .pill{
          padding:4px 10px;border-radius:100px;
          font-size:11.5px;font-weight:500;
          border:1px solid var(--bd);color:var(--mut2);
        }
        .pill-on{border-color:var(--bd-g);color:var(--gold);background:rgba(240,180,41,0.05)}

        /* Wide card horizontal layout */
        .bc-hz{display:flex;gap:24px;align-items:flex-start}
        .bc-hz-copy{flex:1}
        .bc-metrics{display:flex;flex-direction:column;gap:8px;flex-shrink:0}

        /* Simulator card */
        .sim{
          background:rgba(0,0,0,0.35);
          border-radius:8px;padding:14px;
          font-family:'JetBrains Mono',monospace;
          font-size:10.5px;margin-top:4px;
        }
        .sim-row{
          display:flex;justify-content:space-between;
          padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);
        }
        .sim-row:last-child{border-bottom:none}
        .sim-k{color:var(--mut)}
        .sim-v{color:var(--text)}
        .sim-total{
          display:flex;justify-content:space-between;
          padding:10px 0 0;margin-top:4px;
          border-top:1px solid rgba(240,180,41,0.15);
        }
        .sim-total-k{color:var(--green);font-weight:600;font-size:12px}
        .sim-total-v{color:var(--green);font-weight:600;font-size:16px}

        /* ── COMO FUNCIONA ───────────────────────────────── */
        .how-bg{
          background:var(--s1);
          border-top:1px solid var(--bd);
          border-bottom:1px solid var(--bd);
        }
        .how-grid{
          display:grid;grid-template-columns:repeat(3,1fr);
          gap:1px;background:var(--bd);
          border:1px solid var(--bd);border-radius:10px;
          overflow:hidden;margin-top:52px;
        }
        .how-col{
          background:var(--s1);
          padding:44px 32px;position:relative;
          overflow:hidden;
        }
        .how-col::after{
          content:attr(data-n);
          position:absolute;bottom:12px;right:16px;
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:800;font-size:80px;
          color:var(--gold);opacity:0.04;
          letter-spacing:-4px;line-height:1;
          pointer-events:none;
        }
        .how-n{
          font-family:'JetBrains Mono',monospace;
          font-size:9.5px;letter-spacing:2px;
          color:var(--gold);opacity:0.55;
          margin-bottom:20px;
          display:flex;align-items:center;gap:10px;
        }
        .how-n::after{content:'';width:20px;height:1px;background:var(--gold);opacity:0.35}
        .how-t{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:700;font-size:19px;
          color:var(--white);
          margin-bottom:10px;letter-spacing:-0.3px;
        }
        .how-d{font-size:14px;color:var(--mut2);line-height:1.72}

        /* ── PRICING ─────────────────────────────────────── */
        .price-hd{text-align:center;margin-bottom:52px}
        .pgrid{
          display:grid;grid-template-columns:repeat(3,1fr);
          gap:1px;background:var(--bd);
          border:1px solid var(--bd);border-radius:12px;
          overflow:hidden;
          box-shadow:0 48px 96px rgba(0,0,0,0.6);
        }
        .pc{background:var(--s2);padding:44px 32px;position:relative}
        .pc-hot{
          background:#0E0C1C;
          animation:borderPulse 5s ease infinite;
        }
        .pc-hot::before{
          content:'';
          position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,var(--gold3) 20%,var(--gold2) 50%,var(--gold3) 80%,transparent);
        }
        .pc-badge{
          position:absolute;top:-1px;left:50%;transform:translateX(-50%);
          background:var(--gold);color:var(--bg);
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:9px;font-weight:700;letter-spacing:1.5px;
          text-transform:uppercase;
          padding:4px 14px;border-radius:0 0 7px 7px;
          white-space:nowrap;
        }
        .pc-plan{
          font-family:'JetBrains Mono',monospace;
          font-size:9.5px;letter-spacing:2.5px;
          color:var(--mut);text-transform:uppercase;
          margin-bottom:22px;
        }
        .pc-plan-h{color:var(--gold);opacity:0.8}
        .pc-price{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:800;
          font-size:clamp(56px,6vw,76px);
          line-height:0.95;letter-spacing:-2px;
          color:var(--white);margin-bottom:6px;
        }
        .pc-price-h{color:var(--gold)}
        .pc-period{font-size:13px;color:var(--mut);margin-bottom:5px}
        .pc-eq{
          font-family:'JetBrains Mono',monospace;
          font-size:10.5px;color:var(--mut);
          margin-bottom:26px;
        }
        .pc-eq em{color:var(--green);font-style:normal}
        .pc-div{height:1px;background:var(--bd);margin:18px 0}
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
          text-align:center;border-radius:7px;
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:700;font-size:14.5px;
          letter-spacing:0.3px;cursor:pointer;transition:all .25s;
        }
        .pc-line{border:1px solid rgba(240,180,41,0.2);color:var(--gold)}
        .pc-line:hover{background:rgba(240,180,41,0.06);border-color:rgba(240,180,41,0.4)}
        .pc-fill{background:var(--gold);color:var(--bg);border:none;box-shadow:0 4px 24px rgba(240,180,41,0.22)}
        .pc-fill:hover{background:var(--gold2);box-shadow:0 8px 44px rgba(240,180,41,0.4);transform:translateY(-1px)}
        .price-note{
          text-align:center;margin-top:20px;
          font-family:'JetBrains Mono',monospace;
          font-size:10px;letter-spacing:0.8px;
          color:var(--mut);opacity:0.6;
        }

        /* ── FAQ ─────────────────────────────────────────── */
        .faq-inner{max-width:700px;margin:52px auto 0;border-top:1px solid var(--bd)}
        details.fq{border-bottom:1px solid var(--bd)}
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
          content:'＋';font-size:18px;
          color:var(--gold);flex-shrink:0;
          transition:all .2s;
        }
        details[open] summary.fq-q{color:var(--white)}
        details[open] summary.fq-q::after{content:'－'}
        .fq-a{
          padding:0 0 20px;font-size:15px;
          color:var(--mut2);line-height:1.76;
          max-width:580px;
        }

        /* ── FINAL CTA ───────────────────────────────────── */
        .fcta{
          position:relative;overflow:hidden;
          text-align:center;padding:140px 32px;
        }
        .fcta-bg{
          position:absolute;inset:0;
          background-image:url('/hero-bg.png');
          background-size:cover;background-position:center;
          opacity:0.22;
        }
        .fcta-ov{
          position:absolute;inset:0;
          background:
            radial-gradient(ellipse 70% 80% at 50% 50%,rgba(4,4,10,0.35),rgba(4,4,10,0.85) 70%),
            linear-gradient(180deg,rgba(4,4,10,0.7),rgba(4,4,10,0.4),rgba(4,4,10,0.85));
        }
        .fcta-in{position:relative;z-index:1}
        .fcta-h{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:800;
          font-size:clamp(46px,8vw,100px);
          line-height:0.96;letter-spacing:-2px;
          color:var(--white);margin-bottom:18px;
        }
        .fcta-h em{
          background:linear-gradient(100deg,var(--gold3),var(--gold),var(--gold2),var(--gold));
          background-size:200% auto;
          animation:goldShimmer 5s linear infinite;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;font-style:normal;
        }
        .fcta-sub{
          font-size:17px;color:var(--mut2);
          max-width:400px;margin:0 auto 42px;line-height:1.7;
        }

        /* ── FOOTER ──────────────────────────────────────── */
        .footer{
          border-top:1px solid var(--bd);
          padding:26px 44px;
          display:flex;align-items:center;
          justify-content:space-between;
          flex-wrap:wrap;gap:14px;
          background:var(--s1);
        }
        .footer-b{
          font-family:'Bricolage Grotesque',sans-serif;
          font-weight:700;font-size:13px;
          letter-spacing:3px;color:var(--mut);
          text-transform:uppercase;
        }
        .footer-ls{display:flex;gap:24px}
        .footer-l{font-size:13px;color:var(--mut);transition:color .2s}
        .footer-l:hover{color:var(--gold)}

        /* ── RESPONSIVE ──────────────────────────────────── */
        @media(max-width:1040px){
          .bento{grid-template-columns:1fr 1fr;grid-template-rows:auto}
          .bt{grid-row:auto}
          .bw{grid-column:span 2}
          .proof-grid{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:760px){
          .nav{padding:0 20px}
          .nav-a{display:none}
          .notif-a,.notif-b,.notif-c{display:none}
          .bento{grid-template-columns:1fr}
          .bw{grid-column:auto}
          .how-grid{grid-template-columns:1fr}
          .pgrid{grid-template-columns:1fr}
          .footer{flex-direction:column;text-align:center}
          .footer-ls{flex-wrap:wrap;justify-content:center}
        }
        @media(max-width:500px){
          .proof-grid{grid-template-columns:repeat(2,1fr)}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <a href="/" className="nav-brand">
          <span className="nav-orb" /> Oráculo
        </a>
        <div className="nav-r">
          <a href="#ferramentas" className="nav-a">Ferramentas</a>
          <a href="#planos" className="nav-a">Planos</a>
          <a href="/login" className="nav-a">Entrar</a>
          <a href={LINKS.biannual} className="nav-cta">Começar</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-eye" />
        <div className="hero-scan" />
        <div className="hero-overlay" />

        {/* Notification cards floating over the eye */}
        <div className="notif notif-a">
          <div className="notif-head">
            <div className="notif-icon notif-icon-green">📈</div>
            <span className="notif-ttl">Produto em Alta</span>
            <span className="notif-time">agora</span>
          </div>
          <div className="notif-body">Suporte Pescoço Elástico</div>
          <div className="notif-meta">
            <span className="live-dot dot-green" />
            <span className="notif-val-g">+312%</span>
            <span style={{color:'var(--mut)'}}>·</span>
            <span style={{color:'var(--text)'}}>R$24,90</span>
            <span style={{color:'var(--mut)'}}>· SP</span>
          </div>
        </div>

        <div className="notif notif-b">
          <div className="notif-head">
            <div className="notif-icon notif-icon-gold">💡</div>
            <span className="notif-ttl">Oportunidade Genérico</span>
            <span className="notif-time">há 2min</span>
          </div>
          <div className="notif-body">Kit Skincare Masculino</div>
          <div className="notif-meta">
            <span className="live-dot dot-gold" />
            <span className="notif-val-o">62% margem</span>
            <span style={{color:'var(--mut)'}}>·</span>
            <span style={{color:'var(--text)'}}>Sem marca forte</span>
          </div>
        </div>

        <div className="notif notif-c">
          <div className="notif-head">
            <div className="notif-icon notif-icon-blue">⚡</div>
            <span className="notif-ttl">BSR Subindo</span>
            <span className="notif-time">há 5min</span>
          </div>
          <div className="notif-body">Esteira Dobrável Portátil</div>
          <div className="notif-meta">
            <span className="notif-val-g">BSR #2.180 ↑</span>
            <span style={{color:'var(--mut)'}}>·</span>
            <span style={{color:'var(--text)'}}>+445% 7d</span>
          </div>
        </div>

        {/* Center content */}
        <div className="hero-in">
          <div className="hero-label">Sistema de Inteligência · Amazon FBA Brasil</div>

          <h1 className="hero-title">
            Seu concorrente<br />
            já encontrou o<br />
            <span className="accent">produto.</span>
          </h1>

          <div className="hero-rule" />

          <p className="hero-sub">
            O Oráculo analisa <strong>milhares de produtos Amazon FBA</strong> todo dia
            para você encontrar os próximos campeões de vendas —
            antes de todo mundo.
          </p>

          <div className="hero-btns">
            <a href={LINKS.biannual} className="btn-primary">
              Ver o que o mercado esconde
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href="/login" className="btn-ghost">Já tenho conta</a>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="mq-wrap">
        <div className="mq-track">
          {[
            'Mais Vendidos','Em Alta','Recém Adicionados','Genéricos','Análise Rival',
            'Extensão Chrome','Agente IA','Simulador Financeiro','847 Sellers',
            'Dados Diários','Amazon FBA Brasil','12.847 Produtos',
            'Mais Vendidos','Em Alta','Recém Adicionados','Genéricos','Análise Rival',
            'Extensão Chrome','Agente IA','Simulador Financeiro','847 Sellers',
            'Dados Diários','Amazon FBA Brasil','12.847 Produtos',
          ].map((t, i) => (
            <span key={i} className="mq-item">
              {t}
              <span className="mq-sep">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── NUMBERS ── */}
      <div className="proof">
        <div className="proof-grid">
          {[
            {v:'12.847',l:'produtos analisados\npor dia'},
            {v:'847',   l:'sellers ativos\nna plataforma'},
            {v:'8',     l:'ferramentas\nexclusivas'},
            {v:'40×',   l:'mais rápido que\npesquisa manual'},
          ].map((n, i) => (
            <div className="pnum" key={i}>
              <span className="pnum-n">{n.v}</span>
              <span className="pnum-l" style={{whiteSpace:'pre-line'}}>{n.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATEMENT ── */}
      <section className="statement">
        <span className="stmt-eyebrow">// a realidade do mercado</span>
        <p className="stmt-text">
          Todo dia sem dados é um dia que<br />
          outro seller <em>lucrou no seu lugar.</em>
        </p>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section className="sec" id="ferramentas">
        <div className="sec-in">
          <span className="stag">// ferramentas</span>
          <h2 className="sh">O que o Oráculo<br /><em>enxerga por você.</em></h2>
          <p className="sp">8 ferramentas integradas. Dados reais. Decisões certas.</p>

          <div className="bento">

            {/* BIG: Radar */}
            <div className="bc bt">
              <div className="bc-mesh" />
              <div className="bc-num">01</div>
              <span className="bc-tag">01 · 02 · 03 — Mineração de Mercado</span>
              <h3 className="bc-title">O radar que<br />nunca para.</h3>
              <p className="bc-desc">Mais Vendidos, Em Alta e Recém Adicionados — atualizados diariamente. Veja o que está vendendo antes que qualquer concorrente perceba.</p>
              <div className="mtable">
                <div className="mth"><span>Produto</span><span>Preço</span><span style={{textAlign:'right'}}>Var. 7d</span></div>
                {[
                  {n:'Suporte Pescoço Elástico',p:'R$24,90',t:'+312%'},
                  {n:'Kit Skincare Masculino',  p:'R$67,00',t:'+234%'},
                  {n:'Organizador Gaveta',      p:'R$18,50',t:'+189%'},
                  {n:'Esteira Dobrável',        p:'R$89,90',t:'+445%'},
                  {n:'Cabo USB-C 2m',           p:'R$12,90',t:'+156%'},
                ].map((r,i)=>(
                  <div className="mtr" key={i}>
                    <span className="mtr-n">{r.n}</span>
                    <span className="mtr-p">{r.p}</span>
                    <span className="mtr-t">{r.t}</span>
                  </div>
                ))}
              </div>
              <div className="sparkline" style={{marginTop:'16px'}}>
                {[35,50,42,65,58,72,68,80,75,90,85,100].map((h,i)=>(
                  <div key={i} className={`bar${i>=10?` bar-g-hi`:i>=8?` bar-g`:''}`} style={{'--h':`${h}%`} as React.CSSProperties} />
                ))}
              </div>
            </div>

            {/* Rival */}
            <div className="bc">
              <div className="bc-mesh" />
              <div className="bc-num">05</div>
              <span className="bc-tag">05 — Análise Rival</span>
              <h3 className="bc-title">A fraqueza deles é<br />sua oportunidade.</h3>
              <p className="bc-desc">Analise qualquer concorrente por ASIN. Descubra preço, avaliações e brechas estratégicas.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'7px',marginTop:'14px'}}>
                {[
                  {k:'Margem genéricos',v:'62%',c:'var(--gold)'},
                  {k:'Sem concorrente forte',v:'38% dos produtos',c:'var(--gold)'},
                  {k:'Score oportunidade',v:'9.2 / 10',c:'var(--green)'},
                ].map((m,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontSize:'12px',color:'var(--mut2)',fontFamily:'\'JetBrains Mono\',monospace'}}>{m.k}</span>
                    <span style={{fontSize:'12px',fontWeight:600,color:m.c,fontFamily:'\'JetBrains Mono\',monospace'}}>{m.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Genéricos */}
            <div className="bc">
              <div className="bc-mesh" />
              <div className="bc-num">04</div>
              <span className="bc-tag">04 — Produtos Genéricos</span>
              <h3 className="bc-title">Margem alta.<br />Sem marca disputando.</h3>
              <p className="bc-desc">O filtro que encontra produtos sem marca com alto potencial de margem — o segredo dos sellers avançados.</p>
              <div className="pills" style={{marginTop:'14px'}}>
                <span className="pill pill-on">+60% de margem</span>
                <span className="pill pill-on">Sem rival dominante</span>
                <span className="pill">Volume &gt;3.000/dia</span>
              </div>
              <div className="sparkline" style={{marginTop:'14px'}}>
                {[45,55,40,70,60,80,72,68,85,90,88,100].map((h,i)=>(
                  <div key={i} className={`bar${i>=9?` bar-hi`:''}`} style={{'--h':`${h}%`} as React.CSSProperties} />
                ))}
              </div>
            </div>

            {/* WIDE: Extensão + IA */}
            <div className="bc bw">
              <div className="bc-mesh" />
              <div className="bc-num">07</div>
              <div className="bc-hz">
                <div className="bc-hz-copy">
                  <span className="bc-new">Novo</span>
                  <span className="bc-tag" style={{marginTop:'6px'}}>06 · 07 — Extensão Chrome + Agente IA</span>
                  <h3 className="bc-title">Na página do produto.<br />Com IA. Ao vivo.</h3>
                  <p className="bc-desc">Veja BSR, tendência e score de oportunidade diretamente na Amazon — sem trocar de aba. O Agente IA entrega análises diárias com raciocínio. Sem limite.</p>
                  <div className="pills" style={{marginTop:'14px'}}>
                    <span className="pill pill-on">1 clique para ativar</span>
                    <span className="pill pill-on">GPT-4o integrado</span>
                    <span className="pill pill-on">Análises ilimitadas</span>
                    <span className="pill">Chrome &amp; Edge</span>
                  </div>
                </div>
                <div className="bc-metrics">
                  {[
                    {k:'BSR Atual',   v:'#4.230',    vc:''},
                    {k:'Tendência',   v:'↑ Em Alta', vc:'mblock-v-g'},
                    {k:'Score IA',    v:'8.4/10',    vc:''},
                    {k:'Análises',    v:'∞',         vc:'mblock-v-g'},
                  ].map((m,i)=>(
                    <div className="mblock" key={i}>
                      <div className="mblock-k">{m.k}</div>
                      <div className={`mblock-v ${m.vc}`}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulador */}
            <div className="bc" style={{gridColumn:'3 / 4',gridRow:'2 / 3'}}>
              <div className="bc-mesh" />
              <div className="bc-num">08</div>
              <span className="bc-new">Novo</span>
              <span className="bc-tag" style={{marginTop:'6px'}}>08 — Simulador Financeiro</span>
              <h3 className="bc-title">Saiba o lucro<br />antes de comprar.</h3>
              <div className="sim">
                {[
                  {k:'Preço venda',   v:'R$67,00'},
                  {k:'Taxa Amazon',   v:'−R$10,05'},
                  {k:'FBA Fee',       v:'−R$12,40'},
                  {k:'Custo produto', v:'−R$18,00'},
                ].map((r,i)=>(
                  <div className="sim-row" key={i}>
                    <span className="sim-k">{r.k}</span>
                    <span className="sim-v">{r.v}</span>
                  </div>
                ))}
                <div className="sim-total">
                  <span className="sim-total-k">Lucro líquido</span>
                  <span className="sim-total-v">R$26,55</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="sec how-bg" id="como-funciona">
        <div className="sec-in">
          <span className="stag">// como funciona</span>
          <h2 className="sh">Do zero ao produto<br /><em>vencedor.</em></h2>
          <div className="how-grid">
            {[
              {n:'01',t:'Assine e Acesse',d:'Escolha seu plano e receba as credenciais por e-mail em minutos. Sem burocracia, sem aprovação.',dn:'01'},
              {n:'02',t:'Explore os Dados',d:'Navegue pelas 8 ferramentas, filtre por categoria e encontre produtos com alto potencial de venda.',dn:'02'},
              {n:'03',t:'Decida com Certeza',d:'Valide margem no simulador, confirme com a extensão Chrome e compre sabendo o que vai ganhar.',dn:'03'},
            ].map((s,i)=>(
              <div className="how-col" data-n={s.dn} key={i}>
                <div className="how-n">{s.n}</div>
                <div className="how-t">{s.t}</div>
                <p className="how-d">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="sec" id="planos" style={{background:'var(--bg)'}}>
        <div className="sec-in">
          <div className="price-hd">
            <span className="stag" style={{display:'block',textAlign:'center'}}>// planos</span>
            <h2 className="sh" style={{textAlign:'center',maxWidth:'none'}}>
              O ROI aparece<br /><em>na primeira venda.</em>
            </h2>
            <p style={{textAlign:'center',fontSize:'17px',color:'var(--mut2)',lineHeight:1.7}}>
              Acesso total às 8 ferramentas. Sem limite. Sem surpresas.
            </p>
          </div>
          <div className="pgrid">
            <div className="pc">
              <div className="pc-plan">Mensal</div>
              <div className="pc-price">79<span style={{fontSize:'34px',letterSpacing:0,opacity:.8}}>,90</span></div>
              <div className="pc-period">R$ por mês</div>
              <div className="pc-eq">&nbsp;</div>
              <div className="pc-div" />
              <ul className="pc-list">
                <li>8 ferramentas completas</li>
                <li>Extensão Chrome incluída</li>
                <li>Agente IA ilimitado</li>
                <li>Simulador Financeiro</li>
                <li>Análise de concorrentes</li>
                <li>Cancelamento a qualquer momento</li>
              </ul>
              <a href={LINKS.monthly} className="pc-cta pc-line">Assinar Mensal</a>
            </div>
            <div className="pc pc-hot">
              <div className="pc-badge">Mais Popular</div>
              <div className="pc-plan pc-plan-h">Semestral</div>
              <div className="pc-price pc-price-h">397</div>
              <div className="pc-period">R$ por 6 meses</div>
              <div className="pc-eq">R$66/mês · <em>economize 17%</em></div>
              <div className="pc-div" />
              <ul className="pc-list">
                <li>Tudo do plano Mensal</li>
                <li>6 meses de acesso garantido</li>
                <li>Prioridade no suporte</li>
                <li>Novas ferramentas inclusas</li>
                <li>Atualizações garantidas</li>
                <li>Economia de R$81,40</li>
              </ul>
              <a href={LINKS.biannual} className="pc-cta pc-fill">Assinar Semestral</a>
            </div>
            <div className="pc">
              <div className="pc-plan">Anual</div>
              <div className="pc-price">597</div>
              <div className="pc-period">R$ por ano</div>
              <div className="pc-eq">R$49/mês · <em style={{color:'var(--green)'}}>economize 38%</em></div>
              <div className="pc-div" />
              <ul className="pc-list">
                <li>Tudo do plano Semestral</li>
                <li>12 meses de acesso total</li>
                <li>Suporte VIP prioritário</li>
                <li>Acesso antecipado a novidades</li>
                <li>Melhor custo-benefício</li>
                <li>Economia de R$361,80</li>
              </ul>
              <a href={LINKS.annual} className="pc-cta pc-line">Assinar Anual</a>
            </div>
          </div>
          <p className="price-note">Pagamento seguro via Greenn · Acesso imediato · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sec" style={{background:'var(--s1)',borderTop:'1px solid var(--bd)'}} id="faq">
        <div className="sec-in">
          <span className="stag">// perguntas</span>
          <h2 className="sh">O que você<br /><em>precisa saber.</em></h2>
          <div className="faq-inner">
            {[
              {q:'O acesso é imediato após o pagamento?',a:'Sim. Você recebe as credenciais por e-mail em minutos. Sem aprovação manual, sem espera.'},
              {q:'Preciso instalar algum software?',a:'Não. O Oráculo é 100% web. A extensão Chrome é opcional, instalada com um clique quando quiser.'},
              {q:'Os dados são atualizados com que frequência?',a:'Diariamente. Mais Vendidos, Em Alta e Recém Adicionados atualizam todo dia. O Agente IA gera novas análises a cada 24h.'},
              {q:'Posso cancelar quando quiser?',a:'Sim. Planos mensais podem ser cancelados a qualquer momento. Semestrais e anuais garantem acesso pelo período contratado.'},
              {q:'O Agente IA tem limite de uso?',a:'Não. Análises completamente ilimitadas em todos os planos. Sem cota, sem créditos.'},
              {q:'A extensão Chrome está incluída no plano?',a:'Sim. Todos os planos incluem a extensão sem custo adicional. Basta usar sua chave de acesso.'},
            ].map((item,i)=>(
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
        <div className="fcta-ov" />
        <div className="fcta-in">
          <h2 className="fcta-h">
            Comece hoje.<br />
            Amanhã pode<br />
            ser <em>tarde.</em>
          </h2>
          <p className="fcta-sub">
            Cada dia sem o Oráculo é uma oportunidade
            que outra pessoa está aproveitando.
          </p>
          <a href={LINKS.biannual} className="btn-primary" style={{fontSize:'15px',padding:'16px 44px'}}>
            Ver o que o mercado esconde
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <span className="footer-b">Oráculo</span>
        <div className="footer-ls">
          <a href="/login" className="footer-l">Entrar</a>
          <a href="#planos" className="footer-l">Planos</a>
          <a href="#ferramentas" className="footer-l">Ferramentas</a>
          <a href="#faq" className="footer-l">FAQ</a>
        </div>
      </footer>
    </>
  )
}
