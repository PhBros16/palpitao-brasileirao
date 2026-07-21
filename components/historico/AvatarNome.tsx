export function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AvatarNome({
  avatar,
  emoji,
  nome,
  tema = 'claro',
  tamanho = 'sm',
}: {
  avatar: string | null
  emoji: string | null
  nome: string
  tema?: 'claro' | 'escuro'
  tamanho?: 'sm' | 'md'
}) {
  const isEscuro = tema === 'escuro'
  const size = tamanho === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
  const iniText = tamanho === 'sm' ? 'text-[9px]' : 'text-xs'
  const nomeCor = isEscuro ? 'text-papel-50' : 'text-tinta-300'
  const nomeText = tamanho === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className="inline-flex items-center gap-1">
      {avatar ? (
        <span className={`inline-flex ${size} flex-shrink-0 overflow-hidden rounded-full border border-dourado-300 bg-papel-100`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={nome} className="h-full w-full object-cover" />
        </span>
      ) : (
        <span className={`inline-flex ${size} flex-shrink-0 items-center justify-center rounded-full border border-dourado-300 bg-dourado-100 font-mono ${iniText} font-bold text-dourado-700`}>
          {getIniciais(nome)}
        </span>
      )}
      {emoji && <span className="text-sm leading-none">{emoji}</span>}
      <span className={`font-sans ${nomeText} font-semibold ${nomeCor} whitespace-nowrap`}>{nome}</span>
    </span>
  )
}
