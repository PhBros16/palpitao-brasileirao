// Helpers de leitura/escrita da playlist do Supabase.

import { supabase } from './supabase'

export interface Musica {
  id: string
  titulo: string
  artista: string
  arquivo: string
  ordem: number
  ativa: boolean
  is_tema: boolean
}

export async function buscarMusicasAtivas(): Promise<Musica[]> {
  const { data, error } = await supabase
    .from('musicas')
    .select('*')
    .eq('ativa', true)
    .order('ordem', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function buscarTodasMusicas(): Promise<Musica[]> {
  const { data, error } = await supabase
    .from('musicas')
    .select('*')
    .order('ordem', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function adicionarMusica(
  titulo: string,
  artista: string,
  arquivo: string,
): Promise<void> {
  // Pega a próxima ordem
  const { data: ult } = await supabase
    .from('musicas')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()
  const proximaOrdem = (ult?.ordem ?? -1) + 1

  const { error } = await supabase.from('musicas').insert({
    titulo,
    artista,
    arquivo,
    ordem: proximaOrdem,
    ativa: true,
    is_tema: false,
  })
  if (error) throw new Error(error.message)
}

export async function removerMusica(id: string): Promise<void> {
  const { error } = await supabase.from('musicas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function alternarAtiva(id: string, ativa: boolean): Promise<void> {
  const { error } = await supabase.from('musicas').update({ ativa }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function definirComoTema(id: string): Promise<void> {
  // Primeiro tira o is_tema de todas (respeita o unique index)
  const { error: e1 } = await supabase
    .from('musicas')
    .update({ is_tema: false })
    .eq('is_tema', true)
  if (e1) throw new Error(e1.message)

  // Depois marca a nova
  const { error: e2 } = await supabase
    .from('musicas')
    .update({ is_tema: true })
    .eq('id', id)
  if (e2) throw new Error(e2.message)
}
