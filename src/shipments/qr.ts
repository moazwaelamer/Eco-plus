import { randomInt } from 'node:crypto';

// Crockford-style alphabet without 0, O, 1, I, L so codes survive being read aloud or typed by hand.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Random, non-guessable shipment code such as ECO-7K3M9Q2XPA. Never sequential. */
export function generateQrCode(length = 10): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `ECO-${out}`;
}

export const QR_PATTERN = /^ECO-[2-9A-HJKMNP-Z]{10}$/;
