import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  PermissionsBitField,
  MessageFlags,
} from 'discord.js';
import prisma from '../lib/prisma.js';
import { baseEmbed, successEmbed, errorEmbed, infoEmbed, COLORS } from '../lib/embeds.js';

const EPHEMERAL = { flags: MessageFlags.Ephemeral };
const DELETE_DELAY_MS = 5000;

/**
 * Merge DB config with environment-variable fallbacks so the bot can be
 * fully configured via Railway env vars without running /ticket config.
 */
function resolveConfig(config) {
  const primaryAccept = config?.ticketAcceptRoleId ?? process.env.TICKET_ACCEPT_ROLE_ID ?? null;
  const secondaryAccept = process.env.TICKET_ACCEPT_ROLE_ID_2 ?? null;
  const acceptRoleIds = [primaryAccept, secondaryAccept].filter(Boolean);

  return {
    ticketCategoryId: config?.ticketCategoryId ?? process.env.TICKET_CATEGORY_ID ?? null,
    ticketStaffRoleId: config?.ticketStaffRoleId ?? process.env.TICKET_STAFF_ROLE_ID ?? null,
    ticketLogChannelId: config?.ticketLogChannelId ?? process.env.TICKET_LOG_CHANNEL_ID ?? null,
    ticketAcceptRoleId: primaryAccept,
    ticketAcceptRoleIds: acceptRoleIds,
  };
}

export async function handleTicketInteraction(interaction) {
  const id = interaction.customId;

  if (interaction.isButton()) {
    if (id === 'ticket:open') return openApplicationModal(interaction);
    if (id.startsWith('ticket:accept:')) return startAccept(interaction, id.split(':')[2]);
    if (id.startsWith('ticket:reject:')) return openRejectModal(interaction, id.split(':')[2]);
    if (id.startsWith('ticket:close:confirm:')) return doClose(interaction, id.split(':')[3]);
    if (id.startsWith('ticket:close:cancel')) {
      return interaction.update({ embeds: [infoEmbed('Annulé', 'Le ticket reste ouvert.')], components: [] });
    }
    if (id.startsWith('ticket:close:')) return askCloseConfirm(interaction, id.split(':')[2]);
  }

  if (interaction.isModalSubmit()) {
    if (id === 'ticket:modal:open') return submitApplication(interaction);
    if (id.startsWith('ticket:modal:reject:')) return submitReject(interaction, id.split(':')[3]);
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Open ticket flow
// ────────────────────────────────────────────────────────────────────────────────

async function openApplicationModal(interaction) {
  // Anti-spam: check existing OPEN ticket
  const existing = await prisma.ticket.findFirst({
    where: { guildId: interaction.guildId, applicantId: interaction.user.id, status: 'OPEN' },
  });
  if (existing) {
    const channel = await interaction.guild.channels.fetch(existing.channelId).catch(() => null);
    await interaction.reply({
      embeds: [
        infoEmbed(
          'Tu as déjà une candidature en cours',
          channel ? `Rends-toi dans ${channel} pour suivre son avancement.` : `Une candidature est déjà ouverte (#${existing.number}).`,
        ),
      ],
      ...EPHEMERAL,
    });
    return;
  }

  const modal = new ModalBuilder().setCustomId('ticket:modal:open').setTitle('Candidature TWOTT');

  const pseudo = new TextInputBuilder()
    .setCustomId('mc_username')
    .setLabel('Pseudo Minecraft')
    .setPlaceholder('Ex: Kirito')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(32);

  const age = new TextInputBuilder()
    .setCustomId('age')
    .setLabel('Âge (optionnel)')
    .setPlaceholder('Ex: 20')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(10);

  const saoLevel = new TextInputBuilder()
    .setCustomId('sao_level')
    .setLabel('Niveau actuel sur SAO Chronicles')
    .setPlaceholder('Ex: niveau 12, étage 3, ou "je débute"')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(100);

  const motivation = new TextInputBuilder()
    .setCustomId('motivation')
    .setLabel('Pourquoi rejoindre TWOTT ?')
    .setPlaceholder('Décris ta motivation, ce que tu cherches dans une guilde…')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(20)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(pseudo),
    new ActionRowBuilder().addComponents(age),
    new ActionRowBuilder().addComponents(saoLevel),
    new ActionRowBuilder().addComponents(motivation),
  );

  await interaction.showModal(modal);
}

async function submitApplication(interaction) {
  await interaction.deferReply(EPHEMERAL);

  // Re-check anti-spam in case of race
  const existing = await prisma.ticket.findFirst({
    where: { guildId: interaction.guildId, applicantId: interaction.user.id, status: 'OPEN' },
  });
  if (existing) {
    await interaction.editReply({
      embeds: [errorEmbed('Candidature déjà en cours', 'Ferme ta candidature actuelle avant d\'en ouvrir une nouvelle.')],
    });
    return;
  }

  const dbConfig = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
  const config = resolveConfig(dbConfig);
  if (!config.ticketStaffRoleId) {
    await interaction.editReply({
      embeds: [errorEmbed('Système non configuré', 'Aucun rôle staff défini. Utilise `/ticket config staff_role:@…` ou définis `TICKET_STAFF_ROLE_ID` dans Railway.')],
    });
    return;
  }

  const mcUsername = interaction.fields.getTextInputValue('mc_username').trim();
  const age = interaction.fields.getTextInputValue('age').trim() || null;
  const saoLevel = interaction.fields.getTextInputValue('sao_level').trim() || null;
  const motivation = interaction.fields.getTextInputValue('motivation').trim();

  if (!/^[A-Za-z0-9_]{3,16}$/.test(mcUsername)) {
    await interaction.editReply({
      embeds: [errorEmbed('Pseudo Minecraft invalide', '3 à 16 caractères, lettres / chiffres / `_` uniquement.')],
    });
    return;
  }

  // Atomically increment ticket counter (upsert in case no /ticket config was run)
  const updatedConfig = await prisma.guildConfig.upsert({
    where: { guildId: interaction.guildId },
    create: { guildId: interaction.guildId, ticketCounter: 1 },
    update: { ticketCounter: { increment: 1 } },
  });
  const number = updatedConfig.ticketCounter;

  // Create the channel
  const channelName = `ticket-${number.toString().padStart(4, '0')}-${mcUsername}`.toLowerCase().slice(0, 100);

  const overwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: interaction.guild.members.me.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    },
    {
      id: config.ticketStaffRoleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    },
  ];

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId ?? undefined,
    permissionOverwrites: overwrites,
    reason: `Candidature TWOTT #${number} de ${interaction.user.tag}`,
  }).catch((err) => {
    console.error('Ticket channel creation failed:', err);
    return null;
  });

  if (!channel) {
    await interaction.editReply({
      embeds: [errorEmbed('Création échouée', 'Impossible de créer le salon. Vérifie que le bot a la permission **Gérer les salons** et que la catégorie configurée est valide.')],
    });
    return;
  }

  const ticket = await prisma.ticket.create({
    data: {
      number,
      guildId: interaction.guildId,
      channelId: channel.id,
      applicantId: interaction.user.id,
      mcUsername,
      age,
      saoLevel,
      motivation,
    },
  });

  // Welcome embed in the new channel
  const embed = baseEmbed(COLORS.PRIMARY)
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .setTitle(`📩 Candidature #${number.toString().padStart(4, '0')}`)
    .setDescription(`<@${interaction.user.id}> a soumis une candidature.`)
    .addFields(
      { name: 'Pseudo Minecraft', value: '`' + mcUsername + '`', inline: true },
      { name: 'Âge', value: age ?? '—', inline: true },
      { name: 'Niveau SAO Chronicles', value: saoLevel ?? '—', inline: true },
      { name: 'Motivation', value: motivation },
    );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket:accept:${ticket.id}`).setLabel('Accepter').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`ticket:reject:${ticket.id}`).setLabel('Refuser').setEmoji('❌').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket:close:${ticket.id}`).setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
  );

  await channel.send({
    content: `<@${interaction.user.id}> • <@&${config.ticketStaffRoleId}>`,
    embeds: [embed],
    components: [buttons],
    allowedMentions: { users: [interaction.user.id], roles: [config.ticketStaffRoleId] },
  });

  await interaction.editReply({
    embeds: [
      successEmbed(
        '✅ Candidature envoyée',
        `Ton dossier a été transmis au staff. Suis la suite dans ${channel}.`,
      ),
    ],
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Staff actions
// ────────────────────────────────────────────────────────────────────────────────

async function ensureStaff(interaction, ticket) {
  const dbConfig = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
  const config = resolveConfig(dbConfig);
  const isStaff =
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
    (config.ticketStaffRoleId && interaction.member?.roles?.cache?.has(config.ticketStaffRoleId));
  if (!isStaff) {
    await interaction.reply({
      embeds: [errorEmbed('Permission refusée', 'Seul le staff peut traiter cette candidature.')],
      ...EPHEMERAL,
    });
    return null;
  }
  return config;
}

async function startAccept(interaction, ticketId) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== 'OPEN') {
    await interaction.reply({ embeds: [errorEmbed('Ticket fermé', 'Cette candidature a déjà été traitée.')], ...EPHEMERAL });
    return;
  }
  const config = await ensureStaff(interaction, ticket);
  if (!config) return;

  await interaction.deferUpdate();

  // Update ticket
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'ACCEPTED', closedAt: new Date(), closedById: interaction.user.id },
  });

  // Assign roles (primary + optional secondary)
  const warnings = [];
  if (config.ticketAcceptRoleIds.length > 0) {
    const member = await interaction.guild.members.fetch(ticket.applicantId).catch(() => null);
    if (!member) {
      warnings.push('Membre introuvable sur le serveur.');
    } else {
      const botTop = interaction.guild.members.me.roles.highest;
      const rolesToAdd = [];
      for (const roleId of config.ticketAcceptRoleIds) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
          warnings.push(`Rôle \`${roleId}\` introuvable.`);
          continue;
        }
        if (role.managed) {
          warnings.push(`${role} est géré par une intégration externe.`);
          continue;
        }
        if (botTop.comparePositionTo(role) <= 0) {
          warnings.push(`${role} est au-dessus du bot — attribution impossible.`);
          continue;
        }
        rolesToAdd.push(role);
      }
      if (rolesToAdd.length > 0) {
        await member.roles.add(rolesToAdd, 'Candidature acceptée').catch((e) =>
          warnings.push(`Échec attribution rôles : ${e.message}`),
        );
      }
    }
  }

  // DM the applicant
  let dmSent = true;
  try {
    const user = await interaction.client.users.fetch(ticket.applicantId);
    await user.send({
      embeds: [
        baseEmbed(COLORS.SUCCESS)
          .setTitle('🐺 Candidature acceptée — TWOTT')
          .setDescription(
            `Félicitations <@${ticket.applicantId}> ! Ton dossier a été **accepté** par le staff de **The Wolves Of The Trinity**.\n\n` +
              `Connecte-toi sur **${process.env.MC_SERVER_HOST ?? 'play.saochronicles.fr'}** et rejoins-nous en jeu.`,
          ),
      ],
    });
  } catch {
    dmSent = false;
  }

  await postLog(interaction, ticket, 'ACCEPTED', null, warnings, dmSent);

  // Disable buttons
  await interaction.editReply({
    components: [],
    embeds: [
      ...interaction.message.embeds,
      baseEmbed(COLORS.SUCCESS)
        .setTitle('✅ Candidature acceptée')
        .setDescription(
          `Décision prise par <@${interaction.user.id}>.\n` +
            (dmSent ? '📨 MP envoyé au candidat.\n' : '⚠️ Impossible d\'envoyer un MP au candidat.\n') +
            (warnings.length ? `\n${warnings.map((w) => '⚠️ ' + w).join('\n')}\n` : '') +
            `\nCe salon sera supprimé dans ${DELETE_DELAY_MS / 1000}s.`,
        ),
    ],
  });

  await scheduleDelete(interaction.channel, ticketId);
}

async function openRejectModal(interaction, ticketId) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== 'OPEN') {
    await interaction.reply({ embeds: [errorEmbed('Ticket fermé', 'Cette candidature a déjà été traitée.')], ...EPHEMERAL });
    return;
  }
  const config = await ensureStaff(interaction, ticket);
  if (!config) return;

  const modal = new ModalBuilder()
    .setCustomId(`ticket:modal:reject:${ticketId}`)
    .setTitle('Refuser la candidature');
  const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('Raison du refus (envoyée au candidat)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(5)
    .setMaxLength(1000);
  modal.addComponents(new ActionRowBuilder().addComponents(reason));
  await interaction.showModal(modal);
}

async function submitReject(interaction, ticketId) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== 'OPEN') {
    await interaction.reply({ embeds: [errorEmbed('Ticket fermé', 'Cette candidature a déjà été traitée.')], ...EPHEMERAL });
    return;
  }

  await interaction.deferReply();

  const reason = interaction.fields.getTextInputValue('reason').trim();

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'REJECTED', closedAt: new Date(), closedById: interaction.user.id, decisionReason: reason },
  });

  let dmSent = true;
  try {
    const user = await interaction.client.users.fetch(ticket.applicantId);
    await user.send({
      embeds: [
        baseEmbed(COLORS.DANGER)
          .setTitle('❌ Candidature refusée — TWOTT')
          .setDescription(
            `Bonjour <@${ticket.applicantId}>,\n\n` +
              `Ta candidature pour **The Wolves Of The Trinity** a malheureusement été **refusée**.\n\n` +
              `**Raison :**\n>>> ${reason}`,
          ),
      ],
    });
  } catch {
    dmSent = false;
  }

  await postLog(interaction, ticket, 'REJECTED', reason, [], dmSent);

  await interaction.editReply({
    embeds: [
      baseEmbed(COLORS.DANGER)
        .setTitle('❌ Candidature refusée')
        .setDescription(
          `Décision prise par <@${interaction.user.id}>.\n` +
            (dmSent ? '📨 MP envoyé au candidat.\n' : '⚠️ Impossible d\'envoyer un MP au candidat.\n') +
            `\n**Raison :**\n>>> ${reason}` +
            `\n\nCe salon sera supprimé dans ${DELETE_DELAY_MS / 1000}s.`,
        ),
    ],
  });

  // Disable original message buttons
  try {
    const channelMessages = await interaction.channel.messages.fetch({ limit: 50 });
    const original = channelMessages.find((m) => m.author.id === interaction.client.user.id && m.components.length > 0);
    if (original) await original.edit({ components: [] }).catch(() => {});
  } catch {}

  await scheduleDelete(interaction.channel, ticketId);
}

async function askCloseConfirm(interaction, ticketId) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== 'OPEN') {
    await interaction.reply({ embeds: [errorEmbed('Ticket fermé', 'Cette candidature a déjà été traitée.')], ...EPHEMERAL });
    return;
  }

  // Allow staff or the applicant themselves to close
  const dbConfig = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
  const config = resolveConfig(dbConfig);
  const isStaff =
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
    (config.ticketStaffRoleId && interaction.member?.roles?.cache?.has(config.ticketStaffRoleId));
  const isApplicant = ticket.applicantId === interaction.user.id;
  if (!isStaff && !isApplicant) {
    await interaction.reply({ embeds: [errorEmbed('Permission refusée', 'Seul le staff ou le candidat peut fermer ce ticket.')], ...EPHEMERAL });
    return;
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket:close:confirm:${ticketId}`).setLabel('Confirmer la fermeture').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:close:cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({
    embeds: [
      baseEmbed(COLORS.WARNING)
        .setTitle('⚠️ Fermer la candidature ?')
        .setDescription('Le salon sera **supprimé**. Aucune décision (acceptation/refus) n\'est enregistrée.'),
    ],
    components: [row],
    ...EPHEMERAL,
  });
}

async function doClose(interaction, ticketId) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status !== 'OPEN') {
    await interaction.update({ embeds: [infoEmbed('Déjà fermé', 'Aucune action.')], components: [] });
    return;
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: 'CLOSED', closedAt: new Date(), closedById: interaction.user.id },
  });

  await postLog(interaction, ticket, 'CLOSED', null, [], false);

  await interaction.update({
    embeds: [infoEmbed('🔒 Ticket fermé', `Ce salon sera supprimé dans ${DELETE_DELAY_MS / 1000}s.`)],
    components: [],
  });

  await scheduleDelete(interaction.channel, ticketId);
}

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────

async function postLog(interaction, ticket, status, reason, warnings, dmSent) {
  const dbConfig = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
  const config = resolveConfig(dbConfig);
  if (!config.ticketLogChannelId) return;
  const logChannel = await interaction.client.channels.fetch(config.ticketLogChannelId).catch(() => null);
  if (!logChannel) return;

  const meta = {
    ACCEPTED: { color: COLORS.SUCCESS, title: '✅ Candidature acceptée' },
    REJECTED: { color: COLORS.DANGER, title: '❌ Candidature refusée' },
    CLOSED:   { color: COLORS.INFO, title: '🔒 Candidature fermée' },
  }[status];

  const embed = baseEmbed(meta.color)
    .setTitle(`${meta.title} — #${ticket.number.toString().padStart(4, '0')}`)
    .addFields(
      { name: 'Candidat', value: `<@${ticket.applicantId}> (\`${ticket.mcUsername}\`)`, inline: true },
      { name: 'Décision par', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Âge', value: ticket.age ?? '—', inline: true },
      { name: 'Niveau SAO', value: ticket.saoLevel ?? '—', inline: true },
      { name: 'Motivation', value: ticket.motivation.slice(0, 1024) },
    );

  if (reason) embed.addFields({ name: 'Raison du refus', value: reason.slice(0, 1024) });
  if (warnings?.length) embed.addFields({ name: '⚠️ Avertissements', value: warnings.join('\n').slice(0, 1024) });
  if (status === 'ACCEPTED' || status === 'REJECTED') {
    embed.addFields({ name: 'MP au candidat', value: dmSent ? '📨 Envoyé' : '⚠️ Échec (DMs fermés ?)', inline: true });
  }

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

async function scheduleDelete(channel, ticketId) {
  setTimeout(async () => {
    await channel.delete('Ticket résolu').catch(() => {});
    // Keep DB row for history; don't delete
  }, DELETE_DELAY_MS);
}
