import Designer from "./Designer";
import Frame from "./Frame";
import Range from "./Range";
import { config } from "../config";

const TAG_ORDER = config.renderer.tagOrder;

export default class Renderer {
    /** Frames that are still on screen or ahead of it */
    frames: Frame[] = [];
    /** End of the range already covered by generated frames */
    coveredEnd = 0;
    /** Id of the next frame. Only ever increases, so SVG ids stay unique after
     *  eviction; it also seeds middle mountains, as in upstream */
    private nextFrameId = 1;

    /**
     * Generate a new frame if the given range is not covered yet.
     * @param range - The range that must be covered
     * @param extra - How far past the end of the range the new frame reaches
     * @returns {boolean} Whether a new frame was generated
     */
    public cover(range: Range, extra: number): boolean {
        if (range.end <= this.coveredEnd) return false;

        const newRange = new Range(this.coveredEnd, range.end + extra);
        const frame = new Frame(this.nextFrameId++);

        new Designer(newRange).plan.forEach((sketch) =>
            frame.sketchToLayer(sketch)
        );
        this.frames.push(frame);
        this.coveredEnd = newRange.end;

        return true;
    }

    /**
     * Drop frames that end before the given x. The wallpaper never scrolls left.
     * @param x - Frames ending before this point are removed
     */
    public evictBefore(x: number): void {
        this.frames = this.frames.filter((frame) => frame.range.end >= x);
    }

    /**
     * SVG markup of every layer that overlaps the range, in drawing order.
     * @param range - The range to draw
     * @returns {string} The SVG content
     */
    public svg(range: Range): string {
        const layers = this.frames.flatMap((frame) =>
            frame.layers
                .map((layer, j) => ({
                    layer,
                    id: `frame${frame.id}-layer${j}-${layer.tag}`,
                }))
                .filter(({ layer }) => range.isShowing(layer.range))
        );

        // Sort them by the tag order so they will be rendered in the right order
        layers.sort(({ layer: a }, { layer: b }) => {
            if (TAG_ORDER[a.tag] !== TAG_ORDER[b.tag]) {
                return TAG_ORDER[a.tag] - TAG_ORDER[b.tag];
            } else if (a.y !== b.y) {
                return a.y - b.y;
            } else {
                return a.x - b.x;
            }
        });

        return layers.map(({ layer, id }) => layer.svg(id)).join("\n");
    }
}
