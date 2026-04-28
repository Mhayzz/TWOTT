import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import prisma from '../lib/prisma.js';
import { baseEmbed, infoEmbed, COLORS } from '../lib/embeds.js';
import { formatDuration, getActiveSession } from '../voice/tracker.js';

const PERIODS = {
  '7d': 7 * 86400,
  '30d': 30 * 86400,
  all: null,
};

function periodSince(period) {
  const sec = PERIODS[period];
  return sec ? new Date(Date.now() - sec * 1000) : null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Statistiques d\'activité vocale')
    .addSubcommand((s) =>
      s
        .setName('stats')
        .setDescription('Voir les stats vocales d\'un membre')
        .addUserOption((o) => o.setName('membre').setDescription('Membre (toi par défaut)').setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName('top')
        .setDescription('Classement des plus actifs en vocal')
        .addStringOption((o) =>
          o
            .setName('periode')
            .setDescription('Période')
            .addChoices(
              { name: '7 jours', value: '7d' },
              { name: '30 jours', value: '30d' },
              { name: 'Tout le temps', value: 'all' },
            )
            .setRequired(false),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'stats') return doStats(interaction);
    if (sub === 'top') return doTop(interaction);
  },
};

async function doStats(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser('membre') ?? interaction.user;

  const totalsByPeriod = {};
  for (const period of ['7d', '30d', 'all']) {
    const since = periodSince(period);
    const where = { guildId: interaction.guildId, userId: target.id };
    if (since) where.leftAt = { gte: since };
    const agg = await prisma.voiceSession.aggregate({
      where,
      _sum: { durationSec: true },
      _count: true,
    });
    totalsByPeriod[period] = {
      seconds: agg._sum.durationSec ?? 0,
      sessions: agg._count,
    };
  }

  // Active session?
  const active = getActiveSession(interaction.guildId, target.id);
  const activeSeconds = active ? Math.floor((Date.now() - active.joinedAt) / 1000) : 0;

  const embed = baseEmbed(COLORS.PRIMARY)
    .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
    .setTitle('🎙️ Stats vocales')
    .addFields(
      { name: '7 jours', value: `${formatDuration(totalsByPeriod['7d'].seconds)} (${totalsByPeriod['7d'].sessions} sessions)`, inline: true },
      { name: '30 jours', value: `${formatDuration(totalsByPeriod['30d'].seconds)} (${totalsByPeriod['30d'].sessions} sessions)`, inline: true },
      { name: 'Total', value: `${formatDuration(totalsByPeriod.all.seconds)} (${totalsByPeriod.all.sessions} sessions)`, inline: true },
    );

  if (activeSeconds > 0) {
    embed.addFields({ name: '🔴 En vocal actuellement', value: formatDuration(activeSeconds), inline: false });
  }

  await interaction.editReply({ embeds: [embed] });
}

const RANK_PREFIX = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

function progressBar(value, max, length = 18) {
  if (max <= 0) return '░'.repeat(length);
  const filled = Math.max(1, Math.round((value / max) * length));
  return '█'.repeat(Math.min(filled, length)) + '░'.repeat(Math.max(0, length - filled));
}

async function doTop(interaction) {
  await interaction.deferReply();
  const period = interaction.options.getString('periode') ?? 'all';
  const since = periodSince(period);

  const where = { guildId: interaction.guildId };
  if (since) where.leftAt = { gte: since };

  const top = await prisma.voiceSession.groupBy({
    by: ['userId'],
    where,
    _sum: { durationSec: true },
    orderBy: { _sum: { durationSec: 'desc' } },
    take: 10,
  });

  if (top.length === 0) {
    await interaction.editReply({
      embeds: [infoEmbed('Aucune donnée', 'Personne n\'a encore été tracké en vocal sur cette période.')],
    });
    return;
  }

  const totalAgg = await prisma.voiceSession.aggregate({
    where,
    _sum: { durationSec: true },
  });
  const distinctUsers = await prisma.voiceSession.findMany({
    where,
    select: { userId: true },
    distinct: ['userId'],
  });

  const periodLabel = { '7d': '7 derniers jours', '30d': '30 derniers jours', all: 'Tout le temps' }[period] ?? period;
  const maxSec = top[0]._sum.durationSec ?? 1;

  const lines = top.map((row, i) => {
    const seconds = row._sum.durationSec ?? 0;
    const bar = progressBar(seconds, maxSec);
    const pct = Math.round((seconds / maxSec) * 100);
    return `${RANK_PREFIX[i]} <@${row.userId}>\n\`${bar}\` **${formatDuration(seconds)}** · ${pct}%`;
  });

  const embed = baseEmbed(COLORS.PRIMARY)
    .setTitle('🏆 Top Vocal — The Wolves Of The Trinity')
    .setDescription([`**Période :** ${periodLabel}`, '', lines.join('\n\n')].join('\n'))
    .addFields(
      { name: '⏱️ Temps total guilde', value: formatDuration(totalAgg._sum.durationSec ?? 0), inline: true },
      { name: '👥 Membres trackés', value: String(distinctUsers.length), inline: true },
    )
    .setFooter({ text: 'TWOTT • Voice Tracker' });

  await interaction.editReply({ embeds: [embed] });
}
