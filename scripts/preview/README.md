# Preview GIF

`public/preview.gif` (300 px square, under 1 MB for the Workshop) was made with
these scripts from seed `river`, with the paper texture off (it looks muddy when
scaled down). Needs Microsoft Edge, Python with Pillow, and
gifsicle (`npm i gifsicle` puts a binary in `node_modules/gifsicle/vendor`).

```
bun run build
node scripts/preview/capture.mjs stills out/stills 8 river mist pine   # pick a seed
node scripts/preview/capture.mjs frames out/frames 8 river 72 8 0     # 72 frames, 8 px apart
python scripts/preview/makegif.py out/frames raw.gif 300 64 12 15      # size, colours, fade frames, fps
gifsicle -O3 --lossy=30 raw.gif -o public/preview.gif
```

The last 12 frames cross-fade into the first ones, so the GIF loops without a jump.
