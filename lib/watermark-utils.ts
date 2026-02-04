import { WatermarkConfig } from "./watermark-types";

/**
 * Calculates the grid coordinates for tiling watermarks.
 * @param width Canvas/Image width
 * @param height Canvas/Image height
 * @param config Watermark configuration
 * @param itemWidth Width of the watermark item (measured)
 * @param itemHeight Height of the watermark item (measured)
 * @returns Array of {x, y} coordinates to draw the watermark
 */
export function calculateWatermarkPositions(
    width: number,
    height: number,
    config: WatermarkConfig,
    itemWidth: number,
    itemHeight: number
) {
    const { gapX, gapY } = config;
    const positions: { x: number; y: number }[] = [];

    // Calculate the diagonal to ensure we cover the whole area when rotated
    const diagonal = Math.sqrt(width * width + height * height);

    // We need to cover a larger area to handle rotation


    const spanX = diagonal + Math.abs(itemWidth);
    const spanY = diagonal + Math.abs(itemHeight);

    // Start from top-left relative to center, covering the span
    const startX = -spanX / 2;
    const startY = -spanY / 2;

    const stepX = itemWidth + gapX;
    const stepY = itemHeight + gapY;

    for (let x = startX; x < spanX / 2; x += stepX) {
        for (let y = startY; y < spanY / 2; y += stepY) {
            // These are coordinates relative to the center, before rotation
            // Actually, simpler approach:
            // 1. Translate to center
            // 2. Rotate context
            // 3. Draw grid from -span/2 to +span/2
            // So we just return the grid offsets relative to the rotated zero-point (which is the center)
            positions.push({ x, y });
        }
    }

    return positions;
}
