"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESETS = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
    "#FFFF00", "#00FFFF", "#FF00FF", "#808080", "#C0C0C0"
];

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex gap-2 items-center border rounded-md p-1 pr-2 cursor-pointer hover:bg-gray-50 transition-colors">
            <div 
                className="w-8 h-8 rounded border shadow-sm"
                style={{ backgroundColor: color }}
            />
             <div className="flex-1 text-xs font-mono uppercase text-gray-600">
                {color}
             </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-3">
              <HexColorPicker color={color} onChange={onChange} />
              
              <div className="flex gap-2">
                   <Input 
                      value={color}
                      onChange={(e) => onChange(e.target.value)}
                      className="h-8 font-mono uppercase"
                   />
              </div>

              <div className="grid grid-cols-5 gap-1">
                  {PRESETS.map((c) => (
                      <button
                        key={c}
                        className="w-6 h-6 rounded-md border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        onClick={() => onChange(c)}
                        title={c}
                      />
                  ))}
              </div>
          </div>
      </PopoverContent>
    </Popover>
  );
}
