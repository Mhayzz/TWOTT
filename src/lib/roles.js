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

export async function applyAutoRoles(guild, member) {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });
    if (!config) return;
    const guildMember = await guild.members.fetch(member.discordId).catch(() => null);
    if (!guildMember) return;

    const toAdd = [];
    const toRemove = [];

    if (config.classRoleMap) {
      const allClassRoles = Object.values(config.classRoleMap);
      const desired = member.className ? config.classRoleMap[member.className] : null;
      for (const r of allClassRoles) {
        if (r !== desired && guildMember.roles.cache.has(r)) toRemove.push(r);
      }
      if (desired && !guildMember.roles.cache.has(desired)) toAdd.push(desired);
    }

    if (config.rankRoleMap) {
      const allRankRoles = Object.values(config.rankRoleMap);
      const desired = config.rankRoleMap[member.rank] ?? null;
      for (const r of allRankRoles) {
        if (r !== desired && guildMember.roles.cache.has(r)) toRemove.push(r);
      }
      if (desired && !guildMember.roles.cache.has(desired)) toAdd.push(desired);
    }

    if (toRemove.length) await guildMember.roles.remove(toRemove).catch(() => {});
    if (toAdd.length) await guildMember.roles.add(toAdd).catch(() => {});
  } catch (err) {
    console.warn('applyAutoRoles:', err.message);
  }
}
