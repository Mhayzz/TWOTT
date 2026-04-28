import prisma from '../lib/prisma.js';
import { baseEmbed, COLORS } from '../lib/embeds.js';
import { formatDuration } from './tracker.js';

const RANK_PREFIX = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const PERIODS = {
  '7d': 7 * 86400,
  '30d': 30 * 86400,
  all: null,
};

const PERIOD_LABELS = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  all: 'Tout le temps',
};

function progressBar(value, max, length = 18) {
  if (max <= 0) return '░'.repeat(length);
  const filled = Math.max(1, Math.round((value / max) * length));
  return '█'.repeat(Math.min(filled, length)) + '░'.repeat(Math.max(0, length - filled));
}

export async function buildLeaderboardEmbed(guildId, period = 'all') {
  const sec = PERIODS[period];
  const since = sec ? new Date(Date.now() - sec * 1000) : null;

  const where = { guildId };
  if (since) where.leftAt = { gte: since };

  const top = await prisma.voiceSession.groupBy({
    by: ['userId'],
    where,
    _sum: { durationSec: true },
    orderBy: { _sum: { durationSec: 'desc' } },
    take: 10,
  });

  const totalAgg = await prisma.voiceSession.aggregate({
    where,
    _sum: { durationSec: true },
  });
  const distinctUsers = await prisma.voiceSession.findMany({
    where,
    select: { userId: true },
    distinct: ['userId'],
  });

  const periodLabel = PERIOD_LABELS[period] ?? period;
  const lines = [`**Période :** ${periodLabel}`, ''];

  if (top.length === 0) {
    lines.push('*Aucune donnée pour cette période — aucun membre n\'a encore été tracké en vocal.*');
  } else {
    const maxSec = top[0]._sum.durationSec ?? 1;
    const entries = top.map((row, i) => {
      const seconds = row._sum.durationSec ?? 0;
      const bar = progressBar(seconds, maxSec);
      const pct = Math.round((seconds / maxSec) * 100);
      return `${RANK_PREFIX[i]} <@${row.userId}>\n\`${bar}\` **${formatDuration(seconds)}** · ${pct}%`;
    });
    lines.push(entries.join('\n\n'));
  }

  return baseEmbed(COLORS.PRIMARY)
    .setTitle('🏆 Top Vocal — The Wolves Of The Trinity')
    .setDescription(lines.join('\n'))
    .addFields(
      { name: '⏱️ Temps total guilde', value: formatDuration(totalAgg._sum.durationSec ?? 0), inline: true },
      { name: '👥 Membres trackés', value: String(distinctUsers.length), inline: true },
      { name: '🔄 Mis à jour', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: 'TWOTT • Voice Tracker' });
}
