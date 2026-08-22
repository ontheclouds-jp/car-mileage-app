// PWA用アイコン（マスキング不要のシンプルな速度計モチーフ）をzlibのみで生成するスクリプト。
// 外部の画像処理ライブラリに依存せず、PNGバイト列を直接組み立てる。
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BG = [37, 99, 235]; // blue-600
const FG = [255, 255, 255];
const HUB = [30, 58, 138]; // blue-900

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function renderPixels(size) {
  const cx = size / 2;
  const cy = size / 2;
  const dialRadius = size * 0.36;
  const hubRadius = size * 0.06;
  const needleLength = size * 0.3;
  const needleAngle = (-45 * Math.PI) / 180; // 右上向き
  const needleWidth = size * 0.045;

  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let color = BG;

      if (dist <= dialRadius) {
        color = FG;

        // 針：中心から指定角度への線分との距離が近ければ描画
        const nx = Math.cos(needleAngle);
        const ny = Math.sin(needleAngle);
        const proj = dx * nx + dy * ny;
        if (proj >= 0 && proj <= needleLength) {
          const perpDist = Math.abs(dx * ny - dy * nx);
          if (perpDist <= needleWidth / 2) {
            color = HUB;
          }
        }

        if (dist <= hubRadius) {
          color = HUB;
        }
      }

      const idx = (y * size + x) * 4;
      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = 255;
    }
  }

  return pixels;
}

function encodePng(size) {
  const pixels = renderPixels(size);
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // フィルタなし
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const sizes = [192, 512, 180];
for (const size of sizes) {
  const png = encodePng(size);
  const filename = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  fs.writeFileSync(path.join(outDir, filename), png);
  console.log(`generated ${filename} (${png.length} bytes)`);
}
