// PWA Icon Generator Script
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

// SVG template for regular icons (Gem/Diamond shape representing jewellery)
const generateSVG = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.1 : 0;
  const innerSize = size - (padding * 2);
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Gem dimensions relative to inner size
  const gemWidth = innerSize * 0.6;
  const gemHeight = innerSize * 0.7;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${isMaskable ? '#2563EB' : '#2563EB'}" rx="${isMaskable ? 0 : size * 0.15}"/>
  
  <!-- Gem/Diamond Shape -->
  <g transform="translate(${centerX}, ${centerY})">
    <!-- Top facet -->
    <polygon 
      points="0,${-gemHeight * 0.5} ${gemWidth * 0.35},${-gemHeight * 0.2} ${-gemWidth * 0.35},${-gemHeight * 0.2}" 
      fill="#60A5FA"
    />
    <!-- Left facet -->
    <polygon 
      points="${-gemWidth * 0.5},${-gemHeight * 0.1} ${-gemWidth * 0.35},${-gemHeight * 0.2} 0,${gemHeight * 0.5}" 
      fill="#3B82F6"
    />
    <!-- Right facet -->
    <polygon 
      points="${gemWidth * 0.5},${-gemHeight * 0.1} ${gemWidth * 0.35},${-gemHeight * 0.2} 0,${gemHeight * 0.5}" 
      fill="#1D4ED8"
    />
    <!-- Center facet -->
    <polygon 
      points="${-gemWidth * 0.35},${-gemHeight * 0.2} ${gemWidth * 0.35},${-gemHeight * 0.2} 0,${gemHeight * 0.5}" 
      fill="#93C5FD"
    />
    <!-- Top left edge -->
    <polygon 
      points="0,${-gemHeight * 0.5} ${-gemWidth * 0.5},${-gemHeight * 0.1} ${-gemWidth * 0.35},${-gemHeight * 0.2}" 
      fill="#BFDBFE"
    />
    <!-- Top right edge -->
    <polygon 
      points="0,${-gemHeight * 0.5} ${gemWidth * 0.5},${-gemHeight * 0.1} ${gemWidth * 0.35},${-gemHeight * 0.2}" 
      fill="#DBEAFE"
    />
  </g>
  
  <!-- Shine effect -->
  <ellipse cx="${centerX - innerSize * 0.1}" cy="${centerY - innerSize * 0.15}" rx="${innerSize * 0.08}" ry="${innerSize * 0.04}" fill="white" opacity="0.4"/>
</svg>`;
};

// Shortcut icons
const generateShortcutSVG = (size, type) => {
  const iconContent = type === 'new' 
    ? `<line x1="${size/2}" y1="${size*0.3}" x2="${size/2}" y2="${size*0.7}" stroke="white" stroke-width="${size*0.08}" stroke-linecap="round"/>
       <line x1="${size*0.3}" y1="${size/2}" x2="${size*0.7}" y2="${size/2}" stroke="white" stroke-width="${size*0.08}" stroke-linecap="round"/>`
    : `<circle cx="${size/2}" cy="${size*0.35}" r="${size*0.12}" fill="none" stroke="white" stroke-width="${size*0.06}"/>
       <path d="M${size*0.35},${size*0.55} L${size/2},${size*0.7} L${size*0.65},${size*0.55}" fill="none" stroke="white" stroke-width="${size*0.06}" stroke-linecap="round" stroke-linejoin="round"/>`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563EB" rx="${size * 0.15}"/>
  ${iconContent}
</svg>`;
};

const outputDir = path.join(__dirname, '..', 'apps', 'web', 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate regular icons
sizes.forEach(size => {
  const svg = generateSVG(size, false);
  fs.writeFileSync(path.join(outputDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated: icon-${size}x${size}.svg`);
});

// Generate maskable icons
maskableSizes.forEach(size => {
  const svg = generateSVG(size, true);
  fs.writeFileSync(path.join(outputDir, `icon-maskable-${size}x${size}.svg`), svg);
  console.log(`Generated: icon-maskable-${size}x${size}.svg`);
});

// Generate shortcut icons
fs.writeFileSync(path.join(outputDir, 'shortcut-new.svg'), generateShortcutSVG(96, 'new'));
fs.writeFileSync(path.join(outputDir, 'shortcut-active.svg'), generateShortcutSVG(96, 'active'));
console.log('Generated: shortcut icons');

console.log('\n✅ All SVG icons generated!');
console.log('\n📝 Note: For production, convert these SVGs to PNGs using a tool like:');
console.log('   - Sharp (npm package)');
console.log('   - ImageMagick');
console.log('   - Online converters');
console.log('   - Or use @vite-pwa/assets-generator');
