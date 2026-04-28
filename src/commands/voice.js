import { SlashCommandBuilder } from 'discord.js';
import prisma from '../lib/prisma.js';
import { baseEmbed, COLORS } from '../lib/embeds.js';
import { formatDuration, getActiveSession } from '../voice/tracker.js';
import { buildLeaderboardEmbed } from '../voice/leaderboard.js';

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

async function doTop(interaction) {
  await interaction.deferReply();
  const period = interaction.options.getString('periode') ?? 'all';
  const embed = await buildLeaderboardEmbed(interaction.guildId, period);
  await interaction.editReply({ embeds: [embed] });
}
