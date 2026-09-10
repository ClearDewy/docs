import { onBeforeUnmount, onMounted, ref } from 'vue';
import { frequency } from './theory.mjs';

// Each lab owns its synth and clock. It never cancels another page's Transport.
export function useMusicAudio() {
  const playing = ref(false);
  const error = ref('');
  const activeNotes = ref<number[]>([]);
  const activeIndex = ref(-1);
  let synth: any;
  let clock: any;
  let generation = 0;
  let finish: ReturnType<typeof setTimeout> | undefined;
  function stop() {
    generation++;
    playing.value = false;
    activeNotes.value = [];
    activeIndex.value = -1;
    if (finish) clearTimeout(finish);
    clock?.dispose(); clock = undefined;
    synth?.dispose(); synth = undefined;
  }
  async function prepare() {
    stop();
    const token = generation;
    error.value = '';
    try {
      const Tone = await import('tone');
      if (token !== generation) return null;
      await Tone.start();
      if (token !== generation) return null;
      synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.12, sustain: 0.15, release: 0.12 }, volume: -17 }).toDestination();
      playing.value = true;
      return { Tone, token };
    } catch {
      if (token === generation) {
        error.value = '声音未能启动。请再次点击播放，并检查浏览器声音权限；下方音名与拍点仍可使用。';
        stop();
      }
      return null;
    }
  }
  async function notes(midis: number[], sequential = true) {
    if (!midis.length) { stop(); return; }
    const ready = await prepare();
    // A newer click owns playback when preparation returns null. Never stop it.
    if (!ready) return;
    const { Tone, token } = ready;
    const start = Tone.now() + 0.05;
    if (sequential) midis.forEach((midi, i) => {
      const time = start + i * 0.5;
      synth.triggerAttackRelease(frequency(midi), 0.32, time);
      Tone.getDraw().schedule(() => {
        if (token === generation) { activeNotes.value = [midi]; activeIndex.value = i; }
      }, time);
    });
    else {
      synth.triggerAttackRelease(midis.map(frequency), 0.7, start);
      Tone.getDraw().schedule(() => {
        if (token === generation) { activeNotes.value = [...midis]; activeIndex.value = 0; }
      }, start);
    }
    finish = setTimeout(stop, (sequential ? midis.length * 0.5 + 0.2 : 1.1) * 1000);
  }
  async function rhythm(bpm: number, subdivision: number, pattern: number[], onStep: (step: number) => void) {
    const ready = await prepare();
    if (!ready) return;
    const { Tone, token } = ready;
    clock = new Tone.Clock((time: number, tick: number) => {
      if (token !== generation) return;
      const step = tick % pattern.length;
      const accent = pattern[step];
      if (accent) synth.triggerAttackRelease(accent === 2 ? 1100 : 650, 0.035, time, accent === 2 ? 0.8 : 0.45);
      Tone.getDraw().schedule(() => { if (token === generation) onStep(step); }, time);
    }, bpm / 60 * subdivision);
    clock.start(Tone.now() + 0.1);
  }
  async function song(events: { time: number; duration: number; melody: number; chord: number[] }[], withChords: boolean, onStep: (step: number) => void) {
    const ready = await prepare();
    if (!ready) return;
    const { Tone, token } = ready;
    const start = Tone.now() + 0.1;
    for (const [index, event] of events.entries()) {
      synth.triggerAttackRelease(frequency(event.melody), event.duration, start + event.time, 0.85);
      if (withChords) synth.triggerAttackRelease(event.chord.map(frequency), event.duration, start + event.time, 0.35);
      Tone.getDraw().schedule(() => { if (token === generation) onStep(index); }, start + event.time);
    }
    const last = events[events.length - 1];
    finish = setTimeout(stop, (last.time + last.duration + 0.5) * 1000);
  }
  const onHide = () => { if (document.hidden) stop(); };
  onMounted(() => document.addEventListener('visibilitychange', onHide));
  onBeforeUnmount(() => { stop(); document.removeEventListener('visibilitychange', onHide); });
  return { playing, error, activeNotes, activeIndex, stop, notes, rhythm, song };
}
