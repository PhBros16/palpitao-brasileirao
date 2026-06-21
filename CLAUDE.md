# CLAUDE.md — Palpitão Brasileirão

> Documento-guia para o desenvolvimento do **Palpitão Brasileirão**, a evolução do Palpitão Copa.
> Leia este arquivo inteiro antes de qualquer tarefa. Ele define a arquitetura, a filosofia de
> construção, a identidade visual e o plano de execução fase a fase.

---

## 1. O que é este projeto

O **Palpitão Brasileirão** é um app web de bolão para o Campeonato Brasileiro Série A, jogado por um
grupo fechado de ~14 amigos. Cada participante palpita o placar dos jogos de cada rodada, acumula
pontos, sobe no ranking, desbloqueia troféus e provoca os outros no chat ao longo de uma temporada
inteira (38 rodadas + jogos remarcados).

É a **segunda geração** de um produto que já existe e funcionou: o *Palpitão Copa* (Copa do Mundo
2026). O Copa validou o conceito — engajamento, rivalidade, estatística, troféus. O Brasileirão herda
a **alma** (a lógica de domínio testada) e ganha um **corpo novo** (arquitetura limpa, identidade
visual própria, formato de liga em vez de mata-mata).

### Princípio mestre: PRESERVA LÓGICA, RECONSTRÓI CASCA

O código do Copa é um único `app/page.tsx` com ~3.500 linhas: componentes, lógica de pontuação,
estado e estilo, tudo no mesmo arquivo. Funciona, mas trava qualquer redesenho.

A regra deste projeto:

- **PRESERVAR** — a lógica de domínio do Copa é boa e testada em produção. Extrair para módulos e
  adaptar: cálculo de pontos (`calcPoints`), troféus (`calcTrofeus`), ranking (`rankingData`),
  estatísticas (`calcPlayerStats`), comparativo frente a frente, sequências (`calcSequencia`),
  projeção de campeão (`calcProjecaoPct`).
- **RECONSTRUIR** — tudo que é casca: UI, estilo, estado, animações. Sair do inline-style + monolito
  para uma arquitetura modular, tipada e data-driven.

Nunca copiar o `page.tsx` do Copa inteiro para frente. Extrair a lógica, jogar fora a casca.

---

## 2. Stack

### Mantém do Copa
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** (PostgreSQL + Realtime) — banco de dados
- **Vercel** — deploy contínuo
- PWA (manifest + service worker)

### Adiciona / troca
- **Tailwind CSS + design tokens** — substitui o inline-style e o bloco `<style>` gigante. É o que
  torna o redesenho sustentável: identidade muda pelos tokens, não caçando `style={{}}`.
- **Radix UI / shadcn** — primitivos acessíveis (modais, selects, toggles) no lugar dos feitos à mão.
- **Framer Motion** — animações de UI (transições de aba, pódio, entradas de card).
- **React Three Fiber (R3F) + React Spring** — APENAS para a abertura cinematográfica e o login no
  gramado (ver Seção 5). É a peça mais técnica do projeto.
- **Zod** — schema e validação do shape do estado (remove os incontáveis `?? ''` defensivos do Copa).
- **Supabase Realtime** — substitui o polling de 30s (estado) e 5s (chat) do Copa.

### REMOVE do Copa (não reaproveitar)
- **OneSignal** — push falhou por limitação operacional da Apple no Copa. NÃO reintroduzir. Se push
  voltar à pauta, será via Web Push API nativa (service worker), e só na Fase 5, como item opcional.
- **API-Football** — também deu erro/limitação no Copa. Jogos entram via painel admin ou direto no
  Supabase. O grupo já cataloga os jogos manualmente, o que dá controle total e zero dependência.

---

## 3. A virada conceitual: MATA-MATA → LIGA

Esta é a diferença estrutural central entre Copa e Brasileirão.

| Aspecto | Copa (origem) | Brasileirão (destino) |
|---|---|---|
| Formato | Mata-mata, ~3 semanas | Liga, pontos corridos, temporada longa (38 rodadas) |
| Fases | grupos/oitavas/quartas/semi/final | rodadas sequenciais, sem fases eliminatórias |
| Multiplicadores | `PHASE_MULTIPLIERS` por fase | Mecânicas de liga (clássico vale mais, rodada decisiva) |
| Extras | "Quem Avança", "Pênaltis" | Substituir por extras de liga (artilheiro, clássico) |
| Tabela | Não existe tabela real | Tabela real do campeonato; "tabela prevista vs real" |
| Narrativa | Sprint curto | Temporada longa: G6, Z4, clássicos, viradas |

**Implicação importante:** quase todo mecanismo de engajamento profundo do Copa (troféus, evolução por
rodada, projeção de campeão, sequências, rivalidades) fica MAIS valioso numa temporada longa. Eles
foram construídos num formato curto demais para aproveitá-los. Agora encaixam de verdade.

### O que muda no motor de pontuação
- Remover `PHASE_MULTIPLIERS` e a lógica de fase eliminatória.
- Manter o esquema de regras configurável (`scoringPhases`) — só re-modelar as regras para liga.
- Remover extras "Quem Avança" / "Pênaltis". Avaliar extras de liga (placar de clássico, palpite de
  artilheiro da rodada). Marcar como ponto de decisão de produto, não implementar às cegas.

---

## 4. Identidade visual: ÁLBUM DE FIGURINHAS (retrô-colecionável)

Direção aprovada: **Almanaque / Figurinha**, na chave **mix atemporal** (vintage na alma, execução
limpa e moderna) e tom **equilibrado** (respeita a raiz, mas tem humor). O humor vive no copy e nas
micro-interações, não numa estética caricata.

Paleta-base: papel envelhecido, couro conhaque, verde-campo, dourado de almanaque, com acentos de cor
viva (verde/amarelo/azul). Toque de impressão vintage (meio-tom, leve registro fora, textura de papel).

### Peças de identidade já definidas (concept art aprovado)

1. **Capa do álbum** — couro conhaque, emblema tipográfico "PALPITÃO BRASILEIRÃO" (inteiro, sem
   quebra), selo "EDIÇÃO 2026", lombada costurada, textura realista. Botão "ABRIR O ÁLBUM".
   - A capa-mosaico de torcida foi REJEITADA (espalhafatosa). Direção é a capa de couro sóbria.

2. **Abertura cinematográfica** (sequência de 4 beats — ver Seção 5).

3. **Login no gramado** — campo de futebol em **orientação RETRATO (vertical, mobile-first)**, visto
   de cima, com a escalação tática dos participantes (titulares no campo, resto no banco do rodapé).
   Cada participante é tocável; tocar em si mesmo = entrar.

4. **Figurinha do jogador** — o átomo da identidade. Borda serrilhada (estilo figurinha), papel
   envelhecido, círculo central com FOTO do membro (ou iniciais como fallback), nome em tipografia
   condensada, vulgo, e 3 stats no rodapé (PTS / CRAVOU / POS).
   - **Foto:** auto-gerenciada. Depois de logado, o membro clica no próprio círculo → abre espaço para
     adicionar/trocar/ver a foto, com cropper para encaixar (arrastar/zoom) no círculo. Mesmo padrão
     do emoji/avatar que já existe no Copa.
   - **Raridade por posição:** top 1 = LENDÁRIA (dourada), top 6 (zona G6) = RARA, demais = COMUM,
     último = FRANGO (figurinha amassada/torta).
   - **Raridade só aparece DENTRO do álbum** (após login), nunca na tela de login.

5. **Frango da Rodada** (ex-"Pior Palpiteiro" do Copa) — o último colocado. O grupo já produz uma
   foto editada de resenha do frango (tradição do grupo). Conceito: uma caracterização que **só
   aparece para o próprio frango**, marcando a figurinha/interface dele durante a rodada seguinte, até
   o admin trocar quem é o frango. Castigo afetuoso e visível. A foto editada entra aqui.

6. **Sala de Troféus** — conceito de **prateleiras de madeira que empilham**: troféus em cima das
   tábuas, e novas prateleiras brotam de baixo para cima conforme a coleção cresce.
   - **Sem prateleira vazia** com "?" — exceto no estado inicial (membro com zero troféu). Depois que
     coleciona, a estante mostra só o que ele tem e cresce sob demanda. O progresso "X de 38" no topo
     já comunica que há mais a conquistar.
   - **Troféus desenhados (SVG), não emoji.** Cada conquista vira um objeto colecionável que MANTÉM a
     cor e o símbolo do conceito original (fogo=laranja, cérebro=rosa, etc.) mas ganha base, peanha,
     volume e sombra — cara de peça física na estante, não emoji solto.
   - **Plaquinhas de latão** cravadas/parafusadas nas tábuas com o nome de cada troféu gravado.
   - O desenho fino dos ~38 ícones é tarefa de design da fase de construção (iterar vendo de verdade).

### Sobre a música tema
- Autoplay no carregamento do app é BLOQUEADO por todos os navegadores (Chrome/Safari/iOS). Não é bug,
  é trava de plataforma. Não tentar burlar.
- Solução correta: a música começa no toque de "ABRIR O ÁLBUM" (o gesto que conta como interação do
  usuário e libera o áudio), sincronizada com a animação de abertura.

---

## 5. A abertura cinematográfica (R3F)

A peça mais técnica e mais importante (primeira impressão). Sequência de 4 beats, storyboard aprovado:

1. **Capa fechada** — couro, emblema, botão "ABRIR O ÁLBUM". App abre aqui. O toque dispara tudo +
   libera a música.
2. **A virada** — a capa gira como página de livro de gravuras, em perspectiva; o verde do gramado
   já espreita por trás.
3. **Os refletores ligam** — holofotes do estádio acendem em sequência ("clác... clác... clác"),
   feixes de luz revelando o campo escuro.
4. **O gramado + escalação** — campo VERTICAL (retrato) revelado, escalação tática montada, banco no
   rodapé. Participante toca em si mesmo e entra.

Construção: R3F (cena 3D, geometria da página virando, material de couro/grama, luz de refletor real)
+ React Spring (timing das transições). O storyboard estático é a referência de look; o movimento é
construído aqui.

**Nota de coerência:** o login no gramado é conceitualmente parecido com o `TacticalLoginScreen` do
Copa (mesma lógica de formação). A diferença DEVE vir inteira da execução: o Copa é CSS chapado (divs
com gradiente); o Brasileirão é R3F real (relevo de grama, luz, profundidade, retrato mobile). Se a
execução não for muito superior, o app vai parecer "a Copa de novo" — isso é inaceitável. O alvo é
outro planeta de acabamento.

---

## 6. Lógica de domínio a preservar (do Copa)

Extrair do `page.tsx` do Copa para módulos próprios, adaptando para liga. Estas funções são o "ouro"
testado em produção:

- `calcPoints` — cálculo de pontos de um palpite vs resultado. **Adaptar:** remover lógica de
  multiplicador de fase e extras de mata-mata.
- `calcTrofeus` — desbloqueio de conquistas (4 tiers). **Adaptar:** re-tematizar troféus de mata-mata
  (que citam "oitavas", "semi", etc.) para contexto de liga; manter a mecânica.
- `calcPlayerStats` — estatísticas pessoais (cravadas, vencedor, saldo, sequências, etc.).
- `rankingData` / `parcialData` — ranking geral e parcial da rodada, com desempate
  (cravadas → vencedor → saldo).
- `calcSequencia` — narrativa de sequência ("3 rodadas liderando", "em queda livre"). Ótimo para liga.
- `calcProjecaoPct` — projeção de campeão (%). **Adaptar** para contexto de pontos corridos.
- Heatmap de performance, comparativo frente a frente (rodada e histórico).

Tudo isso vai para `/lib/domain/` como funções puras, testáveis, sem dependência de UI.

---

## 6.5. Telas e funcionalidades do app (mapa real, dos prints)

Esta seção foi escrita observando o app Copa **rodando** (não só o código). O produto é mais rico do
que o `page.tsx` sugere. Cada tela abaixo precisa ser reconstruída na estética almanaque e adaptada
para liga. As abas atuais: **Início · Palpites · Chat · Rodada · Ranking · Histórico · Guia** (+ Admin).

### Início (home)
- **Card de destaque** com "NA RODADA / HOJE" (pontos) + faixa "JOGOS TOTAIS / JOGOS ABERTOS /
  CRAVEI QUANTOS" + countdown "Próximo fecha em Xmin". Tradução direta para almanaque.
- **Mini-player de música** (disco girando, prev/play/next, lista de faixas). JÁ EXISTE e funciona —
  é onde a "música tema no toque" se encaixa. Preservar o conceito, revestir na estética.
- **Avatar/figurinha pequena** ao lado do nome (auto-gerenciada) — confirma o padrão da figurinha.
- **Parcial** (ranking da rodada em andamento) + **Pior Palpiteiro/Frango** com foto editada +
  **"Por Placar"** (ver abaixo).

### "Por Placar" / "Distribuição de Palpites"
- Mostra, por jogo, quantos palpitaram cada placar (ex.: `2x1` 8x, `1x1` 4x, `1x2` 1x). É um dado de
  "sabedoria da multidão" muito bom. Mantém igual na liga. Reconstruir como chips de almanaque.

### Palpites
- Lista de cards de jogo (escudo casa × inputs de placar × escudo fora), com trava por horário,
  countdown, e badge "Travado". Escudos reais dos clubes (admin digita nome → escudo aparece).
- Banner cômico de "esqueceu de palpitar" (tom de humor do grupo). Preservar o espírito.
- Botão "Ver Resultados" quando há resultado lançado.

### Rodada → "TABELA DA RODADA" (PEÇA CRÍTICA)
- **A tela mais densa do app.** Grade de TODOS os participantes × TODOS os jogos da rodada. Cada
  célula mostra o palpite (ex.: `1x1`) com o pontinho de pontuação embaixo (0/1/3/5, colorido).
  Scroll horizontal. Toque num participante abre o "frente a frente" da rodada.
- **DESAFIO DE UX MOBILE:** essa densidade foi pensada para desktop. No celular, scroll horizontal de
  uma tabela gigante é sofrível. Esta tela exige REPENSAR a apresentação para mobile — não basta
  "reconstruir igual". Opções a considerar (decisão de produto): visão por jogo (em vez de por
  participante), cards empilhados, coluna fixa do participante com swipe, ou um modo "resumo + detalhe".
  TRATAR COMO ITEM DE DESIGN PRÓPRIO, não como porte direto.

### Ranking
- **Pódio** (top 3 com medalhas/figurinhas) + tabela com colunas Pontos / Cravadas / Vencedor / Saldo
  / **Projeção (%)**. A projeção é coluna viva (`calcProjecaoPct`), não enfeite.
- **"PONTOS POR RODADA"** — grade participante × rodada (R1, R2...) com total. Retrátil. No
  Brasileirão serão até 38 colunas: MESMO desafio de densidade mobile da Tabela da Rodada.
- **"EVOLUÇÃO POR RODADA"** — gráfico de linhas do top 5 acumulado. Retrátil.
- **"MINHAS ESTATÍSTICAS"** — cards (Rodadas/Cravadas/Vencedor/Saldo), heatmap "Performance por
  Rodada" (toque para detalhar), barras de % (placar exato / resultado / saldo), e a **Sala de
  Troféus** (retrátil, "X conquistado · Y bloqueado").
- Toque em qualquer participante → comparativo frente a frente (rodada e histórico, com janelas).

### Histórico
- Lista de rodadas finalizadas (permanentes), cada uma com tabela de pontuação e jogos retráteis.
  Adaptar rótulo de fase para "Rodada N" da liga.

### Chat
- Chat por rodada, bolhas, reações com emoji, scroll. Admin limpa. Migrar polling → Realtime.

### Guia (REESCREVER POR COMPLETO, não traduzir)
- Acordeão completo: "Conheça os Adms", Pontuação (como pontua / desempate), Ranking & Estatísticas
  (ranking, frente a frente, stats por rodada, avatar, conquistas), Regras do Palpite, Instalar no
  Celular, Notificações.
- **CONTÉM CONTEÚDO DE MATA-MATA A REMOVER:** há um item "O que são os extras (Quem Avança /
  Pênaltis)" — isso SAI na liga. Todo o Guia precisa ser reescrito para o contexto Brasileirão
  (pontos corridos, clássicos, G6/Z4, extras de liga se houver), não apenas traduzido.
- A seção de Notificações precisa ser revista, já que OneSignal saiu (ver Seção 2).

### Admin
- Configuração de rodada (nome, número, fase→virar "rodada", abertura de palpites, jogos com
  escudo/data/hora/trava), lançamento de resultado + correção (automática e manual por palpiteiro),
  esquema de pontuação configurável, Frango/Pior Palpiteiro (com foto editada), perfis dos Adms,
  compartilhar no WhatsApp (ranking/parcial), música padrão, novidades (pop-up), PINs por jogador,
  log de ações, reset, troca de senha.
- **Adaptar:** remover extras de mata-mata; o "compartilhar no WhatsApp" (`shareRanking`) é útil e
  substitui parcialmente a falta de push — preservar e melhorar.

---

## 7. Dados (Supabase)

### Estado atual
- O grupo já tem um projeto Supabase do Brasileirão com **18 rodadas + 2 rodadas extras** (jogos
  atrasados/remanejados) já catalogadas.
- O Copa usava um blob JSON único (`app_state`) + tabelas relacionais (`competidores`, `jogos`,
  `palpites`, `chat_messages`). Manter a ideia, mas modelar liga corretamente.

### Requisitos de modelagem
- **Jogadores/competidores data-driven** — vêm do Supabase, NUNCA hardcoded. (No Copa, `PLAYERS` e a
  `FORMATION` do login estavam cravados no código apesar de existir a tabela `competidores`. Corrigir.)
- **Clubes data-driven** — escudos reais. Admin digita o nome do clube → escudo aparece (via mapa de
  logos, igual ao Copa com seleções). As imagens dos escudos são baixadas no formato ideal e postas
  em `/public/escudos/`.
- **Jogos remarcados/atrasados** como cidadão de primeira classe — o modelo "rodada atual única +
  histórico" do Copa precisa de ajuste para tratar jogos fora da ordem natural da rodada.
- **Migração histórica:** carregar as 18 rodadas + 2 extras DEVE rodar antes/junto do primeiro cálculo
  de troféus, para que os membros entrem no lançamento já com a coleção que mereceram pelos dados
  reais. Ninguém começa zerado.
- **Timezone:** o Copa fazia matemática de UTC-3 na mão e usava datas `DD/MM` sem ano. Para uma
  temporada de meses, usar datas completas com ano e tratamento de timezone robusto.

### Segurança (corrigir do Copa)
- No Copa, `MASTER_PASS` estava no client e senhas trafegavam em texto puro no `app_state`, com
  checagem client-side. **Inaceitável no novo projeto.**
- Secrets só no servidor (env vars). Escrita de estado só por rota server-side autenticada.
- Habilitar **RLS** (Row Level Security) no Supabase.

---

## 8. Estrutura de pastas (alvo)

```
palpitao-brasileirao/
  app/
    layout.tsx
    page.tsx                  # orquestra telas; NÃO concentra lógica
    api/
      state/route.ts          # leitura/escrita do estado (server-side, autenticado)
      chat/route.ts           # mensagens (migrar para Realtime quando possível)
      admin/route.ts          # ações administrativas
    (telas)/                  # rotas/segmentos por tela, se fizer sentido
  components/
    abertura/                 # R3F: capa, virada, refletores, gramado
    figurinha/                # card do jogador + cropper de foto
    trofeus/                  # sala de troféus (prateleiras) + ícones SVG
    ranking/ palpites/ chat/ guia/ admin/
    ui/                       # primitivos shadcn/radix
  lib/
    domain/                   # LÓGICA PRESERVADA (funções puras, testáveis)
      pontuacao.ts trofeus.ts ranking.ts stats.ts sequencia.ts projecao.ts
    supabase/                 # cliente + queries + realtime
    schema/                   # schemas Zod do estado e entidades
  public/
    escudos/                  # escudos dos clubes (PNG, formato ideal)
    trofeus/                  # ícones SVG dos troféus
    musica/                   # música tema
  styles/
    tokens.css                # design tokens (cores, tipo, espaçamento)
  CLAUDE.md                   # este arquivo
```

---

## 9. Plano de execução (fases)

### Fase 0 — Fundação e decisões
- Cravar direção visual (FEITO: Álbum de Figurinhas) e postura (FEITO: preserva lógica, reconstrói casca).
- Mapear delta do schema (liga vs mata-mata) sobre o Supabase existente.
- Base do repo: secrets fora do client, Tailwind + tokens, estrutura de pastas, este CLAUDE.md.

### Fase 1 — Sistema de design e identidade
- Tokens, escala tipográfica, cores na estética almanaque.
- Telas-chave desenhadas (concept art FEITO: capa, abertura, login vertical, figurinha, troféus).

### Fase 2 — Refatoração do core
- Extrair lógica de domínio do `page.tsx` do Copa para `/lib/domain/` (funções puras).
- Adaptar motor de pontuação para liga (remover fases/extras de mata-mata).
- Jogadores e clubes data-driven do Supabase.
- Estado tipado com Zod + camada de dados com Realtime.

### Fase 3 — Reconstrução da UI
- Reconstruir telas sobre o design system, feature por feature (ver mapa completo na Seção 6.5).
- Migrar animações para Framer Motion; modais/selects para Radix/shadcn.
- **TABELA DA RODADA e PONTOS POR RODADA exigem repensar a densidade para mobile** (não portar a
  grade de scroll horizontal do Copa). São itens de design próprios — ver Seção 6.5. No Brasileirão,
  "Pontos por Rodada" chega a 38 colunas; a solução de desktop não escala para o celular.
- **Reescrever o Guia por completo** para o contexto de liga (Seção 6.5), removendo conteúdo de
  mata-mata (extras "Quem Avança / Pênaltis") e a seção de notificações herdada do OneSignal.
- **Construir a abertura cinematográfica em R3F** (capa → virada → refletores → gramado vertical).
  Esta é a primeira grande tarefa de R3F e usa o storyboard aprovado como referência.

### Fase 4 — Funcionalidades novas (elevar o nível)
- Tabela prevista vs. real.
- Projeção de campeão refeita para pontos corridos.
- Rivalidades/clássicos como mecânica nativa (Grenal, Choque-Rei, Derby, etc.).
- Apostas de artilheiro / extras de liga (se aprovados na decisão de produto).
- Frango da Rodada com a caracterização que só o frango vê.
- Set completo de ~38 ícones de troféu SVG (objetos colecionáveis com plaquinha de latão).

### Fase 5 — Segurança, dados e deploy
- RLS no Supabase; rota de escrita server-side autenticada.
- Migração das 18 rodadas + 2 extras (antes/junto do 1º cálculo de troféus).
- Correção de timezone (datas completas com ano).
- Polimento PWA, QA, lançamento.
- (Opcional) push via Web Push API nativa, SE necessário.

---

## 10. Glossário de cultura (copy e mecânicas)

Termos do grupo e do futebol brasileiro a usar no produto:

- **Frango** — gol bobo / o último colocado da rodada (ex-"Pior Palpiteiro").
- **Pintura** — golaço / palpite cravado improvável.
- **Cravada / Cravou** — acertar o placar exato.
- **Clássicos regionais** como rivalidades nativas: Grenal, Atletiba, Choque-Rei, Fla-Flu, Derby
  (Majestoso, etc.).
- **G6 / Z4** — zona de classificação / rebaixamento; mapear para a raridade da figurinha (G6 = rara).

---

## 11. Regras para o agente (Claude Code)

1. **Nunca** portar o `page.tsx` do Copa inteiro. Extrair lógica, reconstruir casca.
2. **Nunca** hardcodar jogadores ou clubes. Vêm do Supabase.
3. **Nunca** reintroduzir OneSignal ou API-Football.
4. **Nunca** colocar secret no client nem trafegar senha em texto puro.
5. Lógica de domínio = funções puras em `/lib/domain/`, sem dependência de UI.
6. Estilo via tokens/Tailwind, não inline-style.
7. R3F só na abertura/login. O resto da UI é React + Tailwind + Framer Motion.
8. Mobile-first sempre — o grupo usa no celular. O gramado de login é VERTICAL.
9. Ao adaptar lógica do Copa, sinalizar explicitamente o que era de mata-mata e virou liga.
10. Quando uma decisão de produto não estiver clara (ex.: quais extras de liga), PERGUNTAR antes de
    implementar às cegas.
11. Telas densas (Tabela da Rodada, Pontos por Rodada) NÃO são porte direto — repensar para mobile
    (Seção 6.5). Scroll horizontal de grade gigante no celular é inaceitável como solução final.
12. O Guia é REESCRITA, não tradução. Remover todo conteúdo de mata-mata e de OneSignal.
13. A Seção 6.5 é o mapa do produto REAL (observado rodando). Em caso de dúvida sobre o que uma tela
    faz, ela é a fonte — complementa o código do Copa, que mostra o "como", não o "porquê".

---

> **Versão do documento:** 2 (atualizado após observação do app Copa rodando — Seção 6.5 adicionada
> com o mapa real de telas, o desafio de densidade mobile da Tabela da Rodada, e a reescrita do Guia).
> Pontos deixados em aberto de propósito (decisão de produto): extras de liga (artilheiro? clássico
> vale mais?), apresentação mobile da Tabela da Rodada, e o desenho fino dos ~38 ícones de troféu.
