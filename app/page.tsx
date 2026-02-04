"use client";

import { WatermarkTool } from "@/components/watermark-tool";
import { GuideModal } from "@/components/guide-modal";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";

export default function Home() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
     // Check if user has seen guide
     const hasSeen = localStorage.getItem("hasSeenGuide");
     if (!hasSeen) {
         // Small delay for better UX
         setTimeout(() => setShowGuide(true), 1000);
     }
  }, []);

  const handleOpenGuide = () => {
      setShowGuide(true);
  };

  const handleCloseGuide = (open: boolean) => {
      if (!open) {
          localStorage.setItem("hasSeenGuide", "true");
          setShowGuide(false);
      }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <GuideModal open={showGuide} onOpenChange={handleCloseGuide} />
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border">
                <Image 
                    src="/pad.png" 
                    alt="Watermark Pro Logo" 
                    fill 
                    className="object-cover"
                />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Watermark Pad
            </h1>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <button 
                onClick={handleOpenGuide}
                className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
            >
                <HelpCircle className="w-4 h-4" />
                Guide
            </button>
            <Link href="https://github.com/Pad2806" target="_blank" className="hover:text-indigo-600 transition-colors">About</Link>
            <Link href="https://github.com/Pad2806/digital-watermarking" target="_blank" className="hover:text-indigo-600 transition-colors">GitHub</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        {/* Simple Hero */}
        <div className="text-center space-y-2 mb-5">
            <h2 className="text-3xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Create Your Own Watermark
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-md">
                Personalize your images with your own text or logo watermark.
            </p>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm">
                High quality - Secure - Easy to use - Free
            </p>
        </div>

        {/* Tool Container */}
        <div className="bg-white rounded-2xl shadow-sm border p-1 min-h-[600px]">
            <WatermarkTool />
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Watermark Pad. All rights reserved by <Link href="https://github.com/Pad2806" target="_blank" className="hover:text-indigo-600 transition-colors">@Pad2806</Link>.</p>
            <div className="flex gap-6">
                <Link href="#" className="hover:text-slate-900">Privacy Policy</Link>
                <Link href="#" className="hover:text-slate-900">Terms of Service</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
