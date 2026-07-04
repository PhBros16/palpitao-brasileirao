import type { JogadorBase, JogadorCampo } from './tipos'

// Elenco mockado para a cena do estádio (Beat "revelado"). MOCK temporário —
// CLAUDE.md Regra 2 ("nunca hardcodar jogadores") será atendida na Fase 4,
// quando o elenco passar a vir do Supabase. As cores por jogador aqui são só
// tinta decorativa de "ficha tática" (não fazem parte da paleta de marca).
//
// Formação 4-3-3. Coordenadas x/y em % do retângulo do CAMPO (não da tela).
export const TITULARES: JogadorCampo[] = [
  { nome: 'Diego Alves', iniciais: 'DA', cor: '#f5a623', x: 50, y: 8 },
  { nome: 'Pedro Sá', iniciais: 'PS', cor: '#2b6cb0', x: 18, y: 26 },
  { nome: 'João Neto', iniciais: 'JN', cor: '#2b6cb0', x: 38, y: 24 },
  { nome: 'Hugo Lima', iniciais: 'HL', cor: '#2b6cb0', x: 62, y: 24 },
  { nome: 'Marcos Viní', iniciais: 'MV', cor: '#2b6cb0', x: 82, y: 26 },
  { nome: 'Felipe Aro', iniciais: 'FA', cor: '#c53030', x: 25, y: 50 },
  { nome: 'Bruno Dias', iniciais: 'BD', cor: '#c53030', x: 50, y: 53, voce: true },
  { nome: 'Léo Castro', iniciais: 'LC', cor: '#c53030', x: 75, y: 50 },
  { nome: 'Rafael Mota', iniciais: 'RM', cor: '#805ad5', x: 24, y: 78 },
  { nome: 'Vitor Hugo', iniciais: 'VH', cor: '#805ad5', x: 50, y: 82 },
  { nome: 'Igor Pena', iniciais: 'IP', cor: '#805ad5', x: 76, y: 78 },
]

export const BANCO: JogadorBase[] = [
  { nome: 'Costa', iniciais: 'CO', cor: '#4a5568' },
  { nome: 'Samuel', iniciais: 'SA', cor: '#4a5568' },
  { nome: 'André', iniciais: 'AN', cor: '#4a5568' },
]
