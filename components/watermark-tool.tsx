"use client";

import { UploadZone } from "@/components/upload-zone";
import { WatermarkCanvas } from "@/components/watermark-canvas";
import { WatermarkControls } from "@/components/watermark-controls";
import { ImageGallery } from "@/components/image-gallery";
import { useWatermarkStore } from "@/store/watermark-store";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export function WatermarkTool() {
  const { imageFiles, config } = useWatermarkStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (imageFiles.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      const zip = new JSZip();
      let successCount = 0;
      const errors: string[] = [];
      
      const { processWatermarkClient } = await import("@/lib/client-processor");

      // Process images sequentially
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setExportProgress(Math.round(((i + 1) / imageFiles.length) * 100));

        try {
          const blob = await processWatermarkClient(file, config, config.logo.logoFile);
          
          if (blob.size === 0) throw new Error("Processing failed: empty blob");

          zip.file(`watermarked-${file.name}`, blob);
          successCount++;
        } catch (itemError: any) {
          console.error(`Failed to process ${file.name}:`, itemError);
          errors.push(`${file.name}: ${itemError.message}`);
        }
      }

      if (successCount === 0) {
        alert("No images were successfully processed.\n\nErrors:\n" + errors.join("\n"));
        return;
      }

      if (errors.length > 0) {
        alert(`Successfully processed ${successCount} images, but ${errors.length} failed.\nCheck the console for details.`);
      }

      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "STORE"
      });
      saveAs(content, "watermarked-images.zip");

    } catch (error: any) {
      console.error("Export error:", error);
      alert("Failed to export images: " + (error.message || "Unknown error"));
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
        {/* Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-[400px]">
            {imageFiles.length === 0 ? (
              <div className="flex-1 border-2 border-dashed rounded-xl bg-muted/30 flex items-center justify-center p-6">
                 <UploadZone />
              </div>
            ) : (
                <div className="flex flex-col gap-4 h-full">
                     {/* Toolbar */}
                     <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                             Preview 
                             <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {imageFiles.length} files
                             </span>
                        </h3>
                         <Button onClick={handleExport} disabled={isExporting} size="sm">
                            {isExporting ? `Processing ${exportProgress}%` : (
                                <>
                                <Download className="w-4 h-4 mr-2" />
                                Export All
                                </>
                            )}
                        </Button>
                     </div>

                     <div className="flex-1 border rounded-xl overflow-hidden bg-muted/10 relative">
                        <WatermarkCanvas />
                     </div>
                     
                     <div className="bg-background border rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-sm font-medium">Gallery ({imageFiles.length})</h3>
                             <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="h-6 text-xs">
                                <RefreshCw className="w-3 h-3 mr-1" /> Reset
                             </Button>
                        </div>
                        <ImageGallery />
                        <div className="mt-3 pt-3 border-t">
                             <UploadZone />
                        </div>
                     </div>
                </div>
            )}
          </div>
          
          <div className="lg:col-span-1 h-full overflow-y-auto pr-1">
            {imageFiles.length > 0 ? (
               <div className="space-y-4">
                 <WatermarkControls />
               </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 border rounded-xl bg-muted/10 text-center text-muted-foreground border-dashed">
                    <p>Settings will appear here after upload.</p>
                </div>
            )}
          </div>
        </div>
    </div>
  );
}
