import { Events, AuditLogEvent } from 'discord.js';
import { logEmbed, postLog, findAuditEntry, addExecutor, LOG_COLORS } from './logger.js';

function shorten(text, max = 1024) {
  if (!text) return '*vide*';
  return text.length > max ? text.slice(0, max - 3) + '...' : text;
}

export function registerMessageLogs(client) {
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild) return;
    if (message.author?.bot) return;

    const embed = logEmbed(LOG_COLORS.MESSAGE_DELETE)
      .setTitle('🗑️ Message supprimé')
      .setDescription(
        message.author
          ? `Cible (auteur) : <@${message.author.id}> dans <#${message.channelId}>`
          : `Dans <#${message.channelId}> (auteur inconnu)`,
      );

    if (message.partial) {
      embed.addFields({ name: 'Contenu', value: '*non disponible (message non caché)*' });
    } else {
      embed.addFields({ name: 'Contenu', value: shorten(message.content) });
      if (message.attachments?.size) {
        embed.addFields({
          name: 'Pièces jointes',
          value: [...message.attachments.values()].map((a) => `[${a.name}](${a.url})`).join('\n').slice(0, 1024),
        });
      }
    }

    // Discord audits message deletions by mods only (self-deletes are not logged)
    if (message.author && !message.author.bot) {
      const entry = await findAuditEntry(message.guild, AuditLogEvent.MessageDelete, message.author.id);
      if (entry) addExecutor(embed, entry.executor, 'Supprimé par');
      else embed.addFields({ name: 'Supprimé par', value: 'auteur lui-même', inline: true });
    }

    embed.addFields({ name: 'ID', value: '`' + message.id + '`', inline: true });
    await postLog(client, embed);
  });

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;

    // Skip pin/unpin and embed-only updates
    let oldContent, newContent;
    try {
      const fullNew = newMessage.partial ? await newMessage.fetch() : newMessage;
      newContent = fullNew.content;
      oldContent = oldMessage.partial ? null : oldMessage.content;
    } catch {
      return;
    }
    if (oldContent === newContent) return;

    const embed = logEmbed(LOG_COLORS.MESSAGE_EDIT)
      .setTitle('✏️ Message édité')
      .setDescription(`Cible (auteur) : <@${newMessage.author.id}> dans <#${newMessage.channelId}> — [Aller au message](${newMessage.url})`)
      .addFields(
        { name: 'Avant', value: oldContent ? shorten(oldContent) : '*non disponible*' },
        { name: 'Après', value: shorten(newContent) },
      );
    addExecutor(embed, newMessage.author, 'Édité par');
    await postLog(client, embed);
  });

  client.on(Events.MessageBulkDelete, async (messages, channel) => {
    const entry = await findAuditEntry(channel.guild, AuditLogEvent.MessageBulkDelete, channel.id);
    const embed = logEmbed(LOG_COLORS.MESSAGE_DELETE)
      .setTitle('🧹 Suppression en masse')
      .setDescription(`Cible : <#${channel.id}> — ${messages.size} messages`);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });
}
