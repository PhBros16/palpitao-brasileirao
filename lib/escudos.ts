// Mapeamento oficial de escudos da Série A — assets locais em /public/escudos

const MAPA_ESCUDOS_OFICIAL: Record<string, string> = {
  'palmeiras': '/escudos/palmeiras.png',
  'flamengo': '/escudos/flamengo.svg',
  'athletico-pr': '/escudos/athletico-pr.svg',
  'fluminense': '/escudos/fluminense.svg',
  'cruzeiro': '/escudos/cruzeiro.svg',
  'bahia': '/escudos/bahia.svg',
  'rb bragantino': '/escudos/rb-bragantino.png',
  'coritiba': '/escudos/coritiba.svg',
  'atletico-mg': '/escudos/atletico-mg.svg',
  'corinthians': '/escudos/corinthians.png',
  'botafogo': '/escudos/botafogo.svg',
  'vitoria': '/escudos/vitoria.svg',
  'sao paulo': '/escudos/sao-paulo.svg',
  'santos': '/escudos/santos.png',
  'gremio': '/escudos/gremio.svg',
  'internacional': '/escudos/internacional.svg',
  'mirassol': '/escudos/mirassol.png',
  'remo': '/escudos/remo.svg',
  'vasco': '/escudos/vasco-da-gama.svg',
  'chapecoense': '/escudos/chapecoense.svg',
}

/**
 * Busca o escudo oficial do time (asset local em /public/escudos).
 * A busca insensível a acentos/maiúsculas é feita SOMENTE para encontrar o link,
 * sem alterar a exibição do nome oficial do time na tela.
 */
export function getEscudo(nome: string | null | undefined): string | null {
  if (!nome) return null
  const str = nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (str.includes('palmeiras')) return MAPA_ESCUDOS_OFICIAL['palmeiras']
  if (str.includes('flamengo')) return MAPA_ESCUDOS_OFICIAL['flamengo']
  if (str.includes('athletico') || str.includes('atletico-pr') || str.includes('atletico pr') || str.includes('cap')) return MAPA_ESCUDOS_OFICIAL['athletico-pr']
  if (str.includes('fluminense') || str.includes('flu')) return MAPA_ESCUDOS_OFICIAL['fluminense']
  if (str.includes('cruzeiro')) return MAPA_ESCUDOS_OFICIAL['cruzeiro']
  if (str.includes('bahia')) return MAPA_ESCUDOS_OFICIAL['bahia']
  if (str.includes('bragantino') || str.includes('red bull') || str.includes('rb')) return MAPA_ESCUDOS_OFICIAL['rb bragantino']
  if (str.includes('coritiba') || str.includes('coxa')) return MAPA_ESCUDOS_OFICIAL['coritiba']
  if (str.includes('atletico') || str.includes('galo')) return MAPA_ESCUDOS_OFICIAL['atletico-mg']
  if (str.includes('corinthians') || str.includes('timao')) return MAPA_ESCUDOS_OFICIAL['corinthians']
  if (str.includes('botafogo') || str.includes('bota')) return MAPA_ESCUDOS_OFICIAL['botafogo']
  if (str.includes('vitoria')) return MAPA_ESCUDOS_OFICIAL['vitoria']
  if (str.includes('sao paulo') || str.includes('spfc')) return MAPA_ESCUDOS_OFICIAL['sao paulo']
  if (str.includes('santos')) return MAPA_ESCUDOS_OFICIAL['santos']
  if (str.includes('gremio')) return MAPA_ESCUDOS_OFICIAL['gremio']
  if (str.includes('internacional') || str.includes('inter')) return MAPA_ESCUDOS_OFICIAL['internacional']
  if (str.includes('mirassol')) return MAPA_ESCUDOS_OFICIAL['mirassol']
  if (str.includes('remo')) return MAPA_ESCUDOS_OFICIAL['remo']
  if (str.includes('vasco')) return MAPA_ESCUDOS_OFICIAL['vasco']
  if (str.includes('chapecoense') || str.includes('chape')) return MAPA_ESCUDOS_OFICIAL['chapecoense']

  return MAPA_ESCUDOS_OFICIAL[str] ?? null
}
