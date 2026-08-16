'use client'

// RodadaAoVivo — tabela ao vivo da rodada em andamento.
// Envolvido pelo AppLayout: sem <main>, sem bg próprio.

import { useEffect, useMemo, useState } from 'react'
import { buscarRodadaAoVivo, type RodadaAoVivoDados, type LinhaRodadaAoVivo, type PalpiteCelula, type JogoRodada } from '@/lib/rodadaAoVivo'
import { CardEnvelope } from '@/components/home/CardEnvelope'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

// ─── FRASES: Esqueceu de palpitar (aparece pra quem tem palpite pendente) ──
const ZOACOES_ESQUECEU = [
  'iii mané, esqueceu de palpitar foi?',
  'Vai palpitar ou vai deixar barato?',
  'Ó o zero chegando... palpita aí!',
  'Tá esperando o quê? Um convite formal?',
  'Falta palpite. Não vai chorar depois, hein.',
  'A rodada não espera, colega.',
  'Palpita, palpita, palpita! Ou vai ficar de fora?',
  'O relógio tá rodando, campeão.',
  'Sem palpite, sem pontos. Simples assim.',
  'Cadê os palpites que o pai mandou buscar?',
  'Tá com preguiça é? Palpita logo!',
  'Vai deixar o zero te comer vivo?',
  'A rodada tá rolando e você aí, parado.',
  'Vai palpitar ou vai chorar depois?',
  'Perdeu o horário do palpite, foi?',
  'Alô alô, terra chamando palpiteiro!',
  'Cê tá dormindo é?',
  'Ó, o cronômetro não perdoa.',
  'Sem palpite = frango certo.',
  'A galera já palpitou tudo, cadê você?',
  'Vai ficar no NP mesmo? Vergonhoso.',
  'Cadê a bola de cristal? Palpita!',
  'Tá esperando o jogo acabar pra palpitar?',
  'Palpite atrasado é palpite perdido.',
  'Você é o tipo que chega depois da festa.',
  'Palpita aí, seu preguiçoso.',
  'A hora é agora, não é depois.',
  'Vai palpitar? Ou vai fingir que esqueceu?',
  'Palpite pendente há tempos... resolve isso.',
  'A rodada não vai esperar você, sabia?',
]

// ─── FRASES: Pior da rodada (aparece pra todos, cita nome do pior) ──────────
const ZOACOES_PIOR = [
  '{nome} tá pior que zagueiro central improvisado.',
  '{nome} tá tão perdido que nem o Waze acha.',
  'Alguém avisa o {nome} que a rodada começou?',
  '{nome} tá dando aula de como não palpitar.',
  '{nome} palpitou, mas o palpite fugiu correndo.',
  '{nome} tá tão mal que o frango já chegou.',
  'Se palpite fosse gol, {nome} tava rebaixado.',
  '{nome} tá igual Athletico em final: só perde.',
  '{nome} palpitou de olho fechado, com certeza.',
  '{nome} devia contratar um consultor de palpites.',
  '{nome} tá tão ruim que até o adm ficou com pena.',
  'Nem no chute {nome} acerta uma.',
  '{nome} palpitou tão errado que dá dó.',
  'Se o {nome} fosse goleiro, o Brasil tinha perdido de 20.',
  '{nome} palpita igual quem escolhe roupa no escuro.',
  '{nome} tá jogando na segunda divisão dos palpiteiros.',
  '{nome} tá pior que time da várzea na chuva.',
  '{nome} palpita tão mal que até o Google errou menos.',
  '{nome} devia jogar o palpite no lixo antes de salvar.',
  '{nome} tá zoando ou palpitou de verdade?',
  '{nome} palpita pior que criança escolhendo lanche.',
  'Nem um cego chutando erraria tanto quanto o {nome}.',
  '{nome} tá igual bandeirinha do Brasileirão: sempre errando.',
  '{nome} palpita e o Universo conspira contra.',
  '{nome} tá pontuando menos que peladeiro no fim de semana.',
  '{nome} tá tão mal que nem meu avô erraria assim.',
  '{nome} tá jogando pra perder, é a única explicação.',
  '{nome} palpita igual quem nunca viu futebol na vida.',
  '{nome} pontuou menos que a soma dos meus IQs.',
  'Alô {nome}, aqui é a realidade te chamando.',
  '{nome} palpita tão mal que dá vontade de rir e chorar junto.',
  '{nome} tá jogando o campeonato de quem perde mais.',
  '{nome} palpitou pensando em outra coisa, com certeza.',
  '{nome} devia rezar antes de salvar palpite.',
  'Nem meu cachorro erraria tanto quanto o {nome}.',
  'Se palpite fosse comida, {nome} tava passando fome.',
  'Coitado do {nome}, tá sofrendo em silêncio.',
  'A pontuação do {nome} é obra de arte moderna: ninguém entende.',
  '{nome} palpita e a esperança morre junto.',
  '{nome} tá dando mole pros outros pontuarem sem esforço.',
]

// ─── FRASES: Cravou (aparece pra quem NÃO cravou aquele jogo) ───────────────
const ZOACOES_CRAVOU = [
  '{nome} cravou {jogo}! E você aí, dormindo?',
  'Rapaz, o {nome} regaçou em {jogo}! Cadê você?',
  '{nome} cravou {jogo}. Sorte ou raça?',
  'O {nome} mandou bem em {jogo}! Fica de olho.',
  '{nome} cravou {jogo} e você tá lá no meio da tabela.',
  'ALERTA: {nome} cravou {jogo}. Corre atrás!',
  '{nome} arrasou em {jogo}! E aí, campeão?',
  'Enquanto você errava, {nome} cravava {jogo}.',
  '{nome} cravou {jogo} de olho fechado. E você?',
  '{nome} chapou o placar de {jogo}! Bora reagir.',
  '{nome} mandou ver em {jogo}. Tá comendo poeira?',
  'Rapaz, o {nome} tá on fire! Cravou {jogo}!',
  '{nome} bateu o martelo em {jogo}. E você?',
  '{nome} cravou {jogo} enquanto você pensava no almoço.',
  'O que o {nome} tem que você não tem? Cravou {jogo}!',
  '{nome} cravou {jogo}. Vai deixar barato?',
  'Enquanto uns choravam, {nome} cravava {jogo}.',
  '{nome} cravou {jogo}. E aí, vai fazer o quê?',
  'ALERTA ALERTA: {nome} cravou {jogo}. Não fica pra trás!',
  '{nome} tá regaçando! Cravou {jogo}.',
]

// ─── FRASES: Empate técnico (top 3 apertado, pra quem tá no top) ────────────
const ZOACOES_EMPATE = [
  'Rodada apertada, hein! Top 3 tá cabeça a cabeça.',
  'Ninguém quer decidir essa rodada, é lero-lero.',
  'Que rodada equilibrada, meu Deus. Ninguém arrisca!',
  'Todo mundo com medo de errar, é isso?',
  'Top 3 quase igualzinho, tá tenso!',
  'Rodada de "quem pisca perde". Bora acordar!',
  'Vai ter que suar pra levar essa, hein.',
  'Diferença zero, todo mundo tremendo!',
  'Que rodada indecisa. Alguém precisa dominar!',
  'Nem líder da rodada tá se destacando, coisa feia.',
  'Empate no topo? Só falta pedir prorrogação.',
  'Top 3 tá tão igual que parece xerox.',
]

// ─── FRASES: Líder do campeonato mal na rodada (pra todos) ──────────────────
const ZOACOES_LIDER_MAL = [
  'RAPAZZZ o {nome} tá peidando essa rodada! Que vergonha.',
  'ALERTA: {nome}, líder do campeonato, tá levando um pau hoje!',
  'O rei tropeça! {nome} tá bem mal essa rodada.',
  'Cadê o {nome} nessa rodada? Sumiu, sumiu.',
  'O líder {nome} tá dando mole. É agora que o povo passa!',
  'Rapaz, o {nome} escolheu a pior rodada pra pisar na bola.',
  '{nome} tá dormindo no ponto! O líder virou lanterna.',
  'O {nome} devia dar aula, mas hoje tá levando aula.',
  'ALERTA ALERTA: o líder {nome} tá em queda livre hoje!',
  'Que rodada horrível pro {nome}. Chorem, súditos... digo, sofram!',
  'O {nome} tropeçou feio nessa rodada. É a vez de ultrapassar!',
  'Líder na tabela, lanterna na rodada. Que fase, {nome}!',
  'Cadê o {nome}? Tá desaparecido nessa rodada, coitado.',
  '{nome} escorregou feio, galera. Aproveita e passa!',
]

// ─── FRASES: Líder da rodada com vantagem (pra todos exceto ele) ────────────
const ZOACOES_VOANDO = [
  'RAPAZZZ o {nome} tá regaçando vocês!',
  'ALERTA: {nome} tá voando! Corram atrás, otários!',
  '{nome} tá dando um show nessa rodada. Vergonha alheia!',
  'Rapaz, o {nome} não tá pra brincadeira hoje!',
  '{nome} tá comendo essa rodada no café da manhã!',
  'Alô galera, o {nome} tá regaçando geral. Vão fazer algo!',
  'ALERTA ALERTA O {nome} TA PEIDANDO GERAL!',
  '{nome} tá tão na frente que já pode tomar café.',
  'O {nome} tá jogando outro jogo, é impressão minha?',
  'Rapaz, o {nome} tá numa dimensão paralela. Correm atrás!',
  '{nome} tá dando aula. Anotem tudo, otários!',
  'O {nome} tá tão à frente que já vou parabenizando.',
  'ALERTA: {nome} tá impossível de alcançar hoje!',
  '{nome} tá voando alto! Vão comer poeira, ó.',
]

// ─── Helpers de sorteio de frases ───────────────────────────────────────────

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function corCelula(cat: PalpiteCelula['categoria']): string {
  switch (cat) {
    case 'cravou': return 'bg-green-600 text-white'
    case 'saldo': return 'bg-blue-500 text-white'
    case 'vencedor': return 'bg-yellow-400 text-tinta-300'
    case 'errou': return 'bg-red-500 text-white'
    case 'aguardando': return 'bg-papel-borda-300 text-tinta-200'
    case 'np': return 'bg-papel-100 text-tinta-100'
  }
}

function corPts(pts: number | null): string {
  if (pts === null) return 'bg-papel-100 text-tinta-100'
  if (pts >= 20) return 'bg-green-100 text-green-800'
  if (pts >= 15) return 'bg-blue-100 text-blue-800'
  if (pts >= 10) return 'bg-yellow-100 text-yellow-800'
  if (pts >= 5) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

function CabecalhoJogo({ jogo }: { jogo: JogoRodada }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <div className="flex items-center gap-0.5">
        <span className="font-mono text-[9px] font-bold text-dourado-50">{jogo.homeAbrev}</span>
      </div>
      <span className="font-mono text-[7px] text-dourado-50/60">×</span>
      <div className="flex items-center gap-0.5">
        <span className="font-mono text-[9px] font-bold text-dourado-50">{jogo.awayAbrev}</span>
      </div>
      {jogo.temResultado && (
        <span className="mt-0.5 rounded bg-dourado-100 px-1 py-0.5 font-mono text-[9px] font-bold text-dourado-700">
          {jogo.home_score}×{jogo.away_score}
        </span>
      )}
    </div>
  )
}

function CelulaPalpite({ celula }: { celula: PalpiteCelula }) {
  if (celula.categoria === 'np') {
    return (
      <div className="flex h-10 items-center justify-center rounded bg-papel-100 px-1 text-center font-mono text-[10px] italic text-tinta-100">
        NP
      </div>
    )
  }
  return (
    <div className={cx('flex h-10 flex-col items-center justify-center rounded px-1 text-center', corCelula(celula.categoria))}>
      <span className="font-mono text-[11px] font-bold leading-tight">
        {celula.pred_h}×{celula.pred_a}
      </span>
      {celula.points !== null && celula.categoria !== 'aguardando' && (
        <span className="font-mono text-[8px] font-bold leading-none opacity-90">
          +{celula.points}
        </span>
      )}
    </div>
  )
}

function FrenteFrenteRodadaModal({
  jogadorA,
  jogadorB,
  jogos,
  onFechar,
}: {
  jogadorA: LinhaRodadaAoVivo
  jogadorB: LinhaRodadaAoVivo
  jogos: JogoRodada[]
  onFechar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border-2 border-dourado-400 bg-papel-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-dourado-300 bg-gradient-to-r from-dourado-100 to-dourado-50 px-4 py-3">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-dourado-800">
            🥊 Frente a Frente — Rodada
          </p>
          <button type="button" onClick={onFechar} className="font-mono text-xs text-dourado-700 hover:text-dourado-900">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 items-center gap-2 border-b border-papel-borda-200 bg-papel-100 px-4 py-3">
          <div className="text-center">
            <p className="truncate font-display text-sm font-bold text-tinta-300">{jogadorA.nome}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-dourado-700">{jogadorA.ptsRodada}</p>
            <p className="font-mono text-[9px] uppercase text-tinta-100">pts rodada</p>
          </div>
          <div className="text-center font-mono text-xs uppercase tracking-widest text-tinta-100">vs</div>
          <div className="text-center">
            <p className="truncate font-display text-sm font-bold text-tinta-300">{jogadorB.nome}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-dourado-700">{jogadorB.ptsRodada}</p>
            <p className="font-mono text-[9px] uppercase text-tinta-100">pts rodada</p>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {jogos.map((j, i) => {
            const cA = jogadorA.celulas[i]
            const cB = jogadorB.celulas[i]
            return (
              <div key={j.matchId} className="border-b border-papel-borda-200 px-4 py-2.5 last:border-0">
                <div className="mb-1.5 text-center font-sans text-xs font-semibold text-tinta-300">
                  {j.home} × {j.away}
                  {j.temResultado && (
                    <span className="ml-2 font-mono font-bold text-dourado-600">
                      ({j.home_score}×{j.away_score})
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className={cx('flex flex-col items-center justify-center rounded px-1 py-1', corCelula(cA.categoria))}>
                    <span className="font-mono text-xs font-bold">
                      {cA.pred_h !== null ? `${cA.pred_h}×${cA.pred_a}` : '—'}
                    </span>
                    {cA.points !== null && cA.categoria !== 'aguardando' && (
                      <span className="font-mono text-[9px] font-bold opacity-90">+{cA.points}</span>
                    )}
                  </div>
                  <div className="text-center font-mono text-[10px] text-tinta-100">vs</div>
                  <div className={cx('flex flex-col items-center justify-center rounded px-1 py-1', corCelula(cB.categoria))}>
                    <span className="font-mono text-xs font-bold">
                      {cB.pred_h !== null ? `${cB.pred_h}×${cB.pred_a}` : '—'}
                    </span>
                    {cB.points !== null && cB.categoria !== 'aguardando' && (
                      <span className="font-mono text-[9px] font-bold opacity-90">+{cB.points}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tipos internos pra alerts ──────────────────────────────────────────────

type AlertaCategoria = 'esqueceu' | 'pior' | 'cravou' | 'empate' | 'liderMal' | 'voando'

interface Alerta {
  cat: AlertaCategoria
  titulo: string
  frase: string
  subtitulo: string
}

export function RodadaAoVivo() {
  const [dados, setDados] = useState<RodadaAoVivoDados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [meuId, setMeuId] = useState<string | null>(null)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)
  const [frenteFrente, setFrenteFrente] = useState<{ a: LinhaRodadaAoVivo; b: LinhaRodadaAoVivo } | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) {
        const sessao = JSON.parse(raw) as { id: string; nome: string }
        setMeuId(sessao.id)
      }
    } catch { /* ignora */ }

    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    setErro(null)
    try {
      const r = await buscarRodadaAoVivo()
      setDados(r)
      setUltimaAtualizacao(new Date())
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  async function atualizar() {
    setAtualizando(true)
    try {
      const r = await buscarRodadaAoVivo()
      setDados(r)
      setUltimaAtualizacao(new Date())
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setAtualizando(false)
    }
  }

  // Gera todos os alertas aplicáveis e escolhe até 2 pra mostrar
  const alertas = useMemo<Alerta[]>(() => {
    if (!dados || !meuId) return []

    const resultado: Alerta[] = []
    const minhaLinha = dados.linhas.find((l) => l.participantId === meuId)
    const temResultado = dados.jogos.some((j) => j.temResultado)

    // ─── 1. ESQUECEU (pra quem tem palpite pendente em jogo aberto) ────
    if (minhaLinha) {
      const esqueceu = minhaLinha.celulas.some((c, i) => {
        const jogo = dados.jogos[i]
        return !jogo.temResultado && c.categoria === 'np'
      })
      if (esqueceu) {
        resultado.push({
          cat: 'esqueceu',
          titulo: '🚨 Palpites em aberto',
          frase: random(ZOACOES_ESQUECEU),
          subtitulo: 'Vai lá na aba Palpites resolver isso.',
        })
      }
    }

    // Alertas abaixo precisam de rodada com resultado
    if (!temResultado) {
      return resultado
    }

    const linhasComPalpite = dados.linhas.filter((l) => l.palpitouAlgo)
    const linhasOrdenadas = [...linhasComPalpite].sort((a, b) =>
      b.ptsRodada - a.ptsRodada || a.nome.localeCompare(b.nome)
    )

    // ─── 2. VOANDO (líder da rodada com ≥ 8 pts de vantagem pro 2º) ────
    if (linhasOrdenadas.length >= 2) {
      const lider = linhasOrdenadas[0]
      const segundo = linhasOrdenadas[1]
      const diff = lider.ptsRodada - segundo.ptsRodada
      // Aparece pra todos EXCETO o próprio líder
      if (diff >= 8 && lider.participantId !== meuId) {
        resultado.push({
          cat: 'voando',
          titulo: '🚀 Alguém tá voando',
          frase: random(ZOACOES_VOANDO).replace('{nome}', lider.nome),
          subtitulo: `Vantagem de ${diff} pts pro 2º colocado.`,
        })
      }
    }

    // ─── 3. LÍDER DO CAMPEONATO MAL NA RODADA ──────────────────────────
    // Pega líder do campeonato entre quem tem totalGeral > 0
    const linhasComTotal = [...dados.linhas].filter((l) => l.totalGeral > 0)
    if (linhasComTotal.length > 0) {
      linhasComTotal.sort((a, b) => b.totalGeral - a.totalGeral)
      const liderCamp = linhasComTotal[0]
      // Posição do líder do campeonato na rodada
      const posLiderCamp = linhasOrdenadas.findIndex((l) => l.participantId === liderCamp.participantId)
      // Só aplica se o líder do campeonato palpitou nessa rodada
      const liderPalpitou = liderCamp.palpitouAlgo
      // "Mal na rodada": não está no top 3 OU tá 8+ pts atrás do líder da rodada
      const foraDoTop3 = posLiderCamp >= 3
      const muitoAtrasDoLider = linhasOrdenadas.length > 0 &&
        (linhasOrdenadas[0].ptsRodada - liderCamp.ptsRodada) >= 8
      if (liderPalpitou && (foraDoTop3 || muitoAtrasDoLider)) {
        resultado.push({
          cat: 'liderMal',
          titulo: '👑 Líder tropeçou',
          frase: random(ZOACOES_LIDER_MAL).replace('{nome}', liderCamp.nome),
          subtitulo: `Líder do campeonato tá bem mal essa rodada.`,
        })
      }
    }

    // ─── 4. EMPATE TÉCNICO (top 3 apertado, pra quem tá no top 3) ──────
    if (linhasOrdenadas.length >= 3) {
      const [p1, , p3] = linhasOrdenadas
      const diffTop = p1.ptsRodada - p3.ptsRodada
      const usuarioNoTop3 = linhasOrdenadas.slice(0, 3).some((l) => l.participantId === meuId)
      if (diffTop <= 2 && usuarioNoTop3) {
        resultado.push({
          cat: 'empate',
          titulo: '⚖️ Rodada apertada',
          frase: random(ZOACOES_EMPATE),
          subtitulo: `Top 3 com diferença de só ${diffTop} pt${diffTop === 1 ? '' : 's'}.`,
        })
      }
    }

    // ─── 5. CRAVOU (aparece pra quem NÃO cravou aquele jogo) ───────────
    // Escolhe aleatoriamente 1 jogo que teve cravadas
    const jogosComCravadas: Array<{ jogo: JogoRodada; jogoIdx: number; cravadores: LinhaRodadaAoVivo[] }> = []
    dados.jogos.forEach((jogo, jogoIdx) => {
      if (!jogo.temResultado) return
      const cravadores = dados.linhas.filter((l) => {
        const cel = l.celulas[jogoIdx]
        return cel.categoria === 'cravou'
      })
      if (cravadores.length > 0) {
        jogosComCravadas.push({ jogo, jogoIdx, cravadores })
      }
    })

    if (jogosComCravadas.length > 0) {
      // Sorteia 1 jogo entre os que tiveram cravadas
      const escolhido = random(jogosComCravadas)
      // Só mostra pra quem não cravou esse jogo
      const usuarioCravouEsse = escolhido.cravadores.some((l) => l.participantId === meuId)
      if (!usuarioCravouEsse) {
        const cravador = random(escolhido.cravadores)
        const jogoStr = `${escolhido.jogo.homeAbrev}×${escolhido.jogo.awayAbrev}`
        resultado.push({
          cat: 'cravou',
          titulo: '🎯 Alguém cravou',
          frase: random(ZOACOES_CRAVOU)
            .replace('{nome}', cravador.nome)
            .replace('{jogo}', jogoStr),
          subtitulo: `${escolhido.jogo.home} ${escolhido.jogo.home_score}×${escolhido.jogo.away_score} ${escolhido.jogo.away}`,
        })
      }
    }

    // ─── 6. PIOR DA RODADA (pra todos, cita nome do pior) ──────────────
    // Já garantiu que tem resultado
    if (linhasComPalpite.length >= 2) {
      const ordCrescente = [...linhasComPalpite].sort((a, b) =>
        a.ptsRodada - b.ptsRodada || a.nome.localeCompare(b.nome)
      )
      const pior = ordCrescente[0]
      const lider = ordCrescente[ordCrescente.length - 1]
      // Só zoa se diferença for ≥ 5 pts (evita rodada apertada)
      // E não zoa o próprio usuário
      if (lider.ptsRodada - pior.ptsRodada >= 5 && pior.participantId !== meuId) {
        resultado.push({
          cat: 'pior',
          titulo: '🐔 Pior da rodada',
          frase: random(ZOACOES_PIOR).replace('{nome}', pior.nome),
          subtitulo: 'Cuidado que o frango tá chegando... 👀',
        })
      }
    }

    return resultado
  }, [dados, meuId])

  // Escolhe até 2 pra mostrar. Prioridade:
  // 1. "esqueceu" (sempre, se aplicável — informação crítica pro usuário)
  // 2. 1 outro aleatório entre os restantes
  const alertasParaMostrar = useMemo<Alerta[]>(() => {
    const esqueceu = alertas.find((a) => a.cat === 'esqueceu')
    const outros = alertas.filter((a) => a.cat !== 'esqueceu')
    const escolhidos: Alerta[] = []
    if (esqueceu) escolhidos.push(esqueceu)
    if (outros.length > 0) {
      // Sorteia 1 aleatório entre os outros
      escolhidos.push(random(outros))
    }
    return escolhidos.slice(0, 2)
  }, [alertas])

  function abrirFrenteFrente(linha: LinhaRodadaAoVivo) {
    if (!dados) return
    let minhaLinha = dados.linhas.find((l) => l.participantId === meuId)
    if (!minhaLinha || minhaLinha.participantId === linha.participantId) {
      minhaLinha = dados.linhas[0]
    }
    if (!minhaLinha || minhaLinha.participantId === linha.participantId) return
    setFrenteFrente({ a: minhaLinha, b: linha })
  }

  if (carregando) {
    return (
      <CardEnvelope>
        <p className="p-6 text-center font-sans text-sm text-tinta-100">Carregando rodada...</p>
      </CardEnvelope>
    )
  }
  if (erro) {
    return (
      <CardEnvelope variante="alerta" titulo="Erro">
        <p className="p-6 text-center font-sans text-sm text-raridade-frango-selo">{erro}</p>
      </CardEnvelope>
    )
  }
  if (!dados) {
    return (
      <CardEnvelope titulo="😴 Sem rodada">
        <div className="p-6 text-center">
          <p className="font-display text-lg font-bold text-tinta-300">Sem rodada em andamento</p>
          <p className="mt-2 font-sans text-sm text-tinta-200">
            Aguarde o admin abrir a próxima rodada ou consulte o Histórico.
          </p>
        </div>
      </CardEnvelope>
    )
  }

  return (
    <>
      <CardEnvelope
        titulo={`📊 ${dados.nome}`}
        subtitulo={ultimaAtualizacao
          ? `Atualizado às ${ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
          : undefined}
        tags={[
          ...(dados.isDouble ? [{ label: '⚡ VALE X2', variante: 'dourado' as const }] : []),
        ]}
        acao={
          <button
            type="button"
            onClick={atualizar}
            disabled={atualizando}
            className="flex items-center gap-1 rounded border border-dourado-50/40 bg-dourado-50/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-dourado-50 transition-colors hover:bg-dourado-50/25 disabled:opacity-50"
          >
            {atualizando ? '...' : '↻'} Atualizar
          </button>
        }
      >
        {null}
      </CardEnvelope>

      {/* Cards de alerta rotativos (até 2 por vez) */}
      {alertasParaMostrar.map((alerta) => (
        <CardEnvelope
          key={alerta.cat}
          variante="alerta"
          titulo={alerta.titulo}
        >
          <div className="px-4 py-3">
            <p className="font-sans text-sm font-semibold text-raridade-frango-selo">
              {alerta.frase}
            </p>
            <p className="mt-1 font-sans text-xs text-tinta-200">
              {alerta.subtitulo}
            </p>
          </div>
        </CardEnvelope>
      ))}

      <CardEnvelope>
        <div className="overflow-x-auto scrollbar-tema">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 border-b-2 border-dourado-400 bg-couro-300 px-2 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-dourado-50">
                  Participante
                </th>
                {dados.jogos.map((j) => (
                  <th key={j.matchId} className="min-w-[64px] border-b-2 border-dourado-400 bg-couro-300 px-1 py-1 text-center">
                    <CabecalhoJogo jogo={j} />
                  </th>
                ))}
                <th className="border-b-2 border-dourado-400 bg-couro-300 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-dourado-50">
                  Pts
                </th>
                <th className="border-b-2 border-dourado-400 bg-couro-300 px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-dourado-50">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.linhas.map((linha, i) => {
                const ehMeu = linha.participantId === meuId
                return (
                  <tr
                    key={linha.participantId}
                    onClick={() => abrirFrenteFrente(linha)}
                    className={cx(
                      'cursor-pointer transition-colors hover:bg-papel-100',
                      ehMeu && 'bg-dourado-50/50',
                    )}
                  >
                    <td
                      className={cx(
                        'sticky left-0 z-10 whitespace-nowrap border-b border-papel-borda-200/60 bg-papel-50 px-2 py-2 font-sans text-xs font-semibold',
                        ehMeu && 'border-l-4 border-l-dourado-500 bg-dourado-50 text-dourado-800',
                      )}
                    >
                      <span className="font-mono text-[9px] text-tinta-100">{i + 1}.</span>{' '}
                      <span className={ehMeu ? 'font-bold' : 'text-tinta-300'}>
                        {linha.nome}
                      </span>
                    </td>
                    {linha.celulas.map((c) => (
                      <td key={c.matchId} className="border-b border-papel-borda-200/60 px-1 py-1.5">
                        <CelulaPalpite celula={c} />
                      </td>
                    ))}
                    <td className="border-b border-papel-borda-200/60 px-2 py-1.5">
                      <div
                        className={cx(
                          'flex h-10 items-center justify-center rounded px-2 text-center font-mono text-sm font-bold',
                          corPts(linha.palpitouAlgo ? linha.ptsRodada : null),
                        )}
                      >
                        {linha.palpitouAlgo ? linha.ptsRodada : '—'}
                      </div>
                    </td>
                    <td className="border-b border-papel-borda-200/60 px-2 py-1.5">
                      <div className="flex h-10 items-center justify-center rounded bg-papel-200 px-2 text-center font-mono text-[10px] text-tinta-300">
                        {linha.ultimoPalpiteEm
                          ? new Date(linha.ultimoPalpiteEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardEnvelope>

      <CardEnvelope>
        <div className="flex flex-wrap items-center justify-center gap-3 px-3 py-2 font-mono text-[10px] text-tinta-100">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-green-600" /> Cravou (+5)</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-500" /> Saldo (+3)</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-yellow-400" /> Vencedor (+1)</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-500" /> Errou (0)</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-papel-borda-300" /> Aguardando</span>
        </div>
        <p className="border-t border-papel-borda-200 bg-papel-100 px-3 py-2 text-center font-mono text-[10px] italic text-tinta-100">
          👆 Toque em qualquer participante pra ver o frente a frente
        </p>
      </CardEnvelope>

      {frenteFrente && dados && (
        <FrenteFrenteRodadaModal
          jogadorA={frenteFrente.a}
          jogadorB={frenteFrente.b}
          jogos={dados.jogos}
          onFechar={() => setFrenteFrente(null)}
        />
      )}
    </>
  )
}
