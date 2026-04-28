import { EmbedBuilder } from 'discord.js';

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID ?? '1418179783405342794';

export const LOG_COLORS = {
  JOIN: 0x2ecc71,
  LEAVE: 0xe67e22,
  BAN: 0xe74c3c,
  UNBAN: 0x2ecc71,
  KICK: 0xe74c3c,
  ROLE_ADD: 0x3498db,
  ROLE_REMOVE: 0x95a5a6,
  CREATE: 0x2ecc71,
  DELETE: 0xe74c3c,
  UPDATE: 0xf39c12,
  VOICE_JOIN: 0x2ecc71,
  VOICE_LEAVE: 0xe67e22,
  VOICE_MOVE: 0x9b59b6,
  MESSAGE_EDIT: 0xf39c12,
  MESSAGE_DELETE: 0xe74c3c,
  INVITE: 0x1abc9c,
};

export function logEmbed(color) {
  return new EmbedBuilder().setColor(color).setTimestamp();
}

export async function postLog(client, embed) {
  if (!LOG_CHANNEL_ID) return;
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel) return;
    await channel.send({ embeds: Array.isArray(embed) ? embed : [embed] });
  } catch (err) {
    console.warn('postLog failed:', err.message);
  }
}

export async function findAuditEntry(guild, type, targetId, withinMs = 5000) {
  try {
    const audits = await guild.fetchAuditLogs({ type, limit: 5 });
    return audits.entries.find((e) => (!targetId || e.targetId === targetId) && Date.now() - e.createdTimestamp < withinMs) ?? null;
  } catch {
    return null;
  }
}

export function addExecutor(embed, executor, label = 'Par') {
  if (executor) {
    embed.addFields({ name: label, value: `<@${executor.id}>`, inline: true });
  }
  return embed;
}
