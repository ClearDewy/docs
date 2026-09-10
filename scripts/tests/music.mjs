import assert from 'node:assert/strict';
import { Note } from 'tonal';
import { C_STRINGS, G_TRANSFER, guidedCVoicing, semitonePath } from '../../docs/.vitepress/theme/visualizations/music/guided.mjs';
import { chordNotes, decodeState, DEFAULT_HARMONY, DEFAULT_RHYTHM, DEFAULT_TRANSPOSE, degree, encodeState, frequency, fretMidi, MELODY, noteName, pitchClass, rangeFits, rhythmSteps, ROOTS, SHAPES, shapeName, songEvents, spelledMelody, transposeMelody, triadMidi, TUNING, validateState, voicing } from '../../docs/.vitepress/theme/visualizations/music/theory.mjs';

assert.deepEqual(TUNING.map(noteName), ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
assert.equal(fretMidi(4, 1), 60, 'B3 crosses the octave at fret 1');
assert.equal(fretMidi(0, -1), null, 'muted string must never become open E2');
assert.equal(fretMidi(0, 12), 52, '12 frets add one octave');
assert.throws(() => fretMidi(6, 0));
assert.throws(() => fretMidi(0, -2));
assert.deepEqual(voicing(SHAPES.C), [48, 52, 55, 60, 64]);
assert.deepEqual(voicing(SHAPES.Cm), [48, 55, 60, 63, 67]);
assert.deepEqual([...new Set(voicing(SHAPES.C).map(pitchClass))], [0, 4, 7]);
assert.deepEqual([...new Set(voicing(SHAPES.Cm).map(pitchClass))].sort((a, b) => a - b), [0, 3, 7]);
assert.deepEqual(voicing([-1, -1, -1, -1, -1, -1]), []);
assert.equal(shapeName(SHAPES.C), 'C');
assert.equal(shapeName(SHAPES.Cm), 'Cm');
assert.equal(shapeName([0, 3, 2, 0, 1, 0]), null, 'additional E bass is not the taught C-root-position shape');
assert.equal(degree(63, 'C'), '♭3');
assert.equal(degree(64, 'C'), '3');
assert.equal(degree(67, 'C'), '5');
assert.deepEqual(chordNotes('C', 'minor'), ['C', 'Eb', 'G']);
assert.deepEqual(chordNotes('E', 'major'), ['E', 'G#', 'B']);
for (const root of ROOTS) {
  for (const quality of ['major', 'minor']) {
    assert.deepEqual(triadMidi(root, quality).map(pitchClass), chordNotes(root, quality).map(Note.chroma), `${root} ${quality}: sounded MIDI and spelled chord must agree`);
  }
}
assert.ok(Math.abs(frequency(69) - 440) < 1e-10);
assert.ok(Math.abs(frequency(60) * 2 - frequency(72)) < 1e-10);

assert.deepEqual(transposeMelody(-2).map(noteName), ['Bb3', 'C4', 'D4', 'F4', 'Eb4', 'D4', 'C4', 'Bb3']);
assert.deepEqual(spelledMelody(4), ['E4', 'F#4', 'G#4', 'B4', 'A4', 'G#4', 'F#4', 'E4']);
assert.deepEqual(spelledMelody(11), ['B4', 'C#5', 'D#5', 'F#5', 'E5', 'D#5', 'C#5', 'B4']);
assert.deepEqual(spelledMelody(6), ['Gb4', 'Ab4', 'Bb4', 'Db5', 'Cb5', 'Bb4', 'Ab4', 'Gb4']);
for (let shift = -12; shift <= 12; shift++) {
  const moved = transposeMelody(shift);
  assert.deepEqual(spelledMelody(shift).map(Note.midi), moved, `spelling must preserve exact octaves at shift ${shift}`);
  assert.deepEqual(moved.slice(1).map((midi, i) => midi - moved[i]), [2, 2, 3, -2, -1, -2, -2]);
  assert.deepEqual(moved.map((midi) => midi - shift), MELODY);
  assert.equal(rangeFits(moved, 60, 65), false, '7-semitone melody cannot fit a 5-semitone window');
}
assert.equal(rangeFits(transposeMelody(-2), 58, 65), true);
assert.equal(rangeFits(transposeMelody(-2), 60, 65), false);

const baseline = rhythmSteps(72, 2, DEFAULT_RHYTHM.pattern);
assert.equal(baseline.length, 8);
assert.equal(baseline.filter((step) => step.accent > 0).length, 4);
assert.ok(Math.abs(baseline[2].time - 60 / 72) < 1e-12);
assert.equal(rhythmSteps(60, 2, DEFAULT_RHYTHM.pattern)[7].time, 3.5);
const song = songEvents();
assert.equal(song.length, 8);
assert.deepEqual(song.map((event) => event.melody), MELODY);
assert.deepEqual(song.map((event) => event.label), ['C', 'C', 'C', 'C', 'F', 'F', 'G', 'C']);
for (const event of song) assert.deepEqual(event.chord.map(pitchClass), chordNotes(event.label, 'major').map(Note.chroma));
assert.ok(Math.abs(song[4].time - 240 / 72) < 1e-12, 'second measure begins exactly after four beats');

for (const [kind, state] of [['harmony', DEFAULT_HARMONY], ['rhythm', DEFAULT_RHYTHM], ['transpose', DEFAULT_TRANSPOSE]]) {
  assert.deepEqual(decodeState(kind, encodeState(kind, state)), state, `${kind} state round trip`);
  const before = structuredClone(state);
  assert.throws(() => decodeState(kind, 'not JSON'));
  assert.throws(() => decodeState(kind, '{"version":9,"kind":"harmony","state":{}}'));
  assert.deepEqual(state, before, 'failed import must not mutate the existing valid state');
}
assert.throws(() => decodeState('harmony', encodeState('rhythm', DEFAULT_RHYTHM)));
assert.throws(() => decodeState('harmony', ' '.repeat(10001)));
assert.throws(() => validateState('harmony', { ...DEFAULT_HARMONY, frets: [-1, 3, 2, 0, 1, 13] }));
assert.throws(() => validateState('harmony', { ...DEFAULT_HARMONY, root: '<script>' }));
assert.throws(() => validateState('rhythm', { ...DEFAULT_RHYTHM, bpm: null }));
assert.throws(() => validateState('rhythm', { ...DEFAULT_RHYTHM, bpm: 181 }));
assert.throws(() => validateState('rhythm', { ...DEFAULT_RHYTHM, subdivision: 4 }));
assert.throws(() => validateState('rhythm', { ...DEFAULT_RHYTHM, pattern: [2, 0, 0, 0, 0, 0, 0, 3] }));
assert.throws(() => validateState('transpose', { shift: 0, low: 67, high: 60 }));
assert.throws(() => validateState('transpose', { shift: 1.5, low: 60, high: 67 }));
assert.throws(() => validateState('transpose', { shift: 13, low: 60, high: 67 }));
assert.deepEqual(semitonePath(60, 3), [60, 61, 62, 63], 'three moves include four positions; the origin is not move one');
assert.deepEqual(semitonePath(62, 3), [62, 63, 64, 65], 'transfer D to F is three semitone moves');
assert.deepEqual(semitonePath(64, -1), [64, 63], 'lowering E reaches Eb');
assert.throws(() => semitonePath(60, 1.5));
assert.deepEqual(C_STRINGS.map(s => s.midi), [null, 48, 52, 55, 60, 64], 'visible string positions must match sounded C shape');
for (const keepC of [true, false]) for (const keepE of [true, false]) {
  const strings = guidedCVoicing(keepC, keepE);
  assert.deepEqual([...new Set(strings.map(s => s.group))], ['C', 'E', 'G'], 'every repeated-note toggle must retain all three taught groups');
  assert.equal(strings.length, 3 + Number(keepC) + Number(keepE));
  assert.deepEqual(strings.map(s => s.midi), voicing([-1, 3, 2, 0, keepC ? 1 : -1, keepE ? 0 : -1]));
}
assert.deepEqual(G_TRANSFER, voicing([3, 2, 0, 0, 0, 3]), 'the six transfer pitches belong to the stated standard guitar shape');
assert.deepEqual([...new Set(G_TRANSFER.map(pitchClass))], [7, 11, 2], 'six sounded notes contain exactly G B D');
console.log('Music facts passed: tuning, mute/octaves, C/Cm voicings, 24 triads, 25 exact/spelled transpositions, ranges, rhythm/song timing, bounded state round trips. This does not verify physical audio output or performance.');
