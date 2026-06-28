'use client'

// AdminScreen — painel de administração do Palpitão Brasileirão.
// Reconstruído do zero para o contexto de liga: sem mata-mata, sem OneSignal,
// sem API-Football. Extras "Quem Avança / Pênaltis" e multiplicadores de fase removidos.
// Dados mockados. Acesso restrito via prop isAdmin.

import { useState } from 'react'
import { Accordion } from '@/components/home/Accordion'

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
        checked ? 'bg-campo-500' : 'bg-papel-borda-400',
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
    green: 'bg-campo-500 text-papel-50 hover:bg-campo-600 border-transparent',
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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const NOMES = [
  'Marcos Viní', 'Pedro Sá', 'Diego Alves', 'Tiago Lopes', 'Léo Castro',
  'Bruno Dias', 'Hugo Lima', 'Caio Reis', 'Igor Pena', 'João Neto',
  'Rafael Mota', 'Vitor Hugo', 'Felipe Aro', 'André Sousa',
]

const PLAYLIST_MOCK = [
  { id: 't1', title: 'Aquarela do Brasil', artist: 'Ary Barroso' },
  { id: 't2', title: 'País Tropical', artist: 'Jorge Ben Jor' },
  { id: 't3', title: 'Garota de Ipanema', artist: 'Tom Jobim & Vinícius' },
  { id: 't4', title: 'Que País É Esse', artist: 'Legião Urbana' },
]

const LOG_MOCK = [
  { ts: '2026-06-28T14:30:00', action: 'Rodada 20 salva: "Rodada 20"' },
  { ts: '2026-06-27T21:15:00', action: 'Resultado lançado: Flamengo 2×1 Vasco' },
  { ts: '2026-06-27T21:14:00', action: 'Pontos calculados automaticamente' },
  { ts: '2026-06-26T19:00:00', action: 'Rodada 19 finalizada' },
  { ts: '2026-06-25T10:00:00', action: 'Novidade publicada: "Histórico disponível!"' },
]

type Jogo = { id: string; home: string; away: string; date: string; time: string; locked: boolean }

const JOGOS_MOCK: Jogo[] = [
  { id: 'j1', home: 'Flamengo', away: 'Vasco', date: '2026-06-29', time: '16:00', locked: false },
  { id: 'j2', home: 'Palmeiras', away: 'São Paulo', date: '2026-06-29', time: '18:30', locked: false },
  { id: 'j3', home: 'Grêmio', away: 'Internacional', date: '2026-06-30', time: '20:00', locked: false },
]

// ─── SEÇÃO: Compartilhar no WhatsApp ─────────────────────────────────────────

function SecaoWhatsApp() {
  function share(tipo: 'geral' | 'parcial') {
    const texto =
      tipo === 'geral'
        ? '📊 *Ranking Geral — Palpitão Brasileirão*\n1º Marcos Viní — 312 pts\n2º Pedro Sá — 298 pts\n3º Diego Alves — 281 pts\n...'
        : '⚽ *Parcial Rodada 20 — Palpitão Brasileirão*\n1º Hugo Lima — 18 pts\n2º Caio Reis — 15 pts\n3º Marcos Viní — 14 pts\n...'
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <Card>
      <p className="mb-4 font-sans text-sm text-tinta-200">
        Envie um resumo direto no WhatsApp — inclui top 5 e link do app.
      </p>
      <div className="flex flex-wrap gap-3">
        <Btn variant="whatsapp" onClick={() => share('geral')}>📊 Ranking Geral</Btn>
        <Btn variant="whatsapp" onClick={() => share('parcial')}>⚽ Parcial da Rodada</Btn>
      </div>
    </Card>
  )
}

// ─── SEÇÃO: Configuração da Rodada ───────────────────────────────────────────

function SecaoConfiguracaoRodada() {
  const [nome, setNome] = useState('Rodada 20')
  const [numero, setNumero] = useState(20)
  const [aberta, setAberta] = useState(true)
  const [jogos, setJogos] = useState<Jogo[]>(JOGOS_MOCK)

  function addJogo() {
    setJogos((js) => [
      ...js,
      { id: 'j' + Date.now(), home: '', away: '', date: '', time: '', locked: false },
    ])
  }

  function removeJogo(id: string) {
    setJogos((js) => js.filter((j) => j.id !== id))
  }

  function patch(id: string, p: Partial<Jogo>) {
    setJogos((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j)))
  }

  return (
    <div className="space-y-3">
      <Card>
        <Row label="Nome">
          <InputText value={nome} onChange={setNome} placeholder="ex: Rodada 20" className="flex-1" />
        </Row>
        <Row label="Nº Rodada">
          <input
            type="number"
            min={1}
            value={numero}
            onChange={(e) => setNumero(parseInt(e.target.value) || 1)}
            className="w-16 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 text-center font-mono text-sm text-tinta-300 outline-none"
          />
          <span className="font-sans text-xs text-tinta-100">Aparece como "Rodada {numero}"</span>
        </Row>
        <Row label="Palpites">
          <Toggle checked={aberta} onChange={setAberta} />
          <span className="font-sans text-sm text-tinta-200">{aberta ? 'Abertos' : 'Fechados'}</span>
        </Row>
      </Card>

      {jogos.map((j, idx) => (
        <Card key={j.id}>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-dourado-500">JOGO {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeJogo(j.id)}
              className="font-mono text-[10px] text-raridade-frango-selo hover:underline"
            >
              Remover
            </button>
          </div>
          <Row label="Casa">
            <InputText value={j.home} onChange={(v) => patch(j.id, { home: v })} placeholder="Flamengo" className="flex-1" />
          </Row>
          <Row label="Fora">
            <InputText value={j.away} onChange={(v) => patch(j.id, { away: v })} placeholder="Vasco" className="flex-1" />
          </Row>
          <Row label="Data">
            <InputText value={j.date} onChange={(v) => patch(j.id, { date: v })} placeholder="AAAA-MM-DD" />
            {!j.date && (
              <span className="font-mono text-[10px] text-raridade-frango-selo">⚠ sem data — trava hoje</span>
            )}
          </Row>
          <Row label="Horário">
            <InputText value={j.time} onChange={(v) => patch(j.id, { time: v })} placeholder="19:00" className="w-24" />
          </Row>
          <Row label="Travado">
            <Toggle checked={j.locked} onChange={(v) => patch(j.id, { locked: v })} />
            <span className="font-sans text-xs text-tinta-200">
              {j.locked ? '🔒 Travado manualmente' : 'Automático pelo horário'}
            </span>
          </Row>
        </Card>
      ))}

      <button
        type="button"
        onClick={addJogo}
        className="w-full rounded-lg border border-dashed border-papel-borda-300 py-2.5 font-mono text-xs text-tinta-200 transition-colors hover:bg-papel-100"
      >
        + Adicionar Jogo
      </button>

      <div className="flex flex-wrap gap-2">
        <Btn variant="gold">💾 Salvar Rodada</Btn>
        <Btn variant="green">✔ Finalizar Rodada</Btn>
        <Btn variant="danger">🗑 Limpar Palpites</Btn>
      </div>
    </div>
  )
}

// ─── SEÇÃO: Resultado & Correção ─────────────────────────────────────────────

type Placar = { h: string; a: string }

function SecaoResultadoCorrecao() {
  const [res, setRes] = useState<Record<string, Placar>>(
    Object.fromEntries(JOGOS_MOCK.map((j) => [j.id, { h: '', a: '' }])),
  )
  const [jogadorSel, setJogadorSel] = useState('')

  function setField(id: string, field: 'h' | 'a', val: string) {
    setRes((r) => ({ ...r, [id]: { ...r[id], [field]: val } }))
  }

  return (
    <div className="space-y-3">
      <Card>
        {JOGOS_MOCK.map((j) => (
          <div key={j.id} className="border-b border-papel-borda-200 py-3 last:border-0">
            <p className="mb-2 font-sans text-sm font-semibold text-tinta-300">
              {j.home} × {j.away}
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-tinta-100">Placar:</span>
              <input
                type="number" inputMode="numeric" min={0}
                value={res[j.id]?.h ?? ''}
                onChange={(e) => setField(j.id, 'h', e.target.value)}
                placeholder="0"
                className="w-14 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1 text-center font-mono text-sm text-tinta-300 outline-none"
              />
              <span className="text-tinta-100">×</span>
              <input
                type="number" inputMode="numeric" min={0}
                value={res[j.id]?.a ?? ''}
                onChange={(e) => setField(j.id, 'a', e.target.value)}
                placeholder="0"
                className="w-14 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1 text-center font-mono text-sm text-tinta-300 outline-none"
              />
            </div>
          </div>
        ))}
        <div className="mt-3">
          <Btn variant="gold">⚡ Calcular Pontos Automaticamente</Btn>
        </div>
      </Card>

      {/* Correção manual por palpiteiro */}
      <div>
        <SubLabel>Correção Manual por Palpiteiro</SubLabel>
        <div className="flex gap-2">
          <select
            value={jogadorSel}
            onChange={(e) => setJogadorSel(e.target.value)}
            className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
          >
            <option value="">Selecione o palpiteiro...</option>
            {NOMES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {jogadorSel && (
            <button
              type="button"
              onClick={() => setJogadorSel('')}
              className="rounded border border-papel-borda-300 px-2.5 font-mono text-xs text-tinta-200 hover:bg-papel-100"
            >
              ✕
            </button>
          )}
        </div>

        {jogadorSel && (
          <Card className="mt-2">
            <p className="mb-3 font-display text-sm font-bold text-dourado-500">{jogadorSel}</p>
            {JOGOS_MOCK.map((j) => (
              <div key={j.id} className="border-b border-papel-borda-200/60 py-2.5 last:border-0">
                <p className="mb-1.5 font-sans text-xs font-semibold text-tinta-300">
                  {j.home} × {j.away}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-sans text-xs text-tinta-100">
                    Palpite: <b className="font-mono text-tinta-300">2×1</b>
                  </span>
                  <span className="font-sans text-xs text-tinta-100">
                    Resultado: <b className="font-mono text-dourado-500">—</b>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-tinta-100">
                    Corrigir:
                    <input
                      type="number" inputMode="numeric" min={0} placeholder="—"
                      className="w-12 rounded border border-papel-borda-300 bg-papel-50 px-1.5 py-0.5 text-center font-mono text-xs text-tinta-300 outline-none"
                    />
                    <button
                      type="button"
                      className="rounded border border-papel-borda-300 px-2 py-0.5 font-mono text-[10px] text-tinta-200 hover:bg-papel-100"
                    >
                      ✓ Ok
                    </button>
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

// ─── SEÇÃO: Frango da Rodada ──────────────────────────────────────────────────

function SecaoFrango() {
  const [jogador, setJogador] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [texto, setTexto] = useState('')

  return (
    <Card>
      <p className="mb-3 font-sans text-sm text-tinta-200">
        A caracterização especial do frango só aparece para ele — durante a rodada seguinte.
        Tradição do grupo. Carinhosamente constrangedor.
      </p>
      <Row label="Jogador">
        <select
          value={jogador}
          onChange={(e) => setJogador(e.target.value)}
          className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
        >
          <option value="">Nenhum</option>
          {NOMES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </Row>
      <Row label="Foto URL">
        <InputText
          value={fotoUrl}
          onChange={setFotoUrl}
          placeholder="https://... (foto editada do grupo)"
          className="flex-1"
        />
      </Row>
      <Row label="Texto">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Mensagem carinhosamente constrangedora..."
          rows={2}
          className="flex-1 resize-none rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
        />
      </Row>
      <div className="mt-3 flex gap-2">
        <Btn variant="gold">💾 Salvar</Btn>
        <Btn variant="outline" onClick={() => { setJogador(''); setFotoUrl(''); setTexto('') }}>
          Limpar
        </Btn>
      </div>
    </Card>
  )
}

// ─── SEÇÃO: Novidades (pop-up) ────────────────────────────────────────────────

type Novidade = { id: string; titulo: string; resumo: string; data: string }

function SecaoNovidades() {
  const [titulo, setTitulo] = useState('')
  const [resumo, setResumo] = useState('')
  const [novidades, setNovidades] = useState<Novidade[]>([
    {
      id: 'n1',
      titulo: 'Guia do Brasileirão disponível!',
      resumo: 'A aba Guia foi completamente reescrita para a liga.',
      data: '28/06/2026',
    },
  ])

  function publicar() {
    if (!titulo.trim()) return
    setNovidades((ns) => [
      { id: 'n' + Date.now(), titulo: titulo.trim(), resumo: resumo.trim(), data: new Date().toLocaleDateString('pt-BR') },
      ...ns,
    ])
    setTitulo('')
    setResumo('')
  }

  return (
    <div className="space-y-3">
      <Card>
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Publique uma novidade para aparecer como pop-up quando os participantes entrarem no app.
        </p>
        <Row label="Título">
          <InputText value={titulo} onChange={setTitulo} placeholder="ex: Nova aba disponível!" className="flex-1" />
        </Row>
        <Row label="Resumo">
          <textarea
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            placeholder="Breve descrição do que foi adicionado..."
            rows={2}
            className="flex-1 resize-none rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
          />
        </Row>
        <div className="mt-3">
          <Btn variant="gold" onClick={publicar} disabled={!titulo.trim()}>🆕 Publicar</Btn>
        </div>
      </Card>

      {novidades.length > 0 && (
        <Card>
          <SubLabel>Publicadas</SubLabel>
          {novidades.map((n) => (
            <div key={n.id} className="flex items-start gap-2 border-b border-papel-borda-200 py-2.5 last:border-0">
              <div className="flex-1">
                <p className="font-sans text-sm font-semibold text-tinta-300">{n.titulo}</p>
                {n.resumo && <p className="mt-0.5 font-sans text-xs text-tinta-200">{n.resumo}</p>}
                <p className="mt-0.5 font-mono text-[10px] text-tinta-100">{n.data}</p>
              </div>
              <button
                type="button"
                onClick={() => setNovidades((ns) => ns.filter((x) => x.id !== n.id))}
                className="font-mono text-[10px] text-raridade-frango-selo hover:underline"
              >
                Remover
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ─── SEÇÃO: Música Padrão ────────────────────────────────────────────────────

function SecaoMusica() {
  const [defaultId, setDefaultId] = useState('t1')

  return (
    <Card>
      <p className="mb-3 font-sans text-sm text-tinta-200">
        Define qual música toca na abertura do app, sincronizada com a animação de capa.
      </p>
      <div className="space-y-2">
        {PLAYLIST_MOCK.map((t) => {
          const ativa = t.id === defaultId
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => setDefaultId(t.id)}
              className={cx(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                ativa
                  ? 'border-dourado-400 bg-dourado-50'
                  : 'border-papel-borda-200 hover:bg-papel-100',
              )}
            >
              <span className="text-base">{ativa ? '🎵' : '♪'}</span>
              <div className="flex-1">
                <p className={cx('font-sans text-sm font-semibold', ativa ? 'text-dourado-600' : 'text-tinta-300')}>
                  {t.title}
                </p>
                <p className="font-sans text-xs text-tinta-100">{t.artist}</p>
              </div>
              {ativa && (
                <span className="rounded border border-dourado-400 px-1.5 py-0.5 font-mono text-[9px] font-bold text-dourado-500">
                  PADRÃO
                </span>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

// ─── SEÇÃO: Projeção de Campeão ───────────────────────────────────────────────

function SecaoProjecao() {
  const [janela, setJanela] = useState(3)
  const opcoes: [number, string][] = [
    [2, 'Últ. 2'],
    [3, 'Últ. 3'],
    [5, 'Últ. 5'],
    [10, 'Últ. 10'],
    [0, 'Campeonato inteiro'],
  ]

  return (
    <Card>
      <p className="mb-3 font-sans text-sm text-tinta-200">
        Define quantas rodadas usar para calcular a projeção de campeão (%) na tabela de ranking.
      </p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(([val, label]) => (
          <button
            type="button"
            key={val}
            onClick={() => setJanela(val)}
            className={cx(
              'rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors',
              janela === val
                ? 'border-dourado-400 bg-dourado-100 text-dourado-600'
                : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] text-tinta-100">
        ⚠ Mínimo de 2 rodadas finalizadas. Com menos, aparece "—" na tabela.
      </p>
    </Card>
  )
}

// ─── SEÇÃO: Gráfico de Evolução ───────────────────────────────────────────────

function SecaoEvolucao() {
  const [janela, setJanela] = useState(5)
  const opcoes: [number, string][] = [
    [1, 'Última'],
    [3, 'Últ. 3'],
    [5, 'Últ. 5'],
    [10, 'Últ. 10'],
    [0, 'Desde o início'],
  ]

  return (
    <Card>
      <p className="mb-3 font-sans text-sm text-tinta-200">
        Controla quantas rodadas aparecem no gráfico "Evolução por Rodada" (top 5 do ranking).
      </p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(([val, label]) => (
          <button
            type="button"
            key={val}
            onClick={() => setJanela(val)}
            className={cx(
              'rounded-md border px-3 py-1.5 font-mono text-xs font-bold transition-colors',
              janela === val
                ? 'border-dourado-400 bg-dourado-100 text-dourado-600'
                : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </Card>
  )
}

// ─── SEÇÃO: Conheça os Adms ───────────────────────────────────────────────────

type Adm = { id: string; nome: string; vulgo: string; foto: string; descricao: string }

function SecaoAdms() {
  const [adms, setAdms] = useState<Adm[]>([
    { id: 'a1', nome: 'Fulano Admin', vulgo: 'O Chefe', foto: '', descricao: 'Organiza tudo e culpa os outros quando algo dá errado.' },
  ])

  function add() {
    setAdms((a) => [...a, { id: 'a' + Date.now(), nome: '', vulgo: '', foto: '', descricao: '' }])
  }

  function update(id: string, p: Partial<Adm>) {
    setAdms((a) => a.map((x) => (x.id === id ? { ...x, ...p } : x)))
  }

  return (
    <div className="space-y-3">
      <p className="font-sans text-sm text-tinta-200">
        Esses dados aparecem no Guia para todos os participantes.
      </p>
      {adms.map((adm, idx) => (
        <Card key={adm.id}>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-dourado-500">ADM {idx + 1}</span>
            <button
              type="button"
              onClick={() => setAdms((a) => a.filter((x) => x.id !== adm.id))}
              className="font-mono text-[10px] text-raridade-frango-selo hover:underline"
            >
              Remover
            </button>
          </div>
          <Row label="Nome">
            <InputText value={adm.nome} onChange={(v) => update(adm.id, { nome: v })} placeholder="Nome completo" className="flex-1" />
          </Row>
          <Row label="Vulgo">
            <InputText value={adm.vulgo} onChange={(v) => update(adm.id, { vulgo: v })} placeholder="Apelido zueiro..." className="flex-1" />
          </Row>
          <Row label="Foto URL">
            <InputText value={adm.foto} onChange={(v) => update(adm.id, { foto: v })} placeholder="https://..." className="flex-1" />
          </Row>
          <Row label="Descrição">
            <textarea
              value={adm.descricao}
              onChange={(e) => update(adm.id, { descricao: e.target.value })}
              placeholder="Textinho zueiro sobre esse adm..."
              rows={2}
              className="flex-1 resize-none rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
            />
          </Row>
        </Card>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={add}
          className="flex-1 rounded-lg border border-dashed border-papel-borda-300 py-2.5 font-mono text-xs text-tinta-200 hover:bg-papel-100"
        >
          + Adicionar Adm
        </button>
        <Btn variant="gold">💾 Salvar Adms</Btn>
      </div>
    </div>
  )
}

// ─── SEÇÃO: Esquema de Pontuação ─────────────────────────────────────────────

function SecaoPontuacao() {
  const [regras, setRegras] = useState([
    { desc: 'Placar exato (cravada)', pts: 5 },
    { desc: 'Saldo de gols certo', pts: 3 },
    { desc: 'Vencedor certo', pts: 1 },
  ])

  return (
    <div className="space-y-3">
      <Card>
        <SubLabel>Regras da liga (critérios exclusivos — não acumulam)</SubLabel>
        {regras.map((r, i) => (
          <div key={i} className="flex items-center gap-2 border-b border-papel-borda-200 py-2 last:border-0">
            <input
              type="text"
              value={r.desc}
              onChange={(e) =>
                setRegras((rs) => rs.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))
              }
              className="flex-1 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
            />
            <input
              type="number"
              min={0}
              value={r.pts}
              onChange={(e) =>
                setRegras((rs) => rs.map((x, j) => (j === i ? { ...x, pts: parseInt(e.target.value) || 0 } : x)))
              }
              className="w-14 rounded border border-papel-borda-300 bg-papel-50 px-2 py-1 text-center font-mono text-sm text-tinta-300 outline-none"
            />
            <span className="font-mono text-[10px] text-tinta-100">pts</span>
          </div>
        ))}
      </Card>
      <Btn variant="gold">💾 Salvar Pontuação</Btn>
    </div>
  )
}

// ─── SEÇÃO: PINs dos Jogadores ────────────────────────────────────────────────

function SecaoPINs() {
  const [pins, setPins] = useState<Record<string, string>>({})
  const [locais, setLocais] = useState<Record<string, string>>({})

  function salvar(nome: string) {
    const val = locais[nome]?.trim() ?? ''
    setPins((p) =>
      val
        ? { ...p, [nome]: val }
        : Object.fromEntries(Object.entries(p).filter(([k]) => k !== nome)),
    )
    setLocais((l) => ({ ...l, [nome]: '' }))
  }

  return (
    <div className="space-y-3">
      <NotaSeguranca>
        ⚠ No app real, a validação de PIN deve ser server-side — nunca verificada no client.
        Este mock é apenas para conferência visual.
      </NotaSeguranca>
      <div className="space-y-2">
        {NOMES.map((nome) => (
          <div
            key={nome}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-papel-borda-200 bg-papel-50 px-3 py-2"
          >
            <span className="min-w-[100px] flex-1 font-sans text-sm text-tinta-300">{nome}</span>
            {pins[nome] && (
              <span className="rounded border border-campo-400 bg-campo-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-campo-600">
                PIN ativo
              </span>
            )}
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={locais[nome] ?? ''}
              onChange={(e) => setLocais((l) => ({ ...l, [nome]: e.target.value }))}
              placeholder={pins[nome] ? '••••' : 'sem PIN'}
              className="w-20 rounded border border-papel-borda-300 bg-papel-100 px-2 py-1 text-center font-mono text-xs text-tinta-300 outline-none"
            />
            <button
              type="button"
              onClick={() => salvar(nome)}
              className="rounded border border-papel-borda-300 px-2 py-1 font-mono text-[10px] text-tinta-200 hover:bg-papel-100"
            >
              {!locais[nome]?.trim() && pins[nome] ? 'Remover' : 'Salvar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SEÇÃO: Log de Ações ─────────────────────────────────────────────────────

function SecaoLog() {
  return (
    <Card>
      {LOG_MOCK.length === 0 ? (
        <p className="text-center font-sans text-sm text-tinta-100">Nenhuma ação registrada.</p>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {LOG_MOCK.map((log, i) => (
            <div key={i} className="flex gap-3 border-b border-papel-borda-200 py-2 last:border-0">
              <span className="shrink-0 pt-0.5 font-mono text-[10px] text-tinta-100">
                {new Date(log.ts).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="font-sans text-sm text-tinta-200">{log.action}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── SEÇÃO: Dados & Segurança ─────────────────────────────────────────────────

function SecaoSeguranca() {
  const [confirmar, setConfirmar] = useState('')
  const [novaSenha, setNovaSenha] = useState('')

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <p className="mb-1 font-display text-sm font-bold text-red-700">🗑 Zerar Todos os Dados</p>
        <p className="mb-3 font-sans text-xs leading-relaxed text-red-600">
          Apaga palpites, resultados, pontuações acumuladas, troféus, histórico, avatares, PINs,
          novidades e log. Mantém: regras de pontuação e perfis dos admins.
        </p>
        <input
          type="text"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value.toUpperCase())}
          placeholder="Digite ZERAR para confirmar"
          className="mb-3 w-full rounded border border-red-300 bg-papel-50 px-2 py-1.5 text-center font-mono text-sm uppercase tracking-widest text-tinta-300 outline-none"
        />
        <Btn variant="danger" disabled={confirmar !== 'ZERAR'}>⚠ Zerar Tudo</Btn>
      </div>

      <Card>
        <SubLabel>Alterar Senha Admin</SubLabel>
        <NotaSeguranca>
          ⚠ No app real, alteração de senha deve ser server-side — nunca no client.
        </NotaSeguranca>
        <Row label="Nova Senha">
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="••••••"
            className="rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
          />
        </Row>
        <div className="mt-3">
          <Btn variant="danger" disabled={!novaSenha.trim()}>🔑 Alterar Senha</Btn>
        </div>
      </Card>
    </div>
  )
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────

const SECOES = [
  { key: 'whatsapp',  titulo: '📲 Compartilhar no WhatsApp',  conteudo: <SecaoWhatsApp /> },
  { key: 'rodada',    titulo: '⚙ Configuração da Rodada',     conteudo: <SecaoConfiguracaoRodada /> },
  { key: 'resultado', titulo: '⚽ Resultado & Correção',       conteudo: <SecaoResultadoCorrecao /> },
  { key: 'frango',    titulo: '🐔 Frango da Rodada',           conteudo: <SecaoFrango /> },
  { key: 'novidades', titulo: '🆕 Novidades',                  conteudo: <SecaoNovidades /> },
  { key: 'musica',    titulo: '🎵 Música Padrão',              conteudo: <SecaoMusica /> },
  { key: 'projecao',  titulo: '🔮 Projeção de Campeão',        conteudo: <SecaoProjecao /> },
  { key: 'evolucao',  titulo: '📈 Gráfico de Evolução',        conteudo: <SecaoEvolucao /> },
  { key: 'adms',      titulo: '👑 Conheça os Adms',            conteudo: <SecaoAdms /> },
  { key: 'pins',      titulo: '🔐 PINs dos Jogadores',         conteudo: <SecaoPINs /> },
  { key: 'pontuacao', titulo: '📐 Esquema de Pontuação',       conteudo: <SecaoPontuacao /> },
  { key: 'log',       titulo: '📋 Log de Ações',               conteudo: <SecaoLog /> },
  { key: 'seguranca', titulo: '🔒 Dados & Segurança',          conteudo: <SecaoSeguranca /> },
]

export function AdminScreen({ isAdmin = true }: { isAdmin?: boolean }) {
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel-200 px-4">
        <div className="text-center">
          <div className="mb-4 text-5xl">🔒</div>
          <h1 className="font-display text-2xl font-bold text-tinta-300">Acesso Restrito</h1>
          <p className="mt-2 font-sans text-sm text-tinta-100">
            Esta área é exclusiva para administradores.
          </p>
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
