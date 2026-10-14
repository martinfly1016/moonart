const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export const PNG_PPM_300DPI = 11811;
export const CANVAS_MAX_AREA = 16777216;
export const CANVAS_MAX_DIM = 4096;

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function pngChunk(type, data) {
  const payload = data instanceof Uint8Array ? data : new Uint8Array(data);
  const out = new Uint8Array(12 + payload.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, payload.length);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(payload, 8);
  view.setUint32(8 + payload.length, crc32(out.subarray(4, 8 + payload.length)));
  return out;
}

export function physData(ppm = PNG_PPM_300DPI) {
  const data = new Uint8Array(9);
  const view = new DataView(data.buffer);
  view.setUint32(0, ppm);
  view.setUint32(4, ppm);
  data[8] = 1;
  return data;
}

export function readPngChunks(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );
    const start = offset + 8;
    const end = start + length;
    chunks.push({
      type,
      data: bytes.subarray(start, end),
      start: offset,
      end: end + 4
    });
    offset = end + 4;
    if (type === 'IEND') break;
  }
  return chunks;
}

export function insertPhysChunk(pngBytes, ppm = PNG_PPM_300DPI) {
  const bytes = pngBytes instanceof Uint8Array ? pngBytes : new Uint8Array(pngBytes);
  if (bytes.length < 8 || bytes[0] !== 137 || bytes[1] !== 80) {
    throw new Error('not a png');
  }
  const chunks = readPngChunks(bytes);
  if (chunks.some((chunk) => chunk.type === 'pHYs')) return bytes;
  const ihdr = chunks[0];
  if (!ihdr || ihdr.type !== 'IHDR') throw new Error('missing IHDR');
  const phys = pngChunk('pHYs', physData(ppm));
  const out = new Uint8Array(bytes.length + phys.length);
  out.set(bytes.subarray(0, ihdr.end), 0);
  out.set(phys, ihdr.end);
  out.set(bytes.subarray(ihdr.end), ihdr.end + phys.length);
  return out;
}

export function buildPng({ width, height, zlibBytes, ppm = PNG_PPM_300DPI }) {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const parts = [
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('pHYs', physData(ppm)),
    pngChunk('IDAT', zlibBytes),
    pngChunk('IEND', new Uint8Array(0))
  ];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

export function encodeScanlines(width, height, rgba) {
  const scan = new Uint8Array(height * (1 + width * 3));
  let dest = 0;
  for (let y = 0; y < height; y += 1) {
    scan[dest] = 1;
    dest += 1;
    let prevR = 0;
    let prevG = 0;
    let prevB = 0;
    const row = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const i = row + x * 4;
      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      scan[dest] = (r - prevR) & 255;
      scan[dest + 1] = (g - prevG) & 255;
      scan[dest + 2] = (b - prevB) & 255;
      prevR = r;
      prevG = g;
      prevB = b;
      dest += 3;
    }
  }
  return scan;
}

export function exceedsCanvasLimit(width, height) {
  return width > CANVAS_MAX_DIM || height > CANVAS_MAX_DIM || (width * height) > CANVAS_MAX_AREA;
}

export function tileSpans(total, tileSize) {
  const spans = [];
  let offset = 0;
  const size = Math.max(1, tileSize);
  while (offset < total) {
    const span = Math.min(size, total - offset);
    spans.push({ offset, size: span });
    offset += span;
  }
  return spans;
}

export function a3FallbackSlices() {
  return [
    { y: 0, height: 2480 },
    { y: 2480, height: 2481 }
  ];
}

function wrapZlib(raw, checksum) {
  const out = new Uint8Array(raw.length + 6);
  out[0] = 0x78;
  out[1] = 0x01;
  out.set(raw, 2);
  new DataView(out.buffer).setUint32(out.length - 4, checksum);
  return out;
}

let cachedDeflateFormat;

async function deflateFormat() {
  if (cachedDeflateFormat) return cachedDeflateFormat;
  const stream = new CompressionStream('deflate');
  const writer = stream.writable.getWriter();
  const done = new Response(stream.readable).arrayBuffer();
  await writer.write(new Uint8Array([1, 2, 3, 4]));
  await writer.close();
  const out = new Uint8Array(await done);
  cachedDeflateFormat = out.length >= 2 && out[0] === 0x78 ? 'zlib' : 'raw';
  return cachedDeflateFormat;
}

async function writeSource(writer, source, onChunk) {
  const chunkSize = 256 * 1024;
  if (source instanceof Uint8Array) {
    for (let index = 0; index < source.length; index += chunkSize) {
      const chunk = source.subarray(index, Math.min(source.length, index + chunkSize));
      if (onChunk) onChunk(chunk);
      await writer.write(chunk);
    }
    return;
  }
  for await (const chunk of source) {
    if (onChunk) onChunk(chunk);
    await writer.write(chunk);
  }
}

export async function deflateZlib(source) {
  if (typeof CompressionStream === 'undefined') {
    const error = new Error('CompressionStream unavailable');
    error.reason = 'other';
    throw error;
  }
  const format = await deflateFormat();
  const stream = new CompressionStream(format === 'zlib' ? 'deflate' : 'deflate-raw');
  const writer = stream.writable.getWriter();
  const done = new Response(stream.readable).arrayBuffer();
  let a = 1;
  let b = 0;
  await writeSource(writer, source, format === 'zlib' ? null : (chunk) => {
    for (let index = 0; index < chunk.length; index += 1) {
      a += chunk[index];
      b += a;
    }
    a %= 65521;
    b %= 65521;
  });
  await writer.close();
  const compressed = new Uint8Array(await done);
  if (format === 'zlib') return compressed;
  return wrapZlib(compressed, ((b << 16) | a) >>> 0);
}

export async function encodeRgbaPng(width, height, rgba) {
  const scan = encodeScanlines(width, height, rgba);
  const zlibBytes = await deflateZlib(scan);
  return buildPng({ width, height, zlibBytes });
}
