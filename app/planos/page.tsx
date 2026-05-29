import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORÁCULO — Inteligência de Mercado Amazon FBA',
  description: 'Veja o que o mercado esconde. 8 ferramentas de análise para Amazon FBA Brasil.',
  openGraph: {
    title: 'ORÁCULO Amazon Intelligence',
    description: 'Encontre produtos vencedores antes da concorrência.',
    images: ['/og-image.png'],
  },
}

const LINKS = {
  monthly:  'https://payfast.greenn.com.br/pm36pq4/offer/B0febG',
  biannual: 'https://payfast.greenn.com.br/pm36pq4/offer/rpgHFd',
  annual:   'https://payfast.greenn.com.br/pm36pq4/offer/WBkId3',
}

const FEATURES = [
  {
    n:'01', icon:'🏆', title:'Mais Vendidos',
    desc:'Produtos com maior volume de vendas em tempo real. Tendências de alta demanda atualizadas diariamente.',
    data:[{k:'Produtos / dia',v:'+1.247'},{k:'BSR médio',v:'#4.230'},{k:'Ticket médio',v:'R$34,90'}],
  },
  {
    n:'02', icon:'🆕', title:'Recém Adicionados',
    desc:'Novos produtos entrando no marketplace. Seja o primeiro a descobrir oportunidades antes da massa.',
    data:[{k:'Adicionados hoje',v:'+389'},{k:'Categorias',v:'47'},{k:'Com avaliação',v:'62%'}],
  },
  {
    n:'03', icon:'🔥', title:'Em Alta',
    desc:'Produtos com crescimento acelerado nas últimas 24h. Pegue a onda enquanto a janela está aberta.',
    data:[{k:'Crescimento máx.',v:'+445%'},{k:'Ciclo médio',v:'3 dias'},{k:'Conversão',v:'4.2%'}],
  },
  {
    n:'04', icon:'💊', title:'Genéricos',
    desc:'Produtos sem marca com alta margem. A oportunidade perfeita para lançar sua própria marca.',
    data:[{k:'Margem média',v:'62%'},{k:'Sem rival forte',v:'38%'},{k:'Volume diário',v:'3.400'}],
  },
  {
    n:'05', icon:'🔍', title:'Análise Rival',
    desc:'Monitore concorrentes em tempo real. Compare preços, avaliações e identifique fraquezas.',
    data:[{k:'Rivals',v:'Ilimitado'},{k:'Atualização',v:'Diária'},{k:'Exportar',v:'CSV / XLS'}],
  },
  {
    n:'06', icon:'🔌', title:'Extensão Chrome',
    desc:'Análise direto na página do produto Amazon. Dados de tendência sem trocar de aba.',
    data:[{k:'Setup',v:'1 clique'},{k:'Dados',v:'Tempo real'},{k:'Browser',v:'Chrome / Edge'}],
  },
  {
    n:'07', icon:'🤖', title:'Agente IA', isNew:true,
    desc:'Agente de IA analisa padrões e entrega uma lista curada de oportunidades diárias com justificativa.',
    data:[{k:'Análises',v:'Ilimitadas'},{k:'Modelo',v:'GPT-4o'},{k:'Precisão',v:'94.3%'}],
  },
  {
    n:'08', icon:'💰', title:'Simulador Financeiro', isNew:true,
    desc:'Calcule margem real, FBA fees, imposto e lucro líquido antes de qualquer decisão de compra.',
    data:[{k:'Variáveis',v:'18+'},{k:'Câmbio',v:'Automático'},{k:'Exportar',v:'PDF / XLS'}],
  },
]

const MOCK_ROWS = [
  {name:'Suporte Pescoço Elástico',  price:'R$24,90', badge:'🔥 Em Alta',    bdg:'gold',  rating:'4.7★', trend:'+234%', c:'#F0B429'},
  {name:'Organizador Gaveta Kit',     price:'R$18,50', badge:'✅ Top Vendas', bdg:'green', rating:'4.5★', trend:'+189%', c:'#00C896'},
  {name:'Cabo USB-C 2m Trançado',     price:'R$12,90', badge:'🆕 Recém Add.', bdg:'blue',  rating:'4.3★', trend:'+156%', c:'#5B9EF0'},
  {name:'Esteira Dobrável Portátil',  price:'R$89,90', badge:'🔥 Em Alta',    bdg:'gold',  rating:'4.6★', trend:'+312%', c:'#F0B429'},
  {name:'Porta Caneca Giratória',     price:'R$9,90',  badge:'✅ Top Vendas', bdg:'green', rating:'4.2★', trend:'+98%',  c:'#00C896'},
  {name:'Kit Skincare Masculino',     price:'R$67,00', badge:'⚡ Genérico',   bdg:'red',   rating:'4.4★', trend:'+445%', c:'#FF4D6D'},
]

const STATS = [
  {n:'12.847', l:'produtos analisados'},
  {n:'847',    l:'usuários ativos'},
  {n:'8',      l:'ferramentas exclusivas'},
  {n:'4x',     l:'mais rápido que rivals'},
  {n:'99.9%',  l:'uptime garantido'},
  {n:'R$0',    l:'custo extra por análise'},
]

const FAQS = [
  {q:'O acesso é liberado imediatamente após o pagamento?',
   a:'Sim. Assim que o pagamento for confirmado você recebe as credenciais por e-mail automaticamente. Em minutos você já estará dentro da plataforma.'},
  {q:'Preciso instalar algum software?',
   a:'Não. O Oráculo é 100% web — acesse pelo navegador em qualquer dispositivo. A extensão Chrome é opcional e complementar, instalada com um clique.'},
  {q:'Os dados são atualizados com que frequência?',
   a:'Os dados de mais vendidos, em alta e recém adicionados são atualizados diariamente. O Agente IA gera novas análises a cada 24 horas.'},
  {q:'Posso cancelar quando quiser?',
   a:'Sim. Planos mensais podem ser cancelados a qualquer momento. Planos semestrais e anuais têm acesso garantido pelo período contratado.'},
  {q:'A extensão Chrome está incluída no plano?',
   a:'Sim. Todos os planos incluem a extensão Chrome sem custo adicional. Basta instalar e inserir sua chave de acesso.'},
  {q:'O Agente IA tem limite de uso?',
   a:'Não. O Agente IA pode ser usado de forma ilimitada em todos os planos. Analise quantos produtos quiser, sem restrição.'},
  {q:'Funciona para qual marketplace?',
   a:'Atualmente o Oráculo é focado no Amazon Brasil (amazon.com.br). Expansão para outros marketplaces está no roadmap.'},
]

export default function PlanosPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        :root{
          --bg:#03030C;--s1:#07071A;--s2:#0C0C1F;
          --bd:rgba(255,255,255,0.06);--bdg:rgba(240,180,41,0.12);
          --gold:#F0B429;--gold2:#C8960F;--glow:rgba(240,180,41,0.15);
          --text:#E0E0EE;--mut:#5A5A78;--mut2:#8A8AAA;
          --green:#00C896;--red:#FF4D6D;--blue:#5B9EF0;
        }
        body{font-family:'DM Sans',system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden}
        a{text-decoration:none;color:inherit}
        ::selection{background:rgba(240,180,41,0.18)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#1E1E36;border-radius:2px}

        /* ANIMATIONS */
        @keyframes scanLine{
          0%{transform:translateY(-100%);opacity:0}
          8%{opacity:0.7}90%{opacity:0.7}
          100%{transform:translateY(5000%);opacity:0}
        }
        @keyframes gridPan{
          from{background-position:0 0}
          to{background-position:60px 60px}
        }
        @keyframes floatY{
          0%,100%{transform:rotateX(8deg) rotateY(-2deg) translateY(0)}
          50%{transform:rotateX(8deg) rotateY(-2deg) translateY(-8px)}
        }
        @keyframes floatYHover{
          0%,100%{transform:rotateX(0deg) rotateY(0deg) translateY(0)}
        }
        @keyframes ticker{
          from{transform:translateX(0)}
          to{transform:translateX(-50%)}
        }
        @keyframes dataRow{
          from{opacity:0;transform:translateX(-10px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes fadeUp{
          from{opacity:0;transform:translateY(30px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes borderGlow{
          0%,100%{box-shadow:0 0 30px rgba(240,180,41,0.15),0 0 60px rgba(240,180,41,0.05),inset 0 0 30px rgba(240,180,41,0.02)}
          50%{box-shadow:0 0 50px rgba(240,180,41,0.28),0 0 100px rgba(240,180,41,0.08),inset 0 0 40px rgba(240,180,41,0.04)}
        }
        @keyframes glowPulse{
          0%,100%{opacity:0.5;transform:scale(1)}
          50%{opacity:1;transform:scale(1.1)}
        }
        @keyframes shimmer{
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes spinSlow{
          from{transform:rotate(0deg)}
          to{transform:rotate(360deg)}
        }

        /* ─── NAV ─── */
        .nav{
          position:fixed;top:0;left:0;right:0;z-index:200;
          height:62px;display:flex;align-items:center;justify-content:space-between;
          padding:0 40px;
          background:rgba(3,3,12,0.85);
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border-bottom:1px solid var(--bd);
        }
        .nav-logo{display:flex;align-items:center;gap:10px}
        .nav-eye{
          width:26px;height:26px;border-radius:50%;
          border:1.5px solid var(--gold);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 10px rgba(240,180,41,0.25);
        }
        .nav-eye-inner{
          width:9px;height:5px;border-radius:50%;
          background:var(--gold);
          box-shadow:0 0 5px var(--gold);
        }
        .nav-wordmark{
          font-family:'Rajdhani',sans-serif;
          font-size:17px;font-weight:700;letter-spacing:4px;
          color:var(--text);
        }
        .nav-wordmark em{color:var(--gold);font-style:normal}
        .nav-actions{display:flex;align-items:center;gap:8px}
        .btn-ghost{
          padding:7px 18px;border-radius:4px;
          border:1px solid var(--bd);color:var(--mut2);
          font-size:13px;font-weight:500;
          transition:all 0.2s;
        }
        .btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
        .btn-gold{
          padding:8px 22px;border-radius:4px;
          background:var(--gold);color:#000;
          font-size:13px;font-weight:700;letter-spacing:0.3px;
          transition:all 0.2s;
          box-shadow:0 2px 16px rgba(240,180,41,0.25);
        }
        .btn-gold:hover{background:#FFD055;box-shadow:0 4px 24px rgba(240,180,41,0.4)}

        /* ─── HERO ─── */
        .hero{
          min-height:100vh;padding-top:62px;
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          position:relative;overflow:hidden;
          padding-bottom:60px;
        }
        .hero-bg{
          position:absolute;inset:0;
          background:
            radial-gradient(ellipse 90% 55% at 50% -5%,rgba(240,180,41,0.07) 0%,transparent 65%),
            radial-gradient(ellipse 50% 40% at 80% 90%,rgba(91,158,240,0.04) 0%,transparent 60%),
            linear-gradient(180deg,#03030C 0%,#04041A 100%);
        }
        .hero-grid{
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,0.028) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,0.028) 1px,transparent 1px);
          background-size:60px 60px;
          animation:gridPan 10s linear infinite;
          mask-image:radial-gradient(ellipse 80% 65% at 50% 40%,black 20%,transparent 75%);
          -webkit-mask-image:radial-gradient(ellipse 80% 65% at 50% 40%,black 20%,transparent 75%);
        }
        .hero-scanline{
          position:absolute;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent 0%,rgba(240,180,41,0.5) 20%,rgba(255,255,255,0.6) 50%,rgba(240,180,41,0.5) 80%,transparent 100%);
          animation:scanLine 7s ease-in-out infinite;
          pointer-events:none;z-index:1;
        }
        .hero-vignette{
          position:absolute;inset:0;
          background:radial-gradient(ellipse at center,transparent 35%,rgba(3,3,12,0.85) 100%);
          pointer-events:none;
        }
        .hero-inner{
          position:relative;z-index:2;
          display:flex;flex-direction:column;align-items:center;
          text-align:center;padding:0 24px;
        }
        .hero-badge{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 16px;border-radius:100px;
          border:1px solid var(--bdg);
          background:rgba(240,180,41,0.04);
          font-family:'JetBrains Mono',monospace;
          font-size:11px;color:var(--gold);letter-spacing:1.5px;
          margin-bottom:32px;
          animation:fadeUp 0.8s ease both;
        }
        .hero-badge-dot{
          width:6px;height:6px;border-radius:50%;
          background:var(--green);
          box-shadow:0 0 8px var(--green);
          animation:glowPulse 2s ease infinite;
        }
        .hero-h1{
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(80px,13vw,156px);
          line-height:0.88;letter-spacing:-1px;
          color:#fff;
          text-shadow:0 0 100px rgba(240,180,41,0.12),0 4px 0 rgba(0,0,0,0.6);
          animation:fadeUp 0.8s ease 0.1s both;
          margin-bottom:4px;
        }
        .hero-h1-accent{
          display:block;
          background:linear-gradient(135deg,#FFE680 0%,#F0B429 40%,#C8960F 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
          filter:drop-shadow(0 0 30px rgba(240,180,41,0.4));
        }
        .hero-h1-sub{
          display:block;
          background:linear-gradient(135deg,#FFFFFF 0%,rgba(224,224,238,0.6) 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .hero-sub{
          font-size:17px;color:var(--mut2);
          max-width:460px;line-height:1.65;
          margin-top:22px;margin-bottom:36px;
          animation:fadeUp 0.8s ease 0.22s both;
        }
        .hero-sub strong{color:var(--text);font-weight:500}
        .hero-ctas{
          display:flex;align-items:center;justify-content:center;gap:12px;
          flex-wrap:wrap;
          animation:fadeUp 0.8s ease 0.34s both;
        }
        .cta-main{
          display:inline-flex;align-items:center;gap:8px;
          padding:15px 36px;border-radius:4px;
          background:var(--gold);color:#000;
          font-weight:700;font-size:15px;letter-spacing:0.5px;
          box-shadow:0 4px 28px rgba(240,180,41,0.35);
          transition:all 0.2s;
        }
        .cta-main:hover{background:#FFD055;transform:translateY(-2px);box-shadow:0 8px 40px rgba(240,180,41,0.45)}
        .cta-line{
          display:inline-flex;align-items:center;gap:8px;
          padding:14px 28px;border-radius:4px;
          border:1px solid rgba(255,255,255,0.1);color:var(--text);
          font-size:15px;font-weight:500;
          transition:all 0.2s;
        }
        .cta-line:hover{border-color:var(--gold);color:var(--gold)}

        /* Hero mockup */
        .mockup-stage{
          position:relative;z-index:2;
          margin-top:64px;
          perspective:1200px;
          animation:fadeUp 0.8s ease 0.5s both;
        }
        .mockup-shell{
          width:min(940px,88vw);
          border-radius:10px;
          border:1px solid rgba(255,255,255,0.07);
          background:#05051A;
          overflow:hidden;
          transform:rotateX(8deg) rotateY(-2deg);
          box-shadow:
            0 50px 100px rgba(0,0,0,0.7),
            0 0 0 1px rgba(240,180,41,0.06),
            inset 0 1px 0 rgba(255,255,255,0.04);
          animation:floatY 7s ease infinite;
        }
        .mockup-shell:hover{animation:none;transform:rotateX(0deg) rotateY(0deg);transition:transform 0.5s ease}
        .mock-chrome{
          display:flex;align-items:center;gap:7px;
          padding:9px 14px;
          background:#030310;
          border-bottom:1px solid rgba(255,255,255,0.05);
        }
        .mock-dot{width:10px;height:10px;border-radius:50%}
        .mock-dot-r{background:#FF5F56}.mock-dot-y{background:#FFBD2E}.mock-dot-g{background:#27C93F}
        .mock-url{
          flex:1;text-align:center;
          font-family:'JetBrains Mono',monospace;
          font-size:10px;color:var(--mut);letter-spacing:0.8px;
        }
        .mock-body{display:flex;height:340px}
        .mock-side{
          width:50px;background:#040410;
          border-right:1px solid rgba(255,255,255,0.04);
          padding:14px 0;
          display:flex;flex-direction:column;align-items:center;gap:12px;
        }
        .mock-icon{
          width:26px;height:26px;border-radius:5px;
          display:flex;align-items:center;justify-content:center;font-size:11px;
        }
        .mock-icon-on{background:rgba(240,180,41,0.12)}
        .mock-panel{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .mock-tabs-bar{
          display:flex;padding:0 14px;
          background:#040411;
          border-bottom:1px solid rgba(255,255,255,0.04);
        }
        .mock-tab{
          padding:9px 12px;
          font-family:'DM Sans',sans-serif;
          font-size:10px;font-weight:500;color:var(--mut);
          white-space:nowrap;
        }
        .mock-tab-on{color:var(--gold);border-bottom:1.5px solid var(--gold)}
        .mock-thead{
          display:grid;grid-template-columns:2fr 1fr 1.2fr 1fr 1fr;
          padding:7px 14px;
          font-family:'JetBrains Mono',monospace;
          font-size:9px;letter-spacing:1px;color:var(--mut);text-transform:uppercase;
          background:rgba(255,255,255,0.015);
          border-bottom:1px solid rgba(255,255,255,0.03);
        }
        .mock-row{
          display:grid;grid-template-columns:2fr 1fr 1.2fr 1fr 1fr;
          padding:7px 14px;
          border-bottom:1px solid rgba(255,255,255,0.025);
          align-items:center;
          opacity:0;
          animation:dataRow 0.4s ease forwards;
        }
        .mock-row:hover{background:rgba(240,180,41,0.025)}
        .mock-row:nth-child(1){animation-delay:0.8s}
        .mock-row:nth-child(2){animation-delay:0.96s}
        .mock-row:nth-child(3){animation-delay:1.12s}
        .mock-row:nth-child(4){animation-delay:1.28s}
        .mock-row:nth-child(5){animation-delay:1.44s}
        .mock-row:nth-child(6){animation-delay:1.6s}
        .mock-prod{display:flex;align-items:center;gap:7px;font-size:10.5px;color:var(--text)}
        .mock-prod-bead{width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .mock-price{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--gold)}
        .mock-pill{
          display:inline-block;padding:2px 6px;border-radius:3px;
          font-family:'JetBrains Mono',monospace;font-size:8.5px;
          letter-spacing:0.3px;font-weight:500;
        }
        .pill-gold{background:rgba(240,180,41,0.12);color:var(--gold)}
        .pill-green{background:rgba(0,200,150,0.12);color:var(--green)}
        .pill-blue{background:rgba(91,158,240,0.12);color:var(--blue)}
        .pill-red{background:rgba(255,77,109,0.12);color:var(--red)}
        .mock-star{font-size:10px;color:var(--gold)}
        .mock-up{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--green)}
        .mockup-glow{
          position:absolute;bottom:-50px;left:50%;transform:translateX(-50%);
          width:500px;height:120px;
          background:radial-gradient(ellipse,rgba(240,180,41,0.12),transparent 70%);
          filter:blur(24px);pointer-events:none;
        }

        /* ─── STATS STRIP ─── */
        .strip{
          border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);
          background:var(--s1);padding:18px 0;overflow:hidden;
        }
        .strip-track{
          display:flex;width:max-content;
          animation:ticker 28s linear infinite;
        }
        .strip-item{
          display:flex;align-items:center;gap:10px;
          padding:0 44px;white-space:nowrap;
          border-right:1px solid var(--bd);
        }
        .strip-n{
          font-family:'Bebas Neue',sans-serif;
          font-size:28px;color:var(--gold);letter-spacing:1px;
        }
        .strip-l{font-size:12.5px;color:var(--mut2);letter-spacing:0.3px}

        /* ─── SECTION BASE ─── */
        .sec{padding:100px 24px;position:relative}
        .sec-in{max-width:1100px;margin:0 auto}
        .sec-tag{
          display:inline-block;
          font-family:'JetBrains Mono',monospace;
          font-size:10.5px;letter-spacing:2px;color:var(--gold);
          opacity:0.75;text-transform:uppercase;margin-bottom:14px;
        }
        .sec-h{
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(44px,6.5vw,76px);
          line-height:0.95;letter-spacing:1px;color:#fff;margin-bottom:16px;
        }
        .sec-h em{color:var(--gold);font-style:normal}
        .sec-p{font-size:16px;color:var(--mut2);max-width:540px;line-height:1.68}

        /* ─── FEATURES ─── */
        .feat-grid{
          display:grid;grid-template-columns:repeat(4,1fr);gap:1px;
          margin-top:56px;
          background:var(--bd);
          border:1px solid var(--bd);border-radius:10px;overflow:hidden;
        }
        .feat-card{
          background:var(--s1);padding:28px 24px;
          position:relative;overflow:hidden;
          transition:background 0.25s;
        }
        .feat-card::after{
          content:'';position:absolute;
          top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,var(--gold),transparent);
          opacity:0;transition:opacity 0.3s;
        }
        .feat-card:hover{background:#0A0A20}
        .feat-card:hover::after{opacity:0.4}
        .feat-n{
          font-family:'JetBrains Mono',monospace;
          font-size:10px;color:var(--gold);opacity:0.45;
          letter-spacing:1px;margin-bottom:14px;
        }
        .feat-icon{
          width:38px;height:38px;border-radius:7px;
          background:rgba(240,180,41,0.07);
          border:1px solid rgba(240,180,41,0.14);
          display:flex;align-items:center;justify-content:center;
          font-size:17px;margin-bottom:12px;
        }
        .feat-title{
          font-family:'Rajdhani',sans-serif;
          font-size:15px;font-weight:700;letter-spacing:0.5px;
          text-transform:uppercase;color:var(--text);margin-bottom:7px;
        }
        .feat-new{
          display:inline-block;
          background:var(--gold);color:#000;
          font-family:'JetBrains Mono',monospace;
          font-size:8px;font-weight:700;letter-spacing:1px;
          padding:2px 5px;border-radius:2px;
          margin-left:7px;vertical-align:middle;
        }
        .feat-desc{font-size:13px;color:var(--mut2);line-height:1.6;margin-bottom:14px}
        .feat-data{
          padding:9px 10px;
          background:rgba(0,0,0,0.35);
          border-radius:5px;border:1px solid var(--bd);
          font-family:'JetBrains Mono',monospace;font-size:9.5px;
        }
        .feat-data-row{display:flex;justify-content:space-between;padding:1.5px 0}
        .feat-data-key{color:var(--mut)}
        .feat-data-v1{color:var(--green)}
        .feat-data-v2{color:var(--gold)}

        /* ─── SPOTLIGHT ─── */
        .spot-bg{background:var(--s1);border-top:1px solid var(--bd);border-bottom:1px solid var(--bd)}
        .spot-grid{
          display:grid;grid-template-columns:1fr 1fr;gap:1px;
          margin-top:52px;
          background:var(--bd);border-radius:10px;overflow:hidden;
        }
        .spot-card{
          background:var(--s2);padding:48px 42px;
          position:relative;overflow:hidden;
        }
        .spot-card::before{
          content:'';position:absolute;
          top:-120px;right:-120px;
          width:320px;height:320px;border-radius:50%;
          background:radial-gradient(circle,rgba(240,180,41,0.05),transparent 70%);
          pointer-events:none;
        }
        .spot-emoji{font-size:44px;display:block;margin-bottom:20px}
        .spot-label{
          font-family:'JetBrains Mono',monospace;
          font-size:10px;color:var(--gold);letter-spacing:2.5px;
          text-transform:uppercase;margin-bottom:10px;
        }
        .spot-title{
          font-family:'Bebas Neue',sans-serif;
          font-size:34px;letter-spacing:0.5px;line-height:1;
          color:var(--text);margin-bottom:14px;
        }
        .spot-desc{font-size:15px;color:var(--mut2);line-height:1.7;max-width:360px}
        .spot-pills{display:flex;flex-wrap:wrap;gap:7px;margin-top:20px}
        .spot-pill{
          padding:4px 12px;border-radius:100px;
          font-size:12px;font-weight:500;
          border:1px solid var(--bd);color:var(--mut2);
        }
        .spot-pill-on{
          border-color:rgba(240,180,41,0.28);
          color:var(--gold);background:rgba(240,180,41,0.05);
        }

        /* ─── HOW ─── */
        .how-steps{
          display:grid;grid-template-columns:repeat(3,1fr);gap:40px;
          margin-top:56px;position:relative;
        }
        .how-steps::before{
          content:'';position:absolute;
          top:27px;
          left:calc(16.66% + 28px);right:calc(16.66% + 28px);
          height:1px;
          background:linear-gradient(90deg,var(--gold) 0%,rgba(240,180,41,0.08) 100%);
        }
        .how-step{text-align:center}
        .how-num{
          width:54px;height:54px;border-radius:50%;
          border:1px solid var(--gold);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 20px;
          font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--gold);
          background:rgba(240,180,41,0.05);
          box-shadow:0 0 20px rgba(240,180,41,0.08);
          position:relative;z-index:1;
        }
        .how-t{
          font-family:'Rajdhani',sans-serif;
          font-size:18px;font-weight:700;text-transform:uppercase;
          letter-spacing:0.5px;color:var(--text);margin-bottom:10px;
        }
        .how-d{font-size:14px;color:var(--mut2);line-height:1.65}

        /* ─── PRICING ─── */
        .price-grid{
          display:grid;grid-template-columns:repeat(3,1fr);gap:1px;
          margin-top:48px;
          background:var(--bd);border-radius:12px;overflow:hidden;
          box-shadow:0 40px 80px rgba(0,0,0,0.5);
        }
        .price-card{background:var(--s1);padding:40px 32px;position:relative}
        .price-card-hot{
          background:#09091E;
          animation:borderGlow 4s ease infinite;
        }
        .price-pop{
          position:absolute;top:-1px;left:50%;transform:translateX(-50%);
          background:var(--gold);color:#000;
          font-family:'JetBrains Mono',monospace;
          font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
          padding:4px 14px;border-radius:0 0 8px 8px;
          white-space:nowrap;
        }
        .price-label{
          font-family:'JetBrains Mono',monospace;
          font-size:10.5px;letter-spacing:2px;text-transform:uppercase;
          color:var(--mut);margin-bottom:22px;
        }
        .price-label-hot{color:var(--gold)}
        .price-amt{display:flex;align-items:flex-start;gap:3px;margin-bottom:4px}
        .price-brl{
          font-size:17px;font-weight:600;color:var(--mut2);
          margin-top:10px;
        }
        .price-brl-hot{color:var(--gold)}
        .price-big{
          font-family:'Bebas Neue',sans-serif;
          font-size:70px;line-height:1;letter-spacing:-1px;color:var(--text);
        }
        .price-big-hot{color:var(--gold)}
        .price-period{font-size:13px;color:var(--mut);margin-bottom:5px}
        .price-pmth{
          font-family:'JetBrains Mono',monospace;
          font-size:11px;color:var(--mut);margin-bottom:24px;
        }
        .price-pmth em{color:var(--green);font-style:normal}
        .price-div{height:1px;background:var(--bd);margin:18px 0}
        .price-list{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:28px}
        .price-list li{
          display:flex;align-items:flex-start;gap:9px;
          font-size:13.5px;color:var(--mut2);line-height:1.4;
        }
        .price-list li::before{
          content:'✓';color:var(--green);font-weight:700;
          flex-shrink:0;font-size:12px;margin-top:1px;
        }
        .price-btn{
          display:block;width:100%;padding:14px;
          text-align:center;border-radius:5px;
          font-weight:700;font-size:14.5px;letter-spacing:0.4px;
          cursor:pointer;transition:all 0.2s;
        }
        .price-btn-line{
          border:1px solid rgba(255,255,255,0.1);color:var(--text);
        }
        .price-btn-line:hover{border-color:var(--gold);color:var(--gold)}
        .price-btn-fill{
          background:var(--gold);color:#000;border:none;
          box-shadow:0 4px 20px rgba(240,180,41,0.25);
        }
        .price-btn-fill:hover{background:#FFD055;box-shadow:0 8px 32px rgba(240,180,41,0.38);transform:translateY(-1px)}

        /* ─── FAQ ─── */
        .faq-bg{background:var(--s1);border-top:1px solid var(--bd)}
        .faq-list{
          margin-top:44px;
          border:1px solid var(--bd);border-radius:8px;overflow:hidden;
        }
        details.faq{border-bottom:1px solid var(--bd)}
        details.faq:last-child{border-bottom:none}
        summary.faq-q{
          padding:20px 26px;
          font-family:'Rajdhani',sans-serif;
          font-size:17px;font-weight:600;letter-spacing:0.3px;
          color:var(--text);cursor:pointer;
          list-style:none;
          display:flex;justify-content:space-between;align-items:center;
          transition:color 0.2s;
        }
        summary.faq-q::-webkit-details-marker{display:none}
        summary.faq-q:hover{color:var(--gold)}
        summary.faq-q::after{
          content:'+';font-size:22px;color:var(--gold);
          font-weight:300;flex-shrink:0;margin-left:16px;
          transition:transform 0.2s;
        }
        details[open] summary.faq-q{color:var(--gold)}
        details[open] summary.faq-q::after{content:'−'}
        .faq-a{
          padding:0 26px 20px;
          font-size:14.5px;color:var(--mut2);line-height:1.72;
          max-width:680px;
        }

        /* ─── FINAL CTA ─── */
        .fcta{
          text-align:center;padding:120px 24px;
          position:relative;overflow:hidden;
        }
        .fcta-bg{
          position:absolute;inset:0;
          background:radial-gradient(ellipse 65% 80% at 50% 50%,rgba(240,180,41,0.065),transparent 65%);
        }
        .fcta-grid{
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);
          background-size:52px 52px;
          mask-image:radial-gradient(ellipse 75% 85% at 50% 50%,black,transparent);
          -webkit-mask-image:radial-gradient(ellipse 75% 85% at 50% 50%,black,transparent);
        }
        .fcta-in{position:relative;z-index:1}
        .fcta-h{
          font-family:'Bebas Neue',sans-serif;
          font-size:clamp(52px,8vw,106px);
          line-height:0.92;color:#fff;margin-bottom:20px;
          text-shadow:0 0 60px rgba(240,180,41,0.12);
        }
        .fcta-h em{color:var(--gold);font-style:normal}
        .fcta-sub{
          font-size:17px;color:var(--mut2);
          max-width:420px;margin:0 auto 36px;line-height:1.65;
        }

        /* ─── FOOTER ─── */
        .footer{
          border-top:1px solid var(--bd);
          padding:28px 40px;
          display:flex;align-items:center;justify-content:space-between;
          flex-wrap:wrap;gap:14px;
        }
        .footer-copy{
          font-family:'JetBrains Mono',monospace;
          font-size:11px;color:var(--mut);letter-spacing:0.5px;
        }
        .footer-links{display:flex;gap:22px}
        .footer-lnk{font-size:13px;color:var(--mut);transition:color 0.2s}
        .footer-lnk:hover{color:var(--gold)}

        /* ─── RESPONSIVE ─── */
        @media(max-width:900px){
          .feat-grid{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:768px){
          .nav{padding:0 20px}
          .btn-ghost{display:none}
          .mockup-stage{display:none}
          .spot-grid{grid-template-columns:1fr}
          .how-steps{grid-template-columns:1fr}
          .how-steps::before{display:none}
          .price-grid{grid-template-columns:1fr}
          .footer{flex-direction:column;text-align:center}
        }
        @media(max-width:560px){
          .feat-grid{grid-template-columns:1fr}
          .mock-thead>span:nth-child(n+4),
          .mock-row>*:nth-child(n+4){display:none}
          .mock-thead,.mock-row{grid-template-columns:2fr 1fr 1.2fr}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-eye"><div className="nav-eye-inner" /></div>
          <span className="nav-wordmark">ORÁC<em>U</em>LO</span>
        </a>
        <div className="nav-actions">
          <a href="/login" className="btn-ghost">Entrar</a>
          <a href={LINKS.annual} className="btn-gold">Assinar Agora</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-scanline" />
        <div className="hero-vignette" />

        <div className="hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            SISTEMA ATIVO · AMAZON FBA BRASIL
          </div>

          <h1 className="hero-h1">
            VEJA O QUE
            <span className="hero-h1-accent">NINGUÉM</span>
            <span className="hero-h1-sub">VÊ</span>
          </h1>

          <p className="hero-sub">
            Inteligência de mercado em tempo real para{' '}
            <strong>Amazon FBA</strong>. Encontre produtos
            vencedores antes da concorrência com{' '}
            <strong>8 ferramentas especializadas</strong>.
          </p>

          <div className="hero-ctas">
            <a href={LINKS.biannual} className="cta-main">Começar Agora →</a>
            <a href="/login" className="cta-line">Já tenho conta</a>
          </div>
        </div>

        {/* 3D Dashboard Mockup */}
        <div className="mockup-stage">
          <div className="mockup-shell">
            <div className="mock-chrome">
              <div className="mock-dot mock-dot-r" />
              <div className="mock-dot mock-dot-y" />
              <div className="mock-dot mock-dot-g" />
              <span className="mock-url">app.oraculojf.com.br — Mais Vendidos</span>
            </div>
            <div className="mock-body">
              <div className="mock-side">
                <div className="mock-icon mock-icon-on">🏆</div>
                <div className="mock-icon">🆕</div>
                <div className="mock-icon">🔥</div>
                <div className="mock-icon">💊</div>
                <div className="mock-icon">🔍</div>
              </div>
              <div className="mock-panel">
                <div className="mock-tabs-bar">
                  <span className="mock-tab mock-tab-on">Mais Vendidos</span>
                  <span className="mock-tab">Em Alta</span>
                  <span className="mock-tab">Recém Add.</span>
                  <span className="mock-tab">Genéricos</span>
                  <span className="mock-tab">Rival</span>
                </div>
                <div className="mock-thead">
                  <span>PRODUTO</span><span>PREÇO</span><span>STATUS</span>
                  <span>AVALIAÇÃO</span><span>VARIAÇÃO</span>
                </div>
                {MOCK_ROWS.map((r, i) => (
                  <div className="mock-row" key={i}>
                    <span className="mock-prod">
                      <span className="mock-prod-bead" style={{background: r.c}} />
                      {r.name}
                    </span>
                    <span className="mock-price">{r.price}</span>
                    <span className={`mock-pill pill-${r.bdg}`}>{r.badge}</span>
                    <span className="mock-star">{r.rating}</span>
                    <span className="mock-up">{r.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mockup-glow" />
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="strip">
        <div className="strip-track">
          {[...STATS, ...STATS].map((s, i) => (
            <div className="strip-item" key={i}>
              <span className="strip-n">{s.n}</span>
              <span className="strip-l">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="sec" id="ferramentas">
        <div className="sec-in">
          <span className="sec-tag">// ferramentas</span>
          <h2 className="sec-h">TUDO QUE VOCÊ<br /><em>PRECISA PARA VENCER</em></h2>
          <p className="sec-p">8 ferramentas integradas para análise completa de mercado, produtos e concorrentes no Amazon FBA.</p>

          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <div className="feat-card" key={i}>
                <div className="feat-n">{f.n} //</div>
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-title">
                  {f.title}
                  {f.isNew && <span className="feat-new">NOVO</span>}
                </div>
                <p className="feat-desc">{f.desc}</p>
                <div className="feat-data">
                  {f.data.map((d, j) => (
                    <div className="feat-data-row" key={j}>
                      <span className="feat-data-key">{d.k}</span>
                      <span className={j === 0 ? 'feat-data-v1' : 'feat-data-v2'}>{d.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT ── */}
      <section className="sec spot-bg" id="destaque">
        <div className="sec-in">
          <span className="sec-tag">// exclusivos</span>
          <h2 className="sec-h">FERRAMENTAS QUE<br /><em>NINGUÉM MAIS TEM</em></h2>
          <div className="spot-grid">
            <div className="spot-card">
              <span className="spot-emoji">🔌</span>
              <div className="spot-label">Extensão Chrome</div>
              <div className="spot-title">ANÁLISE DENTRO DO AMAZON</div>
              <p className="spot-desc">
                Instale uma vez e veja dados de tendência, histórico de preço, BSR e oportunidade de mercado direto na página do produto — sem trocar de aba.
              </p>
              <div className="spot-pills">
                <span className="spot-pill spot-pill-on">Instalação 1 clique</span>
                <span className="spot-pill spot-pill-on">Dados em tempo real</span>
                <span className="spot-pill">Chrome &amp; Edge</span>
                <span className="spot-pill">Incluso no plano</span>
              </div>
            </div>
            <div className="spot-card">
              <span className="spot-emoji">🤖</span>
              <div className="spot-label">Agente IA — Novo</div>
              <div className="spot-title">INTELIGÊNCIA QUE PENSA POR VOCÊ</div>
              <p className="spot-desc">
                Agente de IA analisa milhares de produtos, detecta padrões de alta e entrega uma lista curada de oportunidades diárias — com o raciocínio por trás de cada sugestão.
              </p>
              <div className="spot-pills">
                <span className="spot-pill spot-pill-on">GPT-4o integrado</span>
                <span className="spot-pill spot-pill-on">Análises ilimitadas</span>
                <span className="spot-pill">Sugestão diária</span>
                <span className="spot-pill">Precisão 94%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="sec" id="como-funciona">
        <div className="sec-in">
          <span className="sec-tag">// como funciona</span>
          <h2 className="sec-h">DE ZERO A PRODUTO<br /><em>VENCEDOR EM 3 PASSOS</em></h2>
          <div className="how-steps">
            {[
              {n:'01', t:'Assine e Acesse',
               d:'Escolha seu plano, finalize o pagamento e receba o acesso por e-mail em minutos. Sem burocracia.'},
              {n:'02', t:'Explore os Dados',
               d:'Navegue pelas 8 ferramentas, filtre por categoria e encontre produtos com alto potencial de venda.'},
              {n:'03', t:'Decida com Confiança',
               d:'Use o simulador financeiro para validar a margem, a extensão para confirmar in-loco e compre sem risco.'},
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
          <h2 className="sec-h" style={{textAlign:'center'}}>
            ESCOLHA SEU<br /><em>PLANO DE ACESSO</em>
          </h2>
          <p className="sec-p" style={{margin:'0 auto'}}>
            Acesso completo a todas as ferramentas em qualquer plano. Sem limite de pesquisas.
          </p>

          <div className="price-grid">
            {/* MENSAL */}
            <div className="price-card">
              <div className="price-label">Mensal</div>
              <div className="price-amt">
                <span className="price-brl">R$</span>
                <span className="price-big">79</span>
              </div>
              <div className="price-period">,90 por mês</div>
              <div className="price-pmth">&nbsp;</div>
              <div className="price-div" />
              <ul className="price-list">
                <li>Acesso às 8 ferramentas</li>
                <li>Extensão Chrome incluída</li>
                <li>Agente IA ilimitado</li>
                <li>Simulador Financeiro</li>
                <li>Análise de concorrentes</li>
                <li>Renovação mensal flexível</li>
              </ul>
              <a href={LINKS.monthly} className="price-btn price-btn-line">Assinar Mensal</a>
            </div>

            {/* SEMESTRAL — FEATURED */}
            <div className="price-card price-card-hot">
              <div className="price-pop">MAIS POPULAR</div>
              <div className="price-label price-label-hot">Semestral</div>
              <div className="price-amt">
                <span className="price-brl price-brl-hot">R$</span>
                <span className="price-big price-big-hot">397</span>
              </div>
              <div className="price-period">por 6 meses</div>
              <div className="price-pmth">
                equivale a <em>R$66,17/mês · economize 17%</em>
              </div>
              <div className="price-div" />
              <ul className="price-list">
                <li>Tudo do plano Mensal</li>
                <li>6 meses de acesso contínuo</li>
                <li>Prioridade no suporte</li>
                <li>Atualizações garantidas</li>
                <li>Novas ferramentas inclusas</li>
                <li>Economia de R$81,40</li>
              </ul>
              <a href={LINKS.biannual} className="price-btn price-btn-fill">Assinar Semestral</a>
            </div>

            {/* ANUAL */}
            <div className="price-card">
              <div className="price-label">Anual</div>
              <div className="price-amt">
                <span className="price-brl">R$</span>
                <span className="price-big">597</span>
              </div>
              <div className="price-period">por ano</div>
              <div className="price-pmth">
                equivale a <span style={{color:'var(--green)'}}>R$49,75/mês · economize 38%</span>
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

          <p style={{marginTop:'22px',fontSize:'12px',color:'var(--mut)',fontFamily:'\'JetBrains Mono\',monospace',letterSpacing:'0.5px'}}>
            Pagamento seguro · Acesso imediato após confirmação · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sec faq-bg" id="faq">
        <div className="sec-in">
          <span className="sec-tag">// perguntas frequentes</span>
          <h2 className="sec-h">DÚVIDAS<br /><em>COMUNS</em></h2>
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
            PARE DE<br /><em>ADIVINHAR.</em><br />COMECE A VER.
          </h2>
          <p className="fcta-sub">
            Milhares de produtos analisados todo dia. Os melhores sellers já estão usando.
          </p>
          <a href={LINKS.biannual} className="cta-main" style={{fontSize:'16px',padding:'16px 44px'}}>
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
          <a href="#faq" className="footer-lnk">FAQ</a>
        </div>
      </footer>
    </>
  )
}
