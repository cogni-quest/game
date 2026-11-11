/**
 * The workshop's mechanical sounds, made on the spot with the Web Audio API —
 * no sound files: beeps, clicks, servos, a buzz. No voice: the parent asked
 * for none. Every flash beeps the same, whatever the light or its colour, so
 * the sound is never a clue to the place.
 *
 * The browser lets sound start only after a press, so the context is made on
 * the first sound, which always follows one.
 */

export type Sound =
  'show' | 'flash' | 'press' | 'undo' | 'choose' | 'replay' | 'loaded' | 'alive' | 'broken' | 'pick'

let context: AudioContext | null = null
/** One volume knob every sound goes through, made with the context. */
let master: GainNode | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  context ??= new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

interface Tone {
  readonly type: OscillatorType
  /** Hz at the start, and — for a slide — at the end. */
  readonly from: number
  readonly to?: number
  /** Seconds after now. */
  readonly at?: number
  readonly length: number
  readonly volume: number
  /** A low-pass cut-off, to take the edge off a square or a saw. */
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

/** A burst of noise through a band: a click, a clank, a crackle. */
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

/** Each sound as a few tones and noises. Kept quiet: a workshop, not an arcade. */
const RECIPES: Record<Sound, (ctx: AudioContext, out: AudioNode) => void> = {
  // The panel wakes up: two rising blips.
  show: (ctx, out) => {
    tone(ctx, out, { type: 'square', from: 330, length: 0.08, volume: 0.12, cutoff: 1800 })
    tone(ctx, out, { type: 'square', from: 495, at: 0.1, length: 0.1, volume: 0.12, cutoff: 1800 })
  },
  // A light flashes: one clean robot beep, the same for every light.
  flash: (ctx, out) => {
    tone(ctx, out, { type: 'square', from: 660, length: 0.16, volume: 0.13, cutoff: 2400 })
    tone(ctx, out, { type: 'sine', from: 1320, length: 0.12, volume: 0.05 })
  },
  // A light is pressed: a switch clicks.
  press: (ctx, out) => {
    noise(ctx, out, { length: 0.03, volume: 0.5, band: 2600 })
    tone(ctx, out, { type: 'square', from: 220, length: 0.05, volume: 0.1, cutoff: 1200 })
  },
  // A press taken back: a short slide down.
  undo: (ctx, out) => {
    tone(ctx, out, { type: 'square', from: 420, to: 220, length: 0.12, volume: 0.1, cutoff: 1400 })
  },
  // A colour chosen: a light tick.
  choose: (ctx, out) => {
    tone(ctx, out, { type: 'triangle', from: 1250, length: 0.05, volume: 0.15 })
  },
  // The right order played back after a miss: softer and lower than a flash.
  replay: (ctx, out) => {
    tone(ctx, out, { type: 'triangle', from: 440, length: 0.18, volume: 0.12 })
  },
  // A module loaded: a servo whirrs, the part clanks home, a bell.
  loaded: (ctx, out) => {
    tone(ctx, out, {
      type: 'sawtooth',
      from: 110,
      to: 260,
      length: 0.32,
      volume: 0.09,
      cutoff: 900,
    })
    noise(ctx, out, { at: 0.3, length: 0.08, volume: 0.6, band: 900 })
    tone(ctx, out, { type: 'sine', from: 1046, at: 0.36, length: 0.5, volume: 0.12 })
  },
  // The robot comes alive: power rises, then a four-note fanfare in beeps.
  alive: (ctx, out) => {
    tone(ctx, out, { type: 'sawtooth', from: 80, to: 400, length: 0.5, volume: 0.08, cutoff: 1200 })
    ;[523, 659, 784, 1046].forEach((hz, i) => {
      tone(ctx, out, {
        type: 'square',
        from: hz,
        at: 0.5 + i * 0.11,
        length: i === 3 ? 0.4 : 0.1,
        volume: 0.11,
        cutoff: 3000,
      })
    })
  },
  // A fuse blows: a low buzz, crackles, a dying slide.
  broken: (ctx, out) => {
    tone(ctx, out, { type: 'sawtooth', from: 95, length: 0.45, volume: 0.13, cutoff: 700 })
    ;[0.05, 0.17, 0.28].forEach((at) => {
      noise(ctx, out, { at, length: 0.05, volume: 0.5, band: 3200 })
    })
    tone(ctx, out, {
      type: 'square',
      from: 300,
      to: 60,
      at: 0.45,
      length: 0.5,
      volume: 0.1,
      cutoff: 900,
    })
  },
  // A robot picked on the board: a latch opens.
  pick: (ctx, out) => {
    noise(ctx, out, { length: 0.05, volume: 0.4, band: 1500 })
    tone(ctx, out, { type: 'square', from: 392, at: 0.04, length: 0.09, volume: 0.1, cutoff: 1800 })
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
