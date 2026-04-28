import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import prisma from '../lib/prisma.js';
import { fetchServerStatus } from '../lib/mcStatus.js';
import { successEmbed, errorEmbed, infoEmbed } from '../lib/embeds.js';
import { formatStatusName } from '../jobs/statusUpdater.js';

const MC_HOST = process.env.MC_SERVER_HOST ?? 'play.saochronicles.fr';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configurer les salons vocaux IP / statut serveur')
    .addSubcommand((s) => s.setName('create').setDescription('Crée les deux salons vocaux verrouillés en haut du serveur'))
    .addSubcommand((s) => s.setName('remove').setDescription('Supprime les salons créés par /setup'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create') return doCreate(interaction);
    if (sub === 'remove') return doRemove(interaction);
  },
};

async function doCreate(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const botMember = interaction.guild.members.me;
  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await interaction.editReply({
      embeds: [errorEmbed('Permission manquante', 'Le bot a besoin de **Gérer les salons** pour créer les vocaux.')],
    });
    return;
  }

  const overwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.Connect],
      allow: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: botMember.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.Connect,
      ],
    },
  ];

  const ipChannel = await interaction.guild.channels.create({
    name: `📡・${MC_HOST}`,
    type: ChannelType.GuildVoice,
    position: 0,
    permissionOverwrites: overwrites,
    reason: 'TWOTT bot — IP channel',
  });

  const status = await fetchServerStatus();
  const statusChannel = await interaction.guild.channels.create({
    name: formatStatusName(status),
    type: ChannelType.GuildVoice,
    position: 1,
    permissionOverwrites: overwrites,
    reason: 'TWOTT bot — Status channel',
  });

  await prisma.guildConfig.upsert({
    where: { guildId: interaction.guildId },
    create: {
      guildId: interaction.guildId,
      ipChannelId: ipChannel.id,
      statusChannelId: statusChannel.id,
    },
    update: {
      ipChannelId: ipChannel.id,
      statusChannelId: statusChannel.id,
    },
  });

  await interaction.editReply({
    embeds: [
      successEmbed(
        '✅ Salons créés',
        `${ipChannel} et ${statusChannel} ont été créés et placés en haut du serveur.\n\n` +
          `Le statut sera mis à jour automatiquement (toutes les ${process.env.STATUS_UPDATE_INTERVAL_MINUTES ?? 5} min).\n` +
          `*Conseil : tu peux les déplacer dans une catégorie existante en glisser-déposer si besoin.*`,
      ),
    ],
  });
}

async function doRemove(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
  if (!config?.ipChannelId && !config?.statusChannelId) {
    await interaction.editReply({ embeds: [infoEmbed('Rien à supprimer', 'Aucun salon enregistré.')] });
    return;
  }

  for (const id of [config.ipChannelId, config.statusChannelId].filter(Boolean)) {
    const ch = await interaction.guild.channels.fetch(id).catch(() => null);
    if (ch) await ch.delete('TWOTT /setup remove').catch(() => {});
  }

  await prisma.guildConfig.update({
    where: { guildId: interaction.guildId },
    data: { ipChannelId: null, statusChannelId: null },
  });

  await interaction.editReply({ embeds: [successEmbed('Salons supprimés', 'Les salons IP et statut ont été retirés.')] });
}
