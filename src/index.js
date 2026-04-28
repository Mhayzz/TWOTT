import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'DATABASE_URL'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Variable d'environnement manquante: ${key}`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember, Partials.Message, Partials.Channel, Partials.User],
});

client.commands = new Collection();

async function loadCommands() {
  const dir = join(__dirname, 'commands');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const cmd = mod.default ?? mod;
    if (!cmd?.data?.name || typeof cmd.execute !== 'function') {
      console.warn(`Commande ignorée (structure invalide): ${file}`);
      continue;
    }
    client.commands.set(cmd.data.name, cmd);
  }
}

async function loadEvents() {
  const dir = join(__dirname, 'events');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    const event = mod.default ?? mod;
    if (!event?.name || typeof event.execute !== 'function') {
      console.warn(`Événement ignoré (structure invalide): ${file}`);
      continue;
    }
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

await loadCommands();
await loadEvents();

process.on('unhandledRejection', (err) => console.error('UnhandledRejection:', err));
process.on('uncaughtException', (err) => console.error('UncaughtException:', err));

client.login(process.env.DISCORD_TOKEN);
