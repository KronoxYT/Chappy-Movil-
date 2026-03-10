// Script to generate screenshot placeholders for PWA manifest
// Run: node scripts/generate-screenshots.js

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Desktop screenshot
const desktopSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#0a0a0f"/>
  
  <!-- Sidebar -->
  <rect x="0" y="0" width="256" height="720" fill="#12121a"/>
  <text x="128" y="50" text-anchor="middle" font-family="system-ui" font-size="24" font-weight="bold" fill="#00d4ff">CHAPPI</text>
  
  <!-- Menu items -->
  <rect x="16" y="80" width="224" height="40" rx="8" fill="#00d4ff20"/>
  <text x="48" y="106" font-family="system-ui" font-size="14" fill="#ffffff">Dashboard</text>
  
  <rect x="16" y="130" width="224" height="40" rx="8" fill="transparent"/>
  <text x="48" y="156" font-family="system-ui" font-size="14" fill="#888888">Nodes</text>
  
  <rect x="16" y="180" width="224" height="40" rx="8" fill="transparent"/>
  <text x="48" y="206" font-family="system-ui" font-size="14" fill="#888888">AI Control</text>
  
  <rect x="16" y="230" width="224" height="40" rx="8" fill="transparent"/>
  <text x="48" y="256" font-family="system-ui" font-size="14" fill="#888888">Memory</text>
  
  <!-- Main content area -->
  <text x="280" y="50" font-family="system-ui" font-size="28" font-weight="bold" fill="#ffffff">System Dashboard</text>
  
  <!-- Stats cards -->
  <rect x="280" y="80" width="230" height="100" rx="12" fill="#1a1a25"/>
  <text x="300" y="120" font-family="system-ui" font-size="14" fill="#888888">Active Nodes</text>
  <text x="300" y="160" font-family="system-ui" font-size="32" font-weight="bold" fill="#00d4ff">5/6</text>
  
  <rect x="530" y="80" width="230" height="100" rx="12" fill="#1a1a25"/>
  <text x="550" y="120" font-family="system-ui" font-size="14" fill="#888888">CPU Usage</text>
  <text x="550" y="160" font-family="system-ui" font-size="32" font-weight="bold" fill="#22c55e">45%</text>
  
  <rect x="780" y="80" width="230" height="100" rx="12" fill="#1a1a25"/>
  <text x="800" y="120" font-family="system-ui" font-size="14" fill="#888888">RAM Usage</text>
  <text x="800" y="160" font-family="system-ui" font-size="32" font-weight="bold" fill="#a855f7">62%</text>
  
  <rect x="1030" y="80" width="230" height="100" rx="12" fill="#1a1a25"/>
  <text x="1050" y="120" font-family="system-ui" font-size="14" fill="#888888">GPU Usage</text>
  <text x="1050" y="160" font-family="system-ui" font-size="32" font-weight="bold" fill="#eab308">78%</text>
  
  <!-- Chart area -->
  <rect x="280" y="200" width="480" height="300" rx="12" fill="#1a1a25"/>
  <text x="300" y="230" font-family="system-ui" font-size="16" font-weight="bold" fill="#ffffff">Network Load</text>
  
  <!-- Chart lines -->
  <polyline points="300,450 350,420 400,440 450,380 500,400 550,360 600,390 650,350 700,380 750,340" 
            stroke="#00d4ff" stroke-width="2" fill="none"/>
  
  <!-- Nodes grid area -->
  <rect x="780" y="200" width="480" height="300" rx="12" fill="#1a1a25"/>
  <text x="800" y="230" font-family="system-ui" font-size="16" font-weight="bold" fill="#ffffff">Node Overview</text>
  
  <!-- Node cards -->
  <rect x="800" y="250" width="140" height="80" rx="8" fill="#22c55e20" stroke="#22c55e40" stroke-width="1"/>
  <circle cx="820" cy="270" r="4" fill="#22c55e"/>
  <text x="830" y="274" font-family="system-ui" font-size="10" fill="#ffffff">Master</text>
  
  <rect x="960" y="250" width="140" height="80" rx="8" fill="#22c55e20" stroke="#22c55e40" stroke-width="1"/>
  <circle cx="980" cy="270" r="4" fill="#22c55e"/>
  <text x="990" y="274" font-family="system-ui" font-size="10" fill="#ffffff">Worker-α</text>
  
  <rect x="1120" y="250" width="140" height="80" rx="8" fill="#22c55e20" stroke="#22c55e40" stroke-width="1"/>
  <circle cx="1140" cy="270" r="4" fill="#22c55e"/>
  <text x="1150" y="274" font-family="system-ui" font-size="10" fill="#ffffff">Worker-β</text>
</svg>
`;

// Mobile screenshot
const mobileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844">
  <rect width="390" height="844" fill="#0a0a0f"/>
  
  <!-- Status bar -->
  <rect x="0" y="0" width="390" height="44" fill="#12121a"/>
  <text x="195" y="28" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="bold" fill="#00d4ff">CHAPPI</text>
  <circle cx="360" cy="22" r="4" fill="#22c55e"/>
  
  <!-- Content -->
  <text x="16" y="72" font-family="system-ui" font-size="24" font-weight="bold" fill="#ffffff">System Dashboard</text>
  
  <!-- Stats -->
  <rect x="16" y="90" width="175" height="80" rx="12" fill="#1a1a25"/>
  <text x="32" y="118" font-family="system-ui" font-size="12" fill="#888888">Active Nodes</text>
  <text x="32" y="152" font-family="system-ui" font-size="28" font-weight="bold" fill="#00d4ff">5/6</text>
  
  <rect x="199" y="90" width="175" height="80" rx="12" fill="#1a1a25"/>
  <text x="215" y="118" font-family="system-ui" font-size="12" fill="#888888">CPU Usage</text>
  <text x="215" y="152" font-family="system-ui" font-size="28" font-weight="bold" fill="#22c55e">45%</text>
  
  <rect x="16" y="180" width="175" height="80" rx="12" fill="#1a1a25"/>
  <text x="32" y="208" font-family="system-ui" font-size="12" fill="#888888">RAM Usage</text>
  <text x="32" y="242" font-family="system-ui" font-size="28" font-weight="bold" fill="#a855f7">62%</text>
  
  <rect x="199" y="180" width="175" height="80" rx="12" fill="#1a1a25"/>
  <text x="215" y="208" font-family="system-ui" font-size="12" fill="#888888">GPU Usage</text>
  <text x="215" y="242" font-family="system-ui" font-size="28" font-weight="bold" fill="#eab308">78%</text>
  
  <!-- Chart -->
  <rect x="16" y="276" width="358" height="200" rx="12" fill="#1a1a25"/>
  <text x="32" y="306" font-family="system-ui" font-size="14" font-weight="bold" fill="#ffffff">Network Load</text>
  <polyline points="32,440 70,420 110,430 150,390 190,400 230,370 270,385 310,350 350,365" 
            stroke="#00d4ff" stroke-width="2" fill="none"/>
  
  <!-- Node grid -->
  <rect x="16" y="488" width="358" height="200" rx="12" fill="#1a1a25"/>
  <text x="32" y="518" font-family="system-ui" font-size="14" font-weight="bold" fill="#ffffff">Node Overview</text>
  
  <!-- Node cards in grid -->
  <rect x="32" y="534" width="100" height="60" rx="8" fill="#22c55e20" stroke="#22c55e40"/>
  <circle cx="48" cy="550" r="3" fill="#22c55e"/>
  <text x="58" y="554" font-family="system-ui" font-size="9" fill="#ffffff">Master</text>
  
  <rect x="146" y="534" width="100" height="60" rx="8" fill="#22c55e20" stroke="#22c55e40"/>
  <circle cx="162" cy="550" r="3" fill="#22c55e"/>
  <text x="172" y="554" font-family="system-ui" font-size="9" fill="#ffffff">Alpha</text>
  
  <rect x="260" y="534" width="100" height="60" rx="8" fill="#22c55e20" stroke="#22c55e40"/>
  <circle cx="276" cy="550" r="3" fill="#22c55e"/>
  <text x="286" y="554" font-family="system-ui" font-size="9" fill="#ffffff">Beta</text>
  
  <!-- Bottom nav -->
  <rect x="0" y="788" width="390" height="56" fill="#12121a"/>
  <text x="50" y="820" text-anchor="middle" font-family="system-ui" font-size="10" fill="#00d4ff">Dashboard</text>
  <text x="145" y="820" text-anchor="middle" font-family="system-ui" font-size="10" fill="#888888">Nodes</text>
  <text x="240" y="820" text-anchor="middle" font-family="system-ui" font-size="10" fill="#888888">AI</text>
  <text x="335" y="820" text-anchor="middle" font-family="system-ui" font-size="10" fill="#888888">Memory</text>
</svg>
`;

async function generateScreenshots() {
  console.log('📸 Generating PWA screenshots...\n');
  
  // Desktop screenshot
  const desktopBuffer = await sharp(Buffer.from(desktopSvg))
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(screenshotsDir, 'dashboard.png'), desktopBuffer);
  console.log('✅ Generated: dashboard.png (1280x720)');
  
  // Mobile screenshot
  const mobileBuffer = await sharp(Buffer.from(mobileSvg))
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(screenshotsDir, 'mobile.png'), mobileBuffer);
  console.log('✅ Generated: mobile.png (390x844)');
  
  console.log('\n🎉 All screenshots generated successfully!');
}

generateScreenshots().catch(console.error);
