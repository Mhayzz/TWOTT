import { status } from 'minecraft-server-util';
import { baseEmbed, COLORS } from './embeds.js';

const HOST = process.env.MC_SERVER_HOST ?? 'play.saochronicles.fr';
const PORT = Number(process.env.MC_SERVER_PORT ?? 25565);

export async function fetchServerStatus() {
  try {
    const response = await status(HOST, PORT, { timeout: 5000, enableSRV: true });
    return {
      online: true,
      host: HOST,
      port: PORT,
      version: response.version?.name ?? 'unknown',
      players: {
        online: response.players?.online ?? 0,
        max: response.players?.max ?? 0,
        sample: response.players?.sample?.map((p) => p.name) ?? [],
      },
      motd: response.motd?.clean ?? '',
      latency: response.roundTripLatency ?? null,
    };
  } catch (err) {
    return {
      online: false,
      host: HOST,
      port: PORT,
      error: err.message,
    };
  }
}

export function buildStatusEmbed(s) {
  if (!s.online) {
    return baseEmbed(COLORS.DANGER)
      .setTitle('🔴 Serveur hors-ligne')
      .setDescription(`\`${s.host}\` ne répond pas.`)
      .addFields({ name: 'Erreur', value: '```' + (s.error ?? 'unknown') + '```' });
  }

  const sampleList = s.players.sample.length
    ? s.players.sample.slice(0, 20).map((n) => `• ${n}`).join('\n')
    : '*Aucun joueur visible*';

  return baseEmbed(COLORS.SUCCESS)
    .setTitle('🟢 SAO Chronicles — En ligne')
    .setDescription(s.motd || '')
    .addFields(
      { name: 'IP', value: '`' + s.host + '`', inline: true },
      { name: 'Version', value: s.version, inline: true },
      { name: 'Latence', value: s.latency ? `${s.latency} ms` : '—', inline: true },
      { name: 'Joueurs', value: `**${s.players.online}** / ${s.players.max}`, inline: false },
      { name: 'En jeu', value: sampleList, inline: false },
    );
}
