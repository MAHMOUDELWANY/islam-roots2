import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

function createIconPNG(size, padding = 0) {
  const png = new PNG({ width: size, height: size });

  const bgR = 0x16, bgG = 0x21, bgB = 0x1A; // Dark botanical forest green #16211A
  const borderR = 0x2D, borderG = 0x3E, borderB = 0x30; // Inner border
  const emeraldR = 0x22, emeraldG = 0x99, emeraldB = 0x54; // Emerald calligraphy #229954
  const woodR = 0xA2, woodG = 0x6B, woodB = 0x36; // Wood brown #A26B36
  const goldR = 0xFA, goldG = 0xF5, goldB = 0xEB; // Crescent #FAF5EB

  const rx = Math.floor(size * 0.2); // Rounded corners radius

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Check rounded rect corner clipping
      let inside = true;
      if (x < rx && y < rx) {
        if ((x - rx) ** 2 + (y - rx) ** 2 > rx ** 2) inside = false;
      } else if (x > size - rx && y < rx) {
        if ((x - (size - rx)) ** 2 + (y - rx) ** 2 > rx ** 2) inside = false;
      } else if (x < rx && y > size - rx) {
        if ((x - rx) ** 2 + (y - (size - rx)) ** 2 > rx ** 2) inside = false;
      } else if (x > size - rx && y > size - rx) {
        if ((x - (size - rx)) ** 2 + (y - (size - rx)) ** 2 > rx ** 2) inside = false;
      }

      if (!inside) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0; // Transparent outside
        continue;
      }

      // Check border (3px thick)
      const isBorder = (x <= 3 || x >= size - 4 || y <= 3 || y >= size - 4);

      let r = bgR, g = bgG, b = bgB;
      if (isBorder) {
        r = borderR; g = borderG; b = borderB;
      }

      // Normalized coordinates (0 to 1) relative to center area
      const nx = (x - size / 2) / (size / 2);
      const ny = (y - size / 2) / (size / 2);

      // Draw Crescent Moon at Top (ny around -0.65)
      const distCrescent = Math.sqrt((nx - 0) ** 2 + (ny + 0.65) ** 2);
      if (distCrescent < 0.18) {
        const innerCut = Math.sqrt((nx - 0.05) ** 2 + (ny + 0.67) ** 2);
        if (innerCut > 0.14) {
          r = goldR; g = goldG; b = goldB;
        }
      }

      // Draw "Islam Roots" Central Tree & Calligraphy motif
      // Emerald text wave (ny between -0.4 and 0.1)
      if (ny >= -0.45 && ny <= 0.05) {
        // Arabic/Script waves
        const wave1 = Math.sin(nx * 12) * 0.08 - 0.25;
        const wave2 = Math.cos(nx * 10) * 0.08 - 0.05;
        if (Math.abs(ny - wave1) < 0.045 && Math.abs(nx) < 0.75) {
          r = emeraldR; g = emeraldG; b = emeraldB;
        }
        if (Math.abs(ny - wave2) < 0.045 && Math.abs(nx) < 0.82) {
          r = emeraldR; g = emeraldG; b = emeraldB;
        }
      }

      // Wood trunk loop in center (nx near 0, ny between -0.15 and 0.25)
      if (Math.abs(nx) < 0.18 && ny >= -0.15 && ny <= 0.25) {
        const loopVal = Math.sin(ny * 18);
        if (Math.abs(nx - loopVal * 0.08) < 0.05) {
          r = woodR; g = woodG; b = woodB;
        }
      }

      // Spreading Roots at Bottom (ny between 0.25 and 0.85)
      if (ny >= 0.25 && ny <= 0.82) {
        const rootSpread = (ny - 0.25) * 1.1; // Root width increases as ny increases
        if (Math.abs(nx) <= rootSpread + 0.05) {
          // Individual root lines
          const line1 = Math.abs(Math.abs(nx) - rootSpread * 0.9);
          const line2 = Math.abs(Math.abs(nx) - rootSpread * 0.5);
          const line3 = Math.abs(Math.abs(nx) - rootSpread * 0.2);

          if (line1 < 0.04 || line2 < 0.035 || line3 < 0.03) {
            r = woodR; g = woodG; b = woodB;
          }

          // Leaf dots at root tips
          if (ny > 0.72 && (Math.abs(nx - rootSpread * 0.95) < 0.05 || Math.abs(nx - rootSpread * 0.55) < 0.04)) {
            r = emeraldR; g = emeraldG; b = emeraldB;
          }
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon.ico', size: 48 },
];

sizes.forEach(({ name, size }) => {
  const icon = createIconPNG(size);
  const buffer = PNG.sync.write(icon);
  const outPath = path.join(process.cwd(), 'public', name);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${name} (${size}x${size})`);
});
