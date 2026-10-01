import { RGB } from "./classes/Palette";

/**
 * Wallpaper settings. Wallpaper Engine changes them through user properties
 * (https://docs.wallpaperengine.io/en/web/customization/properties.html).
 * In a normal browser the defaults apply and `?seed=` sets the seed.
 */
export const settings = {
    /** Scroll speed in px per second */
    speed: 30,
    inkColor: [0, 0, 0] as RGB,
    paperColor: [240, 231, 208] as RGB,
    paperTexture: true,
    /** Empty means a new random landscape on every load */
    seed: new URLSearchParams(window.location.search).get("seed") ?? "",
    /** Wallpaper Engine's FPS limit, 0 means no limit */
    fps: 0,
};

export type Setting = keyof typeof settings;

interface UserProperties {
    [key: string]: { value: unknown } | undefined;
}

interface GeneralProperties {
    fps?: number;
}

declare global {
    interface Window {
        wallpaperPropertyListener?: {
            applyUserProperties?: (properties: UserProperties) => void;
            applyGeneralProperties?: (properties: GeneralProperties) => void;
        };
    }
}

/**
 * Parse a Wallpaper Engine colour, e.g. "1.0 0.1 0.25" (channels from 0 to 1).
 * @returns {RGB} Channels from 0 to 255
 */
function parseColor(value: unknown): RGB {
    const [r, g, b] = String(value)
        .split(" ")
        .map((c) => Math.round(Number(c) * 255));
    return [r, g, b];
}

let notify: (changed: Set<Setting>) => void = () => {};

/**
 * Register the callback that runs after Wallpaper Engine changes settings.
 * @returns {() => void} Function that unregisters the callback
 */
export function onSettingsChange(
    callback: (changed: Set<Setting>) => void
): () => void {
    notify = callback;
    return () => {
        notify = () => {};
    };
}

// Set at load, outside React, so the first call from Wallpaper Engine is not missed
window.wallpaperPropertyListener = {
    applyUserProperties: (properties) => {
        const changed = new Set<Setting>();
        const { scrollspeed, inkcolor, papercolor, papertexture, seed } =
            properties;

        if (scrollspeed) {
            settings.speed = Number(scrollspeed.value);
            changed.add("speed");
        }
        if (inkcolor) {
            settings.inkColor = parseColor(inkcolor.value);
            changed.add("inkColor");
        }
        if (papercolor) {
            settings.paperColor = parseColor(papercolor.value);
            changed.add("paperColor");
        }
        if (papertexture) {
            settings.paperTexture = Boolean(papertexture.value);
            changed.add("paperTexture");
        }
        // Wallpaper Engine sends every property on load, so only an actual change regenerates
        if (seed && String(seed.value).trim() !== settings.seed) {
            settings.seed = String(seed.value).trim();
            changed.add("seed");
        }

        notify(changed);
    },
    applyGeneralProperties: (properties) => {
        if (properties.fps !== undefined) settings.fps = properties.fps;
    },
};
