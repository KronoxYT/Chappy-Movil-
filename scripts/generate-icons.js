// Script to generate PWA icons from SVG
// Run: node scripts/generate-icons.js

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for Chappi icon
const svgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0099cc;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0a0a0f"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="none" stroke="url(#grad1)" stroke-width="${size * 0.02}" opacity="0.3"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.27}" fill="none" stroke="url(#grad1)" stroke-width="${size * 0.015}" opacity="0.5"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.19}" fill="none" stroke="url(#grad1)" stroke-width="${size * 0.01}" opacity="0.7"/>
  <path d="M${size/2} ${size*0.27}c-${size*0.12} 0-${size*0.21} ${size*0.09}-${size*0.21} ${size*0.21}v${size*0.09}c-${size*0.05} ${size*0.02}-${size*0.08} ${size*0.07}-${size*0.08} ${size*0.12}v${size*0.16}c0 ${size*0.08} ${size*0.06} ${size*0.14} ${size*0.14} ${size*0.14}h${size*0.3}c${size*0.08} 0 ${size*0.14}-${size*0.06} ${size*0.14}-${size*0.14}v-${size*0.16}c0-${size*0.05}-${size*0.03}-${size*0.1}-${size*0.08}-${size*0.12}v-${size*0.09}c0-${size*0.12}-${size*0.09}-${size*0.21}-${size*0.21}-${size*0.21}z" 
        fill="none" stroke="url(#grad1)" stroke-width="${size * 0.012}"/>
  <circle cx="${size/2}" cy="${size*0.45}" r="${size*0.04}" fill="url(#grad1)"/>
  <path d="M${size*0.46} ${size*0.51}v${size*0.12}M${size*0.54} ${size*0.51}v${size*0.12}M${size*0.46} ${size*0.63}h${size*0.08}" stroke="url(#grad1)" stroke-width="${size*0.008}" fill="none"/>
  <circle cx="${size*0.31}" cy="${size*0.39}" r="${size*0.025}" fill="url(#grad1)" opacity="0.8"/>
  <circle cx="${size*0.69}" cy="${size*0.39}" r="${size*0.025}" fill="url(#grad1)" opacity="0.8"/>
  <circle cx="${size*0.31}" cy="${size*0.61}" r="${size*0.025}" fill="url(#grad1)" opacity="0.8"/>
  <circle cx="${size*0.69}" cy="${size*0.61}" r="${size*0.025}" fill="url(#grad1)" opacity="0.8"/>
  <line x1="${size*0.34}" y1="${size*0.39}" x2="${size*0.41}" y2="${size*0.43}" stroke="url(#grad1)" stroke-width="${size*0.004}" opacity="0.6"/>
  <line x1="${size*0.66}" y1="${size*0.39}" x2="${size*0.59}" y2="${size*0.43}" stroke="url(#grad1)" stroke-width="${size*0.004}" opacity="0.6"/>
  <line x1="${size*0.34}" y1="${size*0.61}" x2="${size*0.41}" y2="${size*0.57}" stroke="url(#grad1)" stroke-width="${size*0.004}" opacity="0.6"/>
  <line x1="${size*0.66}" y1="${size*0.61}" x2="${size*0.59}" y2="${size*0.57}" stroke="url(#grad1)" stroke-width="${size*0.004}" opacity="0.6"/>
</svg>
`;

// Maskable icon template (centered with safe zone)
const maskableSvgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0099cc;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#0a0a0f"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.3}" fill="url(#grad1)" opacity="0.2"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.22}" fill="url(#grad1)" opacity="0.3"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.14}" fill="url(#grad1)"/>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');
  
  for (const size of sizes) {
    // Regular icon
    const svg = svgTemplate(size);
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    
    const iconPath = path.join(iconsDir, `icon-${size}.png`);
    fs.writeFileSync(iconPath, pngBuffer);
    console.log(`✅ Generated: icon-${size}.png`);
    
    // Maskable icon (only for 192 and 512)
    if (size === 192 || size === 512) {
      const maskableSvg = maskableSvgTemplate(size);
      const maskableBuffer = await sharp(Buffer.from(maskableSvg))
        .resize(size, size)
        .png()
        .toBuffer();
      
      const maskablePath = path.join(iconsDir, `icon-maskable-${size}.png`);
      fs.writeFileSync(maskablePath, maskableBuffer);
      console.log(`✅ Generated: icon-maskable-${size}.png`);
    }
  }
  
  // Create a simple favicon
  const faviconSvg = svgTemplate(32);
  const faviconBuffer = await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(iconsDir, 'favicon.png'), faviconBuffer);
  console.log('✅ Generated: favicon.png');
  
  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
