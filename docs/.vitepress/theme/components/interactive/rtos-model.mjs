// 一次 tick 完成一个工作单元；事件和挂起操作立即重新调度。
export function createScheduler() {
  return { tick: 0, samples: 0, results: 0, running: 'Idle', paused: false, dropped: 0, log: [] };
}
export function schedule(state) {
  state.running = !state.paused && state.samples > 0 && state.results < 8 ? '处理'
    : state.results > 0 ? '通信' : 'Idle';
}
export function taskState(state, name) {
  if (name === '处理' && state.paused) return 'SUSPENDED';
  if (state.running === name) return 'RUNNING';
  if (name === '处理') return state.samples > 0 && state.results < 8 ? 'READY' : 'BLOCKED';
  if (name === '通信') return state.results > 0 ? 'READY' : 'BLOCKED';
  return 'READY';
}
function record(state, message) {
  state.log.unshift(`tick ${state.tick}: ${message}；当前 ${state.running} RUNNING`);
  state.log = state.log.slice(0, 6);
}
export function addSample(state) {
  if (state.samples === 8) {
    state.dropped++;
    record(state, `样本队列已满，拒收新样本；累计丢弃 ${state.dropped}`);
    return;
  }
  state.samples++;
  schedule(state);
  record(state, `ADC 发布样本，depth=${state.samples}；事件触发调度`);
}
export function suspendProcessing(state, paused) {
  state.paused = paused;
  schedule(state);
  record(state, paused ? '挂起处理任务' : '恢复处理任务');
}
export function nextTick(state) {
  const previous = state.running;
  if (previous === '处理') { state.samples--; state.results++; }
  if (previous === '通信') state.results--;
  state.tick++;
  schedule(state);
  record(state, `${previous} 完成一个时间片，sample=${state.samples} result=${state.results}`);
}
