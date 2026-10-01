<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/img/shanshui_logo_light.png">
  <img alt="Shan Shui logo" src="./docs/img/shanshui_logo_dark.png" width="200" height="200">
</picture>
<h1>{Shan, Shui}*</h1> 
<p><b>Wallpaper Engine edition</b></p>
</div>
<br>

> This repository has diverged from its upstream into a standalone
> [Wallpaper Engine](https://store.steampowered.com/app/431960/Wallpaper_Engine/)
> wallpaper, [published on the Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=3811517642).
> The landscape art and its generators are the work of the original projects:
> [shan-shui-inf](https://github.com/LingDong-/shan-shui-inf) by Lingdong Huang,
> the [React port](https://github.com/RedContritio/shan_shui_inf) by RedContritio,
> and the [rewrite](https://github.com/Megaemce/shan_shui) by Megaemce, which this
> repository was cloned from with its full history. See [Versions](#-versions) for
> what changed here.

Discover the beauty of an ever-evolving Chinese landscape art. This project combines the elegance of procedural generation with the power of vector graphics to create a mesmerizing, infinite-scrolling journey.

<img alt="Shan Shui example" src="./docs/img/example.png" width="100%">

This fork packages it as a [Wallpaper Engine](https://www.wallpaperengine.io/) web wallpaper: the landscape scrolls slowly and endlessly across your desktop, with no interface.

**Get it on the Steam Workshop:** [Shan Shui](https://steamcommunity.com/sharedfiles/filedetails/?id=3811517642)

## 🏗️ Tech stack

React, TypeScript and SVG. Nothing more! ✨

## ⚙️ Running it locally

```
bun install
bun start
```

This opens the wallpaper in a browser with default settings (add `?seed=` to the
URL to fix the landscape). Megaemce's interactive web version, with buttons and
SVG download, is online at [shan-shui.vercel.app](https://shan-shui.vercel.app/).

## 🖼️ Wallpaper Engine

Build the wallpaper and import it once:

1. `bun install`, then `bun run build`.
2. In Wallpaper Engine, open the editor and drag `build/index.html` onto **Create Wallpaper**.
   Wallpaper Engine copies the files into a new project folder, usually
   `<Steam library>\steamapps\common\wallpaper_engine\projects\myprojects\<name>`.

After that, don't import again: each import creates another project. Update the
existing one instead:

1. Create `.env.local` in the repo root (it is git-ignored) with the project folder:

    ```
    WALLPAPER_DIR=D:\SteamLibrary\steamapps\common\wallpaper_engine\projects\myprojects\shan_shui
    ```

2. Run `bun run deploy`. It builds and copies `build/` into `WALLPAPER_DIR`, then you
   reload the wallpaper in Wallpaper Engine.

`public/project.json` and `public/preview.gif` are the repo copies of the files the
editor owns. If you change properties or the preview in the editor, deploy keeps
the newer editor copy and prints the command to copy it back into `public/`.

User properties:

| Property | Key | Type |
| --- | --- | --- |
| Scrolling | `scrolling` | checkbox |
| Scroll speed (px/s, shown while scrolling) | `scrollspeed` | slider 0–100 |
| Horizontal position (0–2 screen widths, shown while not scrolling) | `horizontalposition` | slider 0–100 |
| Vertical position (% of screen height, positive moves down) | `verticalposition` | slider -50–50 |
| Ink colour | `inkcolor` | colour |
| Paper colour | `papercolor` | colour |
| Paper texture | `papertexture` | checkbox |
| Seed (empty: new landscape on each load) | `seed` | text |
| Fade gradient… (shows the four sliders below) | `fadegradient` | checkbox |
| Left, right, top, bottom: how far the fade reaches into the screen, in % (100 = across the whole screen) | `fadeleft`, `faderight`, `fadetop`, `fadebottom` | sliders 0–100 |
| Fade in… (paints the scene in stage by stage when it is generated) | `fadein` | checkbox |
| Element time: seconds each stage takes | `fadeintime` | slider 0.2–10 |
| Regenerate: repaint every _n_ seconds (new random landscape if the seed is empty) | `regenerate`, `regeneratetime` | checkbox, slider 5–3600 |
| Scene elements… (shows the toggles below) | `showelements` | checkbox |
| Trees, buildings, power lines, rocks, boats, distant mountains, water ripples | `showtrees`, `showbuildings`, `showpowerlines`, `showrocks`, `showboats`, `showdistantmountains`, `showwater` | checkboxes |

A seed always gives the same landscape, so a fixed seed with scrolling off is a
still picture you can frame with the two position sliders. Hiding an element
doesn't change the rest of the landscape.

To debug, set a **CEF devtools port** in Wallpaper Engine's settings (General tab) and
open `localhost:<port>` in Chrome. In a normal browser, `bun start` runs the wallpaper
with default settings, and `?seed=` fixes the landscape.

## 📖 Documentation

Megaemce's code documentation is [online](https://megaemce.github.io/shan_shui_docs/) (for the upstream version), or generate it for this one with TypeDoc:

```
bun docs
```

## 📜 Versions

This is the fourth iteration of this app:

1. Firstly created as a [monolithic JavaScript file](https://github.com/LingDong-/shan-shui-inf) by [Lingdong Huang](https://github.com/LingDong-)
2. Then it was [rebuilt with React 17](https://github.com/RedContritio/shan_shui_inf) by [RedContritio](https://github.com/RedContritio) without changing the source code
3. [Megaemce](https://github.com/Megaemce/shan_shui) rebuilt it using React function components and an object-oriented approach, fixing several bugs and improving performance and readability:

    - Dark mode was added,
    - Some of the most complex elements were simplified,
    - Whole code was rewritten and commented using JSDoc,
    - [Fastest way to work with array](https://annoyscript.vercel.app/posts/The%20fastest%20way%20to%20work%20with%20arrays/) was implemented wherever it was reasonable,
    - Invisible objects are removed from the DOM for faster rendering and lower memory consumption,
    - Designing and rendering is done via [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) and [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) for parallel computation, preventing [main thread blockages](https://web.dev/articles/optimize-long-tasks?utm_source=devtools).
      <br>
      <br>

    | | [DCL](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event) | [FCP](https://web.dev/articles/fcp) | [LCP](https://web.dev/articles/lcp) | Longest task |
    | --- | :-: | :-: | :-: | :-: |
    | Old  | 4.92s | 4.92s | 6.18s | 2.02s |
    | New  |  0.19s | 0.25s | 0.25s | 0.23s |
    | Diff | ⏬25x | ⏬19x | ⏬25x | ⏬8x |

4. This fork turns Megaemce's version into a Wallpaper Engine wallpaper:

    - smooth scrolling, with new landscape generated well off-screen,
    - constant memory use over long runs (old landscape is discarded, each layer's SVG is built once),
    - reproducible landscapes: a seed gives the same picture at any position and screen size,
    - wallpaper properties for speed, position, ink and paper colours, paper texture, seed, edge fades, a paint-in animation with timed regeneration, and hiding scene elements,
    - the interface removed.

All credit for the art and the generators goes to Lingdong Huang, RedContritio and Megaemce. Licensed under MIT, see [LICENSE](LICENSE).