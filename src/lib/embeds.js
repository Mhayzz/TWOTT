import { EmbedBuilder } from 'discord.js';

export const COLORS = {
  PRIMARY: 0x6c1f8a,   // violet TWOTT
  SUCCESS: 0x2ecc71,
  WARNING: 0xf1c40f,
  DANGER: 0xe74c3c,
  INFO: 0x3498db,
  SAO_BLUE: 0x1f4e8a,
};

export const FOOTER = 'The Wolves Of The Trinity • SAO Chronicles';

export function baseEmbed(color = COLORS.PRIMARY) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: FOOTER })
    .setTimestamp();
}

export function successEmbed(title, description) {
  return baseEmbed(COLORS.SUCCESS).setTitle(title).setDescription(description ?? null);
}

export function errorEmbed(title, description) {
  return baseEmbed(COLORS.DANGER).setTitle(title).setDescription(description ?? null);
}

export function infoEmbed(title, description) {
  return baseEmbed(COLORS.INFO).setTitle(title).setDescription(description ?? null);
}
