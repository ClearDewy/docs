import { spawnSync } from 'node:child_process';
if (process.platform === 'darwin' && process.arch !== 'arm64') {
  throw new Error('当前锁定环境仅支持 Apple Silicon Mac、Windows 和 Linux；Intel Mac 请使用 Linux 环境。');
}
const extra = process.platform === 'darwin' ? 'mps' : 'cpu';
const result = spawnSync('uv', ['run', '--extra', extra, '--frozen', 'python', 'examples/python/tiny_transformer.py', '--self-test'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
