import { Events, MessageFlags } from 'discord.js';
import { errorEmbed, infoEmbed } from '../lib/embeds.js';
import { handleReglementButton } from '../commands/reglement.js';
import { handleWikiInteraction } from '../wiki/handlers.js';
import { IS_LITE } from '../lib/mode.js';

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

      if (id.startsWith('reglement:')) {
        await handleReglementButton(interaction);
        return;
      }

      if (id.startsWith('wiki:')) {
        await handleWikiInteraction(interaction);
        return;
      }

      if (id.startsWith('ticket:')) {
        if (IS_LITE) {
          await interaction.reply({
            embeds: [infoEmbed('⏸️ Candidatures en pause', 'Les candidatures sont fermées pour le moment. Reviens plus tard !')],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        // Import dynamique : le système de tickets (et Prisma) n'est chargé qu'en mode complet.
        const { handleTicketInteraction } = await import('../tickets/handlers.js');
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
