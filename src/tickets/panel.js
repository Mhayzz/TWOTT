import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { baseEmbed, COLORS } from '../lib/embeds.js';

export function buildPanelEmbed() {
  return baseEmbed(COLORS.PRIMARY)
    .setTitle('🐺 Rejoindre The Wolves Of The Trinity')
    .setDescription(
      [
        '> *"Vis ou meurs… ensemble."*',
        '',
        'Tu veux rejoindre **TWOTT** sur **SAO Chronicles** ?',
        'Clique sur le bouton ci-dessous pour ouvrir ton dossier de candidature.',
        '',
        '**Comment ça marche**',
        '1. Tu remplis un court formulaire (pseudo MC, niveau, motivation…).',
        '2. Un salon **privé** est créé pour discuter avec le staff.',
        '3. Le staff valide ou refuse ta candidature.',
        '4. Si accepté → tu reçois le rôle **Recrue** et tu rejoins l\'aventure.',
        '',
        '*Une seule candidature ouverte à la fois par personne.*',
      ].join('\n'),
    )
    .setFooter({ text: 'TWOTT • Candidatures' });
}

export function buildPanelButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:open').setLabel('Postuler').setEmoji('📩').setStyle(ButtonStyle.Success),
  );
  return [row];
}
