// Mapeamento oficial de escudos da Série A (CDN oficial em alta definição)

const MAPA_ESCUDOS: Record<string, string> = {
  'palmeiras': 'https://s.sde.globo.com/media/organizations/2014/04/14/palmeiras_60x60.png',
  'flamengo': 'https://s.sde.globo.com/media/organizations/2018/04/10/Flamengo-2018.svg',
  'athletico-pr': 'https://s.sde.globo.com/media/organizations/2019/09/09/Athletico-PR.svg',
  'fluminense': 'https://s.sde.globo.com/media/organizations/2014/04/14/fluminense_60x60.png',
  'cruzeiro': 'https://s.sde.globo.com/media/organizations/2021/02/13/cruzeiro_bitci_45.png',
  'bahia': 'https://s.sde.globo.com/media/organizations/2014/04/14/bahia_60x60.png',
  'rb bragantino': 'https://s.sde.globo.com/media/organizations/2020/01/01/RedBullBragantino.svg',
  'coritiba': 'https://s.sde.globo.com/media/organizations/2014/04/14/coritiba_60x60.png',
  'atletico-mg': 'https://s.sde.globo.com/media/organizations/2018/03/10/atletico-mg.svg',
  'corinthians': 'https://s.sde.globo.com/media/organizations/2019/09/30/Corinthians.svg',
  'botafogo': 'https://s.sde.globo.com/media/organizations/2019/02/04/botafogo-svg.svg',
  'vitoria': 'https://s.sde.globo.com/media/organizations/2024/04/09/vitoria-2024.svg',
  'sao paulo': 'https://s.sde.globo.com/media/organizations/2014/04/14/sao_paulo_60x60.png',
  'santos': 'https://s.sde.globo.com/media/organizations/2014/04/14/santos_60x60.png',
  'gremio': 'https://s.sde.globo.com/media/organizations/2014/04/14/gremio_60x60.png',
  'internacional': 'https://s.sde.globo.com/media/organizations/2016/05/03/inter60.png',
  'mirassol': 'https://s.sde.globo.com/media/organizations/2020/07/02/mirassol-30.png',
  'remo': 'https://s.sde.globo.com/media/organizations/2014/04/14/remo_60x60.png',
  'vasco': 'https://s.sde.globo.com/media/organizations/2021/09/04/vasco_SVG.svg',
  'chapecoense': 'https://s.sde.globo.com/media/organizations/2021/06/21/chapecoense-2021.svg',
}

/**
 * Busca o caminho do escudo oficial.
 * A busca insensível a acentos/maiúsculas é feita SOMENTE para encontrar o link,
 * sem alterar a exibição do nome oficial do time na tela.
 */
export function getEscudo(nome: string | null | undefined): string | null {
  if (!nome) return null
  const str = nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (str.includes('palmeiras')) return MAPA_ESCUDOS['palmeiras']
  if (str.includes('flamengo')) return MAPA_ESCUDOS['flamengo']
  if (str.includes('athletico') || str.includes('atletico-pr') || str.includes('atletico pr') || str.includes('cap')) return MAPA_ESCUDOS['athletico-pr']
  if (str.includes('fluminense') || str.includes('flu')) return MAPA_ESCUDOS['fluminense']
  if (str.includes('cruzeiro')) return MAPA_ESCUDOS['cruzeiro']
  if (str.includes('bahia')) return MAPA_ESCUDOS['bahia']
  if (str.includes('bragantino') || str.includes('red bull') || str.includes('rb')) return MAPA_ESCUDOS['rb bragantino']
  if (str.includes('coritiba') || str.includes('coxa')) return MAPA_ESCUDOS['coritiba']
  if (str.includes('atletico') || str.includes('mg') || str.includes('galo')) return MAPA_ESCUDOS['atletico-mg']
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

  return MAPA_ESCUDOS[str] ?? null
}
