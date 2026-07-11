import type { JogadorBanco, JogadorCampo } from './tipos'

// Elenco mockado da abertura — MOCK temporário (CLAUDE.md Regra 2: o elenco
// real vem do Supabase na Fase 4). Os 14 nomes são os mesmos já usados em
// /login-teste e /abertura-teste — só a apresentação (chip tático + cascata
// de entrada) mudou nesta reformulação.
//
// Formação 4-3-3 (ataque para cima). left/top em % do retângulo do campo;
// xpx/ypx são a mesma posição convertida pra px de cena (390×844, campo em
// left:12,top:12,366×708) — usados pro vetor de corrida em fila única.
// tier: 0=goleiro, 1=defesa, 2=meio, 3=ataque — define ordem de entrada e de
// acendimento dos refletores por zona.
export const TITULARES: JogadorCampo[] = [
  { id: 'p1', iniciais: 'DA', nome: 'Diego Alves', numero: '1', left: '50%', top: '86%', tier: 0, xpx: 195, ypx: 620.88 },
  { id: 'p2', iniciais: 'MV', nome: 'Marcos Viní', numero: '2', left: '16%', top: '74%', tier: 1, xpx: 70.56, ypx: 535.92 },
  { id: 'p3', iniciais: 'PS', nome: 'Pedro Sá', numero: '3', left: '39%', top: '74%', tier: 1, xpx: 154.74, ypx: 535.92 },
  { id: 'p4', iniciais: 'TL', nome: 'Tiago Lopes', numero: '4', left: '61%', top: '74%', tier: 1, xpx: 235.26, ypx: 535.92 },
  { id: 'p5', iniciais: 'LC', nome: 'Léo Castro', numero: '6', left: '84%', top: '74%', tier: 1, xpx: 319.44, ypx: 535.92 },
  { id: 'p6', iniciais: 'BD', nome: 'Bruno Dias', numero: '5', left: '25%', top: '52%', tier: 2, xpx: 103.5, ypx: 380.16 },
  { id: 'p7', iniciais: 'HL', nome: 'Hugo Lima', numero: '8', left: '50%', top: '52%', tier: 2, xpx: 195, ypx: 380.16 },
  { id: 'p8', iniciais: 'VH', nome: 'Vitor Hugo', numero: '10', left: '75%', top: '52%', tier: 2, xpx: 286.5, ypx: 380.16 },
  { id: 'p9', iniciais: 'IP', nome: 'Igor Pena', numero: '7', left: '22%', top: '29%', tier: 3, xpx: 92.52, ypx: 217.32 },
  { id: 'p10', iniciais: 'AS', nome: 'André Sousa', numero: '9', left: '50%', top: '29%', tier: 3, xpx: 195, ypx: 217.32 },
  { id: 'p11', iniciais: 'JN', nome: 'João Neto', numero: '11', left: '78%', top: '29%', tier: 3, xpx: 297.48, ypx: 217.32 },
]

// Banco — 3 reservas (tier 4, entram por último). xpx/ypx aproximam o centro
// de cada slot na fileira do banco (ver CenaEstadio/BancoReservas).
export const BANCO: JogadorBanco[] = [
  { id: 'p12', iniciais: 'FA', nome: 'Felipe Aro', numero: '12', xpx: 146, ypx: 734 },
  { id: 'p13', iniciais: 'RM', nome: 'Rafael Mota', numero: '13', xpx: 205, ypx: 734 },
  { id: 'p14', iniciais: 'CR', nome: 'Caio Reis', numero: '14', xpx: 264, ypx: 734 },
]
