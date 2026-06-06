/* global React, window */
/* ============================================================
   MOCK DATA + ART TILE
   Gradient "artwork" stands in for real generated images.
   ============================================================ */

// build a layered mesh-gradient background from blobs
function meshBg(blobs, base) {
  const layers = blobs.map(
    (b) => `radial-gradient(${b.s || 60}% ${b.s || 60}% at ${b.x}% ${b.y}%, ${b.c} 0%, transparent 70%)`
  );
  return [...layers, `linear-gradient(160deg, ${base[0]}, ${base[1]})`].join(', ');
}

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

function ArtTile({ art, radius = 'var(--r-md)', style = {} }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', borderRadius: radius, overflow: 'hidden',
      background: meshBg(art.mesh, art.base), ...style,
    }}>
      {art.img && (
        <img src={art.img} alt="" decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {art.video && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,0.4)' }}>
            <Icon name="play" size={18} stroke={2} style={{ color: '#fff', marginLeft: 2 }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---- palettes ----
const P = {
  cyberpunk: { base: ['#1a0b2e', '#0a0612'], mesh: [{ x: 20, y: 25, c: '#ff2d8e', s: 70 }, { x: 78, y: 30, c: '#22d3ee', s: 60 }, { x: 55, y: 85, c: '#7c3aed', s: 75 }] },
  sunset: { base: ['#7c2d12', '#1a0a08'], mesh: [{ x: 50, y: 80, c: '#fb923c', s: 90 }, { x: 30, y: 30, c: '#f43f5e', s: 60 }, { x: 80, y: 20, c: '#fbbf24', s: 55 }] },
  forest: { base: ['#064e3b', '#041f18'], mesh: [{ x: 35, y: 30, c: '#34d399', s: 70 }, { x: 75, y: 70, c: '#a3e635', s: 55 }, { x: 20, y: 80, c: '#0d9488', s: 65 }] },
  magma: { base: ['#450a0a', '#160404'], mesh: [{ x: 50, y: 70, c: '#f97316', s: 80 }, { x: 25, y: 25, c: '#dc2626', s: 60 }, { x: 80, y: 40, c: '#fbbf24', s: 45 }] },
  cosmic: { base: ['#1e1b4b', '#0a0918'], mesh: [{ x: 30, y: 35, c: '#818cf8', s: 70 }, { x: 75, y: 65, c: '#c084fc', s: 65 }, { x: 60, y: 15, c: '#38bdf8', s: 50 }] },
  cherry: { base: ['#831843', '#2a0a1c'], mesh: [{ x: 40, y: 30, c: '#fb7185', s: 75 }, { x: 75, y: 70, c: '#fda4af', s: 60 }, { x: 20, y: 75, c: '#f472b6', s: 55 }] },
  arctic: { base: ['#0c4a6e', '#04141f'], mesh: [{ x: 45, y: 35, c: '#38bdf8', s: 75 }, { x: 78, y: 72, c: '#a5f3fc', s: 55 }, { x: 18, y: 78, c: '#6366f1', s: 55 }] },
  ember: { base: ['#3b0764', '#15032a'], mesh: [{ x: 50, y: 75, c: '#e879f9', s: 80 }, { x: 28, y: 28, c: '#a855f7', s: 60 }, { x: 82, y: 35, c: '#f0abfc', s: 45 }] },
  gold: { base: ['#713f12', '#1c1206'], mesh: [{ x: 50, y: 40, c: '#fcd34d', s: 80 }, { x: 78, y: 78, c: '#fb923c', s: 55 }, { x: 22, y: 75, c: '#a16207', s: 55 }] },
  ocean: { base: ['#134e4a', '#04201e'], mesh: [{ x: 38, y: 32, c: '#2dd4bf', s: 72 }, { x: 76, y: 70, c: '#22d3ee', s: 58 }, { x: 20, y: 80, c: '#0ea5e9', s: 55 }] },
  noir: { base: ['#27272a', '#0a0a0c'], mesh: [{ x: 40, y: 30, c: '#71717a', s: 65 }, { x: 78, y: 75, c: '#a1a1aa', s: 45 }, { x: 20, y: 80, c: '#3f3f46', s: 60 }] },
  bloom: { base: ['#4a044e', '#1a021c'], mesh: [{ x: 45, y: 35, c: '#f472b6', s: 72 }, { x: 75, y: 72, c: '#c084fc', s: 60 }, { x: 22, y: 78, c: '#fb7185', s: 50 }] },
};

const MODELS_SHORT = ['SD 3.5 Large', 'Flux Pro 1.1', 'DALL·E 3', 'Ideogram', 'Stable Image Ultra', 'Kandinsky 2.2'];
const TAGS = ['Sci-Fi', 'Landscape', 'Portrait', 'Fantasy', 'Architecture', 'Abstract', 'Nature', 'Anime', 'Animal'];
const AUTHORS = ['reebeezie', 'bomgaming2025', 'pogiboyz', 'kevinreber01', 'maplar1994', 'paelma', 'novarte', 'studioK'];

const PROMPTS = [
  'Neon cyberpunk megacity at night, flying cars, rain-slicked streets, cinematic',
  'Serene Japanese garden at sunset with cherry blossoms floating in the breeze',
  'Lone astronaut overlooking a glowing alien city through a vast ring portal',
  'Treehouse village in a giant pink cherry blossom tree, studio ghibli style',
  'Magma zone — cracked obsidian ground with rivers of molten lava, isometric',
  'Cozy coffee shop interior on a rainy day, warm lighting, watercolor style',
  'Aerial circuit-board city glowing with neon data streams at dusk',
  'Mystic purple lakeside at dawn, lone figure, mist rising over still water',
  'Bioluminescent forest with floating spores, deep emerald and teal palette',
  'Steampunk airship sailing through a star-filled cosmic nebula',
  'Subway car interior framing a golden-hour skyline through open doors',
  'Snow-capped mountain range under aurora, ultra-wide cinematic landscape',
  'Portrait of a sci-fi explorer, rim lighting, weathered armor, 85mm',
  'Ancient golden temple half-buried in desert dunes, volumetric god rays',
  'Abstract liquid chrome sculpture, iridescent, soft studio lighting',
  'Koi pond from above, vibrant water lilies, painterly impressionist style',
];

const palKeys = Object.keys(P).filter((k) => k !== 'noir');

// real generated sample images (from the repo) + fitting metadata
const A = (n) => `redesign/img/art-${String(n).padStart(2, '0')}.jpg`;
const ART_META = [
  { img: A(1), prompt: 'Sunlight streaming through a towering cathedral window, dust motes, cinematic', tag: 'Architecture', aspect: '1/1' },
  { img: A(2), prompt: 'Neon-soaked cyberpunk dwelling in a misty forest at night', tag: 'Sci-Fi', aspect: '1/1' },
  { img: A(3), prompt: 'Whimsical storybook cottage wreathed in autumn wildflowers and fog', tag: 'Fantasy', aspect: '1/1' },
  { img: A(4), prompt: 'Lone warrior facing a colossal fire-breathing dragon, epic silhouette', tag: 'Fantasy', aspect: '1/1', video: true },
  { img: A(5), prompt: 'Ornate steampunk locomotive contraption in a sunlit woodland', tag: 'Sci-Fi', aspect: '1/1' },
  { img: A(6), prompt: 'Vibrant neon-lit cabin glowing against a twilight forest', tag: 'Sci-Fi', aspect: '1/1' },
  { img: A(7), prompt: 'Surreal dreamscape of a draped frozen lake under pale light', tag: 'Landscape', aspect: '1/1' },
  { img: A(8), prompt: 'Enchanted bioluminescent forest around a tiny glowing cottage', tag: 'Fantasy', aspect: '1/1' },
  { img: A(9), prompt: 'Weathered cottage deep in an autumn forest, soft morning haze', tag: 'Landscape', aspect: '1/1' },
  { img: A(10), prompt: 'Massive battle-worn mecha beast prowling a dusty wasteland', tag: 'Sci-Fi', aspect: '1/1' },
  { img: A(11), prompt: 'Rustic cabin reflected in still forest water, golden hour', tag: 'Landscape', aspect: '1/1' },
  { img: A(12), prompt: 'Woman with a parasol in a lush garden, Studio Ghibli style', tag: 'Anime', aspect: '1/1' },
  { img: A(13), prompt: 'Moss-covered cabin in a verdant forest clearing, god rays', tag: 'Nature', aspect: '1/1' },
  { img: A(14), prompt: 'Geometric origami whale breaching a glowing sunset sea', tag: 'Landscape', aspect: '1/1', video: true },
  { img: A(15), prompt: 'Tiny lakeside cabin among autumn pines and drifting mist', tag: 'Landscape', aspect: '1/1' },
  { img: A(16), prompt: 'Portrait of a cyberpunk woman in a neon mask, glitch lighting', tag: 'Portrait', aspect: '1/1' },
  { img: A(17), prompt: 'Chestnut horse galloping through a mountain river, dynamic', tag: 'Animal', aspect: '3/4' },
  { img: A(18), prompt: 'Hyperreal portrait of a grey alien, dramatic low-key light', tag: 'Portrait', aspect: '4/3' },
  { img: A(19), prompt: 'Portrait of an armored knight, autumn castle backdrop, 85mm', tag: 'Portrait', aspect: '4/3' },
  { img: A(20), prompt: 'Energetic anime idol singing under bright neon stage lights', tag: 'Anime', aspect: '4/3' },
  { img: A(21), prompt: 'Anime princess with a sapphire dragon coiled around her', tag: 'Anime', aspect: '4/3' },
  { img: A(22), prompt: 'Wide-eyed chibi girl surrounded by tiny cartoon ghosts', tag: 'Anime', aspect: '3/4' },
  { img: A(23), prompt: 'Ornate golden genie lamp wreathed in mystic blue smoke', tag: 'Fantasy', aspect: '4/3', video: true },
  { img: A(24), prompt: 'Intense portrait of a hooded figure in intricate red robes', tag: 'Portrait', aspect: '1/1' },
  { img: A(25), prompt: 'Rain-slicked city street at night, vivid impressionist oil painting', tag: 'Abstract', aspect: '1/1' },
  { img: A(26), prompt: 'Woman in red gazing out a bright minimalist window', tag: 'Portrait', aspect: '1/1' },
  { img: A(27), prompt: 'Eerie abandoned cottage in a dark misty swamp', tag: 'Fantasy', aspect: '1/1' },
  { img: A(28), prompt: 'Colorful palette-knife painting of a curious cow', tag: 'Animal', aspect: '1/1' },
  { img: A(29), prompt: 'Shadowy figure in a dim doorway, unsettling horror tone', tag: 'Portrait', aspect: '1/1' },
  { img: A(30), prompt: 'Portrait of a stern elven elder with violet skin, fantasy', tag: 'Portrait', aspect: '3/4' },
];

function mkArt(i, overrides = {}) {
  const pal = P[palKeys[i % palKeys.length]];
  const meta = ART_META[i % ART_META.length];
  return {
    id: 'img_' + i,
    ...pal,
    img: meta.img,
    prompt: meta.prompt,
    author: AUTHORS[i % AUTHORS.length],
    model: MODELS_SHORT[i % MODELS_SHORT.length],
    tag: meta.tag,
    likes: [128, 64, 312, 41, 902, 17, 220, 76, 33, 510, 88, 145, 29, 401, 58, 190][i % 16],
    comments: [4, 0, 12, 1, 33, 0, 7, 2][i % 8],
    aspect: meta.aspect,
    video: !!meta.video,
    ...overrides,
  };
}

const ARTWORKS = Array.from({ length: 24 }, (_, i) => mkArt(i));

// ---- create-page models ----
const CREATE_MODELS = [
  { id: 'sd35l', name: 'Stable Diffusion 3.5 Large', provider: 'Stability AI', credits: 4, pal: 'cyberpunk', img: A(2), tag: 'Flagship', desc: '8B-parameter flagship. Exceptional quality and prompt adherence.' },
  { id: 'flux', name: 'Flux Pro 1.1', provider: 'Black Forest Labs', credits: 4, pal: 'gold', img: A(14), tag: 'Pro', desc: 'Professional-grade output with excellent prompt following.' },
  { id: 'ultra', name: 'Stable Image Ultra', provider: 'Stability AI', credits: 6, pal: 'cosmic', img: A(8), tag: null, desc: 'Premium model with exceptional detail, color and lighting.' },
  { id: 'sd35t', name: 'SD 3.5 Large Turbo', provider: 'Stability AI', credits: 2, pal: 'arctic', img: A(7), tag: 'Fast', desc: 'Fast 4-step generation while keeping high quality.' },
  { id: 'sd35m', name: 'SD 3.5 Medium', provider: 'Stability AI', credits: 2, pal: 'forest', img: A(13), tag: null, desc: 'Balanced 2.5B model for fast, efficient performance.' },
  { id: 'core', name: 'Stable Image Core', provider: 'Stability AI', credits: 1, pal: 'sunset', img: A(3), tag: 'Value', desc: 'Cost-effective quality for everyday generation.' },
  { id: 'dalle', name: 'DALL·E 3', provider: 'OpenAI', credits: 6, pal: 'ocean', img: A(11), tag: null, desc: 'Strong language understanding and coherent compositions.' },
  { id: 'ideo', name: 'Ideogram v2', provider: 'Ideogram', credits: 5, pal: 'bloom', img: A(25), tag: null, desc: 'Best-in-class legible text rendering inside images.' },
];

// ---- feed ----
const FEED = [
  { author: 'kevinreber01', art: mkArt(5), },
  { author: 'bomgaming2025', art: mkArt(4), },
  { author: 'bomgaming2025', art: mkArt(0), },
  { author: 'pogiboyz', art: mkArt(7), },
  { author: 'novarte', art: mkArt(8), },
  { author: 'pogiboyz', art: mkArt(11), },
  { author: 'reebeezie', art: mkArt(2), },
  { author: 'studioK', art: mkArt(14), },
  { author: 'maplar1994', art: mkArt(9), },
];

// ---- users ----
const USERS = [
  { handle: 'kevinreber01', name: 'Kevin Reber', followers: 1, images: 247, following: true, pal: 'cosmic' },
  { handle: 'bomgaming2025', name: 'BOMGAMING 02', followers: 34, images: 128, following: true, pal: 'magma' },
  { handle: 'pogiboyz', name: 'Pogi Boi Run Club', followers: 12, images: 87, following: true, pal: 'ember' },
  { handle: 'novarte', name: 'Nova Arté', followers: 540, images: 1203, following: false, pal: 'cherry' },
  { handle: 'maplar1994', name: 'Maplar', followers: 8, images: 41, following: false, pal: 'forest' },
  { handle: 'studioK', name: 'Studio Kestrel', followers: 211, images: 612, following: false, pal: 'arctic' },
];

// ---- admin ----
const ADMIN_STATS = [
  { label: 'Total Users', value: '1,841', sub: 'Registered accounts', icon: 'users', delta: '+3.2%', up: true },
  { label: 'Active Today', value: '214', sub: 'Users generating', icon: 'activity', delta: '+18', up: true },
  { label: 'Total Images', value: '1,917', sub: 'Generated content', icon: 'image', delta: '+126', up: true },
  { label: 'Generations', value: '108', sub: 'In last hour', icon: 'zap', delta: '+9', up: true },
  { label: 'Credits Active', value: '14,359', sub: 'In circulation', icon: 'coins', delta: '-2.1%', up: false },
  { label: 'Zero Credits', value: '240', sub: 'Users at risk', icon: 'alert', delta: '+14', up: false, warn: true },
];
const ADMIN_TODAY = [
  { label: 'Credits Purchased', value: '+1,240', tone: 'success', spark: [3, 5, 4, 7, 6, 9, 8, 11] },
  { label: 'Credits Spent', value: '−980', tone: 'danger', spark: [8, 6, 7, 5, 9, 6, 7, 8] },
  { label: 'Generations', value: '342', tone: 'info', spark: [4, 6, 5, 8, 7, 9, 12, 14] },
  { label: 'Success Rate', value: '98.6%', tone: 'accent', spark: [9, 9, 10, 9, 10, 10, 9, 10] },
];
const ADMIN_TABS = ['Overview', 'Users', 'Credits', 'Tokens', 'Models', 'Engagement', 'External Services', 'Deletion Logs'];
const ADMIN_QUICK = [
  { title: 'User Analytics', desc: 'Signups, activity and credit distribution', icon: 'users', pal: 'cosmic' },
  { title: 'Credit Economy', desc: 'Monitor credit flow and generation metrics', icon: 'coins', pal: 'gold' },
  { title: 'Deletion Logs', desc: 'History of removed images and videos', icon: 'trash', pal: 'magma' },
  { title: 'Browse Content', desc: 'Review and moderate user content', icon: 'image', pal: 'ember' },
];
const MODEL_USAGE = [
  { name: 'Stable Diffusion 3.5 Large', pct: 34, gens: 4821 },
  { name: 'Flux Pro 1.1', pct: 24, gens: 3402 },
  { name: 'DALL·E 3', pct: 18, gens: 2553 },
  { name: 'Stable Image Ultra', pct: 12, gens: 1702 },
  { name: 'Ideogram v2', pct: 8, gens: 1134 },
  { name: 'Others', pct: 4, gens: 567 },
];

const NOTIFS = [
  { who: 'system', text: 'Your image finished generating', time: '2m ago', icon: 'image', unread: true },
  { who: 'paelma', text: 'liked your image', time: '1h ago', kind: 'like', unread: true },
  { who: 'kevinreber01', text: 'started following you', time: '5h ago', kind: 'follow' },
  { who: 'novarte', text: 'commented: this is unreal 🔥', time: '1d ago', kind: 'comment' },
];

window.PS_DATA = {
  ArtTile, P, ARTWORKS, CREATE_MODELS, FEED, USERS, MODELS_SHORT, TAGS, AUTHORS,
  ADMIN_STATS, ADMIN_TODAY, ADMIN_TABS, ADMIN_QUICK, MODEL_USAGE, NOTIFS, mkArt, CREDITS: 2480,
};
window.ArtTile = ArtTile;
window.LANDING_PROMPTS = [
  'A neon cyberpunk city at night, flying cars in the rain',
  'A serene Japanese garden at sunset, cherry blossoms',
  'An astronaut overlooking a glowing alien city',
  'Bioluminescent forest with floating spores, cinematic',
];
