// Mapeamento oficial de escudos da pasta public/escudos/

const MAPA_ESCUDOS: Record<string, string> = {
  'palmeiras': '/escudos/palmeiras.png',
  'flamengo': '/escudos/flamengo.png',
  'athletico-pr': '/escudos/athletico-pr.png',
  'fluminense': '/escudos/fluminense.png',
  'cruzeiro': '/escudos/cruzeiro.png',
  'bahia': '/escudos/bahia.png',
  'rb bragantino': '/escudos/rb-bragantino.png',
  'coritiba': '/escudos/coritiba.png',
  'atletico-mg': '/escudos/atletico-mg.png',
  'corinthians': '/escudos/corinthians.png',
  'botafogo': '/escudos/botafogo.png',
  'vitoria': '/escudos/vitoria.png',
  'sao paulo': '/escudos/sao-paulo.png',
  'santos': '/escudos/santos.png',
  'gremio': '/escudos/gremio.png',
  'internacional': '/escudos/internacional.png',
  'mirassol': '/escudos/mirassol.png',
  'remo': '/escudos/remo.png',
  'vasco': '/escudos/vasco.png',
  'chapecoense': '/escudos/chapecoense.png',
}

/**
 * Busca o caminho do arquivo PNG do escudo.
 * Tolera qualquer variação de nome (acentos, maiúsculas, 'Red Bull' vs 'RB', 'Vasco da Gama' vs 'Vasco').
 */
export function getEscudo(nome: string | null | undefined): string | null {
  if (!nome) return null
  
  // Limpa o nome: converte pra minúsculo, remove acentos
  const str = nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (str.includes('palmeiras')) return MAPA_ESCUDOS['palmeiras']
  if (str.includes('flamengo')) return MAPA_ESCUDOS['flamengo']
  if (str.includes('athletico') || str.includes('cap')) return MAPA_ESCUDOS['athletico-pr']
  if (str.includes('fluminense') || str.includes('flu')) return MAPA_ESCUDOS['fluminense']
  if (str.includes('cruzeiro')) return MAPA_ESCUDOS['cruzeiro']
  if (str.includes('bahia')) return MAPA_ESCUDOS['bahia']
  if (str.includes('bragantino') || str.includes('red bull') || str.includes('rb')) return MAPA_ESCUDOS['rb bragantino']
  if (str.includes('coritiba') || str.includes('coxa')) return MAPA_ESCUDOS['coritiba']
  if (str.includes('atletico') || str.includes('galo')) return MAPA_ESCUDOS['atletico-mg']
  if (str.includes('corinthians') || str.includes('timao')) return MAPA_ESCUDOS['corinthians']
  if (str.includes('botafogo') || str.includes('bota')) return MAPA_ESCUDOS['botafogo']
  if (str.includes('vitoria')) return MAPA_ESCUDOS['vitoria']
  if (str.includes('sao paulo') || str.includes('spfc')) return MAPA_ESCUDOS['sao paulo']
  if (str.includes('santos')) return MAPA_ESCUDOS['santos']
  if (str.includes('gremio')) return MAPA_ESCUDOS['gremio']
  if (str.includes('internacional') || str.includes('inter')) return MAPA_ESCUDOS['internacional']
  if (str.includes('mirassol')) return MAPA_ESCUDOS['mirassol']
  if (str.includes('remo')) return MAPA_ESCUDOS['remo']
  if (str.includes('vasco')) return MAPA_ESCUDOS['vasco']
  if (str.includes('chapecoense') || str.includes('chape')) return MAPA_ESCUDOS['chapecoense']

  return null
}
