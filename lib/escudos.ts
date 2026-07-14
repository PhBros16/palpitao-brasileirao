// Mapeamento de nome do clube → escudo local, mesmo padrão do Copa
// (lá era SELECOES_LOGOS/getSelecaoLogo, aqui são clubes em vez de seleções).
// Coloca os PNGs em /public/escudos/ com esses nomes de arquivo exatos.
// Chaves em minúsculo/sem acento pra casar com variações de digitação.
export const CLUBES_LOGOS: Record<string, string> = {
  'athletico-pr': '/escudos/athletico-pr.png',
  'athletico': '/escudos/athletico-pr.png',
  'atletico-pr': '/escudos/athletico-pr.png',
  'atletico-mg': '/escudos/atletico-mg.png',
  'galo': '/escudos/atletico-mg.png',
  'bahia': '/escudos/bahia.png',
  'botafogo': '/escudos/botafogo.png',
  'chapecoense': '/escudos/chapecoense.png',
  'chape': '/escudos/chapecoense.png',
  'corinthians': '/escudos/corinthians.png',
  'coritiba': '/escudos/coritiba.png',
  'cruzeiro': '/escudos/cruzeiro.png',
  'flamengo': '/escudos/flamengo.png',
  'fluminense': '/escudos/fluminense.png',
  'gremio': '/escudos/gremio.png',
  'internacional': '/escudos/internacional.png',
  'inter': '/escudos/internacional.png',
  'mirassol': '/escudos/mirassol.png',
  'palmeiras': '/escudos/palmeiras.png',
  'rb bragantino': '/escudos/rb-bragantino.png',
  'bragantino': '/escudos/rb-bragantino.png',
  'remo': '/escudos/remo.png',
  'santos': '/escudos/santos.png',
  'sao paulo': '/escudos/sao-paulo.png',
  'vasco da gama': '/escudos/vasco-da-gama.png',
  'vasco': '/escudos/vasco-da-gama.png',
  'vitoria': '/escudos/vitoria.png',
}

function normalizar(s: string) {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos pra casar 'atlético' com 'atletico'
}

/** Mesmo comportamento do getSelecaoLogo() do Copa: retorna '' se não achar. */
export function getEscudo(nomeTime: string): string {
  return CLUBES_LOGOS[normalizar(nomeTime)] || ''
}
