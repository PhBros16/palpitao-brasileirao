// Camada de dados da tela /guia.
// Adms vêm do Supabase (tabela admins_profile); resto é conteúdo estático.

import { supabase } from './supabase'
import type { AdminProfile } from './rodadaAdmin'

export async function buscarAdmsGuia(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('admins_profile')
    .select('id, nome, vulgo, foto, descricao, ordem, rating, posicao, stat_pal, stat_ges, stat_jus, stat_zoa, stat_res, stat_cra')
    .order('ordem', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Conteúdo estático das outras 9 seções ────────────────────────────────────

export const CONTEUDO_COMO_FUNCIONA = [
  'O Palpitão é o bolão dos 14 amigos pro Brasileirão Série A.',
  'Antes de cada jogo, você chuta o placar (ex: 2×1). Quando o jogo acaba, os pontos são calculados automaticamente.',
  'Palpites travam quando o jogo começa — depois disso, não dá pra mais editar.',
  'A cada rodada finalizada, o ranking geral é atualizado.',
]

export const REGRAS_PONTUACAO = [
  { pts: 5, desc: 'Placar exato (cravada)', exemplo: 'Você chutou 2×1 e o jogo terminou 2×1.' },
  { pts: 3, desc: 'Saldo de gols certo', exemplo: 'Você chutou 3×1 e o jogo terminou 2×0 (diferença de 2 gols).' },
  { pts: 1, desc: 'Só o vencedor certo', exemplo: 'Você chutou 2×0 e o jogo terminou 4×1 (Flamengo ganhou).' },
  { pts: 0, desc: 'Errou o resultado', exemplo: 'Você chutou 1×0 e o jogo terminou 0×2.' },
]

export const CRITERIOS_DESEMPATE = [
  'Mais pontos totais',
  'Mais cravadas (placar exato)',
  'Mais acertos de saldo',
  'Mais acertos de vencedor',
  'Ordem alfabética (último recurso)',
]

export const TIERS_TROFEUS = [
  { tier: 'Bronze',  qtd: 12, emoji: '🥉', desc: 'Conquistas iniciais — todo mundo pega.' },
  { tier: 'Prata',   qtd: 12, emoji: '🥈', desc: 'Precisa de consistência ao longo do campeonato.' },
  { tier: 'Ouro',    qtd: 10, emoji: '🥇', desc: 'Feitos raros — poucos vão conseguir.' },
  { tier: 'Lendário', qtd: 5, emoji: '👑', desc: 'Marcos históricos do Palpitão.' },
]

export const FAQ = [
  {
    p: 'Perdi meu PIN, e agora?',
    r: 'Chama o admin no grupo — ele reseta pra você na hora.',
  },
  {
    p: 'Posso mudar meu palpite depois do jogo começar?',
    r: 'Não. Depois que o jogo começa, o palpite trava. É pra evitar trapaça.',
  },
  {
    p: 'O que é rodada "Vale x2"?',
    r: 'Rodadas especiais (última do turno, decisões) valem pontuação dobrada. Cravou uma? 10 pts em vez de 5.',
  },
  {
    p: 'Como funciona a Projeção %?',
    r: 'É a chance estimada de você ser campeão, calculada com base nas últimas rodadas. O admin escolhe quantas rodadas entram na conta.',
  },
  {
    p: 'Errei o placar mas o admin cadastrou errado. Como corrijo?',
    r: 'Fala com o admin — ele consegue corrigir o placar e recalcular os pontos.',
  },
  {
    p: 'Onde vejo meus troféus?',
    r: 'Aba Ranking → Troféus. Aparece toast novo automaticamente quando você desbloqueia.',
  },
]

export const URL_WHATSAPP_DUVIDA = 'https://wa.me/?text=' + encodeURIComponent('Estou com uma dúvida sobre o Pamonhão !')
