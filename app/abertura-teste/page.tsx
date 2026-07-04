// Conferência visual da Abertura Cinematográfica. Rota: /abertura-teste.
//
// Esta versão da abertura (capa de couro → book-flip → refletores → elenco
// no campo) é só a peça cinematográfica de entrada. Não inclui login/PIN —
// isso continua em components/login/LoginGramado (ver /login-teste), a ser
// encadeado depois da abertura na rota real.
//
// Elenco (titulares + banco) é MOCK, definido em components/abertura/
// elencoMock.ts — ver comentário lá para o porquê (Fase 4 conecta Supabase).

import { AberturaScreen } from '@/components/abertura'

export default function AberturaTestePage() {
  return <AberturaScreen />
}
