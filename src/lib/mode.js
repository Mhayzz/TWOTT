// BOT_MODE=lite : mode basse consommation, sans base de données.
// Seuls le règlement (rôle Prisonnier de l'Aincrad) et le wiki restent actifs.
export const IS_LITE = (process.env.BOT_MODE ?? '').toLowerCase() === 'lite';

export const LITE_COMMAND_FILES = ['reglement.js', 'wiki.js'];

export function isCommandFileEnabled(file) {
  return !IS_LITE || LITE_COMMAND_FILES.includes(file);
}
