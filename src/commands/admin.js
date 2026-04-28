import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { buildPanelEmbed, buildPanelButtons } from '../admin/panel.js';
import { errorEmbed, successEmbed } from '../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Outils admin de la guilde')
    .addSubcommand((s) =>
      s
        .setName('panel')
        .setDescription('Poster le panneau admin dans un salon')
        .addChannelOption((o) =>
          o
            .setName('salon')
            .setDescription('Salon cible (par défaut : salon courant)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'panel') return;

    const channel = interaction.options.getChannel('salon') ?? interaction.channel;

    if (!channel.permissionsFor(interaction.guild.members.me)?.has(['SendMessages', 'EmbedLinks'])) {
      await interaction.reply({
        embeds: [errorEmbed('Permissions manquantes', `Le bot ne peut pas écrire dans ${channel}.`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await channel.send({ embeds: [buildPanelEmbed()], components: buildPanelButtons() });
    await interaction.reply({
      embeds: [successEmbed('Panneau posté', `Le panel admin est en place dans ${channel}.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
