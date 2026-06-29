import { LoginGramado, type LoginPlayer } from '@/components/login'

// Reutiliza LoginGramado diretamente — showRarity=false já é o padrão fixo do componente.
export function BeatGramado({ players }: { players: LoginPlayer[] }) {
  return (
    <div className="h-full w-full overflow-y-auto">
      <LoginGramado players={players} />
    </div>
  )
}
