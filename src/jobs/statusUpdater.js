import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { fetchServerStatus, buildStatusEmbed } from '../lib/mcStatus.js';

export function startStatusUpdater(client) {
  const interval = Math.max(1, Number(process.env.STATUS_UPDATE_INTERVAL_MINUTES ?? 5));
  // Cron: every N minutes
  const expr = `*/${interval} * * * *`;

  cron.schedule(expr, () => runOnce(client).catch((e) => console.error('statusUpdater:', e)));
  // Also run once at startup
  runOnce(client).catch((e) => console.error('statusUpdater (initial):', e));
  console.log(`Status updater démarré (toutes les ${interval} min)`);
}

async function runOnce(client) {
  const configs = await prisma.guildConfig.findMany({
    where: { statusChannelId: { not: null }, statusMessageId: { not: null } },
  });
  if (configs.length === 0) return;

  const status = await fetchServerStatus();
  const embed = buildStatusEmbed(status);

  for (const cfg of configs) {
    try {
      const channel = await client.channels.fetch(cfg.statusChannelId).catch(() => null);
      if (!channel) continue;
      const msg = await channel.messages.fetch(cfg.statusMessageId).catch(() => null);
      if (msg) {
        await msg.edit({ embeds: [embed] });
      } else {
        const sent = await channel.send({ embeds: [embed] });
        await prisma.guildConfig.update({
          where: { guildId: cfg.guildId },
          data: { statusMessageId: sent.id },
        });
      }
    } catch (err) {
      console.warn(`statusUpdater ${cfg.guildId}:`, err.message);
    }
  }
}
