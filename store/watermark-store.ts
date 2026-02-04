import { create } from "zustand";
import {
    WatermarkConfig,
    DEFAULT_LOGO_CONFIG,
    DEFAULT_BASE_CONFIG
} from "@/lib/watermark-types";

interface WatermarkState {
    imageFiles: File[];
    selectedFileId: string | null; // using file name as simple ID for now
    config: WatermarkConfig;

    addImages: (files: File[]) => void;
    removeImage: (fileName: string) => void;
    selectImage: (fileName: string) => void;

    updateConfig: (updates: Partial<WatermarkConfig> | ((prev: WatermarkConfig) => Partial<WatermarkConfig>)) => void;
    resetConfig: () => void;

    // Computed helper
    getSelectedFile: () => File | undefined;
}

export const useWatermarkStore = create<WatermarkState>((set, get) => ({
    imageFiles: [],
    selectedFileId: null,
    config: {
        type: "text",
        text: "Watermark",
        fontSize: 40,
        color: "#000000",
        font: "sans-serif",
        fontWeight: "bold",
        logo: DEFAULT_LOGO_CONFIG,
        layoutMode: "tile",
        offsetX: 0,
        offsetY: 0,
        ...DEFAULT_BASE_CONFIG,
    } as WatermarkConfig,

    addImages: (newFiles) => set((state) => {
        // Avoid duplicates by name (simple check)
        const existingNames = new Set(state.imageFiles.map(f => f.name));
        const validFiles = newFiles.filter(f => !existingNames.has(f.name));

        // If no files currently selected, select the first new one
        const newSelectedId = state.selectedFileId || (validFiles.length > 0 ? validFiles[0].name : null);

        return {
            imageFiles: [...state.imageFiles, ...validFiles],
            selectedFileId: newSelectedId
        };
    }),

    removeImage: (fileName) => set((state) => {
        const newFiles = state.imageFiles.filter(f => f.name !== fileName);
        // If selected file removed, select next available or null
        let newSelectedId = state.selectedFileId;
        if (state.selectedFileId === fileName) {
            newSelectedId = newFiles.length > 0 ? newFiles[0].name : null;
        }
        return {
            imageFiles: newFiles,
            selectedFileId: newSelectedId
        };
    }),

    selectImage: (fileName) => set({ selectedFileId: fileName }),

    updateConfig: (updates) => set((state) => {
        const newConfigValues = typeof updates === 'function' ? updates(state.config) : updates;
        return {
            config: { ...state.config, ...newConfigValues }
        };
    }),

    resetConfig: () => set({
        config: {
            type: "text",
            text: "Watermark",
            fontSize: 40,
            color: "#000000",
            font: "sans-serif",
            fontWeight: "bold",
            logo: DEFAULT_LOGO_CONFIG,
            layoutMode: "tile",
            offsetX: 0,
            offsetY: 0,
            ...DEFAULT_BASE_CONFIG,
        } as WatermarkConfig
    }),

    getSelectedFile: () => {
        const state = get();
        return state.imageFiles.find(f => f.name === state.selectedFileId);
    }
}));
