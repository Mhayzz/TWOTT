import { Events } from 'discord.js';

const VISITOR_ROLE_ID = process.env.VISITOR_ROLE_ID ?? '1418179781408854091';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (member.user.bot) return;
    if (!VISITOR_ROLE_ID) return;

    try {
      const role = member.guild.roles.cache.get(VISITOR_ROLE_ID)
        ?? await member.guild.roles.fetch(VISITOR_ROLE_ID).catch(() => null);
      if (!role) {
        console.warn(`Rôle visiteur introuvable: ${VISITOR_ROLE_ID}`);
        return;
      }

      const botTop = member.guild.members.me.roles.highest;
      if (botTop.comparePositionTo(role) <= 0) {
        console.warn(`Rôle ${role.name} au-dessus du bot — attribution impossible.`);
        return;
      }

      await member.roles.add(role, 'Auto-attribution du rôle visiteur');
      console.log(`Rôle visiteur attribué à ${member.user.tag}`);
    } catch (err) {
      console.error(`Échec attribution rôle visiteur à ${member.user.tag}:`, err.message);
    }
  },
};
