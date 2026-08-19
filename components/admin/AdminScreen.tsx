'use client'

import { useEffect, useState } from 'react'
import { Accordion } from '@/components/home/Accordion'
import { Modal } from '@/components/home/Modal'
import { showToast } from '@/components/home/Toast'
import { vibrar } from '@/lib/haptic'
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
import { CardEnvelope } from '@/components/home/CardEnvelope'

const URL_APP = 'https://palpitao-brasileirao-iota.vercel.app'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

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

// ─── SEÇÃO: Compartilhar no WhatsApp ─────────────────────────────────────────

function SecaoWhatsApp() {
  const [carregando, setCarregando] = useState(false)

  const MEDALHAS = ['🥇', '🥈', '🥉']
  function posEmoji(i: number): string {
    return MEDALHAS[i] ?? `${i + 1}º`
  }

  async function montarTextoGeral(): Promise<string> {
    // Usa round_results (só rodadas finalizadas) — mesma fonte do Ranking oficial
    const { data: rrs, error } = await supabase
      .from('round_results')
      .select('participant_id, total_pts, round_id, rounds!inner(finalized, number)')
      .eq('rounds.finalized', true)
      .order('rounds(number)', { ascending: false })

    if (error) throw new Error(error.message)
    if (!rrs || rrs.length === 0) throw new Error('Nenhuma rodada finalizada ainda')

    // Pega o total_pts mais recente de cada participante
    const totalPorParticipante = new Map<string, number>()
    for (const rr of rrs) {
      if (!totalPorParticipante.has(rr.participant_id)) {
        totalPorParticipante.set(rr.participant_id, rr.total_pts ?? 0)
      }
    }

    // Busca nomes + filtra admin
    const { data: parts } = await supabase
      .from('participants')
      .select('id, name, is_admin')
      .eq('is_admin', false)

    if (!parts) throw new Error('Sem participantes')

    const ranking = parts
      .map((p) => ({ nome: p.name, total: totalPorParticipante.get(p.id) ?? 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    const linhas = ranking.map((r, i) => `${posEmoji(i)} ${r.nome} — ${r.total} pts`).join('\n')
    return `🏆 *RANKING GERAL — Palpitão Brasileirão*\n\n${linhas}\n\n🔥 Confira a tabela completa no App do Palpitão`
  }

  async function montarTextoParcial(): Promise<string> {
    const rodada = await buscarRodadaAtiva()
    if (!rodada.roundId) throw new Error('Nenhuma rodada ativa')

    const { data: matches } = await supabase.from('matches').select('id').eq('round_id', rodada.roundId)
    const matchIds = (matches ?? []).map((m) => m.id)
    if (matchIds.length === 0) {
      return `⚽ *${rodada.nome} — Palpitão Brasileirão*\n\nNenhum jogo cadastrado ainda.`
    }

    const [{ data: parts }, { data: preds }] = await Promise.all([
      supabase.from('participants').select('id, name, is_admin').eq('is_admin', false),
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
    return `⚽ *PARCIAL ${rodada.nome} — Palpitão Brasileirão*\n\n${linhas}\n\n🔥 Confira a tabela completa no App do Palpitão`
  }

  async function montarTextoRodadaLiberada(): Promise<string> {
    const rodada = await buscarRodadaAtiva()
    if (!rodada.roundId) throw new Error('Nenhuma rodada ativa')

    const { data: matches } = await supabase
      .from('matches')
      .select('home, away, match_date, match_time')
      .eq('round_id', rodada.roundId)
      .order('match_date', { ascending: true })
      .order('match_time', { ascending: true })

    if (!matches || matches.length === 0) {
      return `📢 *${rodada.nome} liberada!*\n\nSem jogos cadastrados ainda.`
    }

    function formatarDataHora(date: string | null, time: string | null): string {
      if (!date) return ''
      const [ano, mes, dia] = date.split('-')
      const dataStr = `${dia}/${mes}`
      const horaStr = time ? time.substring(0, 5) : ''
      return horaStr ? ` — ${dataStr} ${horaStr}` : ` — ${dataStr}`
    }

    const linhas = matches
      .map((m) => `⚽ ${m.home} × ${m.away}${formatarDataHora(m.match_date, m.match_time)}`)
      .join('\n')

    return `📢 *${rodada.nome} LIBERADA!*\n\nPalpites estão abertos, corram pro app!\n\n${linhas}\n\n🔥 Boa sorte, palpiteiros!`
  }

  async function share(tipo: 'geral' | 'parcial' | 'liberada') {
    setCarregando(true)
    vibrar('leve')
    try {
      let texto: string
      if (tipo === 'geral') texto = await montarTextoGeral()
      else if (tipo === 'parcial') texto = await montarTextoParcial()
      else texto = await montarTextoRodadaLiberada()

      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
      showToast('Abrindo WhatsApp...', 'info', 2000)
    } catch (e) {
      vibrar('erro')
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Card>
      <p className="mb-4 font-sans text-sm text-tinta-200">
        Envie um resumo direto no WhatsApp — dados reais do Supabase.
      </p>
      <div className="flex flex-wrap gap-3">
        <Btn variant="whatsapp" onClick={() => share('geral')} disabled={carregando}>
          {carregando ? '...' : '📊 Ranking Geral'}
        </Btn>
        <Btn variant="whatsapp" onClick={() => share('parcial')} disabled={carregando}>
          {carregando ? '...' : '⚽ Parcial da Rodada'}
        </Btn>
        <Btn variant="whatsapp" onClick={() => share('liberada')} disabled={carregando}>
          {carregando ? '...' : '📢 Rodada Liberada'}
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
  const [modalFinalizar, setModalFinalizar] = useState<'fechado' | 'confirmar' | 'aviso'>('fechado')
  const [jogosSemPlacar, setJogosSemPlacar] = useState<Array<{ id: string; home: string; away: string }>>([])
  const [ehExtra, setEhExtra] = useState(false)

  async function toggleExtra(v: boolean) {
    setEhExtra(v)
    if (v) {
      try {
        const { data } = await supabase
          .from('rounds').select('number').gte('number', 100)
          .order('number', { ascending: false }).limit(1)
        const proximo = data && data.length > 0 ? data[0].number + 1 : 100
        setNumero(proximo)
        if (!nome.toLowerCase().startsWith('extra')) setNome(`Extra ${proximo - 99}`)
      } catch { /* silencioso */ }
    } else {
      if (numero >= 100) setNumero(20)
    }
  }

  useEffect(() => {
    buscarRodadaAtiva()
      .then((r) => {
        setRoundId(r.roundId); setNome(r.nome); setNumero(r.numero)
        setAberta(r.aberta); setValeDobro(r.valeDobro)
        setJogos(r.jogos); setIdsOriginais(r.jogos.map((j) => j.id))
      })
      .catch((e) => {
        showToast(`Erro ao carregar: ${e.message}`, 'erro')
      })
      .finally(() => setCarregando(false))
  }, [])

  function addJogo() {
    vibrar('leve')
    setJogos((js) => [...js, { id: 'j' + Date.now(), home: '', away: '', date: '', time: '', locked: false }])
  }
  function removeJogo(id: string) {
    vibrar('leve')
    setJogos((js) => js.filter((j) => j.id !== id))
  }
  function patch(id: string, p: Partial<Jogo>) { setJogos((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j))) }

  async function handleSalvar() {
    setSalvando(true)
    try {
      const idFinal = await salvarRodada(roundId, nome, numero, aberta, valeDobro, jogos as JogoAdmin[], idsOriginais)
      setRoundId(idFinal)
      const atualizado = await buscarRodadaAtiva()
      setJogos(atualizado.jogos); setIdsOriginais(atualizado.jogos.map((j) => j.id))
      vibrar('sucesso')
      showToast('Rodada salva!', 'sucesso')
      await gravarLog('RODADA_SALVA', { nome, numero })
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao salvar: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  async function abrirFinalizar() {
    if (!roundId) return
    setSalvando(true)
    try {
      const faltando = await buscarJogosSemPlacar(roundId)
      setJogosSemPlacar(faltando)
      setModalFinalizar(faltando.length > 0 ? 'aviso' : 'confirmar')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao verificar jogos: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  async function confirmarFinalizar() {
    if (!roundId) return
    setSalvando(true); setModalFinalizar('fechado')
    try {
      await finalizarRodada(roundId)
      await gravarLog('RODADA_FINALIZADA', { roundId, nome })
      setAberta(false)
      vibrar('sucesso')
      showToast('Rodada finalizada! Pontos lançados no Ranking. 🏆', 'sucesso', 4000)
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao finalizar: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  async function handleLimparPalpites() {
    if (!roundId || !confirm('Apagar todos os palpites desta rodada? Não dá pra desfazer.')) return
    setSalvando(true)
    try {
      await limparPalpitesRodada(roundId)
      await gravarLog('PALPITES_LIMPOS', { roundId, nome })
      vibrar('medio')
      showToast('Palpites apagados.', 'aviso')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao limpar: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando rodada...</p></Card>

  return (
    <div className="space-y-3">
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
        <Row label="É extra">
          <Toggle checked={ehExtra} onChange={toggleExtra} />
          <span className="font-sans text-sm text-tinta-200">
            {ehExtra ? '🔀 Rodada extra (aparece como "E1", "E2"...)' : 'Rodada normal (R1–R38)'}
          </span>
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

      <Modal
        aberto={modalFinalizar === 'confirmar'}
        onFechar={() => setModalFinalizar('fechado')}
        borda="border-dourado-300"
      >
        <p className="mb-2 font-display text-lg font-bold text-tinta-300">Finalizar rodada?</p>
        <p className="mb-4 font-sans text-sm text-tinta-200">
          Isso é <b>definitivo</b> e lança tudo no <b>Ranking</b>. Se precisar corrigir depois, use <i>Reabrir Rodada</i>.
        </p>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setModalFinalizar('fechado')}>Cancelar</Btn>
          <Btn variant="green" onClick={confirmarFinalizar}>✔ Finalizar</Btn>
        </div>
      </Modal>

      <Modal
        aberto={modalFinalizar === 'aviso'}
        onFechar={() => setModalFinalizar('fechado')}
        borda="border-raridade-frango-selo"
      >
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
      </Modal>
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
      .catch((e) => showToast(`Erro ao carregar: ${e.message}`, 'erro'))
      .finally(() => setCarregando(false))
  }, [])

  function setField(id: string, field: 'h' | 'a', val: string) {
    setRes((r) => ({ ...r, [id]: { ...r[id], [field]: val } }))
  }

  async function handleCalcular() {
    if (!roundId) return
    setCalculando(true)
    try {
      const resultados: Record<string, { h: number; a: number }> = {}
      for (const j of jogos) {
        const h = res[j.id]?.h; const a = res[j.id]?.a
        if (h === '' || h === undefined || a === '' || a === undefined) continue
        resultados[j.id] = { h: parseInt(h, 10), a: parseInt(a, 10) }
      }
      await calcularPontosRodada(roundId, resultados, valeDobro)
      await gravarLog('PONTOS_CALCULADOS', { roundId })
      vibrar('sucesso')
      showToast('Pontos calculados! ⚡', 'sucesso')
      if (jogadorSel) {
        const p = participantes.find((x) => x.name === jogadorSel)
        if (p) setPalpites(await buscarPalpitesParticipante(roundId, p.id))
      }
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao calcular: ${(e as Error).message}`, 'erro')
    } finally { setCalculando(false) }
  }

  async function selecionarJogador(nome: string) {
    setJogadorSel(nome); setCorrecaoBuf({})
    if (!nome || !roundId) { setPalpites([]); return }
    setCarregandoPalpites(true)
    try {
      const p = participantes.find((x) => x.name === nome)
      if (p) setPalpites(await buscarPalpitesParticipante(roundId, p.id))
    } catch (e) {
      showToast(`Erro ao carregar palpites: ${(e as Error).message}`, 'erro')
    } finally { setCarregandoPalpites(false) }
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
      vibrar('sucesso')
      showToast('Correção aplicada!', 'sucesso')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao corrigir: ${(e as Error).message}`, 'erro')
    }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando rodada...</p></Card>
  if (!roundId) return <Card><p className="font-sans text-sm text-tinta-200">Nenhuma rodada encontrada.</p></Card>

  return (
    <div className="space-y-3">
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

// ─── SEÇÃO: Frango da Rodada ─────────────────────────────────────────────────

function SecaoFrango() {
  const [rodadas, setRodadas] = useState<Array<{ id: string; nome: string; finalizada: boolean }>>([])
  const [roundIdSelecionada, setRoundIdSelecionada] = useState<string>('')
  const [jogador, setJogador] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [texto, setTexto] = useState('')
  const [participantes, setParticipantes] = useState<Array<{ id: string; name: string }>>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Carrega lista de rodadas (todas finalizadas + ativa se houver)
  useEffect(() => {
    async function init() {
      setCarregando(true)
      try {
        const nomes = await buscarParticipantesNomes()
        setParticipantes(nomes)

        // Rodada ativa (se houver)
        const { data: ativa } = await supabase
          .from('rounds')
          .select('id, name, finalized')
          .eq('palpites_open', true)
          .order('number', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Todas finalizadas (ordem cronológica reversa)
        const { data: finalizadas } = await supabase
          .from('rounds')
          .select('id, name, finalized, number')
          .eq('finalized', true)
          .order('number', { ascending: false })

        // Junta: ativa primeiro (se existir), depois finalizadas
        const lista: Array<{ id: string; nome: string; finalizada: boolean }> = []
        if (ativa && !finalizadas?.some((r) => r.id === ativa.id)) {
          lista.push({ id: ativa.id, nome: `${ativa.name} (em andamento)`, finalizada: false })
        }
        for (const r of finalizadas ?? []) {
          lista.push({ id: r.id, nome: r.name, finalizada: true })
        }
        setRodadas(lista)

        // Pré-seleciona: rodada ativa se houver, senão a última finalizada
        const preselec = ativa?.id ?? finalizadas?.[0]?.id ?? ''
        setRoundIdSelecionada(preselec)
        if (preselec) await carregarFrangoDaRodada(preselec)
      } catch (e) {
        showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro')
      } finally {
        setCarregando(false)
      }
    }
    init()
  }, [])

  async function carregarFrangoDaRodada(rid: string) {
    setJogador(''); setTexto(''); setFotoUrl('')
    const { data } = await supabase
      .from('shame')
      .select('player_name, text, photo_url')
      .eq('round_id', rid)
      .maybeSingle()
    if (data) {
      setJogador(data.player_name ?? '')
      setTexto(data.text ?? '')
      setFotoUrl(data.photo_url ?? '')
    }
  }

  async function trocarRodada(rid: string) {
    setRoundIdSelecionada(rid)
    if (rid) await carregarFrangoDaRodada(rid)
  }

  async function salvar() {
    if (!roundIdSelecionada) return
    setSalvando(true)
    try {
      await supabase.from('shame').delete().eq('round_id', roundIdSelecionada)
      if (jogador.trim()) {
        const { error } = await supabase.from('shame').insert({
          round_id: roundIdSelecionada,
          player_name: jogador.trim(),
          text: texto.trim() || null,
          photo_url: fotoUrl.trim() || null,
        })
        if (error) throw error
        const rodadaNome = rodadas.find((r) => r.id === roundIdSelecionada)?.nome ?? ''
        await gravarLog('FRANGO_ATRIBUIDO', { roundId: roundIdSelecionada, jogador, rodada: rodadaNome })
      }
      vibrar('sucesso')
      showToast('Frango salvo! 🐔', 'sucesso')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao salvar: ${(e as Error).message}`, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function limpar() {
    if (!roundIdSelecionada) return
    setSalvando(true)
    try {
      await supabase.from('shame').delete().eq('round_id', roundIdSelecionada)
      setJogador(''); setFotoUrl(''); setTexto('')
      vibrar('leve')
      showToast('Frango removido.', 'info')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao limpar: ${(e as Error).message}`, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando...</p></Card>
  if (rodadas.length === 0) return <Card><p className="font-sans text-sm text-tinta-200">Nenhuma rodada disponível.</p></Card>

  const rodadaSel = rodadas.find((r) => r.id === roundIdSelecionada)

  return (
    <div className="space-y-3">
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Escolha a rodada e defina o frango — carinhosamente constrangedor. 🐔
        </p>
        <Row label="Rodada">
          <select
            value={roundIdSelecionada}
            onChange={(e) => trocarRodada(e.target.value)}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
          >
            {rodadas.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
        </Row>
        {rodadaSel && (
          <p className="mb-2 font-mono text-[10px] text-tinta-100">
            {rodadaSel.finalizada ? '✅ Rodada finalizada' : '🟡 Rodada em andamento'}
          </p>
        )}
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
  const [confirmar, setConfirmar] = useState(false)

  async function carregar() {
    setCarregando(true)
    try { setRodadas(await buscarRodadasFinalizadas()) }
    catch (e) { showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro') }
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
      vibrar('sucesso')
      showToast('Rodada reaberta! 🔓', 'sucesso')
      setSelecionada(''); await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao reabrir: ${(e as Error).message}`, 'erro')
    } finally { setReabrindo(false) }
  }

  const rodadaSel = rodadas.find((r) => r.id === selecionada)

  return (
    <div className="space-y-3">
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

      <Modal
        aberto={confirmar && !!rodadaSel}
        onFechar={() => setConfirmar(false)}
        borda="border-dourado-300"
      >
        {rodadaSel && (
          <>
            <p className="mb-2 font-display text-lg font-bold text-tinta-300">Reabrir {rodadaSel.name}?</p>
            <p className="mb-4 font-sans text-sm text-tinta-200">
              Ela sai do Ranking oficial e volta pro estado "em andamento". Pontos calculados permanecem.
            </p>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setConfirmar(false)}>Cancelar</Btn>
              <Btn variant="gold" onClick={handleReabrir}>🔓 Reabrir</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

// ─── SEÇÃO: Projeção de Campeão ──────────────────────────────────────────────

const OPCOES_JANELA: Array<[number, string]> = [
  [2, 'Últ. 2'], [3, 'Últ. 3'], [5, 'Últ. 5'], [10, 'Últ. 10'], [0, 'Campeonato inteiro'],
]

function SecaoProjecao() {
  const [janela, setJanela] = useState(3)
  const [carregando, setCarregando] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [projecoes, setProjecoes] = useState<Array<{ nome: string; pct: number }>>([])
  const [totalFinalizadas, setTotalFinalizadas] = useState(0)

  useEffect(() => {
    async function init() {
      try {
        const cfg = await lerConfig<{ rodadas: number }>('projecao_janela')
        const j = cfg?.rodadas ?? 3
        setJanela(j)
        await calcular(j)
      } catch (e) { showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro') }
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
    } catch (e) { showToast(`Erro ao calcular: ${(e as Error).message}`, 'erro') }
    finally { setCalculando(false) }
  }

  async function mudarJanela(j: number) {
    if (j === janela || calculando) return
    vibrar('leve')
    setJanela(j)
    try { await salvarConfig('projecao_janela', { rodadas: j }) } catch { /* silencioso */ }
    await calcular(j)
  }

  const maxPct = projecoes[0]?.pct ?? 1

  return (
    <div className="space-y-3">
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

// ─── SEÇÃO: Gráfico de Evolução ──────────────────────────────────────────────

const OPCOES_EVOLUCAO: Array<[number, string]> = [
  [1, 'Última'], [3, 'Últ. 3'], [5, 'Últ. 5'], [10, 'Últ. 10'], [0, 'Desde o início'],
]

function SecaoEvolucao() {
  const [janela, setJanela] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    lerConfig<{ rodadas: number }>('evolucao_janela')
      .then((cfg) => setJanela(cfg?.rodadas ?? 0))
      .catch((e) => showToast(`Erro ao carregar: ${e.message}`, 'erro'))
      .finally(() => setCarregando(false))
  }, [])

  async function mudarJanela(j: number) {
    if (j === janela || salvando) return
    setSalvando(true)
    try {
      await salvarConfig('evolucao_janela', { rodadas: j })
      setJanela(j)
      vibrar('sucesso')
      showToast('Configuração salva!', 'sucesso')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao salvar: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
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

// ─── SEÇÃO: Alterar Formação ─────────────────────────────────────────────────

function MiniCampo({ formacao }: { formacao: Formacao }) {
  return (
    <svg viewBox="0 0 100 120" className="h-24 w-20">
      <rect x="2" y="2" width="96" height="116" rx="4" fill="#0a3a1e" stroke="#1a5a3a" strokeWidth="1" />
      <line x1="2" y1="60" x2="98" y2="60" stroke="#1a5a3a" strokeWidth="0.5" />
      <circle cx="50" cy="60" r="8" fill="none" stroke="#1a5a3a" strokeWidth="0.5" />
      <rect x="30" y="2" width="40" height="12" fill="none" stroke="#1a5a3a" strokeWidth="0.5" />
      <rect x="30" y="106" width="40" height="12" fill="none" stroke="#1a5a3a" strokeWidth="0.5" />
      {formacao.posicoes.map((p, i) => {
        const cx = parseFloat(p.left)
        const cy = parseFloat(p.top) * 1.2
        return <circle key={i} cx={cx} cy={Math.min(cy, 118)} r="2.2" fill="#F0D060" stroke="#1a1a1a" strokeWidth="0.5" />
      })}
    </svg>
  )
}

function SecaoAlterarFormacao() {
  const [atual, setAtual] = useState<string>('4-3-3')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    lerFormacaoId()
      .then((id) => setAtual(id))
      .catch((e) => showToast(`Erro ao carregar: ${e.message}`, 'erro'))
      .finally(() => setCarregando(false))
  }, [])

  async function escolher(id: string) {
    if (id === atual || salvando) return
    setSalvando(true)
    try {
      await salvarFormacaoId(id)
      await gravarLog('FORMACAO_ALTERADA', { id, nome: getFormacao(id).nome })
      setAtual(id)
      vibrar('sucesso')
      showToast(`Formação alterada pra ${getFormacao(id).nome}! ⚽`, 'sucesso')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao salvar: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando formação...</p></Card>

  const classicas = FORMACOES.filter((f) => f.tipo === 'classica')
  const doidas = FORMACOES.filter((f) => f.tipo === 'doida')

  return (
    <div className="space-y-3">
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
            <button key={f.id} type="button" onClick={() => escolher(f.id)} disabled={salvando}
              className={cx('relative flex flex-col items-center gap-1 rounded-lg border-2 bg-papel-50 p-3 transition-all',
                ativa ? 'border-dourado-400 shadow-lg ring-2 ring-dourado-200' : 'border-papel-borda-200 hover:border-dourado-200 hover:bg-papel-100')}>
              {ativa && (
                <span className="absolute right-1.5 top-1.5 rounded border border-dourado-400 bg-dourado-100 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-dourado-700">ATUAL</span>
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
            <button key={f.id} type="button" onClick={() => escolher(f.id)} disabled={salvando}
              className={cx('relative flex flex-col items-center gap-1 rounded-lg border-2 bg-papel-50 p-3 transition-all',
                ativa ? 'border-dourado-400 shadow-lg ring-2 ring-dourado-200' : 'border-papel-borda-200 hover:border-dourado-200 hover:bg-papel-100')}>
              {ativa && (
                <span className="absolute right-1.5 top-1.5 rounded border border-dourado-400 bg-dourado-100 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-dourado-700">ATUAL</span>
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

// ─── SEÇÃO: Novidades ────────────────────────────────────────────────────────

function SecaoNovidades() {
  const [titulo, setTitulo] = useState('')
  const [resumo, setResumo] = useState('')
  const [lista, setLista] = useState<Array<{ id: string; titulo: string; resumo: string | null; data: string | null }>>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const { data, error } = await supabase.from('novidades').select('id, titulo, resumo, data').order('created_at', { ascending: false })
      if (error) throw error
      setLista(data ?? [])
    } catch (e) { showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  async function publicar() {
    if (!titulo.trim()) return
    setSalvando(true)
    try {
      const { error } = await supabase.from('novidades').insert({ titulo: titulo.trim(), resumo: resumo.trim() || null })
      if (error) throw error
      await gravarLog('NOVIDADE_PUBLICADA', { titulo })
      setTitulo(''); setResumo('')
      vibrar('sucesso')
      showToast('Novidade publicada! 🆕', 'sucesso')
      await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao publicar: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  async function remover(id: string) {
    setSalvando(true)
    try {
      const { error } = await supabase.from('novidades').delete().eq('id', id)
      if (error) throw error
      vibrar('leve')
      showToast('Novidade removida.', 'info')
      await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao remover: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
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

// ─── SEÇÃO: Música Tema ──────────────────────────────────────────────────────

function SecaoMusica() {
  type MusicaAdm = {
    id: string
    titulo: string
    artista: string
    arquivo: string
    ordem: number
    ativa: boolean
    is_tema: boolean
  }

  const [lista, setLista] = useState<MusicaAdm[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoArtista, setNovoArtista] = useState('')
  const [novoArquivo, setNovoArquivo] = useState('/')

  async function carregar() {
    setCarregando(true)
    try {
      const { data, error } = await supabase
        .from('musicas')
        .select('*')
        .order('ordem', { ascending: true })
      if (error) throw error
      setLista(data ?? [])
    } catch (e) {
      showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function marcarTema(id: string) {
    setSalvando(id)
    try {
      // Tira todos os is_tema primeiro
      await supabase.from('musicas').update({ is_tema: false }).eq('is_tema', true)
      // Marca a nova
      const { error } = await supabase.from('musicas').update({ is_tema: true }).eq('id', id)
      if (error) throw error
      await gravarLog('MUSICA_TEMA_ALTERADA', { id })
      vibrar('sucesso')
      showToast('Nova música tema definida! 👑', 'sucesso')
      await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(null) }
  }

  async function toggleAtiva(m: MusicaAdm) {
    if (m.is_tema && m.ativa) {
      showToast('Não dá pra desativar a música tema. Escolhe outra como tema primeiro.', 'aviso')
      return
    }
    setSalvando(m.id)
    try {
      const { error } = await supabase.from('musicas').update({ ativa: !m.ativa }).eq('id', m.id)
      if (error) throw error
      vibrar('leve')
      showToast(!m.ativa ? 'Música ativada.' : 'Música desativada.', 'info')
      await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(null) }
  }

  async function remover(m: MusicaAdm) {
    if (m.is_tema) {
      showToast('Não dá pra remover a música tema. Escolhe outra como tema primeiro.', 'aviso')
      return
    }
    if (!confirm(`Remover "${m.titulo}" da playlist?`)) return
    setSalvando(m.id)
    try {
      const { error } = await supabase.from('musicas').delete().eq('id', m.id)
      if (error) throw error
      await gravarLog('MUSICA_REMOVIDA', { titulo: m.titulo })
      vibrar('medio')
      showToast('Música removida.', 'aviso')
      await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(null) }
  }

  async function adicionar() {
    if (!novoTitulo.trim() || !novoArtista.trim() || !novoArquivo.trim()) return
    const arquivo = novoArquivo.startsWith('/') ? novoArquivo : `/${novoArquivo}`
    setSalvando('novo')
    try {
      const { data: ult } = await supabase
        .from('musicas').select('ordem')
        .order('ordem', { ascending: false }).limit(1).maybeSingle()
      const proximaOrdem = (ult?.ordem ?? -1) + 1

      const { error } = await supabase.from('musicas').insert({
        titulo: novoTitulo.trim(),
        artista: novoArtista.trim(),
        arquivo,
        ordem: proximaOrdem,
        ativa: true,
        is_tema: false,
      })
      if (error) throw error
      await gravarLog('MUSICA_ADICIONADA', { titulo: novoTitulo.trim() })
      vibrar('sucesso')
      showToast('Música adicionada! 🎵', 'sucesso')
      setNovoTitulo(''); setNovoArtista(''); setNovoArquivo('/')
      await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(null) }
  }

  return (
    <div className="space-y-3">
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Gerencie a playlist do player da Home. A música <b>tema</b> (👑) toca em loop.
          Outras músicas entram em modo sequencial quando o usuário troca.
        </p>
        <p className="mb-3 font-mono text-[10px] text-tinta-100">
          💡 Coloque o arquivo .mp3 na pasta <b>public/</b> pelo GitHub e cadastre aqui usando o caminho <b>/nome.mp3</b>.
        </p>
        {carregando ? (
          <p className="font-sans text-xs text-tinta-100">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">Nenhuma música cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {lista.map((m) => (
              <div
                key={m.id}
                className={cx(
                  'rounded-lg border p-3',
                  m.is_tema ? 'border-dourado-500 bg-dourado-50/40' : 'border-papel-borda-200 bg-papel-100',
                  !m.ativa && 'opacity-50',
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none flex-shrink-0">
                    {m.is_tema ? '👑' : '🎵'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-bold text-tinta-300 truncate">{m.titulo}</p>
                    <p className="font-mono text-[10px] text-tinta-100 truncate">{m.artista}</p>
                    <p className="mt-0.5 font-mono text-[9px] text-tinta-100 truncate">📁 {m.arquivo}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {!m.is_tema && (
                    <button
                      type="button"
                      onClick={() => marcarTema(m.id)}
                      disabled={salvando === m.id || !m.ativa}
                      className="rounded border border-dourado-400 bg-dourado-100 px-2 py-1 font-mono text-[10px] font-bold text-dourado-700 hover:bg-dourado-200 disabled:opacity-40"
                    >
                      👑 Marcar como Tema
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleAtiva(m)}
                    disabled={salvando === m.id}
                    className="rounded border border-papel-borda-300 px-2 py-1 font-mono text-[10px] text-tinta-200 hover:bg-papel-200 disabled:opacity-40"
                  >
                    {m.ativa ? '👁 Ativa' : '🚫 Desativada'}
                  </button>
                  {!m.is_tema && (
                    <button
                      type="button"
                      onClick={() => remover(m)}
                      disabled={salvando === m.id}
                      className="rounded border border-raridade-frango-selo/40 px-2 py-1 font-mono text-[10px] text-raridade-frango-selo hover:bg-red-50 disabled:opacity-40"
                    >
                      🗑 Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SubLabel>Adicionar nova música</SubLabel>
        <Row label="Título">
          <InputText value={novoTitulo} onChange={setNovoTitulo} placeholder="Ex: Waka Waka" className="flex-1" />
        </Row>
        <Row label="Artista">
          <InputText value={novoArtista} onChange={setNovoArtista} placeholder="Ex: Shakira" className="flex-1" />
        </Row>
        <Row label="Arquivo">
          <InputText value={novoArquivo} onChange={setNovoArquivo} placeholder="/nome_arquivo.mp3" className="flex-1" />
        </Row>
        <p className="mb-3 font-mono text-[10px] text-tinta-100">
          📁 Suba o .mp3 primeiro na pasta <b>public/</b> pelo GitHub. Ex: <b>/musica_nova.mp3</b>
        </p>
        <Btn
          variant="gold"
          onClick={adicionar}
          disabled={salvando === 'novo' || !novoTitulo.trim() || !novoArtista.trim() || !novoArquivo.trim() || novoArquivo === '/'}
        >
          {salvando === 'novo' ? '...' : '+ Adicionar'}
        </Btn>
      </Card>
    </div>
  )
}
// ─── SEÇÃO: Conheça os Adms ──────────────────────────────────────────────────

const ADM_VAZIO: Omit<AdminProfile, 'id'> = {
  nome: '',
  vulgo: null,
  foto: null,
  descricao: null,
  ordem: 0,
  rating: null,
  posicao: null,
  stat_pal: null,
  stat_ges: null,
  stat_jus: null,
  stat_zoa: null,
  stat_res: null,
  stat_cra: null,
  foto_scale: 1.0,
  foto_pos_x: 0,
  foto_pos_y: 0,
}

function SecaoAdms() {
  const [lista, setLista] = useState<AdminProfile[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState<(AdminProfile & { isNovo?: boolean }) | null>(null)

  async function carregar() {
    setCarregando(true)
    try { setLista(await buscarAdmins()) }
    catch (e) { showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo() {
    vibrar('leve')
    setEditando({ ...ADM_VAZIO, id: '', ordem: (lista[lista.length - 1]?.ordem ?? 0) + 1, isNovo: true })
  }

  function abrirEditar(adm: AdminProfile) {
    vibrar('leve')
    setEditando({ ...adm })
  }

  async function salvar() {
    if (!editando || !editando.nome.trim()) return
    setSalvando(true)
    try {
      await salvarAdmin({
        id: editando.isNovo ? undefined : editando.id,
        nome: editando.nome.trim(),
        vulgo: editando.vulgo?.trim() || null,
        foto: editando.foto?.trim() || null,
        descricao: editando.descricao?.trim() || null,
        ordem: editando.ordem,
        rating: editando.rating,
        posicao: editando.posicao?.trim() || null,
        stat_pal: editando.stat_pal,
        stat_ges: editando.stat_ges,
        stat_jus: editando.stat_jus,
        stat_zoa: editando.stat_zoa,
        stat_res: editando.stat_res,
        stat_cra: editando.stat_cra,
        foto_scale: editando.foto_scale,
        foto_pos_x: editando.foto_pos_x,
        foto_pos_y: editando.foto_pos_y,
      })
      await gravarLog(editando.isNovo ? 'ADM_ADICIONADO' : 'ADM_EDITADO', { nome: editando.nome })
      setEditando(null)
      vibrar('sucesso')
      showToast('Adm salvo!', 'sucesso')
      await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao salvar: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  async function remover(adm: AdminProfile) {
    if (!confirm(`Remover ${adm.nome} da lista de adms?`)) return
    setSalvando(true)
    try {
      await removerAdmin(adm.id)
      await gravarLog('ADM_REMOVIDO', { nome: adm.nome })
      vibrar('medio')
      showToast('Adm removido.', 'aviso')
      await carregar()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao remover: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Gerencie os cards da seção "Conheça os Adms" — aparecem na aba Guia pra todos.
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

      <Modal
        aberto={!!editando}
        onFechar={() => setEditando(null)}
        borda="border-dourado-300"
        className="max-h-[90vh] overflow-y-auto"
      >
        {editando && (
          <>
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

              <div className="mt-3 rounded-md border border-dourado-300 bg-dourado-50/40 p-2">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-dourado-700">
                  🃏 Card FIFA (opcional)
                </p>

                <Row label="Rating">
                  <input type="number" min={1} max={99} value={editando.rating ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : parseInt(e.target.value)
                      setEditando((ed) => ed && ({ ...ed, rating: v }))
                    }}
                    placeholder="99"
                    className="w-16 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 text-center font-mono text-sm text-tinta-300 outline-none" />
                  <span className="font-mono text-[10px] text-tinta-100">1 a 99</span>
                </Row>

                <Row label="Posição">
                  <InputText value={editando.posicao ?? ''}
                    onChange={(v) => setEditando((ed) => ed && ({ ...ed, posicao: v || null }))}
                    placeholder="ex: ADM, SUB-ADM"
                    className="flex-1" />
                </Row>

                {[
                  { key: 'stat_pal', label: 'PAL', desc: 'Palpiteiro' },
                  { key: 'stat_ges', label: 'GES', desc: 'Gestão' },
                  { key: 'stat_jus', label: 'JUS', desc: 'Justiça' },
                  { key: 'stat_zoa', label: 'ZOA', desc: 'Zoação' },
                  { key: 'stat_res', label: 'RES', desc: 'Resenha' },
                  { key: 'stat_cra', label: 'CRA', desc: 'Craque' },
                ].map((s) => (
                  <div key={s.key} className="flex items-center gap-2 py-1">
                    <span className="w-12 font-mono text-[10px] font-bold text-dourado-700">{s.label}</span>
                    <input type="number" min={1} max={99}
                      value={(editando as any)[s.key] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value === '' ? null : parseInt(e.target.value)
                        setEditando((ed) => ed && ({ ...ed, [s.key]: v }) as any)
                      }}
                      placeholder="—"
                      className="w-14 rounded border border-papel-borda-300 bg-papel-50 px-1 py-0.5 text-center font-mono text-xs text-tinta-300 outline-none" />
                    <span className="font-sans text-[10px] italic text-tinta-100">{s.desc}</span>
                  </div>
                ))}
              </div>

              {editando.foto && (
                <div className="mt-3 rounded-md border border-dourado-300 bg-dourado-50/40 p-2">
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-dourado-700">
                    🖼 Ajuste da Foto no Card
                  </p>

                  <div
                    className="mx-auto mb-2 relative overflow-hidden border-2 border-dourado-400 bg-blue-900"
                    style={{ width: 120, height: 140 }}
                  >
                    <img
                      src={editando.foto}
                      alt="preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center bottom',
                        transform: `translate(${editando.foto_pos_x ?? 0}%, ${editando.foto_pos_y ?? 0}%) scale(${editando.foto_scale ?? 1})`,
                        transformOrigin: 'center bottom',
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <span className="w-16 font-mono text-[10px] font-bold text-dourado-700">Escala</span>
                    <input
                      type="range" min="0.5" max="1.5" step="0.05"
                      value={editando.foto_scale ?? 1}
                      onChange={(e) => setEditando((ed) => ed && ({ ...ed, foto_scale: parseFloat(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="w-10 text-right font-mono text-[10px] text-tinta-300">
                      {(editando.foto_scale ?? 1).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <span className="w-16 font-mono text-[10px] font-bold text-dourado-700">Pos X</span>
                    <input
                      type="range" min="-30" max="30" step="1"
                      value={editando.foto_pos_x ?? 0}
                      onChange={(e) => setEditando((ed) => ed && ({ ...ed, foto_pos_x: parseFloat(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="w-10 text-right font-mono text-[10px] text-tinta-300">
                      {(editando.foto_pos_x ?? 0).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <span className="w-16 font-mono text-[10px] font-bold text-dourado-700">Pos Y</span>
                    <input
                      type="range" min="-30" max="30" step="1"
                      value={editando.foto_pos_y ?? 0}
                      onChange={(e) => setEditando((ed) => ed && ({ ...ed, foto_pos_y: parseFloat(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="w-10 text-right font-mono text-[10px] text-tinta-300">
                      {(editando.foto_pos_y ?? 0).toFixed(0)}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditando((ed) => ed && ({ ...ed, foto_scale: 1, foto_pos_x: 0, foto_pos_y: 0 }))}
                    className="mt-1 w-full rounded border border-papel-borda-300 bg-papel-100 py-1 font-mono text-[9px] uppercase tracking-wider text-tinta-200 hover:bg-papel-200"
                  >
                    ↺ Resetar
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setEditando(null)}>Cancelar</Btn>
              <Btn variant="gold" onClick={salvar} disabled={salvando || !editando.nome.trim()}>{salvando ? '...' : '💾 Salvar'}</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

// ─── SEÇÃO: PINs dos Jogadores ───────────────────────────────────────────────

function SecaoPINs() {
  const [participantes, setParticipantes] = useState<ParticipantePin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [buf, setBuf] = useState<Record<string, string>>({})

  useEffect(() => {
    buscarParticipantesPins()
      .then(setParticipantes)
      .catch((e) => showToast(`Erro ao carregar: ${e.message}`, 'erro'))
      .finally(() => setCarregando(false))
  }, [])

  async function handleSalvarPin(p: ParticipantePin) {
    const novoPin = buf[p.id]?.trim()
    if (!novoPin || novoPin === p.pin) return
    if (novoPin.length < 4) {
      vibrar('erro')
      showToast('PIN deve ter pelo menos 4 caracteres.', 'aviso')
      return
    }
    setSalvando(p.id)
    try {
      await atualizarPin(p.id, novoPin)
      await gravarLog('PIN_ATUALIZADO', { participante: p.name })
      setParticipantes((ps) => ps.map((x) => x.id === p.id ? { ...x, pin: novoPin } : x))
      setBuf((b) => { const next = { ...b }; delete next[p.id]; return next })
      vibrar('sucesso')
      showToast(`PIN de ${p.name} atualizado!`, 'sucesso')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(null) }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando...</p></Card>

  return (
    <div className="space-y-3">
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

// ─── SEÇÃO: Log de Ações ─────────────────────────────────────────────────────

function SecaoLog() {
  const [entradas, setEntradas] = useState<EntradaLog[]>([])
  const [carregando, setCarregando] = useState(true)
  const [participantes, setParticipantes] = useState<Array<{ id: string; name: string }>>([])
  const [filtroParticipanteId, setFiltroParticipanteId] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'admin' | 'usuario'>('todos')

  async function carregar() {
    setCarregando(true)
    try {
      const pid = filtroParticipanteId || undefined
      setEntradas(await buscarLog(200, pid))
    } catch (e) {
      showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() /* eslint-disable-next-line */ }, [filtroParticipanteId])

  useEffect(() => {
    buscarParticipantesNomes().then(setParticipantes).catch(() => { /* ignora */ })
  }, [])

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
    FORMACAO_ALTERADA: '⚽',
    CAMPEONATO_FINALIZADO: '🏆',
    MUSICA_TEMA_ALTERADA: '👑',
    MUSICA_ADICIONADA: '🎵',
    MUSICA_REMOVIDA: '🗑',
    PALPITE_SALVO: '📝',
    PALPITE_EDITADO: '✏️',
  }

  // Ações que são do usuário (não do admin)
  const ACOES_USUARIO = new Set(['PALPITE_SALVO', 'PALPITE_EDITADO'])

  const entradasFiltradas = entradas.filter((e) => {
    if (filtroTipo === 'todos') return true
    if (filtroTipo === 'usuario') return ACOES_USUARIO.has(e.action)
    return !ACOES_USUARIO.has(e.action)
  })

  function renderPayload(entrada: EntradaLog): React.ReactNode {
    if (!entrada.payload || Object.keys(entrada.payload).length === 0) return null

    // PALPITE_SALVO — mostra jogos e palpites
    if (entrada.action === 'PALPITE_SALVO' && Array.isArray(entrada.payload.jogos)) {
      return (
        <div className="mt-1 space-y-0.5">
          {entrada.payload.jogos.slice(0, 5).map((j: any, i: number) => (
            <p key={i} className="font-mono text-[10px] text-tinta-200">
              <span className="text-tinta-100">{j.jogo}</span>
              {' → '}
              <b className="text-verde-badge">{j.palpite}</b>
            </p>
          ))}
          {entrada.payload.jogos.length > 5 && (
            <p className="font-mono text-[9px] italic text-tinta-100">
              ... e mais {entrada.payload.jogos.length - 5} jogo(s)
            </p>
          )}
        </div>
      )
    }

    // PALPITE_EDITADO — mostra antes → depois
    if (entrada.action === 'PALPITE_EDITADO' && Array.isArray(entrada.payload.jogos)) {
      return (
        <div className="mt-1 space-y-0.5">
          {entrada.payload.jogos.slice(0, 5).map((j: any, i: number) => (
            <p key={i} className="font-mono text-[10px] text-tinta-200">
              <span className="text-tinta-100">{j.jogo}</span>
              {': '}
              <s className="text-raridade-frango-selo/70">{j.de}</s>
              {' → '}
              <b className="text-verde-badge">{j.para}</b>
            </p>
          ))}
          {entrada.payload.jogos.length > 5 && (
            <p className="font-mono text-[9px] italic text-tinta-100">
              ... e mais {entrada.payload.jogos.length - 5} jogo(s)
            </p>
          )}
        </div>
      )
    }

    // Genérico — chave: valor
    return (
      <p className="mt-0.5 font-mono text-[10px] text-tinta-100 truncate">
        {Object.entries(entrada.payload)
          .filter(([k]) => k !== 'jogos') // já renderizado acima
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join(' · ')}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <Card>
        <SubLabel>Filtros</SubLabel>
        <Row label="Participante">
          <select
            value={filtroParticipanteId}
            onChange={(e) => setFiltroParticipanteId(e.target.value)}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
          >
            <option value="">Todos os participantes</option>
            {participantes.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Row>
        <Row label="Tipo">
          <div className="flex gap-1.5">
            {(['todos', 'admin', 'usuario'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFiltroTipo(t)}
                className={cx(
                  'rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition-colors',
                  filtroTipo === t
                    ? 'border-dourado-400 bg-dourado-100 text-dourado-700'
                    : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100',
                )}
              >
                {t === 'todos' ? 'Todos' : t === 'admin' ? '👑 Admin' : '👤 Usuário'}
              </button>
            ))}
          </div>
        </Row>
        <div className="mt-2 flex justify-end">
          <Btn variant="outline" onClick={carregar} disabled={carregando}>
            {carregando ? '...' : '↻ Atualizar'}
          </Btn>
        </div>
      </Card>

      <Card>
        <SubLabel>
          {filtroTipo === 'todos' ? 'Últimas ações' : filtroTipo === 'admin' ? 'Ações do admin' : 'Ações dos usuários'}
          {filtroParticipanteId && (
            <span className="ml-1 normal-case text-tinta-200">
              — {participantes.find((p) => p.id === filtroParticipanteId)?.name}
            </span>
          )}
        </SubLabel>
        {carregando ? (
          <p className="font-sans text-xs text-tinta-100">Carregando...</p>
        ) : entradasFiltradas.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">Nenhuma ação registrada.</p>
        ) : (
          <div className="max-h-[500px] overflow-y-auto space-y-0 scrollbar-tema">
            {entradasFiltradas.map((e) => (
              <div key={e.id} className="border-b border-papel-borda-200/60 py-2.5 last:border-0">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{ICONES[e.action] ?? '•'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold text-tinta-300">{e.action}</p>
                    {e.performed_by && (
                      <p className="font-sans text-[10px] text-tinta-100">
                        por <b>{e.performed_by}</b>
                        {ACOES_USUARIO.has(e.action) && ' 👤'}
                      </p>
                    )}
                    {renderPayload(e)}
                  </div>
                  <span className="flex-shrink-0 font-mono text-[10px] text-tinta-100 whitespace-nowrap">
                    {formatarData(e.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── SEÇÃO: Finalizar Campeonato ─────────────────────────────────────────────

function SecaoFinalizarCampeonato() {
  const [nomecamp, setNomecamp] = useState('Brasileirão Série A 2026')
  const [adminNome, setAdminNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [snapshots, setSnapshots] = useState<Array<{ id: string; nome: string; campeao: string; data_encerramento: string }>>([])
  const [carregando, setCarregando] = useState(true)

  async function carregarSnapshots() {
    setCarregando(true)
    try {
      const { data } = await supabase
        .from('campeonatos_finalizados')
        .select('id, nome, campeao, data_encerramento')
        .order('data_encerramento', { ascending: false })
      setSnapshots(data ?? [])
    } catch (e) { showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregarSnapshots() }, [])

  async function handleFinalizar() {
    setConfirmar(false); setSalvando(true)
    try {
      await finalizarCampeonato(nomecamp, adminNome || 'admin')
      vibrar('sucesso')
      showToast('Campeonato finalizado e snapshot salvo! 🏆', 'sucesso', 4000)
      await carregarSnapshots()
    } catch (e) {
      vibrar('erro')
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
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
{`-- IRREVERSIVEL — rode so apos salvar o snapshot
truncate table predictions restart identity cascade;
truncate table rounds restart identity cascade;
truncate table matches restart identity cascade;
truncate table shame restart identity cascade;
truncate table admin_log restart identity cascade;
-- participants e admins_profile: NAO truncar (mantem jogadores/adms)`}
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

      <Modal
        aberto={confirmar}
        onFechar={() => setConfirmar(false)}
        borda="border-raridade-frango-selo"
      >
        <p className="mb-2 font-display text-lg font-bold text-raridade-frango-selo">Tem certeza?</p>
        <p className="mb-4 font-sans text-sm text-tinta-200">
          Isso vai salvar o snapshot do ranking atual como <b>{nomecamp}</b>. O banco
          <b> não</b> será resetado automaticamente — você vai precisar rodar o SQL manualmente.
        </p>
        <div className="flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setConfirmar(false)}>Cancelar</Btn>
          <Btn variant="danger" onClick={handleFinalizar}>🏆 Finalizar</Btn>
        </div>
      </Modal>
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
      <CardEnvelope variante="alerta" titulo="🔒 Acesso Restrito">
        <div className="p-6 text-center">
          <div className="mb-4 text-5xl">🔒</div>
          <p className="font-sans text-sm text-tinta-200">Esta área é exclusiva para administradores.</p>
        </div>
      </CardEnvelope>
    )
  }

  return (
    <>
      <CardEnvelope
        titulo="⚙ Admin"
        subtitulo="⚠ Área restrita — alterações afetam todos em tempo real"
      >
        {null}
      </CardEnvelope>
      <div className="flex flex-col gap-3">
        {SECOES.map((s) => (
          <Accordion key={s.key} titulo={s.titulo} storageKey={`admin-${s.key}`} defaultOpen={false}>
            {s.conteudo}
          </Accordion>
        ))}
      </div>
    </>
  )
}
