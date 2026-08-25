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
import { buscarRankingReal } from '@/lib/rankingReal'
import { getEscudo } from '@/lib/escudos'
import { FORMACOES, getFormacao, type Formacao } from '@/lib/formacoes'
import { lerConfig, salvarConfig, lerFormacaoId, salvarFormacaoId } from '@/lib/appSettings'
import { supabase } from '@/lib/supabase'
import { calcProjecaoPct } from '@/lib/domain/projecao'
import { CardEnvelope } from '@/components/home/CardEnvelope'

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

// ─── 1. SEÇÃO: Compartilhar no WhatsApp ───────────────────────────────────────

function SecaoWhatsApp() {
  const [carregando, setCarregando] = useState(false)

  const MEDALHAS = ['🥇', '🥈', '🥉']
  function posEmoji(i: number): string {
    return MEDALHAS[i] ?? `${i + 1}º`
  }

  async function montarTextoGeral(): Promise<string> {
    const ranking = await buscarRankingReal()
    if (!ranking || ranking.length === 0) throw new Error('Nenhum dado de ranking encontrado')

    const top5 = ranking.slice(0, 5)
    const linhas = top5.map((r, i) => `${posEmoji(i)} ${r.nome} — ${r.total} pts`).join('\n')
    return `🏆 *RANKING GERAL — Palpitão Brasileirão*\n\n${linhas}\n\n🔥 Confira a tabela completa no App do Palpitão`
  }

  async function montarTextoParcial(): Promise<string> {
    const rodada = await buscarRodadaAtiva()
    if (!rodada.roundId) throw new Error('Nenhuma rodada ativa encontrada')

    const { data: matches, error: mErr } = await supabase.from('matches').select('id').eq('round_id', rodada.roundId)
    if (mErr) throw mErr

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
    if (!rodada.roundId) throw new Error('Nenhuma rodada ativa encontrada')

    const { data: matches, error: mErr } = await supabase
      .from('matches')
      .select('home, away, match_date, match_time')
      .eq('round_id', rodada.roundId)
      .order('match_date', { ascending: true })

    if (mErr) throw mErr

    if (!matches || matches.length === 0) {
      return `📢 *${rodada.nome} LIBERADA!*\n\nSem jogos cadastrados ainda.`
    }

    function formatarDataHora(date: string | null, time: string | null): string {
      if (!date) return ''
      const [, mes, dia] = date.split('-')
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

      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`
      window.location.href = url
      showToast('Abrindo WhatsApp...', 'info', 2000)
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao compartilhar: ${(e as Error).message}`, 'erro')
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

// ─── 2. SEÇÃO: Configuração da Rodada (COM SELETOR DE RODADAS) ────────────────

type Jogo = { id: string; home: string; away: string; date: string; time: string; locked: boolean }

function SecaoConfiguracaoRodada() {
  const [listaRodadas, setListaRodadas] = useState<Array<{ id: string; number: number; name: string; finalized: boolean; palpites_open: boolean }>>([])
  const [roundId, setRoundId] = useState<string | null>(null)
  const [nome, setNome] = useState('Rodada 25')
  const [numero, setNumero] = useState(25)
  const [aberta, setAberta] = useState(true)
  const [valeDobro, setValeDobro] = useState(false)
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [idsOriginais, setIdsOriginais] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [modalFinalizar, setModalFinalizar] = useState<'fechado' | 'confirmar' | 'aviso'>('fechado')
  const [jogosSemPlacar, setJogosSemPlacar] = useState<Array<{ id: string; home: string; away: string }>>([])
  const [ehExtra, setEhExtra] = useState(false)

  async function carregarListaRodadas() {
    const { data } = await supabase
      .from('rounds')
      .select('id, number, name, finalized, palpites_open')
      .order('number', { ascending: true })
    if (data) setListaRodadas(data)
    return data ?? []
  }

  async function carregarRodadaPorId(id: string) {
    setCarregando(true)
    try {
      const { data: round } = await supabase
        .from('rounds')
        .select('id, number, name, palpites_open, finalized, is_double')
        .eq('id', id)
        .single()

      if (!round) return

      const { data: matches } = await supabase
        .from('matches')
        .select('id, home, away, match_date, match_time, travado_manual')
        .eq('round_id', round.id)

      setRoundId(round.id)
      setNome(round.name)
      setNumero(round.number)
      setAberta(round.palpites_open)
      setValeDobro(round.is_double ?? false)
      setEhExtra(round.number >= 100)

      const jogosMapeados: Jogo[] = (matches ?? []).map((m) => ({
        id: m.id,
        home: m.home,
        away: m.away,
        date: m.match_date ?? '',
        time: m.match_time?.slice(0, 5) ?? '',
        locked: m.travado_manual ?? false,
      }))

      setJogos(jogosMapeados)
      setIdsOriginais(jogosMapeados.map((j) => j.id))
    } catch (e) {
      showToast(`Erro ao carregar rodada: ${(e as Error).message}`, 'erro')
    } finally {
      setCarregando(false)
    }
  }

  function iniciarNovaRodada(numAtual: number) {
    setRoundId(null)
    setNome(`Rodada ${numAtual + 1}`)
    setNumero(numAtual + 1)
    setAberta(true)
    setValeDobro(false)
    setJogos([])
    setIdsOriginais([])
  }

  useEffect(() => {
    carregarListaRodadas().then(() => {
      buscarRodadaAtiva()
        .then((r) => {
          if (r.roundId) carregarRodadaPorId(r.roundId)
        })
        .catch((e) => showToast(`Erro ao carregar: ${e.message}`, 'erro'))
        .finally(() => setCarregando(false))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await carregarListaRodadas()
      await carregarRodadaPorId(idFinal)
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
      await carregarListaRodadas()
      vibrar('sucesso')
      showToast('Rodada finalizada! Pontos lançados no Ranking. 🏆', 'sucesso', 4000)
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao finalizar: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  if (carregando) return <Card><p className="font-sans text-sm text-tinta-200">Carregando rodada...</p></Card>

  return (
    <div className="space-y-3">
      <Card>
        <Row label="Selecionar">
          <select
            value={roundId ?? ''}
            onChange={(e) => {
              if (e.target.value === 'nova') {
                iniciarNovaRodada(listaRodadas[listaRodadas.length - 1]?.number ?? 24)
              } else if (e.target.value) {
                carregarRodadaPorId(e.target.value)
              }
            }}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm font-semibold text-tinta-300 outline-none"
          >
            {listaRodadas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.palpites_open ? '🟢 (Aberta)' : r.finalized ? '✅ (Finalizada)' : '🔒 (Fechada)'}
              </option>
            ))}
            <option value="nova">+ Criar Nova Rodada do Zero</option>
          </select>
        </Row>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between border-b border-papel-borda-200/60 pb-2">
          <p className="font-sans text-sm font-semibold text-tinta-300">
            {roundId ? `✏️ Editando ${nome}` : '✨ Criando Nova Rodada'}
          </p>
        </div>
        <Row label="Nome"><InputText value={nome} onChange={setNome} placeholder="ex: Rodada 25" className="flex-1" /></Row>
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
            <input
              type="date"
              value={j.date}
              onChange={(e) => patch(j.id, { date: e.target.value })}
              className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
            />
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
      </div>

      <Modal
        aberto={modalFinalizar === 'confirmar'}
        onFechar={() => setModalFinalizar('fechado')}
        borda="border-dourado-300"
      >
        <p className="mb-2 font-display text-lg font-bold text-tinta-300">Finalizar {nome}?</p>
        <p className="mb-4 font-sans text-sm text-tinta-200">
          Isso é <b>definitivo</b> e lança tudo no <b>Ranking Oficial</b>.
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
        <p className="mb-2 font-display text-lg font-bold text-raridade-frango-selo">Atenção!</p>
        <p className="mb-3 font-sans text-sm text-tinta-200">Faltou lançar o resultado destes jogos:</p>
        <ul className="mb-4 max-h-48 overflow-y-auto rounded border border-papel-borda-200 bg-papel-100 px-3 py-2">
          {jogosSemPlacar.map((j) => (
            <li key={j.id} className="border-b border-papel-borda-200/60 py-1 font-sans text-xs text-tinta-300 last:border-0">
              {j.home} × {j.away}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-end gap-2">
          <Btn variant="outline" onClick={() => setModalFinalizar('fechado')}>Voltar</Btn>
          <Btn variant="danger" onClick={confirmarFinalizar}>Finalizar mesmo assim</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── 3. SEÇÃO: Resultado & Correção (COM SELETOR DE RODADAS) ─────────────────

type Placar = { h: string; a: string }

function SecaoResultadoCorrecao() {
  const [listaRodadas, setListaRodadas] = useState<Array<{ id: string; number: number; name: string }>>([])
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

  async function carregarRodadaParaPlacares(rid: string) {
    setCarregando(true)
    try {
      const { data: round } = await supabase.from('rounds').select('id, is_double').eq('id', rid).single()
      if (!round) return
      setRoundId(round.id)
      setValeDobro(round.is_double ?? false)

      const { data: matches } = await supabase
        .from('matches')
        .select('id, home, away, home_score, away_score')
        .eq('round_id', rid)

      const lista = matches ?? []
      setJogos(lista)
      setRes(Object.fromEntries(lista.map((j) => [j.id, { h: j.home_score?.toString() ?? '', a: j.away_score?.toString() ?? '' }])))
    } catch (e) {
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    Promise.all([
      supabase.from('rounds').select('id, number, name').order('number', { ascending: false }),
      buscarParticipantesNomes(),
      buscarRodadaAtiva(),
    ]).then(([rRes, nomes, ativa]) => {
      if (rRes.data) setListaRodadas(rRes.data)
      setParticipantes(nomes)
      const inicial = ativa.roundId ?? rRes.data?.[0]?.id
      if (inicial) carregarRodadaParaPlacares(inicial)
    }).finally(() => setCarregando(false))
  }, [])

  function setField(id: string, field: 'h' | 'a', val: string) {
    setRes((r) => ({ ...r, [id]: { ...r[id], [field]: val } }))
  }

  async function handleCalcular() {
    if (!roundId) return
    setCalculando(true)
    try {
      const resultados: Record<string, { h: number; a: number }> = {}
      const apagados: string[] = []

      for (const j of jogos) {
        const h = res[j.id]?.h; const a = res[j.id]?.a
        if (h === '' || h === undefined || a === '' || a === undefined) {
          apagados.push(j.id)
          continue
        }
        resultados[j.id] = { h: parseInt(h, 10), a: parseInt(a, 10) }
      }

      await calcularPontosRodada(roundId, resultados, valeDobro)

      if (apagados.length > 0) {
        await supabase.from('matches').update({ home_score: null, away_score: null }).in('id', apagados)
        await supabase.from('predictions').update({ points: null }).in('match_id', apagados)
      }

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

  return (
    <div className="space-y-3">
      <Card>
        <Row label="Rodada">
          <select
            value={roundId ?? ''}
            onChange={(e) => carregarRodadaParaPlacares(e.target.value)}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm font-semibold text-tinta-300 outline-none"
          >
            {listaRodadas.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Row>
      </Card>

      {carregando ? (
        <Card><p className="font-sans text-sm text-tinta-200">Carregando jogos...</p></Card>
      ) : (
        <Card>
          {valeDobro && <p className="mb-3 font-sans text-xs font-bold text-dourado-600">⚡ Esta rodada vale pontuação em dobro</p>}
          {jogos.map((j) => (
            <div key={j.id} className="border-b border-papel-borda-200 py-2.5 last:border-0">
              <p className="mb-1.5 font-sans text-sm font-semibold text-tinta-300">{j.home} × {j.away}</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-tinta-100">Placar:</span>
                <input type="number" inputMode="numeric" min={0} value={res[j.id]?.h ?? ''}
                  onChange={(e) => setField(j.id, 'h', e.target.value)} placeholder="—"
                  className="w-12 rounded border border-papel-borda-300 bg-papel-50 px-1 py-1 text-center font-mono text-sm text-tinta-300 outline-none" />
                <span className="text-tinta-100">×</span>
                <input type="number" inputMode="numeric" min={0} value={res[j.id]?.a ?? ''}
                  onChange={(e) => setField(j.id, 'a', e.target.value)} placeholder="—"
                  className="w-12 rounded border border-papel-borda-300 bg-papel-50 px-1 py-1 text-center font-mono text-sm text-tinta-300 outline-none" />
              </div>
            </div>
          ))}
          <div className="mt-3 space-y-2">
            <Btn variant="gold" onClick={handleCalcular} disabled={calculando}>
              {calculando ? '...' : '⚡ Calcular Pontos Automaticamente'}
            </Btn>
          </div>
        </Card>
      )}

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

// ─── 4. SEÇÃO: Frango da Rodada ──────────────────────────────────────────────

function SecaoFrango() {
  const [rodadas, setRodadas] = useState<Array<{ id: string; nome: string; finalizada: boolean }>>([])
  const [roundIdSelecionada, setRoundIdSelecionada] = useState<string>('')
  const [jogador, setJogador] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [texto, setTexto] = useState('')
  const [participantes, setParticipantes] = useState<Array<{ id: string; name: string }>>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function init() {
      setCarregando(true)
      try {
        const nomes = await buscarParticipantesNomes()
        setParticipantes(nomes)

        const { data: ativa } = await supabase
          .from('rounds')
          .select('id, name, finalized')
          .eq('palpites_open', true)
          .order('number', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { data: finalizadas } = await supabase
          .from('rounds')
          .select('id, name, finalized, number')
          .eq('finalized', true)
          .order('number', { ascending: false })

        const lista: Array<{ id: string; nome: string; finalizada: boolean }> = []
        if (ativa && !finalizadas?.some((r) => r.id === ativa.id)) {
          lista.push({ id: ativa.id, nome: `${ativa.name} (em andamento)`, finalizada: false })
        }
        for (const r of finalizadas ?? []) {
          lista.push({ id: r.id, nome: r.name, finalizada: true })
        }
        setRodadas(lista)

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

// ─── 5. SEÇÃO: Reabrir Rodada ─────────────────────────────────────────────────

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
              Ela sai do Ranking oficial e volta pro estado "em andamento".
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

// ─── 6. SEÇÃO: Projeção de Campeão ───────────────────────────────────────────

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

  async function salvar(j: number) {
    vibrar('leve')
    setCalculando(true)
    try {
      await salvarConfig('projecao_janela', { rodadas: j })
      await gravarLog('PROJECAO_JANELA_ALTERADA', { rodadas: j })
      setJanela(j)
      await calcular(j)
      vibrar('sucesso')
      showToast('Janela de projeção salva no banco!', 'sucesso')
    } catch (e) {
      vibrar('erro')
      showToast(`Erro ao salvar: ${(e as Error).message}`, 'erro')
    } finally {
      setCalculando(false)
    }
  }

  const maxPct = projecoes[0]?.pct ?? 1

  return (
    <div className="space-y-3">
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">Define quantas rodadas usar pra calcular a chance de cada um ser campeão no Ranking.</p>
        <div className="flex flex-wrap gap-2">
          {OPCOES_JANELA.map(([val, label]) => (
            <button key={val} type="button" onClick={() => setJanela(val)} disabled={calculando || carregando}
              className={cx('rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors disabled:opacity-40',
                janela === val ? 'border-dourado-400 bg-dourado-100 text-dourado-600' : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100')}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="outline" onClick={() => calcular(janela)} disabled={calculando}>🔄 Preview</Btn>
          <Btn variant="gold" onClick={() => salvar(janela)} disabled={calculando}>💾 Salvar no Ranking</Btn>
        </div>
      </Card>
      <Card>
        <SubLabel>
          Preview — projeção atual
          {totalFinalizadas > 0 && <span className="ml-1 normal-case">({totalFinalizadas} rodadas)</span>}
        </SubLabel>
        {carregando || calculando ? (
          <p className="font-sans text-xs text-tinta-100">Calculando...</p>
        ) : projecoes.length === 0 ? (
          <p className="font-sans text-xs text-tinta-100">Sem dados suficientes.</p>
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

// ─── 7. SEÇÃO: Gráfico de Evolução ───────────────────────────────────────────

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
      </Card>
    </div>
  )
}

// ─── 8. SEÇÃO: Alterar Formação ──────────────────────────────────────────────

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
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 9. SEÇÃO: Esquema de Pontuação (fixo) ───────────────────────────────────

function SecaoPontuacao() {
  const regras = [
    { desc: 'Placar exato (cravada)', pts: 5 },
    { desc: 'Saldo de gols certo', pts: 3 },
    { desc: 'Vencedor certo', pts: 1 },
  ]
  return (
    <Card>
      <SubLabel>Regras da liga (fixas — critérios exclusivos)</SubLabel>
      {regras.map((r, i) => (
        <div key={i} className="flex items-center justify-between border-b border-papel-borda-200 py-2 last:border-0">
          <span className="font-sans text-sm text-tinta-300">{r.desc}</span>
          <span className="font-mono text-sm font-bold text-dourado-500">{r.pts} pts</span>
        </div>
      ))}
    </Card>
  )
}

// ─── 10. SEÇÃO: Novidades ────────────────────────────────────────────────────

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
        <p className="mb-3 font-sans text-sm text-tinta-200">Publique uma novidade pra aparecer como pop-up pros participantes.</p>
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

// ─── 11. SEÇÃO: Música Tema ──────────────────────────────────────────────────

function SecaoMusica() {
  type MusicaAdm = { id: string; titulo: string; artista: string; arquivo: string; ordem: number; ativa: boolean; is_tema: boolean }
  const [lista, setLista] = useState<MusicaAdm[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoArtista, setNovoArtista] = useState('')
  const [novoArquivo, setNovoArquivo] = useState('/')

  async function carregar() {
    setCarregando(true)
    try {
      const { data, error } = await supabase.from('musicas').select('*').order('ordem', { ascending: true })
      if (error) throw error
      setLista(data ?? [])
    } catch (e) {
      showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro')
    } finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  async function marcarTema(id: string) {
    setSalvando(id)
    try {
      await supabase.from('musicas').update({ is_tema: false }).eq('is_tema', true)
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
      showToast('Não dá pra desativar a música tema.', 'aviso')
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
      showToast('Não dá pra remover a música tema.', 'aviso')
      return
    }
    if (!confirm(`Remover "${m.titulo}"?`)) return
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
      const { data: ult } = await supabase.from('musicas').select('ordem').order('ordem', { ascending: false }).limit(1).maybeSingle()
      const proximaOrdem = (ult?.ordem ?? -1) + 1

      const { error } = await supabase.from('musicas').insert({
        titulo: novoTitulo.trim(), artista: novoArtista.trim(), arquivo, ordem: proximaOrdem, ativa: true, is_tema: false,
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
        <p className="mb-3 font-sans text-sm text-tinta-200">Gerencie a playlist do player da Home.</p>
        {carregando ? <p className="font-sans text-xs text-tinta-100">Carregando...</p> : (
          <div className="space-y-2">
            {lista.map((m) => (
              <div key={m.id} className={cx('rounded-lg border p-3', m.is_tema ? 'border-dourado-500 bg-dourado-50/40' : 'border-papel-borda-200 bg-papel-100', !m.ativa && 'opacity-50')}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{m.is_tema ? '👑' : '🎵'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-bold text-tinta-300 truncate">{m.titulo}</p>
                    <p className="font-mono text-[10px] text-tinta-100 truncate">{m.artista}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {!m.is_tema && (
                    <button type="button" onClick={() => marcarTema(m.id)} disabled={salvando === m.id || !m.ativa}
                      className="rounded border border-dourado-400 bg-dourado-100 px-2 py-1 font-mono text-[10px] font-bold text-dourado-700 hover:bg-dourado-200 disabled:opacity-40">👑 Marcar como Tema</button>
                  )}
                  <button type="button" onClick={() => toggleAtiva(m)} disabled={salvando === m.id}
                    className="rounded border border-papel-borda-300 px-2 py-1 font-mono text-[10px] text-tinta-200 hover:bg-papel-200 disabled:opacity-40">{m.ativa ? '👁 Ativa' : '🚫 Desativada'}</button>
                  {!m.is_tema && (
                    <button type="button" onClick={() => remover(m)} disabled={salvando === m.id}
                      className="rounded border border-raridade-frango-selo/40 px-2 py-1 font-mono text-[10px] text-raridade-frango-selo hover:bg-red-50 disabled:opacity-40">🗑 Remover</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SubLabel>Adicionar nova música</SubLabel>
        <Row label="Título"><InputText value={novoTitulo} onChange={setNovoTitulo} placeholder="Ex: Waka Waka" className="flex-1" /></Row>
        <Row label="Artista"><InputText value={novoArtista} onChange={setNovoArtista} placeholder="Ex: Shakira" className="flex-1" /></Row>
        <Row label="Arquivo"><InputText value={novoArquivo} onChange={setNovoArquivo} placeholder="/nome_arquivo.mp3" className="flex-1" /></Row>
        <Btn variant="gold" onClick={adicionar} disabled={salvando === 'novo' || !novoTitulo.trim() || !novoArtista.trim() || !novoArquivo.trim() || novoArquivo === '/'}>
          {salvando === 'novo' ? '...' : '+ Adicionar'}
        </Btn>
      </Card>
    </div>
  )
}

// ─── 12. SEÇÃO: Conheça os Adms (COM EDITORES DO CARD FIFA) ───────────────────

const ADM_VAZIO: Omit<AdminProfile, 'id'> = {
  nome: '', vulgo: null, foto: null, descricao: null, ordem: 0, rating: null, posicao: null,
  stat_pal: null, stat_ges: null, stat_jus: null, stat_zoa: null, stat_res: null, stat_cra: null,
  foto_scale: 1.0, foto_pos_x: 0, foto_pos_y: 0,
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
    if (!confirm(`Remover ${adm.nome}?`)) return
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
        <p className="mb-3 font-sans text-sm text-tinta-200">Gerencie os cards da seção "Conheça os Adms".</p>
        {carregando ? <p className="font-sans text-xs text-tinta-100">Carregando...</p> : (
          <div className="space-y-2">
            {lista.map((adm) => (
              <div key={adm.id} className="flex items-center gap-3 rounded-lg border border-papel-borda-200 bg-papel-100 px-3 py-2.5">
                {adm.foto ? (
                  <img src={adm.foto} alt={adm.nome} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-dourado-100 font-display text-lg font-bold text-dourado-600">{adm.nome[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-tinta-300 truncate">{adm.nome}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => abrirEditar(adm)} className="rounded border border-papel-borda-300 px-2 py-1 font-mono text-[10px] text-tinta-200 hover:bg-papel-200">Editar</button>
                  <button type="button" onClick={() => remover(adm)} disabled={salvando} className="rounded border border-raridade-frango-selo/40 px-2 py-1 font-mono text-[10px] text-raridade-frango-selo hover:bg-red-50 disabled:opacity-40">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Btn variant="gold" onClick={abrirNovo} disabled={salvando}>+ Adicionar Adm</Btn>
        </div>
      </Card>

      <Modal aberto={!!editando} onFechar={() => setEditando(null)} borda="border-dourado-300" className="max-h-[90vh] overflow-y-auto">
        {editando && (
          <>
            <p className="mb-4 font-display text-lg font-bold text-tinta-300">{editando.isNovo ? 'Novo Adm' : `Editar ${editando.nome}`}</p>
            <div className="space-y-2">
              <Row label="Nome *"><InputText value={editando.nome} onChange={(v) => setEditando((e) => e && ({ ...e, nome: v }))} placeholder="Nome real" className="flex-1" /></Row>
              <Row label="Vulgo"><InputText value={editando.vulgo ?? ''} onChange={(v) => setEditando((e) => e && ({ ...e, vulgo: v || null }))} placeholder="Apelido" className="flex-1" /></Row>
              <Row label="Foto URL"><InputText value={editando.foto ?? ''} onChange={(v) => setEditando((e) => e && ({ ...e, foto: v || null }))} placeholder="https://..." className="flex-1" /></Row>
              <Row label="Descrição">
                <textarea value={editando.descricao ?? ''} onChange={(e) => setEditando((ed) => ed && ({ ...ed, descricao: e.target.value || null }))} placeholder="Breve descrição..." rows={2} className="flex-1 resize-none rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none" />
              </Row>

              <div className="mt-3 rounded-md border border-dourado-300 bg-dourado-50/40 p-2">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-dourado-700">🃏 Card FIFA</p>
                <Row label="Rating">
                  <input type="number" min={1} max={99} value={editando.rating ?? ''} onChange={(e) => setEditando((ed) => ed && ({ ...ed, rating: e.target.value === '' ? null : parseInt(e.target.value) }))} className="w-16 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1 text-center font-mono text-sm text-tinta-300 outline-none" />
                </Row>
                <Row label="Posição"><InputText value={editando.posicao ?? ''} onChange={(v) => setEditando((ed) => ed && ({ ...ed, posicao: v || null }))} placeholder="ex: ADM" className="flex-1" /></Row>
                {[
                  { key: 'stat_pal', label: 'PAL' }, { key: 'stat_ges', label: 'GES' }, { key: 'stat_jus', label: 'JUS' },
                  { key: 'stat_zoa', label: 'ZOA' }, { key: 'stat_res', label: 'RES' }, { key: 'stat_cra', label: 'CRA' },
                ].map((s) => (
                  <div key={s.key} className="flex items-center gap-2 py-1">
                    <span className="w-12 font-mono text-[10px] font-bold text-dourado-700">{s.label}</span>
                    <input type="number" min={1} max={99} value={(editando as any)[s.key] ?? ''} onChange={(e) => setEditando((ed) => ed && ({ ...ed, [s.key]: e.target.value === '' ? null : parseInt(e.target.value) }))} className="w-14 rounded border border-papel-borda-300 bg-papel-50 px-1 py-0.5 text-center font-mono text-xs text-tinta-300 outline-none" />
                  </div>
                ))}
              </div>
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

// ─── 13. SEÇÃO: PINs dos Jogadores ───────────────────────────────────────────

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
        <p className="mb-3 font-sans text-sm text-tinta-200">Altere o PIN de qualquer participante.</p>
        <div className="space-y-1">
          {participantes.map((p) => (
            <div key={p.id} className="flex items-center gap-2 border-b border-papel-borda-200/60 py-2 last:border-0">
              <span className="w-32 truncate font-sans text-sm text-tinta-300">{p.name}</span>
              <span className="font-mono text-xs text-tinta-100">atual: <b className="text-tinta-200">{p.pin}</b></span>
              <input type="text" inputMode="numeric" maxLength={8} placeholder="novo PIN" value={buf[p.id] ?? ''} onChange={(e) => setBuf((b) => ({ ...b, [p.id]: e.target.value }))} className="w-24 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1 text-center font-mono text-xs text-tinta-300 outline-none" />
              <button type="button" disabled={!buf[p.id]?.trim() || salvando === p.id} onClick={() => handleSalvarPin(p)} className="rounded border border-papel-borda-300 px-2 py-1 font-mono text-[10px] text-tinta-200 hover:bg-papel-100 disabled:opacity-40">{salvando === p.id ? '...' : '✓'}</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── 14. SEÇÃO: Log de Ações ─────────────────────────────────────────────────

function SecaoLog() {
  const [entradas, setEntradas] = useState<EntradaLog[]>([])
  const [carregando, setCarregando] = useState(true)
  const [participantes, setParticipantes] = useState<Array<{ id: string; name: string }>>([])
  const [filtroParticipanteId, setFiltroParticipanteId] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'admin' | 'usuario'>('todos')

  async function carregar() {
    setCarregando(true)
    try { setEntradas(await buscarLog(200, filtroParticipanteId || undefined)) }
    catch (e) { showToast(`Erro ao carregar: ${(e as Error).message}`, 'erro') }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() /* eslint-disable-next-line */ }, [filtroParticipanteId])
  useEffect(() => { buscarParticipantesNomes().then(setParticipantes).catch(() => {}) }, [])

  function formatarData(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const ACOES_USUARIO = new Set(['PALPITE_SALVO', 'PALPITE_EDITADO'])
  const entradasFiltradas = entradas.filter((e) => filtroTipo === 'todos' ? true : filtroTipo === 'usuario' ? ACOES_USUARIO.has(e.action) : !ACOES_USUARIO.has(e.action))

  return (
    <div className="space-y-3">
      <Card>
        <SubLabel>Filtros</SubLabel>
        <Row label="Participante">
          <select value={filtroParticipanteId} onChange={(e) => setFiltroParticipanteId(e.target.value)} className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none">
            <option value="">Todos os participantes</option>
            {participantes.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </Row>
      </Card>

      <Card>
        <SubLabel>Ações registradas</SubLabel>
        {carregando ? <p className="font-sans text-xs text-tinta-100">Carregando...</p> : (
          <div className="max-h-[500px] overflow-y-auto space-y-0 scrollbar-tema">
            {entradasFiltradas.map((e) => (
              <div key={e.id} className="border-b border-papel-borda-200/60 py-2.5 last:border-0 flex justify-between">
                <div>
                  <p className="font-mono text-xs font-bold text-tinta-300">{e.action}</p>
                  {e.performed_by && <p className="font-sans text-[10px] text-tinta-100">por {e.performed_by}</p>}
                </div>
                <span className="font-mono text-[10px] text-tinta-100">{formatarData(e.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── 15. SEÇÃO: Finalizar Campeonato ─────────────────────────────────────────

function SecaoFinalizarCampeonato() {
  const [nomecamp, setNomecamp] = useState('Brasileirão Série A 2026')
  const [adminNome, setAdminNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

  async function handleFinalizar() {
    setConfirmar(false); setSalvando(true)
    try {
      await finalizarCampeonato(nomecamp, adminNome || 'admin')
      vibrar('sucesso')
      showToast('Campeonato finalizado e snapshot salvo! 🏆', 'sucesso', 4000)
    } catch (e) {
      vibrar('erro')
      showToast(`Erro: ${(e as Error).message}`, 'erro')
    } finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3">
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">Encerra o campeonato atual e salva o ranking final.</p>
        <Row label="Nome"><InputText value={nomecamp} onChange={setNomecamp} placeholder="ex: Brasileirão 2026" className="flex-1" /></Row>
        <Row label="Seu nome"><InputText value={adminNome} onChange={setAdminNome} placeholder="Quem está finalizando?" className="flex-1" /></Row>
        <div className="mt-4">
          <Btn variant="danger" onClick={() => setConfirmar(true)} disabled={salvando || !nomecamp.trim()}>🏆 Finalizar Campeonato</Btn>
        </div>
      </Card>

      <Modal aberto={confirmar} onFechar={() => setConfirmar(false)} borda="border-raridade-frango-selo">
        <p className="mb-2 font-display text-lg font-bold text-raridade-frango-selo">Tem certeza?</p>
        <p className="mb-4 font-sans text-sm text-tinta-200">Isso vai salvar o snapshot do ranking atual como <b>{nomecamp}</b>.</p>
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
        <div className="p-6 text-center"><p className="font-sans text-sm text-tinta-200">Esta área é exclusiva para administradores.</p></div>
      </CardEnvelope>
    )
  }

  return (
    <>
      <CardEnvelope titulo="⚙ Admin" subtitulo="⚠ Área restrita — alterações afetam todos em tempo real">{null}</CardEnvelope>
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
