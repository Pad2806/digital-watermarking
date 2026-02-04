"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWatermarkStore } from "@/store/watermark-store";
import { calculateWatermarkPositions } from "@/lib/watermark-utils";
import { Loader2 } from "lucide-react";

export function WatermarkCanvas() {
  const { config, getSelectedFile, updateConfig } = useWatermarkStore();
  const imageFile = getSelectedFile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [loadedLogo, setLoadedLogo] = useState<HTMLImageElement | null>(null);
  const [processedLogo, setProcessedLogo] = useState<HTMLImageElement | null>(null);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Load Main Image
  useEffect(() => {
    if (!imageFile) return;

    setIsProcessing(true);
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    img.onload = () => {
      setLoadedImage(img);
      setIsProcessing(false);
    };
  }, [imageFile]);

  // Load Logo Image
  useEffect(() => {
    if (config.type === "text") {
        setLoadedLogo(null);
        return;
    }
    const logoFile = config.logo.logoFile;
    if (!logoFile) return;

    const img = new Image();
    img.src = URL.createObjectURL(logoFile);
    img.onload = () => {
      setLoadedLogo(img);
    };
  }, [config.logo.logoFile, config.type]);

  // Process Logo (Remove BG / Colorize)
  useEffect(() => {
      if (!loadedLogo) {
          setProcessedLogo(null);
          return;
      }
      
      const shouldRemoveBg = config.logo.removeBackground;
      const shouldColorize = config.logo.enableColorize;
      
      // If no processing needed, just use original
      if (!shouldRemoveBg) {
          setProcessedLogo(loadedLogo);
          return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = loadedLogo.width;
      canvas.height = loadedLogo.height;
      ctx.drawImage(loadedLogo, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Target Color parsing
      let rT = 0, gT = 0, bT = 0;
      if (shouldColorize) {
          // Parse hex config.logo.logoColor (fallback to black if empty)
          const colorToUse = config.logo.logoColor || "#000000";
          const hex = colorToUse.replace("#", "");
          rT = parseInt(hex.substring(0, 2), 16);
          gT = parseInt(hex.substring(2, 4), 16);
          bT = parseInt(hex.substring(4, 6), 16);
      }

      for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Simple Threshold for White
          // If (R > 230 && G > 230 && B > 230) -> Alpha = 0
          if (r > 230 && g > 230 && b > 230) {
              data[i + 3] = 0; // Transparent
          } else if (shouldColorize) {
              // Apply color tint to non-transparent pixels
              if (data[i + 3] > 0) {
                  data[i] = rT;
                  data[i + 1] = gT;
                  data[i + 2] = bT;
              }
          }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      const processedImg = new Image();
      processedImg.src = canvas.toDataURL();
      processedImg.onload = () => {
          setProcessedLogo(processedImg);
      };

  }, [loadedLogo, config.logo.removeBackground, config.logo.enableColorize, config.logo.logoColor]);

  // Helper to resolve font string (handle CSS variables)
  const getComputedFont = useCallback((fontString: string) => {
      // Check if it contains a css variable
      // Format usually: "var(--font-name), sans-serif" or just "var(--font-name)"
      if (!fontString.includes('var(')) return fontString;

      const match = fontString.match(/var\(([^)]+)\)/);
      if (match && match[1]) {
          // Resolve variable
          const resolved = getComputedStyle(document.body).getPropertyValue(match[1]);
          if (resolved) {
             // Append backup fonts if any
             const backup = fontString.replace(/var\([^)]+\)/, '').trim();
             // Remove leading comma if present in backup (e.g. ", sans-serif")
             const cleanBackup = backup.replace(/^,\s*/, '');
             
             // The resolved variable might already include quotes '"Inter"', remove them for canvas sometimes or keep? 
             // Canvas usually accepts them. 
             // Note: resolved might be empty string if variable not found
             return resolved + (cleanBackup ? `, ${cleanBackup}` : "");
          }
      }
      return "sans-serif"; // Fallback
  }, []);

  // Draw Canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !loadedImage) return;

    // Use actual image dimensions
    canvas.width = loadedImage.width;
    canvas.height = loadedImage.height;

    // Draw Base Image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImage, 0, 0);

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

    // Pre-measure text
    if (config.type === "text" || config.type === "combo") {
       const weight = config.fontWeight || "normal";
       const rawFont = config.font || "sans-serif";
       const font = getComputedFont(rawFont);
       ctx.font = `${weight} ${config.fontSize}px ${font}`;
       
       const metrics = ctx.measureText(config.text);
       const textWidth = metrics.width;
       const textHeight = config.fontSize; 
       
       if (config.type === "combo" && processedLogo) {
           const baseLogoWidth = loadedImage.width * (config.logo.scale / 100); 
           const logoRatio = processedLogo.width / processedLogo.height;
           const finalLogoWidth = baseLogoWidth;
           const finalLogoHeight = baseLogoWidth / logoRatio;

           itemWidth = finalLogoWidth + 10 + textWidth; 
           itemHeight = Math.max(finalLogoHeight, textHeight);
       } else {
           itemWidth = textWidth;
           itemHeight = textHeight;
       }
    } else if (config.type === "logo" && processedLogo) {
       const baseLogoWidth = loadedImage.width * (config.logo.scale / 100); 
       const logoRatio = processedLogo.width / processedLogo.height;
       itemWidth = baseLogoWidth;
       itemHeight = baseLogoWidth / logoRatio;
    }

    if (itemWidth > 0 && itemHeight > 0) {
        let positions: {x:number, y:number}[] = [];

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
                const rawFont = config.font || "sans-serif";
                const font = getComputedFont(rawFont);
                ctx.font = `${weight} ${config.fontSize}px ${font}`;
                ctx.textBaseline = "middle";
                ctx.fillText(config.text, drawX, drawY);
            } else if (config.type === "logo" && processedLogo) {
                ctx.drawImage(processedLogo, drawX - itemWidth/2, drawY - itemHeight/2, itemWidth, itemHeight);
            } else if (config.type === "combo" && processedLogo) {
                const logoW = loadedImage.width * (config.logo.scale / 100);
                const logoH = logoW / (processedLogo.width / processedLogo.height);
                
                const totalW = itemWidth;
                const startX = drawX - totalW / 2;
                
                const logoX = startX;
                const logoY = drawY - logoH / 2; 
                ctx.drawImage(processedLogo, logoX, logoY, logoW, logoH);
                
                ctx.fillStyle = config.color;
                const weight = config.fontWeight || "normal";
                const rawFont = config.font || "sans-serif";
                const font = getComputedFont(rawFont);
                ctx.font = `${weight} ${config.fontSize}px ${font}`;
                ctx.textBaseline = "middle";
                ctx.fillText(config.text, startX + logoW + 10, drawY);
            }
        });
    }

    ctx.restore();
  }, [loadedImage, processedLogo, config, getComputedFont]);

  useEffect(() => {
    draw();
  }, [draw]);


  // Event Handlers for Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      // Calculate scale factor between screen pixels and canvas pixels
      // The canvas is displayed with "max-w-full".
      if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const scaleX = canvasRef.current.width / rect.width;
          const scaleY = canvasRef.current.height / rect.height;

          updateConfig((prev) => ({
              offsetX: (prev.offsetX || 0) + deltaX * scaleX,
              offsetY: (prev.offsetY || 0) + deltaY * scaleY
          }));
          
          setLastMousePos({ x: e.clientX, y: e.clientY });
      }
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  if (!imageFile) {
     return (
        <div className="flex items-center justify-center p-12 border border-dashed rounded-lg bg-muted/20 h-[400px] text-muted-foreground">
             No image selected
        </div>
     );
  }

  return (
    <div className="relative w-full h-full overflow-hidden border rounded-lg bg-gray-100 flex items-center justify-center" ref={containerRef}>
        {isProcessing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )}
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-[600px] object-contain cursor-move shadow-md"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
