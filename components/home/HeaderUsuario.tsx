'use client'

// HeaderUsuario — cabeçalho da Home com foto/emoji + nome + botões.
//
// Clique no avatar → abre modal de edição (upload foto + escolher emoji).
// Foto: sobe pela galeria, comprime pra 300x300 base64, salva em avatar.
// Emoji: campo de texto livre, aceita qualquer emoji ou 1-2 caracteres.

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { processarFoto, salvarFotoPerfil, salvarEmoji } from '@/lib/avatarUpload'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function HeaderUsuario({
  participantId,
  nome,
  avatar,
  emoji,
  onAtualizar,
  atualizando = false,
  onPerfilAlterado,
}: {
  participantId: string
  nome: string
  avatar: string | null
  emoji: string | null
  onAtualizar: () => void
  atualizando?: boolean
  onPerfilAlterado: () => void
}) {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)

  function sair() {
    try { localStorage.removeItem('palpitao_sessao') } catch { /* ignora */ }
    router.replace('/')
  }

  return (
    <>
      <header className="flex items-center gap-3 rounded-lg border-2 border-dourado-300 bg-papel-50 px-3 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex-shrink-0 transition-transform hover:scale-105"
        >
          <AvatarCirculo avatar={avatar} emoji={emoji} nome={nome} tamanho="grande" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="truncate font-display text-base font-bold text-tinta-300">{nome}</p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">Participante</p>
        </div>
        <button
          type="button"
          onClick={onAtualizar}
          disabled={atualizando}
          className="flex items-center gap-1 rounded-md border border-dourado-300 bg-papel-50 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-dourado-700 hover:bg-dourado-50 disabled:opacity-50"
        >
          {atualizando ? '...' : '↻'}
        </button>
        <button
          type="button"
          onClick={sair}
          className="rounded-md border border-couro-300 bg-couro-300 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-dourado-50 hover:bg-couro-400"
        >
          Sair
        </button>
      </header>

      {modalAberto && (
        <PerfilModal
          participantId={participantId}
          nome={nome}
          avatarAtual={avatar}
          emojiAtual={emoji}
          onFechar={() => setModalAberto(false)}
          onSalvo={() => {
            setModalAberto(false)
            onPerfilAlterado()
          }}
        />
      )}
    </>
  )
}

// ─── Círculo do avatar (reutilizável) ────────────────────────────────────────

export function AvatarCirculo({
  avatar,
  emoji,
  nome,
  tamanho,
}: {
  avatar: string | null
  emoji: string | null
  nome: string
  tamanho: 'pequeno' | 'medio' | 'grande'
}) {
  const dims = {
    pequeno: 'h-8 w-8 text-xs',
    medio: 'h-12 w-12 text-base',
    grande: 'h-14 w-14 text-lg',
  }[tamanho]

  // Prioridade: foto > emoji > iniciais
  if (avatar) {
    return (
      <div className={cx('overflow-hidden rounded-full border-2 border-dourado-400 bg-papel-100', dims)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt={nome}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }
  if (emoji) {
    return (
      <div className={cx('flex items-center justify-center rounded-full border-2 border-dourado-400 bg-dourado-100', dims)}>
        <span className={cx(tamanho === 'grande' ? 'text-2xl' : tamanho === 'medio' ? 'text-xl' : 'text-base')}>
          {emoji}
        </span>
      </div>
    )
  }
  return (
    <div className={cx('flex items-center justify-center rounded-full border-2 border-dourado-400 bg-dourado-100 font-display font-bold text-dourado-700', dims)}>
      {getIniciais(nome)}
    </div>
  )
}

// ─── Modal de edição do perfil ───────────────────────────────────────────────

function PerfilModal({
  participantId,
  nome,
  avatarAtual,
  emojiAtual,
  onFechar,
  onSalvo,
}: {
  participantId: string
  nome: string
  avatarAtual: string | null
  emojiAtual: string | null
  onFechar: () => void
  onSalvo: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [emojiBuf, setEmojiBuf] = useState<string>(emojiAtual ?? '')
  const [avatarBuf, setAvatarBuf] = useState<string | null>(avatarAtual)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro(null)
    try {
      const base64 = await processarFoto(file)
      setAvatarBuf(base64)
    } catch (err) {
      setErro((err as Error).message)
    }
  }

  async function salvarTudo() {
    setSalvando(true)
    setErro(null)
    try {
      // Salva foto se mudou
      if (avatarBuf !== avatarAtual) {
        await salvarFotoPerfil(participantId, avatarBuf)
      }
      // Salva emoji se mudou
      const emojiFinal = emojiBuf.trim() || null
      if (emojiFinal !== emojiAtual) {
        await salvarEmoji(participantId, emojiFinal)
      }
      onSalvo()
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  function removerFoto() {
    setAvatarBuf(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-lg border-2 border-dourado-400 bg-papel-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b-2 border-dourado-300 bg-gradient-to-r from-dourado-100 to-dourado-50 px-4 py-3">
          <p className="font-display text-base font-bold uppercase tracking-widest text-dourado-800">
            Meu Perfil
          </p>
          <button type="button" onClick={onFechar} className="font-mono text-xs text-dourado-700 hover:text-dourado-900">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Preview do avatar */}
          <div className="flex flex-col items-center gap-2">
            <AvatarCirculo avatar={avatarBuf} emoji={emojiBuf} nome={nome} tamanho="grande" />
            <p className="font-sans text-xs text-tinta-200">{nome}</p>
          </div>

          {/* Foto */}
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">
              📷 Foto de perfil
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-md border-2 border-dourado-400 bg-dourado-100 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-dourado-800 hover:bg-dourado-200"
              >
                {avatarBuf ? '↻ Trocar foto' : '📤 Escolher foto'}
              </button>
              {avatarBuf && (
                <button
                  type="button"
                  onClick={removerFoto}
                  className="rounded-md border border-couro-300 px-3 py-2 font-mono text-xs uppercase text-couro-400 hover:bg-couro-50"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">
              😎 Emoji (aparece do lado do nome nas tabelas)
            </p>
            <input
              type="text"
              value={emojiBuf}
              onChange={(e) => setEmojiBuf(e.target.value)}
              placeholder="ex: 🦅 ou 🔥"
              maxLength={4}
              className="w-full rounded-md border border-papel-borda-300 bg-papel-50 px-3 py-2 text-center font-sans text-xl outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
            />
          </div>

          {erro && (
            <p className="font-sans text-xs text-raridade-frango-selo">{erro}</p>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="flex-1 rounded-md border border-papel-borda-300 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-tinta-200 hover:bg-papel-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarTudo}
              disabled={salvando}
              className="flex-1 rounded-md border-2 border-dourado-500 bg-couro-300 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-dourado-50 hover:bg-couro-400 disabled:opacity-50"
            >
              {salvando ? '...' : '💾 Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
