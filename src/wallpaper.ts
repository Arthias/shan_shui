/**
 * Wallpaper settings. Wallpaper Engine changes them through user properties
 * (https://docs.wallpaperengine.io/en/web/customization/properties.html).
 * In a normal browser the defaults apply and `?seed=` sets the seed.
 */
export const settings = {
    /** Scroll speed in px per second */
    speed: 30,
    darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
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
        const { scrollspeed, darkmode, papertexture, seed } = properties;

        if (scrollspeed) {
            settings.speed = Number(scrollspeed.value);
            changed.add("speed");
        }
        if (darkmode) {
            settings.darkMode = Boolean(darkmode.value);
            changed.add("darkMode");
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
