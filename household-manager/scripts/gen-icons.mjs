import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(root, "public");
mkdirSync(publicDir, { recursive: true });

const TEAL = "#0d9488";

// A white "home" glyph (matching lucide's Home icon) centered on a teal square.
function icon({ bg = TEAL, pad = 0 } = {}) {
  // House drawn in a 24x24 coordinate space, scaled up and centered.
  const scale = (512 - pad * 2) / 24;
  const tx = pad;
  const ty = pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${bg}"/>
  <g transform="translate(${tx},${ty}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9.5 12 3l9 6.5"/>
    <path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/>
    <path d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6"/>
  </g>
</svg>`;
}

async function main() {
  const standard = Buffer.from(icon({ pad: 96 }));
  const maskable = Buffer.from(icon({ pad: 128 })); // extra safe-zone padding

  await sharp(standard).resize(192, 192).png().toFile(resolve(publicDir, "pwa-192x192.png"));
  await sharp(standard).resize(512, 512).png().toFile(resolve(publicDir, "pwa-512x512.png"));
  await sharp(maskable).resize(512, 512).png().toFile(resolve(publicDir, "pwa-maskable-512x512.png"));
  await sharp(standard).resize(180, 180).png().toFile(resolve(publicDir, "apple-touch-icon.png"));

  console.log("Icons generated in", publicDir);
}

main();
