import { Events } from 'discord.js';
import { logEmbed, postLog, LOG_COLORS } from './logger.js';

export function registerGuildLogs(client) {
  client.on(Events.GuildUpdate, async (oldG, newG) => {
    const fields = [];
    if (oldG.name !== newG.name) fields.push({ name: 'Nom', value: `\`${oldG.name}\` → \`${newG.name}\`` });
    if (oldG.iconURL() !== newG.iconURL()) fields.push({ name: 'Icône', value: 'modifiée' });
    if (oldG.bannerURL() !== newG.bannerURL()) fields.push({ name: 'Bannière', value: 'modifiée' });
    if (oldG.ownerId !== newG.ownerId) fields.push({ name: 'Propriétaire', value: `<@${oldG.ownerId}> → <@${newG.ownerId}>` });
    if (oldG.verificationLevel !== newG.verificationLevel) fields.push({ name: 'Vérification', value: `${oldG.verificationLevel} → ${newG.verificationLevel}` });
    if (fields.length === 0) return;

    const embed = logEmbed(LOG_COLORS.UPDATE).setTitle('🛠️ Serveur modifié').addFields(fields);
    await postLog(client, embed);
  });

  client.on(Events.InviteCreate, async (invite) => {
    const embed = logEmbed(LOG_COLORS.INVITE)
      .setTitle('🔗 Invitation créée')
      .setDescription(`Code : \`${invite.code}\``)
      .addFields(
        { name: 'Auteur', value: invite.inviter ? `<@${invite.inviter.id}>` : '—', inline: true },
        { name: 'Salon', value: invite.channel ? `<#${invite.channel.id}>` : '—', inline: true },
        { name: 'Max usages', value: String(invite.maxUses || '∞'), inline: true },
        { name: 'Expire', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'jamais', inline: true },
      );
    await postLog(client, embed);
  });

  client.on(Events.InviteDelete, async (invite) => {
    const embed = logEmbed(LOG_COLORS.UPDATE)
      .setTitle('🔗 Invitation supprimée')
      .setDescription(`Code : \`${invite.code}\` (salon : <#${invite.channelId}>)`);
    await postLog(client, embed);
  });

  client.on(Events.GuildEmojiCreate, async (emoji) => {
    const embed = logEmbed(LOG_COLORS.CREATE)
      .setTitle('😀 Emoji ajouté')
      .setDescription(`${emoji} \`:${emoji.name}:\``)
      .setThumbnail(emoji.imageURL());
    await postLog(client, embed);
  });

  client.on(Events.GuildEmojiDelete, async (emoji) => {
    const embed = logEmbed(LOG_COLORS.DELETE)
      .setTitle('😶 Emoji supprimé')
      .setDescription(`\`:${emoji.name}:\``);
    await postLog(client, embed);
  });

  client.on(Events.GuildEmojiUpdate, async (oldE, newE) => {
    if (oldE.name === newE.name) return;
    const embed = logEmbed(LOG_COLORS.UPDATE)
      .setTitle('😶 Emoji renommé')
      .setDescription(`\`:${oldE.name}:\` → \`:${newE.name}:\``)
      .setThumbnail(newE.imageURL());
    await postLog(client, embed);
  });

  client.on(Events.GuildStickerCreate, async (sticker) => {
    const embed = logEmbed(LOG_COLORS.CREATE).setTitle('🏷️ Sticker ajouté').setDescription(`\`${sticker.name}\``);
    await postLog(client, embed);
  });

  client.on(Events.GuildStickerDelete, async (sticker) => {
    const embed = logEmbed(LOG_COLORS.DELETE).setTitle('🏷️ Sticker supprimé').setDescription(`\`${sticker.name}\``);
    await postLog(client, embed);
  });
}
