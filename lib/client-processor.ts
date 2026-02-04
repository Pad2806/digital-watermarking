
import { WatermarkConfig } from "@/lib/watermark-types";
import { calculateWatermarkPositions } from "@/lib/watermark-utils";

export async function processWatermarkClient(
    imageFile: File,
    config: WatermarkConfig,
    logoFile?: File | null
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(imageFile);

        img.onload = async () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            // Draw Base Image
            ctx.drawImage(img, 0, 0);

            // Load Logo if needed
            let processedLogo: HTMLImageElement | null = null;
            if (config.type !== "text" && logoFile) {
                processedLogo = await loadAndProcessLogo(logoFile, config);
            }

            // Apply Watermark
            ctx.save();
            ctx.globalAlpha = config.opacity;

            const offsetX = config.offsetX || 0;
            const offsetY = config.offsetY || 0;

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.translate(cx + offsetX, cy + offsetY);
            ctx.rotate((config.rotate * Math.PI) / 180);
            ctx.translate(-cx, -cy);

            // Measure Item Size
            let itemWidth = 0;
            let itemHeight = 0;

            if (config.type === "text" || config.type === "combo") {
                const weight = config.fontWeight || "normal";
                const font = resolveFont(config.font);
                ctx.font = `${weight} ${config.fontSize}px ${font}`;

                const metrics = ctx.measureText(config.text);
                const textWidth = metrics.width;
                const textHeight = config.fontSize;

                if (config.type === "combo" && processedLogo) {
                    const logoRatio = processedLogo.width / processedLogo.height;
                    const finalLogoWidth = img.width * (config.logo.scale / 100);
                    const finalLogoHeight = finalLogoWidth / logoRatio;

                    itemWidth = finalLogoWidth + 10 + textWidth;
                    itemHeight = Math.max(finalLogoHeight, textHeight);
                } else {
                    itemWidth = textWidth;
                    itemHeight = textHeight;
                }
            } else if (config.type === "logo" && processedLogo) {
                const logoRatio = processedLogo.width / processedLogo.height;
                itemWidth = img.width * (config.logo.scale / 100);
                itemHeight = itemWidth / logoRatio;
            }

            if (itemWidth > 0 && itemHeight > 0) {
                let positions: { x: number, y: number }[] = [];

                if (config.layoutMode === 'single') {
                    positions = [{ x: 0, y: 0 }];
                } else {
                    positions = calculateWatermarkPositions(
                        canvas.width,
                        canvas.height,
                        config,
                        itemWidth,
                        itemHeight
                    );
                }

                positions.forEach(({ x, y }) => {
                    const drawX = cx + x;
                    const drawY = cy + y;

                    if (config.type === "text") {
                        ctx.fillStyle = config.color;
                        const weight = config.fontWeight || "normal";
                        const font = resolveFont(config.font);
                        ctx.font = `${weight} ${config.fontSize}px ${font}`;
                        ctx.textBaseline = "middle";
                        ctx.fillText(config.text, drawX, drawY);
                    } else if (config.type === "logo" && processedLogo) {
                        ctx.drawImage(processedLogo, drawX - itemWidth / 2, drawY - itemHeight / 2, itemWidth, itemHeight);
                    } else if (config.type === "combo" && processedLogo) {
                        const logoW = img.width * (config.logo.scale / 100);
                        const logoH = logoW / (processedLogo.width / processedLogo.height);

                        const totalW = itemWidth;
                        const startX = drawX - totalW / 2;

                        ctx.drawImage(processedLogo, startX, drawY - logoH / 2, logoW, logoH);

                        ctx.fillStyle = config.color;
                        const weight = config.fontWeight || "normal";
                        const font = resolveFont(config.font);
                        ctx.font = `${weight} ${config.fontSize}px ${font}`;
                        ctx.textBaseline = "middle";
                        ctx.fillText(config.text, startX + logoW + 10, drawY);
                    }
                });
            }

            ctx.restore();

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(img.src);
                if (blob) resolve(blob);
                else reject(new Error("Blob conversion failed"));
            }, imageFile.type || "image/png", 0.95);
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error("Failed to load image"));
        };
    });
}

async function loadAndProcessLogo(logoFile: File, config: WatermarkConfig): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(logoFile);
        img.onload = () => {
            if (!config.logo.removeBackground) {
                resolve(img);
                return;
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(img);
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let rT = 0, gT = 0, bT = 0;
            if (config.logo.enableColorize) {
                const hex = (config.logo.logoColor || "#000000").replace("#", "");
                rT = parseInt(hex.substring(0, 2), 16);
                gT = parseInt(hex.substring(2, 4), 16);
                bT = parseInt(hex.substring(4, 6), 16);
            }

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (r > 230 && g > 230 && b > 230) {
                    data[i + 3] = 0;
                } else if (config.logo.enableColorize && data[i + 3] > 0) {
                    data[i] = rT;
                    data[i + 1] = gT;
                    data[i + 2] = bT;
                }
            }
            ctx.putImageData(imageData, 0, 0);

            const processed = new Image();
            processed.src = canvas.toDataURL();
            processed.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(processed);
            };
        };
        img.onerror = () => reject(new Error("Failed to load logo"));
    });
}

function resolveFont(fontString: string): string {
    if (!fontString.includes('var(')) return fontString;
    const match = fontString.match(/var\(([^)]+)\)/);
    if (match && match[1]) {
        const resolved = getComputedStyle(document.body).getPropertyValue(match[1]);
        if (resolved) {
            const backup = fontString.replace(/var\([^)]+\)/, '').trim().replace(/^,\s*/, '');
            return resolved + (backup ? `, ${backup}` : "");
        }
    }
    return "sans-serif";
}
