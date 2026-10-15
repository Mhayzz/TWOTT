import { Events, ActivityType } from 'discord.js';
import { IS_LITE } from '../lib/mode.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Connecté en tant que ${client.user.tag}${IS_LITE ? ' — mode lite' : ''}`);
    client.user.setPresence({
      activities: [{ name: '⚔️│ᴘʟᴀʏ.ꜱᴀᴏᴄʜʀᴏɴɪᴄʟᴇꜱ.ɴᴇᴛ', type: ActivityType.Playing }],
      status: 'online',
    });

    // Mode lite : pas de jobs, pas de logs, pas de base de données.
    if (IS_LITE) return;

    // Imports dynamiques : en mode lite ces modules (et Prisma) ne sont jamais chargés.
    const { startStatusUpdater } = await import('../jobs/statusUpdater.js');
    const { setupLogging } = await import('../logs/index.js');
    const { startVoiceTracker } = await import('../voice/tracker.js');
    const { startVoiceLeaderboard } = await import('../jobs/voiceLeaderboard.js');
    startStatusUpdater(client);
    setupLogging(client);
    startVoiceTracker(client);
    startVoiceLeaderboard(client);
  },
};
