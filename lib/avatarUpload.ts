import { supabase } from './supabase'

// Helper de upload de foto de perfil.
//
// Fluxo: input file → canvas comprime + redimensiona pra 300x300 (foto de
// perfil não precisa ser HD) → base64 → salva em participants.avatar.
//
// Comprime pra ~50-100KB (aceitável no banco text sem estourar).
// object-cover no CSS garante enquadramento circular decente.

const TAMANHO_FINAL = 300 // px (quadrado)
const QUALIDADE_JPEG = 0.85

/** Converte File (do input) em base64 comprimido e redimensionado. */
export async function processarFoto(file: File): Promise<string> {
  // Valida tamanho antes de processar (10MB máx do arquivo original)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. Máximo 10 MB.')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Arquivo precisa ser uma imagem.')
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await carregarImagem(url)
    return redimensionarPraBase64(img)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não consegui ler essa imagem.'))
    img.src = url
  })
}

/** Redimensiona pra quadrado 300x300 usando center-crop e devolve base64 JPEG. */
function redimensionarPraBase64(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = TAMANHO_FINAL
  canvas.height = TAMANHO_FINAL
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Navegador não suporta canvas.')

  // Center-crop: se a imagem for retangular, corta pelas bordas maiores
  const menorLado = Math.min(img.naturalWidth, img.naturalHeight)
  const offsetX = (img.naturalWidth - menorLado) / 2
  const offsetY = (img.naturalHeight - menorLado) / 2

  ctx.drawImage(
    img,
    offsetX, offsetY, menorLado, menorLado,   // source (crop quadrado do centro)
    0, 0, TAMANHO_FINAL, TAMANHO_FINAL,       // destino (300x300)
  )

  return canvas.toDataURL('image/jpeg', QUALIDADE_JPEG)
}

/** Salva a foto (base64) em participants.avatar. */
export async function salvarFotoPerfil(participantId: string, base64: string | null): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ avatar: base64 })
    .eq('id', participantId)
  if (error) throw error
}

/** Salva o emoji em participants.emoji (aceita null pra remover). */
export async function salvarEmoji(participantId: string, emoji: string | null): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ emoji: emoji })
    .eq('id', participantId)
  if (error) throw error
}

/** Lê foto + emoji atualizados de um participante. */
export async function buscarAvatarEmoji(participantId: string): Promise<{ avatar: string | null; emoji: string | null }> {
  const { data, error } = await supabase
    .from('participants')
    .select('avatar, emoji')
    .eq('id', participantId)
    .single()
  if (error) throw error
  return { avatar: data.avatar, emoji: data.emoji }
}
