import { Events, AuditLogEvent } from 'discord.js';
import { logEmbed, postLog, findAuditEntry, addExecutor, LOG_COLORS } from './logger.js';

export function registerGuildLogs(client) {
  client.on(Events.GuildUpdate, async (oldG, newG) => {
    const fields = [];
    if (oldG.name !== newG.name) fields.push({ name: 'Nom', value: `\`${oldG.name}\` → \`${newG.name}\`` });
    if (oldG.iconURL() !== newG.iconURL()) fields.push({ name: 'Icône', value: 'modifiée' });
    if (oldG.bannerURL() !== newG.bannerURL()) fields.push({ name: 'Bannière', value: 'modifiée' });
    if (oldG.ownerId !== newG.ownerId) fields.push({ name: 'Propriétaire', value: `<@${oldG.ownerId}> → <@${newG.ownerId}>` });
    if (oldG.verificationLevel !== newG.verificationLevel) fields.push({ name: 'Vérification', value: `${oldG.verificationLevel} → ${newG.verificationLevel}` });
    if (fields.length === 0) return;

    const entry = await findAuditEntry(newG, AuditLogEvent.GuildUpdate, newG.id);
    const embed = logEmbed(LOG_COLORS.UPDATE).setTitle('🛠️ Serveur modifié').setDescription(`Cible : ${newG.name}`).addFields(fields);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.InviteCreate, async (invite) => {
    const embed = logEmbed(LOG_COLORS.INVITE)
      .setTitle('🔗 Invitation créée')
      .setDescription(`Code : \`${invite.code}\``)
      .addFields(
        { name: 'Salon', value: invite.channel ? `<#${invite.channel.id}>` : '—', inline: true },
        { name: 'Max usages', value: String(invite.maxUses || '∞'), inline: true },
        { name: 'Expire', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'jamais', inline: true },
      );
    addExecutor(embed, invite.inviter, 'Créée par');
    await postLog(client, embed);
  });

  client.on(Events.InviteDelete, async (invite) => {
    const entry = invite.guild ? await findAuditEntry(invite.guild, AuditLogEvent.InviteDelete, null) : null;
    const embed = logEmbed(LOG_COLORS.UPDATE)
      .setTitle('🔗 Invitation supprimée')
      .setDescription(`Code : \`${invite.code}\` (salon : <#${invite.channelId}>)`);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.GuildEmojiCreate, async (emoji) => {
    const entry = await findAuditEntry(emoji.guild, AuditLogEvent.EmojiCreate, emoji.id);
    const embed = logEmbed(LOG_COLORS.CREATE)
      .setTitle('😀 Emoji ajouté')
      .setDescription(`Cible : ${emoji} \`:${emoji.name}:\``)
      .setThumbnail(emoji.imageURL());
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.GuildEmojiDelete, async (emoji) => {
    const entry = await findAuditEntry(emoji.guild, AuditLogEvent.EmojiDelete, emoji.id);
    const embed = logEmbed(LOG_COLORS.DELETE)
      .setTitle('😶 Emoji supprimé')
      .setDescription(`Cible : \`:${emoji.name}:\``);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.GuildEmojiUpdate, async (oldE, newE) => {
    if (oldE.name === newE.name) return;
    const entry = await findAuditEntry(newE.guild, AuditLogEvent.EmojiUpdate, newE.id);
    const embed = logEmbed(LOG_COLORS.UPDATE)
      .setTitle('😶 Emoji renommé')
      .setDescription(`Cible : \`:${oldE.name}:\` → \`:${newE.name}:\``)
      .setThumbnail(newE.imageURL());
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.GuildStickerCreate, async (sticker) => {
    const entry = await findAuditEntry(sticker.guild, AuditLogEvent.StickerCreate, sticker.id);
    const embed = logEmbed(LOG_COLORS.CREATE).setTitle('🏷️ Sticker ajouté').setDescription(`Cible : \`${sticker.name}\``);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });

  client.on(Events.GuildStickerDelete, async (sticker) => {
    const entry = await findAuditEntry(sticker.guild, AuditLogEvent.StickerDelete, sticker.id);
    const embed = logEmbed(LOG_COLORS.DELETE).setTitle('🏷️ Sticker supprimé').setDescription(`Cible : \`${sticker.name}\``);
    addExecutor(embed, entry?.executor);
    await postLog(client, embed);
  });
}
