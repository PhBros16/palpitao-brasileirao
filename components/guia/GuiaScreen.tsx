'use client'

// GuiaScreen — 10 seções em accordion sobre como funciona o Pamonhão.
// Adms puxam do Supabase (tabela admins_profile). Resto é conteúdo estático.

import { useEffect, useState } from 'react'
import { buscarAdmsGuia, CONTEUDO_COMO_FUNCIONA, REGRAS_PONTUACAO, CRITERIOS_DESEMPATE, TIERS_TROFEUS, FAQ, URL_WHATSAPP_DUVIDA } from '@/lib/guiaData'
import type { AdminProfile } from '@/lib/rodadaAdmin'
import { SecaoAccordion } from './SecaoAccordion'
import { CardFifa } from './CardFifa'

export function GuiaScreen() {
  const [adms, setAdms] = useState<AdminProfile[]>([])
  const [carregandoAdms, setCarregandoAdms] = useState(true)
  const [erroAdms, setErroAdms] = useState<string | null>(null)

  useEffect(() => {
    buscarAdmsGuia()
      .then(setAdms)
      .catch((e) => setErroAdms((e as Error).message))
      .finally(() => setCarregandoAdms(false))
  }, [])

  return (
    <section className="space-y-3">
      <h1 className="font-display text-2xl font-bold text-tinta-300">Guia</h1>
      <p className="font-sans text-sm text-tinta-100">
        Como funciona o Pamonhão — regras, pontuação e os chefes por trás disso tudo.
      </p>

      {/* 1. Conheça os Adms (destaque, aberto por padrão) */}
      <SecaoAccordion titulo="Conheça os Adms" icone="👑" defaultOpen>
        {carregandoAdms ? (
          <p className="font-sans text-sm text-tinta-100">Carregando cards...</p>
        ) : erroAdms ? (
          <p className="font-sans text-sm text-raridade-frango-selo">Erro: {erroAdms}</p>
        ) : adms.length === 0 ? (
          <p className="font-sans text-sm text-tinta-100">Nenhum adm cadastrado ainda. Peça pra alguém montar o card na aba Admin.</p>
        ) : (
          <div className="space-y-6">
            {adms.map((adm) => (
              <CardFifa key={adm.id} adm={adm} />
            ))}
          </div>
        )}
      </SecaoAccordion>

      {/* 2. Como Funciona */}
      <SecaoAccordion titulo="Como Funciona" icone="📖">
        <ul className="space-y-2">
          {CONTEUDO_COMO_FUNCIONA.map((linha, i) => (
            <li key={i} className="flex items-start gap-2 font-sans text-sm text-tinta-200">
              <span className="mt-0.5 flex-shrink-0 text-dourado-500">•</span>
              <span>{linha}</span>
            </li>
          ))}
        </ul>
      </SecaoAccordion>

      {/* 3. Pontuação */}
      <SecaoAccordion titulo="Pontuação" icone="🎯">
        <div className="space-y-2">
          {REGRAS_PONTUACAO.map((r, i) => (
            <div key={i} className="rounded border border-papel-borda-200 bg-papel-100 p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm font-semibold text-tinta-300">{r.desc}</span>
                <span className="rounded bg-dourado-100 px-2 py-0.5 font-mono text-sm font-bold text-dourado-700">
                  {r.pts} pts
                </span>
              </div>
              <p className="mt-1 font-sans text-xs italic text-tinta-100">{r.exemplo}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded border border-dourado-300 bg-dourado-50 p-2.5">
          <p className="font-sans text-xs text-tinta-200">
            <span className="font-bold text-dourado-700">⚡ Vale x2:</span> Rodadas especiais (última do turno, decisões) dobram toda a pontuação. Cravou uma? 10 pts em vez de 5.
          </p>
        </div>
      </SecaoAccordion>

      {/* 4. Desempate */}
      <SecaoAccordion titulo="Desempate" icone="🏆">
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Empatou no total de pontos? A ordem dos critérios é:
        </p>
        <ol className="space-y-1.5">
          {CRITERIOS_DESEMPATE.map((c, i) => (
            <li key={i} className="flex items-start gap-2 rounded border border-papel-borda-200 bg-papel-100 px-2.5 py-1.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-dourado-400 font-mono text-[11px] font-bold text-papel-50">
                {i + 1}
              </span>
              <span className="font-sans text-sm text-tinta-300">{c}</span>
            </li>
          ))}
        </ol>
      </SecaoAccordion>

      {/* 5. Projeção */}
      <SecaoAccordion titulo="Projeção %" icone="📊">
        <p className="font-sans text-sm text-tinta-200">
          A <b>Projeção %</b> estima a chance de cada participante ser campeão, baseada nas últimas rodadas finalizadas.
        </p>
        <ul className="mt-2 space-y-1.5">
          <li className="flex items-start gap-2 font-sans text-sm text-tinta-200">
            <span className="text-dourado-500">•</span>
            <span>Precisa de <b>no mínimo 2 rodadas</b> finalizadas pra começar a calcular.</span>
          </li>
          <li className="flex items-start gap-2 font-sans text-sm text-tinta-200">
            <span className="text-dourado-500">•</span>
            <span>O admin escolhe quantas rodadas entram no cálculo (últ. 3, 5, 10, ou o campeonato inteiro).</span>
          </li>
          <li className="flex items-start gap-2 font-sans text-sm text-tinta-200">
            <span className="text-dourado-500">•</span>
            <span>Aparece na aba <b>Ranking</b>, na coluna "Proj.%".</span>
          </li>
        </ul>
      </SecaoAccordion>

      {/* 6. Troféus */}
      <SecaoAccordion titulo="Troféus" icone="🏅">
        <p className="mb-3 font-sans text-sm text-tinta-200">
          Ao longo do campeonato, você desbloqueia troféus por conquistas — desde as básicas até feitos históricos.
        </p>
        <div className="space-y-2">
          {TIERS_TROFEUS.map((t) => (
            <div key={t.tier} className="flex items-start gap-3 rounded border border-papel-borda-200 bg-papel-100 p-2.5">
              <span className="text-2xl leading-none">{t.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-tinta-300">{t.tier}</span>
                  <span className="rounded bg-couro-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-couro-900">
                    {t.qtd} troféus
                  </span>
                </div>
                <p className="mt-0.5 font-sans text-xs text-tinta-100">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center font-mono text-[10px] italic text-tinta-100">
          🔗 Lista completa em <b>Ranking → Troféus</b>
        </p>
      </SecaoAccordion>

      {/* 7. Frango da Rodada */}
      <SecaoAccordion titulo="Frango da Rodada" icone="🐔">
        <p className="font-sans text-sm text-tinta-200">
          A cada rodada, o admin escolhe alguém que fez uma <b>frangada épica</b> — um palpite absurdo, um vacilo cômico, ou só por diversão mesmo.
        </p>
        <p className="mt-2 font-sans text-sm text-tinta-200">
          O frango da rodada aparece na <b>Home</b> e no <b>Histórico</b> daquela rodada, com foto e mensagem carinhosamente constrangedora.
        </p>
      </SecaoAccordion>

      {/* 8. Formação do Time */}
      <SecaoAccordion titulo="Formação do Time" icone="⚙️">
        <p className="font-sans text-sm text-tinta-200">
          O elenco de 14 participantes aparece disposto num campinho na <b>abertura</b> e na <b>tela de login</b>.
        </p>
        <p className="mt-2 font-sans text-sm text-tinta-200">
          O admin pode escolher entre <b>14 formações diferentes</b> — 6 clássicas (4-3-3, 3-5-2, etc.) e 8 doidas (Coração, Círculo, W do Zico, e mais). Isso muda ao vivo pra todo mundo.
        </p>
      </SecaoAccordion>

      {/* 9. Música Tema */}
      <SecaoAccordion titulo="Música Tema" icone="🎵">
        <p className="font-sans text-sm text-tinta-200">
          Na Home tem um <b>player de música</b> com playlist de 8 faixas — clássicos da Copa + o tema oficial do Palpitão.
        </p>
        <ul className="mt-2 space-y-1.5">
          <li className="flex items-start gap-2 font-sans text-sm text-tinta-200">
            <span className="text-dourado-500">•</span>
            <span><b>Modo tema:</b> a música-tema toca em loop infinito (padrão).</span>
          </li>
          <li className="flex items-start gap-2 font-sans text-sm text-tinta-200">
            <span className="text-dourado-500">•</span>
            <span><b>Modo playlist:</b> se você trocar de faixa, entra em sequencial.</span>
          </li>
          <li className="flex items-start gap-2 font-sans text-sm text-tinta-200">
            <span className="text-dourado-500">•</span>
            <span>O áudio continua tocando quando você troca de aba.</span>
          </li>
        </ul>
      </SecaoAccordion>

      {/* 10. FAQ */}
      <SecaoAccordion titulo="Perguntas Frequentes" icone="❓">
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="group rounded border border-papel-borda-200 bg-papel-100 p-2.5 open:bg-papel-50"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-2 font-sans text-sm font-semibold text-tinta-300 marker:content-none">
                <span>{f.p}</span>
                <span className="font-mono text-xs text-dourado-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 font-sans text-sm text-tinta-200 leading-relaxed">{f.r}</p>
            </details>
          ))}
        </div>

        {/* Aviso de zueira + botão WhatsApp */}
        <div className="mt-4 rounded-lg border-2 border-dourado-400 bg-gradient-to-br from-dourado-100 to-dourado-50 p-3">
          <p className="mb-2 font-display text-sm font-bold text-couro-900">
            ⚠ Não seja burro!
          </p>
          <p className="mb-3 font-sans text-xs italic text-tinta-300">
            A sua burrice pode ser a de outra pessoa também! Pergunte no grupo antes de perguntar aqui.
          </p>
          <a
            href={URL_WHATSAPP_DUVIDA}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-papel-50 transition-colors hover:bg-[#1ebe5d]"
          >
            💬 Perguntar no Grupo
          </a>
        </div>
      </SecaoAccordion>
    </section>
  )
}
