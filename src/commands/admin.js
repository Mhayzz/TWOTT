import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { buildPanelEmbed, buildPanelButtons } from '../admin/panel.js';
import { errorEmbed, successEmbed, baseEmbed, infoEmbed, COLORS } from '../lib/embeds.js';
import { RANKS } from '../lib/roles.js';
import prisma from '../lib/prisma.js';

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
    .addSubcommand((s) =>
      s
        .setName('setrankrole')
        .setDescription('Lier un rang de guilde à un rôle Discord')
        .addStringOption((o) =>
          o
            .setName('rang')
            .setDescription('Rang de la guilde')
            .setRequired(true)
            .addChoices(...RANKS.map((r) => ({ name: r, value: r }))),
        )
        .addRoleOption((o) =>
          o.setName('role').setDescription('Rôle Discord à attribuer (laisser vide pour supprimer le lien)').setRequired(false),
        ),
    )
    .addSubcommand((s) => s.setName('viewconfig').setDescription('Voir la configuration des rôles de rangs'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') return doPanel(interaction);
    if (sub === 'setrankrole') return doSetRankRole(interaction);
    if (sub === 'viewconfig') return doViewConfig(interaction);
  },
};

async function doPanel(interaction) {
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
}

async function doSetRankRole(interaction) {
  const rank = interaction.options.getString('rang', true);
  const role = interaction.options.getRole('role');

  const config = await prisma.guildConfig.upsert({
    where: { guildId: interaction.guildId },
    create: { guildId: interaction.guildId, rankRoleMap: {} },
    update: {},
  });

  const map = (config.rankRoleMap ?? {});

  if (!role) {
    delete map[rank];
    await prisma.guildConfig.update({
      where: { guildId: interaction.guildId },
      data: { rankRoleMap: map },
    });
    await interaction.reply({
      embeds: [infoEmbed('Lien supprimé', `Le rang **${rank}** n'a plus de rôle Discord associé.`)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Warn if bot can't manage this role (hierarchy)
  const botMember = interaction.guild.members.me;
  const warnings = [];
  if (role.managed) {
    warnings.push('⚠️ Ce rôle est géré par une intégration externe, le bot ne pourra pas l\'attribuer.');
  } else if (botMember.roles.highest.comparePositionTo(role) <= 0) {
    warnings.push('⚠️ Ce rôle est **au-dessus** du rôle du bot dans la hiérarchie — l\'attribution échouera silencieusement. Place le rôle du bot plus haut dans les paramètres du serveur Discord.');
  }

  map[rank] = role.id;
  await prisma.guildConfig.update({
    where: { guildId: interaction.guildId },
    data: { rankRoleMap: map },
  });

  const desc = [`**${rank}** → ${role} (\`${role.id}\`)`, ...warnings].join('\n');
  await interaction.reply({
    embeds: [successEmbed('Rôle configuré', desc)],
    flags: MessageFlags.Ephemeral,
  });
}

async function doViewConfig(interaction) {
  const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guildId } });
  const map = config?.rankRoleMap ?? {};

  const rankLines = RANKS.map((r) => {
    const roleId = map[r];
    return roleId ? `• **${r}** → <@&${roleId}>` : `• **${r}** → *non configuré*`;
  }).join('\n');

  const classMap = config?.classRoleMap ?? {};
  const classLines = Object.entries(classMap).length
    ? Object.entries(classMap).map(([c, id]) => `• **${c}** → <@&${id}>`).join('\n')
    : '*Aucune classe configurée*';

  await interaction.reply({
    embeds: [
      baseEmbed(COLORS.PRIMARY)
        .setTitle('⚙️ Configuration des rôles')
        .addFields(
          { name: 'Rangs', value: rankLines, inline: false },
          { name: 'Classes', value: classLines, inline: false },
        ),
    ],
    flags: MessageFlags.Ephemeral,
  });
}
