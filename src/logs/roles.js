import { Events } from 'discord.js';
import { logEmbed, postLog, LOG_COLORS } from './logger.js';

export function registerRoleLogs(client) {
  client.on(Events.GuildRoleCreate, async (role) => {
    const embed = logEmbed(LOG_COLORS.CREATE)
      .setTitle('🎭 Rôle créé')
      .setDescription(`${role}`)
      .addFields(
        { name: 'Nom', value: role.name, inline: true },
        { name: 'Couleur', value: role.hexColor, inline: true },
        { name: 'ID', value: '`' + role.id + '`', inline: true },
      );
    await postLog(client, embed);
  });

  client.on(Events.GuildRoleDelete, async (role) => {
    const embed = logEmbed(LOG_COLORS.DELETE)
      .setTitle('🎭 Rôle supprimé')
      .setDescription(`\`${role.name}\``)
      .addFields({ name: 'ID', value: '`' + role.id + '`', inline: true });
    await postLog(client, embed);
  });

  client.on(Events.GuildRoleUpdate, async (oldR, newR) => {
    const fields = [];
    if (oldR.name !== newR.name) fields.push({ name: 'Nom', value: `\`${oldR.name}\` → \`${newR.name}\`` });
    if (oldR.hexColor !== newR.hexColor) fields.push({ name: 'Couleur', value: `${oldR.hexColor} → ${newR.hexColor}`, inline: true });
    if (oldR.hoist !== newR.hoist) fields.push({ name: 'Affiché à part', value: `${oldR.hoist} → ${newR.hoist}`, inline: true });
    if (oldR.mentionable !== newR.mentionable) fields.push({ name: 'Mentionnable', value: `${oldR.mentionable} → ${newR.mentionable}`, inline: true });
    if (oldR.permissions.bitfield !== newR.permissions.bitfield) {
      const oldPerms = new Set(oldR.permissions.toArray());
      const newPerms = new Set(newR.permissions.toArray());
      const added = [...newPerms].filter((p) => !oldPerms.has(p));
      const removed = [...oldPerms].filter((p) => !newPerms.has(p));
      if (added.length) fields.push({ name: 'Permissions ajoutées', value: '`' + added.join('`, `') + '`' });
      if (removed.length) fields.push({ name: 'Permissions retirées', value: '`' + removed.join('`, `') + '`' });
    }
    if (fields.length === 0) return;

    const embed = logEmbed(LOG_COLORS.UPDATE)
      .setTitle('🎭 Rôle modifié')
      .setDescription(`${newR}`)
      .addFields(fields);
    await postLog(client, embed);
  });
}
