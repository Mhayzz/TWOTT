import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { baseEmbed, errorEmbed, successEmbed, COLORS } from '../lib/embeds.js';

const MC_HOST = process.env.MC_SERVER_HOST ?? 'play.saochronicles.fr';
const MC_VERSION = '1.21.1';

function buildConnectionEmbed() {
  return baseEmbed(COLORS.SAO_BLUE)
    .setTitle('⚔️ SAO Chronicles — Connexion au serveur')
    .setDescription(
      [
        '> *"You are a Swordsman. Fight. Clear the game."*',
        '',
        'Pour rejoindre l\'aventure, lance **Minecraft Java Edition** et entre les informations ci-dessous.',
      ].join('\n'),
    )
    .addFields(
      {
        name: '🖥️ Adresse IP',
        value: '```' + MC_HOST + '```',
        inline: false,
      },
      {
        name: '📦 Version requise',
        value: '```Java Edition ' + MC_VERSION + '```',
        inline: false,
      },
      {
        name: '📋 Comment se connecter',
        value: [
          '1. Lance Minecraft **Java Edition ' + MC_VERSION + '**',
          '2. Menu principal → **Multijoueur**',
          '3. **Ajouter un serveur**',
          '4. Colle l\'IP : `' + MC_HOST + '`',
          '5. Rejoins et vis l\'aventure !',
        ].join('\n'),
        inline: false,
      },
    )
    .setFooter({ text: 'The Wolves Of The Trinity • SAO Chronicles' });
}

export default {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Infos du serveur SAO Chronicles')
    .addSubcommand((s) =>
      s
        .setName('panel')
        .setDescription('Poster le message de connexion au serveur dans un salon')
        .addChannelOption((o) =>
          o
            .setName('salon')
            .setDescription('Salon cible (par défaut : salon courant)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .addSubcommand((s) => s.setName('info').setDescription('Afficher les infos de connexion ici'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'info') {
      await interaction.reply({ embeds: [buildConnectionEmbed()] });
      return;
    }

    if (sub === 'panel') {
      const channel = interaction.options.getChannel('salon') ?? interaction.channel;
      if (!channel.permissionsFor(interaction.guild.members.me)?.has(['SendMessages', 'EmbedLinks'])) {
        await interaction.reply({
          embeds: [errorEmbed('Permissions manquantes', `Le bot ne peut pas écrire dans ${channel}.`)],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await channel.send({ embeds: [buildConnectionEmbed()] });
      await interaction.reply({
        embeds: [successEmbed('Message posté', `Les infos de connexion sont dans ${channel}.`)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
