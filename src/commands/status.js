import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import prisma from '../lib/prisma.js';
import { fetchServerStatus, buildStatusEmbed } from '../lib/mcStatus.js';
import { successEmbed } from '../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Statut du serveur Minecraft SAO Chronicles')
    .addSubcommand((s) => s.setName('show').setDescription('Afficher le statut maintenant'))
    .addSubcommand((s) =>
      s
        .setName('setchannel')
        .setDescription('Définir le salon de mise à jour automatique du statut')
        .addChannelOption((o) => o.setName('salon').setDescription('Salon cible').setRequired(true)),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'show') {
      await interaction.deferReply();
      const s = await fetchServerStatus();
      await interaction.editReply({ embeds: [buildStatusEmbed(s)] });
      return;
    }

    if (sub === 'setchannel') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
          content: 'Permission `Gérer le serveur` requise.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const channel = interaction.options.getChannel('salon', true);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const s = await fetchServerStatus();
      const sent = await channel.send({ embeds: [buildStatusEmbed(s)] });

      await prisma.guildConfig.upsert({
        where: { guildId: interaction.guildId },
        update: { statusChannelId: channel.id, statusMessageId: sent.id },
        create: { guildId: interaction.guildId, statusChannelId: channel.id, statusMessageId: sent.id },
      });

      await interaction.editReply({
        embeds: [successEmbed('Salon configuré', `Le statut sera mis à jour automatiquement dans ${channel}.`)],
      });
    }
  },
};
