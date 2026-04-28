import { Events } from 'discord.js';
import { baseEmbed, COLORS } from '../lib/embeds.js';

const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID ?? null;
const RULES_CHANNEL_ID = process.env.REGLEMENT_CHANNEL_ID ?? '1418179782553899131';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (member.user.bot) return;
    if (!WELCOME_CHANNEL_ID) return;

    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const memberCount = member.guild.memberCount;
    const accountCreated = Math.floor(member.user.createdTimestamp / 1000);

    const embed = baseEmbed(COLORS.SAO_BLUE)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTitle('⚔️ « New player has awakened in Aincrad »')
      .setDescription(
        [
          `Bienvenue dans **The Wolves Of The Trinity**, <@${member.id}>.`,
          '',
          `> *"Vous ne pouvez plus vous déconnecter. La seule façon de partir est de battre le boss du dernier étage."*`,
          '',
          `📜 Lis le règlement dans <#${RULES_CHANNEL_ID}> pour accéder au reste du serveur.`,
        ].join('\n'),
      )
      .addFields(
        { name: 'Prisonnier n°', value: `**${memberCount}**`, inline: true },
        { name: 'Compte créé', value: `<t:${accountCreated}:R>`, inline: true },
      )
      .setFooter({ text: 'TWOTT • SAO Chronicles' });

    await channel.send({
      content: `<@${member.id}>`,
      embeds: [embed],
      allowedMentions: { users: [member.id] },
    }).catch((err) => console.warn('welcome send failed:', err.message));
  },
};
