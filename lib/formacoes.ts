// Catálogo de formações táticas do Palpitão Brasileirão.
//
// Cada formação declara:
//  - tipo: 'classica' | 'doida' (afeta como o motor distribui jogadores)
//  - slots: quantos por tier (gol/def/mei/ata) — usado nas clássicas
//  - posicoes: coordenadas [left%, top%] pra cada jogador em campo (11 pos)
//  - banco: coordenadas [xpx, ypx] pros reservas (3 pos)
//
// Nas doidas, o campo 'slots' é ignorado — o motor distribui os 14 jogadores
// linearmente nas posições declaradas (14 posições em vez de 11+3).

export type TipoFormacao = 'classica' | 'doida'

export interface Formacao {
  id: string
  nome: string
  apelido?: string
  tipo: TipoFormacao
  slots?: { gol: number; def: number; mei: number; ata: number }
  /** Posições em campo (11 nas clássicas, 14 nas doidas). Ordem = ordem de
   *  colocação: [GOL, ...DEF, ...MEI, ...ATA] nas clássicas. */
  posicoes: Array<{ left: string; top: string }>
  /** Coordenadas de banco (px de cena 390×844). Só usado nas clássicas. */
  banco: Array<{ xpx: number; ypx: number }>
}

// ─── CLÁSSICAS ────────────────────────────────────────────────────────────

const BANCO_PADRAO = [
  { xpx: 87, ypx: 734 },
  { xpx: 146, ypx: 734 },
  { xpx: 205, ypx: 734 },
  { xpx: 264, ypx: 734 },
]

export const FORMACOES: Formacao[] = [
  {
    id: '4-3-3', nome: '4-3-3', tipo: 'classica',
    slots: { gol: 1, def: 4, mei: 3, ata: 3 },
    posicoes: [
      { left: '50%', top: '86%' },                                    // GOL
      { left: '16%', top: '74%' }, { left: '39%', top: '74%' },       // DEF
      { left: '61%', top: '74%' }, { left: '84%', top: '74%' },
      { left: '25%', top: '52%' }, { left: '50%', top: '52%' }, { left: '75%', top: '52%' }, // MEI
      { left: '22%', top: '29%' }, { left: '50%', top: '29%' }, { left: '78%', top: '29%' }, // ATA
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '4-4-2-linha', nome: '4-4-2', apelido: 'linha', tipo: 'classica',
    slots: { gol: 1, def: 4, mei: 4, ata: 2 },
    posicoes: [
      { left: '50%', top: '86%' },
      { left: '16%', top: '74%' }, { left: '39%', top: '74%' }, { left: '61%', top: '74%' }, { left: '84%', top: '74%' },
      { left: '16%', top: '52%' }, { left: '39%', top: '52%' }, { left: '61%', top: '52%' }, { left: '84%', top: '52%' },
      { left: '35%', top: '28%' }, { left: '65%', top: '28%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '4-4-2-diamante', nome: '4-4-2', apelido: 'diamante', tipo: 'classica',
    slots: { gol: 1, def: 4, mei: 4, ata: 2 },
    posicoes: [
      { left: '50%', top: '86%' },
      { left: '16%', top: '74%' }, { left: '39%', top: '74%' }, { left: '61%', top: '74%' }, { left: '84%', top: '74%' },
      { left: '50%', top: '62%' }, { left: '22%', top: '50%' }, { left: '78%', top: '50%' }, { left: '50%', top: '38%' },
      { left: '35%', top: '20%' }, { left: '65%', top: '20%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '3-5-2', nome: '3-5-2', tipo: 'classica',
    slots: { gol: 1, def: 3, mei: 5, ata: 2 },
    posicoes: [
      { left: '50%', top: '86%' },
      { left: '25%', top: '74%' }, { left: '50%', top: '74%' }, { left: '75%', top: '74%' },
      { left: '12%', top: '54%' }, { left: '32%', top: '54%' }, { left: '50%', top: '54%' }, { left: '68%', top: '54%' }, { left: '88%', top: '54%' },
      { left: '35%', top: '28%' }, { left: '65%', top: '28%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '5-3-2', nome: '5-3-2', tipo: 'classica',
    slots: { gol: 1, def: 5, mei: 3, ata: 2 },
    posicoes: [
      { left: '50%', top: '86%' },
      { left: '12%', top: '74%' }, { left: '32%', top: '74%' }, { left: '50%', top: '74%' }, { left: '68%', top: '74%' }, { left: '88%', top: '74%' },
      { left: '25%', top: '50%' }, { left: '50%', top: '50%' }, { left: '75%', top: '50%' },
      { left: '35%', top: '26%' }, { left: '65%', top: '26%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '4-2-3-1', nome: '4-2-3-1', tipo: 'classica',
    slots: { gol: 1, def: 4, mei: 5, ata: 1 },
    posicoes: [
      { left: '50%', top: '86%' },
      { left: '16%', top: '70%' }, { left: '39%', top: '70%' }, { left: '61%', top: '70%' }, { left: '84%', top: '70%' },
      { left: '35%', top: '53%' }, { left: '65%', top: '53%' },
      { left: '22%', top: '36%' }, { left: '50%', top: '36%' }, { left: '78%', top: '36%' },
      { left: '50%', top: '20%' },
    ],
    banco: BANCO_PADRAO,
  },

  // ─── DOIDAS (14 posições, ignoram tiers) ────────────────────────────────

  {
    id: '9-0-1', nome: '9-0-1', apelido: 'Retranca', tipo: 'doida',
    posicoes: [
      { left: '50%', top: '90%' },                                     // gol
      { left: '10%', top: '78%' }, { left: '25%', top: '78%' }, { left: '40%', top: '78%' },
      { left: '55%', top: '78%' }, { left: '70%', top: '78%' }, { left: '85%', top: '78%' },
      { left: '20%', top: '66%' }, { left: '40%', top: '66%' }, { left: '60%', top: '66%' }, { left: '80%', top: '66%' },
      { left: '30%', top: '54%' }, { left: '70%', top: '54%' },
      { left: '50%', top: '18%' },                                     // solitário na frente
    ],
    banco: [],
  },

  {
    id: '1-2-8', nome: '1-2-8', apelido: 'Tudo pro ataque', tipo: 'doida',
    posicoes: [
      { left: '50%', top: '90%' },
      { left: '50%', top: '70%' },
      { left: '30%', top: '56%' }, { left: '70%', top: '56%' },
      { left: '10%', top: '38%' }, { left: '25%', top: '38%' }, { left: '40%', top: '38%' }, { left: '55%', top: '38%' },
      { left: '70%', top: '38%' }, { left: '85%', top: '38%' },
      { left: '25%', top: '18%' }, { left: '45%', top: '18%' }, { left: '65%', top: '18%' }, { left: '85%', top: '18%' },
    ],
    banco: [],
  },

  {
    id: 'circulo', nome: 'Círculo', apelido: 'Roda de bar', tipo: 'doida',
    posicoes: (() => {
      const cx = 50, cy = 50, r = 32
      return Array.from({ length: 14 }, (_, i) => {
        const ang = (i / 14) * Math.PI * 2 - Math.PI / 2
        return {
          left: `${(cx + r * Math.cos(ang)).toFixed(1)}%`,
          top:  `${(cy + r * Math.sin(ang)).toFixed(1)}%`,
        }
      })
    })(),
    banco: [],
  },

  {
    id: 'coracao', nome: 'Coração', apelido: 'Corny mas fofo', tipo: 'doida',
    // 14 pontos parametrizados numa curva de coração
    posicoes: (() => {
      const pts: Array<{ left: string; top: string }> = []
      for (let i = 0; i < 14; i++) {
        const t = (i / 14) * Math.PI * 2
        const x = 16 * Math.pow(Math.sin(t), 3)
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
        // Normaliza pra 5%–95% horizontal e 12%–85% vertical
        const left = 50 + (x / 16) * 42
        const top = 50 + (y / 16) * 36
        pts.push({ left: `${left.toFixed(1)}%`, top: `${top.toFixed(1)}%` })
      }
      return pts
    })(),
    banco: [],
  },

  {
    id: 'w', nome: 'W', apelido: 'Time do Zico', tipo: 'doida',
    posicoes: [
      { left: '50%', top: '88%' },
      { left: '20%', top: '76%' }, { left: '35%', top: '68%' }, { left: '50%', top: '76%' },
      { left: '65%', top: '68%' }, { left: '80%', top: '76%' },
      { left: '20%', top: '48%' }, { left: '40%', top: '40%' }, { left: '50%', top: '48%' },
      { left: '60%', top: '40%' }, { left: '80%', top: '48%' },
      { left: '30%', top: '22%' }, { left: '50%', top: '22%' }, { left: '70%', top: '22%' },
    ],
    banco: [],
  },

  {
    id: 'fila', nome: 'Fila indiana', apelido: 'Da defesa ao ataque', tipo: 'doida',
    posicoes: Array.from({ length: 14 }, (_, i) => ({
      left: '50%',
      top: `${(88 - (i * 68 / 13)).toFixed(1)}%`,
    })),
    banco: [],
  },

  {
    id: 'x', nome: 'X', apelido: 'Marca em zona', tipo: 'doida',
    posicoes: [
      { left: '50%', top: '86%' },
      { left: '15%', top: '78%' }, { left: '85%', top: '78%' },
      { left: '28%', top: '65%' }, { left: '72%', top: '65%' },
      { left: '40%', top: '52%' }, { left: '60%', top: '52%' },
      { left: '50%', top: '45%' },
      { left: '40%', top: '38%' }, { left: '60%', top: '38%' },
      { left: '28%', top: '25%' }, { left: '72%', top: '25%' },
      { left: '15%', top: '12%' }, { left: '85%', top: '12%' },
    ],
    banco: [],
  },

  {
    id: 'bola', nome: 'Bola', apelido: 'Rolando pro gol', tipo: 'doida',
    posicoes: (() => {
      // Espiral saindo do centro
      const pts: Array<{ left: string; top: string }> = []
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 4
        const r = 6 + i * 2.5
        pts.push({
          left: `${(50 + r * Math.cos(ang)).toFixed(1)}%`,
          top: `${(50 + r * Math.sin(ang)).toFixed(1)}%`,
        })
      }
      return pts
    })(),
    banco: [],
  },

  {
    id: '4-5-1', nome: '4-5-1', apelido: 'Ônibus estacionado', tipo: 'classica',
    slots: { gol: 1, def: 4, mei: 5, ata: 1 },
    posicoes: [
      { left: '50%', top: '90%' },
      { left: '16%', top: '74%' }, { left: '39%', top: '74%' }, { left: '61%', top: '74%' }, { left: '84%', top: '74%' },
      { left: '12%', top: '50%' }, { left: '31%', top: '50%' }, { left: '50%', top: '50%' }, { left: '69%', top: '50%' }, { left: '88%', top: '50%' },
      { left: '50%', top: '22%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '3-4-3', nome: '3-4-3', apelido: 'Tridente', tipo: 'classica',
    slots: { gol: 1, def: 3, mei: 4, ata: 3 },
    posicoes: [
      { left: '50%', top: '90%' },
      { left: '25%', top: '74%' }, { left: '50%', top: '74%' }, { left: '75%', top: '74%' },
      { left: '18%', top: '52%' }, { left: '39%', top: '52%' }, { left: '61%', top: '52%' }, { left: '82%', top: '52%' },
      { left: '20%', top: '24%' }, { left: '50%', top: '24%' }, { left: '80%', top: '24%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '4-1-4-1', nome: '4-1-4-1', apelido: 'Volante de proteção', tipo: 'classica',
    slots: { gol: 1, def: 4, mei: 5, ata: 1 },
    posicoes: [
      { left: '50%', top: '90%' },
      { left: '16%', top: '76%' }, { left: '39%', top: '76%' }, { left: '61%', top: '76%' }, { left: '84%', top: '76%' },
      { left: '50%', top: '60%' },
      { left: '16%', top: '44%' }, { left: '39%', top: '44%' }, { left: '61%', top: '44%' }, { left: '84%', top: '44%' },
      { left: '50%', top: '20%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '4-3-1-2', nome: '4-3-1-2', apelido: 'Losango ofensivo', tipo: 'classica',
    slots: { gol: 1, def: 4, mei: 4, ata: 2 },
    posicoes: [
      { left: '50%', top: '90%' },
      { left: '16%', top: '76%' }, { left: '39%', top: '76%' }, { left: '61%', top: '76%' }, { left: '84%', top: '76%' },
      { left: '25%', top: '56%' }, { left: '50%', top: '56%' }, { left: '75%', top: '56%' },
      { left: '50%', top: '38%' },
      { left: '35%', top: '20%' }, { left: '65%', top: '20%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: '2-3-5', nome: '2-3-5', apelido: 'Pirâmide (anos 20)', tipo: 'classica',
    slots: { gol: 1, def: 2, mei: 3, ata: 5 },
    posicoes: [
      { left: '50%', top: '90%' },
      { left: '35%', top: '76%' }, { left: '65%', top: '76%' },
      { left: '22%', top: '58%' }, { left: '50%', top: '58%' }, { left: '78%', top: '58%' },
      { left: '10%', top: '26%' }, { left: '30%', top: '26%' }, { left: '50%', top: '26%' }, { left: '70%', top: '26%' }, { left: '90%', top: '26%' },
    ],
    banco: BANCO_PADRAO,
  },

  {
    id: 'parede', nome: 'Parede', apelido: 'Ninguém passa', tipo: 'doida',
    posicoes: [
      { left: '50%', top: '92%' },
      { left: '8%', top: '82%' }, { left: '21%', top: '82%' }, { left: '34%', top: '82%' }, { left: '47%', top: '82%' },
      { left: '60%', top: '82%' }, { left: '73%', top: '82%' }, { left: '86%', top: '82%' },
      { left: '14%', top: '70%' }, { left: '27%', top: '70%' }, { left: '40%', top: '70%' }, { left: '53%', top: '70%' },
      { left: '66%', top: '70%' }, { left: '79%', top: '70%' },
    ],
    banco: [],
  },

  {
    id: 'estrela', nome: 'Estrela', apelido: 'Cinco pontas', tipo: 'doida',
    posicoes: (() => {
      const cx = 50, cy = 52
      return Array.from({ length: 14 }, (_, i) => {
        const ang = (i / 14) * Math.PI * 2 - Math.PI / 2
        const r = i % 2 === 0 ? 38 : 18
        return {
          left: `${(cx + r * Math.cos(ang)).toFixed(1)}%`,
          top: `${(cy + r * Math.sin(ang) * 0.85).toFixed(1)}%`,
        }
      })
    })(),
    banco: [],
  },

  {
    id: 'escada', nome: 'Escada', apelido: 'Degrau a degrau', tipo: 'doida',
    posicoes: Array.from({ length: 14 }, (_, i) => ({
      left: `${(10 + (i * 80) / 13).toFixed(1)}%`,
      top: `${(90 - (i * 78) / 13).toFixed(1)}%`,
    })),
    banco: [],
  },

  {
    id: 'ampulheta', nome: 'Ampulheta', apelido: 'Igual ao troféu do app', tipo: 'doida',
    posicoes: [
      { left: '15%', top: '12%' }, { left: '50%', top: '12%' }, { left: '85%', top: '12%' },
      { left: '30%', top: '28%' }, { left: '50%', top: '28%' }, { left: '70%', top: '28%' },
      { left: '42%', top: '50%' }, { left: '58%', top: '50%' },
      { left: '30%', top: '72%' }, { left: '50%', top: '72%' }, { left: '70%', top: '72%' },
      { left: '15%', top: '88%' }, { left: '50%', top: '88%' }, { left: '85%', top: '88%' },
    ],
    banco: [],
  },

  {
    id: 'sorriso', nome: 'Sorriso', apelido: 'De boa com a derrota', tipo: 'doida',
    posicoes: (() => {
      const pts: Array<{ left: string; top: string }> = [
        { left: '35%', top: '30%' }, { left: '65%', top: '30%' }, // olhos
      ]
      for (let i = 0; i < 12; i++) {
        const x = -1 + (i / 11) * 2 // -1 a 1
        const left = 50 + x * 38
        const top = 55 + (1 - x * x) * 22 // sorriso: cantos sobem, meio desce
        pts.push({ left: `${left.toFixed(1)}%`, top: `${top.toFixed(1)}%` })
      }
      return pts
    })(),
    banco: [],
  },
]

/** Busca uma formação pelo id, com fallback pra 4-3-3. */
export function getFormacao(id: string | null | undefined): Formacao {
  if (!id) return FORMACOES[0]
  return FORMACOES.find((f) => f.id === id) ?? FORMACOES[0]
}
