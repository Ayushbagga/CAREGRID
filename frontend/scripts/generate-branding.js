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

  // Scanlines with filter byte 0
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

// CAREGRID Branding Pixel Renderer
// Primary Teal: #0d9488 to #0f766e
function drawCareGridIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Outer rounded squircle margin (4%)
  const margin = 0.04;
  if (nx < margin || nx > 1 - margin || ny < margin || ny > 1 - margin) {
    return [0, 0, 0, 0]; // transparent outer margin
  }

  // Corner radius calculation (~22%)
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

  // Base Teal gradient: #0d9488 to #0f766e
  const t = (nx + ny) / 2;
  let bgR = Math.round(13 + (15 - 13) * t);
  let bgG = Math.round(148 + (118 - 148) * t);
  let bgB = Math.round(136 + (110 - 136) * t);
  let bgA = inCorner ? 180 : 255;

  // Medical Cross & Grid Accent (Top Right)
  const inCrossVert = nx >= 0.76 && nx <= 0.82 && ny >= 0.12 && ny <= 0.30;
  const inCrossHoriz = nx >= 0.70 && nx <= 0.88 && ny >= 0.18 && ny <= 0.24;
  if (inCrossVert || inCrossHoriz) {
    return [255, 255, 255, 240];
  }

  // Center Healthcare Cross + Care Grid
  const inMainCrossVert = nx >= 0.40 && nx <= 0.60 && ny >= 0.32 && ny <= 0.72;
  const inMainCrossHoriz = nx >= 0.22 && nx <= 0.78 && ny >= 0.42 && ny <= 0.62;

  // Grid node points
  const nodeDist1 = Math.hypot(nx - 0.28, ny - 0.36);
  const nodeDist2 = Math.hypot(nx - 0.28, ny - 0.68);
  const inNode = nodeDist1 < 0.06 || nodeDist2 < 0.06;

  // Bottom care-grid connecting dots
  const dot1 = Math.hypot(nx - 0.32, ny - 0.82) < 0.035;
  const dot2 = Math.hypot(nx - 0.50, ny - 0.82) < 0.045;
  const dot3 = Math.hypot(nx - 0.68, ny - 0.82) < 0.035;

  if (inMainCrossVert || inMainCrossHoriz || inNode || dot1 || dot2 || dot3) {
    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, bgA];
}

// Generate ICO file containing multiple PNG images
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  let offset = 6 + count * 16;

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map(p => p.buffer)
  ]);
}

// 1. Generate SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="cg-teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <filter id="cg-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#0f172a" flood-opacity="0.3"/>
    </filter>
  </defs>
  <!-- Background Rounded Square -->
  <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#cg-teal-grad)" filter="url(#cg-shadow)"/>
  
  <!-- Subtle Medical Health Cross Accent in Top-Right -->
  <path d="M47 8h5v5h5v5h-5v5h-5v-5h-5v-5h5z" fill="#ffffff" opacity="0.35"/>
  
  <!-- Primary Brand CG Monogram -->
  <text x="31" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="29" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-1">CG</text>
  
  <!-- Care Coordination Micro-Grid at Bottom -->
  <circle cx="21" cy="53" r="2.2" fill="#ffffff" opacity="0.5"/>
  <circle cx="32" cy="53" r="2.8" fill="#ffffff" opacity="0.9"/>
  <circle cx="43" cy="53" r="2.2" fill="#ffffff" opacity="0.5"/>
  <line x1="23" y1="53" x2="29" y2="53" stroke="#ffffff" stroke-width="1.2" opacity="0.5"/>
  <line x1="35" y1="53" x2="41" y2="53" stroke="#ffffff" stroke-width="1.2" opacity="0.5"/>
</svg>`;

// Write SVG icons
fs.writeFileSync(path.resolve('frontend/public/icon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.resolve('frontend/src/app/icon.svg'), svgContent, 'utf8');
console.log('Created frontend/public/icon.svg and frontend/src/app/icon.svg');

// 2. Generate PNG Icons
const png16 = createPng(16, 16, drawCareGridIcon);
const png32 = createPng(32, 32, drawCareGridIcon);
const png48 = createPng(48, 48, drawCareGridIcon);
const png192 = createPng(192, 192, drawCareGridIcon);
const png512 = createPng(512, 512, drawCareGridIcon);

fs.writeFileSync(path.resolve('frontend/public/icons/icon-192x192.png'), png192);
fs.writeFileSync(path.resolve('frontend/public/icons/icon-512x512.png'), png512);
console.log('Updated frontend/public/icons/icon-192x192.png and icon-512x512.png');

// 3. Generate Valid Binary favicon.ico
const icoBuffer = createIco([
  { width: 16, height: 16, buffer: png16 },
  { width: 32, height: 32, buffer: png32 },
  { width: 48, height: 48, buffer: png48 }
]);

fs.writeFileSync(path.resolve('frontend/public/favicon.ico'), icoBuffer);
fs.writeFileSync(path.resolve('frontend/src/app/favicon.ico'), icoBuffer);
console.log('Created valid binary favicon.ico in frontend/public/ and frontend/src/app/');
console.log('ICO file size:', icoBuffer.length, 'bytes');
