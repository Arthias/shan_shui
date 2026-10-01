/** An RGB colour with channels from 0 to 255 */
export type RGB = [number, number, number];

/** Colours in the generated SVG: rgb()/rgba() and the named greys */
const COLOR = /rgba?\([^)]*\)|\bwhite\b|\bblack\b/g;

/**
 * Maps the generators' greyscale colours onto an ink and a paper colour:
 * black becomes ink, white becomes paper, greys fall in between. Alpha is kept,
 * and blending is linear, so the result matches recolouring the finished picture.
 */
export default class Palette {
    /** Converted colours, as the same few colours repeat thousands of times */
    private cache = new Map<string, string>();

    constructor(public ink: RGB, public paper: RGB) {}

    /**
     * Recolour SVG markup.
     * @param {string} svg - Markup in the generators' greyscale colours
     * @returns {string} The markup in this palette
     */
    public apply(svg: string): string {
        return svg.replace(COLOR, (color) => {
            let mapped = this.cache.get(color);
            if (mapped === undefined) {
                mapped = this.map(color);
                this.cache.set(color, mapped);
            }
            return mapped;
        });
    }

    private map(color: string): string {
        let channels: number[];
        if (color === "white") channels = [255, 255, 255, 1];
        else if (color === "black") channels = [0, 0, 0, 1];
        else channels = color.slice(color.indexOf("(") + 1, -1).split(",").map(Number);

        const [r, g, b] = [0, 1, 2].map((i) =>
            Math.round(
                this.ink[i] + ((this.paper[i] - this.ink[i]) * channels[i]) / 255
            )
        );
        const alpha = channels[3] ?? 1;

        return `rgba(${r},${g},${b},${alpha})`;
    }

    /** CSS colour of the paper */
    get paperCSS(): string {
        return `rgb(${this.paper.join(",")})`;
    }
}
