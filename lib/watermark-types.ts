export type WatermarkType = "text" | "logo" | "combo";

export type BaseWatermarkConfig = {
    type: WatermarkType;
    opacity: number; // 0 to 1
    rotate: number; // -180 to 180
    gapX: number;
    gapY: number;
};

export type LogoConfig = {
    logoFile: File | null; // Browser File object, null if not selected
    scale: number; // 1 to 100 (%)
    removeBackground: boolean;
    enableColorize: boolean;
    logoColor: string;
};

// Simplified config for easier state management
export type WatermarkConfig = BaseWatermarkConfig & {
    text: string;
    fontSize: number;
    color: string;
    font: string;
    fontWeight: string;
    logo: LogoConfig;
    layoutMode: "single" | "tile";
    offsetX: number;
    offsetY: number;
};

export const DEFAULT_LOGO_CONFIG: LogoConfig = {
    logoFile: null,
    scale: 20,
    removeBackground: false,
    enableColorize: false,
    logoColor: "#000000",
};

export const DEFAULT_BASE_CONFIG: Omit<BaseWatermarkConfig, "type"> = {
    opacity: 0.5,
    rotate: -45,
    gapX: 100,
    gapY: 100,
};
