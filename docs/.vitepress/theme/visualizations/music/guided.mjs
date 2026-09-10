import { fretMidi, noteName, pitchClass, SHAPES } from './theory.mjs';

export function semitonePath(start, distance) {
  if (!Number.isInteger(start) || !Number.isInteger(distance) || Math.abs(distance) > 12) throw new Error('台阶距离应为十二格以内的整数');
  return Array.from({ length: Math.abs(distance) + 1 }, (_, i) => start + i * Math.sign(distance));
}

export const C_STRINGS = SHAPES.C.map((fret, index) => {
  const midi = fretMidi(index, fret);
  return { string: 6 - index, fret, midi, name: midi === null ? '不弹' : noteName(midi), group: midi === null ? null : ['C', 'E', 'G'][[0, 4, 7].indexOf(pitchClass(midi))] };
});

// Only the octave duplicates are optional; the three distinct chord tones remain.
export function guidedCVoicing(keepHighC = true, keepHighE = true) {
  return C_STRINGS.filter((string) => string.midi !== null && (string.string !== 2 || keepHighC) && (string.string !== 1 || keepHighE));
}

export const G_TRANSFER = [43, 47, 50, 55, 59, 67]; // Standard tuning, 3 2 0 0 0 3.
