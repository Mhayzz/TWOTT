import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { buildLeaderboardEmbed } from '../voice/leaderboard.js';

const CHANNEL_ID = process.env.VOICE_LEADERBOARD_CHANNEL_ID ?? null;
const PERIOD = process.env.VOICE_LEADERBOARD_PERIOD ?? 'all';

export function startVoiceLeaderboard(client) {
  if (!CHANNEL_ID) {
    console.log('Voice leaderboard désactivé (VOICE_LEADERBOARD_CHANNEL_ID non défini)');
    return;
  }
  const interval = Math.max(1, Number(process.env.VOICE_LEADERBOARD_UPDATE_INTERVAL_MINUTES ?? 30));
  const expr = `*/${interval} * * * *`;

  cron.schedule(expr, () => runOnce(client).catch((e) => console.error('voiceLeaderboard:', e)));
  runOnce(client).catch((e) => console.error('voiceLeaderboard (initial):', e));
  console.log(`Voice leaderboard démarré (toutes les ${interval} min, période ${PERIOD})`);
}

async function runOnce(client) {
  const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.warn(`Salon leaderboard introuvable: ${CHANNEL_ID}`);
    return;
  }

  const guildId = channel.guild.id;
  const embed = await buildLeaderboardEmbed(guildId, PERIOD);

  const config = await prisma.guildConfig.findUnique({ where: { guildId } });
  let message = null;
  if (config?.voiceLeaderboardMessageId) {
    message = await channel.messages.fetch(config.voiceLeaderboardMessageId).catch(() => null);
  }

  if (message) {
    await message.edit({ embeds: [embed] });
  } else {
    const sent = await channel.send({ embeds: [embed] });
    await prisma.guildConfig.upsert({
      where: { guildId },
      create: { guildId, voiceLeaderboardMessageId: sent.id },
      update: { voiceLeaderboardMessageId: sent.id },
    });
  }
}
