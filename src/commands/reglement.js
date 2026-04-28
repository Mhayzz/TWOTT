import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { baseEmbed, successEmbed, errorEmbed, infoEmbed, COLORS } from '../lib/embeds.js';

const VISITOR_ROLE_ID = process.env.VISITOR_ROLE_ID ?? '1418179781408854091';
const DEFAULT_REGLEMENT_CHANNEL_ID = process.env.REGLEMENT_CHANNEL_ID ?? '1418179782553899131';

function buildReglementEmbed() {
  return baseEmbed(COLORS.PRIMARY)
    .setTitle('📜 Règlement — The Wolves Of The Trinity')
    .setDescription(
      [
        '> *"Vis ou meurs… ensemble."*',
        '',
        '**1. Respect** — Aucun manque de respect, harcèlement ou discrimination.',
        '**2. Spam & pub** — Pas de spam, flood ou publicité non autorisée.',
        '**3. Contenu** — Pas de NSFW, contenu illégal ou choquant.',
        '**4. Salons** — Utilise les salons appropriés à chaque sujet.',
        '**5. Staff** — Respecte les décisions du staff. Pas de MP non sollicité.',
        '**6. Confidentialité** — Pas de partage d\'infos personnelles d\'autres membres.',
        '',
        'En cliquant sur **✅ J\'accepte le règlement**, tu confirmes avoir lu et accepté ces règles.',
        'Tu recevras alors le rôle **Visiteur** et auras accès au reste du serveur.',
      ].join('\n'),
    )
    .setFooter({ text: 'TWOTT • Règlement' });
}

function buildReglementButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('reglement:accept')
      .setLabel("J'accepte le règlement")
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
  );
}

export async function handleReglementButton(interaction) {
  if (interaction.customId !== 'reglement:accept') return;

  const role =
    interaction.guild.roles.cache.get(VISITOR_ROLE_ID) ??
    (await interaction.guild.roles.fetch(VISITOR_ROLE_ID).catch(() => null));

  if (!role) {
    await interaction.reply({
      embeds: [errorEmbed('Configuration manquante', 'Rôle visiteur introuvable. Contacte un admin.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = interaction.member;
  if (member.roles.cache.has(role.id)) {
    await interaction.reply({
      embeds: [infoEmbed('Déjà accepté', `Tu as déjà accepté le règlement et tu as le rôle ${role}.`)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const botTop = interaction.guild.members.me.roles.highest;
  if (botTop.comparePositionTo(role) <= 0) {
    await interaction.reply({
      embeds: [errorEmbed('Hiérarchie incorrecte', `Le rôle ${role} est au-dessus du bot. Contacte un admin.`)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await member.roles.add(role, 'Acceptation du règlement');
    await interaction.reply({
      embeds: [
        successEmbed(
          '🐺 Bienvenue dans la meute',
          `Tu as accepté le règlement et reçu le rôle ${role}.\nTu peux maintenant explorer le serveur.`,
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('reglement:accept role assign failed:', err.message);
    await interaction.reply({
      embeds: [errorEmbed('Erreur', `Impossible d'attribuer le rôle : ${err.message}`)],
      flags: MessageFlags.Ephemeral,
    });
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('reglement')
    .setDescription('Gestion du règlement')
    .addSubcommand((s) =>
      s
        .setName('post')
        .setDescription("Poster le règlement avec le bouton d'acceptation")
        .addChannelOption((o) =>
          o
            .setName('salon')
            .setDescription('Salon cible (par défaut : salon règlement configuré)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'post') return;

    let channel = interaction.options.getChannel('salon');
    if (!channel && DEFAULT_REGLEMENT_CHANNEL_ID) {
      channel = await interaction.guild.channels.fetch(DEFAULT_REGLEMENT_CHANNEL_ID).catch(() => null);
    }
    if (!channel) channel = interaction.channel;

    if (!channel.permissionsFor(interaction.guild.members.me)?.has(['SendMessages', 'EmbedLinks'])) {
      await interaction.reply({
        embeds: [errorEmbed('Permissions manquantes', `Le bot ne peut pas écrire dans ${channel}.`)],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await channel.send({ embeds: [buildReglementEmbed()], components: [buildReglementButton()] });
    await interaction.reply({
      embeds: [successEmbed('Règlement posté', `Le règlement est en place dans ${channel}.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
