import type { JogadorBanco, JogadorCampo } from './tipos'
import { getFormacao, type Formacao } from '@/lib/formacoes'

// Elenco do Palpitão Brasileirão — nomes reais dos 14 participantes.
//
// Tiers naturais:
//   GOL: André
//   DEF: Ramon, Costa, Giovanni, Pedro Gaúcho
//   MEI: Victor Simões, Pedro Frozza, Diniz
//   ATA: PH, Matheus Couto, Matheus Brito
//   TÉCNICO: Victor Bahia
//   BANCO: Samuel, Damus

interface Jogador {
  id: string
  iniciais: string
  nome: string
  numero: string
  tierNatural: 'gol' | 'def' | 'mei' | 'ata' | 'tec' | 'res'
}

const ELENCO: Jogador[] = [
  { id: 'p1',  iniciais: 'AN', nome: 'André',         numero: '1',  tierNatural: 'gol' },
  { id: 'p2',  iniciais: 'RA', nome: 'Ramon',         numero: '2',  tierNatural: 'def' },
  { id: 'p3',  iniciais: 'CO', nome: 'Costa',         numero: '3',  tierNatural: 'def' },
  { id: 'p4',  iniciais: 'GI', nome: 'Giovanni',      numero: '4',  tierNatural: 'def' },
  { id: 'p5',  iniciais: 'PG', nome: 'Pedro Gaúcho',  numero: '6',  tierNatural: 'def' },
  { id: 'p6',  iniciais: 'VS', nome: 'Victor Simões', numero: '10',  tierNatural: 'mei' },
  { id: 'p7',  iniciais: 'PF', nome: 'Pedro Frozza',  numero: '8',  tierNatural: 'mei' },
  { id: 'p8',  iniciais: 'DI', nome: 'Diniz',         numero: '5', tierNatural: 'mei' },
  { id: 'p9',  iniciais: 'PH', nome: 'PH',            numero: '7',  tierNatural: 'ata' },
  { id: 'p10', iniciais: 'MC', nome: 'Matheus Couto', numero: '9',  tierNatural: 'ata' },
  { id: 'p11', iniciais: 'MB', nome: 'Matheus Brito', numero: '11', tierNatural: 'ata' },
  { id: 'p12', iniciais: 'VB', nome: 'Victor Bahia',  numero: '',   tierNatural: 'tec' },
  { id: 'p13', iniciais: 'SA', nome: 'Samuel',        numero: '12', tierNatural: 'res' },
  { id: 'p14', iniciais: 'DA', nome: 'Damus',         numero: '13', tierNatural: 'res' },
]

function pctToPx(left: string, top: string): { xpx: number; ypx: number } {
  const l = parseFloat(left) / 100
  const t = parseFloat(top) / 100
  return { xpx: 12 + l * 366, ypx: 12 + t * 708 }
}

function distribuirLinhas(
  naturais: { def: Jogador[]; mei: Jogador[]; ata: Jogador[] },
  slots: { def: number; mei: number; ata: number },
): { def: Jogador[]; mei: Jogador[]; ata: Jogador[]; sobra: Jogador[] } {
  const poolDef = [...naturais.def]
  const poolMei = [...naturais.mei]
  const poolAta = [...naturais.ata]

  const escolhidos = { def: [] as Jogador[], mei: [] as Jogador[], ata: [] as Jogador[] }

  escolhidos.def = poolDef.splice(0, slots.def)
  escolhidos.mei = poolMei.splice(0, slots.mei)
  escolhidos.ata = poolAta.splice(0, slots.ata)

  while (escolhidos.def.length < slots.def && poolMei.length > 0) {
    escolhidos.def.push(poolMei.shift()!)
  }
  while (escolhidos.def.length < slots.def && poolAta.length > 0) {
    escolhidos.def.push(poolAta.shift()!)
  }

  while (escolhidos.mei.length < slots.mei && poolDef.length > 0) {
    escolhidos.mei.push(poolDef.shift()!)
  }
  while (escolhidos.mei.length < slots.mei && poolAta.length > 0) {
    escolhidos.mei.push(poolAta.shift()!)
  }

  while (escolhidos.ata.length < slots.ata && poolMei.length > 0) {
    escolhidos.ata.push(poolMei.shift()!)
  }
  while (escolhidos.ata.length < slots.ata && poolDef.length > 0) {
    escolhidos.ata.push(poolDef.shift()!)
  }

  const sobra = [...poolDef, ...poolMei, ...poolAta]

  return { ...escolhidos, sobra }
}

function distribuir(formacao: Formacao): { titulares: Jogador[]; banco: Jogador[]; tecnico: Jogador | null } {
  if (formacao.tipo === 'doida') {
    const ordem = ['gol', 'def', 'mei', 'ata', 'tec', 'res']
    const emCampo = [...ELENCO].sort((a, b) => ordem.indexOf(a.tierNatural) - ordem.indexOf(b.tierNatural))
    return { titulares: emCampo, banco: [], tecnico: null }
  }

  const { gol, def, mei, ata } = formacao.slots!

  const naturais = {
    gol: ELENCO.filter((p) => p.tierNatural === 'gol'),
    def: ELENCO.filter((p) => p.tierNatural === 'def'),
    mei: ELENCO.filter((p) => p.tierNatural === 'mei'),
    ata: ELENCO.filter((p) => p.tierNatural === 'ata'),
  }
  const tec = ELENCO.find((p) => p.tierNatural === 'tec') ?? null
  const reservas = ELENCO.filter((p) => p.tierNatural === 'res')

  const titulares: Jogador[] = []

  if (gol >= 1) titulares.push(naturais.gol[0])
  const golSobra = naturais.gol.slice(1)

  const linhas = distribuirLinhas(
    { def: naturais.def, mei: naturais.mei, ata: naturais.ata },
    { def, mei, ata },
  )
  titulares.push(...linhas.def, ...linhas.mei, ...linhas.ata)

  const banco = [...golSobra, ...linhas.sobra, ...reservas].slice(0, 3)

  return { titulares, banco, tecnico: tec }
}

/**
 * Gera TITULARES/BANCO/TECNICO já posicionados pra formação informada.
 * `avatares` opcional — map de nome → dataURL/URL da foto. Se omitido ou
 * o nome não tiver avatar, o ChipJogador cai nas iniciais.
 */
export function gerarElenco(
  formacaoId: string | null | undefined,
  avatares?: Map<string, string | null>,
): {
  TITULARES: JogadorCampo[]
  BANCO: JogadorBanco[]
  TECNICO: JogadorBanco
} {
  const formacao = getFormacao(formacaoId)
  const { titulares, banco, tecnico } = distribuir(formacao)

  const getAvatar = (nome: string): string | null =>
    avatares?.get(nome) ?? null

  const TITULARES: JogadorCampo[] = titulares.map((p, i) => {
    const pos = formacao.posicoes[i] ?? { left: '50%', top: '50%' }
    const { xpx, ypx } = pctToPx(pos.left, pos.top)
    let tier: 0 | 1 | 2 | 3 = 2
    if (formacao.tipo === 'classica') {
      if (p.tierNatural === 'gol') tier = 0
      else if (p.tierNatural === 'def') tier = 1
      else if (p.tierNatural === 'mei') tier = 2
      else tier = 3
    }
    return {
      id: p.id,
      iniciais: p.iniciais,
      nome: p.nome,
      numero: p.numero,
      left: pos.left,
      top: pos.top,
      tier,
      xpx,
      ypx,
      avatar: getAvatar(p.nome),
    }
  })

  const BANCO: JogadorBanco[] = banco.map((p, i) => {
    const coord = formacao.banco[i + 1] ?? { xpx: 146 + i * 59, ypx: 734 }
    return {
      id: p.id,
      iniciais: p.iniciais,
      nome: p.nome,
      numero: p.numero,
      xpx: coord.xpx,
      ypx: coord.ypx,
      avatar: getAvatar(p.nome),
    }
  })

  const tecCoord = formacao.banco[0] ?? { xpx: 87, ypx: 734 }
  const TECNICO: JogadorBanco = tecnico
    ? {
        id: tecnico.id,
        iniciais: tecnico.iniciais,
        nome: tecnico.nome,
        numero: '',
        xpx: tecCoord.xpx,
        ypx: tecCoord.ypx,
        avatar: getAvatar(tecnico.nome),
      }
    : { id: 'tec-vazio', iniciais: '?', nome: '', numero: '', xpx: tecCoord.xpx, ypx: tecCoord.ypx, avatar: null }

  return { TITULARES, BANCO, TECNICO }
}

// ─── Exports de compatibilidade (formação 4-3-3 default, sem avatares) ─────
const _default = gerarElenco('4-3-3')
export const TITULARES = _default.TITULARES
export const BANCO = _default.BANCO
export const TECNICO = _default.TECNICO


// ─── PIN lookup + Avatares pra abertura ───────────────────────────────────

import { supabase } from '@/lib/supabase'

// Sem campo "pin" — o PIN de verdade nunca sai do banco. Ver
// fix_pin_seguranca.sql: a comparação acontece dentro do Postgres,
// via validar_pin(), e a coluna pin fica travada pra leitura direta
// do navegador (anon key).
export interface JogadorComPin {
  id: string
  nome: string
  vulgo?: string
  avatar?: string | null
  isAdmin: boolean
}

const VULGO_MAP: Record<string, string> = {
  'André':          'Paredão',
  'Ramon':          'Xerife',
  'Costa':          'Muralha',
  'Giovanni':       'Zagueirão',
  'Pedro Gaúcho':   'ComeGorda',
  'Victor Simões':  'Analista',
  'Pedro Frozza':   'Volante',
  'Diniz':          'Camisa 10',
  'PH':             'Bolado',
  'Matheus Couto':  'Pistoleiro',
  'Matheus Brito':  'Artilheiro',
  'Victor Bahia':   'O Chefe',
  'Samuel':         'Reserva',
  'Damus':          'Novato',
}

/**
 * Busca dados PÚBLICOS do participante pra abrir o modal de PIN
 * (nome, avatar, se é admin). Não traz o PIN — só serve pra mostrar
 * o rosto/nome certo na tela antes da pessoa digitar o código.
 */
export async function buscarParticipantePorNome(nome: string): Promise<JogadorComPin | null> {
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, avatar, is_admin')
    .eq('name', nome)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    nome: data.name,
    vulgo: VULGO_MAP[data.name],
    avatar: data.avatar,
    isAdmin: data.is_admin ?? false,
  }
}

/**
 * Valida o PIN digitado chamando a função validar_pin() do Postgres
 * (ver fix_pin_seguranca.sql) — a comparação acontece no banco, o
 * navegador nunca sabe qual é o PIN certo, só se acertou ou não.
 */
export async function validarPin(nome: string, pinTentativa: string): Promise<JogadorComPin | null> {
  const { data, error } = await supabase
    .rpc('validar_pin', { nome_jogador: nome, pin_tentativa: pinTentativa })
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    nome: data.name,
    vulgo: VULGO_MAP[data.name],
    avatar: data.avatar,
    isAdmin: data.is_admin ?? false,
  }
}

/**
 * Busca todos os avatares dos participantes (map de nome → avatar).
 * Retorna Map vazio se der erro. Filtra participantes admin (Administração
 * não aparece no campinho como jogador).
 */
export async function buscarAvatares(): Promise<Map<string, string | null>> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('name, avatar')
    if (error || !data) return new Map()
    const m = new Map<string, string | null>()
    for (const p of data) {
      m.set(p.name, p.avatar ?? null)
    }
    return m
  } catch {
    return new Map()
  }
}
