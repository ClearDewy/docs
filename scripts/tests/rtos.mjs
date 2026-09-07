import assert from 'node:assert/strict';
import { createScheduler, taskState, addSample, nextTick, suspendProcessing } from '../../docs/.vitepress/theme/components/interactive/rtos-model.mjs';
const state = createScheduler();
assert.equal(state.running, 'Idle');
addSample(state);
assert.equal(state.running, '处理'); // 事件立即抢占，不等 tick。
suspendProcessing(state, true);
assert.equal(taskState(state, '处理'), 'SUSPENDED');
assert.equal(state.running, 'Idle');
for (let i = 0; i < 8; i++) addSample(state);
assert.equal(state.samples, 8);
assert.equal(state.dropped, 1);
suspendProcessing(state, false);
for (let i = 0; i < 8; i++) nextTick(state);
assert.equal(state.results, 8);
addSample(state);
assert.equal(state.running, '通信'); // 结果队列满时生产者阻塞，不静默丢结果。
nextTick(state);
assert.equal(state.running, '处理');
for (let i = 0; i < 12; i++) nextTick(state);
assert.equal(state.samples + state.results, 0);
assert.equal(state.running, 'Idle');
console.log('RTOS event, suspension, overflow and backpressure passed');
