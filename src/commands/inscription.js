import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import prisma from '../lib/prisma.js';
import { errorEmbed, baseEmbed, COLORS } from '../lib/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inscription')
    .setDescription('Rejoindre la guilde The Wolves Of The Trinity')
    .addStringOption((o) =>
      o.setName('pseudo_mc').setDescription('Ton pseudo Minecraft').setRequired(true).setMaxLength(32),
    )
    .addStringOption((o) =>
      o.setName('classe').setDescription('Ta classe / spécialité').setRequired(false).setMaxLength(40),
    ),

  async execute(interaction) {
    const discordId = interaction.user.id;
    const mcUsername = interaction.options.getString('pseudo_mc', true).trim();
    const className = interaction.options.getString('classe')?.trim() || null;

    if (!/^[A-Za-z0-9_]{3,16}$/.test(mcUsername)) {
      await interaction.reply({
        embeds: [errorEmbed('Pseudo invalide', 'Un pseudo Minecraft fait 3 à 16 caractères (lettres, chiffres, _).')],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const member = await prisma.member.upsert({
      where: { discordId },
      update: { mcUsername, className: className ?? undefined },
      create: { discordId, mcUsername, className, rank: 'Recrue' },
    });

    await applyRoles(interaction, member);

    await interaction.reply({
      embeds: [
        baseEmbed(COLORS.PRIMARY)
          .setTitle('🐺 Bienvenue dans la meute')
          .setDescription(`<@${discordId}> a rejoint **The Wolves Of The Trinity**.`)
          .addFields(
            { name: 'Pseudo MC', value: '`' + mcUsername + '`', inline: true },
            { name: 'Classe', value: className ?? '—', inline: true },
            { name: 'Rang', value: member.rank, inline: true },
          ),
      ],
    });
  },
};

async function applyRoles(interaction, member) {
  try {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
    if (!config) return;
    const guildMember = await interaction.guild.members.fetch(member.discordId);
    const toAdd = [];
    if (member.className && config.classRoleMap?.[member.className]) {
      toAdd.push(config.classRoleMap[member.className]);
    }
    if (config.rankRoleMap?.[member.rank]) {
      toAdd.push(config.rankRoleMap[member.rank]);
    }
    if (toAdd.length) await guildMember.roles.add(toAdd).catch(() => {});
  } catch (err) {
    console.warn('Auto-rôles: échec', err.message);
  }
}

