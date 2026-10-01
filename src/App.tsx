import Perlin from "./classes/Perlin";
import Palette from "./classes/Palette";
import PRNG from "./classes/PRNG";
import Range from "./classes/Range";
import React, { useEffect, useRef, ReactElement } from "react";
import Renderer from "./classes/Renderer";
import { debounce } from "./utils/utils";
import { onSettingsChange, settings } from "./wallpaper";

/** Frames are generated this many screen widths past the left screen edge */
const LOOKAHEAD = 2;

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

    useEffect(() => {
        const wallpaper = wallpaperRef.current as HTMLDivElement;
        const svg = svgRef.current as SVGSVGElement;
        const picture = pictureRef.current as SVGGElement;
        const paper = paperRef.current as SVGSVGElement;

        let renderer = new Renderer();
        let palette = new Palette(settings.inkColor, settings.paperColor);
        let position = 0;
        let drawnStart = 0;
        let drawnEnd = 0;

        const pan = () => {
            svg.style.transform = `translate3d(${drawnStart - position}px, 0, 0)`;
        };

        // Generate frames if needed and replace the SVG content
        const draw = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            renderer.cover(
                new Range(position, position + width * LOOKAHEAD),
                width / 2
            );
            renderer.evictBefore(position);

            drawnStart = Math.floor(position);
            drawnEnd = renderer.coveredEnd;
            const length = drawnEnd - drawnStart;

            picture.innerHTML = renderer.svg(
                new Range(drawnStart, drawnEnd),
                palette
            );
            svg.setAttribute("viewBox", `${drawnStart} 0 ${length} ${height}`);
            svg.setAttribute("width", String(length));
            svg.setAttribute("height", String(height));
            pan();
        };

        const reseed = () => {
            PRNG.seed = settings.seed || Date.now().toString();
            Perlin.perlin = undefined;
            renderer = new Renderer();
            position = 0;
            draw();
        };

        const applyLook = () => {
            palette = new Palette(settings.inkColor, settings.paperColor);
            wallpaper.style.background = palette.paperCSS;
            paper.classList.toggle("hidden", !settings.paperTexture);
        };

        let last = performance.now();
        let frameRequest = 0;
        const tick = (now: number) => {
            frameRequest = requestAnimationFrame(tick);

            const elapsed = (now - last) / 1000;
            if (settings.fps > 0 && elapsed < 1 / settings.fps) return;
            last = now;

            // Clamp so a paused wallpaper does not jump when it resumes
            position += settings.speed * Math.min(elapsed, 0.1);

            const ahead = drawnEnd - position;
            if (ahead < window.innerWidth * LOOKAHEAD) draw();
            else pan();
        };

        const handleResize = debounce(draw, 200);
        const stopListening = onSettingsChange((changed) => {
            applyLook();
            if (changed.has("seed")) reseed();
            else if (changed.has("inkColor") || changed.has("paperColor")) draw();
        });

        applyLook();
        reseed();
        frameRequest = requestAnimationFrame(tick);
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(frameRequest);
            window.removeEventListener("resize", handleResize);
            stopListening();
        };
    }, []);

    return (
        <div id="Wallpaper" ref={wallpaperRef}>
            <svg id="SVG" ref={svgRef}>
                <g id="Picture" ref={pictureRef} />
            </svg>
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
