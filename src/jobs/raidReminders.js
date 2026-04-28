import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { baseEmbed, COLORS } from '../lib/embeds.js';

export function startRaidReminders(client) {
  const lead = Math.max(1, Number(process.env.RAID_REMINDER_LEAD_MINUTES ?? 30));
  // Run every minute
  cron.schedule('* * * * *', () => runOnce(client, lead).catch((e) => console.error('raidReminders:', e)));
  console.log(`Raid reminders démarré (préavis ${lead} min)`);
}

async function runOnce(client, leadMinutes) {
  const now = Date.now();
  const windowEnd = now + leadMinutes * 60_000;

  const upcoming = await prisma.raid.findMany({
    where: {
      cancelled: false,
      reminderSent: false,
      scheduledAt: { gte: new Date(now), lte: new Date(windowEnd) },
    },
    include: { participants: { include: { member: true } } },
  });

  for (const raid of upcoming) {
    try {
      const channel = await client.channels.fetch(raid.channelId).catch(() => null);
      if (!channel) continue;

      const present = raid.participants.filter((p) => p.status === 'PRESENT' || p.status === 'MAYBE');
      const mentions = present.map((p) => `<@${p.member.discordId}>`).join(' ');
      const ts = Math.floor(raid.scheduledAt.getTime() / 1000);

      const embed = baseEmbed(COLORS.WARNING)
        .setTitle(`⏰ Rappel — ${raid.name}`)
        .setDescription(`Démarrage <t:${ts}:R> (<t:${ts}:t>)`)
        .addFields(
          ...(raid.location ? [{ name: 'Lieu', value: raid.location, inline: true }] : []),
          { name: 'Préparez-vous', value: 'Connectez-vous, équipez-vous, soyez prêts !' },
        );

      await channel.send({ content: mentions || undefined, embeds: [embed] });
      await prisma.raid.update({ where: { id: raid.id }, data: { reminderSent: true } });
    } catch (err) {
      console.warn(`raidReminders ${raid.id}:`, err.message);
    }
  }
}
