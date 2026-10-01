<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/img/shanshui_logo_light.png">
  <img alt="Shan Shui logo" src="./docs/img/shanshui_logo_dark.png" width="200" height="200">
</picture>
<h1>{Shan, Shui}*</h1> 
</div>
<br>

Discover the beauty of an ever-evolving Chinese landscape art. This project combines the elegance of procedural generation with the power of vector graphics to create a mesmerizing, infinite-scrolling journey.

<img alt="Shan Shui example" src="./docs/img/example.png" width="100%">

This fork packages it as a [Wallpaper Engine](https://www.wallpaperengine.io/) web wallpaper: the landscape scrolls slowly and endlessly across your desktop, with no interface.

## 🏗️ Tech stack

React, TypeScript and SVG. Nothing more! ✨

## ⚙️ Installation

[Check it in online](https://shan-shui.vercel.app/) or locally:

```
bun install
bun start
```

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
| Scene elements… (shows the toggles below) | `showelements` | checkbox |
| Trees, buildings, power lines, rocks, boats, distant mountains, water ripples | `showtrees`, `showbuildings`, `showpowerlines`, `showrocks`, `showboats`, `showdistantmountains`, `showwater` | checkboxes |

A seed always gives the same landscape, so a fixed seed with scrolling off is a
still picture you can frame with the two position sliders. Hiding an element
doesn't change the rest of the landscape.

To debug, set a **CEF devtools port** in Wallpaper Engine's settings (General tab) and
open `localhost:<port>` in Chrome. In a normal browser, `bun start` runs the wallpaper
with default settings, and `?seed=` fixes the landscape.

## 📖 Documentation

[Check it in online](https://megaemce.github.io/shan_shui_docs/) or generate it locally with TypeDoc from Shan_Shui project.

```
bun docs
```

## 📜 Versions

This is the third iteration of this app:

1. Firstly created as a [monolithic JavaScript file](https://github.com/LingDong-/shan-shui-inf) by [Lingdong Huang](https://github.com/LingDong-)
2. Then it was [rebuilt with React 17](https://github.com/RedContritio/shan_shui_inf) by [RedContritio](https://github.com/RedContritio) without changing the source code
3. I have rebuilt it using React function components, employing an object-oriented programming approach. Additionally, I have addressed several bugs and incorporated various improvements for enhanced performance and readability:

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

4. This fork turns [Megaemce's version](https://github.com/Megaemce/shan_shui) into a Wallpaper Engine wallpaper: smooth scrolling, constant memory use over long runs, ink and paper colours as wallpaper properties, and the interface removed.

All credit for the art and the generators goes to Lingdong Huang, RedContritio and Megaemce. Licensed under MIT, see [LICENSE](LICENSE).