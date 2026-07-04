// somKit — efeitos sonoros sintetizados via Web Audio API (sem arquivos de
// áudio). Mantido como no protótipo original: tema de abertura, "clac" de
// refletor e ruído de torcida. Só toca a partir de um gesto do usuário
// (botão "Abrir o Álbum"), respeitando a trava de autoplay do navegador
// (CLAUDE.md Seção 4 — "Sobre a música tema").

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

  playTheme() {
    const ctx = this.ensure()
    const now = ctx.currentTime
    const notes = [
      { f: 466.16, t: 0.0, d: 0.35 },
      { f: 587.33, t: 0.18, d: 0.35 },
      { f: 698.46, t: 0.36, d: 0.35 },
      { f: 932.33, t: 0.54, d: 0.6 },
      { f: 698.46, t: 0.9, d: 0.35 },
      { f: 587.33, t: 1.08, d: 0.35 },
      { f: 466.16, t: 1.26, d: 0.9 },
    ]
    const master = ctx.createGain()
    master.gain.value = 0.18
    master.connect(ctx.destination)
    notes.forEach((n) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.value = n.f
      g.gain.setValueAtTime(0.0001, now + n.t)
      g.gain.exponentialRampToValueAtTime(0.9, now + n.t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d)
      o.connect(g).connect(master)
      o.start(now + n.t)
      o.stop(now + n.t + n.d + 0.05)
    })
    const bass = ctx.createOscillator()
    const bg = ctx.createGain()
    bass.type = 'sine'
    bass.frequency.value = 116.54
    bg.gain.setValueAtTime(0.0001, now)
    bg.gain.exponentialRampToValueAtTime(0.5, now + 0.05)
    bg.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
    bass.connect(bg).connect(master)
    bass.start(now)
    bass.stop(now + 1.9)
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
