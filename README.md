# 🏆 Palpitão Copa 2026

> O bolão de Copa do Mundo mais completo que você já viu.

**[▶ Acessar o app](https://palpitao-copa-mundo.vercel.app)**

---

## O que é

O Palpitão Copa 2026 é um app web de bolão para a Copa do Mundo 2026, feito para grupos de amigos que querem dar um "tchan" a mais no entretenimento. Cada participante palpita no placar de cada jogo, acumula pontos, sobe no ranking e desbloqueia conquistas ao longo do campeonato, etc.

Tudo roda em tempo real, sem precisar criar conta — basta entrar com seu nome e começar a palpitar.

---

## Funcionalidades

- **Palpites por jogo** — placar exato, com prazo automático baseado no horário do jogo
- **Sistema de pontuação por fase** — grupos, oitavas, quartas, semi e final com multiplicadores configuráveis
- **Ranking em tempo real** — com desempate por cravadas → vencedor → saldo
- **Pódio animado** — top 3 da rodada atual e ranking geral
- **Estatísticas pessoais** — % de placar exato, resultado e saldo por rodada e geral
- **Heatmap de performance** — visualização por rodada com detalhamento ao clicar
- **38 conquistas** em 4 tiers de raridade, desbloqueadas automaticamente
- **Comparativo frente a frente** — seus palpites vs qualquer outro participante
- **Avatar personalizado** — cada participante escolhe seu emoji
- **Painel admin** — cria rodadas, lança resultados, gerencia jogadores e configurações
- **Notificações push** — avisa quando uma nova rodada abre
- **Escudos oficiais** — logos de todas as seleções participantes da Copa 2026
- **Dark mode** nativo

---

## Sistema de pontuação

| Acerto | Pontos base |
|--------|-------------|
| Placar exato (cravada) | 3 pts |
| Vencedor correto | 1 pt |
| Saldo de gols correto | 1 pt |

Multiplicadores aumentam os pontos nas fases eliminatórias (configurável pelo admin).

---

## Conquistas

38 troféus organizados em 4 tiers:

| Tier | Nome | Exemplos |
|------|------|---------|
| 🟢 | Qualquer um tem, até você | Veterano, Galinha, Dormiu no Ponto |
| 🔵 | Rapaz, esse aqui é bom | Hat-trick, Sangue Frio, Fênix |
| 🌟 | Levanta que essa é só sua! | Perfeição, Relâmpago, O Predador |
| 👑 | Parabéns, você é campeão do Palpitão Copa 2026 | CAMPEÃO! |

---

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Supabase** — banco de dados PostgreSQL em tempo real
- **Vercel** — deploy contínuo

## Banco de dados (Supabase)

4 tabelas principais:

| Tabela | Descrição |
|--------|-----------|
| `app_state` | Estado global da aplicação (rodada atual, configurações, histórico) |
| `competidores` | Participantes do bolão |
| `jogos` | Jogos cadastrados com times, horários e resultados |
| `palpites` | Palpites de cada competidor por jogo, com pontuação calculada |

---

## Rodando localmente

```bash
git clone https://github.com/PhBros16/palpitao-copa-2026.git
cd palpitao-copa-2026
npm install
cp .env.example .env.local  # configure suas credenciais Supabase
npm run dev
```

Acesse `http://localhost:3000`.

---

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Estrutura do projeto

```
app/
  api/
    chat/        # API de mensagens em tempo real
    cron/        # Jobs agendados (fechamento de palpites, etc.)
    import-games/# Importação de jogos
    notify/      # Notificações push
    state/       # Leitura/escrita do estado global
  layout.tsx
  page.tsx       # App principal
lib/
  supabase.ts    # Cliente Supabase
public/
  logos/         # Escudos de todas as seleções da Copa 2026
```

---

## Deploy

O projeto está configurado para deploy automático na Vercel a cada push na branch `main`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PhBros16/palpitao-copa-2026)

---

## Licença

MIT — use, modifique e distribua à vontade.

---

Feito com ⚽ por **Pedro Henrique** para a Copa do Mundo 2026.
