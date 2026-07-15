import { supabase } from './supabase'
import { getFormacao } from './formacoes'
import type { LoginPlayer } from '@/components/login'

// FLAVOR local — apelido e tier natural são estética/layout, não existem no banco.
// Chave = nome exato como está em participants.name.
//
// Tiers naturais (fonte única de verdade — bate com elencoMock.ts):
//   GOL: André   |   DEF: Ramon, Costa, Giovanni, Pedro Gaúcho
//   MEI: Victor Simões, Pedro Frozza, Diniz
//   ATA: PH, Matheus Couto, Matheus Brito
//   TEC: Victor Bahia   |   RES: Samuel, Damus
type Tier = 'gol' | 'def' | 'mei' | 'ata' | 'tec' | 'res'

const FLAVOR: Record<string, { vulgo?: string; tier: Tier }> = {
  'André':          { vulgo: 'Paredão',    tier: 'gol' },
  'Ramon':          { vulgo: 'Xerife',     tier: 'def' },
  'Costa':          { vulgo: 'Muralha',    tier: 'def' },
  'Giovanni':       { vulgo: 'Zagueirão',  tier: 'def' },
  'Pedro Gaúcho':   { vulgo: 'Lateral',    tier: 'def' },
  'Victor Simões':  { vulgo: 'Maestro',    tier: 'mei' },
  'Pedro Frozza':   { vulgo: 'Volante',    tier: 'mei' },
  'Diniz':          { vulgo: 'Camisa 10',  tier: 'mei' },
  'PH':             { vulgo: 'Pcombo',     tier: 'ata' },
  'Matheus Couto':  { vulgo: 'Pistoleiro', tier: 'ata' },
  'Matheus Brito':  { vulgo: 'Artilheiro', tier: 'ata' },
  'Victor Bahia':   { vulgo: 'O Chefe',    tier: 'tec' },
  'Samuel':         { vulgo: 'Reserva',    tier: 'res' },
  'Damus':          { vulgo: 'Veterano',   tier: 'res' },
}

interface ParticipantRow {
  id: string
  name: string
  pin: string
  avatar: string | null
  is_admin: boolean
}

/** Distribui os participantes nas posições da formação (mesmo motor do
 *  elencoMock). Devolve LoginPlayer com posStyle = objeto de estilo inline
 *  (left/top em %). NÃO usa classes Tailwind dinâmicas — o JIT não as gera
 *  quando montadas em runtime via template string, e os jogadores somem do
 *  campo. Style inline resolve de vez. */
function distribuirPorFormacao(
  participantes: ParticipantRow[],
  formacaoId: string,
): LoginPlayer[] {
  const formacao = getFormacao(formacaoId)

  const comFlavor = participantes.map((p) => ({
    row: p,
    flavor: FLAVOR[p.name] ?? { tier: 'res' as Tier },
  }))

  const naturais = {
    gol: comFlavor.filter((x) => x.flavor.tier === 'gol'),
    def: comFlavor.filter((x) => x.flavor.tier === 'def'),
    mei: comFlavor.filter((x) => x.flavor.tier === 'mei'),
    ata: comFlavor.filter((x) => x.flavor.tier === 'ata'),
    tec: comFlavor.filter((x) => x.flavor.tier === 'tec'),
    res: comFlavor.filter((x) => x.flavor.tier === 'res'),
  }

  let ordenados: typeof comFlavor = []

  if (formacao.tipo === 'doida') {
    ordenados = [...naturais.gol, ...naturais.def, ...naturais.mei, ...naturais.ata, ...naturais.tec, ...naturais.res]
  } else {
    const { gol, def, mei, ata } = formacao.slots!
    const titulares: typeof comFlavor = []
    titulares.push(...naturais.gol.slice(0, gol))
    const defEscolhidos = naturais.def.slice(0, def)
    const defSobra = naturais.def.slice(def)
    titulares.push(...defEscolhidos)
    const meiPool = [...naturais.mei, ...defSobra]
    const meiEscolhidos = meiPool.slice(0, mei)
    const meiSobra = meiPool.slice(mei)
    titulares.push(...meiEscolhidos)
    const ataPool = [...naturais.ata, ...meiSobra]
    const ataEscolhidos = ataPool.slice(0, ata)
    const ataSobra = ataPool.slice(ata)
    titulares.push(...ataEscolhidos)
    const reservas = [...ataSobra, ...naturais.tec, ...naturais.res]
    ordenados = [...titulares, ...reservas]
  }

  return ordenados.map((x, i) => {
    const p = x.row
    const isTitular = formacao.tipo === 'doida' || i < formacao.posicoes.length
    let posStyle: { left: string; top: string } | undefined
    if (isTitular && formacao.posicoes[i]) {
      posStyle = { left: formacao.posicoes[i].left, top: formacao.posicoes[i].top }
    }
    return {
      id: p.id,
      nome: p.name,
      vulgo: x.flavor.vulgo,
      fotoUrl: p.avatar ?? undefined,
      pin: p.pin,
      titular: isTitular,
      posStyle,
      stats: { pts: 0, cravou: 0, pos: 0 },
    }
  })
}

/** Busca os participantes reais e monta LoginPlayer[] pro LoginGramado,
 *  respeitando a formação escolhida em app_settings (default 4-3-3). */
export async function buscarJogadoresLogin(formacaoId?: string): Promise<LoginPlayer[]> {
  const { data, error } = await supabase.from('participants').select('id, name, pin, avatar, is_admin')
  if (error) throw error

  const participantes = (data ?? []) as ParticipantRow[]
  return distribuirPorFormacao(participantes, formacaoId ?? '4-3-3')
}
