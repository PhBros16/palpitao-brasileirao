// Home real do Palpitão Brasileirão. Rota: / (raiz do site).
//
// Substitui o app.tsx antigo do Palpitão Copa que estava esquecido aqui
// (5000+ linhas, incluindo um MASTER_PASS hardcoded no client — o Copa roda
// em repositório/deploy próprio e separado, então isso era código morto).
//
// Por ora só a abertura cinematográfica (capa → flip → refletores → elenco).
// Login/PIN (components/login/LoginGramado, ver /login) e o resto do fluxo
// real (Palpites, Home, Ranking...) ainda são encadeados numa próxima etapa —
// a abertura hoje só fecha de volta pra capa ao tocar no campo (handleFechar).

import { AberturaScreen } from '@/components/abertura'

export default function HomePage() {
  return <AberturaScreen />
}
