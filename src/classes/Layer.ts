import ILayer from "../interfaces/ILayer";
import Structure from "./Structure";
import { LayerType } from "../types/LayerType";

/**
 * Represents a layer of terrain with SVG elements.
 */
export default class Layer extends Structure implements ILayer {
    /**
     * Initializes a new instance with specified coordinates and tag.
     *
     * @param {LayerType} [tag] - The tag for the layer.
     * @param {number} [x=0] - The x-coordinate.
     * @param {number} [y=0] - The y-coordinate.
     */
    constructor(
        public tag: LayerType,
        public x: number = 0,
        public y: number = 0
    ) {
        super();
    }

    /** SVG markup, built on first use */
    private cachedSvg?: string;

    /**
     * Returns the layer as an SVG group. The markup is built once, then the
     * elements are released since only the string and the range are needed.
     *
     * @param {string} id - Id of the SVG group. Fixed for the life of the layer.
     * @return {string} The layer as an SVG string.
     */
    public svg(id: string): string {
        if (this.cachedSvg === undefined) {
            const text = this.elements.map((e) => e.stringify).join("\n");
            this.cachedSvg = `<g id="${id}">${text}</g>`;
            this.elements = [];
        }
        return this.cachedSvg;
    }
}
