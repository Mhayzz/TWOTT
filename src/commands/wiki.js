import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { buildIndexEmbed, buildSelectMenu } from '../wiki/panel.js';
import { successEmbed, errorEmbed } from '../lib/embeds.js';

const DEFAULT_WIKI_CHANNEL_ID = process.env.WIKI_CHANNEL_ID ?? '1418179782796906518';

export default {
  data: new SlashCommandBuilder()
    .setName('wiki')
    .setDescription('Outils du wiki TWOTT')
    .addSubcommand((s) =>
      s
        .setName('post')
        .setDescription('Publier le wiki (index + dropdown) dans un salon')
        .addChannelOption((o) =>
          o
            .setName('salon')
            .setDescription('Salon cible (par défaut : salon configuré)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'post') return;

    let channel = interaction.options.getChannel('salon');
    if (!channel && DEFAULT_WIKI_CHANNEL_ID) {
      channel = await interaction.guild.channels.fetch(DEFAULT_WIKI_CHANNEL_ID).catch(() => null);
    }
    if (!channel) channel = interaction.channel;

    if (!channel.permissionsFor(interaction.guild.members.me)?.has(['SendMessages', 'EmbedLinks'])) {
      await interaction.reply({
        embeds: [errorEmbed('Permissions manquantes', `Le bot ne peut pas écrire dans ${channel}.`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await channel.send({ embeds: [buildIndexEmbed()], components: [buildSelectMenu()] });
    await interaction.reply({
      embeds: [successEmbed('Wiki posté', `L'index du wiki est en place dans ${channel}.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
