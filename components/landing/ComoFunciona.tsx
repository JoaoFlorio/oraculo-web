'use client'

import Reveal from './Reveal'
import { Link2, ScanEye, Sparkles } from 'lucide-react'

const passos = [
  { n: '01', icon: <Link2 size={24} />, title: 'Conecte sua conta Amazon', desc: 'Login oficial da Amazon (SP-API). Você autoriza em 1 clique — sem entregar senha, e desconecta quando quiser.' },
  { n: '02', icon: <ScanEye size={24} />, title: 'O Oráculo lê seus dados reais', desc: 'Ele puxa vendas, taxas, FBA, ads e devoluções e monta sua DRE sozinho. Por data do pedido, ao centavo.' },
  { n: '03', icon: <Sparkles size={24} />, title: 'Você decide com clareza', desc: 'Lucro real, margem, ROI e melhores produtos numa tela. Pare de torcer — passe a saber.' },
]

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="ora-section">
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Reveal><span className="ora-eyebrow">A virada</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="ora-h2">Conecte. E o Oráculo<br /><span className="ora-goldtext">enxerga tudo por você.</span></h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="ora-lead" style={{ margin: '20px auto 0' }}>
            Do caos à clareza em três passos. Sem configuração, sem planilha, sem curva de aprendizado.
          </p>
        </Reveal>
      </div>

      <div style={{ position: 'relative' }}>
        {/* linha de conexão dourada (desktop) */}
        <div className="ora-step-line ora-steps-line" style={{
          position: 'absolute', top: 33, left: '16%', right: '16%', height: 2, zIndex: 0,
        }} />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28, position: 'relative', zIndex: 1,
        }}>
          {passos.map((p, i) => (
            <Reveal key={p.n} delay={0.1 + i * 0.12}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 66, height: 66, borderRadius: '50%', margin: '0 auto 20px', display: 'grid', placeItems: 'center',
                  color: 'var(--gold)', background: 'radial-gradient(circle at 50% 40%, rgba(240,194,98,0.16), rgba(8,8,18,0.9))',
                  border: '1px solid rgba(240,194,98,0.35)', boxShadow: '0 0 30px -6px rgba(240,194,98,0.4)',
                }}>{p.icon}</div>
                <div className="ora-mini ora-goldtext" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', marginBottom: 8 }}>{p.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>{p.title}</h3>
                <p style={{ color: 'var(--tx2)', fontSize: 14.5, lineHeight: 1.55, maxWidth: 300, margin: '0 auto' }}>{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
