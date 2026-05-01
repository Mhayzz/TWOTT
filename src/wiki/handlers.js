import { MessageFlags } from 'discord.js';
import { buildSectionEmbed } from './panel.js';
import { errorEmbed } from '../lib/embeds.js';

export async function handleWikiInteraction(interaction) {
  const id = interaction.customId;
  if (!id?.startsWith('wiki:')) return;

  if (interaction.isStringSelectMenu() && id === 'wiki:section') {
    const sectionId = interaction.values[0];
    const embed = buildSectionEmbed(sectionId);
    if (!embed) {
      await interaction.reply({
        embeds: [errorEmbed('Section introuvable', `Aucune section avec l'ID \`${sectionId}\`.`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
