import { supabase } from './supabase'

// Camada de dados da Aba Rodada (ao vivo).
//
// Busca:
//   - a rodada ATIVA (palpites_open=true), independente de finalized
//   - todos os jogos dessa rodada
//   - todos os palpites de todos os participantes (não-admin) nessa rodada
//   - horário do último palpite salvo por participante (`created_at` mais recente)
//
// Devolve tudo já organizado pra tela: matriz participante × jogo, ordenada
// pela pontuação parcial da rodada (líder em cima), com desempate por
// cravadas → vencedor → saldo.
//
// Diferente do Ranking, esta camada NÃO usa round_results (round_results só
// existe pra rodadas finalizadas). Aqui os pontos parciais vêm direto de
// predictions.points (calculados pelo admin em Resultado & Correção).

export interface JogoRodada {
  matchId: string
  home: string
  away: string
  homeAbrev: string        // "FLA" (3 letras)
  awayAbrev: string
  homeEscudo: string | null
  awayEscudo: string | null
  home_score: number | null
  away_score: number | null
  temResultado: boolean
}

export interface PalpiteCelula {
  matchId: string
  pred_h: number | null
  pred_a: number | null
  points: number | null
  categoria: 'cravou' | 'saldo' | 'vencedor' | 'errou' | 'aguardando' | 'np'
}

export interface LinhaRodadaAoVivo {
  participantId: string
  nome: string
  celulas: PalpiteCelula[]     // 1 por jogo, mesma ordem de jogos
  ptsRodada: number             // soma parcial
  cravadasParcial: number
  saldosParcial: number
  vencedoresParcial: number
  ultimoPalpiteEm: string | null  // ISO timestamp
  palpitouAlgo: boolean
}

export interface RodadaAoVivoDados {
  roundId: string
  nome: string
  numero: number
  isDouble: boolean
  jogos: JogoRodada[]
  linhas: LinhaRodadaAoVivo[]
}

// ─── Função principal ────────────────────────────────────────────────────────

export async function buscarRodadaAoVivo(): Promise<RodadaAoVivoDados | null> {
  // 1. Rodada ativa (palpites_open=true, se houver mais de uma, pega a maior)
  const { data: rodada } = await supabase
    .from('rounds')
    .select('id, number, name, is_double')
    .eq('palpites_open', true)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!rodada) return null

  // 2. Jogos da rodada
  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('id, home, away, home_score, away_score, match_date, match_time')
    .eq('round_id', rodada.id)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })

  const jogos: JogoRodada[] = (matchesRaw ?? []).map((m) => ({
    matchId: m.id,
    home: m.home,
    away: m.away,
    homeAbrev: abreviarTime(m.home),
    awayAbrev: abreviarTime(m.away),
    homeEscudo: caminhoEscudo(m.home),
    awayEscudo: caminhoEscudo(m.away),
    home_score: m.home_score,
    away_score: m.away_score,
    temResultado: m.home_score !== null && m.away_score !== null,
  }))

  // 3. Participantes (não-admins)
  const { data: participantes } = await supabase
    .from('participants')
    .select('id, name')
    .eq('is_admin', false)
    .order('name')

  if (!participantes || participantes.length === 0) {
    return { roundId: rodada.id, nome: rodada.name, numero: rodada.number, isDouble: rodada.is_double ?? false, jogos, linhas: [] }
  }

  // 4. Palpites de todos, nessa rodada
  const matchIds = jogos.map((j) => j.matchId)
  const { data: predsRaw } = matchIds.length > 0 ? await supabase
    .from('predictions')
    .select('participant_id, match_id, pred_h, pred_a, points, created_at')
    .in('match_id', matchIds) : { data: [] as any[] }

  // Indexa: participantId → matchId → predição
  const predByPartMatch = new Map<string, Map<string, { pred_h: number; pred_a: number; points: number | null; created_at: string }>>()
  const ultimoPorPart = new Map<string, string>()

  for (const p of predsRaw ?? []) {
    if (!predByPartMatch.has(p.participant_id)) predByPartMatch.set(p.participant_id, new Map())
    predByPartMatch.get(p.participant_id)!.set(p.match_id, p)

    // Guarda o created_at mais recente por participante
    const anterior = ultimoPorPart.get(p.participant_id)
    if (!anterior || p.created_at > anterior) {
      ultimoPorPart.set(p.participant_id, p.created_at)
    }
  }

  // 5. Monta linhas
  const linhas: LinhaRodadaAoVivo[] = participantes.map((part) => {
    const predsMap = predByPartMatch.get(part.id) ?? new Map()
    let ptsRodada = 0, cravadas = 0, saldos = 0, vencedores = 0
    let palpitouAlgo = false

    const celulas: PalpiteCelula[] = jogos.map((j) => {
      const pred = predsMap.get(j.matchId)
      if (!pred) {
        return {
          matchId: j.matchId,
          pred_h: null, pred_a: null, points: null,
          categoria: 'np' as const,
        }
      }
      palpitouAlgo = true

      // Se não tem resultado ainda, categoria = aguardando
      if (!j.temResultado) {
        return {
          matchId: j.matchId,
          pred_h: pred.pred_h, pred_a: pred.pred_a,
          points: null,
          categoria: 'aguardando' as const,
        }
      }

      // Classifica pela pontuação
      const pts = pred.points ?? 0
      ptsRodada += pts
      let categoria: PalpiteCelula['categoria']
      if (pred.pred_h === j.home_score && pred.pred_a === j.away_score) {
        categoria = 'cravou'
        cravadas++
      } else if (pred.pred_h - pred.pred_a === (j.home_score ?? 0) - (j.away_score ?? 0)) {
        categoria = 'saldo'
        saldos++
      } else {
        const pw = pred.pred_h > pred.pred_a ? 1 : pred.pred_h < pred.pred_a ? -1 : 0
        const rw = (j.home_score ?? 0) > (j.away_score ?? 0) ? 1 : (j.home_score ?? 0) < (j.away_score ?? 0) ? -1 : 0
        if (pw === rw) {
          categoria = 'vencedor'
          vencedores++
        } else {
          categoria = 'errou'
        }
      }

      return {
        matchId: j.matchId,
        pred_h: pred.pred_h,
        pred_a: pred.pred_a,
        points: pts,
        categoria,
      }
    })

    return {
      participantId: part.id,
      nome: part.name,
      celulas,
      ptsRodada,
      cravadasParcial: cravadas,
      saldosParcial: saldos,
      vencedoresParcial: vencedores,
      ultimoPalpiteEm: ultimoPorPart.get(part.id) ?? null,
      palpitouAlgo,
    }
  })

  // Ordena por pts desc → cravadas → vencedor → saldo → nome
  linhas.sort((a, b) =>
    b.ptsRodada - a.ptsRodada ||
    b.cravadasParcial - a.cravadasParcial ||
    b.vencedoresParcial - a.vencedoresParcial ||
    b.saldosParcial - a.saldosParcial ||
    a.nome.localeCompare(b.nome)
  )

  return {
    roundId: rodada.id,
    nome: rodada.name,
    numero: rodada.number,
    isDouble: rodada.is_double ?? false,
    jogos,
    linhas,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** "Flamengo" → "FLA". "Vasco da Gama" → "VAS". Casos específicos hardcoded. */
function abreviarTime(nome: string): string {
  const especiais: Record<string, string> = {
    'Athletico-PR': 'CAP',
    'Atlético-MG': 'CAM',
    'Bahia': 'BAH',
    'Botafogo': 'BOT',
    'Chapecoense': 'CHA',
    'Corinthians': 'COR',
    'Coritiba': 'CFC',
    'Cruzeiro': 'CRU',
    'Flamengo': 'FLA',
    'Fluminense': 'FLU',
    'Grêmio': 'GRE',
    'Internacional': 'INT',
    'Mirassol': 'MIR',
    'Palmeiras': 'PAL',
    'RB Bragantino': 'RBB',
    'Remo': 'REM',
    'Santos': 'SAN',
    'São Paulo': 'SAO',
    'Vasco da Gama': 'VAS',
    'Vitória': 'VIT',
  }
  return especiais[nome] ?? nome.slice(0, 3).toUpperCase()
}

/** Caminho do escudo em public/escudos. Se o arquivo não existir, o navegador
 *  vai retornar 404 silenciosamente e a UI mostra fallback (só iniciais). */
function caminhoEscudo(nome: string): string | null {
  const mapa: Record<string, string> = {
    'Athletico-PR': '/escudos/athletico-pr.png',
    'Atlético-MG': '/escudos/atletico-mg.png',
    'Bahia': '/escudos/bahia.png',
    'Botafogo': '/escudos/botafogo.png',
    'Chapecoense': '/escudos/chapecoense.png',
    'Corinthians': '/escudos/corinthians.png',
    'Coritiba': '/escudos/coritiba.png',
    'Cruzeiro': '/escudos/cruzeiro.png',
    'Flamengo': '/escudos/flamengo.png',
    'Fluminense': '/escudos/fluminense.png',
    'Grêmio': '/escudos/gremio.png',
    'Internacional': '/escudos/internacional.png',
    'Mirassol': '/escudos/mirassol.png',
    'Palmeiras': '/escudos/palmeiras.png',
    'RB Bragantino': '/escudos/rb-bragantino.png',
    'Remo': '/escudos/remo.png',
    'Santos': '/escudos/santos.png',
    'São Paulo': '/escudos/sao-paulo.png',
    'Vasco da Gama': '/escudos/vasco-da-gama.png',
    'Vitória': '/escudos/vitoria.png',
  }
  return mapa[nome] ?? null
}
