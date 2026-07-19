'use client'

// PlayerMusica — mini-player fixo na Home.
//
// Toca a música tema em loop por padrão. Se o usuário clicar em "próxima",
// entra em modo playlist sequencial (sem loop). Volta pra loop se o usuário
// clicar de novo na música tema (a primeira).
//
// A música precisa começar após um gesto do usuário (regra de autoplay dos
// navegadores). O único gesto na abertura é "Abrir o Álbum". Como o áudio
// persiste entre rotas via singleton no window, se o usuário já ativou lá,
// aqui já toca. Se não, botão Play manual libera.
//
// Suporta múltiplos nomes de arquivo pra mesma faixa (fallback):
//   /musicas/tema.mp3
//   /musicas/tema.mp3.mpeg
//   /musicas/tema.mpeg
// O navegador tenta cada um em ordem.

import { useEffect, useRef, useState } from 'react'

interface Faixa {
  id: string
  titulo: string
  artista: string
  fontes: string[]  // várias URLs de fallback
}

// Playlist inicial (crescerá quando mais mp3s forem subidos)
const PLAYLIST: Faixa[] = [
  {
    id: 'tema',
    titulo: 'Gold on the Pitch',
    artista: 'Tema Palpitão',
    fontes: ['/musicas/tema.mp3', '/musicas/tema.mp3.mpeg', '/musicas/tema.mpeg'],
  },
]

// Singleton do <audio> — persiste entre navegações
declare global {
  interface Window {
    __palpitaoAudio?: HTMLAudioElement
    __palpitaoAudioState?: {
      faixaId: string
      modoPlaylist: boolean
      tocando: boolean
    }
  }
}

function getAudioSingleton(): HTMLAudioElement {
  if (typeof window === 'undefined') throw new Error('SSR')
  if (!window.__palpitaoAudio) {
    const audio = new Audio()
    audio.loop = true   // padrão: loop na faixa atual
    audio.volume = 0.4
    window.__palpitaoAudio = audio
    window.__palpitaoAudioState = { faixaId: PLAYLIST[0].id, modoPlaylist: false, tocando: false }
  }
  return window.__palpitaoAudio!
}

function trySrc(audio: HTMLAudioElement, fontes: string[], idx = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (idx >= fontes.length) {
      reject(new Error('Nenhuma fonte da música carregou.'))
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

export function PlayerMusica() {
  const [faixaAtualIdx, setFaixaAtualIdx] = useState(0)
  const [tocando, setTocando] = useState(false)
  const [carregado, setCarregado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = getAudioSingleton()
    audioRef.current = audio

    // Sincroniza estado inicial com o singleton
    const state = window.__palpitaoAudioState!
    const idx = PLAYLIST.findIndex((f) => f.id === state.faixaId)
    setFaixaAtualIdx(idx >= 0 ? idx : 0)
    setTocando(!audio.paused)

    // Se ainda não carregou, tenta carregar a faixa atual
    if (!audio.src) {
      trySrc(audio, PLAYLIST[idx >= 0 ? idx : 0].fontes)
        .then(() => setCarregado(true))
        .catch((e) => setErro((e as Error).message))
    } else {
      setCarregado(true)
    }

    // Handlers pra sincronizar UI com o singleton
    const onPlay = () => setTocando(true)
    const onPause = () => setTocando(false)
    const onEnded = () => {
      // Ao terminar (só acontece em modo playlist, pois loop=true no modo tema)
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
        await audio.play()
      } catch (e) {
        setErro('Não deu pra tocar. Toque de novo.')
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
    audio.loop = !modoPlaylist  // playlist = sem loop; tema = loop
    try {
      await trySrc(audio, PLAYLIST[idx].fontes)
      await audio.play()
    } catch (e) {
      setErro((e as Error).message)
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
    <div className="flex items-center gap-3 rounded-lg border-2 border-dourado-300 bg-papel-50 px-3 py-2 shadow-sm">
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
          disabled={PLAYLIST.length <= 1}
          className="rounded-md border border-dourado-300 bg-papel-100 px-2 py-1 font-mono text-xs text-dourado-700 hover:bg-dourado-50 disabled:opacity-30"
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
          disabled={PLAYLIST.length <= 1}
          className="rounded-md border border-dourado-300 bg-papel-100 px-2 py-1 font-mono text-xs text-dourado-700 hover:bg-dourado-50 disabled:opacity-30"
          aria-label="Próxima"
        >
          ⏭
        </button>
      </div>
    </div>
  )
}

// ─── Helper exportado pra outros componentes iniciarem a música ─────────────

/** Chame no clique de "Abrir Álbum" (gesto do usuário libera autoplay).
 *  Se não conseguir, falha silenciosamente — o mp3 pode nem existir ainda. */
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
    // silencioso — se o mp3 não existir, não faz nada
  }
}
