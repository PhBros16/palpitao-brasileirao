import type { JogadorBanco, JogadorCampo } from './tipos'
import { getFormacao, type Formacao } from '@/lib/formacoes'

// Elenco do Palpitão Brasileirão — nomes reais dos 14 participantes.
//
// Tiers naturais (definidos pelo admin, cf. seção "Alterar Formação"):
//   GOL: André
//   DEF: Ramon, Costa, Giovanni, Pedro Gaúcho
//   MEI: Victor Simões, Pedro Frozza, Diniz
//   ATA: PH, Matheus Couto, Matheus Brito
//   TÉCNICO: Victor Bahia
//   BANCO: Samuel, Damus
//
// A formação (4-3-3, 5-3-2, Coração, etc.) é dinâmica — vem de app_settings.
// Este arquivo exporta uma FUNÇÃO que aceita o id da formação escolhida e
// devolve TITULARES + BANCO + TECNICO já posicionados. O componente da
// abertura busca a formação atual e chama gerarElenco(formId).

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

// Conversão % → px de cena (mesmas dimensões do arquivo original: 390×844,
// campo interno de 366×708 começando em left:12 top:12). Só o motor da
// abertura usa xpx/ypx pra calcular vetores de corrida em fila.
function pctToPx(left: string, top: string): { xpx: number; ypx: number } {
  const l = parseFloat(left) / 100
  const t = parseFloat(top) / 100
  return { xpx: 12 + l * 366, ypx: 12 + t * 708 }
}

/** Distribui os jogadores nas posições da formação seguindo os slots.
 *  Nas clássicas, respeita tiers (com fallback pra vizinho se sobra/falta).
 *  Nas doidas, ordem alfabética por numero. */
function distribuir(formacao: Formacao): { titulares: Jogador[]; banco: Jogador[]; tecnico: Jogador | null } {
  if (formacao.tipo === 'doida') {
    // Todos os 14 entram em campo, tirando o técnico (que é decorativo).
    // Ordem: gol → def → mei → ata → tec → res
    const ordem = ['gol', 'def', 'mei', 'ata', 'tec', 'res']
    const emCampo = [...ELENCO].sort((a, b) => ordem.indexOf(a.tierNatural) - ordem.indexOf(b.tierNatural))
    return { titulares: emCampo, banco: [], tecnico: null }
  }

  // Clássica: respeita slots
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
  const banco: Jogador[] = []

  // GOL
  if (gol >= 1) titulares.push(naturais.gol[0])
  banco.push(...naturais.gol.slice(1))

  // DEF
  const defEscolhidos = naturais.def.slice(0, def)
  const defSobra = naturais.def.slice(def)
  titulares.push(...defEscolhidos)

  // MEI (recebe sobras da def se precisar mais)
  let meiPool = [...naturais.mei, ...defSobra]
  const meiEscolhidos = meiPool.slice(0, mei)
  const meiSobra = meiPool.slice(mei)
  titulares.push(...meiEscolhidos)

  // ATA (recebe sobras do meio se precisar mais)
  let ataPool = [...naturais.ata, ...meiSobra]
  const ataEscolhidos = ataPool.slice(0, ata)
  const ataSobra = ataPool.slice(ata)
  titulares.push(...ataEscolhidos)

  // Banco = quem sobrou + reservas oficiais (max 3, o resto some)
  banco.push(...ataSobra, ...reservas)

  return { titulares, banco: banco.slice(0, 3), tecnico: tec }
}

/** Gera TITULARES/BANCO/TECNICO já posicionados pra formação informada.
 *  Se formacaoId for null/inválido, cai em 4-3-3. */
export function gerarElenco(formacaoId: string | null | undefined): {
  TITULARES: JogadorCampo[]
  BANCO: JogadorBanco[]
  TECNICO: JogadorBanco
} {
  const formacao = getFormacao(formacaoId)
  const { titulares, banco, tecnico } = distribuir(formacao)

  const TITULARES: JogadorCampo[] = titulares.map((p, i) => {
    const pos = formacao.posicoes[i] ?? { left: '50%', top: '50%' }
    const { xpx, ypx } = pctToPx(pos.left, pos.top)
    // Tier de acendimento dos refletores (0..3). Nas doidas todo mundo é tier 2.
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
    }
  })

  const BANCO: JogadorBanco[] = banco.map((p, i) => {
    const coord = formacao.banco[i + 1] ?? { xpx: 146 + i * 59, ypx: 734 }
    return { id: p.id, iniciais: p.iniciais, nome: p.nome, numero: p.numero, xpx: coord.xpx, ypx: coord.ypx }
  })

  const tecCoord = formacao.banco[0] ?? { xpx: 87, ypx: 734 }
  const TECNICO: JogadorBanco = tecnico
    ? { id: tecnico.id, iniciais: tecnico.iniciais, nome: tecnico.nome, numero: '', xpx: tecCoord.xpx, ypx: tecCoord.ypx }
    : { id: 'tec-vazio', iniciais: '?', nome: '', numero: '', xpx: tecCoord.xpx, ypx: tecCoord.ypx }

  return { TITULARES, BANCO, TECNICO }
}

// ─── Exports de compatibilidade (formação 4-3-3 default) ───────────────────
// Mantém as constantes antigas exportadas pra não quebrar quem já importa
// TITULARES/BANCO/TECNICO diretamente. Componentes novos devem usar
// gerarElenco(formacaoId) diretamente.
const _default = gerarElenco('4-3-3')
export const TITULARES = _default.TITULARES
export const BANCO = _default.BANCO
export const TECNICO = _default.TECNICO
