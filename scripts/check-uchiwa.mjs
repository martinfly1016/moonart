import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {
  PNG_PPM_300DPI,
  a3FallbackSlices,
  buildPng,
  encodeScanlines,
  exceedsCanvasLimit,
  insertPhysChunk,
  readPngChunks
} from '../assets/js/png-phys.js';
import {
  PAPERS,
  compactState,
  decodeShareHash,
  defaultState,
  encodeShareHash,
  fanSizeMm,
  planPaperPages,
  splitFans
} from '../assets/js/oshi-settings.js';

function unfilter(width, height, scan) {
  const out = new Uint8Array(width * height * 3);
  let src = 0;
  let dest = 0;
  for (let y = 0; y < height; y += 1) {
    assert.equal(scan[src], 1);
    src += 1;
    let prevR = 0;
    let prevG = 0;
    let prevB = 0;
    for (let x = 0; x < width; x += 1) {
      const r = (scan[src] + prevR) & 255;
      const g = (scan[src + 1] + prevG) & 255;
      const b = (scan[src + 2] + prevB) & 255;
      out[dest] = r;
      out[dest + 1] = g;
      out[dest + 2] = b;
      prevR = r;
      prevG = g;
      prevB = b;
      src += 3;
      dest += 3;
    }
  }
  return out;
}

const width = 2;
const height = 2;
const rgba = new Uint8Array([
  255, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 255, 255, 255, 255, 255, 255
]);
const scan = encodeScanlines(width, height, rgba);
const png = buildPng({ width, height, zlibBytes: zlib.deflateSync(scan) });
const chunks = readPngChunks(png);
assert.deepEqual(chunks.map((chunk) => chunk.type), ['IHDR', 'pHYs', 'IDAT', 'IEND']);
const phys = chunks.find((chunk) => chunk.type === 'pHYs');
const view = new DataView(phys.data.buffer, phys.data.byteOffset, phys.data.byteLength);
assert.equal(view.getUint32(0), PNG_PPM_300DPI);
assert.equal(view.getUint32(4), PNG_PPM_300DPI);
assert.equal(phys.data[8], 1);
const inflated = zlib.inflateSync(chunks.find((chunk) => chunk.type === 'IDAT').data);
const rgb = unfilter(width, height, inflated);
assert.deepEqual(Array.from(rgb), [255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255]);
assert.equal(insertPhysChunk(png).length, png.length);

assert.equal(exceedsCanvasLimit(PAPERS.A4.pxW, PAPERS.A4.pxH), false);
assert.equal(exceedsCanvasLimit(PAPERS.A3.pxW, PAPERS.A3.pxH), true);
const slices = a3FallbackSlices();
assert.equal(slices[0].height + slices[1].height, PAPERS.A3.pxH);

const jumbo = fanSizeMm({ size: 'jumbo' });
const regular = fanSizeMm({ size: 'regular' });
assert.equal(planPaperPages(jumbo, PAPERS.A3).length, 1);
assert.ok(planPaperPages(jumbo, PAPERS.A4).length > 1);
assert.ok(planPaperPages(regular, PAPERS.A4).length > 1);
assert.equal(planPaperPages(regular, PAPERS.A3).length, 1);
assert.deepEqual(splitFans('大好き', 'renketsu', 1), ['大', '好', 'き']);
assert.deepEqual(splitFans('大好き', 'renketsu', 2), ['大好', 'き']);
assert.deepEqual(splitFans('大 好き', 'single', 1), ['大 好き']);

const longName = 'あ'.repeat(50);
const encoded = encodeShareHash({
  ...defaultState(),
  text: longName,
  font: 'rounded',
  mode: 'uchiwa',
  effect: 'still',
  blinkHz: 0,
  speed: 3
});
const decoded = decodeShareHash(encoded);
assert.equal(decoded.text.length, 40);
assert.equal(decoded.font, 'rounded');
assert.equal(decoded.effect, 'still');
assert.equal(decoded.speed, 3);
assert.equal(decoded.v, 1);
assert.equal(compactState(decoded).m, 'u');
assert.equal(decodeShareHash('not-valid'), null);

console.log('uchiwa checks passed');
