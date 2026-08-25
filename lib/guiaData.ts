import { supabase } from './supabase'

export const URL_WHATSAPP_DUVIDA = 'https://api.whatsapp.com/send?text=Tenho%20uma%20d%C3%BAvida%20sobre%20o%20Palpit%C3%A3o'

export const CONTEUDO_COMO_FUNCIONA = `O Palpitão Brasileirão é a liga oficial de palpites entre amigos. Faça seus palpites rodada a rodada, acumule pontos, acompanhe a Tabela da Série A ao vivo e dispute o topo do ranking!`

export const REGRAS_PONTUACAO = [
  { criterio: 'Placar Exato (Cravada)', pontos: '5 pts', desc: 'Acertou em cheio o resultado exato do jogo.' },
  { criterio: 'Saldo de Gols', pontos: '3 pts', desc: 'Acertou o vencedor e a diferença exata de gols.' },
  { criterio: 'Vencedor / Empate', pontos: '1 pt', desc: 'Acertou apenas quem venceu ou que a partida terminaria empatada.' },
  { criterio: 'Errou o Resultado', pontos: '0 pts', desc: 'Não pontuou na partida.' },
]

export const CRITERIOS_DESEMPATE = [
  '1º Total de Pontos Acumulados',
  '2º Número de Cravadas (Placar Exato)',
  '3º Número de Acertos de Vencedor',
  '4º Número de Acertos de Saldo de Gols',
]

export const TIERS_TROFEUS = [
  { tier: 1, nome: 'Bronze', desc: 'Conquistas iniciais e de participação.' },
  { tier: 2, nome: 'Prata', desc: 'Conquistas de desempenho intermediário e consistência.' },
  { tier: 3, nome: 'Ouro', desc: 'Feitos raros e de altíssimo desempenho.' },
  { tier: 4, nome: 'Diamante / Campeão', desc: 'A glória máxima. O campeão oficial da temporada.' },
]

export interface FaqItem {
  pergunta: string
  resposta: string
}

export const FAQ: FaqItem[] = [
  {
    pergunta: 'Como o Ranking calcula a coluna VENC.?',
    resposta: 'A coluna VENC. no ranking não mostra apenas os palpites de 1 ponto. Ela indica o Total de Jogos Pontuados (a soma de todas as Cravadas + Saldos + Vencedores puros). Ou seja, se o seu VENC é 110, significa que em 110 jogos do campeonato você somou pontos para o ranking.',
  },
  {
    pergunta: 'Como a Tabela da Série A é calculada?',
    resposta: 'O aplicativo constrói a tabela 100% ao vivo baseada nos placares salvos. A matemática segue a regra da CBF: Vitória (+3), Empate (+1) e Derrota (0). Saldo e gols pró/contra são atualizados instantaneamente.',
  },
  {
    pergunta: 'Como funciona a Projeção de Título e Rebaixamento?',
    resposta: 'A Projeção (🔮) é uma Regra de Três matemática pura: (Pontos Atuais ÷ Jogos Disputados) × 38 rodadas. Se a projeção for ≥ 70 pontos, indica chance de Título 🏆. Se for ≤ 45 pontos, indica Risco Z4 🚨.',
  },
  {
    pergunta: 'Por que o Gráfico de Evolução não tem as Rodadas Extras?',
    resposta: 'Os gráficos de evolução ignoram Rodadas Extras (ex: E1, E2) porque elas possuem poucos jogos (1 ou 2), o que distorceria as médias de desempenho. Elas somam pontos brutos no ranking, mas ficam fora da curva de evolução.',
  },
  {
    pergunta: 'Como é calculada a Taxa de Coragem (🎲)?',
    resposta: 'O algoritmo compara seu palpite com a maioria do grupo. Se a maioria apostou na Vitória do Mandante e você apostou Empate ou Visitante, conta como palpite corajoso!',
  },
  {
    pergunta: 'Como funciona o Caçador de Zebras (🦓)?',
    resposta: 'Zebra é quando 70% ou mais dos participantes do bolão tiraram nota zero (0 pontos) nele. O Caçador de Zebras é quem mais pontuou nessas partidas onde quase todo mundo se deu mal.',
  },
  {
    pergunta: 'Quem são os Emocionados e Retranqueiros (🎭)?',
    resposta: 'É a média de gols por jogo nos seus palpites. Acima de 2.5 gols/jogo = Emocionado. Abaixo de 2.0 = Retranqueiro.',
  },
  {
    pergunta: 'Qual a regra de pagamento da mensalidade?',
    resposta: 'A mensalidade de R$ 30,00 deve ser paga até o dia 10 de cada mês. Atrasos podem acarretar perda de 5 pontos no ranking.',
  },
]

export interface GuiaSecao {
  id: string
  titulo: string
  itens: FaqItem[]
}

export const SECOES_GUIA: GuiaSecao[] = [
  {
    id: 'regras-basicas',
    titulo: '📜 Regras Básicas e Premiação',
    itens: [
      {
        pergunta: 'Como funciona a pontuação?',
        resposta: 'O sistema de pontuação é baseado no nível de precisão do seu palpite:\n\n- **Placar Exato (Cravada):** 5 pontos.\n- **Acertou o Saldo de Gols:** 3 pontos.\n- **Acertou o Vencedor:** 1 ponto.\n- **Errou tudo:** 0 pontos.\n\n*Nota: Os pontos não acumulam. Se você cravar, ganha 5 pontos, e não 5+3+1.*',
      },
      {
        pergunta: 'Como funciona a premiação?',
        resposta: 'Temos dois tipos de premiação principais:\n\n1. **Campeão da Rodada:** O jogador que fizer mais pontos na rodada leva R$ 25,00. Em caso de empate na pontuação, o prêmio é dividido igualmente.\n2. **Campeão Geral:** O grande vencedor do campeonato leva 50% de tudo que foi arrecadado. O vice-campeão leva 20% e o 3º colocado leva 10%.',
      },
      {
        pergunta: 'O que acontece em Rodadas Duplas (x2)?',
        resposta: 'De forma surpresa, a Administração pode definir que uma rodada valerá **pontos em dobro**. Nesses casos, uma cravada vale 10 pontos, o saldo vale 6, e o vencedor vale 2. O prêmio da rodada dupla também pode sofrer alteração.',
      },
    ],
  },
  {
    id: 'matematica-app',
    titulo: '🧮 A Matemática do App (Transparência)',
    itens: FAQ,
  },
  {
    id: 'pagamentos',
    titulo: '💸 Pagamentos e Inadimplência',
    itens: [
      {
        pergunta: 'Qual o valor e a data de pagamento?',
        resposta: 'A mensalidade do bolão é de R$ 30,00 e deve ser paga até o **dia 10 de cada mês**.\nChave PIX: `(inserir chave pix aqui)`',
      },
      {
        pergunta: 'O que acontece se eu atrasar?',
        resposta: 'Se o pagamento não for realizado até o dia 10, o participante recebe uma punição automática de **-5 pontos no Ranking Geral**. Caso o atraso permaneça até o mês seguinte, o jogador poderá ser banido e ter seus palpites bloqueados.',
      },
      {
        pergunta: 'Como envio o comprovante?',
        resposta: 'Os comprovantes de PIX devem ser enviados no grupo oficial do WhatsApp do bolão, marcando um dos administradores responsáveis pelo financeiro.',
      },
    ],
  }
]

export async function buscarAdmsGuia() {
  const { data, error } = await supabase
    .from('admins_profile')
    .select('id, nome, vulgo, foto, descricao, ordem, rating, posicao, stat_pal, stat_ges, stat_jus, stat_zoa, stat_res, stat_cra, foto_scale, foto_pos_x, foto_pos_y')
    .order('ordem', { ascending: true })

  if (error) throw error
  return data ?? []
}
