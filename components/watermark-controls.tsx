"use client";

import { useWatermarkStore } from "@/store/watermark-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Type, Image as ImageIcon, Grid, X, LayoutGrid, Maximize, Move } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "./color-picker";

export function WatermarkControls() {
  const { config, updateConfig } = useWatermarkStore();
  const [density, setDensity] = useState(50);
  const [activeTab, setActiveTab] = useState<"text" | "logo" | "combo">(config.type);

  // Sync internal density state with store gap
  useEffect(() => {
    const currentGap = config.gapX || 200;
    const inferredDensity = Math.round(((500 - currentGap) / 480) * 100);
    setDensity(Math.max(0, Math.min(100, inferredDensity)));
  }, [config.gapX]);

    // Update config type when tab changes
  useEffect(() => {
      if (activeTab !== config.type) {
         updateConfig({ type: activeTab });
      }
  }, [activeTab, updateConfig, config.type]);


  const handleDensityChange = useCallback((value: number[]) => {
    const d = value[0];
    setDensity(d);
    // Density 0 -> 500px gap, Density 100 -> 20px gap
    const gap = Math.round(500 - (d / 100 * 480));
    updateConfig({ gapX: gap, gapY: gap });
  }, [updateConfig]);

  const handleFontChange = (value: string) => {
    updateConfig({ font: value });
  };

  const fonts = [
    { name: "Inter", value: "var(--font-inter), sans-serif", preview: "Ag" },
    { name: "Roboto", value: "var(--font-roboto), sans-serif", preview: "Ag" },
    { name: "Playfair", value: "var(--font-playfair), serif", preview: "Ag" },
    { name: "Montserrat", value: "var(--font-montserrat), sans-serif", preview: "Ag" },
    { name: "Script", value: "var(--font-dancing), cursive", preview: "Ag" },
  ];

  return (
    <div className="bg-white border rounded-xl shadow-sm h-full flex flex-col overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
        <h3 className="font-semibold text-gray-900">Properties</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-900">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Type Selector (Custom Tabs) */}
        <div className="flex p-1 bg-gray-100 rounded-lg">
             <button 
                onClick={() => setActiveTab("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
             >
                <Type className="w-3.5 h-3.5" /> Text
             </button>
             <button 
                onClick={() => setActiveTab("logo")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'logo' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
             >
                <ImageIcon className="w-3.5 h-3.5" /> Logo
             </button>
             <button 
                onClick={() => setActiveTab("combo")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'combo' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
             >
                <Grid className="w-3.5 h-3.5" /> Combo
             </button>
        </div>


        {/* TEXT SECTION */}
        {(activeTab === "text" || activeTab === "combo") && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Text</Label>
              <textarea
                className="w-full min-h-[60px] p-2 rounded-md border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={config.text}
                onChange={(e) => updateConfig({ text: e.target.value })}
                placeholder="Enter watermark text..."
              />
              {!config.text.trim() && (
                  <p className="text-[10px] text-red-500 font-medium animate-pulse">
                      * Text is required to display watermark
                  </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Font</Label>
                    <Select value={config.font} onValueChange={handleFontChange}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Font" />
                        </SelectTrigger>
                        <SelectContent>
                            {fonts.map(f => (
                                <SelectItem key={f.name} value={f.value}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-medium opacity-70 w-6 text-center" style={{ fontFamily: f.value }}>{f.preview}</span>
                                        <span>{f.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                     <Label className="text-xs font-medium text-gray-700">Weight</Label>
                     <Select 
                        value={config.fontWeight || "bold"} 
                        onValueChange={(v) => updateConfig({ fontWeight: v })}
                     >
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lighter">Light</SelectItem>
                            <SelectItem value="normal">Regular</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="bolder">Extra</SelectItem>
                        </SelectContent>
                     </Select>
                 </div>
            </div>

            <div className="space-y-2">
                 <Label className="text-xs font-medium text-gray-700">Color</Label>
                 <ColorPicker color={config.color} onChange={(c) => updateConfig({ color: c })} />
            </div>
          </div>
        )}

         {/* LOGO SECTION */}
         {(activeTab === "logo" || activeTab === "combo") && (
          <div className="space-y-4 pt-2 border-t border-dashed animate-in fade-in slide-in-from-bottom-1">
             {/* ... (File Upload Logic remains same) ... */}
             <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-700">Logo Image</Label>
                {config.logo.logoFile && (
                    <span className="text-[10px] text-green-600 font-medium truncate max-w-[120px]">
                        {config.logo.logoFile.name}
                    </span>
                )}
             </div>
             
             {!config.logo.logoFile ? (
                 <>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500">Click to upload logo</p>
                        </div>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    updateConfig({
                                    logo: { ...config.logo, logoFile: e.target.files[0] },
                                    });
                                }
                            }}
                        />
                    </label>
                    <p className="text-[10px] text-red-500 font-medium animate-pulse mt-1">
                        * Logo image is required
                    </p>
                 </>
             ) : (
                 <div className="flex gap-2">
                     <Button 
                        variant="outline" 
                        className="w-full text-xs" 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                     >
                        Change Logo
                     </Button>
                      <input 
                        id="logo-upload"
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                         onChange={(e) => {
                            if (e.target.files?.[0]) {
                                updateConfig({
                                logo: { ...config.logo, logoFile: e.target.files[0] },
                                });
                            }
                         }}
                    />
                 </div>
             )}
             

             
             {config.logo.logoFile && (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-700">Remove Background</Label>
                        <Switch 
                            checked={config.logo.removeBackground}
                            onCheckedChange={(c) => updateConfig({ logo: { ...config.logo, removeBackground: c } })}
                        />
                    </div>
                    
                    {config.logo.removeBackground && (
                         <div className="space-y-3 pl-2 border-l-2 border-blue-100">
                             <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-gray-700">Color Overlay</Label>
                                <Switch 
                                    checked={config.logo.enableColorize}
                                    onCheckedChange={(c) => updateConfig({ logo: { ...config.logo, enableColorize: c } })}
                                />
                            </div>
                            {config.logo.enableColorize && (
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-gray-500">Tint Color</Label>
                                    <ColorPicker 
                                        color={config.logo.logoColor || "#000000"} 
                                        onChange={(c) => updateConfig({ logo: { ...config.logo, logoColor: c } })} 
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
             )}
             
             <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-gray-700">Logo Scale</Label>
                    <span className="text-xs text-blue-500 font-mono">{config.logo.scale}%</span>
                 </div>
                 <Slider
                    value={[config.logo.scale]}
                    onValueChange={(v) => updateConfig({ logo: { ...config.logo, scale: v[0] } })}
                    min={5}
                    max={100}
                    step={1}
                    className="py-1"
                />
             </div>
          </div>
        )}

        <div className="border-t my-2" />
        
        {/* LAYOUT SECTION */}
        <div className="space-y-5">
            
             {/* Hide Font Size slider for Logo Only mode as requested */}
             {activeTab !== 'logo' && (
                 <div className="space-y-3">
                     <Label className="text-xs font-medium text-gray-700">Text Size</Label>
                     <div className="flex items-center gap-3">
                         <Slider
                            value={[config.fontSize]}
                            onValueChange={(v) => updateConfig({ fontSize: v[0] })}
                            min={10}
                            max={300}
                            step={1}
                            className="flex-1"
                         />
                         <span className="text-xs text-blue-500 font-mono w-8 text-right">{Math.round(config.fontSize/10)/10}x</span>
                     </div>
                 </div>
             )}

             <div className="space-y-3">
                <div className="flex items-center justify-between">
                     <Label className="text-xs font-medium text-gray-700">Tile Mode</Label>
                     <div className="flex bg-gray-100 rounded-md p-0.5">
                         <button 
                            onClick={() => updateConfig({ layoutMode: 'single' })}
                            className={`p-1.5 rounded transition-all ${config.layoutMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Single Center"
                         >
                             <Maximize className="w-4 h-4" />
                         </button>
                         <button 
                             onClick={() => updateConfig({ layoutMode: 'tile' })}
                             className={`p-1.5 rounded transition-all ${config.layoutMode === 'tile' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                             title="Tile Grid"
                         >
                             <LayoutGrid className="w-4 h-4" />
                         </button>
                     </div>
                </div>
             </div>

             {config.layoutMode === 'tile' && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-xs font-medium text-gray-700">Spacing</Label>
                        <span className="text-xs text-blue-500 font-mono">{density}%</span>
                    </div>
                    <Slider
                        value={[density]}
                        onValueChange={handleDensityChange}
                        min={0}
                        max={100}
                        step={1}
                    />
                </div>
             )}

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-gray-700">Opacity</Label>
                    <span className="text-xs text-blue-500 font-mono">{Math.round(config.opacity*100)}%</span>
                </div>
                <Slider
                    value={[config.opacity * 100]}
                    onValueChange={(v) => updateConfig({ opacity: v[0] / 100 })}
                    min={0}
                    max={100}
                    step={1}
                />
            </div>
            
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-gray-700">Rotation</Label>
                    <span className="text-xs text-blue-500 font-mono">{config.rotate}°</span>
                </div>
                <Slider
                    value={[config.rotate]}
                    onValueChange={(v) => updateConfig({ rotate: v[0] })}
                    min={-180}
                    max={180}
                    step={1}
                />
            </div>

        </div>

      </div>
      
      {/* Footer / Actions */}
      <div className="p-4 border-t bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
         <div className="flex items-center gap-1.5">
             <Move className="w-3.5 h-3.5" />
             <span>Drag to move</span>
         </div>
      </div>
    </div>
  );
}
