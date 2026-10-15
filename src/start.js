// Point d'entrée Railway : synchronise la base (mode complet uniquement),
// enregistre les slash commands, puis lance le bot.
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { IS_LITE } from './lib/mode.js';

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`Échec de : ${cmd} ${args.join(' ')}`);
    process.exit(res.status ?? 1);
  }
}

if (!IS_LITE) run('npm', ['run', 'db:push']);
run('node', ['src/deploy-commands.js']);

await import('./index.js');
