'use client'

// layout.tsx persistente pras abas logadas — grupo de rotas (logado) não
// afeta a URL (continua /inicio, /palpites, etc). AppLayout é montado
// UMA VEZ aqui; só {children} troca ao navegar entre abas.
//
// A CortinaSubindo detecta se veio da abertura via login e sobe a cortina
// de couro revelando a Home já pronta.
import { AppLayout } from '@/components/home/AppLayout'
import { AtualizarProvider } from '@/components/home/AtualizarContext'
import { CortinaSubindo } from '@/components/home/CortinaTransicao'

export default function LogadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AtualizarProvider>
      <AppLayout>{children}</AppLayout>
      <CortinaSubindo />
    </AtualizarProvider>
  )
}
