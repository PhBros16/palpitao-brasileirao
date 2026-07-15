import { supabase } from './supabase'

/** Camada genérica pra ler/salvar configs globais em app_settings (chave-JSON).
 *  Usada por: Alterar Formação, Projeção de Campeão, Gráfico de Evolução,
 *  Música Tema. */

export async function lerConfig<T = any>(key: string): Promise<T | null> {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return (data?.value as T) ?? null
}

export async function salvarConfig(key: string, value: any): Promise<void> {
  const { data: existente } = await supabase.from('app_settings').select('key').eq('key', key).maybeSingle()

  if (existente) {
    const { error } = await supabase.from('app_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
    if (error) throw error
  } else {
    const { error } = await supabase.from('app_settings').insert({ key, value })
    if (error) throw error
  }
}

// ─── Helpers específicos (tipagem forte + defaults) ─────────────────────────

export async function lerFormacaoId(): Promise<string> {
  const cfg = await lerConfig<{ nome: string } | { id: string }>('formacao')
  if (!cfg) return '4-3-3'
  // Aceita tanto {nome:'4-3-3'} (formato inicial do SQL) quanto {id:'4-3-3'}
  return (cfg as any).id ?? (cfg as any).nome ?? '4-3-3'
}

export async function salvarFormacaoId(id: string): Promise<void> {
  return salvarConfig('formacao', { id })
}
