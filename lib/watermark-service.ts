import sharp from "sharp";
import { WatermarkConfig } from "@/lib/watermark-types";
import { calculateWatermarkPositions } from "@/lib/watermark-utils";

// Approximate text width calculation Since we don't have canvas context
function estimateTextSize(text: string, fontSize: number) {
    // Average aspect ratio for sans-serif fonts is roughly 0.6
    const width = text.length * fontSize * 0.6;
    const height = fontSize;
    return { width, height };
}

export async function processWatermark(
    imageBuffer: Buffer,
    config: WatermarkConfig,
    logoBuffer?: Buffer
): Promise<Buffer> {

    // 1. Get Image Metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // 2. Prepare Overlay Layer (SVG)
    let overlayBuffer: Buffer;

    if (config.type === "text") {
        const svg = generateTextSvg(width, height, config);
        overlayBuffer = Buffer.from(svg);
    } else if (config.type === "logo" && logoBuffer) {
        const logoSize = calculateLogoSize(width, config.logo.scale);

        // We can resize the logo buffer once
        const resizedLogo = await sharp(logoBuffer)
            .resize(Math.round(logoSize.width)) // Maintain aspect ratio
            .toBuffer();

        const svg = generateLogoSvg(width, height, config, resizedLogo.toString('base64'), logoSize);
        overlayBuffer = Buffer.from(svg);

    } else if (config.type === "combo" && logoBuffer) {
        const logoSize = calculateLogoSize(width, config.logo.scale);
        const resizedLogo = await sharp(logoBuffer)
            .resize(Math.round(logoSize.width))
            .toBuffer();

        const svg = generateComboSvg(width, height, config, resizedLogo.toString('base64'), logoSize);
        overlayBuffer = Buffer.from(svg);

    } else {
        // Fallback or just return original
        return imageBuffer;
    }

    return image
        .composite([{ input: overlayBuffer, blend: 'over' }])
        .toFormat('png')
        .toBuffer();
}

function calculateLogoSize(imageWidth: number, scalePercent: number) {
    const width = imageWidth * (scalePercent / 100);
    return { width, height: width }; // Assume square for container, but aspect preserved by Sharp resize
}

// Helper to get positions based on layout mode
function getPositions(width: number, height: number, config: WatermarkConfig, itemWidth: number, itemHeight: number) {
    if (config.layoutMode === 'single') {
        return [{ x: 0, y: 0 }];
    }
    return calculateWatermarkPositions(width, height, config, itemWidth, itemHeight);
}

// Map frontend CSS variables/strings to Google Font Families for SVG
function getSvgFontFamily(fontString: string): string {
    if (fontString.includes('inter')) return "'Inter', sans-serif";
    if (fontString.includes('roboto')) return "'Roboto', sans-serif";
    if (fontString.includes('playfair')) return "'Playfair Display', serif";
    if (fontString.includes('montserrat')) return "'Montserrat', sans-serif";
    if (fontString.includes('dancing')) return "'Dancing Script', cursive";

    // Fallback cleanup
    return fontString.replace(/var\([^)]+\),?\s*/, '') || 'sans-serif';
}

function generateTextSvg(width: number, height: number, config: WatermarkConfig) {
    const { width: itemWidth, height: itemHeight } = estimateTextSize(config.text, config.fontSize);

    // Use layout mode logic
    const positions = getPositions(width, height, config, itemWidth, itemHeight);

    const cx = (width / 2) + (config.offsetX || 0);
    const cy = (height / 2) + (config.offsetY || 0);

    const fontFamily = getSvgFontFamily(config.font);

    // SVG Text Elements
    const textElements = positions.map(p =>
        `<text x="${p.x}" y="${p.y}" fill="${config.color}" font-family="${fontFamily}" font-size="${config.fontSize}" font-weight="${config.fontWeight}" text-anchor="middle" dominant-baseline="middle">${config.text}</text>`
    ).join('\n');

    return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
    </defs>
    <g opacity="${config.opacity}">
      <g transform="translate(${cx}, ${cy}) rotate(${config.rotate})">
         ${textElements}
      </g>
    </g>
  </svg>
  `;
}

function generateLogoSvg(width: number, height: number, config: WatermarkConfig, base64Logo: string, logoSize: { width: number, height: number }) {
    const itemWidth = logoSize.width;
    const itemHeight = logoSize.height;

    const positions = getPositions(width, height, config, itemWidth, itemHeight);
    const cx = (width / 2) + (config.offsetX || 0);
    const cy = (height / 2) + (config.offsetY || 0);

    // Filter Definitions
    let filterDef = "";
    let filterAttr = "";
    let maskDef = "";
    let maskRef = "";
    let fillElement = "";
    let logoImage = "";

    // If Remove BG is enabled, we use a color matrix to make white transparent
    const filterId = "remove-white-bg";
    if (config.logo.removeBackground) {
        filterDef = `
         <filter id="${filterId}">
            <feColorMatrix type="matrix" values="
                1 0 0 0 0  
                0 1 0 0 0  
                0 0 1 0 0  
                -1 -1 -1 1 0" 
            />
         </filter>`;
        // Simple luminance-to-alpha logic: R+G+B roughly maps to transparency? 
        // Actually "White to Transparent" is: If R=1,G=1,B=1 -> A=0.
        // A simple approx is `A = 1 - (R+G+B)/3` (inverted luminance).
        // Better matrix for "Make White Transparent":
        // 1 0 0 0 0
        // 0 1 0 0 0
        // 0 0 1 0 0
        // 0 0 0 1 0  (Keep Alpha)
        // But we want A to be 0 if RGB is high. 
        // Let's rely on standard masking if possible, but filter is faster.
        // Let's use a simpler approach: 
        // Treat the image itself as a mask for "Colorize".

        // If Colorize is ENABLED:
        if (config.logo.enableColorize) {
            // We want to draw a RECT of the chosen color.
            // Masked by the LOGO (where dark parts = opaque, white parts = transparent).
            // Standard SVG Mask uses Luminance: White=Opaque, Black=Transparent.
            // Our logo is likely "Black content on White BG". 
            // We want: Black Content -> Opaque Mask (Show Color). White BG -> Transparent Mask (Hide Color).
            // So we need to INVERT the image luminance found in mask.

            const maskId = "logo-mask";
            maskDef = `
             <mask id="${maskId}">
                <image href="data:image/png;base64,${base64Logo}" x="${-itemWidth / 2}" y="${-itemHeight / 2}" width="${itemWidth}" height="${itemHeight}" filter="url(#invert-filter)" />
             </mask>
             <filter id="invert-filter">
                <feColorMatrix type="matrix" values="-1 0 0 0 1  -1 0 0 0 1  -1 0 0 0 1  0 0 0 1 0" />
             </filter>
             `;
            // Actually, Mask Luminance: 
            // Image: Black (0,0,0) -> Mask Luma 0 -> Transparent.
            // Image: White (1,1,1) -> Mask Luma 1 -> Opaque.
            // We want: Black Content -> Visible (Opaque). White BG -> Hidden (Transparent).
            // So we want White -> Transparent (0). Black -> Opaque (1).
            // So we need to INVERT the luma.
            // The invert filter above: R'=1-R, etc. So White(1) becomes Black(0). Black(0) becomes White(1).
            // This gives us the correct mask.

            // Then we draw a Rect with the config.color, using this mask.
        } else {
            // Just Remove Background (transparent).
            // We can use the same "Invert" logic as a Mask for the Image itself?
            // <image ... mask="url(#bg-mask)" /> using the inverted version of itself.
        }
    }

    // RE-STRATEGY for Robustness:
    // 1. Colorize Enabled: Draw RECT (color) masked by INVERTED LOGO.
    // 2. Remove BG Only: Draw IMAGE masked by INVERTED LOGO.
    // 3. Normal: Draw IMAGE.

    // We already calculated positions.
    // We need to define the reuseable "Item" (Image or Colored Rect) and place it at every position.
    // It's cleaner to define the item content in <defs> or just repeat the group logic.

    const elements = positions.map(p => {
        // Translate to position
        // Center of item is at (0,0) inside the group

        let content = `<image href="data:image/png;base64,${base64Logo}" x="${-itemWidth / 2}" y="${-itemHeight / 2}" width="${itemWidth}" height="${itemHeight}" />`;

        if (config.logo.removeBackground) {
            // We need a unique ID for masks if we iterate? No, definitions can be global if content is same.
        }
        return `<g transform="translate(${p.x}, ${p.y})">${content}</g>`;
    }).join('\n');

    // Wait, reusing definitions inside map is bloating.
    // Let's define the "watermark-item" symbol.

    let defs = "";
    let contentUse = "";

    if (config.logo.removeBackground) {
        // Luminance Mask: White(1) -> Transparent(0). Black(0) -> Opaque(1).
        // Standard Mask: Luma 1 = Opaque.
        // So we need Image White -> Mask Black -> Transparent.
        // Image Black -> Mask White -> Opaque.
        // Invert Filter is needed.

        const maskId = "content-mask";
        defs = `
          <filter id="invert-luminance">
             <feColorMatrix type="matrix" values="-1 0 0 0 1  -1 0 0 0 1  -1 0 0 0 1  0 0 0 1 0" />
          </filter>
          <mask id="${maskId}">
             <image href="data:image/png;base64,${base64Logo}" width="${itemWidth}" height="${itemHeight}" filter="url(#invert-luminance)" />
          </mask>
        `;

        if (config.logo.enableColorize) {
            // Draw Color Rect masked by Content
            const logoC = config.logo.logoColor || "#000000";
            contentUse = `<rect width="${itemWidth}" height="${itemHeight}" fill="${logoC}" mask="url(#${maskId})" />`;
        } else {
            // Draw Original Image masked by Content (Alpha channel will be applied)
            contentUse = `<image href="data:image/png;base64,${base64Logo}" width="${itemWidth}" height="${itemHeight}" mask="url(#${maskId})" />`;
        }
    } else {
        contentUse = `<image href="data:image/png;base64,${base64Logo}" width="${itemWidth}" height="${itemHeight}" />`;
    }

    // Now place this content at every position
    const placements = positions.map(p =>
        `<g transform="translate(${p.x - itemWidth / 2}, ${p.y - itemHeight / 2})">${contentUse}</g>`
    ).join('\n');

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
         ${defs}
      </defs>
      <g opacity="${config.opacity}">
        <g transform="translate(${cx}, ${cy}) rotate(${config.rotate})">
           ${placements}
        </g>
      </g>
    </svg>
    `;
}

function generateComboSvg(width: number, height: number, config: WatermarkConfig, base64Logo: string, logoSize: { width: number, height: number }) {
    const { width: textWidth, height: textHeight } = estimateTextSize(config.text, config.fontSize);
    const logoW = logoSize.width;
    const logoH = logoSize.height;

    // Layout: Logo [gap] Text
    const gap = 10;
    const totalW = logoW + gap + textWidth;
    const totalH = Math.max(logoH, textHeight);

    // Calculate positions 
    const positions = getPositions(width, height, config, totalW, totalH);
    const cx = (width / 2) + (config.offsetX || 0);
    const cy = (height / 2) + (config.offsetY || 0);

    const fontFamily = getSvgFontFamily(config.font);

    const logoX = -totalW / 2;
    const textX = logoX + logoW + gap;

    // Define Logo Content (Same Logic)
    let logoDefs = "";
    let logoUse = "";

    if (config.logo.removeBackground) {
        const maskId = "combo-logo-mask";
        logoDefs = `
          <filter id="invert-luminance-combo">
             <feColorMatrix type="matrix" values="-1 0 0 0 1  -1 0 0 0 1  -1 0 0 0 1  0 0 0 1 0" />
          </filter>
          <mask id="${maskId}">
             <image href="data:image/png;base64,${base64Logo}" width="${logoW}" height="${logoH}" filter="url(#invert-luminance-combo)" />
          </mask>
        `;

        if (config.logo.enableColorize) {
            const logoC = config.logo.logoColor || "#000000";
            logoUse = `<rect x="${logoX}" y="${-logoH / 2}" width="${logoW}" height="${logoH}" fill="${logoC}" mask="url(#${maskId})" />`;
        } else {
            // Note: logoX, logoY handling needs care with mask coordinates.
            // Mask coordinate system is relative to user space? Default is objectBoundingBox.
            // If maskUnits="userSpaceOnUse", we need exact coords.
            // Let's use a group for the logo to simplify 0,0 coords in mask.
            logoUse = `
             <g transform="translate(${logoX}, ${-logoH / 2})">
                <image href="data:image/png;base64,${base64Logo}" width="${logoW}" height="${logoH}" mask="url(#${maskId})" />
             </g>`;

            // Wait, if enableColorize above uses rect at x,y, it assumes mask is aligned.
            // Best way: define the logo drawing at 0,0 separate from placement.
        }
    } else {
        logoUse = `<image href="data:image/png;base64,${base64Logo}" x="${logoX}" y="${-logoH / 2}" width="${logoW}" />`;
    }

    // Corrected Block for Logo Generation inside Loop
    // To avoid complex definitions repeatedly, let's use the simple approach of embedding logic if small
    // OR just use <defs> correctly.

    // Let's go with embedding simpler versions for now to minimize risk of mask ID collision if multiple exports?
    // Actually ID collision is fine inside one SVG.

    // Refined Logic:
    const logoGroup = config.logo.removeBackground ?
        (config.logo.enableColorize ?
            `<g transform="translate(${logoX}, ${-logoH / 2})">
                <rect width="${logoW}" height="${logoH}" fill="${config.logo.logoColor || '#000000'}" mask="url(#combo-mask)" />
             </g>`
            :
            `<g transform="translate(${logoX}, ${-logoH / 2})">
                <image href="data:image/png;base64,${base64Logo}" width="${logoW}" height="${logoH}" mask="url(#combo-mask)" />
             </g>`
        ) :
        `<image href="data:image/png;base64,${base64Logo}" x="${logoX}" y="${-logoH / 2}" width="${logoW}" />`;


    const elements = positions.map(p => `
        <g transform="translate(${p.x}, ${p.y})">
             ${logoGroup}
             <text x="${textX}" y="0" fill="${config.color}" font-family="${fontFamily}" font-size="${config.fontSize}" font-weight="${config.fontWeight}" dominant-baseline="middle">${config.text}</text>
        </g>
    `).join('\n');

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${config.logo.removeBackground ? `
          <filter id="invert-luminance-combo">
             <feColorMatrix type="matrix" values="-1 0 0 0 1  -1 0 0 0 1  -1 0 0 0 1  0 0 0 1 0" />
          </filter>
          <mask id="combo-mask">
             <image href="data:image/png;base64,${base64Logo}" width="${logoW}" height="${logoH}" filter="url(#invert-luminance-combo)" />
          </mask>
        ` : ''}
      </defs>
      <g opacity="${config.opacity}">
        <g transform="translate(${cx}, ${cy}) rotate(${config.rotate})">
           ${elements}
        </g>
      </g>
    </svg>
    `;
}
