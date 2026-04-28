import { Events } from 'discord.js';
import { logEmbed, postLog, LOG_COLORS } from './logger.js';

export function registerVoiceLogs(client) {
  client.on(Events.VoiceStateUpdate, async (oldS, newS) => {
    const member = newS.member ?? oldS.member;
    if (!member || member.user.bot) return;

    const author = { name: member.user.tag, iconURL: member.user.displayAvatarURL() };

    // Join
    if (!oldS.channelId && newS.channelId) {
      const embed = logEmbed(LOG_COLORS.VOICE_JOIN)
        .setAuthor(author)
        .setTitle('🔊 Connexion vocale')
        .setDescription(`<@${member.id}> a rejoint <#${newS.channelId}>`);
      await postLog(client, embed);
      return;
    }

    // Leave
    if (oldS.channelId && !newS.channelId) {
      const embed = logEmbed(LOG_COLORS.VOICE_LEAVE)
        .setAuthor(author)
        .setTitle('🔇 Déconnexion vocale')
        .setDescription(`<@${member.id}> a quitté <#${oldS.channelId}>`);
      await postLog(client, embed);
      return;
    }

    // Move
    if (oldS.channelId && newS.channelId && oldS.channelId !== newS.channelId) {
      const embed = logEmbed(LOG_COLORS.VOICE_MOVE)
        .setAuthor(author)
        .setTitle('↔️ Changement de salon vocal')
        .setDescription(`<@${member.id}> : <#${oldS.channelId}> → <#${newS.channelId}>`);
      await postLog(client, embed);
      return;
    }

    // Server mute/deafen toggles (only if same channel)
    if (oldS.channelId === newS.channelId) {
      const changes = [];
      if (oldS.serverMute !== newS.serverMute) changes.push(`Server mute : ${oldS.serverMute} → ${newS.serverMute}`);
      if (oldS.serverDeaf !== newS.serverDeaf) changes.push(`Server deaf : ${oldS.serverDeaf} → ${newS.serverDeaf}`);
      if (changes.length) {
        const embed = logEmbed(LOG_COLORS.UPDATE)
          .setAuthor(author)
          .setTitle('🎙️ État vocal modifié')
          .setDescription(`<@${member.id}> dans <#${newS.channelId}>`)
          .addFields({ name: 'Changements', value: changes.join('\n') });
        await postLog(client, embed);
      }
    }
  });
}
