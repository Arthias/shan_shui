import { RGB } from "./classes/Palette";

/** Scene elements the user can hide: CSS class in the SVG → user property key */
export const ELEMENTS = {
    trees: "showtrees",
    buildings: "showbuildings",
    powerlines: "showpowerlines",
    rocks: "showrocks",
    boat: "showboats",
    backgroundMountain: "showdistantmountains",
    water: "showwater",
} as const;

export type ElementClass = keyof typeof ELEMENTS;

/**
 * Wallpaper settings. Wallpaper Engine changes them through user properties
 * (https://docs.wallpaperengine.io/en/web/customization/properties.html).
 * In a normal browser the defaults apply and `?seed=` sets the seed.
 */
export const settings = {
    scrolling: true,
    /** Scroll speed in px per second */
    speed: 30,
    /** Position when not scrolling, 0 to 100 (0 to 2 screen widths) */
    horizontal: 0,
    /** Shifts the landscape down by this percentage of the screen height (negative: up) */
    vertical: 0,
    inkColor: [0, 0, 0] as RGB,
    paperColor: [240, 231, 208] as RGB,
    paperTexture: true,
    /** Empty means a new random landscape on every load */
    seed: new URLSearchParams(window.location.search).get("seed") ?? "",
    hidden: new Set<ElementClass>(),
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

/** User property key → the setting it sets and how to read its value */
const PROPERTIES: Record<string, [Setting, (value: unknown) => unknown]> = {
    scrolling: ["scrolling", Boolean],
    scrollspeed: ["speed", Number],
    horizontalposition: ["horizontal", Number],
    verticalposition: ["vertical", Number],
    inkcolor: ["inkColor", parseColor],
    papercolor: ["paperColor", parseColor],
    papertexture: ["paperTexture", Boolean],
    seed: ["seed", (value) => String(value).trim()],
};

/**
 * Apply one user property.
 * @returns {Setting | undefined} The setting that changed, if any
 */
function applyProperty(key: string, value: unknown): Setting | undefined {
    const element = Object.entries(ELEMENTS).find(([, k]) => k === key);
    if (element) {
        const name = element[0] as ElementClass;
        if (value) settings.hidden.delete(name);
        else settings.hidden.add(name);
        return "hidden";
    }

    if (!PROPERTIES[key]) return undefined;
    const [setting, parse] = PROPERTIES[key];
    const parsed = parse(value);

    // Wallpaper Engine sends every property on load, so only an actual seed change regenerates
    if (setting === "seed" && parsed === settings.seed) return undefined;

    Object.assign(settings, { [setting]: parsed });
    return setting;
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

        for (const [key, property] of Object.entries(properties)) {
            const setting = property && applyProperty(key, property.value);
            if (setting) changed.add(setting);
        }

        notify(changed);
    },
    applyGeneralProperties: (properties) => {
        if (properties.fps !== undefined) settings.fps = properties.fps;
    },
};
