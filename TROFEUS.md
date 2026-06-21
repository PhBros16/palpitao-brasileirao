# TROFEUS.md — Sala de Troféus do Palpitão Brasileirão

> Documento complementar ao `CLAUDE.md`. Especificação final dos troféus re-tematizados
> (mata-mata → liga), decidida em conversa direta entre o idealizador do projeto e Claude,
> troféu por troféu. Esta é a fonte de verdade para a extração de `calcTrofeus`
> (CLAUDE.md, Seção 6) — não inventar números ou condições que não estejam aqui.

---

## Resolução dos pontos antes em aberto

Os sete itens abaixo estavam marcados como pendentes (números/condições sem decisão final).
Foram fechados aplicando a mesma lógica que já vinha sendo usada nas decisões anteriores:

- **Onde a pendência era um "mínimo para concorrer"** (Líder Absoluto, O Predador, Jamais
  Terão) — o mínimo foi **removido**, no mesmo espírito de "Resistente" (que perdeu o "min 5"
  e ficou só "palpitou todas as rodadas").
- **Onde a pendência era o próprio número que define o troféu** (Veterano, Em Chamas,
  Estrela Cadente, O Mandante) — o valor **original do Copa foi mantido**, sem recalibração,
  por não haver número novo confirmado.

Essas sete decisões estão refletidas diretamente nas tabelas dos tiers abaixo. Nenhuma
pendência resta — o documento está fechado para implementação.

---

## TIER 1 — 🟢 "Qualquer um tem, até você" (13 troféus)

| Troféu | Condição | Nota |
|---|---|---|
| Veterano | Participou de **5+** rodadas | valor original do Copa, mantido |
| Virada de Mesa | Subiu 3+ posições no ranking em uma única rodada | igual ao Copa |
| Resistente | Palpitou em **todas** as rodadas da temporada, sem faltar nenhuma | sem mínimo (era "min 5" no Copa) |
| O Pacifista | Apostou empate em **60%+** dos jogos de uma rodada | era 50%+ |
| Zero a Zero | Apostou 0x0 em 3+ jogos ao longo da temporada | igual ao Copa |
| Dormiu no Ponto | Perdeu o prazo de palpite em 3+ rodadas | igual ao Copa |
| O Contador | Acertou o saldo de gols em 5+ jogos (sem cravar) | igual ao Copa |
| O Mandante | Apostou vitória do time da casa em **mais de 50%** dos jogos da temporada inteira | janela = temporada completa |
| O Eterno Vice | Ficou **5+** vezes em 2º lugar, nunca chegou ao 1º | era 3+ |
| Mosca Magra | Ficou **5+** rodadas abaixo do top 10 | renomeado de "Maior Seca"; condição mudou de "sem acertar nada" pra "fora do top 10" |
| Na Sorte | **Cravou** 1 jogo sozinho na rodada (ninguém mais palpitou aquele jogo) | era "acertou" (resultado), agora exige cravada |
| Colado na Média | Empatou em pontos com outro participante **3x** na rodada | desceu do Tier 2; antes era condição única, agora exige 3 ocorrências |
| O Muralha | **30** rodadas sem zerar (consecutivas ou não — confirmar com calcPlayerStats: é sequência) | era 3 rodadas; ficou no Tier 1 mesmo recalibrado |

**Excluídos do Copa (não entram):** Galinha, O Otimista Trágico.

---

## TIER 2 — 🔵 "Rapaz, esse aqui é bom" (9 troféus)

| Troféu | Condição | Nota |
|---|---|---|
| Em Chamas | **4+** rodadas seguidas no top 3 | valor original do Copa, mantido |
| Hat-trick | **4** cravadas na mesma rodada | era 3 |
| O Analista | Ficou **acima da média do grupo em mais de 15 rodadas** | era "melhor média, min 3 rodadas" — condição mudou de "ranking de 1" pra "contagem de rodadas acima da média" |
| Rei dos Clássicos | Acertou o **vencedor** em **6** dos clássicos regionais (lista oficial abaixo) | era "Sangue Frio", cravada em mata-mata |
| O Papagaio | Apostou **idêntico a um mesmo participante específico** em todos os jogos da rodada | condição muda de "copiar o líder" pra "copiar qualquer um" — nome mantido |
| Fênix | Ficou 2+ rodadas consecutivas em último lugar **e conseguiu sair** | renomeado da antiga "Tartaruga"; condição preservada |
| O Showman | Acertou um placar com 5+ gols no total (cravada) | igual ao Copa |
| Lanterninha | Ficou 3+ rodadas em último lugar | renomeado de "Lanterninha Raiz" |
| Olho de Águia | **30** cravadas na temporada | subiu do Tier 1; era 3 cravadas |

**Excluídos do Copa (não entram):** O Consistente, Fênix antigo (saiu do último para o top 3 numa única rodada — substituído pela condição da Tartaruga, ver acima).

---

## TIER 3 — 🌟 "Levanta que essa é só sua!" (11 troféus)

| Troféu | Condição | Nota |
|---|---|---|
| Perfeição | **Pontuou (acertou ao menos o resultado) em todos os jogos de uma rodada** | era "cravou todos" — condição rebaixada de cravada pra resultado, porque cravar 100% é estatisticamente quase impossível (recorde do grupo: ~50%) |
| Líder Absoluto | Ficou mais vezes em 1º lugar que qualquer outro participante | sem mínimo de rodadas para concorrer |
| Estrela Cadente | **7+** cravadas na temporada | renomeado de "Relâmpago"; valor original do Copa, mantido |
| O Predador | Ficou mais vezes no top 3 da temporada que qualquer outro jogador | condição relativa (não é número fixo); sem mínimo de rodadas jogadas |
| Jamais Terão | Nunca ficou em último lugar em nenhuma rodada da temporada | renomeado de "Invicto"; sem mínimo de rodadas jogadas |
| Saldo Perfeito | Acertou o saldo de gols em **20+** jogos na temporada | era 10+ |
| Implacável | 5+ rodadas consecutivas no top 3 | igual ao Copa |
| Franco Atirador | **25+** cravadas na temporada | era 12+ |
| O Monólito | Apostou o mesmo placar em todos os jogos de uma rodada | subiu do Tier 1 (10 jogos por rodada torna isso muito raro) |
| Diplomata | Apostou mais empates que qualquer outro participante (mínimo de rodadas a definir, seguindo padrão do Copa) | subiu do Tier 2 |
| O Mágico | **5** cravadas em uma única rodada | subiu do Tier 2; era 4 |

**Excluídos do Copa (não entram):** Vidente (cravar 2+ jogos de mata-mata — sem equivalente de liga aprovado).

---

## TIER 4 — 👑 Épico (1 troféu)

| Troféu | Condição |
|---|---|
| CAMPEÃO! | O maior pontuador de toda a temporada. Eterno. |

---

## Lista oficial de Clássicos (para "Rei dos Clássicos")

Lista fechada e travada — o sistema só deve contar um confronto como clássico se **ambos os
clubes estiverem na Série A na mesma temporada** (alguns sobem/descem de divisão ano a ano;
isso não exige tratamento especial, o confronto simplesmente não vai ocorrer naquele ano se
um dos lados não estiver na elite).

| Clássico | Confronto |
|---|---|
| Grenal | Grêmio × Internacional |
| Choque-Rei | Corinthians × Palmeiras |
| Majestoso | São Paulo × Corinthians |
| Derby (Paulista) | São Paulo × Palmeiras |
| Fla-Flu | Flamengo × Fluminense |
| Clássico dos Milhões | Vasco da Gama × Flamengo |
| Atletiba | Atlético-PR × Coritiba |
| Ba-Vi | Bahia × Vitória |
| Clássico Mineiro | Atlético-MG × Cruzeiro |

---

## Resumo numérico

| Tier | Quantidade |
|---|---|
| 1 — Comum | 13 |
| 2 — Raro | 9 |
| 3 — Lendário | 11 |
| 4 — Épico | 1 |
| **Total** | **34** |

(Do total de ~39 troféus do Copa, 5 foram excluídos sem substituto: Galinha, O Otimista
Trágico, O Consistente, o Fênix antigo, e Vidente.)

## Decisão registrada: sem troféus novos de liga (por enquanto)

Cinco conceitos de troféus exclusivos de temporada longa foram propostos (G6, Z4, Clássico
é Clássico, Segundo Tempo, Pontos Corridos) e **descartados por ora** — decisão deliberada
de manter o conjunto enxuto na v1, em vez de inflar o número sem necessidade comprovada.
Podem ser revisitados após rodar uma temporada real, se fizerem falta.

---

## Notas para a implementação (`calcTrofeus`)

1. **Todas as condições deste documento estão fechadas.** Nenhuma pendência resta — não é
   necessário perguntar números antes de implementar `calcTrofeus`.
2. **"Rei dos Clássicos" depende de dados que `RodadaHistorico` hoje não carrega**: para
   saber quais times jogaram em cada partida (e cruzar com a lista de clássicos), a função
   precisa de acesso aos nomes dos clubes de cada jogo, não só ao placar. Verificar se
   `RodadaHistorico.results`/`palpites` (ver `types.ts`) precisa de mais um campo
   (ex.: mapa de jogo → times) ou se isso vem de uma fonte separada (tabela `jogos`).
3. Os ícones SVG de cada troféu (objetos colecionáveis, ver `CLAUDE.md` Seção 4, item 6)
   são tarefa de design à parte — este documento define *o quê*, não *a aparência*.
4. Ao extrair, seguir o mesmo padrão das demais funções de domínio: pura, tipada,
   data-driven, com testes de sanidade cobrindo pelo menos um caso de cada tier.
