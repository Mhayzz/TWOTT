import { status } from 'minecraft-server-util';

const HOST = process.env.MC_SERVER_HOST ?? 'play.saochronicles.fr';
const PORT = Number(process.env.MC_SERVER_PORT ?? 25565);

export async function fetchServerStatus() {
  try {
    const response = await status(HOST, PORT, { timeout: 5000, enableSRV: true });
    return {
      online: true,
      players: {
        online: response.players?.online ?? 0,
        max: response.players?.max ?? 0,
      },
    };
  } catch (err) {
    return { online: false, error: err.message };
  }
}
