// Rasterizes the public us-atlas state boundaries (Albers USA projection) into a pixel grid of state codes
// for the desert quest map (src/data/usStateGrid.ts).
// Usage: node scripts/rasterize_us_map.js <states-albers-10m.json> <path to an installed topojson-client package> src/data/usStateGrid.ts 120
// (states-albers-10m.json comes from https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json)
const fs = require('fs');
const path = require('path');
const [, , input, topoDir, out, colsArg] = process.argv;
const topojson = require(path.resolve(topoDir));
const topo = JSON.parse(fs.readFileSync(input, 'utf8'));
const geo = topojson.feature(topo, topo.objects.states);

const ABBR = {
  Alabama: 'AL', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE',
  'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI',
  Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH',
  Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY',
};

const states = geo.features
  .filter((f) => ABBR[f.properties.name])
  .map((f) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    polys.forEach((poly) => poly[0].forEach(([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }));
    return { abbr: ABBR[f.properties.name], name: f.properties.name, polys, bbox: [minX, minY, maxX, maxY] };
  })
  .sort((a, b) => a.abbr.localeCompare(b.abbr));

const minX = Math.min(...states.map((s) => s.bbox[0]));
const minY = Math.min(...states.map((s) => s.bbox[1]));
const maxX = Math.max(...states.map((s) => s.bbox[2]));
const maxY = Math.max(...states.map((s) => s.bbox[3]));
const cols = Number(colsArg || 120);
const cell = (maxX - minX) / cols;
const rows = Math.ceil((maxY - minY) / cell);

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inState(x, y, s) {
  if (x < s.bbox[0] || x > s.bbox[2] || y < s.bbox[1] || y > s.bbox[3]) return false;
  return s.polys.some((poly) => inRing(x, y, poly[0]) && !poly.slice(1).some((hole) => inRing(x, y, hole)));
}

// Index alphabet: '.' = water, then one character per state
const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const grid = [];
for (let r = 0; r < rows; r++) {
  let line = '';
  for (let c = 0; c < cols; c++) {
    // Sample a few points per cell so thin states (like DC, RI, DE) still show up
    const hits = new Map();
    for (const [ox, oy] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
      const x = minX + (c + ox) * cell;
      const y = minY + (r + oy) * cell;
      const i = states.findIndex((s) => inState(x, y, s));
      if (i >= 0) hits.set(i, (hits.get(i) || 0) + 1);
    }
    const best = [...hits.entries()].sort((a, b) => b[1] - a[1])[0];
    line += best && best[1] >= 2 ? ALPHA[best[0]] : '.';
  }
  grid.push(line);
}

const missing = states.filter((s, i) => !grid.some((l) => l.includes(ALPHA[i]))).map((s) => s.abbr);
console.log(`grid ${cols}x${rows}, cell ${cell.toFixed(2)}, states ${states.length}, missing: ${missing.join(',') || 'none'}`);

const ts = `// Pixel grid of the lower 48 US states (+ DC), generated from the public us-atlas
// state boundaries (Albers USA projection). Each character is one map pixel:
// '.' is water/outside, otherwise it is an index into US_STATES via US_GRID_ALPHABET.
// Regenerate with scripts/rasterize_us_map.js rather than editing by hand.

export const US_GRID_COLS = ${cols};
export const US_GRID_ROWS = ${rows};
export const US_GRID_ALPHABET = '${ALPHA}';

export const US_STATES: { abbr: string; name: string }[] = [
${states.map((s) => `  { abbr: '${s.abbr}', name: '${s.name}' },`).join('\n')}
];

export const US_GRID: string[] = [
${grid.map((l) => `  '${l}',`).join('\n')}
];
`;
fs.writeFileSync(out, ts);
