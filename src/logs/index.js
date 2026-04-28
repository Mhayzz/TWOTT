import { registerMemberLogs } from './members.js';
import { registerChannelLogs } from './channels.js';
import { registerRoleLogs } from './roles.js';
import { registerVoiceLogs } from './voice.js';
import { registerMessageLogs } from './messages.js';
import { registerGuildLogs } from './guild.js';

export function setupLogging(client) {
  registerMemberLogs(client);
  registerChannelLogs(client);
  registerRoleLogs(client);
  registerVoiceLogs(client);
  registerMessageLogs(client);
  registerGuildLogs(client);
  console.log('Logging events registered');
}
