import { Events } from 'discord.js';
import { logEmbed, postLog, LOG_COLORS } from './logger.js';

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
          ? `Auteur : <@${message.author.id}> dans <#${message.channelId}>`
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
      .setDescription(`Auteur : <@${newMessage.author.id}> dans <#${newMessage.channelId}> — [Aller au message](${newMessage.url})`)
      .addFields(
        { name: 'Avant', value: oldContent ? shorten(oldContent) : '*non disponible*' },
        { name: 'Après', value: shorten(newContent) },
      );
    await postLog(client, embed);
  });

  client.on(Events.MessageBulkDelete, async (messages, channel) => {
    const embed = logEmbed(LOG_COLORS.MESSAGE_DELETE)
      .setTitle('🧹 Suppression en masse')
      .setDescription(`${messages.size} messages supprimés dans <#${channel.id}>`);
    await postLog(client, embed);
  });
}
