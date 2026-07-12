import type { JogadorBanco, JogadorCampo } from './tipos'

// Elenco mockado da abertura — MOCK temporário (CLAUDE.md Regra 2: o elenco
// real vem do Supabase na Fase 4). Nomes reais dos 14 participantes (mesmos
// da tabela `participants` no Supabase) — só posição/formação em campo é
// decisão de layout local, sem correspondência real com quem joga onde.
//
// Formação 4-3-3 (ataque para cima). left/top em % do retângulo do campo;
// xpx/ypx são a mesma posição convertida pra px de cena (390×844, campo em
// left:12,top:12,366×708) — usados pro vetor de corrida em fila única.
// tier: 0=goleiro, 1=defesa, 2=meio, 3=ataque — define ordem de entrada e de
// acendimento dos refletores por zona.
export const TITULARES: JogadorCampo[] = [
  { id: 'p1', iniciais: 'RA', nome: 'Ramon', numero: '1', left: '50%', top: '86%', tier: 0, xpx: 195, ypx: 620.88 },
  { id: 'p2', iniciais: 'MC', nome: 'Matheus Couto', numero: '2', left: '16%', top: '74%', tier: 1, xpx: 70.56, ypx: 535.92 },
  { id: 'p3', iniciais: 'PF', nome: 'Pedro Frozza', numero: '3', left: '39%', top: '74%', tier: 1, xpx: 154.74, ypx: 535.92 },
  { id: 'p4', iniciais: 'PG', nome: 'Pedro Gaúcho', numero: '4', left: '61%', top: '74%', tier: 1, xpx: 235.26, ypx: 535.92 },
  { id: 'p5', iniciais: 'VB', nome: 'Victor Bahia', numero: '6', left: '84%', top: '74%', tier: 1, xpx: 319.44, ypx: 535.92 },
  { id: 'p6', iniciais: 'VS', nome: 'Victor Simões', numero: '5', left: '25%', top: '52%', tier: 2, xpx: 103.5, ypx: 380.16 },
  { id: 'p7', iniciais: 'PH', nome: 'PH', numero: '8', left: '50%', top: '52%', tier: 2, xpx: 195, ypx: 380.16 },
  { id: 'p8', iniciais: 'AN', nome: 'André', numero: '10', left: '75%', top: '52%', tier: 2, xpx: 286.5, ypx: 380.16 },
  { id: 'p9', iniciais: 'MB', nome: 'Matheus Brito', numero: '7', left: '22%', top: '29%', tier: 3, xpx: 92.52, ypx: 217.32 },
  { id: 'p10', iniciais: 'CO', nome: 'Costa', numero: '9', left: '50%', top: '29%', tier: 3, xpx: 195, ypx: 217.32 },
  { id: 'p11', iniciais: 'DI', nome: 'Diniz', numero: '11', left: '78%', top: '29%', tier: 3, xpx: 297.48, ypx: 217.32 },
]

// Técnico — figura extra do mock (não é um dos 14 participantes), entra
// junto com o banco (tier 4), primeiro da fila.
export const TECNICO: JogadorBanco = { id: 'tec1', iniciais: 'PC', nome: 'Cardoso', numero: '', xpx: 87, ypx: 734 }

// Banco — 3 reservas (tier 4, entram por último). xpx/ypx aproximam o centro
// de cada slot na fileira do banco (ver CenaEstadio/BancoReservas).
export const BANCO: JogadorBanco[] = [
  { id: 'p12', iniciais: 'SA', nome: 'Samuel', numero: '12', xpx: 146, ypx: 734 },
  { id: 'p13', iniciais: 'GI', nome: 'Giovanni', numero: '13', xpx: 205, ypx: 734 },
  { id: 'p14', iniciais: 'DA', nome: 'Damus', numero: '14', xpx: 264, ypx: 734 },
]
