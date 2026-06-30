import { LoginGramado, type LoginPlayer } from '@/components/login'

// Reutiliza LoginGramado com hideHeader=true: oculta título/"Abrir o Álbum",
// campo preenche a tela, banco migra para coluna lateral direita.
export function BeatGramado({ players }: { players: LoginPlayer[] }) {
  return (
    <div className="h-full w-full">
      <LoginGramado players={players} hideHeader />
    </div>
  )
}
