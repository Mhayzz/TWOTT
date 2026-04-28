import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import prisma from '../lib/prisma.js';
import { applyAutoRoles, RANKS, nextRank, previousRank } from '../lib/roles.js';
import { baseEmbed, successEmbed, errorEmbed, infoEmbed, COLORS } from '../lib/embeds.js';

const EPHEMERAL = { flags: MessageFlags.Ephemeral };

function ensureAdmin(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    interaction.reply({
      embeds: [errorEmbed('Permission refusée', 'Réservé aux admins (`Gérer le serveur`).')],
      ...EPHEMERAL,
    }).catch(() => {});
    return false;
  }
  return true;
}

export async function handleAdminInteraction(interaction) {
  const id = interaction.customId;
  if (!ensureAdmin(interaction)) return;

  // Step 1: top-level button on the panel
  if (interaction.isButton()) {
    if (id === 'admin:recruit') return startUserSelect(interaction, 'recruit', 'Choisis le membre Discord à ajouter à la guilde.');
    if (id === 'admin:promote') return startUserSelect(interaction, 'promote', 'Choisis le membre à promouvoir.');
    if (id === 'admin:demote')  return startUserSelect(interaction, 'demote', 'Choisis le membre à rétrograder.');
    if (id === 'admin:setclass')return startUserSelect(interaction, 'setclass', 'Choisis le membre dont tu veux changer la classe.');
    if (id === 'admin:remove')  return startUserSelect(interaction, 'remove', 'Choisis le membre à retirer de la guilde.');
    if (id === 'admin:list')    return showList(interaction);
    if (id === 'admin:stats')   return showStats(interaction);
    if (id.startsWith('admin:remove:confirm:')) return confirmRemove(interaction, id.split(':')[3]);
    if (id.startsWith('admin:remove:cancel'))   return interaction.update({ embeds: [infoEmbed('Annulé', 'Aucune modification.')], components: [] });
  }

  // Step 2: user picked from a UserSelect menu
  if (interaction.isUserSelectMenu()) {
    const action = id.split(':')[2]; // admin:user:<action>
    const userId = interaction.values[0];
    if (action === 'recruit')  return openRecruitModal(interaction, userId);
    if (action === 'promote')  return doPromote(interaction, userId);
    if (action === 'demote')   return doDemote(interaction, userId);
    if (action === 'setclass') return openClassModal(interaction, userId);
    if (action === 'remove')   return askRemoveConfirmation(interaction, userId);
  }

  // Step 3: modal submitted
  if (interaction.isModalSubmit()) {
    const parts = id.split(':'); // admin:modal:<action>:<userId>
    const action = parts[2];
    const userId = parts[3];
    if (action === 'recruit')  return submitRecruit(interaction, userId);
    if (action === 'setclass') return submitSetClass(interaction, userId);
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// User select prompts
// ────────────────────────────────────────────────────────────────────────────────

async function startUserSelect(interaction, action, prompt) {
  const menu = new UserSelectMenuBuilder()
    .setCustomId(`admin:user:${action}`)
    .setPlaceholder('Sélectionner un membre…')
    .setMinValues(1)
    .setMaxValues(1);
  const row = new ActionRowBuilder().addComponents(menu);
  await interaction.reply({
    embeds: [infoEmbed('🐺 ' + titleFor(action), prompt)],
    components: [row],
    ...EPHEMERAL,
  });
}

function titleFor(action) {
  return {
    recruit: 'Ajouter une recrue',
    promote: 'Promouvoir',
    demote: 'Rétrograder',
    setclass: 'Définir la classe',
    remove: 'Retirer de la guilde',
  }[action] ?? action;
}

// ────────────────────────────────────────────────────────────────────────────────
// Recruit
// ────────────────────────────────────────────────────────────────────────────────

async function openRecruitModal(interaction, userId) {
  const existing = await prisma.member.findUnique({ where: { discordId: userId } });
  const modal = new ModalBuilder()
    .setCustomId(`admin:modal:recruit:${userId}`)
    .setTitle('Ajouter une recrue');
  const pseudo = new TextInputBuilder()
    .setCustomId('mc_username')
    .setLabel('Pseudo Minecraft')
    .setPlaceholder('Ex: Kirito')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(32)
    .setValue(existing?.mcUsername ?? '');
  const classe = new TextInputBuilder()
    .setCustomId('class_name')
    .setLabel('Classe (optionnel)')
    .setPlaceholder('Ex: Bretteur')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(40)
    .setValue(existing?.className ?? '');
  modal.addComponents(
    new ActionRowBuilder().addComponents(pseudo),
    new ActionRowBuilder().addComponents(classe),
  );
  await interaction.showModal(modal);
}

async function submitRecruit(interaction, userId) {
  const mcUsername = interaction.fields.getTextInputValue('mc_username').trim();
  const className = interaction.fields.getTextInputValue('class_name').trim() || null;

  if (!/^[A-Za-z0-9_]{3,16}$/.test(mcUsername)) {
    await interaction.reply({
      embeds: [errorEmbed('Pseudo invalide', '3 à 16 caractères, lettres / chiffres / `_` uniquement.')],
      ...EPHEMERAL,
    });
    return;
  }

  const member = await prisma.member.upsert({
    where: { discordId: userId },
    update: { mcUsername, className },
    create: { discordId: userId, mcUsername, className, rank: 'Recrue' },
  });

  await applyAutoRoles(interaction.guild, member);

  await interaction.reply({
    embeds: [
      successEmbed(
        '🐺 Recrue enregistrée',
        `<@${userId}> a été ajouté à la guilde.\n**Pseudo MC :** \`${mcUsername}\`\n**Classe :** ${className ?? '—'}\n**Rang :** ${member.rank}`,
      ),
    ],
    ...EPHEMERAL,
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Promote / Demote
// ────────────────────────────────────────────────────────────────────────────────

async function doPromote(interaction, userId) {
  const member = await prisma.member.findUnique({ where: { discordId: userId } });
  if (!member) return notRegisteredReply(interaction, userId);
  const next = nextRank(member.rank);
  if (!next) {
    await interaction.update({
      embeds: [errorEmbed('Rang max', `<@${userId}> est déjà **${member.rank}**, impossible de promouvoir.`)],
      components: [],
    });
    return;
  }
  const updated = await prisma.member.update({ where: { discordId: userId }, data: { rank: next } });
  await applyAutoRoles(interaction.guild, updated);
  await interaction.update({
    embeds: [successEmbed('⬆️ Promotion', `<@${userId}> : **${member.rank}** → **${next}**`)],
    components: [],
  });
}

async function doDemote(interaction, userId) {
  const member = await prisma.member.findUnique({ where: { discordId: userId } });
  if (!member) return notRegisteredReply(interaction, userId);
  const prev = previousRank(member.rank);
  if (!prev) {
    await interaction.update({
      embeds: [errorEmbed('Rang min', `<@${userId}> est déjà **${member.rank}**, impossible de rétrograder.`)],
      components: [],
    });
    return;
  }
  const updated = await prisma.member.update({ where: { discordId: userId }, data: { rank: prev } });
  await applyAutoRoles(interaction.guild, updated);
  await interaction.update({
    embeds: [successEmbed('⬇️ Rétrogradation', `<@${userId}> : **${member.rank}** → **${prev}**`)],
    components: [],
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Set class
// ────────────────────────────────────────────────────────────────────────────────

async function openClassModal(interaction, userId) {
  const existing = await prisma.member.findUnique({ where: { discordId: userId } });
  if (!existing) return notRegisteredReply(interaction, userId);

  const modal = new ModalBuilder()
    .setCustomId(`admin:modal:setclass:${userId}`)
    .setTitle('Définir la classe');
  const classe = new TextInputBuilder()
    .setCustomId('class_name')
    .setLabel('Classe (laisser vide pour retirer)')
    .setPlaceholder('Ex: Mage, Tank, Bretteur…')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(40)
    .setValue(existing.className ?? '');
  modal.addComponents(new ActionRowBuilder().addComponents(classe));
  await interaction.showModal(modal);
}

async function submitSetClass(interaction, userId) {
  const className = interaction.fields.getTextInputValue('class_name').trim() || null;
  const updated = await prisma.member.update({
    where: { discordId: userId },
    data: { className },
  });
  await applyAutoRoles(interaction.guild, updated);
  await interaction.reply({
    embeds: [successEmbed('🛡️ Classe mise à jour', `<@${userId}> : ${className ?? '*aucune*'}`)],
    ...EPHEMERAL,
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Remove
// ────────────────────────────────────────────────────────────────────────────────

async function askRemoveConfirmation(interaction, userId) {
  const member = await prisma.member.findUnique({ where: { discordId: userId } });
  if (!member) return notRegisteredReply(interaction, userId);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`admin:remove:confirm:${userId}`).setLabel('Confirmer').setEmoji('🚪').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('admin:remove:cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary),
  );
  await interaction.update({
    embeds: [
      baseEmbed(COLORS.WARNING)
        .setTitle('⚠️ Confirmer le retrait')
        .setDescription(
          `Tu vas retirer <@${userId}> de la guilde.\n` +
            `**Pseudo MC :** \`${member.mcUsername}\`\n**Rang :** ${member.rank}\n\n` +
            `Cette action supprime aussi ses inscriptions aux raids. Continuer ?`,
        ),
    ],
    components: [row],
  });
}

async function confirmRemove(interaction, userId) {
  const member = await prisma.member.findUnique({ where: { discordId: userId } });
  if (!member) {
    await interaction.update({ embeds: [errorEmbed('Introuvable', 'Membre déjà supprimé.')], components: [] });
    return;
  }
  await prisma.member.delete({ where: { discordId: userId } });

  // Strip configured class/rank roles
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    const guildMember = await interaction.guild.members.fetch(userId).catch(() => null);
    if (guildMember && config) {
      const toRemove = [
        ...Object.values(config.classRoleMap ?? {}),
        ...Object.values(config.rankRoleMap ?? {}),
      ].filter((r) => guildMember.roles.cache.has(r));
      if (toRemove.length) await guildMember.roles.remove(toRemove).catch(() => {});
    }
  } catch (err) {
    console.warn('confirmRemove role cleanup:', err.message);
  }

  await interaction.update({
    embeds: [successEmbed('🚪 Membre retiré', `<@${userId}> a été retiré de la guilde.`)],
    components: [],
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// List & Stats
// ────────────────────────────────────────────────────────────────────────────────

async function showList(interaction) {
  const members = await prisma.member.findMany({ orderBy: [{ rank: 'asc' }, { mcUsername: 'asc' }] });
  if (members.length === 0) {
    await interaction.reply({ embeds: [infoEmbed('Aucun membre', 'La guilde est vide pour l\'instant.')], ...EPHEMERAL });
    return;
  }

  const byRank = new Map(RANKS.map((r) => [r, []]));
  for (const m of members) {
    if (!byRank.has(m.rank)) byRank.set(m.rank, []);
    byRank.get(m.rank).push(m);
  }

  const fields = [];
  for (const rank of [...RANKS].reverse()) {
    const list = byRank.get(rank) ?? [];
    if (list.length === 0) continue;
    const value = list
      .map((m) => `• <@${m.discordId}> — \`${m.mcUsername}\`${m.className ? ` *(${m.className})*` : ''}`)
      .join('\n')
      .slice(0, 1024);
    fields.push({ name: `${rank} (${list.length})`, value, inline: false });
  }

  await interaction.reply({
    embeds: [
      baseEmbed(COLORS.PRIMARY)
        .setTitle(`📜 Membres de la guilde (${members.length})`)
        .addFields(fields),
    ],
    ...EPHEMERAL,
  });
}

async function showStats(interaction) {
  const total = await prisma.member.count();
  if (total === 0) {
    await interaction.reply({ embeds: [infoEmbed('Aucune statistique', 'La guilde est vide.')], ...EPHEMERAL });
    return;
  }

  const byRank = await prisma.member.groupBy({ by: ['rank'], _count: { rank: true } });
  const byClass = await prisma.member.groupBy({ by: ['className'], _count: { className: true } });

  const rankLines = RANKS
    .map((r) => {
      const found = byRank.find((x) => x.rank === r);
      return `• **${r}** — ${found?._count.rank ?? 0}`;
    })
    .join('\n');

  const classLines = byClass
    .filter((c) => c.className)
    .sort((a, b) => b._count.className - a._count.className)
    .map((c) => `• **${c.className}** — ${c._count.className}`)
    .join('\n') || '*Aucune classe renseignée*';

  await interaction.reply({
    embeds: [
      baseEmbed(COLORS.PRIMARY)
        .setTitle('📊 Statistiques de la guilde')
        .setDescription(`**Membres totaux :** ${total}`)
        .addFields(
          { name: 'Par rang', value: rankLines, inline: true },
          { name: 'Par classe', value: classLines, inline: true },
        ),
    ],
    ...EPHEMERAL,
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────

async function notRegisteredReply(interaction, userId) {
  const payload = {
    embeds: [errorEmbed('Membre non enregistré', `<@${userId}> n'est pas inscrit. Utilise **➕ Ajouter une recrue** d'abord.`)],
    components: [],
  };
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload);
  } else if (interaction.isUserSelectMenu() || interaction.isButton()) {
    await interaction.update(payload);
  } else {
    await interaction.reply({ ...payload, ...EPHEMERAL });
  }
}
