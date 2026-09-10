import { Chord, Midi, Note } from 'tonal';

export const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const TUNING = [40, 45, 50, 55, 59, 64]; // 6 → 1 弦，实际发声八度
export const SHAPES = { C: [-1, 3, 2, 0, 1, 0], Cm: [-1, 3, 5, 5, 4, 3] };
export const MELODY = [60, 62, 64, 67, 65, 64, 62, 60];
export const SONG_CHORDS = ['C', 'C', 'C', 'C', 'F', 'F', 'G', 'C'];
export function songEvents(bpm = 72) {
  const beat = 60 / bpm;
  const chords = { C: [48, 52, 55], F: [53, 57, 60], G: [43, 47, 50] };
  return MELODY.map((midi, index) => ({ time: index * beat, duration: beat * 0.8, melody: midi, chord: [...chords[SONG_CHORDS[index]]], label: SONG_CHORDS[index] }));
}
export const noteName = (midi) => Midi.midiToNoteName(midi, { sharps: false });
export const pitchClass = (midi) => ((midi % 12) + 12) % 12;
export const frequency = (midi) => Midi.midiToFreq(midi);
export function chordNotes(root, quality) {
  return Chord.get(`${root}${quality === 'minor' ? 'm' : ''}`).notes;
}
export function triadMidi(root, quality) {
  const base = Note.midi(`${root}4`);
  return [base, base + (quality === 'minor' ? 3 : 4), base + 7];
}
export function fretMidi(stringIndex, fret) {
  if (!Number.isInteger(stringIndex) || stringIndex < 0 || stringIndex > 5 || !Number.isInteger(fret) || fret < -1 || fret > 12) throw new Error('弦或品位超出范围');
  return fret === -1 ? null : TUNING[stringIndex] + fret;
}
export function degree(midi, root) {
  const distance = pitchClass(midi - Note.chroma(root));
  return ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'][distance];
}
export function voicing(frets) { return frets.map((fret, i) => fretMidi(i, fret)).filter((midi) => midi !== null); }
export function shapeName(frets) {
  return Object.entries(SHAPES).find(([, shape]) => shape.every((fret, i) => frets[i] === fret))?.[0] ?? null;
}
export function transposeMelody(semitones) { return MELODY.map((midi) => midi + semitones); }
export function spelledMelody(semitones) {
  const root = `${ROOTS[pitchClass(semitones)]}${Math.floor((60 + semitones) / 12) - 1}`;
  return ['1P', '2M', '3M', '5P', '4P', '3M', '2M', '1P'].map((interval) => Note.transpose(root, interval));
}
export function rangeFits(notes, low, high) { return Math.min(...notes) >= low && Math.max(...notes) <= high; }
export function rhythmSteps(bpm, subdivision, pattern) {
  const seconds = 60 / bpm / subdivision;
  return pattern.map((accent, index) => ({ index, time: index * seconds, accent, beat: Math.floor(index / subdivision) + 1, part: index % subdivision }));
}

export const DEFAULT_HARMONY = { root: 'C', quality: 'major', frets: [...SHAPES.C], labels: 'names' };
export const DEFAULT_RHYTHM = { bpm: 72, subdivision: 2, pattern: [2, 0, 1, 0, 1, 0, 1, 0] };
export const DEFAULT_TRANSPOSE = { shift: 0, low: 60, high: 67 };
const integer = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
export function validateState(kind, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('实验数据必须是对象');
  if (kind === 'harmony' && ROOTS.includes(value.root) && ['major', 'minor'].includes(value.quality) && ['names', 'degrees'].includes(value.labels) && Array.isArray(value.frets) && value.frets.length === 6 && value.frets.every((v) => integer(v, -1, 5))) return { root: value.root, quality: value.quality, labels: value.labels, frets: [...value.frets] };
  if (kind === 'rhythm' && integer(value.bpm, 40, 180) && [1, 2, 4].includes(value.subdivision) && Array.isArray(value.pattern) && value.pattern.length === 4 * value.subdivision && value.pattern.every((v) => integer(v, 0, 2))) return { bpm: value.bpm, subdivision: value.subdivision, pattern: [...value.pattern] };
  if (kind === 'transpose' && integer(value.shift, -12, 12) && integer(value.low, 36, 84) && integer(value.high, 36, 84) && value.low <= value.high) return { shift: value.shift, low: value.low, high: value.high };
  throw new Error('参数无效或超出实验范围，原来的设置已保留');
}
export function encodeState(kind, value) { return JSON.stringify({ version: 1, kind, state: validateState(kind, value) }, null, 2); }
export function decodeState(kind, text) {
  if (text.length > 10000) throw new Error('实验文件不能超过 10 KB');
  const data = JSON.parse(text);
  if (data?.version !== 1 || data?.kind !== kind) throw new Error('实验类型或文件版本不匹配');
  return validateState(kind, data.state);
}
