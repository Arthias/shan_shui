# CLAUDE.md

Fork of [Megaemce/shan_shui](https://github.com/Megaemce/shan_shui) (MIT), itself
the third iteration of Lingdong Huang's
[shan-shui-inf](https://github.com/LingDong-/shan-shui-inf) via
[RedContritio/shan_shui_inf](https://github.com/RedContritio/shan_shui_inf).
Goal of this fork: package it as a **Wallpaper Engine web wallpaper**.
Scope is deliberately small: the target is a working, publishable wallpaper in
**one day**. Prefer deleting code to building new things.

Keep `LICENSE` (Copyright (c) 2018 Lingdong Huang) untouched, and credit all
three upstream authors in the README and the Workshop description.

## Context for the agent picking this up

This file is the only handoff from a first review pass (2026-10-01). Everything
under "Known problems" was checked against the upstream code at commit
`312ea4e`; everything under "To do" is a plan, not done work.

Repo setup (done 2026-10-01): `origin` is the **private** repo
`Arthias/shan_shui`. It is not a GitHub fork, because GitHub does not allow
private forks of public repos. `upstream` is `Megaemce/shan_shui`, and the full
upstream history is kept. Work happens on the `wallpaper-engine` branch. Because
GitHub shows no "forked from" link, the README must link the upstream repos.
Ask the user before pushing or changing anything on GitHub.

## Commands

```
bun install
bun start        # CRA dev server, http://localhost:3000
bun run build    # production bundle in build/
bun docs         # TypeDoc
```

There are no tests. `react-scripts` 5 (CRA), React 19, TypeScript. No
runtime network calls; the font is a local base64 `@font-face` in `src/style.css`.

## How it works

- `App.tsx` reads `?seed=` (else uses `Date.now()`), seeds `PRNG`, and holds the
  scroll position `newPosition`. Auto-scroll steps `step` px every 1000 ms.
- `ui/ScrollableCanvas.tsx` calls `renderer.render(range)` whenever the position
  or width changes, then injects the SVG string with `dangerouslySetInnerHTML`.
  The canvas pans by changing the `viewBox`.
- `classes/Renderer.ts`: if the range is not yet covered, `Designer` plans a new
  `Frame` (`forwardCoverage` = half the window width ahead). It then collects
  every visible layer from **all** frames, sorts by `config.renderer.tagOrder`,
  and stringifies each layer in a freshly spawned Web Worker (`Layer.render`,
  blob URL from `utils/layerWorker.ts`).
- `classes/layers/*`: mountain, water and boat generators. Tunables live in
  `src/config.ts`.
- Generation is driven by one global PRNG stream (`PRNG`, `Perlin` are static
  singletons), so output depends on the seed **and** the order frames are generated in.

## Known problems that matter for a wallpaper

Verified against the code on 2026-10-01:

1. **Unbounded growth.** `Renderer.frames` is only appended to; frames behind
   the viewport are never evicted. Each render loops over every frame, and
   `Frame.range` is a getter that rescans all of the frame's layers. Memory and
   per-step CPU both grow with uptime.
2. **Worker per layer per step.** Every render re-stringifies every visible layer
   by structured-cloning its elements into a new Worker. Nothing is cached, and
   the `hardwareConcurrency` chunking does nothing because all promises start at
   once. Caching each layer's SVG string once would remove most of the per-step cost.
3. **`Perlin.perlin` is never reset.** `Menu.reload()` reseeds `PRNG` but keeps the
   old noise table, so a reloaded scene does not match the same seed loaded fresh.
4. **Breaks when loaded from disk.** Wallpaper Engine loads the page from a local
   file. The build emits absolute `/static/...` paths (needs `"homepage": "."`),
   and `App.tsx` / `Menu.tsx` call `history.pushState(..., "/?seed=...")`, which
   rewrites the path to `/` and should throw a SecurityError on a `file://`
   origin (not yet tested in Wallpaper Engine).
5. **Expensive background.** `feTurbulence numOctaves="5"` filters a fullscreen
   rect. This is the first suspect for GPU/CPU cost at 4K. The filter is defined
   twice: in `ui/ScrollableCanvas.tsx` and in `Renderer.download()`.
   Also, the `#Background` rect sits at x=0 and is one window wide, while the
   `viewBox` pans right. The texture probably scrolls off-screen after one screen
   width and probably needs `x={newPosition}` (not yet checked in a browser).
6. Blocking `alert` / `confirm` calls (window < 400 px, scrolling left of 0,
   reload confirm) must not fire in a wallpaper.
7. Dark mode lives in `ui/SettingPanel.tsx`. It reads `prefers-color-scheme` and
   toggles a `darkmode` class on several elements, including the `#SVG`. Removing
   the UI removes dark mode unless that class toggle is moved somewhere else.
8. Auto-scroll jumps `step` px once a second instead of moving smoothly, and each
   jump runs a full render (problem 2).

## To do

In priority order. Items 1–5 are the minimum for a usable wallpaper.

1. **Fix loading from disk.** Add `"homepage": "."` to `package.json`. Remove
   the `history.pushState` / `replaceState` calls in `App.tsx` and `Menu.tsx`.
2. **Remove the interface.** Delete the settings panel, menu, scroll buttons,
   download/share, arrow-key handling and the loader overlay (`ui/SettingPanel.tsx`,
   `ui/Menu.tsx`, `ui/Button.tsx`, the matching `interfaces/` and CSS). Download
   also lives in `Renderer.download()`, so delete it there too. The loader markup
   and the `getElementById("Loader")` calls are in `ui/ScrollableCanvas.tsx`, which
   is kept, so strip them from it. Remove
   every `alert` / `confirm`. Keep the canvas and run auto-scroll from page load.
   Keep the dark-mode class toggle (problem 7) so it can become a property.
3. **Fix memory growth.** Evict frames whose range ends well behind
   `Renderer.visibleRange.start`, for example one screen width back. Frames are
   only ever needed ahead of the viewport because the wallpaper never scrolls
   left. Fix ids at the same time. The SVG `<g id="frame${frameNum}-layer…">`
   uses `frameNum` = the frame's **array index** in `Renderer.render`, not its
   `Frame` id, so ids shift once frames are evicted. Separately, `createNewFrame`
   sets `Frame` ids from `frames.length + 1`, so those repeat. Use one counter that
   only increases for both. Item 4's cached strings embed the id, so ids must
   stay fixed for the life of a layer.
4. **Cut the per-step cost.** Cache each layer's SVG string the first time it is
   rendered, so a step only stringifies new layers. Ideally drop the
   one-Worker-per-layer pattern for cached layers altogether.
5. **Wallpaper Engine packaging.** See
   https://docs.wallpaperengine.io/en/web/first/gettingstarted.html. Wallpaper
   Engine **generates `project.json` itself**: run `bun run build`, then drag
   `build/index.html` onto "Create Wallpaper". It imports every file in `build/`
   and its subfolders. User properties are added in the editor and saved into
   that `project.json`. After the first import, copy the generated `project.json`
   and the preview image into `public/`. CRA copies `public/` into `build/`, so
   later builds include them and can be copied over the imported project. Write
   the build-and-import steps and the credit block in the README. Properties
   reach the page through `window.wallpaperPropertyListener.applyUserProperties`.
6. **Seed property.** A text property: empty means a random seed (current
   behaviour), any text means a fixed, reproducible landscape. `PRNG.seed`
   already accepts strings. Changing it should regenerate in place using the
   `Menu.reload()` logic, and must also reset `Perlin.perlin = undefined`
   (problem 3).
7. **Pick the user properties.** Review `src/config.ts` and the renderer and
   choose a **small** set, about five or fewer. Likely candidates, to confirm:
   - scroll speed (`step` and/or the 1000 ms interval)
   - dark mode (bool)
   - paper texture on/off, or a lower `numOctaves` (also the 4K performance lever)
   - ink colour or ink opacity (the `rgba(100,100,100,…)` values in `config.ts`)
   - optionally, regenerate with a new random seed every N minutes
   Avoid anything that needs the generators reworked.
8. **Test.** Run it for an hour at 1080p and at 4K if available, and watch memory
   in Wallpaper Engine's CEF devtools. Confirm memory stays flat after item 3.

Optional, only if there is time: make scrolling smooth by moving the `viewBox`
a pixel or two per animation frame, and generating new frames only when the
viewport nears `Renderer.coveredRange.end`. Panning would then cost nothing,
and generation would only run every few seconds.
