'use client'

// AdminScreen — painel de administração do Palpitão Brasileirão.
// Reconstruído do zero para o contexto de liga: sem mata-mata, sem OneSignal,
// sem API-Football. Extras "Quem Avança / Pênaltis" e multiplicadores de fase removidos.

import { useEffect, useState } from 'react'
import { Accordion } from '@/components/home/Accordion'
import {
  buscarRodadaAtiva,
  salvarRodada,
  finalizarRodada,
  reabrirRodada,
  buscarRodadasFinalizadas,
  buscarJogosSemPlacar,
  limparPalpitesRodada,
  buscarParticipantesNomes,
  calcularPontosRodada,
  buscarPalpitesParticipante,
  corrigirPontoManual,
  type JogoAdmin,
  type PalpitePorJogo,
} from '@/lib/rodadaAdmin'
import { getEscudo } from '@/lib/escudos'
import { FORMACOES, getFormacao, type Formacao } from '@/lib/formacoes'
import { lerFormacaoId, salvarFormacaoId } from '@/lib/appSettings'
import { supabase } from '@/lib/supabase'
import { calcularRanking } from '@/lib/domain/ranking'

const URL_APP = 'https://palpitao-brasileirao-iota.vercel.app'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5">
      <span className="min-w-[88px] font-mono text-[10px] uppercase tracking-wider text-tinta-100">
        {label}
      </span>
      {children}
    </div>
  )
}

function InputText({
  value, onChange, placeholder, className,
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(
        'rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none focus-visible:ring-2 focus-visible:ring-dourado-300',
        className,
      )}
    />
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300',
        checked ? 'bg-green-700' : 'bg-papel-borda-400',
      )}
    >
      <span
        className={cx(
          'inline-block h-5 w-5 transform rounded-full bg-papel-50 shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

function Btn({
  children, onClick, variant = 'gold', disabled = false, className,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'gold' | 'green' | 'danger' | 'outline' | 'whatsapp'
  disabled?: boolean
  className?: string
}) {
  const styles: Record<string, string> = {
    gold: 'bg-dourado-400 text-papel-50 hover:bg-dourado-500 border-transparent',
    green: 'bg-green-700 text-white hover:bg-green-800 border-transparent',
    danger: 'bg-red-600 text-papel-50 hover:bg-red-700 border-transparent',
    outline: 'bg-transparent text-tinta-200 hover:bg-papel-200 border-papel-borda-300',
    whatsapp: 'bg-[#25D366] text-papel-50 hover:bg-[#1ebe5d] border-transparent',
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex items-center gap-1.5 rounded-md border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40',
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-lg border border-papel-borda-200 bg-papel-50 p-4', className)}>
      {children}
    </div>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 font-mono text-[9px] uppercase tracking-wider text-tinta-100">
      {children}
    </div>
  )
}

function NotaSeguranca({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dourado-300 bg-dourado-50 px-3 py-2">
      <p className="font-mono text-[10px] text-dourado-700">{children}</p>
    </div>
  )
}

// ─── MOCK DATA (a ser eliminado seção por seção) ─────────────────────────────

const NOMES = [
  'André', 'Costa', 'Damus', 'Diniz', 'Giovanni', 'Matheus Brito', 'Matheus Couto',
  'PH', 'Pedro Frozza', 'Pedro Gaúcho', 'Ramon', 'Samuel', 'Victor Bahia', 'Victor Simões',
]

const PLAYLIST_MOCK = [
  { id: 't1', title: 'Aquarela do Brasil', artist: 'Ary Barroso' },
  { id: 't2', title: 'País Tropical', artist: 'Jorge Ben Jor' },
]

const LOG_MOCK = [
  { ts: '2026-06-28T14:30:00', action: 'Rodada 20 salva' },
]

// ─── SEÇÃO: Compartilhar no WhatsApp (REAL) ─────────────────────────────────

function SecaoWhatsApp() {
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const MEDALHAS = ['🥇', '🥈', '🥉']
  function posEmoji(i: number): string {
    return MEDALHAS[i] ?? `${i + 1}º`
  }

  async function montarTextoGeral(): Promise<string> {
    // Busca todos os participantes, todas as predictions com pontos, e monta ranking
    const [{ data: parts }, { data: preds }] = await Promise.all([
      supabase.from('participants').select('id, name'),
      supabase.from('predictions').select('participant_id, points, match_id, pred_h, pred_a'),
    ])
    if (!parts || !preds) throw new Error('Sem dados no Supabase')

    // Busca matches (pra calcular ranking com desempate via cravadas/vencedor/saldo)
    const { data: matches } = await supabase.from('matches').select('id, home_score, away_score')
    const mMap = new Map((matches ?? []).map((m) => [m.id, m]))

    // Monta input pro lib/domain/ranking
    const participantes = parts.map((p) => ({ id: p.id, nome: p.name }))
    const palpitesPorJogador = new Map<string, Array<{ matchId: string; palpite: any; resultado: any; pontos: number | null }>>()

    for (const pred of preds) {
      const m = mMap.get(pred.match_id)
      if (!m || m.home_score === null || m.away_score === null) continue
      const arr = palpitesPorJogador.get(pred.participant_id) ?? []
      arr.push({
        matchId: pred.match_id,
        palpite: { h: pred.pred_h, a: pred.pred_a },
        resultado: { h: m.home_score, a: m.away_score },
        pontos: pred.points,
      })
      palpitesPorJogador.set(pred.participant_id, arr)
    }

    // Ranking manual (calcularRanking do domain espera formato específico — vamos fazer inline aqui pra evitar dependência)
    const ranking = participantes
      .map((p) => {
        const palps = palpitesPorJogador.get(p.id) ?? []
        let total = 0, cravadas = 0, vencedor = 0, saldo = 0
        for (const x of palps) {
          if (x.pontos !== null) total += x.pontos
          if (x.palpite.h === x.resultado.h && x.palpite.a === x.resultado.a) cravadas++
          else if (x.palpite.h - x.palpite.a === x.resultado.h - x.resultado.a) saldo++
          else {
            const pw = x.palpite.h > x.palpite.a ? 1 : x.palpite.h < x.palpite.a ? -1 : 0
            const rw = x.resultado.h > x.resultado.a ? 1 : x.resultado.h < x.resultado.a ? -1 : 0
            if (pw === rw) vencedor++
          }
        }
        return { nome: p.nome, total, cravadas, vencedor, saldo }
      })
      .sort((a, b) => b.total - a.total || b.cravadas - a.cravadas || b.vencedor - a.vencedor || b.saldo - a.saldo)

    const top5 = ranking.slice(0, 5)
    const linhas = top5.map((r, i) => `${posEmoji(i)} ${r.nome} — ${r.total} pts`).join('\n')

    return `🏆 *RANKING GERAL — Palpitão Brasileirão*\n\n${linhas}\n\n🔗 Confira a tabela completa no App do Palpitão\n${URL_APP}`
  }

  async function montarTextoParcial(): Promise<string> {
    // Pega a rodada ativa
    const rodada = await buscarRodadaAtiva()
    if (!rodada.roundId) throw new Error('Nenhuma rodada ativa')

    const { data: matches } = await supabase.from('matches').select('id').eq('round_id', rodada.roundId)
    const matchIds = (matches ?? []).map((m) => m.id)
    if (matchIds.length === 0) return `⚽ *${rodada.nome} — Palpitão Brasileirão*\n\nNenhum jogo cadastrado ainda.\n\n🔗 Confira a tabela completa no App do Palpitão\n${URL_APP}`

    const [{ data: parts }, { data: preds }] = await Promise.all([
      supabase.from('participants').select('id, name'),
      supabase.from('predictions').select('participant_id, points').in('match_id', matchIds),
    ])

    const somaPorParticipante = new Map<string, number>()
    for (const p of preds ?? []) {
      if (p.points === null) continue
      somaPorParticipante.set(p.participant_id, (somaPorParticipante.get(p.participant_id) ?? 0) + p.points)
    }

    const parcial = (parts ?? [])
      .map((p) => ({ nome: p.name, pts: somaPorParticipante.get(p.id) ?? 0 }))
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 5)

    const linhas = parcial.map((r, i) => `${posEmoji(i)} ${r.nome} — ${r.pts} pts`).join('\n')

    return `⚽ *PARCIAL ${rodada.nome} — Palpitão Brasileirão*\n\n${linhas}\n\n🔗 Confira a tabela completa no App do Palpitão\n${URL_APP}`
  }

  async function share(tipo: 'geral' | 'parcial') {
    setCarregando(true)
    setMensagem(null)
    try {
      const texto = tipo === 'geral' ? await montarTextoGeral() : await montarTextoParcial()
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
    } catch (e) {
      setMensagem(`Erro: ${(e as Error).message}`)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Card>
      <p className="mb-4 font-sans text-sm text-tinta-200">
        Envie um resumo direto no WhatsApp — top 5 com dados reais do Supabase.
      </p>
      {mensagem && <p className="mb-3 font-sans text-xs text-raridade-frango-selo">{mensagem}</p>}
      <div className="flex flex-wrap gap-3">
        <Btn variant="whatsapp" onClick={() => share('geral')} disabled={carregando}>
          {carregando ? '...' : '📊 Ranking Geral'}
        </Btn>
        <Btn variant="whatsapp" onClick={() => share('parcial')} disabled={carregando}>
          {carregando ? '...' : '⚽ Parcial da Rodada'}
        </Btn>
      </div>
    </Card>
  )
}

// ─── SEÇÃO: Configuração da Rodada ───────────────────────────────────────────

type Jogo = { id: string; home: string; away: string; date: string; time: string; locked: boolean }

function SecaoConfiguracaoRodada() {
  const [roundId, setRoundId] = useState<string | null>(null)
  const [nome, setNome] = useState('Rodada 20')
  const [numero, setNumero] = useState(20)
  const [aberta, setAberta] = useState(true)
  const [valeDobro, setValeDobro] = useState(false)
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [idsOriginais, setIdsOriginais] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [modalFinalizar, setModalFinalizar] = useState<'fechado' | 'confirmar' | 'aviso'>('fechado')
  const [jogosSemPlacar, setJogosSemPlacar] = useState<Array<{ id: string; home: string; away: string }>>([])

  useEffect(() => {
    buscarRodadaAtiva()
      .then((r) => {
        setRoundId(r.roundId)
        setNome(r.nome)
        setNumero(r.numero)
        setAberta(r.aberta)
        setValeDobro(r.valeDobro)
        setJogos(r.jogos)
        setIdsOriginais(r.jogos.map((j) => j.id))
      })
      .catch((e) => setMensagem(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  function addJogo() {
    setJogos((js) => [...js, { id: 'j' + Date.now(), home: '', away: '', date: '', time: '', locked: false }])
  }
  function removeJogo(id: string) { setJogos((js) => js.filter((j) => j.id !== id)) }
  function patch(id: string, p: Partial<Jogo>) { setJogos((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j))) }

  async function handleSalvar() {
    setSalvando(true); setMensagem(null)
    try {
      const idFinal = await salvarRodada(roundId, nome, numero, aberta, valeDobro, jogos as JogoAdmin[], idsOriginais)
      setRoundId(idFinal)
      const atualizado = await buscarRodadaAtiva()
      setJogos(atualizado.jogos)
      setIdsOriginais(atualizado.jogos.map((j) => j.id))
      setMensagem('Rodada salva.')
    } catch (e) { setMensagem(`Erro ao salvar: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  async function abrirFinalizar() {
    if (!roundId) return
    setSalvando(true)
    try {
      const faltando = await buscarJogosSemPlacar(roundId)
      setJogosSemPlacar(faltando)
      setModalFinalizar(faltando.length > 0 ? 'aviso' : 'confirmar')
    } catch (e) { setMensagem(`Erro ao verificar jogos: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  async function confirmarFinalizar() {
    if (!roundId) return
    setSalvando(true); setModalFinalizar('fechado')
    try {
      await finalizarRodada(roundId)
      setAberta(false)
      setMensagem('Rodada finalizada. Pontos lançados no Ranking. 🏆')
    } catch (e) { setMensagem(`Erro ao finalizar: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  async function handleLimparPalpites() {
    if (!roundId || !confirm('Apagar todos os palpites desta rodada? Não dá pra desfazer.')) return
    setSalvando(true)
    try {
      await limparPalpitesRodada(roundId)
      setMensagem('Palpites apagados.')
    } catch (e) { setMensagem(`Erro ao limpar: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando rodada...</p></Card>

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <Card>
        <Row label="Nome"><InputText value={nome} onChange={setNome} placeholder="ex: Rodada 20" className="flex-1" /></Row>
        <Row label="Nº Rodada">
          <input type="number" min={1} value={numero} onChange={(e) => setNumero(parseInt(e.target.value) || 1)}
            className="w-16 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 text-center font-mono text-sm text-tinta-300 outline-none" />
          <span className="font-sans text-xs text-tinta-100">Aparece como "Rodada {numero}"</span>
        </Row>
        <Row label="Palpites">
          <Toggle checked={aberta} onChange={setAberta} />
          <span className="font-sans text-sm text-tinta-200">{aberta ? 'Abertos' : 'Fechados'}</span>
        </Row>
        <Row label="Vale x2">
          <Toggle checked={valeDobro} onChange={setValeDobro} />
          <span className="font-sans text-sm text-tinta-200">{valeDobro ? '⚡ Pontuação em dobro (última do turno)' : 'Pontuação normal'}</span>
        </Row>
      </Card>

      {jogos.map((j, idx) => (
        <Card key={j.id}>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-dourado-500">JOGO {idx + 1}</span>
            <button type="button" onClick={() => removeJogo(j.id)}
              className="font-mono text-[10px] text-raridade-frango-selo hover:underline">Remover</button>
          </div>
          <Row label="Casa">
            {getEscudo(j.home) && <img src={getEscudo(j.home)} alt="" className="h-6 w-6 flex-shrink-0 object-contain" />}
            <InputText value={j.home} onChange={(v) => patch(j.id, { home: v })} placeholder="Flamengo" className="flex-1" />
          </Row>
          <Row label="Fora">
            {getEscudo(j.away) && <img src={getEscudo(j.away)} alt="" className="h-6 w-6 flex-shrink-0 object-contain" />}
            <InputText value={j.away} onChange={(v) => patch(j.id, { away: v })} placeholder="Vasco" className="flex-1" />
          </Row>
          <Row label="Data">
            <InputText value={j.date} onChange={(v) => patch(j.id, { date: v })} placeholder="AAAA-MM-DD" />
            {!j.date && <span className="font-mono text-[10px] text-raridade-frango-selo">⚠ sem data — trava hoje</span>}
          </Row>
          <Row label="Horário"><InputText value={j.time} onChange={(v) => patch(j.id, { time: v })} placeholder="19:00" className="w-24" /></Row>
          <Row label="Travado">
            <Toggle checked={j.locked} onChange={(v) => patch(j.id, { locked: v })} />
            <span className="font-sans text-xs text-tinta-200">{j.locked ? '🔒 Travado manualmente' : 'Automático pelo horário'}</span>
          </Row>
        </Card>
      ))}

      <button type="button" onClick={addJogo}
        className="w-full rounded-lg border border-dashed border-papel-borda-300 py-2.5 font-mono text-xs text-tinta-200 transition-colors hover:bg-papel-100">
        + Adicionar Jogo
      </button>

      <div className="flex flex-wrap gap-2">
        <Btn variant="gold" onClick={handleSalvar} disabled={salvando}>{salvando ? '...' : '💾 Salvar Rodada'}</Btn>
        <Btn variant="green" onClick={abrirFinalizar} disabled={salvando || !roundId}>✔ Finalizar Rodada</Btn>
        <Btn variant="danger" onClick={handleLimparPalpites} disabled={salvando || !roundId}>🗑 Limpar Palpites</Btn>
      </div>

      {modalFinalizar === 'confirmar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4">
          <div className="w-full max-w-sm rounded-lg border-2 border-dourado-300 bg-papel-50 p-5 shadow-xl">
            <p className="mb-2 font-display text-lg font-bold text-tinta-300">Finalizar rodada?</p>
            <p className="mb-4 font-sans text-sm text-tinta-200">
              Isso é <b>definitivo</b> e lança tudo no <b>Ranking</b>. Se precisar corrigir depois, use <i>Reabrir Rodada</i>.
            </p>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setModalFinalizar('fechado')}>Cancelar</Btn>
              <Btn variant="green" onClick={confirmarFinalizar}>✔ Finalizar</Btn>
            </div>
          </div>
        </div>
      )}

      {modalFinalizar === 'aviso' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4">
          <div className="w-full max-w-sm rounded-lg border-2 border-raridade-frango-selo bg-papel-50 p-5 shadow-xl">
            <p className="mb-2 font-display text-lg font-bold text-raridade-frango-selo">Tá doido é?</p>
            <p className="mb-3 font-sans text-sm text-tinta-200">Faltou lançar o resultado desses jogos Pai:</p>
            <ul className="mb-4 max-h-48 overflow-y-auto rounded border border-papel-borda-200 bg-papel-100 px-3 py-2">
              {jogosSemPlacar.map((j) => (
                <li key={j.id} className="border-b border-papel-borda-200/60 py-1 font-sans text-xs text-tinta-300 last:border-0">{j.home} × {j.away}</li>
              ))}
            </ul>
            <p className="mb-4 font-mono text-[10px] text-tinta-100">Se algum jogo foi adiado, dá pra finalizar mesmo assim (esses ficam sem pontuação).</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Btn variant="outline" onClick={() => setModalFinalizar('fechado')}>Voltar</Btn>
              <Btn variant="danger" onClick={confirmarFinalizar}>Finalizar mesmo assim</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SEÇÃO: Alterar Formação (NOVA, REAL) ────────────────────────────────────

function MiniCampo({ formacao }: { formacao: Formacao }) {
  // Mini SVG 100x120 mostrando as bolinhas da formação
  return (
    <svg viewBox="0 0 100 120" className="h-24 w-20">
      {/* Campo */}
      <rect x="2" y="2" width="96" height="116" rx="4" fill="#0a3a1e" stroke="#1a5a3a" strokeWidth="1" />
      {/* Linha do meio */}
      <line x1="2" y1="60" x2="98" y2="60" stroke="#1a5a3a" strokeWidth="0.5" />
      <circle cx="50" cy="60" r="8" fill="none" stroke="#1a5a3a" strokeWidth="0.5" />
      {/* Áreas */}
      <rect x="30" y="2" width="40" height="12" fill="none" stroke="#1a5a3a" strokeWidth="0.5" />
      <rect x="30" y="106" width="40" height="12" fill="none" stroke="#1a5a3a" strokeWidth="0.5" />
      {/* Bolinhas dos jogadores */}
      {formacao.posicoes.map((p, i) => {
        const cx = parseFloat(p.left)
        const cy = parseFloat(p.top) * 1.2 // ajusta escala vertical
        return <circle key={i} cx={cx} cy={Math.min(cy, 118)} r="2.2" fill="#F0D060" stroke="#1a1a1a" strokeWidth="0.5" />
      })}
    </svg>
  )
}

function SecaoAlterarFormacao() {
  const [atual, setAtual] = useState<string>('4-3-3')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    lerFormacaoId()
      .then((id) => setAtual(id))
      .catch((e) => setMensagem(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  async function escolher(id: string) {
    if (id === atual || salvando) return
    setSalvando(true)
    setMensagem(null)
    try {
      await salvarFormacaoId(id)
      setAtual(id)
      const nome = getFormacao(id).nome
      setMensagem(`Formação alterada pra ${nome}. ⚽`)
    } catch (e) {
      setMensagem(`Erro ao salvar: ${(e as Error).message}`)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando formação...</p></Card>

  const classicas = FORMACOES.filter((f) => f.tipo === 'classica')
  const doidas = FORMACOES.filter((f) => f.tipo === 'doida')

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}

      <Card>
        <p className="font-sans text-sm text-tinta-200">
          A formação escolhida vale pros campinhos da <b>abertura</b> e do <b>login</b>.
          Toca em qualquer card pra trocar na hora.
        </p>
      </Card>

      <SubLabel>⚽ Clássicas</SubLabel>
      <div className="grid grid-cols-2 gap-3">
        {classicas.map((f) => {
          const ativa = f.id === atual
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => escolher(f.id)}
              disabled={salvando}
              className={cx(
                'relative flex flex-col items-center gap-1 rounded-lg border-2 bg-papel-50 p-3 transition-all',
                ativa
                  ? 'border-dourado-400 shadow-lg ring-2 ring-dourado-200'
                  : 'border-papel-borda-200 hover:border-dourado-200 hover:bg-papel-100',
              )}
            >
              {ativa && (
                <span className="absolute right-1.5 top-1.5 rounded border border-dourado-400 bg-dourado-100 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-dourado-700">
                  ATUAL
                </span>
              )}
              <MiniCampo formacao={f} />
              <div className="text-center">
                <p className="font-display text-sm font-bold text-tinta-300">{f.nome}</p>
                {f.apelido && <p className="font-sans text-[10px] italic text-tinta-100">{f.apelido}</p>}
              </div>
            </button>
          )
        })}
      </div>

      <SubLabel>🤪 Doidas</SubLabel>
      <div className="grid grid-cols-2 gap-3">
        {doidas.map((f) => {
          const ativa = f.id === atual
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => escolher(f.id)}
              disabled={salvando}
              className={cx(
                'relative flex flex-col items-center gap-1 rounded-lg border-2 bg-papel-50 p-3 transition-all',
                ativa
                  ? 'border-dourado-400 shadow-lg ring-2 ring-dourado-200'
                  : 'border-papel-borda-200 hover:border-dourado-200 hover:bg-papel-100',
              )}
            >
              {ativa && (
                <span className="absolute right-1.5 top-1.5 rounded border border-dourado-400 bg-dourado-100 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-dourado-700">
                  ATUAL
                </span>
              )}
              <MiniCampo formacao={f} />
              <div className="text-center">
                <p className="font-display text-sm font-bold text-tinta-300">{f.nome}</p>
                {f.apelido && <p className="font-sans text-[10px] italic text-tinta-100">{f.apelido}</p>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── SEÇÃO: Resultado & Correção ─────────────────────────────────────────────

type Placar = { h: string; a: string }

function SecaoResultadoCorrecao() {
  const [roundId, setRoundId] = useState<string | null>(null)
  const [valeDobro, setValeDobro] = useState(false)
  const [jogos, setJogos] = useState<Array<{ id: string; home: string; away: string }>>([])
  const [res, setRes] = useState<Record<string, Placar>>({})
  const [carregando, setCarregando] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const [participantes, setParticipantes] = useState<Array<{ id: string; name: string }>>([])
  const [jogadorSel, setJogadorSel] = useState('')
  const [palpites, setPalpites] = useState<PalpitePorJogo[]>([])
  const [carregandoPalpites, setCarregandoPalpites] = useState(false)
  const [correcaoBuf, setCorrecaoBuf] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([buscarRodadaAtiva(), buscarParticipantesNomes()])
      .then(([rodada, nomes]) => {
        setRoundId(rodada.roundId)
        setValeDobro(rodada.valeDobro)
        setJogos(rodada.jogos)
        setRes(Object.fromEntries(rodada.jogos.map((j) => [j.id, { h: j.resultadoH?.toString() ?? '', a: j.resultadoA?.toString() ?? '' }])))
        setParticipantes(nomes)
      })
      .catch((e) => setMensagem(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  function setField(id: string, field: 'h' | 'a', val: string) {
    setRes((r) => ({ ...r, [id]: { ...r[id], [field]: val } }))
  }

  async function handleCalcular() {
    if (!roundId) return
    setCalculando(true); setMensagem(null)
    try {
      const resultados: Record<string, { h: number; a: number }> = {}
      for (const j of jogos) {
        const h = res[j.id]?.h; const a = res[j.id]?.a
        if (h === '' || h === undefined || a === '' || a === undefined) continue
        resultados[j.id] = { h: parseInt(h, 10), a: parseInt(a, 10) }
      }
      await calcularPontosRodada(roundId, resultados, valeDobro)
      setMensagem('Pontos calculados! ⚡')
      if (jogadorSel) {
        const p = participantes.find((x) => x.name === jogadorSel)
        if (p) setPalpites(await buscarPalpitesParticipante(roundId, p.id))
      }
    } catch (e) { setMensagem(`Erro ao calcular: ${(e as Error).message}`) }
    finally { setCalculando(false) }
  }

  async function selecionarJogador(nome: string) {
    setJogadorSel(nome); setCorrecaoBuf({})
    if (!nome || !roundId) { setPalpites([]); return }
    setCarregandoPalpites(true)
    try {
      const p = participantes.find((x) => x.name === nome)
      if (p) setPalpites(await buscarPalpitesParticipante(roundId, p.id))
    } catch (e) { setMensagem(`Erro ao carregar palpites: ${(e as Error).message}`) }
    finally { setCarregandoPalpites(false) }
  }

  async function handleCorrigir(predictionId: string | null) {
    if (!predictionId) return
    const valor = correcaoBuf[predictionId]
    if (valor === undefined || valor === '') return
    try {
      await corrigirPontoManual(predictionId, parseInt(valor, 10))
      if (jogadorSel && roundId) {
        const p = participantes.find((x) => x.name === jogadorSel)
        if (p) setPalpites(await buscarPalpitesParticipante(roundId, p.id))
      }
      setMensagem('Correção aplicada.')
    } catch (e) { setMensagem(`Erro ao corrigir: ${(e as Error).message}`) }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando rodada...</p></Card>
  if (!roundId) return <Card><p className="font-sans text-sm text-tinta-200">Nenhuma rodada encontrada.</p></Card>

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      {valeDobro && <Card><p className="font-sans text-sm font-semibold text-dourado-600">⚡ Esta rodada vale pontuação em dobro</p></Card>}
      <Card>
        {jogos.map((j) => (
          <div key={j.id} className="border-b border-papel-borda-200 py-3 last:border-0">
            <p className="mb-2 font-sans text-sm font-semibold text-tinta-300">{j.home} × {j.away}</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-tinta-100">Placar:</span>
              <input type="number" inputMode="numeric" min={0} value={res[j.id]?.h ?? ''}
                onChange={(e) => setField(j.id, 'h', e.target.value)} placeholder="0"
                className="w-14 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1 text-center font-mono text-sm text-tinta-300 outline-none" />
              <span className="text-tinta-100">×</span>
              <input type="number" inputMode="numeric" min={0} value={res[j.id]?.a ?? ''}
                onChange={(e) => setField(j.id, 'a', e.target.value)} placeholder="0"
                className="w-14 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1 text-center font-mono text-sm text-tinta-300 outline-none" />
            </div>
          </div>
        ))}
        <div className="mt-3">
          <Btn variant="gold" onClick={handleCalcular} disabled={calculando}>{calculando ? '...' : '⚡ Calcular Pontos Automaticamente'}</Btn>
        </div>
      </Card>

      <div>
        <SubLabel>Correção Manual por Palpiteiro</SubLabel>
        <div className="flex gap-2">
          <select value={jogadorSel} onChange={(e) => selecionarJogador(e.target.value)}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none focus-visible:ring-2 focus-visible:ring-dourado-300">
            <option value="">Selecione o palpiteiro...</option>
            {participantes.map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
          </select>
          {jogadorSel && (
            <button type="button" onClick={() => selecionarJogador('')}
              className="rounded border border-papel-borda-300 px-2.5 font-mono text-xs text-tinta-200 hover:bg-papel-100">✕</button>
          )}
        </div>
        {jogadorSel && (
          <Card className="mt-2">
            <p className="mb-3 font-display text-sm font-bold text-dourado-500">{jogadorSel}</p>
            {carregandoPalpites && <p className="font-sans text-xs text-tinta-100">Carregando...</p>}
            {!carregandoPalpites && palpites.map((pj) => (
              <div key={pj.matchId} className="border-b border-papel-borda-200/60 py-2.5 last:border-0">
                <p className="mb-1.5 font-sans text-xs font-semibold text-tinta-300">{pj.home} × {pj.away}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-sans text-xs text-tinta-100">Palpite: <b className="font-mono text-tinta-300">{pj.predH !== null ? `${pj.predH}×${pj.predA}` : 'NP'}</b></span>
                  <span className="font-sans text-xs text-tinta-100">Resultado: <b className="font-mono text-dourado-500">{pj.resultadoH !== null ? `${pj.resultadoH}×${pj.resultadoA}` : '—'}</b></span>
                  <span className="font-sans text-xs text-tinta-100">Pontos: <b className="font-mono text-dourado-500">{pj.points ?? '—'}</b></span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-tinta-100">
                    Corrigir:
                    <input type="number" inputMode="numeric" min={0} placeholder="—"
                      value={correcaoBuf[pj.predictionId ?? ''] ?? ''}
                      onChange={(e) => setCorrecaoBuf((b) => ({ ...b, [pj.predictionId ?? '']: e.target.value }))}
                      disabled={!pj.predictionId}
                      className="w-12 rounded border border-papel-borda-300 bg-papel-50 px-1.5 py-0.5 text-center font-mono text-xs text-tinta-300 outline-none disabled:opacity-40" />
                    <button type="button" onClick={() => handleCorrigir(pj.predictionId)} disabled={!pj.predictionId}
                      className="rounded border border-papel-borda-300 px-2 py-0.5 font-mono text-[10px] text-tinta-200 hover:bg-papel-100 disabled:opacity-40">✓ Ok</button>
                  </span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── SEÇÃO: Frango da Rodada (REAL) ──────────────────────────────────────────

function SecaoFrango() {
  const [roundId, setRoundId] = useState<string | null>(null)
  const [rodadaNome, setRodadaNome] = useState<string>('')
  const [jogador, setJogador] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [texto, setTexto] = useState('')
  const [participantes, setParticipantes] = useState<Array<{ id: string; name: string }>>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([buscarRodadaAtiva(), buscarParticipantesNomes()])
      .then(async ([rodada, nomes]) => {
        setRoundId(rodada.roundId)
        setRodadaNome(rodada.nome)
        setParticipantes(nomes)
        if (rodada.roundId) {
          const { data } = await supabase
            .from('shame')
            .select('player_name, text, photo_url')
            .eq('round_id', rodada.roundId)
            .maybeSingle()
          if (data) {
            setJogador(data.player_name ?? '')
            setTexto(data.text ?? '')
            setFotoUrl(data.photo_url ?? '')
          }
        }
      })
      .catch((e) => setMensagem(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  async function salvar() {
    if (!roundId) return
    setSalvando(true); setMensagem(null)
    try {
      // Upsert manual: apaga existente e insere novo (uma tupla por rodada)
      await supabase.from('shame').delete().eq('round_id', roundId)
      if (jogador.trim()) {
        const { error } = await supabase.from('shame').insert({
          round_id: roundId,
          player_name: jogador.trim(),
          text: texto.trim() || null,
          photo_url: fotoUrl.trim() || null,
        })
        if (error) throw error
      }
      setMensagem('Frango salvo. 🐔')
    } catch (e) { setMensagem(`Erro ao salvar: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  async function limpar() {
    if (!roundId) return
    setSalvando(true)
    try {
      await supabase.from('shame').delete().eq('round_id', roundId)
      setJogador(''); setFotoUrl(''); setTexto('')
      setMensagem('Frango removido.')
    } catch (e) { setMensagem(`Erro ao limpar: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando...</p></Card>
  if (!roundId) return <Card><p className="font-sans text-sm text-tinta-200">Nenhuma rodada ativa pra atribuir o frango.</p></Card>

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          O frango de <b>{rodadaNome}</b> só aparece pra ele durante a próxima rodada.
          Tradição do grupo — carinhosamente constrangedor. 🐔
        </p>
        <Row label="Jogador">
          <select value={jogador} onChange={(e) => setJogador(e.target.value)}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none">
            <option value="">Nenhum (limpar frango)</option>
            {participantes.map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
          </select>
        </Row>
        <Row label="Foto URL">
          <InputText value={fotoUrl} onChange={setFotoUrl} placeholder="https://... (foto editada do grupo)" className="flex-1" />
        </Row>
        <Row label="Texto">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Mensagem carinhosamente constrangedora..." rows={2}
            className="flex-1 resize-none rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none" />
        </Row>
        <div className="mt-3 flex gap-2">
          <Btn variant="gold" onClick={salvar} disabled={salvando}>{salvando ? '...' : '💾 Salvar'}</Btn>
          <Btn variant="outline" onClick={limpar} disabled={salvando}>Limpar</Btn>
        </div>
      </Card>
    </div>
  )
}

// ─── SEÇÃO: Reabrir Rodada ────────────────────────────────────────────────────

function SecaoReabrirRodada() {
  const [rodadas, setRodadas] = useState<Array<{ id: string; number: number; name: string }>>([])
  const [selecionada, setSelecionada] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [reabrindo, setReabrindo] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)

  async function carregar() {
    setCarregando(true)
    try { setRodadas(await buscarRodadasFinalizadas()) }
    catch (e) { setMensagem(`Erro ao carregar: ${(e as Error).message}`) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  async function handleReabrir() {
    if (!selecionada) return
    setReabrindo(true); setConfirmar(false)
    try {
      await reabrirRodada(selecionada)
      setMensagem('Rodada reaberta. Ela voltou pra "em andamento" e pode ser editada.')
      setSelecionada('')
      await carregar()
    } catch (e) { setMensagem(`Erro ao reabrir: ${(e as Error).message}`) }
    finally { setReabrindo(false) }
  }

  const rodadaSel = rodadas.find((r) => r.id === selecionada)

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Volta uma rodada finalizada pro estado "em andamento" — útil se descobrir erro
          de digitação no placar depois de finalizar. Pontos já calculados permanecem.
        </p>
        {carregando ? (
          <p className="font-sans text-xs text-tinta-100">Carregando rodadas...</p>
        ) : rodadas.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">Nenhuma rodada finalizada ainda.</p>
        ) : (
          <>
            <Row label="Rodada">
              <select value={selecionada} onChange={(e) => setSelecionada(e.target.value)}
                className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none focus-visible:ring-2 focus-visible:ring-dourado-300">
                <option value="">Selecione a rodada...</option>
                {rodadas.map((r) => (<option key={r.id} value={r.id}>{r.name} (Nº {r.number})</option>))}
              </select>
            </Row>
            <div className="mt-3">
              <Btn variant="gold" onClick={() => setConfirmar(true)} disabled={!selecionada || reabrindo}>🔓 Reabrir Rodada</Btn>
            </div>
          </>
        )}
      </Card>

      {confirmar && rodadaSel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4">
          <div className="w-full max-w-sm rounded-lg border-2 border-dourado-300 bg-papel-50 p-5 shadow-xl">
            <p className="mb-2 font-display text-lg font-bold text-tinta-300">Reabrir {rodadaSel.name}?</p>
            <p className="mb-4 font-sans text-sm text-tinta-200">
              Ela sai do Ranking oficial e volta pro estado "em andamento". Pontos já calculados
              permanecem — ao finalizar de novo, o Ranking se ajusta.
            </p>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setConfirmar(false)}>Cancelar</Btn>
              <Btn variant="gold" onClick={handleReabrir}>🔓 Reabrir</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SEÇÕES MOCK (portadas nas próximas fases) ───────────────────────────────

function SecaoProjecao() {
  const [janela, setJanela] = useState(3)
  const opcoes: [number, string][] = [[2,'Últ. 2'],[3,'Últ. 3'],[5,'Últ. 5'],[10,'Últ. 10'],[0,'Campeonato inteiro']]
  return (
    <Card>
      <p className="mb-3 font-sans text-sm text-tinta-200">Define quantas rodadas usar para calcular a projeção de campeão (%) na tabela de ranking.</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(([val,label])=>(
          <button type="button" key={val} onClick={()=>setJanela(val)}
            className={cx('rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors',
              janela===val ? 'border-dourado-400 bg-dourado-100 text-dourado-600' : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100')}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] text-tinta-100">⚠ Ainda mock — persistência real vem no próximo bloco.</p>
    </Card>
  )
}

function SecaoEvolucao() {
  const [janela, setJanela] = useState(0)
  const opcoes: [number, string][] = [[1,'Última'],[3,'Últ. 3'],[5,'Últ. 5'],[10,'Últ. 10'],[0,'Desde o início']]
  return (
    <Card>
      <p className="mb-3 font-sans text-sm text-tinta-200">Controla quantas rodadas aparecem no gráfico "Evolução por Rodada".</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(([val,label])=>(
          <button type="button" key={val} onClick={()=>setJanela(val)}
            className={cx('rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors',
              janela===val ? 'border-dourado-400 bg-dourado-100 text-dourado-600' : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100')}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] text-tinta-100">⚠ Ainda mock — persistência real vem no próximo bloco.</p>
    </Card>
  )
}

function SecaoPontuacao() {
  const regras = [
    { desc: 'Placar exato (cravada)', pts: 5 },
    { desc: 'Saldo de gols certo',    pts: 3 },
    { desc: 'Vencedor certo',         pts: 1 },
  ]
  return (
    <Card>
      <SubLabel>Regras da liga (fixas — critérios exclusivos, não acumulam)</SubLabel>
      {regras.map((r, i) => (
        <div key={i} className="flex items-center justify-between border-b border-papel-borda-200 py-2 last:border-0">
          <span className="font-sans text-sm text-tinta-300">{r.desc}</span>
          <span className="font-mono text-sm font-bold text-dourado-500">{r.pts} pts</span>
        </div>
      ))}
      <p className="mt-3 font-mono text-[10px] text-tinta-100">
        ⚠ Edição dinâmica ficará pra Fase 5 (mexer aqui muda o cálculo histórico).
      </p>
    </Card>
  )
}

function SecaoNovidades() {
  const [titulo, setTitulo] = useState('')
  const [resumo, setResumo] = useState('')
  const [lista, setLista] = useState<Array<{ id: string; titulo: string; resumo: string | null; data: string | null }>>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      const { data, error } = await supabase
        .from('novidades')
        .select('id, titulo, resumo, data')
        .order('created_at', { ascending: false })
      if (error) throw error
      setLista(data ?? [])
    } catch (e) { setMensagem(`Erro ao carregar: ${(e as Error).message}`) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  async function publicar() {
    if (!titulo.trim()) return
    setSalvando(true); setMensagem(null)
    try {
      const { error } = await supabase.from('novidades').insert({
        titulo: titulo.trim(),
        resumo: resumo.trim() || null,
      })
      if (error) throw error
      setTitulo(''); setResumo('')
      setMensagem('Novidade publicada. 🆕')
      await carregar()
    } catch (e) { setMensagem(`Erro ao publicar: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  async function remover(id: string) {
    setSalvando(true)
    try {
      const { error } = await supabase.from('novidades').delete().eq('id', id)
      if (error) throw error
      setMensagem('Novidade removida.')
      await carregar()
    } catch (e) { setMensagem(`Erro ao remover: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Publique uma novidade pra aparecer como pop-up quando os participantes entrarem no app.
        </p>
        <Row label="Título"><InputText value={titulo} onChange={setTitulo} placeholder="ex: Ranking disponível!" className="flex-1" /></Row>
        <Row label="Resumo">
          <textarea value={resumo} onChange={(e) => setResumo(e.target.value)} placeholder="Breve descrição..." rows={2}
            className="flex-1 resize-none rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none" />
        </Row>
        <div className="mt-3">
          <Btn variant="gold" onClick={publicar} disabled={salvando || !titulo.trim()}>{salvando ? '...' : '🆕 Publicar'}</Btn>
        </div>
      </Card>

      <Card>
        <SubLabel>Publicadas</SubLabel>
        {carregando ? (
          <p className="font-sans text-xs text-tinta-100">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">Nenhuma novidade publicada.</p>
        ) : (
          lista.map((n) => (
            <div key={n.id} className="flex items-start gap-2 border-b border-papel-borda-200 py-2.5 last:border-0">
              <div className="flex-1">
                <p className="font-sans text-sm font-semibold text-tinta-300">{n.titulo}</p>
                {n.resumo && <p className="mt-0.5 font-sans text-xs text-tinta-200">{n.resumo}</p>}
                <p className="mt-0.5 font-mono text-[10px] text-tinta-100">{n.data ? new Date(n.data + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</p>
              </div>
              <button type="button" onClick={() => remover(n.id)} disabled={salvando}
                className="font-mono text-[10px] text-raridade-frango-selo hover:underline disabled:opacity-40">Remover</button>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
function SecaoMusica() {
  return <Card><p className="font-sans text-sm text-tinta-200">⚠ Portação real no próximo bloco (aguardando arquivos .mp3).</p></Card>
}
function SecaoAdms() {
  return <Card><p className="font-sans text-sm text-tinta-200">⚠ Portação real no próximo bloco.</p></Card>
}
function SecaoPINs() {
  return <Card><p className="font-sans text-sm text-tinta-200">⚠ Portação real no próximo bloco.</p></Card>
}
function SecaoLog() {
  return <Card><p className="font-sans text-sm text-tinta-200">⚠ Portação real no próximo bloco.</p></Card>
}
function SecaoFinalizarCampeonato() {
  return <Card><p className="font-sans text-sm text-tinta-200">⚠ Portação real no próximo bloco.</p></Card>
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────

const SECOES = [
  { key: 'whatsapp',     titulo: '📲 Compartilhar no WhatsApp',  conteudo: <SecaoWhatsApp /> },
  { key: 'rodada',       titulo: '⚙ Configuração da Rodada',     conteudo: <SecaoConfiguracaoRodada /> },
  { key: 'resultado',    titulo: '⚽ Resultado & Correção',       conteudo: <SecaoResultadoCorrecao /> },
  { key: 'frango',       titulo: '🐔 Frango da Rodada',           conteudo: <SecaoFrango /> },
  { key: 'reabrir',      titulo: '🔓 Reabrir Rodada',             conteudo: <SecaoReabrirRodada /> },
  { key: 'projecao',     titulo: '🔮 Projeção de Campeão',        conteudo: <SecaoProjecao /> },
  { key: 'evolucao',     titulo: '📈 Gráfico de Evolução',        conteudo: <SecaoEvolucao /> },
  { key: 'formacao',     titulo: '⚽ Alterar Formação',           conteudo: <SecaoAlterarFormacao /> },
  { key: 'pontuacao',    titulo: '📐 Esquema de Pontuação',       conteudo: <SecaoPontuacao /> },
  { key: 'novidades',    titulo: '🆕 Novidades',                  conteudo: <SecaoNovidades /> },
  { key: 'musica',       titulo: '🎵 Música Tema',                conteudo: <SecaoMusica /> },
  { key: 'adms',         titulo: '👑 Conheça os Adms',            conteudo: <SecaoAdms /> },
  { key: 'pins',         titulo: '🔐 PINs dos Jogadores',         conteudo: <SecaoPINs /> },
  { key: 'log',          titulo: '📋 Log de Ações',               conteudo: <SecaoLog /> },
  { key: 'finalizar',    titulo: '🏆 Finalizar Campeonato',       conteudo: <SecaoFinalizarCampeonato /> },
]

export function AdminScreen({ isAdmin = true }: { isAdmin?: boolean }) {
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel-200 px-4">
        <div className="text-center">
          <div className="mb-4 text-5xl">🔒</div>
          <h1 className="font-display text-2xl font-bold text-tinta-300">Acesso Restrito</h1>
          <p className="mt-2 font-sans text-sm text-tinta-100">Esta área é exclusiva para administradores.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-papel-200 px-4 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <header className="mb-4">
          <h1 className="font-display text-2xl font-bold text-tinta-300">⚙ Admin</h1>
          <p className="font-sans text-sm text-tinta-100">Área restrita — alterações afetam todos</p>
        </header>

        <div className="mb-4 rounded-lg border border-dourado-300 bg-dourado-50 px-4 py-2.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-dourado-700">
            ⚠ Área restrita — alterações afetam todos os participantes em tempo real.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {SECOES.map((s) => (
            <Accordion key={s.key} titulo={s.titulo} storageKey={`admin-${s.key}`} defaultOpen={false}>
              {s.conteudo}
            </Accordion>
          ))}
        </div>
      </div>
    </main>
  )
}
