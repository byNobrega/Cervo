'use client'

import confetti from 'canvas-confetti'

// Efeitos sonoros e visuais do app. Os sons são sintetizados com a Web Audio
// API (sem arquivos), no estilo minimalista/sofisticado do Nintendo Switch.

let ctx: AudioContext | null = null
function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

// Toca uma nota curta e limpa. dur em segundos.
function nota(freq: number, dur: number, inicio: number, tipo: OscillatorType = 'sine', volume = 0.15) {
  const ac = audioCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = tipo
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ac.destination)
  const t0 = ac.currentTime + inicio
  // envelope suave (ataque/decay curtos) para soar "premium"
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

// Clique sutil e agradável (ação principal). Duas senóides rápidas.
export function somClique() {
  const ac = audioCtx()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume()
  nota(880, 0.06, 0, 'sine', 0.12)
  nota(1320, 0.05, 0.02, 'sine', 0.08)
}

// Confirmação positiva (ex: marcar comprado) — duas notas ascendentes.
export function somConfirmar() {
  const ac = audioCtx()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume()
  nota(660, 0.08, 0, 'triangle', 0.12)
  nota(990, 0.1, 0.07, 'triangle', 0.12)
}

// Trompete curto e alegre (ao concluir a lista). Arpejo rápido em dente-de-serra.
export function somTrompete() {
  const ac = audioCtx()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume()
  // Dó - Mi - Sol - Dó (curto e triunfante)
  nota(523, 0.12, 0.0, 'sawtooth', 0.14)
  nota(659, 0.12, 0.1, 'sawtooth', 0.14)
  nota(784, 0.12, 0.2, 'sawtooth', 0.14)
  nota(1047, 0.24, 0.32, 'sawtooth', 0.16)
}

// Confete comemorativo. `intenso` para a celebração maior (lista finalizada).
export function soltarConfete(intenso = false) {
  if (typeof window === 'undefined') return
  const base = { spread: 70, startVelocity: 45, ticks: 200, zIndex: 9999 }
  if (intenso) {
    // Duas rajadas dos cantos inferiores
    confetti({ ...base, particleCount: 90, angle: 60, origin: { x: 0, y: 0.9 } })
    confetti({ ...base, particleCount: 90, angle: 120, origin: { x: 1, y: 0.9 } })
    setTimeout(() => {
      confetti({ ...base, particleCount: 60, angle: 90, origin: { x: 0.5, y: 0.7 } })
    }, 250)
  } else {
    confetti({ ...base, particleCount: 60, origin: { y: 0.7 } })
  }
}

// Celebração completa: confete + trompete (usada ao finalizar/comprar a lista).
export function celebrar(intenso = false) {
  soltarConfete(intenso)
  somTrompete()
}
