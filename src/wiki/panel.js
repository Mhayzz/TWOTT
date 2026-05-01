import { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } from 'discord.js';
import { WIKI_SECTIONS, findSection, WIKI_DISCLAIMER } from './sections.js';
import { COLORS } from '../lib/embeds.js';

export function buildIndexEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('📚 Wiki TWOTT — SAO Chronicles')
    .setDescription(
      [
        WIKI_DISCLAIMER,
        '',
        'Sélectionne une section dans le menu déroulant ci-dessous pour consulter son contenu.',
        '',
        '**Sections disponibles :**',
        ...WIKI_SECTIONS.filter((s) => s.id !== 'accueil').map(
          (s) => `${s.emoji} **${s.label}** — *${s.description}*`,
        ),
      ].join('\n'),
    )
    .setFooter({ text: 'TWOTT • Wiki' })
    .setTimestamp();
}

export function buildSelectMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('wiki:section')
    .setPlaceholder('📖 Sélectionne une section…')
    .addOptions(
      WIKI_SECTIONS.map((s) => ({
        label: s.label.slice(0, 100),
        value: s.id,
        description: s.description?.slice(0, 100),
        emoji: s.emoji,
      })),
    );
  return new ActionRowBuilder().addComponents(menu);
}

export function buildSectionEmbed(sectionId) {
  const section = findSection(sectionId);
  if (!section) return null;
  const data = section.embed;
  const embed = new EmbedBuilder().setColor(COLORS.PRIMARY).setFooter({ text: 'TWOTT • Wiki' }).setTimestamp();
  if (data.title) embed.setTitle(data.title);
  if (data.description) embed.setDescription(data.description);
  if (Array.isArray(data.fields) && data.fields.length) embed.addFields(data.fields);
  if (data.image) embed.setImage(data.image);
  if (data.thumbnail) embed.setThumbnail(data.thumbnail);
  return embed;
}
