import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\x1b[36m%s\x1b[0m', '⚡ Launching NexusRAG: Multimodal AI Knowledge Hub (PDF + Images + Links)...');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Spawn Backend Server (port 5000) securely without vulnerable shell execution
const server = spawn(process.execPath, [path.join(__dirname, 'server', 'server.js')], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Spawn Frontend Vite Client (port 5173)
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  server.kill();
  client.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
