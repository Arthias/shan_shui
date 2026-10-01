import Designer from "./Designer";
import Frame from "./Frame";
import Palette from "./Palette";
import Range from "./Range";
import { config } from "../config";

const TAG_ORDER = config.renderer.tagOrder;
/** Width of each generated frame in px */
const FRAME_WIDTH = 1000;

export default class Renderer {
    /** Frames that are still on screen or ahead of it */
    frames: Frame[] = [];
    /** End of the range already covered by generated frames */
    coveredEnd = 0;
    /** Id of the next frame. Only ever increases, so SVG ids stay unique after
     *  eviction; it also seeds middle mountains, as in upstream */
    private nextFrameId = 1;

    /**
     * Generate frames until the given point is covered. Frames have a fixed
     * width, so a seed always gives the same landscape, wherever the view is
     * and whatever the screen size.
     * @param end - The point that must be covered
     */
    public cover(end: number): void {
        while (this.coveredEnd < end) {
            const range = new Range(this.coveredEnd, this.coveredEnd + FRAME_WIDTH);
            const frame = new Frame(this.nextFrameId++);

            new Designer(range).plan.forEach((sketch) =>
                frame.sketchToLayer(sketch)
            );
            this.frames.push(frame);
            this.coveredEnd = range.end;
        }
    }

    /**
     * Drop frames that end before the given x. To show anything left of x again,
     * start over with a new Renderer and the same seed.
     * @param x - Frames ending before this point are removed
     */
    public evictBefore(x: number): void {
        this.frames = this.frames.filter((frame) => frame.range.end >= x);
    }

    /**
     * SVG markup of every layer that overlaps the range, in drawing order.
     * @param range - The range to draw
     * @param palette - Ink and paper colours to draw with
     * @returns {string} The SVG content
     */
    public svg(range: Range, palette: Palette): string {
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

        return layers.map(({ layer, id }) => layer.svg(id, palette)).join("\n");
    }
}
