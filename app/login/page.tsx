'use client'

// Login direto foi DESATIVADO — o único caminho canônico de login é
// pela abertura cinematográfica (rota /), que já renderiza o LoginGramado
// no modo hideHeader dentro do próprio fluxo capa→campo→PIN→app.
//
// Manter uma segunda tela de login (esta) causava:
//   1. Duplicação de manutenção (2 lugares pra ajustar visual/formação)
//   2. Bug de fluxo: cliques em jogadores da abertura vinham pra cá em vez
//      de abrir o PIN modal dentro da própria abertura
//
// Solução: /login redireciona pra / (abertura). Qualquer link antigo que
// aponte pra /login continua funcionando — só chega na abertura.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return <main className="min-h-screen bg-campo-noturno" />
}
