'use client'

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
  buscarHistoricoRodadas,
  gravarLog,
  buscarLog,
  buscarParticipantesPins,
  atualizarPin,
  buscarAdmins,
  salvarAdmin,
  removerAdmin,
  finalizarCampeonato,
  type JogoAdmin,
  type PalpitePorJogo,
  type EntradaLog,
  type ParticipantePin,
  type AdminProfile,
} from '@/lib/rodadaAdmin'
import { getEscudo } from '@/lib/escudos'
import { FORMACOES, getFormacao, type Formacao } from '@/lib/formacoes'
import { lerConfig, salvarConfig, lerFormacaoId, salvarFormacaoId } from '@/lib/appSettings'
import { supabase } from '@/lib/supabase'
import { calcProjecaoPct } from '@/lib/domain/projecao'

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

// ─── SEÇÃO: Compartilhar no WhatsApp (REAL) ──────────────────────────────────

function SecaoWhatsApp() {
  const [carregando, setCarregando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const MEDALHAS = ['🥇', '🥈', '🥉']
  function posEmoji(i: number): string {
    return MEDALHAS[i] ?? `${i + 1}º`
  }

  async function montarTextoGeral(): Promise<string> {
    const [{ data: parts }, { data: preds }] = await Promise.all([
      supabase.from('participants').select('id, name'),
      supabase.from('predictions').select('participant_id, points, match_id, pred_h, pred_a'),
    ])
    if (!parts || !preds) throw new Error('Sem dados no Supabase')

    const { data: matches } = await supabase.from('matches').select('id, home_score, away_score')
    const mMap = new Map((matches ?? []).map((m) => [m.id, m]))

    const participantes = parts.map((p) => ({ id: p.id, nome: p.name }))
    const palpitesPorJogador = new Map<string, Array<{ palpite: any; resultado: any; pontos: number | null }>>()

    for (const pred of preds) {
      const m = mMap.get(pred.match_id)
      if (!m || m.home_score === null || m.away_score === null) continue
      const arr = palpitesPorJogador.get(pred.participant_id) ?? []
      arr.push({
        palpite: { h: pred.pred_h, a: pred.pred_a },
        resultado: { h: m.home_score, a: m.away_score },
        pontos: pred.points,
      })
      palpitesPorJogador.set(pred.participant_id, arr)
    }

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

    const linhas = ranking.slice(0, 5).map((r, i) => `${posEmoji(i)} ${r.nome} — ${r.total} pts`).join('\n')
    return `🏆 *RANKING GERAL — Palpitão Brasileirão*\n\n${linhas}\n\n🔗 Confira a tabela completa no App do Palpitão\n${URL_APP}`
  }

  async function montarTextoParcial(): Promise<string> {
    const rodada = await buscarRodadaAtiva()
    if (!rodada.roundId) throw new Error('Nenhuma rodada ativa')

    const { data: matches } = await supabase.from('matches').select('id').eq('round_id', rodada.roundId)
    const matchIds = (matches ?? []).map((m) => m.id)
    if (matchIds.length === 0) {
      return `⚽ *${rodada.nome} — Palpitão Brasileirão*\n\nNenhum jogo cadastrado ainda.\n\n🔗 Confira a tabela completa no App do Palpitão\n${URL_APP}`
    }

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
    setCarregando(true); setMensagem(null)
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
        setRoundId(r.roundId); setNome(r.nome); setNumero(r.numero)
        setAberta(r.aberta); setValeDobro(r.valeDobro)
        setJogos(r.jogos); setIdsOriginais(r.jogos.map((j) => j.id))
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
      setJogos(atualizado.jogos); setIdsOriginais(atualizado.jogos.map((j) => j.id))
      setMensagem('Rodada salva.')
      await gravarLog('RODADA_SALVA', { nome, numero })
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
      await gravarLog('RODADA_FINALIZADA', { roundId, nome })
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
      await gravarLog('PALPITES_LIMPOS', { roundId, nome })
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
          <span className="font-sans text-sm text-tinta-200">{valeDobro ? '⚡ Pontuação em dobro' : 'Pontuação normal'}</span>
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
            {!j.date && <span className="font-mono text-[10px] text-raridade-frango-selo">⚠ sem data</span>}
          </Row>
          <Row label="Horário">
            <InputText value={j.time} onChange={(v) => patch(j.id, { time: v })} placeholder="19:00" className="w-24" />
          </Row>
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
                <li key={j.id} className="border-b border-papel-borda-200/60 py-1 font-sans text-xs text-tinta-300 last:border-0">
                  {j.home} × {j.away}
                </li>
              ))}
            </ul>
            <p className="mb-4 font-mono text-[10px] text-tinta-100">
              Se algum jogo foi adiado, dá pra finalizar mesmo assim (esses ficam sem pontuação).
            </p>
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
        setRoundId(rodada.roundId); setValeDobro(rodada.valeDobro); setJogos(rodada.jogos)
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
      await gravarLog('PONTOS_CALCULADOS', { roundId })
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
      await gravarLog('PONTOS_CORRIGIDOS_MANUAL', { predictionId, novoValor: parseInt(valor, 10), jogador: jogadorSel })
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
          <Btn variant="gold" onClick={handleCalcular} disabled={calculando}>
            {calculando ? '...' : '⚡ Calcular Pontos Automaticamente'}
          </Btn>
        </div>
      </Card>

      <div>
        <SubLabel>Correção Manual por Palpiteiro</SubLabel>
        <div className="flex gap-2">
          <select value={jogadorSel} onChange={(e) => selecionarJogador(e.target.value)}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none">
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
  const [rodadaNome, setRodadaNome] = useState('')
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
        setRoundId(rodada.roundId); setRodadaNome(rodada.nome); setParticipantes(nomes)
        if (rodada.roundId) {
          const { data } = await supabase.from('shame').select('player_name, text, photo_url').eq('round_id', rodada.roundId).maybeSingle()
          if (data) { setJogador(data.player_name ?? ''); setTexto(data.text ?? ''); setFotoUrl(data.photo_url ?? '') }
        }
      })
      .catch((e) => setMensagem(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  async function salvar() {
    if (!roundId) return
    setSalvando(true); setMensagem(null)
    try {
      await supabase.from('shame').delete().eq('round_id', roundId)
      if (jogador.trim()) {
        const { error } = await supabase.from('shame').insert({ round_id: roundId, player_name: jogador.trim(), text: texto.trim() || null, photo_url: fotoUrl.trim() || null })
        if (error) throw error
        await gravarLog('FRANGO_ATRIBUIDO', { roundId, jogador, rodada: rodadaNome })
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
  if (!roundId) return <Card><p className="font-sans text-sm text-tinta-200">Nenhuma rodada ativa.</p></Card>

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">O frango de <b>{rodadaNome}</b> — carinhosamente constrangedor. 🐔</p>
        <Row label="Jogador">
          <select value={jogador} onChange={(e) => setJogador(e.target.value)}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none">
            <option value="">Nenhum (limpar frango)</option>
            {participantes.map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
          </select>
        </Row>
        <Row label="Foto URL"><InputText value={fotoUrl} onChange={setFotoUrl} placeholder="https://..." className="flex-1" /></Row>
        <Row label="Texto">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Mensagem carinhosamente constrangedora..." rows={2}
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
      const rod = rodadas.find((r) => r.id === selecionada)
      await reabrirRodada(selecionada)
      await gravarLog('RODADA_REABERTA', { roundId: selecionada, nome: rod?.name })
      setMensagem('Rodada reaberta.')
      setSelecionada(''); await carregar()
    } catch (e) { setMensagem(`Erro ao reabrir: ${(e as Error).message}`) }
    finally { setReabrindo(false) }
  }

  const rodadaSel = rodadas.find((r) => r.id === selecionada)

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">Volta uma rodada finalizada pro estado "em andamento".</p>
        {carregando ? (
          <p className="font-sans text-xs text-tinta-100">Carregando rodadas...</p>
        ) : rodadas.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">Nenhuma rodada finalizada ainda.</p>
        ) : (
          <>
            <Row label="Rodada">
              <select value={selecionada} onChange={(e) => setSelecionada(e.target.value)}
                className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none">
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
              Ela sai do Ranking oficial e volta pro estado "em andamento". Pontos calculados permanecem.
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

// ─── SEÇÃO: Projeção de Campeão (REAL) ───────────────────────────────────────

const OPCOES_JANELA: Array<[number, string]> = [
  [2, 'Últ. 2'], [3, 'Últ. 3'], [5, 'Últ. 5'], [10, 'Últ. 10'], [0, 'Campeonato inteiro'],
]

function SecaoProjecao() {
  const [janela, setJanela] = useState(3)
  const [carregando, setCarregando] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [projecoes, setProjecoes] = useState<Array<{ nome: string; pct: number }>>([])
  const [totalFinalizadas, setTotalFinalizadas] = useState(0)

  useEffect(() => {
    async function init() {
      try {
        const cfg = await lerConfig<{ rodadas: number }>('projecao_janela')
        const j = cfg?.rodadas ?? 3
        setJanela(j)
        await calcular(j)
      } catch (e) { setMensagem(`Erro ao carregar: ${(e as Error).message}`) }
      finally { setCarregando(false) }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function calcular(j: number) {
    setCalculando(true)
    try {
      const historico = await buscarHistoricoRodadas()
      setTotalFinalizadas(historico.length)
      if (historico.length < 2) { setProjecoes([]); return }

      const slice = j === 0 ? historico : historico.slice(-j)
      const todosNomes = new Set<string>()
      for (const r of historico) Object.keys(r.scores).forEach((n) => todosNomes.add(n))
      const players = Array.from(todosNomes)

      const totalPoints: Record<string, number> = {}
      for (const r of historico) {
        for (const [nome, pts] of Object.entries(r.scores)) {
          totalPoints[nome] = (totalPoints[nome] ?? 0) + pts
        }
      }

      const history = slice.map((r) => ({ scores: r.scores }))
      const resultado = calcProjecaoPct({ players, totalPoints, history, totalRodadas: 38 })
      setProjecoes(
        Object.entries(resultado).map(([nome, pct]) => ({ nome, pct })).sort((a, b) => b.pct - a.pct)
      )
    } catch (e) { setMensagem(`Erro ao calcular: ${(e as Error).message}`) }
    finally { setCalculando(false) }
  }

  async function mudarJanela(j: number) {
    if (j === janela || calculando) return
    setJanela(j); setMensagem(null)
    try { await salvarConfig('projecao_janela', { rodadas: j }) } catch { /* silencioso */ }
    await calcular(j)
  }

  const maxPct = projecoes[0]?.pct ?? 1

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-xs text-raridade-frango-selo">{mensagem}</p></Card>}
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">Define quantas rodadas usar pra calcular a chance de cada um ser campeão.</p>
        <div className="flex flex-wrap gap-2">
          {OPCOES_JANELA.map(([val, label]) => (
            <button key={val} type="button" onClick={() => mudarJanela(val)} disabled={calculando || carregando}
              className={cx('rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors disabled:opacity-40',
                janela === val ? 'border-dourado-400 bg-dourado-100 text-dourado-600' : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100')}>
              {label}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <SubLabel>
          Preview — projeção atual
          {totalFinalizadas > 0 && <span className="ml-1 normal-case">({totalFinalizadas} rodada{totalFinalizadas !== 1 ? 's' : ''} finalizada{totalFinalizadas !== 1 ? 's' : ''})</span>}
        </SubLabel>
        {carregando || calculando ? (
          <p className="font-sans text-xs text-tinta-100">Calculando...</p>
        ) : projecoes.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">
            {totalFinalizadas < 2 ? `Mínimo 2 rodadas finalizadas. Faltam ${2 - totalFinalizadas}.` : 'Sem dados suficientes.'}
          </p>
        ) : (
          <div className="space-y-2">
            {projecoes.map((p, i) => (
              <div key={p.nome} className="flex items-center gap-2">
                <span className="w-4 font-mono text-[10px] text-tinta-100">{i + 1}º</span>
                <span className="w-28 truncate font-sans text-xs text-tinta-300">{p.nome}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-papel-200">
                  <div className="h-2 rounded-full bg-dourado-400 transition-all duration-500"
                    style={{ width: `${Math.round((p.pct / maxPct) * 100)}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-xs font-bold text-dourado-600">{p.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── SEÇÃO: Gráfico de Evolução (REAL) ───────────────────────────────────────

const OPCOES_EVOLUCAO: Array<[number, string]> = [
  [1, 'Última'], [3, 'Últ. 3'], [5, 'Últ. 5'], [10, 'Últ. 10'], [0, 'Desde o início'],
]

function SecaoEvolucao() {
  const [janela, setJanela] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    lerConfig<{ rodadas: number }>('evolucao_janela')
      .then((cfg) => setJanela(cfg?.rodadas ?? 0))
      .catch((e) => setMensagem(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  async function mudarJanela(j: number) {
    if (j === janela || salvando) return
    setSalvando(true); setMensagem(null)
    try {
      await salvarConfig('evolucao_janela', { rodadas: j })
      setJanela(j); setMensagem('Configuração salva.')
    } catch (e) { setMensagem(`Erro ao salvar: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">Controla quantas rodadas aparecem no gráfico "Evolução por Rodada" no Ranking.</p>
        {carregando ? <p className="font-sans text-xs text-tinta-100">Carregando...</p> : (
          <div className="flex flex-wrap gap-2">
            {OPCOES_EVOLUCAO.map(([val, label]) => (
              <button key={val} type="button" onClick={() => mudarJanela(val)} disabled={salvando}
                className={cx('rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors disabled:opacity-40',
                  janela === val ? 'border-dourado-400 bg-dourado-100 text-dourado-600' : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100')}>
                {label}
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 font-mono text-[10px] text-tinta-100">O gráfico será implementado na tela de Ranking.</p>
      </Card>
    </div>
  )
}

// ─── SEÇÃO: Esquema de Pontuação (fixo) ──────────────────────────────────────

function SecaoPontuacao() {
  const regras = [
    { desc: 'Placar exato (cravada)', pts: 5 },
    { desc: 'Saldo de gols certo', pts: 3 },
    { desc: 'Vencedor certo', pts: 1 },
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
      <p className="mt-3 font-mono text-[10px] text-tinta-100">Edição dinâmica ficará pra Fase 5.</p>
    </Card>
  )
}

// ─── SEÇÃO: Novidades (REAL) ──────────────────────────────────────────────────

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
      const { data, error } = await supabase.from('novidades').select('id, titulo, resumo, data').order('created_at', { ascending: false })
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
      const { error } = await supabase.from('novidades').insert({ titulo: titulo.trim(), resumo: resumo.trim() || null })
      if (error) throw error
      await gravarLog('NOVIDADE_PUBLICADA', { titulo })
      setTitulo(''); setResumo(''); setMensagem('Novidade publicada. 🆕')
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
        <p className="mb-3 font-sans text-sm text-tinta-200">Publique uma novidade pra aparecer como pop-up quando os participantes entrarem no app.</p>
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
        {carregando ? <p className="font-sans text-xs text-tinta-100">Carregando...</p>
          : lista.length === 0 ? <p className="font-sans text-xs text-tinta-100">Nenhuma novidade publicada.</p>
          : lista.map((n) => (
            <div key={n.id} className="flex items-start gap-2 border-b border-papel-borda-200 py-2.5 last:border-0">
              <div className="flex-1">
                <p className="font-sans text-sm font-semibold text-tinta-300">{n.titulo}</p>
                {n.resumo && <p className="mt-0.5 font-sans text-xs text-tinta-200">{n.resumo}</p>}
              </div>
              <button type="button" onClick={() => remover(n.id)} disabled={salvando}
                className="font-mono text-[10px] text-raridade-frango-selo hover:underline disabled:opacity-40">Remover</button>
            </div>
          ))}
      </Card>
    </div>
  )
}

// ─── SEÇÃO: Música Tema (placeholder) ────────────────────────────────────────

function SecaoMusica() {
  return <Card><p className="font-sans text-sm text-tinta-200">⚠ Portação real no próximo bloco (aguardando arquivos .mp3).</p></Card>
}

// ─── SEÇÃO: Conheça os Adms (REAL) ───────────────────────────────────────────

const ADM_VAZIO: Omit<AdminProfile, 'id'> = { nome: '', vulgo: null, foto: null, descricao: null, ordem: 0 }

function SecaoAdms() {
  const [lista, setLista] = useState<AdminProfile[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [editando, setEditando] = useState<(AdminProfile & { isNovo?: boolean }) | null>(null)

  async function carregar() {
    setCarregando(true)
    try { setLista(await buscarAdmins()) }
    catch (e) { setMensagem(`Erro ao carregar: ${(e as Error).message}`) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo() {
    setEditando({ ...ADM_VAZIO, id: '', ordem: (lista[lista.length - 1]?.ordem ?? 0) + 1, isNovo: true })
  }

  function abrirEditar(adm: AdminProfile) { setEditando({ ...adm }) }

  async function salvar() {
    if (!editando || !editando.nome.trim()) return
    setSalvando(true); setMensagem(null)
    try {
      await salvarAdmin({
        id: editando.isNovo ? undefined : editando.id,
        nome: editando.nome.trim(),
        vulgo: editando.vulgo?.trim() || null,
        foto: editando.foto?.trim() || null,
        descricao: editando.descricao?.trim() || null,
        ordem: editando.ordem,
      })
      await gravarLog(editando.isNovo ? 'ADM_ADICIONADO' : 'ADM_EDITADO', { nome: editando.nome })
      setEditando(null); setMensagem('Salvo.')
      await carregar()
    } catch (e) { setMensagem(`Erro ao salvar: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  async function remover(adm: AdminProfile) {
    if (!confirm(`Remover ${adm.nome} da lista de adms?`)) return
    setSalvando(true)
    try {
      await removerAdmin(adm.id)
      await gravarLog('ADM_REMOVIDO', { nome: adm.nome })
      setMensagem('Adm removido.')
      await carregar()
    } catch (e) { setMensagem(`Erro ao remover: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}

      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Gerencie os cards da seção "Conheça os Adms" — aparecem na tela inicial pra todos.
        </p>
        {carregando ? (
          <p className="font-sans text-xs text-tinta-100">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">Nenhum adm cadastrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {lista.map((adm) => (
              <div key={adm.id} className="flex items-center gap-3 rounded-lg border border-papel-borda-200 bg-papel-100 px-3 py-2.5">
                {adm.foto ? (
                  <img src={adm.foto} alt={adm.nome} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-dourado-100 font-display text-lg font-bold text-dourado-600">
                    {adm.nome[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-tinta-300 truncate">{adm.nome}</p>
                  {adm.vulgo && <p className="font-mono text-[10px] text-tinta-100 truncate">"{adm.vulgo}"</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => abrirEditar(adm)}
                    className="rounded border border-papel-borda-300 px-2 py-1 font-mono text-[10px] text-tinta-200 hover:bg-papel-200">Editar</button>
                  <button type="button" onClick={() => remover(adm)} disabled={salvando}
                    className="rounded border border-raridade-frango-selo/40 px-2 py-1 font-mono text-[10px] text-raridade-frango-selo hover:bg-red-50 disabled:opacity-40">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Btn variant="gold" onClick={abrirNovo} disabled={salvando}>+ Adicionar Adm</Btn>
        </div>
      </Card>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4">
          <div className="w-full max-w-sm rounded-lg border-2 border-dourado-300 bg-papel-50 p-5 shadow-xl">
            <p className="mb-4 font-display text-lg font-bold text-tinta-300">
              {editando.isNovo ? 'Novo Adm' : `Editar ${editando.nome}`}
            </p>
            <div className="space-y-2">
              <Row label="Nome *">
                <InputText value={editando.nome} onChange={(v) => setEditando((e) => e && ({ ...e, nome: v }))} placeholder="Nome real" className="flex-1" />
              </Row>
              <Row label="Vulgo">
                <InputText value={editando.vulgo ?? ''} onChange={(v) => setEditando((e) => e && ({ ...e, vulgo: v || null }))} placeholder="Apelido" className="flex-1" />
              </Row>
              <Row label="Foto URL">
                <InputText value={editando.foto ?? ''} onChange={(v) => setEditando((e) => e && ({ ...e, foto: v || null }))} placeholder="https://..." className="flex-1" />
              </Row>
              <Row label="Descrição">
                <textarea value={editando.descricao ?? ''} onChange={(e) => setEditando((ed) => ed && ({ ...ed, descricao: e.target.value || null }))}
                  placeholder="Breve descrição..." rows={2}
                  className="flex-1 resize-none rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none" />
              </Row>
              <Row label="Ordem">
                <input type="number" min={1} value={editando.ordem}
                  onChange={(e) => setEditando((ed) => ed && ({ ...ed, ordem: parseInt(e.target.value) || 1 }))}
                  className="w-16 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 text-center font-mono text-sm text-tinta-300 outline-none" />
              </Row>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setEditando(null)}>Cancelar</Btn>
              <Btn variant="gold" onClick={salvar} disabled={salvando || !editando.nome.trim()}>{salvando ? '...' : '💾 Salvar'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SEÇÃO: PINs dos Jogadores (REAL) ────────────────────────────────────────

function SecaoPINs() {
  const [participantes, setParticipantes] = useState<ParticipantePin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null) // id do participante sendo salvo
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [buf, setBuf] = useState<Record<string, string>>({}) // id → novo pin digitado

  useEffect(() => {
    buscarParticipantesPins()
      .then(setParticipantes)
      .catch((e) => setMensagem(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  async function handleSalvarPin(p: ParticipantePin) {
    const novoPin = buf[p.id]?.trim()
    if (!novoPin || novoPin === p.pin) return
    if (novoPin.length < 4) { setMensagem('PIN deve ter pelo menos 4 caracteres.'); return }
    setSalvando(p.id); setMensagem(null)
    try {
      await atualizarPin(p.id, novoPin)
      await gravarLog('PIN_ATUALIZADO', { participante: p.name })
      setParticipantes((ps) => ps.map((x) => x.id === p.id ? { ...x, pin: novoPin } : x))
      setBuf((b) => { const next = { ...b }; delete next[p.id]; return next })
      setMensagem(`PIN de ${p.name} atualizado.`)
    } catch (e) { setMensagem(`Erro: ${(e as Error).message}`) }
    finally { setSalvando(null) }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando...</p></Card>

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Altere o PIN de qualquer participante. O PIN atual é exibido — troque só quando necessário.
        </p>
        <div className="space-y-1">
          {participantes.map((p) => (
            <div key={p.id} className="flex items-center gap-2 border-b border-papel-borda-200/60 py-2 last:border-0">
              <span className="w-32 truncate font-sans text-sm text-tinta-300">{p.name}</span>
              <span className="font-mono text-xs text-tinta-100">atual: <b className="text-tinta-200">{p.pin}</b></span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="novo PIN"
                value={buf[p.id] ?? ''}
                onChange={(e) => setBuf((b) => ({ ...b, [p.id]: e.target.value }))}
                className="w-24 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1 text-center font-mono text-xs text-tinta-300 outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
              />
              <button
                type="button"
                disabled={!buf[p.id]?.trim() || salvando === p.id}
                onClick={() => handleSalvarPin(p)}
                className="rounded border border-papel-borda-300 px-2 py-1 font-mono text-[10px] text-tinta-200 hover:bg-papel-100 disabled:opacity-40"
              >
                {salvando === p.id ? '...' : '✓'}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── SEÇÃO: Log de Ações (REAL) ───────────────────────────────────────────────

function SecaoLog() {
  const [entradas, setEntradas] = useState<EntradaLog[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try { setEntradas(await buscarLog(50)) }
    catch (e) { setMensagem(`Erro ao carregar: ${(e as Error).message}`) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  function formatarData(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const ICONES: Record<string, string> = {
    RODADA_SALVA: '💾',
    RODADA_FINALIZADA: '✅',
    RODADA_REABERTA: '🔓',
    PALPITES_LIMPOS: '🗑',
    PONTOS_CALCULADOS: '⚡',
    PONTOS_CORRIGIDOS_MANUAL: '✏️',
    FRANGO_ATRIBUIDO: '🐔',
    NOVIDADE_PUBLICADA: '🆕',
    PIN_ATUALIZADO: '🔐',
    ADM_ADICIONADO: '👑',
    ADM_EDITADO: '✏️',
    ADM_REMOVIDO: '🗑',
    CAMPEONATO_FINALIZADO: '🏆',
  }

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}
      <div className="flex justify-end">
        <Btn variant="outline" onClick={carregar} disabled={carregando}>
          {carregando ? '...' : '↻ Atualizar'}
        </Btn>
      </div>
      <Card>
        <SubLabel>Últimas 50 ações</SubLabel>
        {carregando ? (
          <p className="font-sans text-xs text-tinta-100">Carregando...</p>
        ) : entradas.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">Nenhuma ação registrada ainda.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-0">
            {entradas.map((e) => (
              <div key={e.id} className="border-b border-papel-borda-200/60 py-2.5 last:border-0">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5">{ICONES[e.action] ?? '•'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold text-tinta-300">{e.action}</p>
                    {e.performed_by && (
                      <p className="font-sans text-[10px] text-tinta-100">por {e.performed_by}</p>
                    )}
                    {e.payload && Object.keys(e.payload).length > 0 && (
                      <p className="mt-0.5 font-mono text-[10px] text-tinta-100 truncate">
                        {Object.entries(e.payload).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 font-mono text-[10px] text-tinta-100">{formatarData(e.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── SEÇÃO: Finalizar Campeonato (REAL) ──────────────────────────────────────

function SecaoFinalizarCampeonato() {
  const [nomecamp, setNomecamp] = useState('Brasileirão Série A 2026')
  const [adminNome, setAdminNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [snapshots, setSnapshots] = useState<Array<{ id: string; nome: string; campeao: string; data_encerramento: string }>>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase
      .from('campeonatos_finalizados')
      .select('id, nome, campeao, data_encerramento')
      .order('data_encerramento', { ascending: false })
      .then(({ data }) => setSnapshots(data ?? []))
      .catch((e) => setMensagem(`Erro ao carregar: ${e.message}`))
      .finally(() => setCarregando(false))
  }, [])

  async function handleFinalizar() {
    setConfirmar(false); setSalvando(true); setMensagem(null)
    try {
      await finalizarCampeonato(nomecamp, adminNome || 'admin')
      setMensagem('Campeonato finalizado e snapshot salvo. 🏆')
      const { data } = await supabase
        .from('campeonatos_finalizados')
        .select('id, nome, campeao, data_encerramento')
        .order('data_encerramento', { ascending: false })
      setSnapshots(data ?? [])
    } catch (e) { setMensagem(`Erro: ${(e as Error).message}`) }
    finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
      {mensagem && <Card><p className="font-sans text-sm text-tinta-200">{mensagem}</p></Card>}

      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Encerra o campeonato atual — salva um snapshot permanente do ranking final
          em <b>campeonatos_finalizados</b>. O banco <b>não</b> é resetado automaticamente:
          após finalizar, rode o SQL de reset manualmente no Supabase.
        </p>
        <Row label="Nome">
          <InputText value={nomecamp} onChange={setNomecamp} placeholder="ex: Brasileirão 2026" className="flex-1" />
        </Row>
        <Row label="Seu nome">
          <InputText value={adminNome} onChange={setAdminNome} placeholder="Quem está finalizando?" className="flex-1" />
        </Row>
        <div className="mt-4">
          <Btn variant="danger" onClick={() => setConfirmar(true)} disabled={salvando || !nomecamp.trim()}>
            🏆 Finalizar Campeonato
          </Btn>
        </div>
      </Card>

      <Card>
        <SubLabel>SQL de reset (rode no Supabase após finalizar)</SubLabel>
        <pre className="overflow-x-auto rounded bg-tinta-300 p-3 font-mono text-[10px] text-papel-100 leading-relaxed">
{`-- ⚠ IRREVERSÍVEL — rode só após salvar o snapshot
truncate table predictions restart identity cascade;
truncate table rounds restart identity cascade;
truncate table matches restart identity cascade;
truncate table shame restart identity cascade;
truncate table admin_log restart identity cascade;
-- participants e admins_profile: NÃO truncar (mantém jogadores/adms)`}
        </pre>
      </Card>

      {snapshots.length > 0 && (
        <Card>
          <SubLabel>Campeonatos encerrados</SubLabel>
          {carregando ? (
            <p className="font-sans text-xs text-tinta-100">Carregando...</p>
          ) : (
            snapshots.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-papel-borda-200 py-2 last:border-0">
                <div>
                  <p className="font-sans text-sm font-semibold text-tinta-300">{s.nome}</p>
                  <p className="font-mono text-[10px] text-tinta-100">
                    🏆 {s.campeao} · {new Date(s.data_encerramento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4">
          <div className="w-full max-w-sm rounded-lg border-2 border-raridade-frango-selo bg-papel-50 p-5 shadow-xl">
            <p className="mb-2 font-display text-lg font-bold text-raridade-frango-selo">Tem certeza?</p>
            <p className="mb-4 font-sans text-sm text-tinta-200">
              Isso vai salvar o snapshot do ranking atual como <b>{nomecamp}</b>. O banco
              <b> não</b> será resetado automaticamente — você vai precisar rodar o SQL manualmente.
            </p>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setConfirmar(false)}>Cancelar</Btn>
              <Btn variant="danger" onClick={handleFinalizar}>🏆 Finalizar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────

const SECOES = [
  { key: 'whatsapp',  titulo: '📲 Compartilhar no WhatsApp', conteudo: <SecaoWhatsApp /> },
  { key: 'rodada',    titulo: '⚙ Configuração da Rodada',    conteudo: <SecaoConfiguracaoRodada /> },
  { key: 'resultado', titulo: '⚽ Resultado & Correção',      conteudo: <SecaoResultadoCorrecao /> },
  { key: 'frango',    titulo: '🐔 Frango da Rodada',          conteudo: <SecaoFrango /> },
  { key: 'reabrir',   titulo: '🔓 Reabrir Rodada',            conteudo: <SecaoReabrirRodada /> },
  { key: 'projecao',  titulo: '🔮 Projeção de Campeão',       conteudo: <SecaoProjecao /> },
  { key: 'evolucao',  titulo: '📈 Gráfico de Evolução',       conteudo: <SecaoEvolucao /> },
  { key: 'formacao',  titulo: '⚽ Alterar Formação',          conteudo: <SecaoAlterarFormacao /> },
  { key: 'pontuacao', titulo: '📐 Esquema de Pontuação',      conteudo: <SecaoPontuacao /> },
  { key: 'novidades', titulo: '🆕 Novidades',                 conteudo: <SecaoNovidades /> },
  { key: 'musica',    titulo: '🎵 Música Tema',               conteudo: <SecaoMusica /> },
  { key: 'adms',      titulo: '👑 Conheça os Adms',           conteudo: <SecaoAdms /> },
  { key: 'pins',      titulo: '🔐 PINs dos Jogadores',        conteudo: <SecaoPINs /> },
  { key: 'log',       titulo: '📋 Log de Ações',              conteudo: <SecaoLog /> },
  { key: 'finalizar', titulo: '🏆 Finalizar Campeonato',      conteudo: <SecaoFinalizarCampeonato /> },
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
        div>
      </div>
    </main>
  )
}
