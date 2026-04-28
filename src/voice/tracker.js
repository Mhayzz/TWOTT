import { Events } from 'discord.js';
import prisma from '../lib/prisma.js';

// In-memory map: userId -> { joinedAt: timestamp, guildId }
const activeSessions = new Map();

function key(guildId, userId) {
  return `${guildId}:${userId}`;
}

export function startVoiceTracker(client) {
  // Initial sync: start tracking everyone currently in voice (in case of bot restart)
  for (const guild of client.guilds.cache.values()) {
    for (const channel of guild.channels.cache.values()) {
      if (!channel.isVoiceBased?.()) continue;
      for (const member of channel.members.values()) {
        if (member.user.bot) continue;
        activeSessions.set(key(guild.id, member.id), { joinedAt: Date.now(), guildId: guild.id });
      }
    }
  }

  client.on(Events.VoiceStateUpdate, async (oldS, newS) => {
    const member = newS.member ?? oldS.member;
    if (!member || member.user.bot) return;
    const guildId = (newS.guild ?? oldS.guild).id;
    const k = key(guildId, member.id);

    // Joining voice
    if (!oldS.channelId && newS.channelId) {
      activeSessions.set(k, { joinedAt: Date.now(), guildId });
      return;
    }

    // Leaving voice
    if (oldS.channelId && !newS.channelId) {
      const session = activeSessions.get(k);
      if (!session) return;
      activeSessions.delete(k);
      const durationSec = Math.max(0, Math.floor((Date.now() - session.joinedAt) / 1000));
      if (durationSec < 5) return; // ignore noise
      try {
        await prisma.voiceSession.create({
          data: {
            guildId,
            userId: member.id,
            joinedAt: new Date(session.joinedAt),
            leftAt: new Date(),
            durationSec,
          },
        });
      } catch (err) {
        console.warn('voice session save failed:', err.message);
      }
    }

    // Move between channels: keep tracking, don't create a new session
  });

  // Graceful shutdown: persist any currently active sessions
  const flush = async () => {
    for (const [k, session] of activeSessions.entries()) {
      const userId = k.split(':')[1];
      const durationSec = Math.max(0, Math.floor((Date.now() - session.joinedAt) / 1000));
      if (durationSec < 5) continue;
      await prisma.voiceSession.create({
        data: {
          guildId: session.guildId,
          userId,
          joinedAt: new Date(session.joinedAt),
          leftAt: new Date(),
          durationSec,
        },
      }).catch(() => {});
    }
    activeSessions.clear();
  };
  process.on('SIGTERM', flush);
  process.on('SIGINT', flush);

  console.log(`Voice tracker démarré (${activeSessions.size} sessions actives)`);
}

export function getActiveSession(guildId, userId) {
  return activeSessions.get(key(guildId, userId));
}

export function formatDuration(seconds) {
  if (seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts = [];
  if (days) parts.push(`${days}j`);
  if (hours) parts.push(`${hours}h`);
  if (mins) parts.push(`${mins}m`);
  if (secs && !days && !hours) parts.push(`${secs}s`);
  return parts.join(' ') || '0s';
}
