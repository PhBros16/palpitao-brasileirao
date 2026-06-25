// BannerPalpite — aviso condicional de palpite pendente na rodada (sempre
// visível quando ativo). Tom de humor do grupo, mas direto.

export function BannerPalpite() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-raridade-frango-selo bg-raridade-frango-selo/10 px-3 py-2.5">
      <span className="text-lg" aria-hidden>
        ✍️
      </span>
      <p className="font-sans text-sm font-medium text-tinta-300">
        Você ainda tem <span className="font-bold text-raridade-frango-selo">palpites pendentes</span> nesta rodada!
      </p>
    </div>
  )
}
