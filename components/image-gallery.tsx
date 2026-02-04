"use client";
import { useWatermarkStore } from "@/store/watermark-store";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function ImageGallery() {
    const { imageFiles, selectedFileId, selectImage, removeImage } = useWatermarkStore();

    if (imageFiles.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-4 mt-4">
            {imageFiles.map((file) => {
                const isSelected = selectedFileId === file.name;
                const url = URL.createObjectURL(file); // Note: cleanup needed ideally
                
                return (
                    <div 
                        key={file.name} 
                        className={cn(
                            "relative w-20 h-20 rounded-md border-2 overflow-hidden cursor-pointer group",
                            isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent opacity-70 hover:opacity-100"
                        )}
                        onClick={() => selectImage(file.name)}
                    >
                        <img 
                            src={url} 
                            alt={file.name} 
                            className="w-full h-full object-cover" 
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeImage(file.name);
                            }}
                            className="absolute top-0 right-0 p-1 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-md"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
