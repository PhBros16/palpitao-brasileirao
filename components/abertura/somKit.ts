// somKit — efeitos sonoros sintetizados via Web Audio API (sem arquivos de
// áudio). Mantém "clac" de refletor e ruído de torcida ambiente.
//
// A vinheta melódica de 7 notas (playTheme) foi SILENCIADA — o app agora
// usa música tema real (mp3 do admin) na tela Home. Manter aqui uma
// segunda música competindo com a real geraria conflito de áudio.
//
// A API pública continua idêntica (playTheme/playSpotlightClack/startCrowd)
// pra não quebrar quem já chama. playTheme só não emite som mais.

class SoundKit {
  private ctx: AudioContext | null = null
  private crowdNode: AudioBufferSourceNode | null = null

  private ensure(): AudioContext {
    if (!this.ctx) {
      const AC =
        (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  /**
   * SILENCIADO. Vinheta original de 7 notas removida — a música tema real
   * (mp3 do admin) toca na Home, não faz sentido ter uma vinheta melódica
   * competindo aqui. Mantemos a função pra não quebrar o AberturaScreen
   * que ainda a chama.
   */
  playTheme() {
    // no-op — a música real vive na Home
    this.ensure() // garante contexto criado (pra não travar autoplay depois)
  }

  playSpotlightClack(delay = 0) {
    const ctx = this.ensure()
    const start = ctx.currentTime + delay
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008))
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = 0.35
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1200
    src.connect(hp).connect(g).connect(ctx.destination)
    src.start(start)

    const o = ctx.createOscillator()
    const og = ctx.createGain()
    o.type = 'sawtooth'
    o.frequency.value = 90
    og.gain.setValueAtTime(0.0001, start)
    og.gain.exponentialRampToValueAtTime(0.12, start + 0.05)
    og.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)
    o.connect(og).connect(ctx.destination)
    o.start(start)
    o.stop(start + 0.7)
  }

  startCrowd(swellDuration = 2.2, targetGain = 0.22) {
    const ctx = this.ensure()
    if (this.crowdNode) return
    const bufferSize = ctx.sampleRate * 4
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true

    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 800
    bp.Q.value = 0.6

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2200

    const g = ctx.createGain()
    g.gain.value = 0.0001

    src.connect(bp).connect(lp).connect(g).connect(ctx.destination)
    src.start()

    const now = ctx.currentTime
    g.gain.exponentialRampToValueAtTime(targetGain, now + swellDuration)

    this.crowdNode = src
  }
}

export const somKit = new SoundKit()
