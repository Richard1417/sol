import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG generator without dependencies
function createPng(width, height, drawPixel) {
  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  // Header: 8 bytes
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with 0x00 filter per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Brand icon drawer (SOLARE MUSIC: Deep Zinc background, Sun ring + soundwaves in solar amber/orange/red)
function drawSolareIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates (-1 to 1)
  const safeScale = isMaskable ? 0.72 : 0.88;
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / (w / 2) / safeScale;
  const ny = (y - cy) / (h / 2) / safeScale;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Dark background (#09090b or rounded badge)
  let bgR = 9, bgG = 9, bgB = 11, bgA = 255;

  // Outer corner radius when not maskable
  if (!isMaskable) {
    const normX = Math.abs(x - cx) / (w / 2);
    const normY = Math.abs(y - cy) / (h / 2);
    // rounded square mask
    const cornerR = 0.28;
    if (normX > 1 - cornerR && normY > 1 - cornerR) {
      const dx = normX - (1 - cornerR);
      const dy = normY - (1 - cornerR);
      if (dx * dx + dy * dy > cornerR * cornerR) {
        return [0, 0, 0, 0];
      }
    }
  }

  // Solar Core Glow
  if (dist < 0.95) {
    // Solar corona ring: radius ~ 0.55 to 0.72
    if (dist >= 0.52 && dist <= 0.72) {
      const ringRatio = 1 - Math.abs(dist - 0.62) / 0.10;
      // Solar gradient from red (bottom) to bright orange/yellow (top)
      const gradY = (ny + 1) / 2; // 0 top, 1 bottom
      const r = 245;
      const g = Math.round(110 * (1 - gradY) + 35 * gradY);
      const b = 30;
      return [r, g, b, 255];
    }

    // Audio Equalizer bars inside the sun ring (center region)
    if (dist < 0.50) {
      // 5 vertical bars: centered horizontally between nx = -0.40 and 0.40
      const barCount = 5;
      const barWidth = 0.09;
      const barGap = 0.05;
      const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
      const startX = -totalWidth / 2;

      // Heights of the 5 bars: [0.24, 0.42, 0.60, 0.45, 0.28]
      const barHeights = [0.20, 0.36, 0.52, 0.38, 0.22];

      for (let i = 0; i < barCount; i++) {
        const bx = startX + i * (barWidth + barGap);
        const bh = barHeights[i];
        if (nx >= bx && nx <= bx + barWidth && Math.abs(ny) <= bh / 2) {
          // Inner bar color: bright golden sun yellow
          const lum = (1 - Math.abs(ny) / (bh / 2)) * 0.4 + 0.6;
          return [
            Math.min(255, Math.round(255 * lum)),
            Math.min(255, Math.round(180 * lum)),
            Math.min(255, Math.round(50 * lum)),
            255
          ];
        }
      }

      // Inside sun disk subtle warm background
      const innerRatio = (1 - dist / 0.50);
      const glowR = Math.round(bgR + 40 * innerRatio);
      const glowG = Math.round(bgG + 15 * innerRatio);
      const glowB = Math.round(bgB + 5 * innerRatio);
      return [glowR, glowG, glowB, 255];
    }
  }

  return [bgR, bgG, bgB, bgA];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(
  path.join(publicDir, 'pwa-192x192.png'),
  createPng(192, 192, (x, y, w, h) => drawSolareIcon(x, y, w, h, false))
);

// Generate 512x512
console.log('Generating pwa-512x512.png...');
fs.writeFileSync(
  path.join(publicDir, 'pwa-512x512.png'),
  createPng(512, 512, (x, y, w, h) => drawSolareIcon(x, y, w, h, false))
);

// Generate maskable 512x512 (with Android safe zone)
console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(
  path.join(publicDir, 'pwa-maskable-512x512.png'),
  createPng(512, 512, (x, y, w, h) => drawSolareIcon(x, y, w, h, true))
);

// Generate apple-touch-icon.png (180x180)
console.log('Generating apple-touch-icon.png...');
fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon.png'),
  createPng(180, 180, (x, y, w, h) => drawSolareIcon(x, y, w, h, false))
);

// Generate public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#09090b" />
  <circle cx="256" cy="256" r="160" stroke="url(#solare_gradient)" stroke-width="32" stroke-linecap="round" />
  <g fill="url(#bar_gradient)">
    <rect x="180" y="210" width="20" height="92" rx="10" />
    <rect x="216" y="160" width="20" height="192" rx="10" />
    <rect x="252" y="120" width="20" height="272" rx="10" />
    <rect x="288" y="170" width="20" height="172" rx="10" />
    <rect x="324" y="220" width="20" height="72" rx="10" />
  </g>
  <defs>
    <linearGradient id="solare_gradient" x1="256" y1="96" x2="256" y2="416" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f97316" />
      <stop offset="0.5" stop-color="#ef4444" />
      <stop offset="1" stop-color="#b91c1c" />
    </linearGradient>
    <linearGradient id="bar_gradient" x1="256" y1="120" x2="256" y2="392" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fbbf24" />
      <stop offset="1" stop-color="#f97316" />
    </linearGradient>
  </defs>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Icons generated successfully in public/ directory!');
