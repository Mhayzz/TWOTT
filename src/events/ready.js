import { Events, ActivityType } from 'discord.js';
import { startStatusUpdater } from '../jobs/statusUpdater.js';
import { setupLogging } from '../logs/index.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: '⚔️│ᴘʟᴀʏ.ꜱᴀᴏᴄʜʀᴏɴɪᴄʟᴇꜱ.ɴᴇᴛ', type: ActivityType.Playing }],
      status: 'online',
    });
    startStatusUpdater(client);
    setupLogging(client);
  },
};
