import { Events, AuditLogEvent } from 'discord.js';
import { logEmbed, postLog, findAuditEntry, LOG_COLORS } from './logger.js';

export function registerMemberLogs(client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    const created = Math.floor(member.user.createdTimestamp / 1000);
    const embed = logEmbed(LOG_COLORS.JOIN)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setTitle('📥 Membre arrivé')
      .setDescription(`<@${member.id}>`)
      .addFields(
        { name: 'Compte créé', value: `<t:${created}:R>`, inline: true },
        { name: 'ID', value: '`' + member.id + '`', inline: true },
      );
    await postLog(client, embed);
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const kickEntry = await findAuditEntry(member.guild, AuditLogEvent.MemberKick, member.id);
    const embed = logEmbed(kickEntry ? LOG_COLORS.KICK : LOG_COLORS.LEAVE)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setTitle(kickEntry ? '👢 Membre expulsé' : '📤 Membre parti')
      .setDescription(`<@${member.id}>`);
    if (kickEntry) {
      embed.addFields(
        { name: 'Modérateur', value: `<@${kickEntry.executor.id}>`, inline: true },
        { name: 'Raison', value: kickEntry.reason ?? '*aucune*', inline: false },
      );
    }
    embed.addFields({ name: 'ID', value: '`' + member.id + '`', inline: true });
    await postLog(client, embed);
  });

  client.on(Events.GuildBanAdd, async (ban) => {
    const entry = await findAuditEntry(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
    const reason = ban.reason ?? entry?.reason ?? '*aucune*';
    const embed = logEmbed(LOG_COLORS.BAN)
      .setAuthor({ name: ban.user.tag, iconURL: ban.user.displayAvatarURL() })
      .setTitle('🔨 Membre banni')
      .setDescription(`<@${ban.user.id}>`)
      .addFields(
        ...(entry ? [{ name: 'Modérateur', value: `<@${entry.executor.id}>`, inline: true }] : []),
        { name: 'Raison', value: reason, inline: false },
      );
    await postLog(client, embed);
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    const entry = await findAuditEntry(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
    const embed = logEmbed(LOG_COLORS.UNBAN)
      .setAuthor({ name: ban.user.tag, iconURL: ban.user.displayAvatarURL() })
      .setTitle('🕊️ Bannissement levé')
      .setDescription(`<@${ban.user.id}>`)
      .addFields(...(entry ? [{ name: 'Modérateur', value: `<@${entry.executor.id}>`, inline: true }] : []));
    await postLog(client, embed);
  });

  client.on(Events.GuildMemberUpdate, async (oldM, newM) => {
    // Roles
    const oldRoles = new Set(oldM.roles.cache.keys());
    const newRoles = new Set(newM.roles.cache.keys());
    const added = [...newRoles].filter((r) => !oldRoles.has(r));
    const removed = [...oldRoles].filter((r) => !newRoles.has(r));
    if (added.length || removed.length) {
      const embed = logEmbed(added.length ? LOG_COLORS.ROLE_ADD : LOG_COLORS.ROLE_REMOVE)
        .setAuthor({ name: newM.user.tag, iconURL: newM.user.displayAvatarURL() })
        .setTitle('🎭 Rôles modifiés')
        .setDescription(`<@${newM.id}>`);
      if (added.length) embed.addFields({ name: 'Ajouté(s)', value: added.map((r) => `<@&${r}>`).join(', ') });
      if (removed.length) embed.addFields({ name: 'Retiré(s)', value: removed.map((r) => `<@&${r}>`).join(', ') });
      await postLog(client, embed);
    }

    // Nickname
    if (oldM.nickname !== newM.nickname) {
      const embed = logEmbed(LOG_COLORS.UPDATE)
        .setAuthor({ name: newM.user.tag, iconURL: newM.user.displayAvatarURL() })
        .setTitle('✏️ Pseudo serveur modifié')
        .setDescription(`<@${newM.id}>`)
        .addFields(
          { name: 'Avant', value: oldM.nickname ?? '*aucun*', inline: true },
          { name: 'Après', value: newM.nickname ?? '*aucun*', inline: true },
        );
      await postLog(client, embed);
    }

    // Timeout
    const oldTo = oldM.communicationDisabledUntilTimestamp;
    const newTo = newM.communicationDisabledUntilTimestamp;
    if (!oldTo && newTo) {
      const until = Math.floor(newTo / 1000);
      const embed = logEmbed(LOG_COLORS.UPDATE)
        .setAuthor({ name: newM.user.tag, iconURL: newM.user.displayAvatarURL() })
        .setTitle('🔇 Timeout appliqué')
        .setDescription(`<@${newM.id}>`)
        .addFields({ name: 'Jusqu\'à', value: `<t:${until}:F> (<t:${until}:R>)` });
      await postLog(client, embed);
    } else if (oldTo && (!newTo || newTo < Date.now())) {
      const embed = logEmbed(LOG_COLORS.UPDATE)
        .setAuthor({ name: newM.user.tag, iconURL: newM.user.displayAvatarURL() })
        .setTitle('🔊 Timeout levé')
        .setDescription(`<@${newM.id}>`);
      await postLog(client, embed);
    }
  });
}
