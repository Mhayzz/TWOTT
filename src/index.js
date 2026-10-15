import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Partials, Options } from 'discord.js';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { IS_LITE, isCommandFileEnabled } from './lib/mode.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
if (!IS_LITE) requiredEnv.push('DATABASE_URL');
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Variable d'environnement manquante: ${key}`);
    process.exit(1);
  }
}

// Mode lite : un seul intent et quasiment aucun cache, pour consommer le moins de RAM possible.
const liteOptions = {
  intents: [GatewayIntentBits.Guilds],
  makeCache: Options.cacheWithLimits({
    MessageManager: 0,
    PresenceManager: 0,
    ReactionManager: 0,
    VoiceStateManager: 0,
    ThreadManager: 0,
    ThreadMemberManager: 0,
    GuildBanManager: 0,
    GuildInviteManager: 0,
    GuildEmojiManager: 0,
    GuildStickerManager: 0,
    GuildScheduledEventManager: 0,
    StageInstanceManager: 0,
    AutoModerationRuleManager: 0,
    ApplicationCommandManager: 0,
    UserManager: 0,
    GuildMemberManager: {
      maxSize: 0,
      keepOverLimit: (member) => member.id === member.client.user.id,
    },
  }),
};

const fullOptions = {
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
  // Keep up to 1000 messages per channel in cache so deletion logs have content.
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 1000,
  }),
  // Don't auto-sweep messages — keep them as long as memory allows.
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
      interval: 3600,           // every hour
      lifetime: 24 * 60 * 60,   // remove cached messages older than 24h
    },
  },
};

const client = new Client(IS_LITE ? liteOptions : fullOptions);

client.commands = new Collection();

async function loadCommands() {
  const dir = join(__dirname, 'commands');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && isCommandFileEnabled(f))) {
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
