import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import prisma from '../lib/prisma.js';
import { buildPanelEmbed, buildPanelButtons } from '../tickets/panel.js';
import { baseEmbed, successEmbed, errorEmbed, COLORS } from '../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Système de candidature TWOTT')
    .addSubcommand((s) =>
      s
        .setName('panel')
        .setDescription('Poster le panneau de candidature dans un salon')
        .addChannelOption((o) =>
          o.setName('salon').setDescription('Salon où poster (par défaut : salon courant)').addChannelTypes(ChannelType.GuildText).setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('config')
        .setDescription('Configurer le système de tickets')
        .addRoleOption((o) => o.setName('staff_role').setDescription('Rôle staff qui voit/gère les tickets').setRequired(false))
        .addChannelOption((o) =>
          o.setName('category').setDescription('Catégorie où créer les tickets').addChannelTypes(ChannelType.GuildCategory).setRequired(false),
        )
        .addChannelOption((o) =>
          o.setName('log_channel').setDescription('Salon des logs de décisions').addChannelTypes(ChannelType.GuildText).setRequired(false),
        )
        .addRoleOption((o) => o.setName('accept_role').setDescription('Rôle attribué auto à l\'acceptation (ex: @Recrue)').setRequired(false)),
    )
    .addSubcommand((s) => s.setName('viewconfig').setDescription('Voir la configuration actuelle'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'panel') return doPanel(interaction);
    if (sub === 'config') return doConfig(interaction);
    if (sub === 'viewconfig') return doViewConfig(interaction);
  },
};

async function doPanel(interaction) {
  const channel = interaction.options.getChannel('salon') ?? interaction.channel;
  if (!channel.permissionsFor(interaction.guild.members.me)?.has(['SendMessages', 'EmbedLinks'])) {
    await interaction.reply({
      embeds: [errorEmbed('Permissions manquantes', `Le bot ne peut pas écrire dans ${channel}.`)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await channel.send({ embeds: [buildPanelEmbed()], components: buildPanelButtons() });
  await interaction.reply({
    embeds: [successEmbed('Panel posté', `Le bouton de candidature est en place dans ${channel}.`)],
    flags: MessageFlags.Ephemeral,
  });
}

async function doConfig(interaction) {
  const staffRole = interaction.options.getRole('staff_role');
  const category = interaction.options.getChannel('category');
  const logChannel = interaction.options.getChannel('log_channel');
  const acceptRole = interaction.options.getRole('accept_role');

  if (!staffRole && !category && !logChannel && !acceptRole) {
    await interaction.reply({
      embeds: [errorEmbed('Aucun changement', 'Précise au moins un paramètre à modifier.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const data = {};
  if (staffRole) data.ticketStaffRoleId = staffRole.id;
  if (category) data.ticketCategoryId = category.id;
  if (logChannel) data.ticketLogChannelId = logChannel.id;
  if (acceptRole) data.ticketAcceptRoleId = acceptRole.id;

  await prisma.guildConfig.upsert({
    where: { guildId: interaction.guildId },
    create: { guildId: interaction.guildId, ...data },
    update: data,
  });

  const lines = [];
  if (staffRole) lines.push(`• Rôle staff → ${staffRole}`);
  if (category) lines.push(`• Catégorie → ${category}`);
  if (logChannel) lines.push(`• Salon de logs → ${logChannel}`);
  if (acceptRole) {
    const botTop = interaction.guild.members.me.roles.highest;
    let warn = '';
    if (botTop.comparePositionTo(acceptRole) <= 0) warn = '\n  ⚠️ Ce rôle est au-dessus du bot — déplace le rôle du bot plus haut.';
    lines.push(`• Rôle attribué à l'acceptation → ${acceptRole}${warn}`);
  }

  await interaction.reply({
    embeds: [successEmbed('Configuration mise à jour', lines.join('\n'))],
    flags: MessageFlags.Ephemeral,
  });
}

async function doViewConfig(interaction) {
  const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });

  const fmt = (v, fmt) => (v ? fmt(v) : '*non configuré*');

  const lines = [
    `**Rôle staff** : ${fmt(config?.ticketStaffRoleId, (id) => `<@&${id}>`)}`,
    `**Catégorie** : ${fmt(config?.ticketCategoryId, (id) => `<#${id}>`)}`,
    `**Salon de logs** : ${fmt(config?.ticketLogChannelId, (id) => `<#${id}>`)}`,
    `**Rôle à l'acceptation** : ${fmt(config?.ticketAcceptRoleId, (id) => `<@&${id}>`)}`,
    '',
    `**Tickets créés** : ${config?.ticketCounter ?? 0}`,
  ];

  await interaction.reply({
    embeds: [baseEmbed(COLORS.PRIMARY).setTitle('🎫 Configuration tickets').setDescription(lines.join('\n'))],
    flags: MessageFlags.Ephemeral,
  });
}
