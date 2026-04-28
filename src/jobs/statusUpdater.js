import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { fetchServerStatus } from '../lib/mcStatus.js';

export function formatStatusName(status) {
  if (!status.online) return '🔴・Hors ligne';
  return `🟢・${status.players.online}/${status.players.max} joueurs`;
}

export function startStatusUpdater(client) {
  // Discord rate-limits voice channel renames to 2 per 10 min, so 5 min minimum
  const interval = Math.max(5, Number(process.env.STATUS_UPDATE_INTERVAL_MINUTES ?? 5));
  const expr = `*/${interval} * * * *`;

  cron.schedule(expr, () => runOnce(client).catch((e) => console.error('statusUpdater:', e)));
  runOnce(client).catch((e) => console.error('statusUpdater (initial):', e));
  console.log(`Status updater démarré (toutes les ${interval} min)`);
}

async function runOnce(client) {
  const configs = await prisma.guildConfig.findMany({
    where: { statusChannelId: { not: null } },
  });
  if (configs.length === 0) return;

  const status = await fetchServerStatus();
  const newName = formatStatusName(status);

  for (const cfg of configs) {
    try {
      const channel = await client.channels.fetch(cfg.statusChannelId).catch(() => null);
      if (!channel) continue;
      if (channel.name === newName) continue;
      await channel.setName(newName, 'TWOTT status updater');
    } catch (err) {
      console.warn(`statusUpdater ${cfg.guildId}:`, err.message);
    }
  }
}
