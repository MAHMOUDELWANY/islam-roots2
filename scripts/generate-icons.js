const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write favicon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="#FAF7F2"/>
  
  <!-- Outer Ring Accent -->
  <rect x="16" y="16" width="480" height="480" rx="84" fill="none" stroke="#1E3A2B" stroke-width="6" opacity="0.15"/>
  
  <!-- Crescent Moon -->
  <path d="M 256 70 A 30 30 0 1 0 286 100 A 24 24 0 1 1 256 70 Z" fill="#D4AF37"/>
  
  <!-- Text: Islam Roots -->
  <text x="256" y="180" font-family="'Georgia', 'Times New Roman', serif" font-weight="bold" font-style="italic" font-size="64" fill="#1E3A2B" text-anchor="middle">Islam</text>
  <text x="256" y="250" font-family="'Georgia', 'Times New Roman', serif" font-weight="bold" font-style="italic" font-size="76" fill="#1E3A2B" text-anchor="middle">Roots</text>

  <!-- Stylized Trunk & Tree Roots -->
  <g fill="none" stroke="#3D2E1E" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    <!-- Main Stem/Trunk -->
    <path d="M 256 270 L 256 340"/>
    
    <!-- Twisted Loops -->
    <path d="M 256 300 C 230 310 230 330 256 340 C 282 330 282 310 256 300 Z" fill="#3D2E1E" opacity="0.2"/>
    <path d="M 256 300 C 230 310 230 330 256 340 C 282 330 282 310 256 300 Z"/>

    <!-- Root Branches -->
    <path d="M 256 340 Q 210 370 150 420"/>
    <path d="M 256 340 Q 302 370 362 420"/>
    
    <path d="M 256 350 Q 230 390 190 440"/>
    <path d="M 256 350 Q 282 390 322 440"/>

    <path d="M 256 360 Q 256 410 256 460"/>
    
    <path d="M 200 385 Q 170 420 130 445"/>
    <path d="M 312 385 Q 342 420 382 445"/>
  </g>

  <!-- Leaves / Root Nodes -->
  <g fill="#1E3A2B">
    <circle cx="150" cy="420" r="7"/>
    <circle cx="362" cy="420" r="7"/>
    <circle cx="190" cy="440" r="6"/>
    <circle cx="322" cy="440" r="6"/>
    <circle cx="256" cy="460" r="8"/>
    <circle cx="130" cy="445" r="5"/>
    <circle cx="382" cy="445" r="5"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');

// Function to generate PNG icon using raster pixel math
function generatePNGIcon(size, filename) {
  const png = new PNG({ width: size, height: size });

  // Fill Cream background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      // Rounded corner masking
      const cornerRadius = size * 0.2;
      let inCorner = false;
      let dist = 0;

      if (x < cornerRadius && y < cornerRadius) {
        dist = Math.hypot(x - cornerRadius, y - cornerRadius);
        inCorner = dist > cornerRadius;
      } else if (x > size - cornerRadius && y < cornerRadius) {
        dist = Math.hypot(x - (size - cornerRadius), y - cornerRadius);
        inCorner = dist > cornerRadius;
      } else if (x < cornerRadius && y > size - cornerRadius) {
        dist = Math.hypot(x - cornerRadius, y - (size - cornerRadius));
        inCorner = dist > cornerRadius;
      } else if (x > size - cornerRadius && y > size - cornerRadius) {
        dist = Math.hypot(x - (size - cornerRadius), y - (size - cornerRadius));
        inCorner = dist > cornerRadius;
      }

      if (inCorner) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Default Cream Background #FAF7F2
      let r = 250, g = 247, b = 242;

      // Draw Green Banner / Accent Circle in center
      const cx = size / 2;
      const cy = size / 2;
      const rad = size * 0.42;
      const d = Math.hypot(x - cx, y - cy);

      // Outer ring
      if (Math.abs(d - rad) < size * 0.015) {
        r = 30; g = 58; b = 43; // #1E3A2B
      } else if (d < size * 0.38) {
        // Subtle inner glow
        r = 252; g = 250; b = 245;
      }

      // Crescent Moon near top
      const moonX = cx;
      const moonY = cy - size * 0.28;
      const moonR = size * 0.08;
      const dMoon = Math.hypot(x - moonX, y - moonY);
      const dMoonCut = Math.hypot(x - (moonX + size * 0.03), y - (moonY - size * 0.02));
      if (dMoon < moonR && dMoonCut > moonR * 0.8) {
        r = 212; g = 175; b = 55; // #D4AF37 Gold
      }

      // Central Trunk & Roots Representation
      const isTrunk = Math.abs(x - cx) < size * 0.025 && y >= cy - size * 0.05 && y <= cy + size * 0.18;
      if (isTrunk) {
        r = 61; g = 46; b = 30; // #3D2E1E Brown
      }

      // Root branches
      const dy = y - (cy + size * 0.18);
      if (dy > 0 && dy < size * 0.22) {
        const spread = dy * 0.8;
        if (Math.abs(Math.abs(x - cx) - spread) < size * 0.02) {
          r = 30; g = 58; b = 43; // Green roots
        } else if (Math.abs(Math.abs(x - cx) - spread * 0.5) < size * 0.018) {
          r = 61; g = 46; b = 30;
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

generatePNGIcon(192, 'icon-192.png');
generatePNGIcon(512, 'icon-512.png');
generatePNGIcon(180, 'apple-touch-icon.png');
generatePNGIcon(64, 'favicon.ico');

// Write manifest.json
const manifest = {
  name: "Islam Roots Workspace",
  short_name: "IslamRoots",
  description: "Workspace for Quran, Tajweed, Hifz, and Islamic Studies educators",
  start_url: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#FAF7F2",
  theme_color: "#1E3A2B",
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable"
    },
    {
      src: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png"
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('Manifest and icons generated successfully!');
