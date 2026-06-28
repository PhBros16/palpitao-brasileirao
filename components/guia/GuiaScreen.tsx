'use client'

// GuiaScreen — Guia completo do Palpitão Brasileirão.
// Reescrito do zero para liga (pontos corridos, sem extras de mata-mata, sem OneSignal).
// Seções em accordion; Glossário e Conquistas adicionados; conteúdo de Copa removido.

import { Accordion } from '@/components/home/Accordion'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

// Chip inline usado em tabelas de pontuação e legendas.
function Chip({ children, variant = 'neutro' }: { children: React.ReactNode; variant?: 'cravada' | 'saldo' | 'vencedor' | 'zero' | 'neutro' | 'dourado' }) {
  const estilos: Record<string, string> = {
    cravada: 'bg-verde-badge text-papel-50',
    saldo: 'bg-papel-borda-400 text-tinta-300',
    vencedor: 'bg-couro-100 text-couro-400',
    zero: 'bg-raridade-frango-selo text-papel-50',
    neutro: 'bg-papel-200 text-tinta-200',
    dourado: 'bg-dourado-100 text-dourado-600 border border-dourado-300',
  }
  return (
    <span className={cx('inline-block rounded px-2 py-0.5 font-mono text-xs font-bold', estilos[variant])}>
      {children}
    </span>
  )
}

function Divisor() {
  return <hr className="my-3 border-papel-borda-200" />
}

function SubTitulo({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1.5 font-display text-sm font-bold text-tinta-300">{children}</h3>
}

function Paragrafo({ children }: { children: React.ReactNode }) {
  return <p className="font-sans text-sm leading-relaxed text-tinta-200">{children}</p>
}

// ─── SEÇÕES ──────────────────────────────────────────────────────────────────

function ConhecaAdms() {
  return (
    <div className="space-y-2">
      <Paragrafo>
        Os admins organizam as rodadas, lançam os resultados, cuidam dos prazos e garantem que ninguém
        cole o palpite do vizinho. Se tiver dúvida, reclamação ou queira desafiar o sistema: manda
        mensagem pra eles.
      </Paragrafo>
      <Paragrafo>
        O palpite de um admin vale igual ao de todo mundo — sem vantagem, sem acesso antecipado a
        resultados. A honestidade é política de casa.
      </Paragrafo>
    </div>
  )
}

function ComoPalpitar() {
  return (
    <div className="space-y-3">
      <div>
        <SubTitulo>Antes do apito</SubTitulo>
        <Paragrafo>
          Cada rodada tem uma lista de jogos. Você palpita o placar de cada um (casa × fora) antes do
          horário de início. Depois que o jogo trava, não tem como mudar — então não deixa pra última
          hora.
        </Paragrafo>
      </div>
      <Divisor />
      <div>
        <SubTitulo>Countdown e trava</SubTitulo>
        <Paragrafo>
          O app mostra um contador regressivo por jogo. Quando falta menos de 1 hora, o campo fica
          vermelho (<Chip variant="zero">URGENTE</Chip>). Quando o jogo travou, aparece o badge{' '}
          <Chip variant="neutro">Travado</Chip> e o input some.
        </Paragrafo>
      </div>
      <Divisor />
      <div>
        <SubTitulo>Salvar</SubTitulo>
        <Paragrafo>
          O botão "Salvar palpites" aparece fixo no rodapé assim que você edita qualquer campo. Toque
          nele antes de fechar o app — o que não foi salvo, não conta.
        </Paragrafo>
      </div>
      <Divisor />
      <div>
        <SubTitulo>Esqueceu?</SubTitulo>
        <Paragrafo>
          Sem palpite salvo = 0 pontos nos jogos que travaram. O banner de "Você esqueceu de
          palpitar" aparece pra lembrar o esquecido. Com carinho.
        </Paragrafo>
      </div>
    </div>
  )
}

function Pontuacao() {
  return (
    <div className="space-y-3">
      <div>
        <SubTitulo>Como os pontos funcionam</SubTitulo>
        <div className="mt-2 overflow-hidden rounded-lg border border-papel-borda-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-papel-200">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-tinta-100">Acerto</th>
                <th className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-tinta-100">Pts</th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-tinta-100">Exemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-papel-borda-200">
                <td className="px-3 py-2">
                  <span className="font-sans text-sm font-semibold text-tinta-300">Placar exato</span>
                  <span className="ml-1 font-mono text-[10px] text-tinta-100">(cravada)</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <Chip variant="cravada">5 pts</Chip>
                </td>
                <td className="px-3 py-2 font-sans text-xs text-tinta-200">Palpitou 2×1, saiu 2×1</td>
              </tr>
              <tr className="border-t border-papel-borda-200">
                <td className="px-3 py-2">
                  <span className="font-sans text-sm font-semibold text-tinta-300">Saldo de gols certo</span>
                  <span className="ml-1 font-mono text-[10px] text-tinta-100">(saldo)</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <Chip variant="saldo">3 pts</Chip>
                </td>
                <td className="px-3 py-2 font-sans text-xs text-tinta-200">Palpitou 2×0, saiu 3×1 (saldo +2)</td>
              </tr>
              <tr className="border-t border-papel-borda-200">
                <td className="px-3 py-2">
                  <span className="font-sans text-sm font-semibold text-tinta-300">Vencedor certo</span>
                  <span className="ml-1 font-mono text-[10px] text-tinta-100">(resultado)</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <Chip variant="vencedor">1 pt</Chip>
                </td>
                <td className="px-3 py-2 font-sans text-xs text-tinta-200">Palpitou 1×0, saiu 3×2</td>
              </tr>
              <tr className="border-t border-papel-borda-200">
                <td className="px-3 py-2">
                  <span className="font-sans text-sm font-semibold text-tinta-300">Errou</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <Chip variant="zero">0 pts</Chip>
                </td>
                <td className="px-3 py-2 font-sans text-xs text-tinta-200">Palpitou 1×0, saiu 0×1</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 font-mono text-[10px] text-tinta-100">
          * Cada critério é exclusivo: acertou o placar exato, leva 5 pts (não acumula com os outros).
        </p>
      </div>
      <Divisor />
      <div>
        <SubTitulo>Desempate no ranking</SubTitulo>
        <Paragrafo>
          Com pontos iguais, o desempate vai nessa ordem:
        </Paragrafo>
        <ol className="mt-2 space-y-1 pl-1">
          {[
            { n: '1º', txt: 'Mais cravadas (placar exato)' },
            { n: '2º', txt: 'Mais acertos de vencedor' },
            { n: '3º', txt: 'Melhor saldo de gols acumulado' },
          ].map(({ n, txt }) => (
            <li key={n} className="flex items-center gap-2">
              <span className="min-w-[24px] font-mono text-xs font-bold text-dourado-500">{n}</span>
              <span className="font-sans text-sm text-tinta-200">{txt}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function RankingEstatisticas() {
  return (
    <div className="space-y-3">
      <div>
        <SubTitulo>Ranking geral</SubTitulo>
        <Paragrafo>
          Acumulado da temporada inteira (38 rodadas). Colunas: Pontos · Cravadas · Vencedor · Saldo ·
          Projeção (%). A projeção é uma estimativa de chance de título com base no ritmo atual — não
          é enfeite, é matemática.
        </Paragrafo>
      </div>
      <Divisor />
      <div>
        <SubTitulo>Frente a frente</SubTitulo>
        <Paragrafo>
          Toque no nome de qualquer participante (na Tabela da Rodada ou no Ranking) para abrir o
          comparativo direto: quem ganhou cada rodada, quem cravou mais, histórico de duelos.
        </Paragrafo>
      </div>
      <Divisor />
      <div>
        <SubTitulo>Minhas estatísticas</SubTitulo>
        <Paragrafo>
          No Ranking, role até "Minhas Estatísticas" para ver: evolução rodada a rodada, heatmap de
          performance, barras de % (cravada / resultado / saldo), e a Sala de Troféus.
        </Paragrafo>
      </div>
      <Divisor />
      <div>
        <SubTitulo>Avatar (foto real)</SubTitulo>
        <Paragrafo>
          Depois de entrar no app, toque no seu círculo de foto para adicionar ou trocar sua imagem.
          Um cropper aparece — arraste e ajuste o zoom até encaixar no círculo. Outros participantes
          veem sua foto na figurinha e no gramado de login.
        </Paragrafo>
      </div>
    </div>
  )
}

function Conquistas() {
  const tiers = [
    { metal: 'Bronze', cor: 'text-[#cd7f32]', desc: 'Conquistas de chegada — primeiros passos na liga.' },
    { metal: 'Prata', cor: 'text-tinta-200', desc: 'Consistência e sequências merecidas.' },
    { metal: 'Ouro', cor: 'text-dourado-500', desc: 'Feitos que poucos vão conseguir na temporada.' },
    { metal: 'Lendário', cor: 'text-dourado-600', desc: 'Raríssimo. Se você tem, ostenta.' },
  ]

  return (
    <div className="space-y-3">
      <Paragrafo>
        São <strong className="font-bold text-tinta-300">34 conquistas</strong> ao longo da temporada,
        divididas em quatro tiers. Desbloqueadas automaticamente conforme você acumula façanhas —
        ninguém concede na mão.
      </Paragrafo>
      <div className="mt-2 space-y-2">
        {tiers.map(({ metal, cor, desc }) => (
          <div key={metal} className="flex items-start gap-3 rounded-lg border border-papel-borda-200 bg-papel-100 px-3 py-2.5">
            <span className={cx('font-mono text-sm font-bold', cor)}>{metal}</span>
            <span className="font-sans text-sm text-tinta-200">{desc}</span>
          </div>
        ))}
      </div>
      <Divisor />
      <Paragrafo>
        No Ranking, role até a aba <strong className="font-bold text-tinta-300">Sala de Troféus</strong>.
        Conquistas desbloqueadas aparecem coloridas (com nome na plaquinha). As bloqueadas ficam em
        cinza — só pra você saber que existem e ficar com vontade.
      </Paragrafo>
      <Paragrafo>
        Não listamos todas aqui de propósito. Parte da graça é descobrir.
      </Paragrafo>
    </div>
  )
}

function QuemNaoPalpita() {
  return (
    <div className="space-y-3">
      <Paragrafo>
        Não palpitou antes do jogo travar? Leva <Chip variant="zero">0 pts</Chip> naquele jogo.
        Sem exceção, sem segunda chance, sem "mas eu ia palpitar 2×1".
      </Paragrafo>
      <Paragrafo>
        O app avisa com banner quando você não tem palpite salvo nos jogos que ainda estão abertos.
        O resto é com você.
      </Paragrafo>
      <div className="rounded-lg border border-dourado-300 bg-dourado-50 px-4 py-3">
        <p className="font-sans text-sm font-semibold text-dourado-700">
          Dica do bem: adicione o app à tela inicial do celular (ver "Instalar no Celular") para não
          perder os prazos.
        </p>
      </div>
    </div>
  )
}

function InstalarCelular() {
  const passos: Record<string, { icone: string; steps: string[] }> = {
    iOS: {
      icone: '',
      steps: [
        'Abra o app no Safari (não no Chrome)',
        'Toque no ícone de compartilhar ↑ na barra inferior',
        'Role e toque em "Adicionar à Tela de Início"',
        'Confirme o nome e toque em "Adicionar"',
      ],
    },
    Android: {
      icone: '',
      steps: [
        'Abra no Chrome',
        'Toque nos três pontos (⋮) no canto superior direito',
        'Toque em "Adicionar à tela inicial" ou "Instalar app"',
        'Confirme na caixa que aparecer',
      ],
    },
  }

  return (
    <div className="space-y-4">
      <Paragrafo>
        O Palpitão funciona como um app instalado no seu celular — sem passar pela loja, direto do
        navegador. A experiência é mais rápida e você não perde os prazos.
      </Paragrafo>
      {Object.entries(passos).map(([sistema, { steps }]) => (
        <div key={sistema}>
          <SubTitulo>{sistema}</SubTitulo>
          <ol className="mt-1 space-y-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-papel-200 font-mono text-[10px] font-bold text-tinta-200">
                  {i + 1}
                </span>
                <span className="font-sans text-sm text-tinta-200">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

function Notificacoes() {
  return (
    <div className="space-y-3">
      <Paragrafo>
        O app não manda notificações push — é uma limitação técnica dos navegadores mobile, não falta
        de vontade.
      </Paragrafo>
      <Paragrafo>
        A solução mais confiável: <strong className="font-bold text-tinta-300">instale o app na tela
        inicial</strong> (ver "Instalar no Celular") e reserve um tempinho antes dos jogos pra
        conferir. O app mostra um countdown em cada jogo — dá pra saber quanto tempo você tem.
      </Paragrafo>
      <div className="rounded-lg border border-papel-borda-200 bg-papel-100 px-4 py-3">
        <p className="font-sans text-sm text-tinta-200">
          O grupo no WhatsApp costuma avisar quando a rodada abre. Ative as notificações do grupo e
          você não perde.
        </p>
      </div>
    </div>
  )
}

const GLOSSARIO: { termo: string; def: string }[] = [
  {
    termo: 'Cravada',
    def: 'Acertar o placar exato do jogo. Vale 5 pontos e gera aquela sensação de superioridade temporária.',
  },
  {
    termo: 'Pintura',
    def: 'Cravada num placar improvável ou num jogo difícil. O tipo de palpite que você exibe pelo grupo.',
  },
  {
    termo: 'Frango',
    def: 'O último colocado da rodada. Ganha uma caracterização especial na interface — afetivamente constrangedora. Tradição do grupo.',
  },
  {
    termo: 'G6',
    def: 'As 6 primeiras posições do ranking geral. No Brasileirão real, é a zona de classificação à Libertadores. Aqui, é onde você quer estar.',
  },
  {
    termo: 'Z4',
    def: 'As 4 últimas posições. No Brasileirão real, zona de rebaixamento. No bolão, zona de vergonha.',
  },
  {
    termo: 'Clássico',
    def: 'Jogo entre rivais históricos: Grenal, Choque-Rei, Fla-Flu, Atletiba, Derby… Esses jogos valem mais na alma do que nos pontos. Mas os pontos importam.',
  },
]

function Glossario() {
  return (
    <div className="space-y-2">
      {GLOSSARIO.map(({ termo, def }) => (
        <div key={termo} className="rounded-lg border border-papel-borda-200 bg-papel-100 px-3 py-2.5">
          <p className="font-display text-sm font-bold text-tinta-300">{termo}</p>
          <p className="mt-0.5 font-sans text-sm leading-relaxed text-tinta-200">{def}</p>
        </div>
      ))}
    </div>
  )
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────

const SECOES = [
  { key: 'adms', titulo: 'Conheça os Adms', conteudo: <ConhecaAdms /> },
  { key: 'palpitar', titulo: 'Como Palpitar', conteudo: <ComoPalpitar /> },
  { key: 'pontuacao', titulo: 'Pontuação & Desempate', conteudo: <Pontuacao /> },
  { key: 'ranking', titulo: 'Ranking & Estatísticas', conteudo: <RankingEstatisticas /> },
  { key: 'conquistas', titulo: 'Conquistas (Troféus)', conteudo: <Conquistas /> },
  { key: 'sem-palpite', titulo: 'Quem Não Palpita…', conteudo: <QuemNaoPalpita /> },
  { key: 'instalar', titulo: 'Instalar no Celular', conteudo: <InstalarCelular /> },
  { key: 'notif', titulo: 'Notificações', conteudo: <Notificacoes /> },
  { key: 'glossario', titulo: 'Glossário', conteudo: <Glossario /> },
]

export function GuiaScreen() {
  return (
    <main className="min-h-screen bg-papel-200 px-4 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <header className="mb-5">
          <h1 className="font-display text-2xl font-bold text-tinta-300">Guia</h1>
          <p className="font-sans text-sm text-tinta-100">
            Tudo que você precisa saber para não dar frango
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {SECOES.map((s, i) => (
            <Accordion
              key={s.key}
              titulo={s.titulo}
              storageKey={`guia-${s.key}`}
              defaultOpen={i === 0}
            >
              {s.conteudo}
            </Accordion>
          ))}
        </div>
      </div>
    </main>
  )
}
