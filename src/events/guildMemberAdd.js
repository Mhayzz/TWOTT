import { Events } from 'discord.js';
import { baseEmbed, COLORS } from '../lib/embeds.js';

const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID ?? null;
const RULES_CHANNEL_ID = process.env.REGLEMENT_CHANNEL_ID ?? '1418179782553899131';
const WELCOME_BANNER_URL = process.env.WELCOME_BANNER_URL ?? 'https://i.imgur.com/i7Z4Sgl.png';

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
      .setTitle(`🐺 Bienvenue dans la meute, ${member.user.username} !`)
      .setDescription(
        [
          `Hey <@${member.id}>, bienvenue sur **The Wolves Of The Trinity** !`,
          '',
          `📜 Pense à lire le règlement dans <#${RULES_CHANNEL_ID}> pour débloquer l'accès au reste du serveur.`,
          '',
          `Bonne aventure dans **l'Aincrad**, et n'hésite pas à te présenter à la meute. ⚔️`,
        ].join('\n'),
      )
      .addFields(
        { name: 'Membre n°', value: `**${memberCount}**`, inline: true },
        { name: 'Compte créé', value: `<t:${accountCreated}:R>`, inline: true },
      )
      .setFooter({ text: 'The Wolves Of The Trinity' });

    if (WELCOME_BANNER_URL) embed.setImage(WELCOME_BANNER_URL);

    await channel.send({
      content: `<@${member.id}>`,
      embeds: [embed],
      allowedMentions: { users: [member.id] },
    }).catch((err) => console.warn('welcome send failed:', err.message));
  },
};
