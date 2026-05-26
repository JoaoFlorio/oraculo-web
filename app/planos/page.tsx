import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORÁCULO — Encontre Produtos Vencedores no Amazon FBA',
  description: 'Plataforma de inteligência de mercado para Amazon FBA Brasil. Mineração de produtos, simulador de lucro, análise de concorrentes e extensão Chrome.',
  openGraph: {
    title: 'ORÁCULO Amazon Intelligence',
    description: 'Encontre produtos vencedores no Amazon FBA antes da concorrência.',
    images: ['/og-image.png'],
  },
}

// TODO: Substituir pelos links da Greenn quando disponíveis
const LINKS = {
  monthly:  'https://pay.hotmart.com/T105514334O?off=cffcrkey',
  annual:   'https://pay.hotmart.com/T105514334O?off=b92zaedd',
  lifetime: 'https://pay.hotmart.com/T105514334O?off=2yii0s4k',
}

export default function PlanosPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Syne:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #020208;
          color: #F0F0FA;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        a { text-decoration: none; }
        ::selection { background: rgba(240,180,41,0.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2A2A40; border-radius: 2px; }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 24px rgba(240,180,41,0.25), 0 0 60px rgba(240,180,41,0.08); }
          50%      { box-shadow: 0 0 40px rgba(240,180,41,0.45), 0 0 80px rgba(240,180,41,0.15); }
        }
        @keyframes shimmerText {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes scrollTicker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes orbitRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes eyeBlink {
          0%,90%,100% { transform: scaleY(1); }
          95%          { transform: scaleY(0.1); }
        }
        @keyframes gridShine {
          0%   { opacity: 0.03; }
          50%  { opacity: 0.06; }
          100% { opacity: 0.03; }
        }

        /* ── Global utility ── */
        .fadeUp   { animation: fadeUp 0.7s ease both; }
        .a1 { animation-delay: 0.1s; }
        .a2 { animation-delay: 0.2s; }
        .a3 { animation-delay: 0.3s; }
        .a4 { animation-delay: 0.4s; }
        .a5 { animation-delay: 0.5s; }
        .a6 { animation-delay: 0.6s; }

        .gold-text {
          background: linear-gradient(135deg, #FFE580 0%, #F0B429 40%, #C48F10 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #F0B429, #FFE580, #F0B429, #C48F10, #F0B429);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerText 4s linear infinite;
        }

        /* ── NAV ── */
        .nav {
          position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(2,2,8,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 28px; height: 68px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-logo { display: flex; align-items: center; gap: 12px; }
        .nav-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(240,180,41,0.07);
          border: 1px solid rgba(240,180,41,0.2);
          display: flex; align-items: center; justify-content: center;
          animation: glowPulse 3s ease-in-out infinite;
        }
        .nav-links { display: flex; gap: 10px; align-items: center; }
        .nav-btn-ghost {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; color: #9090B0; font-weight: 500;
          padding: 8px 18px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.2s; cursor: pointer;
          background: transparent;
        }
        .nav-btn-ghost:hover { color: #F0F0FA; border-color: rgba(255,255,255,0.18); }
        .nav-btn-cta {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px; color: #020208; font-weight: 700;
          padding: 9px 20px; border-radius: 9px;
          background: linear-gradient(135deg,#F5C842,#C48F10);
          letter-spacing: 0.04em; transition: all 0.2s; cursor: pointer;
          box-shadow: 0 2px 16px rgba(240,180,41,0.3);
        }
        .nav-btn-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(240,180,41,0.4); }

        /* ── HERO ── */
        .hero {
          max-width: 1200px; margin: 0 auto;
          padding: 100px 28px 80px;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 64px; align-items: center;
        }
        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; text-align: center; padding: 72px 20px 48px; gap: 48px; }
          .hero-ctas { justify-content: center !important; }
          .hero-stats { justify-content: center !important; }
          .mockup-wrap { display: none; }
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(240,180,41,0.08);
          border: 1px solid rgba(240,180,41,0.22);
          border-radius: 99px; padding: 6px 16px;
          margin-bottom: 28px;
        }
        .hero-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 10px #22C55E;
          animation: glowPulse 2s ease-in-out infinite;
        }
        .hero-h1 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(42px, 5.5vw, 72px);
          font-weight: 700;
          line-height: 1.04;
          letter-spacing: -0.02em;
          margin-bottom: 22px;
          color: #F0F0FA;
        }
        .hero-sub {
          font-size: clamp(15px, 1.6vw, 17px);
          color: #7878A0;
          line-height: 1.75;
          margin-bottom: 36px;
          max-width: 480px;
          font-weight: 400;
        }
        .hero-ctas { display: flex; gap: 12px; margin-bottom: 44px; flex-wrap: wrap; }
        .btn-primary {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(135deg,#F5C842,#C48F10);
          color: #020208; font-weight: 800; font-size: 14px;
          padding: 15px 36px; border-radius: 12px;
          letter-spacing: 0.06em; text-transform: uppercase;
          box-shadow: 0 8px 32px rgba(240,180,41,0.35);
          transition: all 0.25s; display: inline-block;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(240,180,41,0.5); }
        .btn-ghost {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: rgba(255,255,255,0.04);
          color: #9090B0; font-weight: 600; font-size: 14px;
          padding: 15px 32px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.09);
          transition: all 0.2s; display: inline-block;
        }
        .btn-ghost:hover { color: #F0F0FA; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.07); }

        .hero-stats { display: flex; gap: 32px; flex-wrap: wrap; }
        .hero-stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 26px; font-weight: 800; color: #F0B429;
          line-height: 1;
        }
        .hero-stat-lbl { font-size: 11px; color: #5858780; font-weight: 500; margin-top: 4px; color: #686888; letter-spacing: 0.03em; }

        /* ── MOCKUP ── */
        .mockup-wrap { position: relative; animation: float 6s ease-in-out infinite; }
        .mockup-frame {
          background: #0A0A1A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05);
        }
        .mockup-bar {
          background: #0D0D20;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 10px 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
        .mockup-url {
          flex: 1; margin: 0 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 5px; padding: 4px 10px;
          font-size: 10px; color: #5858788;
          color: #585878; font-family: monospace;
        }
        .mockup-body { padding: 14px; }
        .mock-card {
          background: #0F0F22;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 12px;
          margin-bottom: 8px;
          display: flex; gap: 10px; align-items: center;
        }
        .mock-img { width: 52px; height: 52px; border-radius: 7px; background: #1A1A2E; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .mock-info { flex: 1; min-width: 0; }
        .mock-title { font-size: 10px; color: #A0A0C0; font-weight: 600; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mock-meta { display: flex; gap: 8px; }
        .mock-badge { font-size: 9px; padding: 2px 7px; border-radius: 4px; font-weight: 700; }
        .mock-badge-g { background: rgba(34,197,94,0.15); color: #22C55E; }
        .mock-badge-y { background: rgba(240,180,41,0.15); color: #F0B429; }
        .mock-badge-p { background: rgba(139,120,255,0.15); color: #8B78FF; }
        .mock-right { text-align: right; }
        .mock-sales { font-size: 12px; font-weight: 800; color: #F0B429; }
        .mock-bsr { font-size: 9px; color: #686888; margin-top: 2px; }
        .mock-btn { font-size: 9px; color: #F0B429; border: 1px solid rgba(240,180,41,0.3); border-radius: 4px; padding: 2px 8px; font-weight: 600; margin-top: 4px; display: inline-block; }

        /* ── TICKER ── */
        .ticker-wrap { overflow: hidden; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(240,180,41,0.03); padding: 14px 0; }
        .ticker-inner { display: flex; animation: scrollTicker 28s linear infinite; white-space: nowrap; }
        .ticker-item { display: flex; align-items: center; gap: 10px; padding: 0 40px; font-size: 12px; font-weight: 600; color: #7878A0; letter-spacing: 0.06em; }
        .ticker-sep { color: #F0B429; opacity: 0.4; font-size: 16px; }

        /* ── SECTION SHARED ── */
        .section { max-width: 1200px; margin: 0 auto; padding: 80px 28px; }
        .section-tag {
          font-family: 'Syne', sans-serif;
          font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: #F0B429;
          margin-bottom: 14px;
        }
        .section-h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 4vw, 54px);
          font-weight: 700; line-height: 1.08;
          letter-spacing: -0.02em;
          color: #F0F0FA; margin-bottom: 16px;
        }
        .section-sub { font-size: 16px; color: #7878A0; line-height: 1.7; max-width: 540px; }

        /* ── FEATURES ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-top: 52px;
        }
        .feat-card {
          background: #080814;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 28px 24px;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .feat-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(240,180,41,0), transparent);
          transition: background 0.3s;
        }
        .feat-card:hover {
          border-color: rgba(240,180,41,0.2);
          background: #0A0A1C;
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(240,180,41,0.06);
        }
        .feat-card:hover::before {
          background: linear-gradient(90deg, transparent, rgba(240,180,41,0.3), transparent);
        }
        .feat-icon {
          width: 44px; height: 44px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 18px;
          background: rgba(240,180,41,0.07);
          border: 1px solid rgba(240,180,41,0.12);
        }
        .feat-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #E0E0F0; margin-bottom: 8px; }
        .feat-desc { font-size: 13px; color: #686888; line-height: 1.7; }
        .feat-new {
          position: absolute; top: 16px; right: 16px;
          font-size: 8px; font-weight: 800; color: #22C55E;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);
          border-radius: 99px; padding: 2px 8px; letter-spacing: 0.1em;
        }

        /* ── HOW IT WORKS ── */
        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 52px; }
        .step {
          position: relative;
          background: #080814;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 32px 28px;
        }
        .step-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 64px; font-weight: 700; line-height: 1;
          color: rgba(240,180,41,0.08);
          position: absolute; top: 20px; right: 24px;
        }
        .step-icon { font-size: 32px; margin-bottom: 20px; }
        .step-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #E0E0F0; margin-bottom: 10px; }
        .step-desc { font-size: 13px; color: #686888; line-height: 1.7; }

        /* ── SPOTLIGHT ── */
        .spotlight {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 52px;
        }
        @media (max-width: 768px) { .spotlight { grid-template-columns: 1fr; } }
        .spot-card {
          background: #080814;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 36px 32px;
          position: relative; overflow: hidden;
          transition: all 0.3s;
        }
        .spot-card:hover { transform: translateY(-3px); }
        .spot-card-gold { border-color: rgba(240,180,41,0.2); background: rgba(240,180,41,0.02); }
        .spot-card-green { border-color: rgba(34,197,94,0.2); background: rgba(34,197,94,0.02); }
        .spot-glow-gold {
          position: absolute; top: -60px; right: -60px;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(240,180,41,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .spot-glow-green {
          position: absolute; top: -60px; right: -60px;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .spot-tag { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.16em; margin-bottom: 20px; }
        .spot-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; line-height: 1.1; color: #E8E8F8; margin-bottom: 14px; }
        .spot-desc { font-size: 13px; color: #686888; line-height: 1.75; margin-bottom: 24px; }
        .spot-list { display: flex; flex-direction: column; gap: 10px; }
        .spot-item { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; color: #9090B0; line-height: 1.5; }

        /* ── PRICING ── */
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1.1fr 1fr;
          gap: 16px; margin-top: 52px; align-items: start;
        }
        @media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr; } }
        .price-card {
          background: #080814;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 36px 30px;
          position: relative; transition: all 0.3s;
        }
        .price-card:hover { transform: translateY(-4px); }
        .price-card-featured {
          border-color: rgba(240,180,41,0.35);
          background: #0A0A16;
          box-shadow: 0 0 80px rgba(240,180,41,0.1), 0 40px 80px rgba(0,0,0,0.3);
        }
        .price-tag { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.18em; margin-bottom: 20px; }
        .price-amount {
          font-family: 'Syne', sans-serif;
          font-size: 52px; font-weight: 800; line-height: 1;
          letter-spacing: -0.04em; color: #F0F0FA; margin-bottom: 4px;
        }
        .price-period { font-size: 14px; color: #686888; font-weight: 400; }
        .price-economy { font-size: 11px; font-weight: 700; color: #22C55E; margin-top: 6px; margin-bottom: 8px; }
        .price-desc { font-size: 12px; color: #686888; margin-bottom: 24px; line-height: 1.6; }
        .price-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 20px 0; }
        .price-features { display: flex; flex-direction: column; gap: 11px; margin-bottom: 28px; }
        .price-feature { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; color: #9090B0; line-height: 1.5; }
        .price-check { flex-shrink: 0; margin-top: 1px; }
        .price-popular {
          position: absolute; top: -15px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg,#F5C842,#C48F10);
          color: #020208; font-size: 9px; font-weight: 800;
          padding: 5px 20px; border-radius: 99px; letter-spacing: 0.12em;
          white-space: nowrap; font-family: 'Syne', sans-serif;
        }
        .price-btn {
          display: block; text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700; font-size: 12px; padding: 14px;
          border-radius: 11px; letter-spacing: 0.08em; text-transform: uppercase;
          transition: all 0.2s;
        }
        .price-btn-gold {
          background: linear-gradient(135deg,#F5C842,#C48F10);
          color: #020208;
          box-shadow: 0 4px 24px rgba(240,180,41,0.3);
        }
        .price-btn-gold:hover { box-shadow: 0 8px 32px rgba(240,180,41,0.5); transform: translateY(-1px); }
        .price-btn-pur {
          background: rgba(139,120,255,0.1);
          color: #8B78FF;
          border: 1.5px solid rgba(139,120,255,0.35);
        }
        .price-btn-pur:hover { background: rgba(139,120,255,0.18); }
        .price-btn-grn {
          background: rgba(34,197,94,0.1);
          color: #22C55E;
          border: 1.5px solid rgba(34,197,94,0.35);
        }
        .price-btn-grn:hover { background: rgba(34,197,94,0.18); }

        /* ── COMPARE TABLE ── */
        .compare-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 52px; }
        .compare-table th {
          font-family: 'Syne', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          padding: 14px 20px; text-align: center; text-transform: uppercase;
        }
        .compare-table th:first-child { text-align: left; }
        .compare-table td { padding: 13px 20px; font-size: 12px; color: #9090B0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; }
        .compare-table td:first-child { text-align: left; color: #C0C0D8; font-weight: 500; }
        .compare-table tr:last-child td { border-bottom: none; }
        .tbl-head-row { background: rgba(255,255,255,0.03); }
        .tbl-feat { background: rgba(240,180,41,0.03); border-radius: 8px; }
        .check-yes { color: #22C55E; font-size: 16px; }
        .check-no  { color: #2A2A40; font-size: 16px; }

        /* ── FAQ ── */
        .faq { display: flex; flex-direction: column; gap: 8px; margin-top: 48px; }
        details.faq-item {
          background: #080814;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; overflow: hidden;
          transition: border-color 0.2s;
        }
        details.faq-item[open] { border-color: rgba(240,180,41,0.2); }
        details.faq-item summary {
          padding: 20px 24px;
          cursor: pointer;
          font-size: 14px; font-weight: 600; color: #D0D0E8;
          list-style: none;
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: color 0.2s;
        }
        details.faq-item summary:hover { color: #F0F0FA; }
        details.faq-item summary::-webkit-details-marker { display: none; }
        details.faq-item summary::after {
          content: '+'; color: #F0B429; font-size: 22px; font-weight: 300;
          flex-shrink: 0; transition: transform 0.2s;
        }
        details.faq-item[open] summary::after { transform: rotate(45deg); }
        .faq-body { padding: 0 24px 20px; font-size: 13px; color: #7878A0; line-height: 1.75; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }

        /* ── FINAL CTA ── */
        .cta-final {
          max-width: 780px; margin: 0 auto;
          background: linear-gradient(135deg, rgba(240,180,41,0.05) 0%, rgba(240,180,41,0.02) 100%);
          border: 1px solid rgba(240,180,41,0.18);
          border-radius: 24px; padding: 64px 48px;
          text-align: center;
          box-shadow: 0 0 100px rgba(240,180,41,0.07);
          position: relative; overflow: hidden;
        }
        .cta-glow {
          position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(240,180,41,0.1) 0%, transparent 65%);
          pointer-events: none;
        }
        .cta-h2 { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; color: #F0F0FA; margin-bottom: 16px; }
        .cta-sub { font-size: 15px; color: #7878A0; line-height: 1.7; margin-bottom: 36px; }
        .cta-guarantee { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; font-size: 11px; color: #686888; }

        /* ── FOOTER ── */
        .footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 32px 28px; text-align: center;
          font-size: 11px; color: #484860;
        }
        .footer a { color: #686888; transition: color 0.2s; }
        .footer a:hover { color: #F0B429; }

        /* ── BG EFFECTS ── */
        .bg-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 56px 56px;
          animation: gridShine 8s ease-in-out infinite;
        }
        .bg-glow-top {
          position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
          width: 80vw; height: 80vw; border-radius: 50%;
          background: radial-gradient(circle, rgba(240,180,41,0.055) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .bg-glow-bottom {
          position: fixed; bottom: -30%; right: -20%;
          width: 60vw; height: 60vw; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,120,255,0.03) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .rel { position: relative; z-index: 1; }
      `}</style>

      {/* BG */}
      <div className="bg-grid"/>
      <div className="bg-glow-top"/>
      <div className="bg-glow-bottom"/>

      <div className="rel">

        {/* ── NAV ── */}
        <nav className="nav">
          <div className="nav-inner">
            <div className="nav-logo">
              <div className="nav-icon">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{filter:'drop-shadow(0 0 7px rgba(240,180,41,0.8))'}}>
                  <ellipse cx="16" cy="16" rx="13" ry="9" stroke="#F0B429" strokeWidth="1.6"/>
                  <circle cx="16" cy="16" r="5.5" fill="#F0B429"/>
                  <circle cx="16" cy="16" r="2.4" fill="#03030A"/>
                  <circle cx="14.5" cy="14.2" r="1.1" fill="rgba(255,255,255,0.45)"/>
                </svg>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:800,letterSpacing:'0.2em',color:'#F0B429',lineHeight:1,fontFamily:"'Syne', sans-serif"}}>ORÁCULO</div>
                <div style={{fontSize:7,color:'#484860',letterSpacing:'0.16em',marginTop:3,fontFamily:"'Plus Jakarta Sans', sans-serif"}}>AMAZON INTELLIGENCE</div>
              </div>
            </div>
            <div className="nav-links">
              <a href="#planos" className="nav-btn-ghost">Ver planos</a>
              <a href="/login" className="nav-btn-ghost">Entrar</a>
              <a href={LINKS.monthly} target="_blank" className="nav-btn-cta">Começar agora</a>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div style={{maxWidth:1200,margin:'0 auto',padding:'100px 28px 80px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center'}} className="hero-section">
          <style>{`
            @media(max-width:900px){
              .hero-section{grid-template-columns:1fr !important;text-align:center;padding:72px 20px 48px !important;gap:40px !important;}
              .hero-section .hero-ctas,.hero-section .hero-stats{justify-content:center !important;}
              .hero-section .mockup-outer{display:none;}
            }
          `}</style>

          <div>
            <div className="hero-badge fadeUp a1">
              <div className="hero-badge-dot"/>
              <span style={{fontSize:11,color:'#F0B429',fontWeight:700,letterSpacing:'0.1em',fontFamily:"'Syne',sans-serif"}}>MINERAÇÃO DE PRODUTOS AMAZON</span>
            </div>

            <h1 className="hero-h1 fadeUp a2">
              Encontre produtos{' '}
              <span className="shimmer-text">vencedores</span>
              {' '}antes da concorrência
            </h1>

            <p className="hero-sub fadeUp a3">
              O ORÁCULO analisa em tempo real o BSR da Amazon.com.br, estima vendas mensais com precisão e calcula sua margem de lucro — antes de você investir um centavo.
            </p>

            <div className="hero-ctas fadeUp a4" style={{display:'flex',gap:12,marginBottom:44,flexWrap:'wrap'}}>
              <a href={LINKS.annual} target="_blank" className="btn-primary">Começar agora</a>
              <a href="/login" className="btn-ghost">Já tenho conta →</a>
            </div>

            <div className="fadeUp a5" style={{display:'flex',gap:36,flexWrap:'wrap'}}>
              {[
                {v:'200+',l:'produtos por busca'},
                {v:'11',l:'categorias'},
                {v:'8',l:'ferramentas'},
              ].map(s=>(
                <div key={s.l}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:'#F0B429',lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:11,color:'#686888',fontWeight:500,marginTop:4,letterSpacing:'0.03em'}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* MOCKUP */}
          <div className="mockup-outer fadeUp a3" style={{animation:'float 6s ease-in-out infinite'}}>
            <div style={{background:'#0A0A1A',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,overflow:'hidden',boxShadow:'0 40px 120px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.04)'}}>
              {/* browser bar */}
              <div style={{background:'#0D0D20',borderBottom:'1px solid rgba(255,255,255,0.07)',padding:'10px 16px',display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:'#FF5F57'}}/>
                <div style={{width:10,height:10,borderRadius:'50%',background:'#FFBD2E'}}/>
                <div style={{width:10,height:10,borderRadius:'50%',background:'#28CA41'}}/>
                <div style={{flex:1,margin:'0 12px',background:'rgba(255,255,255,0.05)',borderRadius:5,padding:'4px 10px',fontSize:10,color:'#484860',fontFamily:'monospace'}}>
                  app.oraculojf.com.br/dashboard
                </div>
              </div>
              {/* sidebar + content */}
              <div style={{display:'flex',height:340}}>
                {/* mini sidebar */}
                <div style={{width:140,background:'#060610',borderRight:'1px solid rgba(255,255,255,0.07)',padding:'14px 10px',flexShrink:0}}>
                  <div style={{fontSize:8,color:'#484860',letterSpacing:'0.12em',marginBottom:10,paddingLeft:4}}>NAVEGAÇÃO</div>
                  {['Mais Vendidos','Recém Add.','Em Alta','Genéricos','Análise Rival','Extensão','Agente IA','Financeiro'].map((item,i)=>(
                    <div key={i} style={{padding:'7px 8px',borderRadius:6,fontSize:10,color:i===0?'#F0B429':'#585878',background:i===0?'rgba(240,180,41,0.08)':'transparent',marginBottom:2,fontWeight:i===0?700:400}}>
                      {item}
                    </div>
                  ))}
                </div>
                {/* main area */}
                <div style={{flex:1,padding:'14px',overflow:'hidden'}}>
                  <div style={{fontSize:10,color:'#686888',marginBottom:10,fontWeight:600}}>Mais Vendidos · Todas as categorias · <span style={{color:'#F0B429'}}>177 produtos</span></div>
                  {[
                    {title:'Kit 5 Mini Bands Elástico para Exercício',bsr:'#50',sales:'~600',badge:'GENÉRICO',bc:'mock-badge-p'},
                    {title:'Neutrogena Sun Fresh Protetor Solar FPS 70',bsr:'#64',sales:'~280',badge:'GENÉRICO',bc:'mock-badge-y'},
                    {title:'Brinquedo de pelúcia para Carrinho de bebê',bsr:'#5',sales:'~600',badge:'GENÉRICO',bc:'mock-badge-g'},
                    {title:'Caderno de Anotações A5 I 100 Folhas 14,5x21cm',bsr:'#927',sales:'~100',badge:'GENÉRICO',bc:'mock-badge-p'},
                  ].map((p,i)=>(
                    <div key={i} style={{background:'#0F0F22',border:'1px solid rgba(255,255,255,0.07)',borderRadius:8,padding:'9px 10px',marginBottom:6,display:'flex',gap:8,alignItems:'center'}}>
                      <div style={{width:40,height:40,borderRadius:6,background:'#1A1A2E',flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:9,color:'#A0A0C0',fontWeight:600,marginBottom:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.title}</div>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <span style={{fontSize:8,padding:'2px 6px',borderRadius:3,fontWeight:700,background:'rgba(139,120,255,0.15)',color:'#8B78FF'}}>{p.badge}</span>
                          <span style={{fontSize:8,color:'#484860'}}>BSR {p.bsr}</span>
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:11,fontWeight:800,color:'#F0B429'}}>{p.sales}</div>
                        <div style={{fontSize:8,color:'#484860'}}>est/mês</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* glow under */}
            <div style={{position:'absolute',bottom:-30,left:'10%',right:'10%',height:60,background:'radial-gradient(ellipse,rgba(240,180,41,0.2) 0%,transparent 70%)',filter:'blur(20px)',pointerEvents:'none'}}/>
          </div>
        </div>

        {/* ── TICKER ── */}
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {[...Array(2)].map((_,rep)=>(
              <div key={rep} style={{display:'flex',whiteSpace:'nowrap'}}>
                {['200+ produtos por busca','11 categorias Amazon BR','Extensão Chrome inclusa','Simulador FBA automático','Análise de concorrentes','Agente IA de anúncios','Painel Financeiro DRE','Atualização em tempo real','Score real do listing','BSR → Vendas estimadas','Exportar resultados CSV'].map((item,i)=>(
                  <div key={i} className="ticker-item">
                    <span className="ticker-sep">✦</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div className="section">
          <div className="fadeUp a1">
            <div className="section-tag">Ferramentas</div>
            <h2 className="section-h2">Tudo que você precisa para<br/>dominar o Amazon FBA</h2>
            <p className="section-sub">8 ferramentas integradas numa única plataforma. Do produto certo ao anúncio perfeito.</p>
          </div>
          <div className="features-grid">
            {[
              {icon:'📊',title:'Mais Vendidos',desc:'Produtos com maior volume de vendas no marketplace, separados por categoria. BSR + estimativa de unidades/mês.',new:false},
              {icon:'🆕',title:'Recém Adicionados',desc:'Novidades que acabaram de entrar na Amazon.com.br. Identifique tendências antes de todo mundo.',new:false},
              {icon:'🔥',title:'Em Alta',desc:'Produtos com crescimento acelerado de demanda. Detecte o momentum antes que os preços subam.',new:false},
              {icon:'🏷️',title:'Genéricos',desc:'Aba exclusiva com produtos sem marca registrada — menor concorrência e maior margem para marca própria.',new:false},
              {icon:'🎯',title:'Análise Rival',desc:'Cole um ASIN e veja todos os concorrentes diretos, volume de vendas comparativo e dificuldade de entrada.',new:false},
              {icon:'🧩',title:'Extensão Chrome',desc:'Analise qualquer produto diretamente na página da Amazon. Score de listing, simulador e dados de BSR com 1 clique.',new:false},
              {icon:'🤖',title:'Agente IA',desc:'Cria título SEO (3 variações), 5 bullets, descrição, keywords e 6 imagens profissionais via ChatGPT.',new:true},
              {icon:'💹',title:'Painel Financeiro',desc:'Carregue seus relatórios da Amazon e veja seu DRE completo em segundos. Análise de CMV, ACoS e lucro real.',new:true},
            ].map((f,i)=>(
              <div key={i} className={`feat-card fadeUp a${(i%3)+1}`}>
                {f.new && <span className="feat-new">NOVO</span>}
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SPOTLIGHT: Extensão + Agente IA ── */}
        <div className="section" style={{paddingTop:0}}>
          <div className="spotlight">
            {/* Extensão */}
            <div className="spot-card spot-card-gold fadeUp a1">
              <div className="spot-glow-gold"/>
              <div className="spot-tag" style={{color:'#F0B429'}}>🧩 EXTENSÃO CHROME</div>
              <div className="spot-title">Analise na Amazon<br/>com 1 clique</div>
              <div className="spot-desc">Sem sair da página do produto. A extensão mostra BSR, score do listing, estimativa de vendas e simulador de lucro direto na Amazon.com.br.</div>
              <div className="spot-list">
                {['Score do listing com 5 critérios (título, imagens, bullets, demanda, marca)','Simulador FBA: taxa Amazon + FBA + seu custo = lucro real','Recomendações personalizadas de melhoria do anúncio','Funciona em até 2 dispositivos simultaneamente'].map((item,i)=>(
                  <div key={i} className="spot-item">
                    <span style={{color:'#F0B429',fontSize:14,flexShrink:0}}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Agente IA */}
            <div className="spot-card spot-card-green fadeUp a2">
              <div className="spot-glow-green"/>
              <div className="spot-tag" style={{color:'#22C55E'}}>🤖 AGENTE IA</div>
              <div className="spot-title">Cria seu anúncio<br/>do zero com IA</div>
              <div className="spot-desc">Nosso agente especializado em Amazon Brasil usa ChatGPT para criar o anúncio completo do seu produto — título SEO, bullets, descrição e imagens profissionais.</div>
              <div className="spot-list">
                {['3 variações de título com palavras-chave de alta conversão','5 bullets otimizados para o algoritmo A9 da Amazon','Pack de 6 imagens profissionais prontas para upload','Estratégia com gatilhos e sugestões de teste A/B'].map((item,i)=>(
                  <div key={i} className="spot-item">
                    <span style={{color:'#22C55E',fontSize:14,flexShrink:0}}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── COMO FUNCIONA ── */}
        <div className="section" style={{paddingTop:0}}>
          <div className="fadeUp a1">
            <div className="section-tag">Como funciona</div>
            <h2 className="section-h2">Da pesquisa ao produto<br/>em 3 passos</h2>
          </div>
          <div className="steps">
            {[
              {icon:'🔍',title:'Escolha a categoria',desc:'Selecione entre 11 categorias da Amazon.br — Casa, Beleza, Esportes, Eletrônicos e mais. O Oráculo carrega os melhores produtos automaticamente.',n:'01'},
              {icon:'📊',title:'Analise os dados',desc:'Veja BSR, vendas estimadas, score do listing e simulador de lucro de cada produto. Identifique os genéricos com maior margem em segundos.',n:'02'},
              {icon:'🚀',title:'Lance com confiança',desc:'Use o Agente IA para criar o anúncio completo. Entre no mercado com dados reais, margem calculada e um listing otimizado desde o primeiro dia.',n:'03'},
            ].map((s,i)=>(
              <div key={i} className={`step fadeUp a${i+1}`}>
                <div className="step-num">{s.n}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRICING ── */}
        <div id="planos" className="section">
          <div style={{textAlign:'center'}} className="fadeUp a1">
            <div className="section-tag" style={{textAlign:'center'}}>Planos e Preços</div>
            <h2 className="section-h2" style={{textAlign:'center'}}>Invista uma vez.<br/>Lucre para sempre.</h2>
            <p className="section-sub" style={{margin:'0 auto',textAlign:'center'}}>Sem cobrança por produto, sem limite de buscas. Acesso total à plataforma desde o primeiro dia.</p>
          </div>

          <div className="pricing-grid">

            {/* MENSAL */}
            <div className="price-card fadeUp a1">
              <div className="price-tag" style={{color:'#8B78FF'}}>MENSAL</div>
              <div className="price-amount">R$ 47</div>
              <div className="price-period">/mês · cancele quando quiser</div>
              <p className="price-desc" style={{marginTop:10}}>Ideal para quem está pesquisando e validando o primeiro produto.</p>
              <div className="price-divider"/>
              <div className="price-features">
                {[
                  'Painel web completo',
                  'Produtos ilimitados por busca',
                  'Todas as 5 abas de mineração',
                  'Modal de análise completo',
                  'Simulador de lucratividade FBA',
                  'Análise de Concorrentes (ASIN)',
                  'Extensão Chrome inclusa',
                  'Agente IA — Criador de Anúncios',
                  'Painel Financeiro',
                  'Suporte por e-mail',
                ].map((f,i)=>(
                  <div key={i} className="price-feature">
                    <span className="price-check check-yes">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <a href={LINKS.monthly} target="_blank" className="price-btn price-btn-pur">Assinar Mensal</a>
            </div>

            {/* ANUAL — destaque */}
            <div className="price-card price-card-featured fadeUp a2">
              <div className="price-popular">✦ MAIS POPULAR</div>
              <div className="price-tag" style={{color:'#F0B429',marginTop:8}}>ANUAL</div>
              <div className="price-amount" style={{color:'#F0B429'}}>R$ 297</div>
              <div className="price-period">/ano · equivale a R$ 24,75/mês</div>
              <div className="price-economy">↓ Economize 47% em relação ao mensal</div>
              <p className="price-desc">O melhor custo-benefício. Para quem já vende ou quer escalar em 2024.</p>
              <div className="price-divider"/>
              <div className="price-features">
                {[
                  'Tudo do plano Mensal',
                  'Exportar resultados em CSV',
                  'Acesso prioritário a novidades',
                  '1 ano de acesso garantido',
                  'Selo de vendedor verificado (em breve)',
                ].map((f,i)=>(
                  <div key={i} className="price-feature">
                    <span className="price-check check-yes">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <a href={LINKS.annual} target="_blank" className="price-btn price-btn-gold">Assinar Anual</a>
            </div>

            {/* VITALÍCIO */}
            <div className="price-card fadeUp a3" style={{borderColor:'rgba(34,197,94,0.2)',boxShadow:'0 0 40px rgba(34,197,94,0.05)'}}>
              <div className="price-tag" style={{color:'#22C55E'}}>VITALÍCIO</div>
              <div className="price-amount">R$ 497</div>
              <div className="price-period">pagamento único · para sempre</div>
              <div className="price-economy" style={{color:'#22C55E'}}>♾ Pague uma vez, use para sempre</div>
              <p className="price-desc">Para quem está comprometido com o Amazon FBA a longo prazo e quer o melhor ROI.</p>
              <div className="price-divider"/>
              <div className="price-features">
                {[
                  'Tudo do plano Anual',
                  'Acesso vitalício garantido',
                  'Todas as atualizações futuras incluídas',
                  'Suporte VIP prioritário',
                  'Sem mensalidade nunca',
                  'Acesso antecipado a novos módulos',
                ].map((f,i)=>(
                  <div key={i} className="price-feature">
                    <span className="price-check check-yes">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <a href={LINKS.lifetime} target="_blank" className="price-btn price-btn-grn">Comprar Vitalício</a>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="section" style={{paddingTop:0,maxWidth:760,margin:'0 auto',paddingBottom:80}}>
          <div style={{textAlign:'center'}} className="fadeUp a1">
            <div className="section-tag" style={{textAlign:'center'}}>FAQ</div>
            <h2 className="section-h2" style={{textAlign:'center',fontSize:'clamp(28px,3.5vw,44px)'}}>Dúvidas frequentes</h2>
          </div>
          <div className="faq">
            {[
              {q:'O que exatamente é o ORÁCULO?',a:'O ORÁCULO é uma plataforma de inteligência de mercado para Amazon FBA Brasil. Ele usa o BSR (Best Seller Rank) de cada produto para estimar vendas mensais, calcula margens de lucro com taxas reais da Amazon e FBA, e oferece 8 ferramentas integradas para você encontrar e lançar produtos vencedores.'},
              {q:'A extensão Chrome está inclusa em todos os planos?',a:'Sim. Ao assinar qualquer plano você recebe automaticamente: acesso ao painel web + sua chave de licença pessoal para a extensão Chrome. A chave aparece na aba "Extensão" do painel assim que você entrar.'},
              {q:'O Agente IA está incluso? Precisa de conta no ChatGPT?',a:'Sim, está incluso. O Agente IA abre diretamente no ChatGPT — você usa sua conta existente (plano gratuito funciona). Não há custo adicional.'},
              {q:'Em quantos dispositivos posso usar?',a:'O painel web aceita login simultâneo em até 2 dispositivos. A extensão Chrome funciona em até 2 máquinas com a mesma chave de licença.'},
              {q:'Os dados são reais? Como as vendas são calculadas?',a:'Sim. Utilizamos o BSR (Best Seller Rank) real da Amazon.com.br via Amazon SP-API. A fórmula de estimativa de vendas é calibrada para o mercado brasileiro, cruzando BSR com faixas de demanda reais. É uma estimativa — não um número exato — mas muito mais confiável que qualquer achismo.'},
              {q:'Funciona para outros marketplaces além do Brasil?',a:'No momento o ORÁCULO é especializado no Amazon.com.br. Dados de BSR, taxas FBA e estimativas de vendas são todos calibrados para o mercado brasileiro.'},
              {q:'Posso cancelar o plano mensal?',a:'Sim, o plano Mensal pode ser cancelado a qualquer momento, sem multa. Você mantém acesso até o fim do período pago.'},
            ].map((item,i)=>(
              <details key={i} className="faq-item">
                <summary>{item.q}</summary>
                <div className="faq-body">{item.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* ── FINAL CTA ── */}
        <div className="section" style={{paddingTop:0}}>
          <div className="cta-final fadeUp a1">
            <div className="cta-glow"/>
            <div style={{fontSize:12,fontFamily:"'Syne',sans-serif",fontWeight:700,letterSpacing:'0.16em',color:'#F0B429',marginBottom:20,position:'relative'}}>
              ✦ COMECE HOJE
            </div>
            <h2 className="cta-h2" style={{position:'relative'}}>
              Pare de adivinhar.<br/>
              <span className="gold-text">Comece a lucrar.</span>
            </h2>
            <p className="cta-sub" style={{position:'relative'}}>
              Mais de 200 produtos analisados por busca, 8 ferramentas de inteligência,<br/>simulador de lucro completo e extensão Chrome — tudo num só lugar.
            </p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',position:'relative'}}>
              <a href={LINKS.annual} target="_blank" className="btn-primary">Assinar agora — R$ 297/ano</a>
              <a href={LINKS.lifetime} target="_blank" className="btn-ghost">Vitalício por R$ 497 →</a>
            </div>
            <div className="cta-guarantee" style={{position:'relative'}}>
              <span>🔒</span>
              <span>Pagamento seguro · Acesso imediato após confirmação · Suporte em português</span>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <p>© {new Date().getFullYear()} Belchiq LTDA · ORÁCULO Amazon Intelligence · <a href="/login">Entrar na plataforma</a> · <a href="#planos">Ver planos</a></p>
        </footer>

      </div>
    </>
  )
}
