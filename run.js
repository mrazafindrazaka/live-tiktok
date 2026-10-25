// Lance le backend et une interface (admin ou front) : npm run admin <streamer> | npm run front --test
import { spawn } from 'node:child_process';

const rawArgs = process.argv.slice(2);
const ui = rawArgs.find((a) => a.startsWith('--ui='))?.slice(5) ?? 'admin'; // admin | front
const args = rawArgs.filter((a) => !a.startsWith('--ui='));
if (process.env.npm_config_test === 'true' && !args.includes('--test')) args.push('--test'); // npm avale --test sans `--`

const procs = [
  ['backend', ['run', 'dev', '--prefix', 'backend', '--', ...args], '\x1b[33m'],
  [ui.padEnd(7), ['run', 'dev', '--prefix', ui], '\x1b[36m'],
].map(([name, npmArgs, color]) => {
  const p = spawn('npm', npmArgs, { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  const out = (stream) => (chunk) =>
    String(chunk).split('\n').filter(Boolean).forEach((l) => stream.write(`${color}${name}\x1b[0m │ ${l}\n`));
  p.stdout.on('data', out(process.stdout));
  p.stderr.on('data', out(process.stderr));
  p.on('exit', (code) => {
    console.log(`${name.trim()} arrêté (code ${code}), arrêt du reste…`);
    stop(code ?? 1);
  });
  return p;
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  procs.forEach((p) => { try { process.kill(-p.pid, 'SIGTERM'); } catch {} }); // tout le groupe, pas seulement npm
  setTimeout(() => process.exit(code), 300);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
