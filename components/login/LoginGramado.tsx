'use client'

// LoginGramado — tela de login no gramado tático (versão estática, sem R3F).
//
// Reconstrução do zero do TacticalLoginScreen do Copa (referência de
// COMPORTAMENTO apenas — nada do código do Copa foi portado). Usa os tokens de
// design e o componente FigurinhaJogador já existente.
//
// Princípios:
//  • Mobile-first, PORTRAIT obrigatório (CLAUDE.md §4 item 3, §5, Regra 8).
//  • Figurinhas com showRarity=false — raridade NUNCA aparece no login
//    (decisão travada no CLAUDE.md §4).
//  • Estilo 100% via Tailwind/tokens, zero inline-style.
//  • Data-driven: a formação e os jogadores chegam por prop. As posições no
//    campo são classes Tailwind literais no dado (left-[..%] top-[..%]), então
//    o JIT as gera normalmente.
//
// ⚠️ Segurança (CLAUDE.md §7): o PIN é validado aqui contra dados MOCKADOS só
// nesta fase estática. NÃO existe MASTER_PASS no client. Quando os dados reais
// entrarem (Supabase), a validação do PIN vira rota server-side autenticada —
// o PIN não deve trafegar nem ser conferido no client em produção.

import { useEffect, useState } from 'react'
import { FigurinhaJogador, type FigurinhaStats } from '@/components/figurinha'

export interface LoginPlayer {
  id: string
  nome: string
  vulgo?: string
  fotoUrl?: string
  /** PIN de 4 dígitos — MOCK. Validação real será server-side (Fase 5). */
  pin: string
  /** Titular (vai a campo) ou reserva (banco). */
  titular: boolean
  /** Classes Tailwind LITERAIS de posição no campo: ex. 'left-[50%] top-[78%]'. */
  pos?: string
  stats: FigurinhaStats
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Iniciais a partir do nome: 1ª letra do primeiro e do último nome. */
function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Marcador de jogador no campo — estilo FIFA (clean): círculo com foto/iniciais
 *  + nome abaixo. SEM a figurinha de álbum: ela é pesada demais para a tela de
 *  entrada e a estética de papel/serrilha pertence ao interior do app. A
 *  FigurinhaJogador completa só aparece no modal de PIN (momento de foco). */
function MarcadorJogador({
  player,
  onClick,
  size,
}: {
  player: LoginPlayer
  onClick: () => void
  size: 'campo' | 'banco'
}) {
  const circulo = size === 'campo' ? 'h-12 w-12' : 'h-10 w-10'
  const iniciais = size === 'campo' ? 'text-sm' : 'text-xs'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Entrar como ${player.nome}`}
      className="group flex w-[64px] flex-col items-center gap-1 transition-transform duration-150 hover:z-30 hover:scale-110 focus:outline-none"
    >
      <span
        className={cx(
          circulo,
          'flex items-center justify-center overflow-hidden rounded-full border-2 border-papel-100/80 bg-campo-300 shadow-md group-focus-visible:ring-2 group-focus-visible:ring-dourado-300',
        )}
      >
        {player.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.fotoUrl} alt={player.nome} className="h-full w-full object-cover" />
        ) : (
          <span className={cx(iniciais, 'font-sans font-bold text-papel-50')}>
            {getIniciais(player.nome)}
          </span>
        )}
      </span>
      <span className="max-w-full truncate rounded bg-campo-noturno px-1 py-0.5 font-sans text-[9px] font-medium leading-none text-papel-100">
        {player.vulgo || player.nome}
      </span>
    </button>
  )
}

export function LoginGramado({ players }: { players: LoginPlayer[] }) {
  const [selecionado, setSelecionado] = useState<LoginPlayer | null>(null)
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)
  const [entrou, setEntrou] = useState<LoginPlayer | null>(null)

  const titulares = players.filter((p) => p.titular)
  const reservas = players.filter((p) => !p.titular)

  function abrir(p: LoginPlayer) {
    setSelecionado(p)
    setPin('')
    setErro(false)
  }
  function fechar() {
    setSelecionado(null)
    setPin('')
    setErro(false)
  }
  function digitar(d: string) {
    setPin((atual) => (atual.length >= 4 ? atual : atual + d))
    setErro(false)
  }
  function apagar() {
    setErro(false)
    setPin((atual) => atual.slice(0, -1))
  }

  // Valida quando completa 4 dígitos (mesmo padrão do Copa — MOCK).
  useEffect(() => {
    if (pin.length !== 4 || !selecionado) return
    if (pin === selecionado.pin) {
      // eslint-disable-next-line no-console
      console.log('[login mock] entrou:', selecionado.nome)
      setEntrou(selecionado)
      setSelecionado(null)
      setPin('')
    } else {
      setErro(true)
      setPin('')
    }
  }, [pin, selecionado])

  return (
    <main className="flex min-h-screen flex-col items-center bg-campo-noturno px-4 py-6">
      {/* Cabeçalho + CTA almanaque */}
      <header className="mb-5 flex flex-col items-center gap-3">
        <h1 className="text-center font-display text-2xl font-bold uppercase leading-none tracking-wide text-dourado-50">
          Palpitão Brasileirão
        </h1>
        <button
          type="button"
          // eslint-disable-next-line no-console
          onClick={() => console.log('[login mock] abrir o álbum')}
          className="rounded-md border-2 border-dourado-300 bg-couro-300 px-6 py-2.5 font-display text-base font-bold uppercase tracking-wider text-dourado-50 shadow-md transition-colors hover:bg-couro-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
        >
          Abrir o Álbum
        </button>
        <p className="font-mono text-[10px] uppercase tracking-widest text-campo-50">
          Toque na sua figurinha para entrar
        </p>
      </header>

      {/* Campo em portrait */}
      <div className="relative aspect-[3/5] w-full max-w-[380px] overflow-hidden rounded-lg border-2 border-papel-100/25 bg-[repeating-linear-gradient(180deg,var(--campo-100)_0_34px,var(--campo-200)_34px_68px)] shadow-2xl">
        {/* ── Linhas de campo (giz = papel-100 a baixa opacidade) ── */}
        {/* Gol de cima */}
        <div className="absolute left-1/2 top-0 h-[2%] w-[22%] -translate-x-1/2 border-x-2 border-b-2 border-papel-100/30" />
        {/* Grande área de cima */}
        <div className="absolute left-1/2 top-0 h-[14%] w-[58%] -translate-x-1/2 border-x-2 border-b-2 border-papel-100/25" />
        {/* Linha de meio-campo (acima do banco) */}
        <div className="absolute inset-x-0 top-[43%] h-px bg-papel-100/25" />
        {/* Círculo central */}
        <div className="absolute left-1/2 top-[43%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-papel-100/25" />
        <div className="absolute left-1/2 top-[43%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-papel-100/30" />
        {/* Grande área de baixo (logo acima do banco) */}
        <div className="absolute bottom-[16%] left-1/2 h-[14%] w-[58%] -translate-x-1/2 border-x-2 border-t-2 border-papel-100/25" />
        {/* Gol de baixo */}
        <div className="absolute bottom-[16%] left-1/2 h-[2%] w-[22%] -translate-x-1/2 border-x-2 border-t-2 border-papel-100/30" />

        {/* ── Titulares posicionados ── */}
        {titulares.map((p) => (
          <div
            key={p.id}
            className={cx('absolute z-20 flex -translate-x-1/2 -translate-y-1/2 justify-center', p.pos)}
          >
            <MarcadorJogador player={p} size="campo" onClick={() => abrir(p)} />
          </div>
        ))}

        {/* ── Banco (faixa inferior do campo) ── */}
        <div className="absolute inset-x-0 bottom-0 z-20 h-[16%] border-t-2 border-papel-100/25 bg-campo-noturno/70">
          <span className="absolute left-2 top-1 font-mono text-[8px] uppercase tracking-widest text-campo-50">
            Banco
          </span>
          <div className="flex h-full items-center gap-1 overflow-x-auto px-2 pt-3">
            {reservas.map((p) => (
              <MarcadorJogador key={p.id} player={p} size="banco" onClick={() => abrir(p)} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal de PIN ── */}
      {selecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-parede-200/85 p-4 backdrop-blur-sm"
          onClick={fechar}
        >
          <div
            className="flex w-full max-w-[300px] flex-col items-center gap-4 rounded-lg border-2 border-couro-300 bg-papel-100 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Figurinha do selecionado */}
            <div className="h-[120px] w-[100px] overflow-hidden">
              <span className="block origin-top-left scale-[0.52]">
                <FigurinhaJogador
                  nome={selecionado.nome}
                  vulgo={selecionado.vulgo}
                  fotoUrl={selecionado.fotoUrl}
                  stats={selecionado.stats}
                  showRarity={false}
                  className="pointer-events-none"
                />
              </span>
            </div>

            <p className="font-sans text-sm font-bold uppercase tracking-tight text-tinta-300">
              Digite seu PIN
            </p>

            {/* 4 bolinhas */}
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cx(
                    'h-3.5 w-3.5 rounded-full border-2',
                    erro
                      ? 'border-raridade-frango-selo'
                      : i < pin.length
                        ? 'border-couro-300 bg-couro-300'
                        : 'border-papel-borda-300',
                  )}
                />
              ))}
            </div>

            {erro && (
              <p className="font-mono text-[11px] uppercase tracking-wider text-raridade-frango-selo">
                PIN incorreto
              </p>
            )}

            {/* Teclado numérico */}
            <div className="grid w-full grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => digitar(d)}
                  className="rounded-md border border-papel-borda-200 bg-papel-200 py-3 font-mono text-lg font-bold text-tinta-300 transition-colors active:bg-papel-300"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={fechar}
                className="rounded-md border border-papel-borda-200 bg-papel-50 py-3 font-mono text-xs uppercase text-tinta-100 transition-colors active:bg-papel-200"
              >
                Sair
              </button>
              <button
                type="button"
                onClick={() => digitar('0')}
                className="rounded-md border border-papel-borda-200 bg-papel-200 py-3 font-mono text-lg font-bold text-tinta-300 transition-colors active:bg-papel-300"
              >
                0
              </button>
              <button
                type="button"
                onClick={apagar}
                className="rounded-md border border-papel-borda-200 bg-papel-50 py-3 font-mono text-lg text-tinta-100 transition-colors active:bg-papel-200"
              >
                ⌫
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Estado de sucesso (mock) ── */}
      {entrou && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-campo-noturno/95 p-6 text-center">
          <p className="font-display text-2xl font-bold uppercase tracking-wide text-dourado-50">
            Bem-vindo, {entrou.vulgo || entrou.nome}!
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-campo-50">
            (login mock — sessão real vem depois)
          </p>
          <button
            type="button"
            onClick={() => setEntrou(null)}
            className="rounded-md border-2 border-dourado-300 bg-couro-300 px-5 py-2 font-display text-sm font-bold uppercase tracking-wider text-dourado-50 transition-colors hover:bg-couro-200"
          >
            Voltar
          </button>
        </div>
      )}
    </main>
  )
}
