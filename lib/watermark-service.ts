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

    let defs = "";
    let contentUse = "";

    if (config.logo.removeBackground) {
        // Luminance Mask: White(1) -> Transparent(0). Black(0) -> Opaque(1).
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

    // Refined Logic for Logo Group
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
        `<image href="data:image/png;base64,${base64Logo}" x="${logoX}" y="${-logoH / 2}" width="${logoW}" height="${logoH}" />`;


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
