// Mode lite : basse consommation, sans base de données.
// Seuls le règlement (rôle Prisonnier de l'Aincrad) et le wiki restent actifs.
// Par défaut le bot tourne en lite. BOT_MODE=full dans Railway force le mode complet.
const DEFAULT_MODE = 'lite';
export const IS_LITE = (process.env.BOT_MODE || DEFAULT_MODE).toLowerCase() === 'lite';

export const LITE_COMMAND_FILES = ['reglement.js', 'wiki.js'];

export function isCommandFileEnabled(file) {
  return !IS_LITE || LITE_COMMAND_FILES.includes(file);
}
