import { Events, MessageFlags } from 'discord.js';
import { handleRaidButton } from '../commands/raid.js';
import { errorEmbed } from '../lib/embeds.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction, client);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('raid:')) {
        await handleRaidButton(interaction);
        return;
      }
    } catch (err) {
      console.error('Erreur interaction:', err);
      const payload = {
        embeds: [errorEmbed('Erreur', 'Une erreur est survenue lors du traitement.')],
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
