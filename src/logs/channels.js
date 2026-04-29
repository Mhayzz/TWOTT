import { Events, ChannelType, AuditLogEvent } from 'discord.js';
import { logEmbed, postLog, findAuditEntry, addExecutor, LOG_COLORS } from './logger.js';
import prisma from '../lib/prisma.js';

async function isManagedStatusChannel(channelId, guildId) {
  if (!guildId || !channelId) return false;
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId } });
    return config?.ipChannelId === channelId || config?.statusChannelId === channelId;
  } catch {
    return false;
  }
}

const TYPE_LABELS = {
  [ChannelType.GuildText]: 'textuel',
  [ChannelType.GuildVoice]: 'vocal',
  [ChannelType.GuildCategory]: 'catégorie',
  [ChannelType.GuildAnnouncement]: 'annonces',
  [ChannelType.GuildStageVoice]: 'scène',
  [ChannelType.GuildForum]: 'forum',
  [ChannelType.GuildMedia]: 'média',
  [ChannelType.PublicThread]: 'fil public',
  [ChannelType.PrivateThread]: 'fil privé',
  [ChannelType.AnnouncementThread]: 'fil d\'annonces',
};

function typeLabel(t) {
  return TYPE_LABELS[t] ?? `type ${t}`;
}

export function registerChannelLogs(client) {
  client.on(Events.ChannelCreate, async (channel) => {
    if (!channel.guild) return;
    const entry = await findAuditEntry(channel.guild, AuditLogEvent.ChannelCreate, channel.id);
    const embed = logEmbed(LOG_COLORS.CREATE)
      .setTitle('📁 Salon créé')
      .setDescription(`Cible : ${channel} (${typeLabel(channel.type)})`)
      .addFields({ name: 'ID', value: '`' + channel.id + '`', inline: true });
    if (channel.parent) embed.addFields({ name: 'Catégorie', value: channel.parent.name, inline: true });
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;
    const entry = await findAuditEntry(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
    const embed = logEmbed(LOG_COLORS.DELETE)
      .setTitle('🗑️ Salon supprimé')
      .setDescription(`Cible : \`#${channel.name}\` (${typeLabel(channel.type)})`)
      .addFields({ name: 'ID', value: '`' + channel.id + '`', inline: true });
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.ChannelUpdate, async (oldCh, newCh) => {
    if (!newCh.guild) return;
    // Skip the IP / status voice channels — they're renamed by the bot every few minutes
    if (await isManagedStatusChannel(newCh.id, newCh.guildId)) return;
    const fields = [];
    if (oldCh.name !== newCh.name) fields.push({ name: 'Nom', value: `\`${oldCh.name}\` → \`${newCh.name}\`` });
    if (oldCh.topic !== newCh.topic) {
      fields.push({
        name: 'Sujet',
        value: `**Avant :** ${oldCh.topic || '*aucun*'}\n**Après :** ${newCh.topic || '*aucun*'}`.slice(0, 1024),
      });
    }
    if (oldCh.parentId !== newCh.parentId) {
      fields.push({ name: 'Catégorie', value: `${oldCh.parent?.name ?? '*aucune*'} → ${newCh.parent?.name ?? '*aucune*'}` });
    }
    if (oldCh.nsfw !== newCh.nsfw) fields.push({ name: 'NSFW', value: `${oldCh.nsfw} → ${newCh.nsfw}`, inline: true });
    if (oldCh.rateLimitPerUser !== newCh.rateLimitPerUser) {
      fields.push({ name: 'Mode lent', value: `${oldCh.rateLimitPerUser ?? 0}s → ${newCh.rateLimitPerUser ?? 0}s`, inline: true });
    }
    if (fields.length === 0) return;

    const entry = await findAuditEntry(newCh.guild, AuditLogEvent.ChannelUpdate, newCh.id);
    const embed = logEmbed(LOG_COLORS.UPDATE)
      .setTitle('✏️ Salon modifié')
      .setDescription(`Cible : ${newCh}`)
      .addFields(fields);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.ThreadCreate, async (thread) => {
    const entry = await findAuditEntry(thread.guild, AuditLogEvent.ThreadCreate, thread.id);
    const embed = logEmbed(LOG_COLORS.CREATE)
      .setTitle('🧵 Fil créé')
      .setDescription(`Cible : ${thread} dans ${thread.parent}`)
      .addFields({ name: 'Auteur', value: thread.ownerId ? `<@${thread.ownerId}>` : '—', inline: true });
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.ThreadDelete, async (thread) => {
    const entry = await findAuditEntry(thread.guild, AuditLogEvent.ThreadDelete, thread.id);
    const embed = logEmbed(LOG_COLORS.DELETE)
      .setTitle('🧵 Fil supprimé')
      .setDescription(`Cible : \`${thread.name}\` (était dans ${thread.parent ?? '?'})`);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.ThreadUpdate, async (oldT, newT) => {
    const fields = [];
    if (oldT.name !== newT.name) fields.push({ name: 'Nom', value: `\`${oldT.name}\` → \`${newT.name}\`` });
    if (oldT.archived !== newT.archived) fields.push({ name: 'Archivé', value: `${oldT.archived} → ${newT.archived}`, inline: true });
    if (oldT.locked !== newT.locked) fields.push({ name: 'Verrouillé', value: `${oldT.locked} → ${newT.locked}`, inline: true });
    if (fields.length === 0) return;
    const entry = await findAuditEntry(newT.guild, AuditLogEvent.ThreadUpdate, newT.id);
    const embed = logEmbed(LOG_COLORS.UPDATE).setTitle('🧵 Fil modifié').setDescription(`Cible : ${newT}`).addFields(fields);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });
}
