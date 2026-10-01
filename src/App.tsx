import Perlin from "./classes/Perlin";
import Palette from "./classes/Palette";
import PRNG from "./classes/PRNG";
import Range from "./classes/Range";
import React, { useEffect, useRef, ReactElement } from "react";
import Renderer from "./classes/Renderer";
import { debounce } from "./utils/utils";
import { onSettingsChange, settings } from "./wallpaper";

/** A new frame is generated when less than this many screen widths are drawn past the left screen edge */
const LOOKAHEAD = 2;

/** Order in which the fade-in paints the scene: CSS classes of layers and scene elements */
const PAINT_ORDER = [
    "backgroundMountain",
    "water",
    "middleMountain",
    "bottomMountain",
    "rocks",
    "trees",
    "buildings",
    "powerlines",
    "boat",
];

/**
 * Main application component. Scrolls the landscape with requestAnimationFrame.
 * The SVG holds everything from the left screen edge to the end of the generated
 * frames and pans with a CSS transform, so a frame costs nothing until the
 * SVG content runs short and a new frame has to be generated.
 * @component
 * @returns {ReactElement} The main application component.
 */
export const App = (): ReactElement => {
    const wallpaperRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const pictureRef = useRef<SVGGElement>(null);
    const paperRef = useRef<SVGSVGElement>(null);
    const hidingRef = useRef<HTMLStyleElement>(null);
    const fadingRef = useRef<HTMLStyleElement>(null);
    const landscapeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wallpaper = wallpaperRef.current as HTMLDivElement;
        const svg = svgRef.current as SVGSVGElement;
        const picture = pictureRef.current as SVGGElement;
        const paper = paperRef.current as SVGSVGElement;
        const hiding = hidingRef.current as HTMLStyleElement;
        const fading = fadingRef.current as HTMLStyleElement;
        const landscape = landscapeRef.current as HTMLDivElement;

        let renderer = new Renderer();
        let palette = new Palette(settings.inkColor, settings.paperColor);
        /** Seed in use: the seed setting, or a random one picked when it is empty */
        let seed = "";
        let position = 0;
        let drawnStart = 0;
        let drawnEnd = 0;

        const pan = () => {
            svg.style.transform = `translate3d(${drawnStart - position}px, 0, 0)`;
        };

        const setViewBox = () => {
            const height = window.innerHeight;
            const shift = (settings.vertical / 100) * height;
            const length = drawnEnd - drawnStart;
            svg.setAttribute("viewBox", `${drawnStart} ${-shift} ${length} ${height}`);
            svg.setAttribute("width", String(length));
            svg.setAttribute("height", String(height));
        };

        let fadeTimer = 0;
        const endFadeIn = () => {
            clearTimeout(fadeTimer);
            fading.textContent = "";
        };
        // Paint the scene in stage by stage. Each stage's elements wait at opacity 0, then fade in
        const startFadeIn = () => {
            endFadeIn();
            if (!settings.fadeIn) return;
            const time = settings.fadeInTime;
            fading.textContent =
                "@keyframes paint { from { opacity: 0; } }\n" +
                PAINT_ORDER.map(
                    (name, i) =>
                        `#Picture .${name} { animation: paint ${time}s ease-in-out ${i * time}s both; }`
                ).join("\n");
            // Remove the rules afterwards, or every redraw would replay the animation
            fadeTimer = window.setTimeout(endFadeIn, PAINT_ORDER.length * time * 1000 + 100);
        };

        // Generate frames if needed and replace the SVG content.
        // A redraw during a fade-in ends it, since it replaces the animated elements.
        const draw = () => {
            endFadeIn();
            // Cover half a screen more than needed, so draws are spaced out
            renderer.cover(position + window.innerWidth * (LOOKAHEAD + 0.5));
            renderer.evictBefore(position);

            drawnStart = Math.floor(position);
            drawnEnd = renderer.coveredEnd;

            picture.innerHTML = renderer.svg(
                new Range(drawnStart, drawnEnd),
                palette
            );
            setViewBox();
            pan();
        };

        /** Position when scrolling is off: 0 to 2 screen widths */
        const fixedPosition = () =>
            (settings.horizontal / 100) * 2 * window.innerWidth;

        /**
         * Regenerate from x=0 with the seed in use, then move to `to`.
         * Generation is deterministic, so this shows the same landscape again.
         */
        const restart = (to: number) => {
            PRNG.seed = seed;
            Perlin.perlin = undefined;
            renderer = new Renderer();
            position = to;
            draw();
            startFadeIn();
        };
        const restartAtStart = () =>
            restart(settings.scrolling ? 0 : fixedPosition());
        // Sliders send many updates while dragged
        const restartSoon = debounce(restartAtStart, 150);

        const applyLook = () => {
            palette = new Palette(settings.inkColor, settings.paperColor);
            wallpaper.style.background = palette.paperCSS;
            paper.classList.toggle("hidden", !settings.paperTexture);
            hiding.textContent = [...settings.hidden]
                .map((name) => `#Picture .${name} { display: none; }`)
                .join("\n");

            // One gradient per edge; the masks intersect. The mask sits on a container
            // that does not move, so panning does not redraw it
            const edges: [string, number][] = [
                ["to right", settings.fadeLeft],
                ["to left", settings.fadeRight],
                ["to bottom", settings.fadeTop],
                ["to top", settings.fadeBottom],
            ];
            const mask = settings.edgeFade
                ? edges
                      .map(([direction, size]) => `linear-gradient(${direction}, transparent, black ${size}%)`)
                      .join(", ")
                : "none";
            landscape.style.setProperty("mask-image", mask);
            landscape.style.setProperty("-webkit-mask-image", mask);
        };

        let regenerateTimer = 0;
        const scheduleRegeneration = () => {
            clearInterval(regenerateTimer);
            if (!settings.fadeIn || !settings.regenerate) return;
            regenerateTimer = window.setInterval(() => {
                // An empty seed setting means a new random landscape each time
                if (!settings.seed) seed = Date.now().toString();
                restartAtStart();
            }, Math.max(5, settings.regenerateTime) * 1000);
        };

        let last = performance.now();
        let frameRequest = 0;
        const tick = (now: number) => {
            frameRequest = requestAnimationFrame(tick);

            const elapsed = (now - last) / 1000;
            if (settings.fps > 0 && elapsed < 1 / settings.fps) return;
            last = now;
            if (!settings.scrolling || settings.speed === 0) return;

            // Clamp so a paused wallpaper does not jump when it resumes
            position += settings.speed * Math.min(elapsed, 0.1);

            const ahead = drawnEnd - position;
            if (ahead < window.innerWidth * LOOKAHEAD) draw();
            else pan();
        };

        const handleResize = debounce(() => {
            if (settings.scrolling) draw();
            else restart(fixedPosition());
        }, 200);

        const stopListening = onSettingsChange((changed) => {
            applyLook();

            if (changed.has("fadeIn")) {
                // Turning it on replays the paint-in on the current view
                if (settings.fadeIn) startFadeIn();
                else endFadeIn();
            }
            if (changed.has("fadeIn") || changed.has("regenerate") || changed.has("regenerateTime")) {
                scheduleRegeneration();
            }

            if (changed.has("seed")) {
                seed = settings.seed || Date.now().toString();
                restartSoon();
            } else if (!settings.scrolling && position !== fixedPosition()) {
                // Scrolling was turned off or the position slider moved
                restartSoon();
            } else if (changed.has("inkColor") || changed.has("paperColor")) {
                draw();
            } else if (changed.has("vertical")) {
                setViewBox();
            }
        });

        seed = settings.seed || Date.now().toString();
        applyLook();
        restartAtStart();
        scheduleRegeneration();
        frameRequest = requestAnimationFrame(tick);
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(frameRequest);
            clearTimeout(fadeTimer);
            clearInterval(regenerateTimer);
            window.removeEventListener("resize", handleResize);
            stopListening();
        };
    }, []);

    return (
        <div id="Wallpaper" ref={wallpaperRef}>
            {/* Rules that hide the scene elements turned off in the settings */}
            <style ref={hidingRef} />
            {/* Fade-in animation rules, present only while the scene paints in */}
            <style ref={fadingRef} />
            {/* Static container for the edge fade mask; the SVG pans inside it */}
            <div id="Landscape" ref={landscapeRef}>
                <svg id="SVG" ref={svgRef}>
                    <g id="Picture" ref={pictureRef} />
                </svg>
            </div>
            {/* Static overlay, so the paper filter is drawn once, not on every pan.
                Neutral shading: the paper colour comes from the palette */}
            <svg id="Paper" ref={paperRef}>
                <defs>
                    <filter id="roughpaper">
                        <feTurbulence
                            type="fractalNoise"
                            stitchTiles="stitch"
                            baseFrequency="0.02"
                            numOctaves="5"
                            result="noise"
                        />
                        <feDiffuseLighting
                            in="noise"
                            lightingColor="white"
                            surfaceScale="2"
                            result="diffLight"
                        >
                            <feDistantLight azimuth="45" elevation="60" />
                        </feDiffuseLighting>
                    </filter>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    filter="url(#roughpaper)"
                />
            </svg>
        </div>
    );
};
