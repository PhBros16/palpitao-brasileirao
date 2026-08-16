'use client'

// HeaderUsuario — cabeçalho com foto/emoji + nome + botões.
// Agora com micro-interações, toasts e Modal animado.

import { useEffect, useRef, useState } from 'react'
import { lerLuzesLigadas } from './LuzesAmbiente'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { processarFoto, salvarFotoPerfil, salvarEmoji } from '@/lib/avatarUpload'
import { Modal } from './Modal'
import { showToast } from './Toast'
import { vibrar } from '@/lib/haptic'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function BotaoInterruptor() {
  const [ligado, setLigado] = useState(true)

  useEffect(() => {
    setLigado(lerLuzesLigadas())
  }, [])

  function alternar() {
    vibrar('leve')
    window.dispatchEvent(new Event('palpitao:alternarLuzes'))
    setLigado((l) => !l)
  }

  return (
    <motion.button
      type="button"
      onClick={alternar}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15 }}
      aria-label={ligado ? 'Desligar luzes' : 'Ligar luzes'}
      className="relative flex-shrink-0"
      style={{ width: 30, height: 40 }}
    >
      <svg viewBox="0 0 44 60" width="30" height="40">
        <rect x="2" y="2" width="40" height="56" rx="4" fill="#F0DBAA" stroke="#8B5A2B" strokeWidth="1.5" />
        <rect x="6" y="6" width="32" height="48" rx="2" fill="none" stroke="#B8860B" strokeWidth="0.5" opacity="0.5" />
        <circle cx="6" cy="6" r="1.5" fill="#5C3818" />
        <circle cx="38" cy="6" r="1.5" fill="#5C3818" />
        <circle cx="6" cy="54" r="1.5" fill="#5C3818" />
        <circle cx="38" cy="54" r="1.5" fill="#5C3818" />
        <rect x="14" y="14" width="16" height="32" rx="3" fill="#3E2A1A" stroke="#1a1408" strokeWidth="0.8" />
        <motion.rect
          x="14"
          y="14"
          width="16"
          height="16"
          rx="2"
          fill={ligado ? '#F5DC82' : '#6B4A15'}
          stroke="#1a1408"
          strokeWidth="1"
          animate={{
            y: ligado ? 14 : 30,
            fill: ligado ? '#F5DC82' : '#6B4A15',
          }}
          transition={{
            y: { type: 'spring', stiffness: 400, damping: 22 },
            fill: { duration: 0.2 },
          }}
        />
        <text x="22" y="12" fontSize="6" fontFamily="monospace" fontWeight="bold" fill="#5C3818" textAnchor="middle">I</text>
        <text x="22" y="53" fontSize="6" fontFamily="monospace" fontWeight="bold" fill="#5C3818" textAnchor="middle">O</text>
      </svg>
    </motion.button>
  )
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
    vibrar('medio')
    try { localStorage.removeItem('palpitao_sessao') } catch { /* ignora */ }
    showToast('Até logo!', 'info', 2000)
    router.replace('/')
  }

  function abrirPerfil() {
    vibrar('leve')
    setModalAberto(true)
  }

  function handleAtualizar() {
    vibrar('leve')
    onAtualizar()
  }

  return (
    <>
      <header className="flex items-center gap-3 rounded-lg border-2 border-dourado-300 bg-papel-50 px-3 py-2 shadow-sm">
        <motion.button
          type="button"
          onClick={abrirPerfil}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
          className="flex-shrink-0"
        >
          <AvatarCirculo avatar={avatar} emoji={emoji} nome={nome} tamanho="grande" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="truncate font-display text-base font-bold text-tinta-300">{nome}</p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">Participante</p>
        </div>
        <BotaoInterruptor />
        <motion.button
          type="button"
          onClick={handleAtualizar}
          disabled={atualizando}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.12 }}
          className="flex items-center gap-1 rounded-md border border-dourado-300 bg-papel-50 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-dourado-700 hover:bg-dourado-50 disabled:opacity-50"
        >
          <motion.span
            animate={atualizando ? { rotate: 360 } : { rotate: 0 }}
            transition={atualizando ? { duration: 0.9, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
            style={{ display: 'inline-block' }}
          >
            ↻
          </motion.span>
        </motion.button>
        <motion.button
          type="button"
          onClick={sair}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.12 }}
          className="rounded-md border border-couro-300 bg-couro-300 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-dourado-50 hover:bg-couro-400"
        >
          Sair
        </motion.button>
      </header>

      <PerfilModal
        aberto={modalAberto}
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

  if (avatar && avatar.trim().length > 0) {
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
  aberto,
  participantId,
  nome,
  avatarAtual,
  emojiAtual,
  onFechar,
  onSalvo,
}: {
  aberto: boolean
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

  // Ressincroniza os buffers com os valores atuais toda vez que o modal abre.
  // Sem isso, o useState só pega os valores da primeira montagem — se o
  // avatar/emoji mudar depois, o modal continua mostrando o antigo.
  useEffect(() => {
    if (aberto) {
      setEmojiBuf(emojiAtual ?? '')
      setAvatarBuf(avatarAtual)
    }
  }, [aberto, avatarAtual, emojiAtual])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await processarFoto(file)
      setAvatarBuf(base64)
      vibrar('leve')
      showToast('Foto carregada — não esqueça de salvar!', 'info', 2500)
    } catch (err) {
      vibrar('erro')
      showToast(`Erro ao processar foto: ${(err as Error).message}`, 'erro')
    }
  }

  async function salvarTudo() {
    setSalvando(true)
    try {
      if (avatarBuf !== avatarAtual) {
        await salvarFotoPerfil(participantId, avatarBuf)
      }
      const emojiFinal = emojiBuf.trim() || null
      if (emojiFinal !== emojiAtual) {
        await salvarEmoji(participantId, emojiFinal)
      }
      vibrar('sucesso')
      showToast('Perfil atualizado!', 'sucesso')
      onSalvo()
    } catch (err) {
      vibrar('erro')
      showToast(`Erro ao salvar: ${(err as Error).message}`, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  function removerFoto() {
    vibrar('leve')
    setAvatarBuf(null)
  }

  function escolherFoto() {
    vibrar('leve')
    fileInputRef.current?.click()
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} borda="border-dourado-400" className="overflow-hidden p-0">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b-2 border-dourado-300 bg-gradient-to-r from-dourado-100 to-dourado-50 px-4 py-3">
        <p className="font-display text-base font-bold uppercase tracking-widest text-dourado-800">
          Meu Perfil
        </p>
        <motion.button
          type="button"
          onClick={onFechar}
          whileTap={{ scale: 0.9 }}
          className="font-mono text-xs text-dourado-700 hover:text-dourado-900"
        >
          ✕
        </motion.button>
      </div>

      <div className="space-y-4 p-4">
        {/* Preview do avatar */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            key={`${avatarBuf}-${emojiBuf}`}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            <AvatarCirculo avatar={avatarBuf} emoji={emojiBuf} nome={nome} tamanho="grande" />
          </motion.div>
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
            <motion.button
              type="button"
              onClick={escolherFoto}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="flex-1 rounded-md border-2 border-dourado-400 bg-dourado-100 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-dourado-800 hover:bg-dourado-200"
            >
              {avatarBuf ? '↻ Trocar foto' : '📤 Escolher foto'}
            </motion.button>
            {avatarBuf && (
              <motion.button
                type="button"
                onClick={removerFoto}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.12 }}
                className="rounded-md border border-couro-300 px-3 py-2 font-mono text-xs uppercase text-couro-400 hover:bg-couro-50"
              >
                Remover
              </motion.button>
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

        {/* Ações */}
        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="flex-1 rounded-md border border-papel-borda-300 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-tinta-200 hover:bg-papel-100 disabled:opacity-50"
          >
            Cancelar
          </motion.button>
          <motion.button
            type="button"
            onClick={salvarTudo}
            disabled={salvando}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="flex-1 rounded-md border-2 border-dourado-500 bg-couro-300 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-dourado-50 hover:bg-couro-400 disabled:opacity-50"
          >
            {salvando ? '...' : '💾 Salvar'}
          </motion.button>
        </div>
      </div>
    </Modal>
  )
}
