/**
 * The agency's sounds, made on the spot with the Web Audio API — no sound
 * files, no voice (decided with the parent): a radio blip, a click of the
 * binoculars, a net, a whistle down for an escape, a short fanfare.
 *
 * The browser lets sound start only after a press, so the context is made on
 * the first sound, which always follows one.
 */

export type Sound = 'pick' | 'start' | 'choose' | 'giggle' | 'run' | 'replay' | 'caught' | 'mission'

let context: AudioContext | null = null
let master: GainNode | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  context ??= new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

interface Tone {
  readonly type: OscillatorType
  readonly from: number
  readonly to?: number
  readonly at?: number
  readonly length: number
  readonly volume: number
  readonly cutoff?: number
}

function tone(ctx: AudioContext, out: AudioNode, t: Tone): void {
  const start = ctx.currentTime + (t.at ?? 0)
  const end = start + t.length
  const osc = ctx.createOscillator()
  osc.type = t.type
  osc.frequency.setValueAtTime(t.from, start)
  if (t.to !== undefined) osc.frequency.exponentialRampToValueAtTime(t.to, end)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(t.volume, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  let last: AudioNode = osc
  if (t.cutoff !== undefined) {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = t.cutoff
    osc.connect(filter)
    last = filter
  }
  last.connect(gain)
  gain.connect(out)
  osc.start(start)
  osc.stop(end + 0.02)
}

/** A burst of noise through a band: a click, a swish. */
function noise(
  ctx: AudioContext,
  out: AudioNode,
  { at = 0, length, volume, band }: { at?: number; length: number; volume: number; band: number },
): void {
  const start = ctx.currentTime + at
  const samples = Math.ceil(ctx.sampleRate * length)
  const buffer = ctx.createBuffer(1, samples, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / samples)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = band
  filter.Q.value = 1.2
  const gain = ctx.createGain()
  gain.gain.value = volume
  source.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  source.start(start)
}

/** Each sound as a few tones and noises. Kept quiet: a night street, not an arcade. */
const RECIPES: Record<Sound, (ctx: AudioContext, out: AudioNode) => void> = {
  // A mission picked: a folder opens.
  pick: (ctx, out) => {
    noise(ctx, out, { length: 0.12, volume: 0.35, band: 1800 })
    tone(ctx, out, { type: 'triangle', from: 520, at: 0.08, length: 0.1, volume: 0.1 })
  },
  // The briefing is over: a radio blips twice.
  start: (ctx, out) => {
    tone(ctx, out, { type: 'square', from: 880, length: 0.07, volume: 0.08, cutoff: 2500 })
    tone(ctx, out, {
      type: 'square',
      from: 1175,
      at: 0.1,
      length: 0.09,
      volume: 0.08,
      cutoff: 2500,
    })
  },
  // A window picked: the binoculars click.
  choose: (ctx, out) => {
    noise(ctx, out, { length: 0.03, volume: 0.45, band: 3000 })
    tone(ctx, out, { type: 'triangle', from: 1250, length: 0.05, volume: 0.12 })
  },
  // A clue of the walk-through: a soft tick.
  replay: (ctx, out) => {
    tone(ctx, out, { type: 'triangle', from: 660, length: 0.16, volume: 0.1 })
  },
  // The spy is caught: a net swishes down, then a bright chime.
  caught: (ctx, out) => {
    noise(ctx, out, { length: 0.25, volume: 0.4, band: 1200 })
    ;[784, 988, 1319].forEach((hz, i) => {
      tone(ctx, out, { type: 'sine', from: hz, at: 0.22 + i * 0.09, length: 0.35, volume: 0.1 })
    })
  },
  // The missed spy laughs: «хи-хи-хи», each «хи» a breath and a squeaky rising note.
  giggle: (ctx, out) => {
    ;[0, 0.17, 0.34, 0.51].forEach((at, i) => {
      noise(ctx, out, { at, length: 0.04, volume: 0.18, band: 4200 })
      tone(ctx, out, {
        type: 'triangle',
        from: 820 + i * 40,
        to: 1250 + i * 60,
        at: at + 0.03,
        length: 0.1,
        volume: 0.1,
      })
    })
  },
  // He runs off: a whistle sliding down over quick light steps.
  run: (ctx, out) => {
    tone(ctx, out, { type: 'sine', from: 1400, to: 300, length: 0.6, volume: 0.08 })
    for (let i = 0; i < 14; i++) {
      noise(ctx, out, {
        at: 0.15 + i * 0.13,
        length: 0.035,
        volume: 0.35,
        band: 700 + (i % 2) * 300,
      })
    }
  },
  // A mission done: a short fanfare.
  mission: (ctx, out) => {
    ;[523, 659, 784, 1046].forEach((hz, i) => {
      tone(ctx, out, {
        type: 'square',
        from: hz,
        at: i * 0.12,
        length: i === 3 ? 0.45 : 0.11,
        volume: 0.09,
        cutoff: 2800,
      })
    })
  },
}

const SOUNDS = new Set<string>(Object.keys(RECIPES))

export function isSound(event: string): event is Sound {
  return SOUNDS.has(event)
}

/** Plays a sound, unless muted; a browser without sound plays nothing. */
export function play(sound: Sound, muted: boolean): void {
  if (muted) return
  const ctx = audio()
  if (!ctx) return
  if (!master) {
    master = ctx.createGain()
    master.gain.value = 0.8
    master.connect(ctx.destination)
  }
  RECIPES[sound](ctx, master)
}
