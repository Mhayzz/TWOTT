import { Events, ChannelType } from 'discord.js';
import { logEmbed, postLog, LOG_COLORS } from './logger.js';

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
    const embed = logEmbed(LOG_COLORS.CREATE)
      .setTitle('📁 Salon créé')
      .setDescription(`${channel} (${typeLabel(channel.type)})`)
      .addFields({ name: 'ID', value: '`' + channel.id + '`', inline: true });
    if (channel.parent) embed.addFields({ name: 'Catégorie', value: channel.parent.name, inline: true });
    await postLog(client, embed);
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;
    const embed = logEmbed(LOG_COLORS.DELETE)
      .setTitle('🗑️ Salon supprimé')
      .setDescription(`\`#${channel.name}\` (${typeLabel(channel.type)})`)
      .addFields({ name: 'ID', value: '`' + channel.id + '`', inline: true });
    await postLog(client, embed);
  });

  client.on(Events.ChannelUpdate, async (oldCh, newCh) => {
    if (!newCh.guild) return;
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

    const embed = logEmbed(LOG_COLORS.UPDATE)
      .setTitle('✏️ Salon modifié')
      .setDescription(`${newCh}`)
      .addFields(fields);
    await postLog(client, embed);
  });

  client.on(Events.ThreadCreate, async (thread) => {
    const embed = logEmbed(LOG_COLORS.CREATE)
      .setTitle('🧵 Fil créé')
      .setDescription(`${thread} dans ${thread.parent}`)
      .addFields({ name: 'Auteur', value: thread.ownerId ? `<@${thread.ownerId}>` : '—', inline: true });
    await postLog(client, embed);
  });

  client.on(Events.ThreadDelete, async (thread) => {
    const embed = logEmbed(LOG_COLORS.DELETE)
      .setTitle('🧵 Fil supprimé')
      .setDescription(`\`${thread.name}\` (était dans ${thread.parent ?? '?'})`);
    await postLog(client, embed);
  });

  client.on(Events.ThreadUpdate, async (oldT, newT) => {
    const fields = [];
    if (oldT.name !== newT.name) fields.push({ name: 'Nom', value: `\`${oldT.name}\` → \`${newT.name}\`` });
    if (oldT.archived !== newT.archived) fields.push({ name: 'Archivé', value: `${oldT.archived} → ${newT.archived}`, inline: true });
    if (oldT.locked !== newT.locked) fields.push({ name: 'Verrouillé', value: `${oldT.locked} → ${newT.locked}`, inline: true });
    if (fields.length === 0) return;
    const embed = logEmbed(LOG_COLORS.UPDATE).setTitle('🧵 Fil modifié').setDescription(`${newT}`).addFields(fields);
    await postLog(client, embed);
  });
}
