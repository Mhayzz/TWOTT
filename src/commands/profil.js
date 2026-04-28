import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import prisma from '../lib/prisma.js';
import { baseEmbed, errorEmbed, COLORS } from '../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Afficher la fiche d\'un membre de la guilde')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Membre à consulter (toi par défaut)').setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('membre') ?? interaction.user;
    const member = await prisma.member.findUnique({ where: { discordId: target.id } });

    if (!member) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            'Membre non inscrit',
            target.id === interaction.user.id
              ? 'Utilise `/inscription` pour rejoindre la guilde.'
              : `${target} n'est pas inscrit dans la guilde.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const raidCount = await prisma.raidParticipant.count({
      where: { memberId: member.id, status: 'PRESENT' },
    });

    await interaction.reply({
      embeds: [
        baseEmbed(COLORS.PRIMARY)
          .setTitle(`Fiche de ${target.username}`)
          .setThumbnail(target.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: 'Pseudo MC', value: '`' + member.mcUsername + '`', inline: true },
            { name: 'Classe', value: member.className ?? '—', inline: true },
            { name: 'Rang', value: member.rank, inline: true },
            { name: 'Membre depuis', value: `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`, inline: true },
            { name: 'Raids effectués', value: String(raidCount), inline: true },
          ),
      ],
    });
  },
};
