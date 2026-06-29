'use client'

export function BeatCapa({ onAbrir }: { onAbrir: () => void }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-couro-100 via-couro-300 to-couro-500 py-16">
      {/* Lombada */}
      <div className="absolute inset-y-0 left-0 w-5 bg-couro-500 shadow-[inset_-6px_0_14px_rgba(0,0,0,0.45)]" />
      {/* Filete vertical decorativo direito */}
      <div className="absolute inset-y-0 right-7 w-px bg-dourado-300/20" />

      {/* Área central */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-12 text-center">
        {/* Selo superior */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-dourado-300/40" />
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-dourado-400">
            Edição 2026
          </span>
          <div className="h-px flex-1 bg-dourado-300/40" />
        </div>

        {/* Título */}
        <div className="mt-2 flex flex-col items-center gap-1">
          <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-widest text-dourado-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            PALPITÃO
          </h1>
          <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-widest text-dourado-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            BRASILEIRÃO
          </h2>
        </div>

        <div className="h-px w-16 bg-dourado-300/40" />

        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-dourado-400/80">
          Bolão Oficial do Grupo
        </p>

        {/* Número da edição */}
        <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-full border border-dourado-300/40 bg-dourado-300/10">
          <span className="font-mono text-xs font-bold text-dourado-300">#1</span>
        </div>
      </div>

      {/* Botão inferior */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onAbrir}
          className="rounded-lg border-2 border-dourado-300 bg-dourado-300/10 px-10 py-3.5 font-sans text-lg font-bold uppercase tracking-[0.2em] text-dourado-300 shadow-lg transition-all duration-150 hover:bg-dourado-300/20 active:scale-95"
        >
          Abrir o Álbum
        </button>
        <p className="font-mono text-[10px] uppercase tracking-widest text-dourado-300/50">
          Toque para começar
        </p>
      </div>
    </div>
  )
}
