"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Laptop, HardDrive, Link as LinkIcon } from "lucide-react";
import useDrivePicker from "react-google-drive-picker";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWatermarkStore } from "@/store/watermark-store";
import { CLOUD_CONFIG } from "@/lib/cloud-config";
declare global {
  interface Window {
    google: any;
    Dropbox: any;
  }

  const google: any;
}
/* ----------------------------------------
   UPLOAD ZONE
----------------------------------------- */
export function UploadZone() {
  const { addImages } = useWatermarkStore();

  const [openOptions, setOpenOptions] = useState(false);
  const [openUrl, setOpenUrl] = useState(false);
  const [url, setUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openPicker] = useDrivePicker();

  /* ---------- DRAG DROP ---------- */
  const onDrop = useCallback(
    (files: File[]) => {
      if (files.length) addImages(files);
      setOpenOptions(false);
    },
    [addImages],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    noClick: true,
  });

  /* ---------- HANDLERS ---------- */
  const handleLocalUpload = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImages(Array.from(e.target.files));
    setOpenOptions(false);
  };

  /* ---------- GOOGLE DRIVE (OAUTH) ---------- */
  const handleGoogleDrive = () => {
    openPicker({
      clientId: CLOUD_CONFIG.google.clientId,
      developerKey: CLOUD_CONFIG.google.developerKey,
      viewId: "DOCS_IMAGES",
      multiselect: true,
      supportDrives: true,

      callbackFunction: (data) => {
        if (data.action !== "picked") return;

        // 1️⃣ Init OAuth token client
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLOUD_CONFIG.google.clientId,
          scope: "https://www.googleapis.com/auth/drive.readonly",
          callback: async (tokenResponse: any) => {
            try {
              const accessToken = tokenResponse.access_token;

              for (const file of data.docs) {
                const res = await fetch(
                  `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  },
                );

                if (!res.ok) throw new Error("Download failed");

                const blob = await res.blob();
                const image = new File([blob], file.name, {
                  type: blob.type || "image/jpeg",
                });

                addImages([image]);
              }

              setOpenOptions(false);
            } catch (err) {
              console.error(err);
              alert("Không thể tải file từ Google Drive");
            }
          },
        });

        // 2️⃣ Request access token
        tokenClient.requestAccessToken();
      },
    });
  };
  /*-------------- Dropbox (Drop-ins) --------------*/
  const handleDropbox = () => {
    if (!window.Dropbox) {
      alert("Dropbox SDK chưa được load");
      return;
    }

    window.Dropbox.choose({
      linkType: "direct", // BẮT BUỘC để fetch được file
      multiselect: true,
      extensions: [".png", ".jpg", ".jpeg", ".webp"],

      success: async (files: any[]) => {
        try {
          for (const file of files) {
            const res = await fetch(file.link);
            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();

            const image = new File([blob], file.name, {
              type: blob.type || "image/jpeg",
            });

            addImages([image]);
          }

          setOpenOptions(false);
        } catch (err) {
          console.error(err);
          alert("Không thể tải file từ Dropbox");
        }
      },

      cancel: () => {
        console.log("Dropbox picker cancelled");
      },
    });
  };

  /* ---------- IMPORT FROM URL ---------- */
  const handleUrlImport = async () => {
    if (!url.trim()) {
      alert("Vui lòng nhập URL");
      return;
    }

    try {
      // Extract filename from URL or use default
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split("/").pop() || `image-${Date.now()}.jpg`;

      // Try direct fetch first
      let blob: Blob;
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error("Direct fetch failed");
        blob = await res.blob();
      } catch (directError) {
        console.log("Direct fetch failed, using proxy");
        // Fallback to proxy for CORS issues
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Proxy fetch failed");
        }
        blob = await res.blob();
      }

      // Validate it's an image
      if (!blob.type.startsWith("image/")) {
        throw new Error("URL không phải là ảnh hợp lệ");
      }

      const file = new File([blob], filename, { type: blob.type });
      addImages([file]);

      setUrl("");
      setOpenUrl(false);
      setOpenOptions(false);
    } catch (error: any) {
      console.error("URL import error:", error);
      alert(`Không thể tải ảnh từ URL: ${error.message || "URL không hợp lệ"}`);
    }
  };

  /* ---------- UI ---------- */
  return (
    <>
      <div
        {...getRootProps()}
        onClick={() => setOpenOptions(true)}
        className="relative h-full flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer bg-white hover:bg-blue-50/30 transition-all duration-300 group overflow-hidden"
      >
        <input {...getInputProps()} />

        {/* Decorative circles - smaller scale */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-100 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-100 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500"></div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative p-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <UploadCloud className="w-10 h-10 text-white" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
            {isDragActive ? "Drop it here!" : "Upload Image"}
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            {isDragActive
              ? "Release to upload your files"
              : "Click to choose or drag & drop your images"}
          </p>

          {/* Supported formats */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-1 bg-gray-100 rounded">PNG</span>
            <span className="px-2 py-1 bg-gray-100 rounded">JPG</span>
            <span className="px-2 py-1 bg-gray-100 rounded">WEBP</span>
          </div>
        </div>
      </div>

      {/* OPTIONS MODAL - Smaller & Cleaner */}
      <Dialog open={openOptions} onOpenChange={setOpenOptions}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-semibold">
              Choose Upload Method
            </DialogTitle>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleInputChange}
          />

          <div className="grid gap-2.5 py-2">
            {/* Primary option - Computer */}
            <button
              onClick={handleLocalUpload}
              className="flex items-center gap-3 p-3.5 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all text-left group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  From My Computer
                </div>
                <div className="text-xs text-gray-500">Browse local files</div>
              </div>
            </button>

            {/* Other options */}
            <button
              onClick={handleGoogleDrive}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-50 text-green-600">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="font-medium text-gray-700">Google Drive</span>
            </button>

            <button
              onClick={handleDropbox}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="font-medium text-gray-700">Dropbox</span>
            </button>

            <button
              onClick={() => setOpenUrl(true)}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <LinkIcon className="w-4 h-4" />
              </div>
              <span className="font-medium text-gray-700">From URL</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* URL MODAL */}
      <Dialog open={openUrl} onOpenChange={setOpenUrl}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Import from URL</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-gray-500">
              Enter a direct link to an image file
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpenUrl(false)}>
              Cancel
            </Button>
            <Button onClick={handleUrlImport} disabled={!url}>
              Import Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
