# Visual novo do painel ("ouro") — guia pra redesenhar uma tela

Contexto (05/10/2026): o painel do cliente está ganhando o visual do site oraculojf.com (obsidiana + ouro,
fontes Archivo / Instrument Sans / JetBrains Mono). **Está em validação: só o admin (João) vê**, ligando e
desligando num botão. Clientes continuam vendo a tela antiga — por isso TODO o visual novo fica atrás de um flag.

## Regras de ouro (não quebre)
1. **Nunca mude a lógica.** Estado, efeitos, fetch, cálculos, handlers, textos de regra/valores: iguais.
   Você só muda a APRESENTAÇÃO (JSX/estilo). Reuse os mesmos states e funções.
2. **Tudo atrás do flag.** No componente:
   `import { useVisualNovo } from './ouro/useVisualNovo'` (ajuste o caminho relativo) e
   `const novo = useVisualNovo()` junto dos outros hooks (sempre chamado, nunca dentro de if).
   Depois: `if (novo) return (<JSX novo>)` antes do `return` antigo, OU `{novo ? <novo/> : <antigo/>}` em blocos.
   Com `novo === false` a tela precisa renderizar **byte a byte igual** à de hoje.
3. Hooks: não crie hook dentro de condição. Componentes novos auxiliares podem ser funções no mesmo arquivo.
4. Não edite `globals.css` nem arquivos de outras telas. Estilo novo: **CSS Module próprio** da tela
   (ex.: `app/dashboard/MLMineracao.ouro.module.css` → `import o from './MLMineracao.ouro.module.css'`),
   ou estilo inline. Não use seletores globais.
5. Não rode `next build`, `next dev`, nem commite. Valide com:
   `cd ~/Documents/oraculo-web && npx tsc --noEmit -p . 2>&1 | grep -i <SeuArquivo>` (sem saída = ok).
6. Copy: português do Brasil, frases curtas, sem inventar números, promessas ou dados. Não troque textos que
   são regra/contrato (preços, créditos, limites). Pode melhorar títulos e subtítulos de apresentação.

## Peças prontas (app/dashboard/ouro/Ouro.tsx) — USE
- `<CabecalhoOuro grupo="Mercado Livre" titulo="Calculadora de" destaque="lucro" sub={<>texto com <strong>destaque</strong></>} acoes={...}/>`
  Cabeçalho padrão de TODA página: grupo (mono dourado), título grande Archivo com a palavra-chave em ouro, subtítulo, ações à direita.
- `<CartaoOuro titulo="O anúncio" passo={1} extra={...}>…</CartaoOuro>` — cartão com borda dourada fina (classe `ouro-cartao`).
- `<VazioOuro icone={IcOuro.lupa} titulo="…" texto="…" acao={...}/>` — tela vazia com medalhão dourado.
- `<BuscaOuro valor onValor onEnviar carregando placeholder botao="Analisar" mono?/>` — busca grande em pílula.
- `<RecursosOuro itens={[{icone, titulo, texto}]}/>` — faixa "o que você recebe".
- `IcOuro.{calc,lupa,rival,catalogo,salvo,link,caixa,moeda,caminhao,grafico,brilho,escudo,alvo,pdf}` — ícones de traço.
- Classes globais prontas: `ouro-pagina` (coluna centralizada max 1180, gap 22), `ouro-cartao`, `ouro-entrada`
  (input/select 48px), `ouro-campo` (label + input + small), `ouro-botao` (botão dourado pílula), `ouro-pilula`,
  `ouro-chips`/`ouro-chip`, `ouro-nota`, `ouro-erro`, `ouro-recursos`.

## Linguagem visual
- Fundo da página já é obsidiana com aura (não precisa pintar fundo). Cartões: `linear-gradient(180deg,rgba(22,21,15,.92),rgba(10,11,14,.92))`,
  borda `1px solid rgba(255,200,61,.14)`, raio 18–22px, sombra `0 30px 60px -36px rgba(0,0,0,.9)`.
- Cores: ouro `#FFC83D`, ouro claro `#FFE7A3`, texto `#F3EEE2` / `#B9B3A6` / `#7E796E`, verde `#3FD79B`, vermelho `#FF7A6E`,
  violeta `#B9A5FF`, azul `#6EA8E8`. Linhas `rgba(243,238,226,.08)`.
- Fontes: títulos e números grandes `var(--tg-display)` (Archivo, peso 800, `fontStretch:'108%'`, letterSpacing negativo);
  corpo herda (Instrument Sans); rótulos/kickers `var(--tg-mono)` maiúsculo com letterSpacing .16em.
- Números de destaque (KPIs, lucro, preço): grandes (24–40px), Archivo, `fontVariantNumeric:'tabular-nums'`.
- Espaço: respiro generoso, conteúdo usando a largura (nada de coluna estreita encostada à esquerda com 60% vazio).
  Grades responsivas (`repeat(auto-fill,minmax(…))`); no celular (≤760px) tudo empilha.
- Botão primário: `ouro-botao`. Secundário: pílula com borda `rgba(243,238,226,.12)`, fundo `rgba(255,255,255,.03)`.
- Abas/filtros: pílulas; a ativa em ouro (`linear-gradient(180deg,#FFE7A3,#FFC83D 50%,#EBA31A)`, texto `#1a1204`).
- Tela vazia sempre com `VazioOuro` (nada de texto cinza solto).
- Referência pronta pra copiar o estilo: `app/dashboard/MLCalculator.tsx` (bloco `if (novo)`) e `app/dashboard/MLRival.tsx`.
