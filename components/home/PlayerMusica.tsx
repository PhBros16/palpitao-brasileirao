'use client'

// PlayerMusica — mini-player fixo com playlist expandível.
//
// Puxa faixas do Supabase (tabela musicas). A música marcada como is_tema=true
// é a que toca em loop na Home. Se o usuário troca de faixa, entra em modo
// playlist (sequencial, sem loop).
//
// Comportamento:
//   - Ao entrar: tenta carregar o tema. Play automático só se o navegador
//     tiver liberado (via gesto do usuário na abertura).
//   - Loop: on por padrão (só na música tema).
//   - Playlist: se o usuário clica em ⏭ ou escolhe outra música, entra
//     em modo playlist (sem loop). Toca todas em sequência.
//   - Persiste entre navegações via singleton no window.

import { useEffect, useRef, useState } from 'react'
import { buscarMusicasAtivas, type Musica } from '@/lib/musicas'

// Singleton do <audio> — persiste entre navegações
declare global {
  interface Window {
    __palpitaoAudio?: HTMLAudioElement
    __palpitaoAudioState?: {
      faixaId: string
      modoPlaylist: boolean
    }
    __palpitaoPlaylist?: Musica[]
  }
}

function getAudioSingleton(): HTMLAudioElement {
  if (typeof window === 'undefined') throw new Error('SSR')
  if (!window.__palpitaoAudio) {
    const audio = new Audio()
    audio.loop = true
    audio.volume = 0.4
    window.__palpitaoAudio = audio
    window.__palpitaoAudioState = { faixaId: '', modoPlaylist: false }
  }
  return window.__palpitaoAudio!
}

// Tenta várias variantes de extensão pra ser tolerante a nomes tipo tema.mp3.mpeg
function variantesArquivo(arquivo: string): string[] {
  const variantes = [arquivo]
  // Se termina com .mp3.mpeg tenta também .mp3 puro e .mpeg puro
  if (arquivo.endsWith('.mp3.mpeg')) {
    const base = arquivo.slice(0, -'.mp3.mpeg'.length)
    variantes.push(`${base}.mp3`, `${base}.mpeg`)
  }
  return variantes
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
  const [playlist, setPlaylist] = useState<Musica[]>([])
  const [faixaAtualIdx, setFaixaAtualIdx] = useState(0)
  const [tocando, setTocando] = useState(false)
  const [expandido, setExpandido] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let mounted = true
    buscarMusicasAtivas()
      .then((lista) => {
        if (!mounted) return
        setPlaylist(lista)
        if (typeof window !== 'undefined') window.__palpitaoPlaylist = lista

        const audio = getAudioSingleton()
        audioRef.current = audio

        // Descobre qual está tocando (ou vai iniciar com o tema)
        const state = window.__palpitaoAudioState!
        let idx = lista.findIndex((f) => f.id === state.faixaId)
        if (idx < 0) {
          idx = lista.findIndex((f) => f.is_tema)
          if (idx < 0) idx = 0
        }
        setFaixaAtualIdx(idx)
        state.faixaId = lista[idx]?.id ?? ''
        setTocando(!audio.paused)

        if (!audio.src && lista[idx]) {
          trySrc(audio, variantesArquivo(lista[idx].arquivo)).catch(() => {
            setErro('Áudio não encontrado. Verifique o arquivo em /public.')
          })
        }
      })
      .catch((e) => setErro(`Erro ao carregar playlist: ${(e as Error).message}`))

    const audio = getAudioSingleton()
    audioRef.current = audio

    const onPlay = () => setTocando(true)
    const onPause = () => setTocando(false)
    const onEnded = () => {
      if (window.__palpitaoAudioState?.modoPlaylist) {
        const lista = window.__palpitaoPlaylist ?? []
        if (lista.length === 0) return
        const atualId = window.__palpitaoAudioState.faixaId
        const idxAtual = lista.findIndex((f) => f.id === atualId)
        const prox = (idxAtual + 1) % lista.length
        trocarParaId(lista[prox].id, true)
      }
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      mounted = false
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio || playlist.length === 0) return
    setErro(null)
    if (audio.paused) {
      try {
        if (!audio.src) {
          await trySrc(audio, variantesArquivo(playlist[faixaAtualIdx].arquivo))
        }
        await audio.play()
      } catch {
        setErro('Não deu pra tocar. Confira se o arquivo existe.')
      }
    } else {
      audio.pause()
    }
  }

  async function trocarParaId(id: string, modoPlaylist: boolean) {
    const audio = audioRef.current
    if (!audio) return
    const lista = playlist.length > 0 ? playlist : (window.__palpitaoPlaylist ?? [])
    const idx = lista.findIndex((f) => f.id === id)
    if (idx < 0) return
    setErro(null)
    setFaixaAtualIdx(idx)
    window.__palpitaoAudioState!.faixaId = id
    window.__palpitaoAudioState!.modoPlaylist = modoPlaylist
    audio.loop = !modoPlaylist
    try {
      await trySrc(audio, variantesArquivo(lista[idx].arquivo))
      await audio.play()
    } catch {
      setErro('Arquivo não encontrado.')
    }
  }

  function proximaFaixa() {
    if (playlist.length === 0) return
    const prox = (faixaAtualIdx + 1) % playlist.length
    trocarParaId(playlist[prox].id, true)
  }

  function faixaAnterior() {
    if (playlist.length === 0) return
    const ant = (faixaAtualIdx - 1 + playlist.length) % playlist.length
    trocarParaId(playlist[ant].id, true)
  }

  const faixa = playlist[faixaAtualIdx]

  if (playlist.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm p-3">
        <p className="font-sans text-xs text-tinta-100">
          {erro ?? 'Carregando playlist...'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm">
      {/* Barra principal */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-couro-300 text-lg">
          🎵
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-display text-xs font-bold uppercase tracking-widest text-dourado-800">
            Música {faixa?.is_tema ? 'Tema' : ''}
          </p>
          <p className="truncate font-sans text-[11px] text-tinta-200">
            {faixa?.titulo} · {faixa?.artista}
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
          {playlist.map((f, i) => {
            const ativa = i === faixaAtualIdx
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => trocarParaId(f.id, !f.is_tema)}
                className={cx(
                  'flex w-full items-center gap-2 border-b border-papel-borda-200/60 px-3 py-2 text-left last:border-0 transition-colors',
                  ativa ? 'bg-dourado-100' : 'hover:bg-papel-200',
                )}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-couro-100 text-sm">
                  {ativa && tocando ? '▶️' : (f.is_tema ? '👑' : '♪')}
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

// ─── Helper exportado pra outros componentes iniciarem a música tema ────────

export async function iniciarMusicaTema(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    // Se a playlist já foi carregada em algum player montado, usa cache
    let lista = window.__palpitaoPlaylist
    if (!lista || lista.length === 0) {
      lista = await buscarMusicasAtivas()
      window.__palpitaoPlaylist = lista
    }
    const tema = lista.find((f) => f.is_tema) ?? lista[0]
    if (!tema) return

    const audio = getAudioSingleton()
    if (!audio.src) {
      await trySrc(audio, variantesArquivo(tema.arquivo))
    }
    audio.loop = true
    window.__palpitaoAudioState!.modoPlaylist = false
    window.__palpitaoAudioState!.faixaId = tema.id
    await audio.play()
  } catch {
    // silencioso — mp3 pode não existir ainda
  }
}
