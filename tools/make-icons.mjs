/**
 * Generates the home-screen icons.
 *
 * They are drawn rather than downloaded so the app does not depend on a
 * third-party CDN for its own icon: iOS fetches an apple-touch-icon exactly
 * once, at the moment you tap "Add to Home Screen", and if that fetch is slow
 * or blocked you get a screenshot of the page instead of an icon — with no way
 * to retry short of removing and re-adding.
 *
 * Run with `npm run build:icons`. Writes into ../docs/, which is the wrapper
 * site GitHub Pages serves (see docs/README.md for why a wrapper is needed).
 *
 * Sizes:
 *   180  apple-touch-icon. iOS rounds the corners itself, so this is drawn
 *        full-bleed — a pre-rounded source gets rounded twice and looks wrong.
 *   192  the Android/Chrome install prompt.
 *   512  splash screens and the app listing.
 *   512 maskable: Android crops to a circle on some launchers, so the artwork
 *        stays inside the middle 80% and the gradient runs to the edge.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'docs');

// Pillow does the drawing: Node has no image library here, and Windows ships
// Segoe UI Emoji, which renders 🎮 in colour.
const PY = String.raw`
import sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]

# The app's own violet, top-left to bottom-right.
TOP    = (109, 40, 217)
BOTTOM = (139, 92, 246)

def gradient(size):
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            # Diagonal ramp, so it matches the app's 155deg backdrop.
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(int(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3))
    return img

def draw_icon(size, glyph_ratio):
    img = gradient(size)
    d = ImageDraw.Draw(img)
    target = int(size * glyph_ratio)
    # Segoe UI Emoji only has bitmap strikes at certain sizes; ask for the
    # nearest and scale, rather than getting a blank box.
    font = ImageFont.truetype('C:/Windows/Fonts/seguiemj.ttf', 109)
    layer = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((80, 80), '\U0001F3AE', font=font,
                               anchor='mm', embedded_color=True)
    layer = layer.crop(layer.getbbox())
    # Segoe's gamepad is near-black, which sits muddily on the violet. Keep the
    # shape and its antialiasing, throw the colour away: a white silhouette on
    # the brand colour is what reads at 40px on a home screen.
    alpha = layer.split()[3]
    layer = Image.new('RGBA', layer.size, (255, 255, 255, 255))
    layer.putalpha(alpha)
    w, h = layer.size
    scale = target / max(w, h)
    layer = layer.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    img.paste(layer, ((size - layer.width) // 2, (size - layer.height) // 2), layer)
    return img

for size, ratio, name in [
    (180, 0.62, 'icon-180.png'),
    (192, 0.62, 'icon-192.png'),
    (512, 0.62, 'icon-512.png'),
    (512, 0.46, 'icon-maskable-512.png'),   # artwork inside the safe circle
    (64,  0.66, 'favicon-64.png'),
]:
    draw_icon(size, ratio).save(OUT + '/' + name, 'PNG', optimize=True)
    print('  ' + name)
`;

await mkdir(out, { recursive: true });
console.log('drawing icons into docs/');
const { stdout, stderr } = await run('python', ['-c', PY, out]);
if (stderr.trim()) console.error(stderr);
process.stdout.write(stdout);
