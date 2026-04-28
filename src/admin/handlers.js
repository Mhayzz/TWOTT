import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import prisma from '../lib/prisma.js';
import { applyAutoRoles, RANKS, summarizeRolesResult } from '../lib/roles.js';
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
    if (id === 'admin:setrank') return startUserSelect(interaction, 'setrank', 'Choisis le membre dont tu veux changer le grade.');
    if (id === 'admin:setclass')return startUserSelect(interaction, 'setclass', 'Choisis le membre dont tu veux changer la classe.');
    if (id === 'admin:remove')  return startUserSelect(interaction, 'remove', 'Choisis le membre à retirer de la guilde.');
    if (id === 'admin:list')    return showList(interaction);
    if (id === 'admin:stats')   return showStats(interaction);
    if (id.startsWith('admin:remove:confirm:')) return confirmRemove(interaction, id.split(':')[3]);
    if (id.startsWith('admin:remove:cancel'))   return interaction.update({ embeds: [infoEmbed('Annulé', 'Aucune modification.')], components: [] });
  }

  // Step 2a: user picked from a UserSelect menu
  if (interaction.isUserSelectMenu()) {
    const action = id.split(':')[2]; // admin:user:<action>
    const userId = interaction.values[0];
    if (action === 'recruit')  return openRecruitModal(interaction, userId);
    if (action === 'setrank')  return showRankPicker(interaction, userId);
    if (action === 'setclass') return openClassModal(interaction, userId);
    if (action === 'remove')   return askRemoveConfirmation(interaction, userId);
  }

  // Step 2b: rank picked from the StringSelect menu
  if (interaction.isStringSelectMenu()) {
    const parts = id.split(':'); // admin:rank:<userId>
    if (parts[1] === 'rank') return applySetRank(interaction, parts[2], interaction.values[0]);
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
    setrank: 'Changer le grade',
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
    .setMaxLength(32);
  if (existing?.mcUsername) pseudo.setValue(existing.mcUsername);
  const classe = new TextInputBuilder()
    .setCustomId('class_name')
    .setLabel('Classe (optionnel)')
    .setPlaceholder('Ex: Bretteur')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(40);
  if (existing?.className) classe.setValue(existing.className);
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

  const rolesResult = await applyAutoRoles(interaction.guild, member);
  const summary = summarizeRolesResult(rolesResult);

  await interaction.reply({
    embeds: [
      successEmbed(
        '🐺 Recrue enregistrée',
        `<@${userId}> a été ajouté à la guilde.\n**Pseudo MC :** \`${mcUsername}\`\n**Classe :** ${className ?? '—'}\n**Rang :** ${member.rank}` +
          (summary ? `\n\n${summary}` : ''),
      ),
    ],
    ...EPHEMERAL,
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Set rank (unified promote/demote)
// ────────────────────────────────────────────────────────────────────────────────

const RANK_EMOJIS = {
  'Recrue': '🌱',
  'Aventurier': '🗡️',
  'Vétéran': '🛡️',
  'Cartographe': '🗺️',
  'Stratège': '🎯',
  'Co-Guild Master': '⚜️',
  'Guild Master': '👑',
};

async function showRankPicker(interaction, userId) {
  const member = await prisma.member.findUnique({ where: { discordId: userId } });
  if (!member) return notRegisteredReply(interaction, userId);

  const options = RANKS.map((rank) => ({
    label: rank,
    value: rank,
    emoji: RANK_EMOJIS[rank],
    description: rank === member.rank ? 'Grade actuel' : undefined,
    default: rank === member.rank,
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`admin:rank:${userId}`)
    .setPlaceholder('Choisir le nouveau grade…')
    .addOptions(options);

  await interaction.update({
    embeds: [
      baseEmbed(COLORS.PRIMARY)
        .setTitle('🎖️ Changer le grade')
        .setDescription(
          `Membre : <@${userId}> (\`${member.mcUsername}\`)\n` +
            `Grade actuel : **${member.rank}** ${RANK_EMOJIS[member.rank] ?? ''}\n\n` +
            `Sélectionne le nouveau grade dans la liste ci-dessous.`,
        ),
    ],
    components: [new ActionRowBuilder().addComponents(menu)],
  });
}

async function applySetRank(interaction, userId, newRank) {
  const member = await prisma.member.findUnique({ where: { discordId: userId } });
  if (!member) return notRegisteredReply(interaction, userId);

  if (!RANKS.includes(newRank)) {
    await interaction.update({
      embeds: [errorEmbed('Grade invalide', `\`${newRank}\` n'est pas un grade valide.`)],
      components: [],
    });
    return;
  }

  if (newRank === member.rank) {
    await interaction.update({
      embeds: [infoEmbed('Aucun changement', `<@${userId}> est déjà **${member.rank}**.`)],
      components: [],
    });
    return;
  }

  const updated = await prisma.member.update({ where: { discordId: userId }, data: { rank: newRank } });
  const rolesResult = await applyAutoRoles(interaction.guild, updated);
  const summary = summarizeRolesResult(rolesResult);

  const oldIdx = RANKS.indexOf(member.rank);
  const newIdx = RANKS.indexOf(newRank);
  const arrow = newIdx > oldIdx ? '⬆️ Promotion' : '⬇️ Rétrogradation';

  await interaction.update({
    embeds: [
      successEmbed(
        `🎖️ ${arrow}`,
        `<@${userId}> : **${member.rank}** ${RANK_EMOJIS[member.rank] ?? ''} → **${newRank}** ${RANK_EMOJIS[newRank] ?? ''}` +
          (summary ? `\n\n${summary}` : ''),
      ),
    ],
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
    .setMaxLength(40);
  if (existing.className) classe.setValue(existing.className);
  modal.addComponents(new ActionRowBuilder().addComponents(classe));
  await interaction.showModal(modal);
}

async function submitSetClass(interaction, userId) {
  const className = interaction.fields.getTextInputValue('class_name').trim() || null;
  const updated = await prisma.member.update({
    where: { discordId: userId },
    data: { className },
  });
  const rolesResult = await applyAutoRoles(interaction.guild, updated);
  const summary = summarizeRolesResult(rolesResult);
  await interaction.reply({
    embeds: [successEmbed('🛡️ Classe mise à jour', `<@${userId}> : ${className ?? '*aucune*'}` + (summary ? `\n\n${summary}` : ''))],
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
