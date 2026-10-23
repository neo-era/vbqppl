import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('public/icons', { recursive: true });

// Glyph: cán cân công lý (lucide "scale"), trắng, nét bo tròn.
const scale = (cx, cy, s, sw) => `
<g transform="translate(${cx - 12 * s} ${cy - 12 * s}) scale(${s})" fill="none" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
  <path d="M7 21h10"/>
  <path d="M12 3v18"/>
  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
</g>`;

function svg({ size, radius, glyphScale, sw }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5b4bff"/>
      <stop offset="1" stop-color="#30d0b4"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
  ${scale(size / 2, size / 2, glyphScale, sw)}
</svg>`;
}

const favicon = svg({ size: 64, radius: 14, glyphScale: 2.0, sw: 2.1 });
writeFileSync('public/favicon.svg', svg({ size: 512, radius: 112, glyphScale: 15.5, sw: 1.7 }));
writeFileSync('public/favicon-small.svg', favicon);

const full = svg({ size: 512, radius: 112, glyphScale: 15.5, sw: 1.7 });          // icon thường
const maskable = svg({ size: 512, radius: 0, glyphScale: 12.5, sw: 1.8 });         // maskable: nền tràn, glyph nhỏ hơn (safe zone)

async function png(svgStr, size, out) {
  await sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(out);
  console.log('wrote', out);
}

await png(full, 192, 'public/icons/icon-192.png');
await png(full, 512, 'public/icons/icon-512.png');
await png(maskable, 512, 'public/icons/maskable-512.png');
await png(full, 180, 'public/icons/apple-touch-icon.png');
console.log('done');
