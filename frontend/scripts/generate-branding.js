const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for pure Node PNG generation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(width, height, drawFn) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // deflate
  ihdrData.writeUInt8(0, 11); // standard filter
  ihdrData.writeUInt8(0, 12); // non-interlaced
  const ihdr = makeChunk('IHDR', ihdrData);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const idat = makeChunk('IDAT', zlib.deflateSync(rawData, { level: 9 }));
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Concept 01: The Care Matrix Shield (Approved Standalone Symbol)
function drawCareGridSymbol(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Outer margin (4%)
  const margin = 0.04;
  if (nx < margin || nx > 1 - margin || ny < margin || ny > 1 - margin) {
    return [0, 0, 0, 0];
  }

  // Squircle rounded corners (~22%)
  const r = 0.22;
  const cx = nx < 0.5 ? margin + r : 1 - margin - r;
  const cy = ny < 0.5 ? margin + r : 1 - margin - r;
  const dx = nx < 0.5 ? cx - nx : nx - cx;
  const dy = ny < 0.5 ? cy - ny : ny - cy;

  let inCorner = false;
  if (dx > 0 && dy > 0) {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > r) return [0, 0, 0, 0];
    inCorner = dist > r - 0.02;
  }

  // Base Teal gradient: #0d9488 (13, 148, 136) to #0f766e (15, 118, 110)
  const t = (nx + ny) / 2;
  let bgR = Math.round(13 + (15 - 13) * t);
  let bgG = Math.round(148 + (118 - 148) * t);
  let bgB = Math.round(136 + (110 - 136) * t);
  let bgA = inCorner ? 180 : 255;

  // Geometry Coordinates
  // Shield Canopy Outline
  // Equation approximation for outer shield:
  // Top arch from y=0.14 to 0.46, tapering down to point at (0.5, 0.86)
  const sx = Math.abs(nx - 0.5) / 0.32; // normalized distance from vertical center
  let shieldEdgeY = 0;
  if (sx <= 1.0) {
    if (ny < 0.46) {
      // Upper dome
      shieldEdgeY = 0.14 + (1 - Math.sqrt(Math.max(0, 1 - sx * sx))) * 0.12;
    } else {
      // Lower taper
      shieldEdgeY = 0.46 + sx * 0.38;
    }
  }

  const distToShield = Math.abs(ny - shieldEdgeY);
  const onShieldArc = sx <= 1.05 && distToShield < 0.035 && ny >= 0.14 && ny <= 0.86;

  // Vertical Protective Spine: x in [0.47, 0.53], y in [0.22, 0.78]
  const onVertSpine = Math.abs(nx - 0.5) <= 0.035 && ny >= 0.22 && ny <= 0.78;

  // Horizontal Referral Loop: center at y=0.48, x in [0.26, 0.74]
  // Loop ellipse equation: ((nx - 0.5) / 0.24)^2 + ((ny - 0.48) / 0.12)^2 ≈ 1
  const hx = (nx - 0.5) / 0.24;
  const hy = (ny - 0.48) / 0.12;
  const loopDist = Math.abs(Math.sqrt(hx * hx + hy * hy) - 1.0);
  const onHorizLoop = loopDist < 0.22 && Math.abs(nx - 0.5) <= 0.26;

  // Coordinate Nodes
  // Central Luminous Nexus Node: (0.5, 0.48)
  const distCenter = Math.hypot(nx - 0.5, ny - 0.48);
  if (distCenter <= 0.075) {
    if (distCenter <= 0.035) {
      return [13, 148, 136, 255]; // Inner teal iris
    }
    return [255, 255, 255, 255]; // Outer white glow
  }

  // Peripheral Coordinate Nodes
  const distLeft = Math.hypot(nx - 0.26, ny - 0.48);
  const distRight = Math.hypot(nx - 0.74, ny - 0.48);
  const distTop = Math.hypot(nx - 0.5, ny - 0.22);
  const distBottom = Math.hypot(nx - 0.5, ny - 0.78);

  if (distLeft <= 0.048 || distRight <= 0.048 || distTop <= 0.048 || distBottom <= 0.048) {
    return [255, 255, 255, 255];
  }

  // Draw lines
  if (onVertSpine || onHorizLoop) {
    return [255, 255, 255, 250];
  }

  // Shield teal glow
  if (onShieldArc) {
    return [94, 234, 212, 230]; // Mint glow (#5eead4)
  }

  return [bgR, bgG, bgB, bgA];
}

// Generate ICO file containing multiple PNG images
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  let offset = 6 + count * 16;

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(item.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map(p => p.buffer)
  ]);
}

// 1. Generate Approved SVG Icon (The Care Matrix Shield)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="cg-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="cg-shield-glow" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#14b8a6"/>
    </linearGradient>
    <linearGradient id="cg-white-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#ccfbf1"/>
    </linearGradient>
    <filter id="cg-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#0f172a" flood-opacity="0.3"/>
    </filter>
  </defs>
  <!-- Background Rounded Squircle -->
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#cg-bg-grad)" filter="url(#cg-shadow)"/>
  
  <!-- Protective Shield Canopy -->
  <path d="M32 9 C43 9, 52 15, 52 29 C52 42, 41 51, 32 55 C23 51, 12 42, 12 29 C12 15, 21 9, 32 9 Z" 
        stroke="url(#cg-shield-glow)" stroke-width="2.5" stroke-linecap="round" fill="#0f766e" fill-opacity="0.3"/>
  
  <!-- Continuum Coordination Mesh Arcs -->
  <path d="M17 31 C23 23, 41 23, 47 31 C41 39, 23 39, 17 31 Z" 
        stroke="url(#cg-white-grad)" stroke-width="3" stroke-linejoin="round" fill="none"/>
  <path d="M32 14 L32 50" 
        stroke="url(#cg-white-grad)" stroke-width="3" stroke-linecap="round"/>

  <!-- Central Luminous Nexus Node (Citizen Core) -->
  <circle cx="32" cy="31" r="4.5" fill="#ffffff"/>
  <circle cx="32" cy="31" r="2.2" fill="#0d9488"/>

  <!-- Coordinate Network Nodes -->
  <circle cx="17" cy="31" r="3" fill="#ffffff"/>
  <circle cx="47" cy="31" r="3" fill="#ffffff"/>
  <circle cx="32" cy="14" r="3" fill="#ffffff"/>
  <circle cx="32" cy="50" r="3" fill="#ffffff"/>
</svg>`;

// Write SVG icons
fs.writeFileSync(path.resolve('frontend/public/icon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.resolve('frontend/src/app/icon.svg'), svgContent, 'utf8');
console.log('✓ Created frontend/public/icon.svg & frontend/src/app/icon.svg (The Care Matrix Shield)');

// 2. Generate PNG Icons
const png16 = createPng(16, 16, drawCareGridSymbol);
const png32 = createPng(32, 32, drawCareGridSymbol);
const png48 = createPng(48, 48, drawCareGridSymbol);
const png192 = createPng(192, 192, drawCareGridSymbol);
const png512 = createPng(512, 512, drawCareGridSymbol);

fs.writeFileSync(path.resolve('frontend/public/icons/icon-192x192.png'), png192);
fs.writeFileSync(path.resolve('frontend/public/icons/icon-512x512.png'), png512);
console.log('✓ Updated frontend/public/icons/icon-192x192.png & icon-512x512.png');

// 3. Generate Valid Binary favicon.ico
const icoBuffer = createIco([
  { width: 16, height: 16, buffer: png16 },
  { width: 32, height: 32, buffer: png32 },
  { width: 48, height: 48, buffer: png48 }
]);

fs.writeFileSync(path.resolve('frontend/public/favicon.ico'), icoBuffer);
fs.writeFileSync(path.resolve('frontend/src/app/favicon.ico'), icoBuffer);
console.log('✓ Created valid binary favicon.ico with The Care Matrix Shield');
console.log('  ICO file size:', icoBuffer.length, 'bytes');
