'use client'

// PlayerMusica — mini-player fixo com playlist expandível.
//
// Arquivos ficam na raiz de public/ (não em public/musicas/).
// Playlist atual: 1 tema Palpitão + 7 clássicas de Copa.
//
// Comportamento:
//   - Ao entrar: tenta carregar o tema. Play automático só se o navegador
//     tiver liberado (via gesto do usuário na abertura).
//   - Loop: on por padrão (só na música tema, id='tema').
//   - Playlist: se o usuário clica em ⏭ ou escolhe outra música, entra
//     em modo playlist (sem loop). Toca todas em sequência.
//   - Persiste entre navegações via singleton no window.

import { useEffect, useRef, useState } from 'react'

interface Faixa {
  id: string
  titulo: string
  artista: string
  fontes: string[]  // várias URLs fallback (ex: .mp3, .mp3.mpeg, .mpeg)
}

const PLAYLIST: Faixa[] = [
  {
    id: 'tema',
    titulo: 'Gold on the Pitch',
    artista: 'Tema Palpitão',
    fontes: ['/tema.mp3', '/tema.mp3.mpeg', '/tema.mpeg', '/musicas/tema.mp3'],
  },
  { id: 'waka_waka',        titulo: 'Waka Waka',            artista: 'Shakira',          fontes: ['/waka_waka.mp3'] },
  { id: 'live_it_up',       titulo: 'Live It Up',           artista: 'Nicky Jam',        fontes: ['/live_it_up.mp3'] },
  { id: 'the_cup_of_life',  titulo: 'The Cup of Life',      artista: 'Ricky Martin',     fontes: ['/the_cup_of_life.mp3'] },
  { id: 'tunnel_vision',    titulo: 'Tunnel Vision',        artista: 'Justin Timberlake', fontes: ['/tunnel_vision.mp3'] },
  { id: 'wavin_flag',       titulo: "Wavin' Flag",          artista: "K'naan",           fontes: ['/wavin_flag.mp3'] },
  { id: 'we_are_one',       titulo: 'We Are One (Olé Olá)', artista: 'Pitbull',          fontes: ['/we_are_one.mp3'] },
  { id: 'world_cup_champions', titulo: 'World Cup Champions', artista: 'FIFA',           fontes: ['/world_cup_champions.mp3'] },
]

// Singleton do <audio> — persiste entre navegações
declare global {
  interface Window {
    __palpitaoAudio?: HTMLAudioElement
    __palpitaoAudioState?: {
      faixaId: string
      modoPlaylist: boolean
    }
  }
}

function getAudioSingleton(): HTMLAudioElement {
  if (typeof window === 'undefined') throw new Error('SSR')
  if (!window.__palpitaoAudio) {
    const audio = new Audio()
    audio.loop = true
    audio.volume = 0.4
    window.__palpitaoAudio = audio
    window.__palpitaoAudioState = { faixaId: PLAYLIST[0].id, modoPlaylist: false }
  }
  return window.__palpitaoAudio!
}

function trySrc(audio: HTMLAudioElement, fontes: string[], idx = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (idx >= fontes.length) {
      reject(new Error('Nenhuma fonte carregou'))
      return
    }
    const src = fontes[idx]
    const onError = () => {
      audio.removeEventListener('error', onError)
      audio.removeEventListener('canplay', onCanPlay)
      trySrc(audio, fontes, idx + 1).then(resolve, reject)
    }
    const onCanPlay = () => {
      audio.removeEventListener('error', onError)
      audio.removeEventListener('canplay', onCanPlay)
      resolve()
    }
    audio.addEventListener('error', onError)
    audio.addEventListener('canplay', onCanPlay)
    audio.src = src
    audio.load()
  })
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function PlayerMusica() {
  const [faixaAtualIdx, setFaixaAtualIdx] = useState(0)
  const [tocando, setTocando] = useState(false)
  const [expandido, setExpandido] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = getAudioSingleton()
    audioRef.current = audio

    const state = window.__palpitaoAudioState!
    const idx = PLAYLIST.findIndex((f) => f.id === state.faixaId)
    setFaixaAtualIdx(idx >= 0 ? idx : 0)
    setTocando(!audio.paused)

    if (!audio.src) {
      trySrc(audio, PLAYLIST[idx >= 0 ? idx : 0].fontes).catch(() => {
        setErro('Áudio não encontrado. Verifique o arquivo em /public.')
      })
    }

    const onPlay = () => setTocando(true)
    const onPause = () => setTocando(false)
    const onEnded = () => {
      if (window.__palpitaoAudioState?.modoPlaylist) {
        proximaFaixa()
      }
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    setErro(null)
    if (audio.paused) {
      try {
        if (!audio.src) {
          await trySrc(audio, PLAYLIST[faixaAtualIdx].fontes)
        }
        await audio.play()
      } catch {
        setErro('Não deu pra tocar. Confira se o arquivo existe.')
      }
    } else {
      audio.pause()
    }
  }

  async function trocarPara(idx: number, modoPlaylist: boolean) {
    const audio = audioRef.current
    if (!audio) return
    setErro(null)
    setFaixaAtualIdx(idx)
    window.__palpitaoAudioState!.faixaId = PLAYLIST[idx].id
    window.__palpitaoAudioState!.modoPlaylist = modoPlaylist
    audio.loop = !modoPlaylist
    try {
      await trySrc(audio, PLAYLIST[idx].fontes)
      await audio.play()
    } catch {
      setErro('Arquivo não encontrado.')
    }
  }

  function proximaFaixa() {
    const prox = (faixaAtualIdx + 1) % PLAYLIST.length
    trocarPara(prox, true)
  }

  function faixaAnterior() {
    const ant = (faixaAtualIdx - 1 + PLAYLIST.length) % PLAYLIST.length
    trocarPara(ant, true)
  }

  const faixa = PLAYLIST[faixaAtualIdx]

  return (
    <div className="overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm">
      {/* Barra principal */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-couro-300 text-lg">
          🎵
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-display text-xs font-bold uppercase tracking-widest text-dourado-800">
            Música Tema
          </p>
          <p className="truncate font-sans text-[11px] text-tinta-200">
            {faixa.titulo} · {faixa.artista}
          </p>
          {erro && (
            <p className="mt-0.5 font-mono text-[9px] text-raridade-frango-selo">{erro}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={faixaAnterior}
            className="rounded-md border border-dourado-300 bg-papel-100 px-2 py-1 font-mono text-xs text-dourado-700 hover:bg-dourado-50"
            aria-label="Anterior"
          >
            ⏮
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-md border-2 border-dourado-500 bg-couro-300 px-3 py-1 font-mono text-sm text-dourado-50 hover:bg-couro-400"
            aria-label={tocando ? 'Pausar' : 'Tocar'}
          >
            {tocando ? '⏸' : '▶️'}
          </button>
          <button
            type="button"
            onClick={proximaFaixa}
            className="rounded-md border border-dourado-300 bg-papel-100 px-2 py-1 font-mono text-xs text-dourado-700 hover:bg-dourado-50"
            aria-label="Próxima"
          >
            ⏭
          </button>
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="rounded-md border border-dourado-300 bg-papel-100 px-2 py-1 font-mono text-xs text-dourado-700 hover:bg-dourado-50"
            aria-label={expandido ? 'Fechar lista' : 'Abrir lista'}
          >
            {expandido ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Playlist expandida */}
      {expandido && (
        <div className="max-h-64 overflow-y-auto border-t border-dourado-300 bg-papel-100 scrollbar-tema">
          {PLAYLIST.map((f, i) => {
            const ativa = i === faixaAtualIdx
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => trocarPara(i, i !== 0)}
                className={cx(
                  'flex w-full items-center gap-2 border-b border-papel-borda-200/60 px-3 py-2 text-left last:border-0 transition-colors',
                  ativa ? 'bg-dourado-100' : 'hover:bg-papel-200',
                )}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-couro-100 text-sm">
                  {ativa && tocando ? '▶️' : '♪'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cx('truncate font-sans text-xs font-semibold', ativa ? 'text-dourado-800' : 'text-tinta-300')}>
                    {f.titulo}
                  </p>
                  <p className="truncate font-mono text-[10px] text-tinta-100">{f.artista}</p>
                </div>
                {ativa && (
                  <span className="font-mono text-[9px] font-bold uppercase text-dourado-700">
                    {tocando ? 'Tocando' : 'Pausada'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Helper exportado pra outros componentes iniciarem a música ─────────────

export async function iniciarMusicaTema(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const audio = getAudioSingleton()
    if (!audio.src) {
      await trySrc(audio, PLAYLIST[0].fontes)
    }
    audio.loop = true
    window.__palpitaoAudioState!.modoPlaylist = false
    window.__palpitaoAudioState!.faixaId = PLAYLIST[0].id
    await audio.play()
  } catch {
    // silencioso — mp3 pode não existir ainda
  }
}
