import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('DISCORD_TOKEN, CLIENT_ID et GUILD_ID sont requis dans .env');
  process.exit(1);
}

const commands = [];
const dir = join(__dirname, 'commands');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(dir, file)).href);
  const cmd = mod.default ?? mod;
  if (cmd?.data) commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

try {
  console.log(`Déploiement de ${commands.length} commandes sur la guilde ${GUILD_ID}…`);
  const data = await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands },
  );
  console.log(`✅ ${data.length} commandes enregistrées.`);
} catch (err) {
  console.error('Échec du déploiement:', err);
  process.exit(1);
}
