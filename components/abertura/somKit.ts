// somKit — DESATIVADO. Toda a atmosfera sonora da abertura foi removida
// porque a música tema real (mp3 do admin) toca desde o início e cobre
// o silêncio. Manter efeitos sintetizados (crowd/clac) só geraria conflito
// com a música real.
//
// A API pública (playTheme/playSpotlightClack/startCrowd) foi mantida como
// no-op pra não quebrar quem chama — AberturaScreen continua funcionando
// normalmente, só sem som.

class SoundKit {
  playTheme() {
    // no-op — música real vive na Home
  }

  playSpotlightClack(_delay = 0) {
    // no-op — atmosfera coberta pela música tema
  }

  startCrowd(_swellDuration = 2.2, _targetGain = 0.22) {
    // no-op — atmosfera coberta pela música tema
  }
}

export const somKit = new SoundKit()
