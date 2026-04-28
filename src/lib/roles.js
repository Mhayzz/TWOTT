import prisma from './prisma.js';

export const RANKS = ['Recrue', 'Aventurier', 'Vétéran', 'Cartographe', 'Stratège', 'Co-Guild Master', 'Guild Master'];

export function nextRank(current) {
  const i = RANKS.indexOf(current);
  if (i === -1 || i === RANKS.length - 1) return null;
  return RANKS[i + 1];
}

export function previousRank(current) {
  const i = RANKS.indexOf(current);
  if (i <= 0) return null;
  return RANKS[i - 1];
}

/**
 * Apply class/rank roles based on the member's stored data.
 * Returns a diagnostic so callers can surface what happened to the admin.
 */
export async function applyAutoRoles(guild, member) {
  const result = {
    ok: true,
    added: [],
    removed: [],
    warnings: [],
  };

  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });
    if (!config) {
      result.warnings.push('Aucune configuration de rôles. Utilise `/admin setrankrole` pour mapper les rangs.');
      return result;
    }

    const guildMember = await guild.members.fetch(member.discordId).catch(() => null);
    if (!guildMember) {
      result.ok = false;
      result.warnings.push('Le membre Discord est introuvable sur le serveur.');
      return result;
    }

    const botMember = guild.members.me;
    const botTopRole = botMember.roles.highest;
    const canManageRoles = botMember.permissions.has('ManageRoles');
    if (!canManageRoles) {
      result.ok = false;
      result.warnings.push('Le bot n\'a pas la permission **Gérer les rôles**.');
      return result;
    }

    const toAdd = [];
    const toRemove = [];

    // Class roles
    if (config.classRoleMap && Object.keys(config.classRoleMap).length > 0) {
      const allClassRoles = Object.values(config.classRoleMap);
      const desired = member.className ? config.classRoleMap[member.className] : null;
      for (const r of allClassRoles) {
        if (r !== desired && guildMember.roles.cache.has(r)) toRemove.push(r);
      }
      if (desired && !guildMember.roles.cache.has(desired)) toAdd.push(desired);
    }

    // Rank roles
    if (config.rankRoleMap && Object.keys(config.rankRoleMap).length > 0) {
      const allRankRoles = Object.values(config.rankRoleMap);
      const desired = config.rankRoleMap[member.rank] ?? null;
      if (member.rank && !desired) {
        result.warnings.push(`Le rang **${member.rank}** n'est pas mappé. Utilise \`/admin setrankrole rang:${member.rank} role:@…\`.`);
      }
      for (const r of allRankRoles) {
        if (r !== desired && guildMember.roles.cache.has(r)) toRemove.push(r);
      }
      if (desired && !guildMember.roles.cache.has(desired)) toAdd.push(desired);
    } else {
      result.warnings.push('Aucun rang n\'est mappé à un rôle Discord. Utilise `/admin setrankrole`.');
    }

    // Hierarchy check before applying
    const filteredAdd = [];
    for (const roleId of toAdd) {
      const role = guild.roles.cache.get(roleId);
      if (!role) {
        result.warnings.push(`Rôle introuvable (\`${roleId}\`) — supprimé du serveur ?`);
        continue;
      }
      if (role.managed) {
        result.warnings.push(`Le rôle ${role} est géré par une intégration externe, impossible de l'attribuer.`);
        continue;
      }
      if (botTopRole.comparePositionTo(role) <= 0) {
        result.ok = false;
        result.warnings.push(`Le rôle ${role} est **au-dessus** du rôle du bot. Place le rôle du bot plus haut dans la hiérarchie.`);
        continue;
      }
      filteredAdd.push(roleId);
    }

    const filteredRemove = [];
    for (const roleId of toRemove) {
      const role = guild.roles.cache.get(roleId);
      if (!role) continue;
      if (botTopRole.comparePositionTo(role) <= 0) {
        result.warnings.push(`Le rôle ${role} ne peut pas être retiré (au-dessus du bot).`);
        continue;
      }
      filteredRemove.push(roleId);
    }

    if (filteredRemove.length) {
      try {
        await guildMember.roles.remove(filteredRemove);
        result.removed = filteredRemove;
      } catch (err) {
        result.ok = false;
        result.warnings.push(`Échec du retrait : ${err.message}`);
      }
    }

    if (filteredAdd.length) {
      try {
        await guildMember.roles.add(filteredAdd);
        result.added = filteredAdd;
      } catch (err) {
        result.ok = false;
        result.warnings.push(`Échec de l'attribution : ${err.message}`);
      }
    }
  } catch (err) {
    result.ok = false;
    result.warnings.push(`Erreur interne : ${err.message}`);
    console.warn('applyAutoRoles:', err);
  }

  return result;
}

export function summarizeRolesResult(result) {
  if (!result) return '';
  const lines = [];
  if (result.added.length) lines.push(`✅ Rôle(s) ajouté(s) : ${result.added.map((r) => `<@&${r}>`).join(', ')}`);
  if (result.removed.length) lines.push(`➖ Rôle(s) retiré(s) : ${result.removed.map((r) => `<@&${r}>`).join(', ')}`);
  if (result.warnings.length) lines.push('⚠️ ' + result.warnings.join('\n⚠️ '));
  return lines.join('\n');
}
