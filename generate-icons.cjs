#!/usr/bin/env node
// Generates icon-192.png and icon-512.png from StoryClue SVG data.
// Run once: node generate-icons.js
// No external dependencies — uses only Node.js built-ins (zlib, fs).

const zlib = require("zlib");
const fs   = require("fs");
const path = require("path");

// ── CRC32 table ───────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG encoder ───────────────────────────────────────────────────────────────
function encodePNG(width, height, pixels /* Uint8Array RGBA */) {
  function chunk(type, data) {
    const tb  = Buffer.from(type, "ascii");
    const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.concat([tb, data]);
    const crcVal = Buffer.allocUnsafe(4); crcVal.writeUInt32BE(crc32(crcBuf), 0);
    return Buffer.concat([len, tb, data, crcVal]);
  }

  const IHDR = Buffer.allocUnsafe(13);
  IHDR.writeUInt32BE(width,  0);
  IHDR.writeUInt32BE(height, 4);
  IHDR[8]  = 8; // bit depth
  IHDR[9]  = 6; // RGBA
  IHDR[10] = 0; // deflate
  IHDR[11] = 0; // adaptive filtering
  IHDR[12] = 0; // no interlace

  // Raw scanlines: 1 filter byte (0 = None) + RGBA per row
  const raw = Buffer.allocUnsafe(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 4) + 1 + x * 4;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk("IHDR", IHDR),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Pixel renderer ────────────────────────────────────────────────────────────
function renderIcon(size) {
  const scale  = size / 512;
  const pixels = new Uint8Array(size * size * 4);

  // Fill background: #2d4a18
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4]     = 0x2d;
    pixels[i * 4 + 1] = 0x4a;
    pixels[i * 4 + 2] = 0x18;
    pixels[i * 4 + 3] = 255;
  }

  function setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = a;
  }

  // Anti-aliased ellipse fill
  function fillEllipse(cx, cy, rx, ry, r, g, b) {
    cx *= scale; cy *= scale; rx *= scale; ry *= scale;
    const minX = Math.floor(cx - rx - 1), maxX = Math.ceil(cx + rx + 1);
    const minY = Math.floor(cy - ry - 1), maxY = Math.ceil(cy + ry + 1);
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dx = (px - cx) / rx, dy = (py - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d <= 1) {
          setPixel(px, py, r, g, b);
        } else if (d < 1.04) {
          // crude AA fringe
          const alpha = Math.round(255 * (1.04 - d) / 0.04);
          // blend over existing pixel
          const i = (Math.round(py) * size + Math.round(px)) * 4;
          if (Math.round(py) >= 0 && Math.round(py) < size &&
              Math.round(px) >= 0 && Math.round(px) < size) {
            pixels[i]     = Math.round(pixels[i]     + (r - pixels[i])     * alpha / 255);
            pixels[i + 1] = Math.round(pixels[i + 1] + (g - pixels[i + 1]) * alpha / 255);
            pixels[i + 2] = Math.round(pixels[i + 2] + (b - pixels[i + 2]) * alpha / 255);
          }
        }
      }
    }
  }

  // Thick line (round caps)
  function drawLine(x1, y1, x2, y2, w, r, g, b) {
    x1 *= scale; y1 *= scale; x2 *= scale; y2 *= scale; w *= scale;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const steps = Math.ceil(len * 2);
    const hw = w / 2;
    for (let i = 0; i <= steps; i++) {
      const t  = i / steps;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      for (let oy = -Math.ceil(hw); oy <= Math.ceil(hw); oy++) {
        for (let ox = -Math.ceil(hw); ox <= Math.ceil(hw); ox++) {
          if (ox * ox + oy * oy <= hw * hw) setPixel(px + ox, py + oy, r, g, b);
        }
      }
    }
  }

  const CR = [0xf0, 0xea, 0xd8]; // cream
  const DK = [0x2d, 0x4a, 0x18]; // dark green
  const WH = [0xff, 0xff, 0xff]; // white
  const LT = [0xa8, 0xd8, 0x90]; // light green

  // ── Draw spider (SVG-space coords → scaled) ────────────────────────────────

  // Web thread (behind everything)
  drawLine(256, 100, 256, 172, 5, ...CR);

  // Legs — left side
  drawLine(210, 215, 158, 185, 9, ...CR);
  drawLine(208, 228, 152, 228, 9, ...CR);
  drawLine(212, 242, 160, 268, 9, ...CR);
  drawLine(218, 255, 172, 292, 9, ...CR);

  // Legs — right side
  drawLine(302, 215, 354, 185, 9, ...CR);
  drawLine(304, 228, 360, 228, 9, ...CR);
  drawLine(300, 242, 352, 268, 9, ...CR);
  drawLine(294, 255, 340, 292, 9, ...CR);

  // Body: abdomen (draw first so head overlaps)
  fillEllipse(256, 248, 38, 30, ...CR);

  // Body: head/thorax
  fillEllipse(256, 210, 52, 38, ...CR);

  // Eyes
  fillEllipse(242, 204, 7, 7, ...DK);
  fillEllipse(270, 204, 7, 7, ...DK);

  // Eye shine
  fillEllipse(244, 202, 2.5, 2.5, ...WH);
  fillEllipse(272, 202, 2.5, 2.5, ...WH);

  // "SC" text badge at the bottom (only for 512px where it's large enough)
  // Skip text rendering — too complex without a font renderer
  // The cream body + 8 legs on dark green is visually clear at all sizes

  return pixels;
}

// ── Generate both sizes ───────────────────────────────────────────────────────
const outDir = path.join(__dirname, "public");

for (const size of [192, 512]) {
  const pixels = renderIcon(size);
  const png    = encodePNG(size, size, pixels);
  const out    = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(out, png);
  console.log(`✅  Written: ${out}  (${(png.length / 1024).toFixed(1)} KB)`);
}
