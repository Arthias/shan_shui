# Build a seamlessly looping GIF: the last FADE frames cross-fade into the first ones.
import glob, os, sys
from PIL import Image

src, out, size, colors, fade, fps = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
frames = [Image.open(f).convert("RGB").resize((size, size), Image.LANCZOS) for f in sorted(glob.glob(src + "/f*.png"))]
n = len(frames) - fade
loop = [Image.blend(frames[n + i], frames[i], i / fade) for i in range(fade)] + frames[fade:n]

# One shared palette, no dithering: dithered paper texture compresses badly and flickers.
# The last palette index is kept free as the transparent colour.
palette = loop[0].quantize(colors=colors - 1, method=Image.Quantize.MEDIANCUT)
quantized = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in loop]
CLEAR = colors - 1

# Each frame after the first only stores pixels that changed; the rest stay from the
# previous frame (disposal 1) and are written as the transparent index, which compresses well
written = [quantized[0]]
for prev, cur in zip(quantized, quantized[1:]):
    p, c = prev.tobytes(), cur.tobytes()
    frame = Image.frombytes("P", cur.size, bytes(CLEAR if a == b else b for a, b in zip(p, c)))
    frame.putpalette(cur.getpalette())
    written.append(frame)

# The first frame also loops back from the last one, so it is written in full
written[0].save(out, save_all=True, append_images=written[1:], duration=round(1000 / fps), loop=0,
                optimize=False, disposal=1, transparency=CLEAR)
print(f"{len(quantized)} frames, {size}px, {colors} colours: {os.path.getsize(out) / 1024:.0f} KB")
