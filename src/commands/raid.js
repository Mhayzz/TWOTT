import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import prisma from '../lib/prisma.js';
import { baseEmbed, successEmbed, errorEmbed, COLORS } from '../lib/embeds.js';

const STATUS = {
  PRESENT: { label: 'Présent', emoji: '✅', color: COLORS.SUCCESS },
  MAYBE:   { label: 'Peut-être', emoji: '❔', color: COLORS.WARNING },
  ABSENT:  { label: 'Absent', emoji: '❌', color: COLORS.DANGER },
};

export default {
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Gestion des raids de guilde')
    .addSubcommand((s) =>
      s
        .setName('create')
        .setDescription('Planifier un nouveau raid')
        .addStringOption((o) => o.setName('nom').setDescription('Nom du raid (ex: Floor 1 Boss)').setRequired(true).setMaxLength(80))
        .addStringOption((o) =>
          o
            .setName('quand')
            .setDescription('Date et heure (format: 2026-04-28 21:00 ou 28/04 21:00)')
            .setRequired(true),
        )
        .addStringOption((o) => o.setName('lieu').setDescription('Lieu / étage').setRequired(false).setMaxLength(80))
        .addIntegerOption((o) => o.setName('places').setDescription('Nombre max de joueurs').setMinValue(1).setMaxValue(50))
        .addStringOption((o) => o.setName('description').setDescription('Briefing / objectifs').setMaxLength(500)),
    )
    .addSubcommand((s) =>
      s
        .setName('cancel')
        .setDescription('Annuler un raid')
        .addStringOption((o) => o.setName('id').setDescription('ID du raid').setRequired(true)),
    )
    .addSubcommand((s) => s.setName('list').setDescription('Lister les raids à venir'))
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create') return createRaid(interaction);
    if (sub === 'cancel') return cancelRaid(interaction);
    if (sub === 'list') return listRaids(interaction);
  },
};

async function createRaid(interaction) {
  const name = interaction.options.getString('nom', true);
  const whenRaw = interaction.options.getString('quand', true);
  const location = interaction.options.getString('lieu');
  const maxPlayers = interaction.options.getInteger('places');
  const description = interaction.options.getString('description');

  const scheduledAt = parseDate(whenRaw);
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    await interaction.reply({
      embeds: [errorEmbed('Date invalide', 'Formats acceptés: `2026-04-28 21:00`, `28/04 21:00`, `28/04/2026 21:00`')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  if (scheduledAt.getTime() < Date.now()) {
    await interaction.reply({
      embeds: [errorEmbed('Date dans le passé', 'Choisis une date future.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply();

  const raid = await prisma.raid.create({
    data: {
      name,
      description,
      location,
      scheduledAt,
      maxPlayers,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      createdById: interaction.user.id,
    },
  });

  const message = await interaction.editReply({
    embeds: [await renderRaidEmbed(raid.id)],
    components: buildButtons(raid.id),
  });

  await prisma.raid.update({ where: { id: raid.id }, data: { messageId: message.id } });
}

async function cancelRaid(interaction) {
  const id = interaction.options.getString('id', true);
  const raid = await prisma.raid.findUnique({ where: { id } });
  if (!raid || raid.guildId !== interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed('Introuvable', 'Aucun raid avec cet ID.')], flags: MessageFlags.Ephemeral });
    return;
  }
  if (raid.createdById !== interaction.user.id && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageEvents)) {
    await interaction.reply({
      embeds: [errorEmbed('Permission refusée', 'Seul l\'organisateur ou un modérateur peut annuler ce raid.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await prisma.raid.update({ where: { id }, data: { cancelled: true } });
  await updateRaidMessage(interaction.client, id).catch(() => {});

  await interaction.reply({ embeds: [successEmbed('Raid annulé', `**${raid.name}** a été annulé.`)] });
}

async function listRaids(interaction) {
  const raids = await prisma.raid.findMany({
    where: { guildId: interaction.guildId, cancelled: false, scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: 'asc' },
    take: 10,
    include: { participants: true },
  });

  if (raids.length === 0) {
    await interaction.reply({ embeds: [baseEmbed(COLORS.INFO).setTitle('Aucun raid à venir').setDescription('Utilise `/raid create` pour en planifier un.')] });
    return;
  }

  const lines = raids.map((r) => {
    const ts = Math.floor(r.scheduledAt.getTime() / 1000);
    const present = r.participants.filter((p) => p.status === 'PRESENT').length;
    const cap = r.maxPlayers ? `/${r.maxPlayers}` : '';
    return `• **${r.name}** — <t:${ts}:F> (<t:${ts}:R>) — ${present}${cap} ✅\n  \`${r.id}\``;
  });

  await interaction.reply({
    embeds: [baseEmbed(COLORS.PRIMARY).setTitle('📜 Raids à venir').setDescription(lines.join('\n\n'))],
  });
}

export async function handleRaidButton(interaction) {
  const [, action, raidId] = interaction.customId.split(':');
  const raid = await prisma.raid.findUnique({ where: { id: raidId } });
  if (!raid || raid.cancelled) {
    await interaction.reply({ embeds: [errorEmbed('Raid introuvable', 'Ce raid n\'existe plus.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const member = await prisma.member.findUnique({ where: { discordId: interaction.user.id } });
  if (!member) {
    await interaction.reply({
      embeds: [errorEmbed('Inscription requise', 'Utilise `/inscription` avant de t\'inscrire à un raid.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const newStatus = action.toUpperCase();
  if (!['PRESENT', 'MAYBE', 'ABSENT'].includes(newStatus)) return;

  if (newStatus === 'PRESENT' && raid.maxPlayers) {
    const presentCount = await prisma.raidParticipant.count({
      where: { raidId, status: 'PRESENT', NOT: { memberId: member.id } },
    });
    if (presentCount >= raid.maxPlayers) {
      await interaction.reply({
        embeds: [errorEmbed('Raid complet', `Ce raid a atteint sa capacité (${raid.maxPlayers}).`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  await prisma.raidParticipant.upsert({
    where: { raidId_memberId: { raidId, memberId: member.id } },
    update: { status: newStatus },
    create: { raidId, memberId: member.id, status: newStatus },
  });

  await interaction.update({ embeds: [await renderRaidEmbed(raidId)], components: buildButtons(raidId) });
}

export async function renderRaidEmbed(raidId) {
  const raid = await prisma.raid.findUnique({
    where: { id: raidId },
    include: { participants: { include: { member: true } } },
  });
  const ts = Math.floor(raid.scheduledAt.getTime() / 1000);

  const groups = { PRESENT: [], MAYBE: [], ABSENT: [] };
  for (const p of raid.participants) {
    groups[p.status]?.push(`<@${p.member.discordId}>`);
  }

  const cap = raid.maxPlayers ? `/${raid.maxPlayers}` : '';

  const embed = baseEmbed(raid.cancelled ? COLORS.DANGER : COLORS.PRIMARY)
    .setTitle((raid.cancelled ? '❌ ANNULÉ — ' : '⚔️ ') + raid.name)
    .setDescription(raid.description ?? '*Aucune description.*')
    .addFields(
      { name: 'Quand', value: `<t:${ts}:F> (<t:${ts}:R>)`, inline: false },
      ...(raid.location ? [{ name: 'Lieu', value: raid.location, inline: true }] : []),
      { name: `${STATUS.PRESENT.emoji} Présents (${groups.PRESENT.length}${cap})`, value: groups.PRESENT.join(', ') || '—', inline: false },
      { name: `${STATUS.MAYBE.emoji} Peut-être (${groups.MAYBE.length})`, value: groups.MAYBE.join(', ') || '—', inline: false },
      { name: `${STATUS.ABSENT.emoji} Absents (${groups.ABSENT.length})`, value: groups.ABSENT.join(', ') || '—', inline: false },
      { name: 'ID', value: '`' + raid.id + '`', inline: true },
      { name: 'Organisateur', value: `<@${raid.createdById}>`, inline: true },
    );

  return embed;
}

function buildButtons(raidId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`raid:present:${raidId}`).setLabel('Présent').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`raid:maybe:${raidId}`).setLabel('Peut-être').setEmoji('❔').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`raid:absent:${raidId}`).setLabel('Absent').setEmoji('❌').setStyle(ButtonStyle.Danger),
  );
  return [row];
}

export async function updateRaidMessage(client, raidId) {
  const raid = await prisma.raid.findUnique({ where: { id: raidId } });
  if (!raid?.messageId) return;
  const channel = await client.channels.fetch(raid.channelId).catch(() => null);
  if (!channel) return;
  const msg = await channel.messages.fetch(raid.messageId).catch(() => null);
  if (!msg) return;
  await msg.edit({
    embeds: [await renderRaidEmbed(raidId)],
    components: raid.cancelled ? [] : buildButtons(raidId),
  });
}

function parseDate(input) {
  const s = input.trim();
  // ISO-ish: 2026-04-28 21:00 or 2026-04-28T21:00
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // 28/04/2026 21:00
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
  // 28/04 21:00 (current year)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  if (m) {
    const now = new Date();
    const candidate = new Date(now.getFullYear(), +m[2] - 1, +m[1], +m[3], +m[4]);
    if (candidate.getTime() < Date.now()) candidate.setFullYear(candidate.getFullYear() + 1);
    return candidate;
  }
  return null;
}
