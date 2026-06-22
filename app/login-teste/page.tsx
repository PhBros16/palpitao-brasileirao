// Página de conferência visual do Login no gramado tático.
// Rota: /login-teste — só para desenvolvimento, antes de integrar na rota real.
//
// Os jogadores aqui são MOCK e existem SÓ nesta página (CLAUDE.md Regra 2: o
// componente não tem jogador hardcoded — os dados chegam por prop). As posições
// no campo são classes Tailwind literais (left-[..%] top-[..%]) para que o JIT
// as gere. PINs são fictícios; a validação real será server-side (Fase 5).

import { LoginGramado, type LoginPlayer } from '@/components/login'

// Formação 4-3-3 (11 titulares) + 3 reservas no banco.
const JOGADORES: LoginPlayer[] = [
  // Goleiro
  { id: 'p1', nome: 'Rafael Mota', vulgo: 'Paredão', pin: '1234', titular: true, pos: 'left-[50%] top-[80%]', stats: { pts: 210, cravou: 14, pos: 5 } },
  // Defesa (4)
  { id: 'p2', nome: 'Bruno Dias', vulgo: 'Xerife', pin: '1111', titular: true, pos: 'left-[18%] top-[63%]', stats: { pts: 198, cravou: 12, pos: 7 } },
  { id: 'p3', nome: 'Léo Castro', vulgo: 'Muralha', pin: '2222', titular: true, pos: 'left-[39%] top-[66%]', stats: { pts: 205, cravou: 13, pos: 6 } },
  { id: 'p4', nome: 'Igor Pena', vulgo: 'Zagueirão', pin: '3333', titular: true, pos: 'left-[61%] top-[66%]', stats: { pts: 188, cravou: 10, pos: 9 } },
  { id: 'p5', nome: 'Caio Reis', vulgo: 'Lateral', pin: '4444', titular: true, pos: 'left-[82%] top-[63%]', stats: { pts: 176, cravou: 9, pos: 10 } },
  // Meio (3)
  { id: 'p6', nome: 'Diego Alves', vulgo: 'Maestro', pin: '5555', titular: true, pos: 'left-[26%] top-[44%]', stats: { pts: 248, cravou: 18, pos: 3 } },
  { id: 'p7', nome: 'Marcos Viní', vulgo: 'Pcombo', pin: '6666', titular: true, pos: 'left-[50%] top-[40%]', stats: { pts: 312, cravou: 28, pos: 1 } },
  { id: 'p8', nome: 'Tiago Lopes', vulgo: 'Volante', pin: '7777', titular: true, pos: 'left-[74%] top-[44%]', stats: { pts: 233, cravou: 16, pos: 4 } },
  // Ataque (3)
  { id: 'p9', nome: 'Pedro Sá', vulgo: 'Artilheiro', pin: '8888', titular: true, pos: 'left-[24%] top-[20%]', stats: { pts: 274, cravou: 21, pos: 2 } },
  { id: 'p10', nome: 'João Neto', vulgo: 'Pistoleiro', pin: '9999', titular: true, pos: 'left-[50%] top-[16%]', stats: { pts: 161, cravou: 7, pos: 12 } },
  { id: 'p11', nome: 'Hugo Lima', vulgo: 'Ponta', pin: '0000', titular: true, pos: 'left-[76%] top-[20%]', stats: { pts: 154, cravou: 6, pos: 13 } },
  // Banco (3)
  { id: 'p12', nome: 'Vitor Hugo', vulgo: 'Reserva', pin: '1212', titular: false, stats: { pts: 168, cravou: 8, pos: 11 } },
  { id: 'p13', nome: 'Felipe Aro', vulgo: 'Coringa', pin: '1313', titular: false, stats: { pts: 142, cravou: 5, pos: 14 } },
  { id: 'p14', nome: 'André Sousa', vulgo: 'Veterano', pin: '1414', titular: false, stats: { pts: 191, cravou: 11, pos: 8 } },
]

export default function LoginTestePage() {
  return <LoginGramado players={JOGADORES} />
}
