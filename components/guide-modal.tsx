"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, Settings, Download, ArrowRight, Check } from "lucide-react";
import { useState } from "react";

interface GuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuideModal({ open, onOpenChange }: GuideModalProps) {
  const [step, setStep] = useState(1);

  const totalSteps = 3;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onOpenChange(false);
      setTimeout(() => setStep(1), 300); // Reset after close
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Quick Start Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to watermark your images in 3 simple steps.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 1 && (
            <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">1. Upload Image</h3>
                <p className="text-sm text-gray-500">
                  Drag & drop your main image into the canvas, or click the upload button to get started.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <Settings className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">2. Customize</h3>
                <p className="text-sm text-gray-500">
                  Choose <b>Text</b> or <b>Logo</b> mode. Adjust opacity, rotation, colors, and tiling to fit your style.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Download className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">3. Export</h3>
                <p className="text-sm text-gray-500">
                  Click <b>Export Watermark</b> to instantly download your protected image in high quality.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between flex-row items-center">
            <div className="flex gap-1">
                {[1,2,3].map(s => (
                    <div 
                        key={s} 
                        className={`w-2 h-2 rounded-full transition-colors ${s === step ? 'bg-slate-900' : 'bg-slate-200'}`}
                    />
                ))}
            </div>
            <Button onClick={nextStep} className="gap-2">
                {step === totalSteps ? (
                    <>Get Started <Check className="w-4 h-4" /></>
                ) : (
                    <>Next <ArrowRight className="w-4 h-4" /></>
                )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
