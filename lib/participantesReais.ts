import { supabase } from './supabase'
import type { LoginPlayer } from '@/components/login'

// FLAVOR local — posição no campo, apelido e titular/reserva são só estética
// de layout, não existem no banco (participants tem só name/pin/avatar/is_admin).
// Chave = nome exato como está em participants.name.
//
// stats (pts/cravou/pos) ficam zerados aqui: o cálculo real de ranking entra
// numa próxima etapa (soma de predictions.points por participante). Mostrar
// zero é mais honesto que inventar números até lá.
const FLAVOR: Record<string, { vulgo?: string; titular: boolean; pos?: string }> = {
  'Ramon': { vulgo: 'Paredão', titular: true, pos: 'left-[50%] top-[76%]' },
  'Matheus Couto': { vulgo: 'Xerife', titular: true, pos: 'left-[21%] top-[63%]' },
  'Pedro Frozza': { vulgo: 'Muralha', titular: true, pos: 'left-[39%] top-[66%]' },
  'Pedro Gaúcho': { vulgo: 'Zagueirão', titular: true, pos: 'left-[61%] top-[66%]' },
  'Victor Bahia': { vulgo: 'Lateral', titular: true, pos: 'left-[79%] top-[63%]' },
  'Victor Simões': { vulgo: 'Maestro', titular: true, pos: 'left-[26%] top-[44%]' },
  'PH': { vulgo: 'Pcombo', titular: true, pos: 'left-[50%] top-[40%]' },
  'André': { vulgo: 'Volante', titular: true, pos: 'left-[74%] top-[44%]' },
  'Matheus Brito': { vulgo: 'Artilheiro', titular: true, pos: 'left-[24%] top-[20%]' },
  'Costa': { vulgo: 'Pistoleiro', titular: true, pos: 'left-[50%] top-[16%]' },
  'Diniz': { vulgo: 'Ponta', titular: true, pos: 'left-[76%] top-[20%]' },
  'Samuel': { vulgo: 'Reserva', titular: false },
  'Giovanni': { vulgo: 'Coringa', titular: false },
  'Damus': { vulgo: 'Veterano', titular: false },
}

interface ParticipantRow {
  id: string
  name: string
  pin: string
  avatar: string | null
  is_admin: boolean
}

/** Busca os participantes reais do Supabase e monta LoginPlayer[] pro LoginGramado. */
export async function buscarJogadoresLogin(): Promise<LoginPlayer[]> {
  const { data, error } = await supabase.from('participants').select('id, name, pin, avatar, is_admin')
  if (error) throw error

  return ((data ?? []) as ParticipantRow[]).map((p) => {
    const flavor = FLAVOR[p.name] ?? { titular: false }
    return {
      id: p.id,
      nome: p.name,
      vulgo: flavor.vulgo,
      fotoUrl: p.avatar ?? undefined,
      pin: p.pin,
      titular: flavor.titular,
      pos: flavor.pos,
      stats: { pts: 0, cravou: 0, pos: 0 },
    }
  })
}
