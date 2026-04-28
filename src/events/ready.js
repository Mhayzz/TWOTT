import { Events, ActivityType } from 'discord.js';
import { startStatusUpdater } from '../jobs/statusUpdater.js';
import { startRaidReminders } from '../jobs/raidReminders.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: 'SAO Chronicles', type: ActivityType.Playing }],
      status: 'online',
    });

    startStatusUpdater(client);
    startRaidReminders(client);
  },
};
