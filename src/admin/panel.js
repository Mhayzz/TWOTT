import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { baseEmbed, COLORS } from '../lib/embeds.js';

export function buildPanelEmbed() {
  return baseEmbed(COLORS.PRIMARY)
    .setTitle('🐺 Panneau Admin — The Wolves Of The Trinity')
    .setDescription(
      [
        'Outils de gestion de la guilde. Toutes les actions sont **journalisées** et **réservées au staff**.',
        '',
        '**Membres**',
        '➕ `Ajouter une recrue` — enregistre un membre Discord (pseudo MC + classe)',
        '⬆️ `Promouvoir` — fait monter le rang d\'un membre',
        '⬇️ `Rétrograder` — fait descendre le rang d\'un membre',
        '🛡️ `Définir la classe` — modifie la classe d\'un membre',
        '🚪 `Retirer de la guilde` — supprime un membre (avec confirmation)',
        '',
        '**Consultation**',
        '📜 `Liste` — affiche tous les membres',
        '📊 `Statistiques` — répartition par rang / classe',
      ].join('\n'),
    )
    .setFooter({ text: 'TWOTT • Panneau Admin' });
}

export function buildPanelButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('admin:recruit').setLabel('Ajouter une recrue').setEmoji('➕').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('admin:promote').setLabel('Promouvoir').setEmoji('⬆️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('admin:demote').setLabel('Rétrograder').setEmoji('⬇️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('admin:setclass').setLabel('Définir la classe').setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('admin:remove').setLabel('Retirer').setEmoji('🚪').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('admin:list').setLabel('Liste').setEmoji('📜').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('admin:stats').setLabel('Stats').setEmoji('📊').setStyle(ButtonStyle.Secondary),
  );
  return [row1, row2];
}
