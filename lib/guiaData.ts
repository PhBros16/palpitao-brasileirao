// GuiaData — conteúdo estático da aba Guia.
// Separado em seções (Regras, Pagamentos, Adms) pra não inflar o componente.

export interface GuiaItem {
  pergunta: string
  resposta: string
}

export interface GuiaSecao {
  id: string
  titulo: string
  itens: GuiaItem[]
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
    itens: [
      {
        pergunta: 'Como o Ranking calcula a coluna VENC.?',
        resposta: 'A coluna **VENC.** no ranking não significa apenas quem acertou o vencedor da partida com 1 ponto. Ela mostra o **Total de Jogos Pontuados** (a soma de todas as Cravadas + Saldos + Vencedores puros). Ou seja, se o seu VENC é 110, significa que em 110 jogos do campeonato você pontuou no ranking.',
      },
      {
        pergunta: 'Como a Tabela da Série A é calculada?',
        resposta: 'O aplicativo constrói a tabela **100% ao vivo** baseada exclusivamente nos placares que a Administração digita no painel.\n\nA matemática é a regra oficial da CBF:\n- **Vitória:** +3 pontos\n- **Empate:** +1 ponto\n- **Derrota:** 0 pontos\nO Saldo de Gols, Gols Pró e as zonas de classificação atualizam instantaneamente a cada placar salvo.',
      },
      {
        pergunta: 'Como funciona a Projeção de Título e Rebaixamento?',
        resposta: 'A Projeção (🔮) é uma Regra de Três matemática pura, baseada no que o time fez até agora.\n\n**Fórmula:**\n`Projeção = (Pontos Atuais ÷ Jogos Disputados) × 38 rodadas`.\n\nSe a projeção de um time for $\\ge 70$ pontos, o algoritmo indica chance matemática de **Título 🏆**. Se for $\\le 45$ pontos (corte do Brasileirão), o time entra em **Risco Z4 🚨**.',
      },
      {
        pergunta: 'Por que o Gráfico de Evolução não tem as Rodadas Extras?',
        resposta: 'Os gráficos de evolução ignoram as "Rodadas Extras" (ex: E1, E2). Isso acontece porque rodadas extras geralmente têm apenas 1 ou 2 jogos, o que quebraria a linha do tempo do gráfico injustamente. Rodadas extras somam pontos brutos no ranking, mas ficam de fora do desenho estatístico.',
      },
      {
        pergunta: 'Como é calculada a Taxa de Coragem (🎲)?',
        resposta: 'O algoritmo varre todos os seus palpites e compara com o resto do grupo jogo a jogo. Se a maioria apostou na Vitória do Mandante e você apostou no Empate ou no Visitante, isso é contado como um "Palpite Corajoso" contra a maré. A porcentagem mostra o quanto você foge do senso comum!',
      },
      {
        pergunta: 'Como funciona o Caçador de Zebras (🦓)?',
        resposta: 'Um jogo é classificado como "Zebra" se **70% ou mais** dos participantes do bolão tiraram nota zero (0 pontos) nele. O Caçador de Zebras é o jogador que conseguiu garimpar mais pontos nessas partidas onde quase todo mundo se deu mal.',
      },
      {
        pergunta: 'Quem são os Emocionados e Retranqueiros (🎭)?',
        resposta: 'O app soma os gols (Mandante + Visitante) dos seus palpites e divide pelos jogos que você palpitou. Jogadores com alta média de gols são os "Emocionados" (acreditam em partidas agitadas), e os de média baixa são os "Retranqueiros" (apostam no placar magro).',
      }
    ],
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
