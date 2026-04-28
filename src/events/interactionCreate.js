import { Events, MessageFlags } from 'discord.js';
import { errorEmbed } from '../lib/embeds.js';
import { handleTicketInteraction } from '../tickets/handlers.js';

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

      const id = interaction.customId;
      if (!id) return;

      if (id.startsWith('ticket:')) {
        await handleTicketInteraction(interaction);
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
