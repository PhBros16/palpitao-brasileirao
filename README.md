<div align="center">

# 📖 Palpitão Brasileirão

### *O álbum de figurinhas do seu bolão do Brasileirão.*

**[▶ Acessar o app](https://palpitao-brasileirao-iota.vercel.app)**

</div>

---

## Sobre a capa

Todo mundo já teve (ou quis ter) aquele álbum de figurinhas de campeonato — capa de couro, cheiro de página nova, a ansiedade de completar a coleção. O **Palpitão Brasileirão** é isso, só que vivo: um bolão de palpites entre um grupo fechado de amigos, rodando as 38 rodadas da Série A inteira, com estatística de verdade, rivalidade de verdade, e a implicância de sempre saber quem é o frango da rodada.

Você não cria conta. Você entra no álbum, escolhe sua figurinha no gramado, e começa a jogar.

---

## De onde isso veio

Este projeto é a segunda geração de um produto que já existia e já funcionou: o **Palpitão Copa**, feito para a Copa do Mundo 2026. O Copa provou o conceito — as pessoas realmente competem, checam o ranking todo dia, e brigam pelo primeiro lugar. O Brasileirão herdou a lógica que já era boa (cálculo de pontos, ranking, desempate, estatística) e trocou o formato: de mata-mata de três semanas para uma temporada inteira de pontos corridos.

---

## O que dá pra fazer

### 🎬 Abertura
Antes de qualquer tela, tem uma sequência: a capa de couro do álbum abre, o campo é revelado sob os refletores do estádio, e a escalação do grupo aparece disposta taticamente no gramado — cada participante é a própria figurinha. Toca em si mesmo, digita o PIN, entra.

### ⚽ Palpites
Um card por jogo, escudo contra escudo, com contagem regressiva até o fechamento. Cada jogo trava sozinho no horário da bola rolar — e o admin também pode travar um jogo manualmente a qualquer momento, pra emergências (jogo remarcado, WO, o que for).

### 📊 Tabela do Brasileirão, ao vivo
Nada de tabela estática — ela é recalculada em tempo real a partir dos placares lançados, seguindo a regra oficial da CBF (vitória, empate, derrota, saldo de gols). O grupo acompanha o G6 e o Z4 exatamente como acompanharia no jornal.

### 🏆 Ranking, Projeção e Troféus
Pontuação, desempate por critério (cravadas → vencedor → saldo), e uma **projeção de título/rebaixamento** calculada a partir do seu aproveitamento atual projetado pras 38 rodadas. Fora isso, uma coleção de troféus em 4 níveis — do Bronze ao Diamante — desbloqueados conforme os feitos da temporada.

### 🐔 Frango da Rodada
Toda rodada tem um escolhido. O admin decide quem fez a palpitada mais vexatória, e o grupo já tem a tradição de fazer a montagem — o app só dá o palco.

### 🎵 Trilha própria
Um mini-player na Home, com playlist de faixas + o tema oficial do Palpitão, tocando em loop ou em sequência, sem parar quando você troca de aba.

### 📖 Guia embutido
Um acordeão que explica cada mecânica do app — pontuação, desempate, premiação, a matemática por trás de cada número que aparece na tela — e um atalho direto pro WhatsApp do grupo pra quem ficar com dúvida.

### 🛠 Painel Admin
Cadastro e edição de rodadas (inclusive as extras/remarcadas), lançamento e correção de resultados, rodadas em dobro, log de tudo que foi feito, gestão dos participantes e dos adms do grupo.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Animação | Framer Motion |
| Banco de dados | Supabase (PostgreSQL) |
| Deploy | Vercel |

Sem dependência de CDN de terceiro pra nada visual — escudos dos clubes vivem em `/public/escudos`, servidos junto com o resto do app.

---

## Estrutura do projeto

```
palpitao-brasileirao/
├── app/
│   └── (logado)/          # rotas por trás do login: início, palpites, ranking,
│                           # campeonato, rodada, histórico, guia, admin
├── components/
│   ├── abertura/           # capa, flip, cena do estádio, login no gramado
│   ├── home/                # seções da tela Início
│   ├── palpites/            # cards de jogo e formulário de palpite
│   ├── guia/                 # acordeão de regras e FAQ
│   └── admin/                # painel administrativo
├── lib/
│   ├── supabase.ts           # cliente do banco
│   ├── palpitesReais.ts     # busca de rodada ativa e palpites
│   ├── rodadaAdmin.ts        # CRUD de rodadas e resultados
│   ├── campeonatoReal.ts    # cálculo da tabela ao vivo
│   ├── rankingReal.ts        # ranking, desempate e projeção
│   ├── escudos.ts            # mapa nome do clube → escudo local
│   └── guiaData.ts           # conteúdo do Guia
└── public/
    └── escudos/               # escudos dos 20 clubes da Série A
```

---

## Rodando localmente

```bash
git clone https://github.com/PhBros16/palpitao-brasileirao.git
cd palpitao-brasileirao
npm install
```

Cria um `.env.local` na raiz com as credenciais do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

E sobe:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

---

## Banco de dados (Supabase)

| Tabela | O que guarda |
|---|---|
| `rounds` | Cada rodada — número, nome, se está aberta pra palpites, se já foi finalizada, se vale x2 |
| `matches` | Os jogos de cada rodada — mandante, visitante, data/hora, resultado, trava manual |
| `participants` | Quem joga o bolão |
| `predictions` | O palpite de cada participante em cada jogo, e a pontuação já calculada |
| `admins_profile` | Perfil dos administradores exibido no Guia |
| `admin_log` | Histórico de ações administrativas |
| `shame` | Registro do Frango de cada rodada |

---

<div align="center">

*Feito pra um grupo de 14 amigos que leva o bolão mais a sério do que deveria.*

</div>
