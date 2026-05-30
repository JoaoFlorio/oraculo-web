import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORÁCULO — Inteligência de Mercado Amazon FBA Brasil',
  description: 'Encontre produtos vencedores no Amazon FBA antes da concorrência. Dados reais, atualizados diariamente.',
  openGraph: {
    title: 'ORÁCULO Amazon Intelligence',
    description: 'Veja o que o mercado esconde.',
    images: ['/og-image.png'],
  },
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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,200;1,9..144,300;1,9..144,400;1,9..144,600&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        :root {
          --bg:       #080608;
          --s1:       #100D10;
          --s2:       #160F12;
          --gold:     #C4A24A;
          --gold-l:   #DCBA62;
          --cream:    #EDE0C0;
          --text:     #C8BAAA;
          --muted:    #726456;
          --muted2:   #A0917E;
          --border:   rgba(196,162,74,0.12);
          --border2:  rgba(255,255,255,0.06);
          --green:    #7CB87C;
        }

        body {
          font-family: 'Instrument Sans', system-ui, sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        a { text-decoration: none; color: inherit; }
        ::selection { background: rgba(196,162,74,0.2); color: var(--cream); }
        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-thumb { background: #2A1F1A; border-radius: 2px; }

        /* ─── ANIMATIONS ─── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes eyeBreath {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50%      { transform: scale(1.025); filter: brightness(1.08); }
        }
        @keyframes eyeGlow {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.55; }
        }
        @keyframes goldShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes lineReveal {
          from { width: 0; opacity: 0; }
          to   { width: 100%; opacity: 1; }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(196,162,74,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(196,162,74,0); }
        }
        @keyframes scanEye {
          0%   { transform: translateY(-100%) scaleX(0.6); opacity: 0; }
          15%  { opacity: 0.7; }
          85%  { opacity: 0.7; }
          100% { transform: translateY(300%) scaleX(0.6); opacity: 0; }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ─── NAV ─── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          padding: 0 48px;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(8,6,8,0.72);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(196,162,74,0.08);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 12px;
          font-family: 'Fraunces', serif;
          font-size: 15px; font-weight: 400;
          letter-spacing: 6px; text-transform: uppercase;
          color: var(--cream);
        }
        .nav-eye-mark {
          width: 28px; height: 14px;
          position: relative;
        }
        .nav-eye-mark::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: 100%;
          border: 1.5px solid var(--gold);
          clip-path: ellipse(50% 50% at 50% 50%);
        }
        .nav-eye-mark::after {
          content: '';
          position: absolute;
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--gold);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 6px var(--gold);
        }
        .nav-links { display: flex; align-items: center; gap: 8px; }
        .nav-link {
          font-size: 13px; font-weight: 500;
          color: var(--muted2); padding: 8px 16px;
          letter-spacing: 0.3px;
          transition: color 0.2s;
        }
        .nav-link:hover { color: var(--cream); }
        .nav-cta {
          font-size: 13px; font-weight: 600;
          color: var(--bg); background: var(--gold);
          padding: 9px 24px; border-radius: 3px;
          letter-spacing: 0.5px;
          transition: all 0.25s;
          box-shadow: 0 2px 20px rgba(196,162,74,0.2);
        }
        .nav-cta:hover {
          background: var(--gold-l);
          box-shadow: 0 4px 32px rgba(196,162,74,0.35);
        }

        /* ─── HERO ─── */
        .hero {
          min-height: 100vh;
          padding-top: 64px;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          text-align: center;
        }
        .hero-image-bg {
          position: absolute; inset: 0;
          background-image: url('/hero-bg.png');
          background-size: cover;
          background-position: center top;
          opacity: 0.28;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(to bottom, rgba(8,6,8,0.3) 0%, rgba(8,6,8,0.0) 40%, rgba(8,6,8,0.0) 60%, rgba(8,6,8,0.95) 100%),
            linear-gradient(to right, rgba(8,6,8,0.4), transparent 30%, transparent 70%, rgba(8,6,8,0.4));
        }
        .hero-in {
          position: relative; z-index: 2;
          max-width: 860px; width: 100%;
          padding: 80px 32px 100px;
          display: flex; flex-direction: column; align-items: center;
        }
        .hero-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 3px;
          color: var(--gold); opacity: 0.7;
          text-transform: uppercase;
          margin-bottom: 52px;
          animation: fadeIn 1s ease 0.2s both;
        }
        /* Oracle Eye */
        .eye-wrap {
          width: 480px; max-width: 86vw;
          margin-bottom: 56px;
          position: relative;
          animation: fadeIn 1.2s ease 0.4s both;
        }
        .eye-img {
          width: 100%; height: auto;
          border-radius: 4px;
          animation: eyeBreath 8s ease-in-out infinite;
          display: block;
          /* Clip to eye shape via mask */
          mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 50%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 50%, transparent 100%);
        }
        .eye-scan-line {
          position: absolute;
          left: 5%; right: 5%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(196,162,74,0.6), transparent);
          animation: scanEye 6s ease-in-out infinite 2s;
          pointer-events: none;
        }
        .eye-glow {
          position: absolute; inset: -20px;
          border-radius: 50%;
          background: radial-gradient(ellipse 60% 40% at 50% 50%, rgba(196,162,74,0.12), transparent 70%);
          animation: eyeGlow 8s ease-in-out infinite;
          pointer-events: none; z-index: -1;
        }
        /* Hero Headline */
        .hero-h1 {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: clamp(64px, 10vw, 108px);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: -1px;
          color: var(--cream);
          margin-bottom: 28px;
          animation: fadeUp 1s ease 0.7s both;
        }
        .hero-h1 em {
          font-style: italic;
          background: linear-gradient(135deg, #F0D080 0%, #C4A24A 40%, #9A7830 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 18px;
          color: var(--muted2);
          max-width: 440px;
          line-height: 1.72;
          margin-bottom: 44px;
          animation: fadeUp 1s ease 0.85s both;
        }
        .hero-sub strong { color: var(--text); font-weight: 500; }
        .hero-cta-row {
          display: flex; align-items: center; gap: 14px;
          flex-wrap: wrap; justify-content: center;
          animation: fadeUp 1s ease 1s both;
        }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 15px 40px;
          background: var(--gold);
          color: var(--bg);
          font-weight: 600; font-size: 15px; letter-spacing: 0.5px;
          border-radius: 3px;
          transition: all 0.3s;
          box-shadow: 0 4px 36px rgba(196,162,74,0.3);
          animation: pulseGold 4s ease infinite 2s;
        }
        .cta-primary:hover {
          background: var(--gold-l);
          transform: translateY(-2px);
          box-shadow: 0 8px 48px rgba(196,162,74,0.45);
        }
        .cta-ghost {
          font-size: 14px; font-weight: 500;
          color: var(--muted2); letter-spacing: 0.3px;
          padding: 8px 4px;
          border-bottom: 1px solid rgba(160,145,126,0.3);
          transition: all 0.2s;
        }
        .cta-ghost:hover { color: var(--cream); border-color: var(--cream); }

        /* ─── STRIP ─── */
        .strip {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          overflow: hidden;
          padding: 22px 0;
          background: var(--s1);
        }
        .strip-track {
          display: flex; width: max-content;
          animation: ticker 34s linear infinite;
        }
        .strip-item {
          display: flex; align-items: center; gap: 14px;
          padding: 0 56px;
          white-space: nowrap;
          border-right: 1px solid var(--border);
        }
        .strip-n {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 30px; font-weight: 300;
          color: var(--gold);
        }
        .strip-l {
          font-size: 13px; color: var(--muted2);
          letter-spacing: 0.3px;
        }

        /* ─── STATEMENT ─── */
        .statement {
          padding: 130px 32px;
          text-align: center;
          background: var(--bg);
          position: relative;
        }
        .statement::before {
          content: '';
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 1px; height: 80px;
          background: linear-gradient(to bottom, transparent, var(--gold));
          opacity: 0.4;
        }
        .statement-quote {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 300;
          color: var(--cream);
          max-width: 760px;
          margin: 0 auto;
          line-height: 1.35;
          letter-spacing: -0.5px;
        }
        .statement-quote em {
          font-style: italic;
          color: var(--gold);
        }
        .statement-line {
          display: flex; align-items: center; justify-content: center; gap: 20px;
          margin-top: 48px;
        }
        .statement-rule {
          width: 60px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold));
          opacity: 0.5;
        }
        .statement-rule-r {
          background: linear-gradient(90deg, var(--gold), transparent);
        }
        .statement-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 2.5px;
          color: var(--muted);
          text-transform: uppercase;
        }

        /* ─── SECTION BASE ─── */
        .section { padding: 100px 32px; }
        .section-inner { max-width: 1080px; margin: 0 auto; }
        .section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 2.5px;
          color: var(--gold); opacity: 0.65;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: block;
        }
        .section-title {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: clamp(38px, 5vw, 62px);
          font-weight: 300;
          color: var(--cream);
          line-height: 1.1;
          letter-spacing: -0.5px;
          margin-bottom: 18px;
        }
        .section-sub {
          font-size: 16px; color: var(--muted2);
          max-width: 520px; line-height: 1.72;
        }

        /* ─── FEATURES ─── */
        .feat-list {
          margin-top: 72px;
          display: flex; flex-direction: column;
        }
        .feat-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent);
        }
        .feat-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          padding: 72px 0;
        }
        .feat-text { padding-right: 64px; }
        .feat-visual-area {
          display: flex; align-items: center; justify-content: center;
          padding-left: 48px;
        }
        .feat-row.reverse .feat-text { order: 2; padding-right: 0; padding-left: 64px; }
        .feat-row.reverse .feat-visual-area { order: 1; padding-left: 0; padding-right: 48px; }
        .feat-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 2px;
          color: var(--gold); opacity: 0.4;
          margin-bottom: 18px;
          display: flex; align-items: center; gap: 14px;
        }
        .feat-num::after {
          content: '';
          width: 28px; height: 1px;
          background: var(--gold); opacity: 0.4;
        }
        .feat-subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 2px;
          color: var(--muted); text-transform: uppercase;
          margin-bottom: 14px;
        }
        .feat-title {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: clamp(30px, 3.5vw, 46px);
          font-weight: 300;
          color: var(--cream);
          line-height: 1.15;
          letter-spacing: -0.5px;
          margin-bottom: 20px;
          white-space: pre-line;
        }
        .feat-badge-new {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--gold);
          border: 1px solid var(--gold);
          padding: 2px 8px; border-radius: 2px;
          margin-bottom: 10px;
          opacity: 0.8;
        }
        .feat-desc {
          font-size: 15px; color: var(--muted2);
          line-height: 1.75;
          max-width: 380px;
        }
        /* Data card */
        .data-card {
          background: var(--s2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 28px 28px;
          min-width: 280px; max-width: 340px;
          width: 100%;
        }
        .data-card-header {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 2px;
          color: var(--muted); text-transform: uppercase;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .data-card-live {
          display: flex; align-items: center; gap: 5px;
          font-size: 8px; color: var(--green);
        }
        .data-card-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 5px var(--green);
        }
        .data-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .data-row:last-child { border-bottom: none; }
        .data-label {
          font-size: 12.5px; color: var(--muted2);
          font-family: 'Instrument Sans', sans-serif;
        }
        .data-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; font-weight: 500;
          color: var(--cream);
        }
        .data-value-gold { color: var(--gold); }
        .data-value-green { color: var(--green); }
        .data-tag {
          font-size: 9px; padding: 2px 7px; border-radius: 2px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.5px;
        }
        .data-tag-green { background: rgba(124,184,124,0.1); color: var(--green); }
        .data-tag-gold  { background: rgba(196,162,74,0.1); color: var(--gold); }

        /* ─── HOW ─── */
        .how-bg {
          background: var(--s1);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          margin-top: 64px;
        }
        .how-step {
          background: var(--s1);
          padding: 44px 36px;
        }
        .how-n {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 52px; font-weight: 200;
          color: var(--gold); opacity: 0.35;
          line-height: 1;
          margin-bottom: 20px;
        }
        .how-t {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 16px; font-weight: 600;
          color: var(--cream);
          margin-bottom: 10px;
          letter-spacing: 0.2px;
        }
        .how-d {
          font-size: 14px; color: var(--muted2);
          line-height: 1.7;
        }

        /* ─── PRICING ─── */
        .pricing-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
        }
        .price-card {
          background: var(--s1);
          padding: 44px 36px;
          position: relative;
        }
        .price-card-featured {
          background: #14100E;
        }
        .price-card-featured::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .price-featured-badge {
          position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
          background: var(--gold);
          color: var(--bg);
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; font-weight: 500;
          letter-spacing: 2px; text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 0 0 5px 5px;
        }
        .price-plan {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 2.5px;
          color: var(--muted); text-transform: uppercase;
          margin-bottom: 24px;
        }
        .price-plan-featured { color: var(--gold); opacity: 0.8; }
        .price-amount {
          display: flex; align-items: flex-start; gap: 4px;
          margin-bottom: 6px;
        }
        .price-currency {
          font-family: 'Fraunces', serif;
          font-size: 18px; font-weight: 300;
          color: var(--muted2);
          margin-top: 12px;
        }
        .price-currency-featured { color: var(--gold-l); }
        .price-big {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 80px; font-weight: 200;
          line-height: 1; letter-spacing: -2px;
          color: var(--cream);
        }
        .price-big-featured { color: var(--gold); }
        .price-period {
          font-size: 13px; color: var(--muted);
          margin-bottom: 6px;
        }
        .price-equiv {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px; color: var(--muted);
          margin-bottom: 28px; line-height: 1.5;
        }
        .price-equiv em { color: var(--green); font-style: normal; }
        .price-rule { height: 1px; background: var(--border); margin: 20px 0; }
        .price-features {
          list-style: none;
          display: flex; flex-direction: column; gap: 11px;
          margin-bottom: 32px;
        }
        .price-features li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13.5px; color: var(--muted2); line-height: 1.4;
        }
        .price-features li::before {
          content: '—';
          color: var(--gold); opacity: 0.5;
          flex-shrink: 0; font-family: 'Fraunces', serif;
          font-size: 14px;
        }
        .price-cta {
          display: block; width: 100%;
          padding: 14px;
          text-align: center; border-radius: 4px;
          font-weight: 600; font-size: 14px;
          letter-spacing: 0.4px;
          cursor: pointer; transition: all 0.25s;
        }
        .price-cta-outline {
          border: 1px solid rgba(196,162,74,0.25);
          color: var(--gold);
        }
        .price-cta-outline:hover {
          background: rgba(196,162,74,0.06);
          border-color: rgba(196,162,74,0.45);
        }
        .price-cta-solid {
          background: var(--gold);
          color: var(--bg);
          border: none;
          box-shadow: 0 4px 24px rgba(196,162,74,0.2);
        }
        .price-cta-solid:hover {
          background: var(--gold-l);
          box-shadow: 0 8px 40px rgba(196,162,74,0.38);
          transform: translateY(-1px);
        }
        .price-note {
          margin-top: 24px;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.5px;
          color: var(--muted); opacity: 0.7;
        }

        /* ─── FAQ ─── */
        .faq-bg { background: var(--s1); border-top: 1px solid var(--border); }
        .faq-wrap {
          max-width: 720px; margin: 56px auto 0;
          border-top: 1px solid var(--border);
        }
        details.faq-item { border-bottom: 1px solid var(--border); }
        summary.faq-q {
          padding: 22px 0;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 16px; font-weight: 500;
          color: var(--text); cursor: pointer;
          list-style: none;
          display: flex; justify-content: space-between; align-items: center;
          transition: color 0.2s;
          letter-spacing: 0.2px;
          gap: 20px;
        }
        summary.faq-q::-webkit-details-marker { display: none; }
        summary.faq-q:hover { color: var(--cream); }
        summary.faq-q::after {
          content: '+';
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 26px; font-weight: 200;
          color: var(--gold);
          flex-shrink: 0;
          line-height: 1;
          transition: transform 0.2s;
        }
        details[open] summary.faq-q { color: var(--cream); }
        details[open] summary.faq-q::after {
          content: '−';
          transform: none;
        }
        .faq-a {
          padding: 0 0 22px;
          font-size: 15px; color: var(--muted2);
          line-height: 1.78; max-width: 580px;
        }

        /* ─── FINAL CTA ─── */
        .final-cta {
          padding: 140px 32px;
          text-align: center;
          position: relative; overflow: hidden;
          background: var(--bg);
        }
        .final-cta-bg {
          position: absolute; inset: 0;
          background-image: url('/hero-bg.png');
          background-size: cover;
          background-position: center;
          opacity: 0.14;
        }
        .final-cta-overlay {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 100% at 50% 50%, rgba(8,6,8,0.2), rgba(8,6,8,0.85));
        }
        .final-cta-in { position: relative; z-index: 2; }
        .final-cta-h {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: clamp(46px, 7.5vw, 96px);
          font-weight: 200;
          line-height: 1.05;
          color: var(--cream);
          letter-spacing: -1px;
          margin-bottom: 16px;
        }
        .final-cta-h em {
          background: linear-gradient(135deg, #F0D080, #C4A24A, #9A7830);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          font-style: italic;
        }
        .final-cta-sub {
          font-size: 16px; color: var(--muted2);
          max-width: 400px; margin: 0 auto 44px;
          line-height: 1.7;
        }

        /* ─── FOOTER ─── */
        .footer {
          border-top: 1px solid var(--border);
          padding: 28px 48px;
          display: flex; align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          background: var(--s1);
        }
        .footer-copy {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 1px;
          color: var(--muted); text-transform: uppercase;
        }
        .footer-links { display: flex; gap: 28px; }
        .footer-link {
          font-size: 13px; color: var(--muted);
          transition: color 0.2s; letter-spacing: 0.2px;
        }
        .footer-link:hover { color: var(--gold); }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 900px) {
          .feat-row { grid-template-columns: 1fr; gap: 40px; }
          .feat-row.reverse .feat-text { order: 0; padding-left: 0; }
          .feat-row.reverse .feat-visual-area { order: 1; padding-right: 0; }
          .feat-text { padding-right: 0 !important; padding-left: 0 !important; }
          .feat-visual-area { padding-left: 0 !important; padding-right: 0 !important; }
          .how-grid { grid-template-columns: 1fr; }
          .pricing-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 680px) {
          .nav { padding: 0 20px; }
          .nav-link { display: none; }
          .footer { flex-direction: column; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-eye-mark" />
          Oráculo
        </a>
        <div className="nav-links">
          <a href="#ferramentas" className="nav-link">Ferramentas</a>
          <a href="#planos" className="nav-link">Planos</a>
          <a href="/login" className="nav-link">Entrar</a>
          <a href={LINKS.biannual} className="nav-cta">Começar</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-image-bg" />
        <div className="hero-overlay" />

        <div className="hero-in">
          <span className="hero-tag">Sistema de Inteligência · Amazon FBA Brasil</span>

          <div className="eye-wrap">
            <div className="eye-glow" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/oracle-eye.png"
              alt="O olho que vê o mercado"
              className="eye-img"
            />
            <div className="eye-scan-line" />
          </div>

          <h1 className="hero-h1">
            Veja o que<br />
            o mercado<br />
            <em>esconde.</em>
          </h1>

          <p className="hero-sub">
            Inteligência de dados para <strong>Amazon FBA</strong>.
            Encontre produtos vencedores antes de todos —
            com dados reais, atualizados diariamente.
          </p>

          <div className="hero-cta-row">
            <a href={LINKS.biannual} className="cta-primary">
              Começar Agora
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="/login" className="cta-ghost">Já tenho conta</a>
          </div>
        </div>
      </section>

      {/* ── STRIP ── */}
      <div className="strip">
        <div className="strip-track">
          {[
            {n:'12.847', l:'produtos analisados'},
            {n:'847',    l:'sellers ativos'},
            {n:'8',      l:'ferramentas exclusivas'},
            {n:'40×',    l:'mais rápido que manual'},
            {n:'Diário', l:'atualização de dados'},
            {n:'99.9%',  l:'uptime garantido'},
            {n:'12.847', l:'produtos analisados'},
            {n:'847',    l:'sellers ativos'},
            {n:'8',      l:'ferramentas exclusivas'},
            {n:'40×',    l:'mais rápido que manual'},
            {n:'Diário', l:'atualização de dados'},
            {n:'99.9%',  l:'uptime garantido'},
          ].map((s, i) => (
            <div className="strip-item" key={i}>
              <span className="strip-n">{s.n}</span>
              <span className="strip-l">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATEMENT ── */}
      <section className="statement">
        <p className="statement-quote">
          Cada produto vencedor já existe no Amazon.
          A diferença entre lucro e perda
          é quem o descobre <em>primeiro.</em>
        </p>
        <div className="statement-line">
          <div className="statement-rule" />
          <span className="statement-sub">Amazon FBA Brasil · 2026</span>
          <div className="statement-rule statement-rule-r" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" id="ferramentas" style={{background:'var(--s1)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <div className="section-inner">
          <span className="section-label">Ferramentas</span>
          <h2 className="section-title">O que o Oráculo<br />revela.</h2>
          <p className="section-sub">Oito ferramentas integradas. Uma plataforma. Zero suposições.</p>

          <div className="feat-list">

            {/* Feature 1 */}
            <div className="feat-row">
              <div className="feat-text">
                <div className="feat-num">01 · 02 · 03</div>
                <div className="feat-subtitle">Mineração de Mercado</div>
                <h3 className="feat-title">{`O radar que\nnunca dorme.`}</h3>
                <p className="feat-desc">
                  Mais Vendidos, Em Alta e Recém Adicionados — três ângulos do mesmo mercado,
                  atualizados diariamente. Saiba o que está vendendo antes que vire notícia.
                </p>
              </div>
              <div className="feat-visual-area">
                <div className="data-card">
                  <div className="data-card-header">
                    <span>Mais Vendidos · Hoje</span>
                    <span className="data-card-live">
                      <span className="data-card-dot" />
                      Ao vivo
                    </span>
                  </div>
                  {[
                    {l:'Suporte Pescoço Elástico', v:'+312%', vc:'data-value-green', tag:'Em Alta', tagC:'data-tag-green'},
                    {l:'Kit Skincare Masculino',   v:'+234%', vc:'data-value-green', tag:'Genérico', tagC:'data-tag-gold'},
                    {l:'Organizador Gaveta Kit',   v:'+189%', vc:'data-value-green', tag:'Top Vendas', tagC:'data-tag-green'},
                    {l:'Esteira Dobrável',         v:'+445%', vc:'data-value-green', tag:'Em Alta', tagC:'data-tag-green'},
                    {l:'Cabo USB-C Trançado',      v:'+156%', vc:'data-value-green', tag:'Recém Add.', tagC:'data-tag-gold'},
                  ].map((r, i) => (
                    <div className="data-row" key={i}>
                      <span className="data-label">{r.l}</span>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span className={`data-value ${r.vc}`}>{r.v}</span>
                        <span className={`data-tag ${r.tagC}`}>{r.tag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="feat-divider" />

            {/* Feature 2 */}
            <div className="feat-row reverse">
              <div className="feat-text">
                <div className="feat-num">04 · 05</div>
                <div className="feat-subtitle">Inteligência Competitiva</div>
                <h3 className="feat-title">{`Vantagem onde\na concorrência\nfraqueja.`}</h3>
                <p className="feat-desc">
                  Encontre genéricos com margem de 60%+ onde nenhuma marca domina ainda.
                  Analise qualquer rival por ASIN e descubra onde você pode entrar e vencer.
                </p>
              </div>
              <div className="feat-visual-area">
                <div className="data-card">
                  <div className="data-card-header">
                    <span>Análise Competitiva</span>
                    <span className="data-card-live">
                      <span className="data-card-dot" />
                      Atualizado
                    </span>
                  </div>
                  {[
                    {l:'Margem média genéricos', v:'62%', vc:'data-value-gold'},
                    {l:'Produtos sem marca forte', v:'38%', vc:'data-value-gold'},
                    {l:'Score de oportunidade', v:'9.2/10', vc:'data-value-green'},
                    {l:'Rivais monitorados', v:'Ilimitado', vc:''},
                    {l:'Exportar dados', v:'CSV / XLS', vc:''},
                  ].map((r, i) => (
                    <div className="data-row" key={i}>
                      <span className="data-label">{r.l}</span>
                      <span className={`data-value ${r.vc}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="feat-divider" />

            {/* Feature 3 */}
            <div className="feat-row">
              <div className="feat-text">
                <div className="feat-num">06 · 07</div>
                <div className="feat-subtitle">Extensão + Agente IA</div>
                <div className="feat-badge-new">Novo</div>
                <h3 className="feat-title">{`Na prateleira\ndigital, ao vivo.`}</h3>
                <p className="feat-desc">
                  Veja BSR, tendência e score de oportunidade direto na página do produto Amazon —
                  sem trocar de aba. O Agente IA entrega análises diárias com o raciocínio por trás.
                </p>
              </div>
              <div className="feat-visual-area">
                <div className="data-card">
                  <div className="data-card-header">
                    <span>Extensão Chrome · Amazon</span>
                    <span style={{fontSize:'9px',color:'var(--green)'}}>Ativo</span>
                  </div>
                  {[
                    {l:'BSR atual',         v:'#4.230',      vc:'data-value-gold'},
                    {l:'Tendência 30d',     v:'↑ Em Alta',   vc:'data-value-green'},
                    {l:'Vendas estimadas',  v:'~280/mês',    vc:''},
                    {l:'Score IA',          v:'8.4 / 10',    vc:'data-value-gold'},
                    {l:'Oportunidade',      v:'ALTA',        vc:'data-value-green'},
                  ].map((r, i) => (
                    <div className="data-row" key={i}>
                      <span className="data-label">{r.l}</span>
                      <span className={`data-value ${r.vc}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="feat-divider" />

            {/* Feature 4 */}
            <div className="feat-row reverse">
              <div className="feat-text">
                <div className="feat-num">08</div>
                <div className="feat-subtitle">Simulador Financeiro</div>
                <div className="feat-badge-new">Novo</div>
                <h3 className="feat-title">{`O número que\nmuda a decisão.`}</h3>
                <p className="feat-desc">
                  Calcule margem real, taxas FBA e lucro líquido antes de qualquer compra.
                  18 variáveis, câmbio automático, exportação em PDF e XLS.
                </p>
              </div>
              <div className="feat-visual-area">
                <div className="data-card">
                  <div className="data-card-header">
                    <span>Simulação de Margem</span>
                  </div>
                  {[
                    {l:'Preço de venda',        v:'R$67,00',   vc:''},
                    {l:'Taxa Amazon (15%)',      v:'− R$10,05', vc:''},
                    {l:'FBA Fee',                v:'− R$12,40', vc:''},
                    {l:'Custo do produto',       v:'− R$18,00', vc:''},
                  ].map((r, i) => (
                    <div className="data-row" key={i}>
                      <span className="data-label">{r.l}</span>
                      <span className={`data-value ${r.vc}`}>{r.v}</span>
                    </div>
                  ))}
                  <div className="data-row" style={{borderTop:'1px solid var(--border)',marginTop:'4px',paddingTop:'14px'}}>
                    <span className="data-label" style={{color:'var(--cream)',fontWeight:600}}>Lucro líquido</span>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'\'JetBrains Mono\',monospace',fontSize:'18px',fontWeight:500,color:'var(--green)'}}>R$26,55</div>
                      <div style={{fontFamily:'\'JetBrains Mono\',monospace',fontSize:'10px',color:'var(--green)',opacity:0.7}}>39.6% margem</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section how-bg" id="como-funciona">
        <div className="section-inner">
          <span className="section-label">Como Funciona</span>
          <h2 className="section-title">Do zero ao produto<br />vencedor.</h2>
          <div className="how-grid">
            {[
              {n:'01', t:'Assine e Acesse', d:'Escolha seu plano e receba o acesso por e-mail em minutos. Sem aprovação, sem burocracia.'},
              {n:'02', t:'Explore os Dados', d:'Navegue pelas 8 ferramentas. Filtre por categoria. Encontre o que tem potencial.'},
              {n:'03', t:'Decida com Certeza', d:'Valide a margem, confirme com a extensão Chrome, e compre sabendo exatamente o que esperar.'},
            ].map((s, i) => (
              <div className="how-step" key={i}>
                <div className="how-n">{s.n}</div>
                <div className="how-t">{s.t}</div>
                <p className="how-d">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section" id="planos" style={{background:'var(--bg)'}}>
        <div className="section-inner">
          <div className="pricing-header">
            <span className="section-label" style={{display:'block',textAlign:'center'}}>Planos</span>
            <h2 className="section-title" style={{textAlign:'center',maxWidth:'none'}}>
              Uma visão clara<br /><em style={{fontStyle:'italic',color:'var(--gold)'}}>tem um preço.</em>
            </h2>
            <p style={{textAlign:'center',fontSize:'16px',color:'var(--muted2)',lineHeight:1.7}}>
              Acesso completo às 8 ferramentas em qualquer plano. Sem limite de pesquisas.
            </p>
          </div>

          <div className="pricing-grid">
            {/* Mensal */}
            <div className="price-card">
              <div className="price-plan">Mensal</div>
              <div className="price-amount">
                <span className="price-currency">R$</span>
                <span className="price-big">79</span>
              </div>
              <div className="price-period">,90 por mês</div>
              <div className="price-equiv">&nbsp;</div>
              <div className="price-rule" />
              <ul className="price-features">
                <li>8 ferramentas completas</li>
                <li>Extensão Chrome incluída</li>
                <li>Agente IA ilimitado</li>
                <li>Simulador Financeiro</li>
                <li>Análise de concorrentes</li>
                <li>Renovação mensal flexível</li>
              </ul>
              <a href={LINKS.monthly} className="price-cta price-cta-outline">Assinar Mensal</a>
            </div>

            {/* Semestral — Featured */}
            <div className="price-card price-card-featured">
              <div className="price-featured-badge">Mais Popular</div>
              <div className="price-plan price-plan-featured">Semestral</div>
              <div className="price-amount">
                <span className="price-currency price-currency-featured">R$</span>
                <span className="price-big price-big-featured">397</span>
              </div>
              <div className="price-period">por 6 meses</div>
              <div className="price-equiv">R$66/mês · <em>economize 17%</em></div>
              <div className="price-rule" />
              <ul className="price-features">
                <li>Tudo do plano Mensal</li>
                <li>6 meses de acesso garantido</li>
                <li>Prioridade no suporte</li>
                <li>Atualizações inclusas</li>
                <li>Novas ferramentas inclusas</li>
                <li>Economia de R$81,40</li>
              </ul>
              <a href={LINKS.biannual} className="price-cta price-cta-solid">Assinar Semestral</a>
            </div>

            {/* Anual */}
            <div className="price-card">
              <div className="price-plan">Anual</div>
              <div className="price-amount">
                <span className="price-currency">R$</span>
                <span className="price-big">597</span>
              </div>
              <div className="price-period">por ano</div>
              <div className="price-equiv">R$49/mês · <em style={{color:'var(--green)'}}>economize 38%</em></div>
              <div className="price-rule" />
              <ul className="price-features">
                <li>Tudo do plano Semestral</li>
                <li>12 meses de acesso total</li>
                <li>Suporte prioritário VIP</li>
                <li>Acesso antecipado a novidades</li>
                <li>Melhor custo-benefício</li>
                <li>Economia de R$361,80</li>
              </ul>
              <a href={LINKS.annual} className="price-cta price-cta-outline">Assinar Anual</a>
            </div>
          </div>

          <p className="price-note">
            Pagamento seguro · Acesso imediato · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section faq-bg" id="faq">
        <div className="section-inner">
          <span className="section-label">Perguntas</span>
          <h2 className="section-title">O que você<br />precisa saber.</h2>
          <div className="faq-wrap">
            {[
              {q:'O acesso é imediato após o pagamento?', a:'Sim. Você recebe as credenciais por e-mail em minutos após a confirmação. Sem espera, sem aprovação manual.'},
              {q:'Preciso instalar algum software?', a:'Não. O Oráculo é 100% web. A extensão Chrome é opcional, instalada com um clique quando quiser.'},
              {q:'Com que frequência os dados são atualizados?', a:'Diariamente. Mais Vendidos, Em Alta e Recém Adicionados são atualizados todo dia. O Agente IA gera novas análises a cada 24h.'},
              {q:'Posso cancelar quando quiser?', a:'Sim. Planos mensais são canceláveis a qualquer momento. Semestrais e anuais garantem o acesso pelo período contratado.'},
              {q:'O Agente IA tem limite de análises?', a:'Não. Análises completamente ilimitadas em todos os planos. Sem cota, sem créditos.'},
              {q:'A extensão Chrome está incluída?', a:'Sim. Todos os planos incluem a extensão sem custo adicional.'},
            ].map((item, i) => (
              <details className="faq-item" key={i}>
                <summary className="faq-q">{item.q}</summary>
                <p className="faq-a">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="final-cta">
        <div className="final-cta-bg" />
        <div className="final-cta-overlay" />
        <div className="final-cta-in">
          <h2 className="final-cta-h">
            Você já deveria<br />
            ter <em>começado.</em>
          </h2>
          <p className="final-cta-sub">
            Cada dia sem o Oráculo é uma oportunidade
            que outra pessoa aproveitou.
          </p>
          <a href={LINKS.biannual} className="cta-primary" style={{fontSize:'16px', padding:'17px 48px'}}>
            Começar Agora
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <span className="footer-copy">© 2026 Oráculo Amazon Intelligence</span>
        <div className="footer-links">
          <a href="/login" className="footer-link">Entrar</a>
          <a href="#planos" className="footer-link">Planos</a>
          <a href="#ferramentas" className="footer-link">Ferramentas</a>
          <a href="#faq" className="footer-link">FAQ</a>
        </div>
      </footer>
    </>
  )
}
