// Mapeamento de nome do clube → escudo local, mesmo padrão do Copa
// (lá era SELECOES_LOGOS/getSelecaoLogo, aqui são clubes em vez de seleções).
// Coloca os PNGs em /public/escudos/ com esses nomes de arquivo exatos.
// Chaves em minúsculo/sem acento pra casar com variações de digitação.
export const CLUBES_LOGOS: Record<string, string> = {
  'athletico-pr': '/escudos/athletico-pr.svg',
  'athletico': '/escudos/athletico-pr.svg',
  'atletico-pr': '/escudos/athletico-pr.svg',
  'atletico-mg': '/escudos/atletico-mg.svg',
  'galo': '/escudos/atletico-mg.svg',
  'bahia': '/escudos/bahia.svg',
  'botafogo': '/escudos/botafogo.svg',
  'chapecoense': '/escudos/chapecoense.svg',
  'chape': '/escudos/chapecoense.svg',
  'corinthians': '/escudos/corinthians.png',
  'coritiba': '/escudos/coritiba.svg',
  'cruzeiro': '/escudos/cruzeiro.svg',
  'flamengo': '/escudos/flamengo.svg',
  'fluminense': '/escudos/fluminense.svg',
  'gremio': '/escudos/gremio.svg',
  'internacional': '/escudos/internacional.svg',
  'inter': '/escudos/internacional.svg',
  'mirassol': '/escudos/mirassol.png',
  'palmeiras': '/escudos/palmeiras.png',
  'rb bragantino': '/escudos/rb-bragantino.png',
  'bragantino': '/escudos/rb-bragantino.png',
  'remo': '/escudos/remo.svg',
  'santos': '/escudos/santos.png',
  'sao paulo': '/escudos/sao-paulo.svg',
  'vasco da gama': '/escudos/vasco-da-gama.svg',
  'vasco': '/escudos/vasco-da-gama.svg',
  'vitoria': '/escudos/vitoria.svg',
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
