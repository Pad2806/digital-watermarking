"use client";

import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Laptop, Link as LinkIcon, HardDrive, Image as ImageIcon, Cloud, UploadCloud } from "lucide-react"; 
import { useWatermarkStore } from "@/store/watermark-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useDrivePicker from "react-google-drive-picker";
// @ts-ignore
import DropboxChooser from "react-dropbox-chooser";
import { CLOUD_CONFIG, hasDropboxKeys, hasGoogleKeys } from "@/lib/cloud-config";

export function UploadZone() {
  const { addImages } = useWatermarkStore();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  
  // Google Drive Hook
  const [openDrivePicker] = useDrivePicker();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        addImages(acceptedFiles);
        setIsOptionsOpen(false); 
      }
    },
    [addImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    noClick: true, 
    multiple: true,
  });

  const handleMainClick = () => {
      setIsOptionsOpen(true);
  };

  const handleComputerUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          addImages(Array.from(e.target.files));
          setIsOptionsOpen(false);
      }
  };

  // Helper to fetch file from URL (using Proxy to bypass CORS)
  const fetchAndAddImage = async (url: string, name: string = "downloaded_image.png", token?: string) => {
      try {
          // Use our local proxy to avoid CORS errors from Dropox/Drive
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
          
          const headers: HeadersInit = {};
          if (token) {
              headers["Authorization"] = `Bearer ${token}`;
          }

          const res = await fetch(proxyUrl, { headers });
          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || "Proxy fetch failed");
          }
          
          const blob = await res.blob();
          const file = new File([blob], name, { type: blob.type });
          addImages([file]);
          setIsOptionsOpen(false);
          setShowUrlDialog(false);
          setUrlInput("");
      } catch (err: any) {
          console.error("Fetch error:", err);
          alert(`Error: ${err.message}`);
      }
  };

  const handleUrlSubmit = () => {
      if (urlInput) {
          fetchAndAddImage(urlInput, "web_image.png");
      }
  };

  const handleGoogleDrive = () => {
      if (!hasGoogleKeys()) {
          alert("Missing Google API Keys in lib/cloud-config.ts");
          return;
      }
      openDrivePicker({
          clientId: CLOUD_CONFIG.google.clientId,
          developerKey: CLOUD_CONFIG.google.developerKey,
          viewId: "DOCS_IMAGES", 
          showUploadView: true,
          showUploadFolders: true,
          supportDrives: true,
          multiselect: true,
          // Thêm các quyền cần thiết cho cả Drive và Photos
          customScopes: [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/photoslibrary.readonly'
          ],
          callbackFunction: (data) => {
              if (data.action === "picked") {
                  const token = data.oauthToken; 
                  data.docs.map((doc: any) => {
                      console.log("Downloading Drive file:", doc);
                      
                      // Use the Google Drive API 'alt=media' endpoint. 
                      // We don't need the key if we have an OAuth token.
                      const fileId = doc.id;
                      const downloadApiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
                      
                      fetchAndAddImage(downloadApiUrl, doc.name || "drive_image.png", token);
                  });
              }
          },
      });
  };
  
  const handleDropboxSuccess = (files: any[]) => {
      files.forEach(f => {
          // f.link is the download link
          fetchAndAddImage(f.link, f.name);
      });
  };

  return (
    <>
        <div 
            className="h-full flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 transition-all hover:bg-gray-50/80 hover:border-blue-200 cursor-pointer group" 
            {...getRootProps()}
            style={{ touchAction: 'none' }}
            onClick={handleMainClick}
        >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-5 rounded-full bg-white group-hover:scale-110 transition-transform shadow-sm border group-hover:border-blue-200 text-blue-500">
                    <UploadCloud className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-gray-900">Upload Image</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                        {isDragActive ? "Drop it right here!" : "Click to choose method or drag & drop"}
                    </p>
                </div>
            </div>
        </div>

        {/* Options Modal */}
        <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Choose Upload Method</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 py-4">
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp" 
                        multiple 
                        onChange={handleHiddenInputChange} 
                    />

                    {/* Primary: Computer */}
                   <button 
                        onClick={handleComputerUploadClick}
                        className="w-full group relative flex items-center gap-4 bg-white hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 rounded-xl p-4 transition-all"
                   >
                       <div className="w-12 h-12 flex items-center justify-center bg-blue-100/50 rounded-lg text-blue-600">
                           <Laptop className="w-6 h-6" />
                       </div>
                       <div className="text-left">
                           <span className="block font-semibold text-slate-900 group-hover:text-blue-700">From My Computer</span>
                           <span className="text-sm text-slate-500">Browse files from your device</span>
                       </div>
                   </button>

                   {/* Secondary Grid */}
                   <div className="grid grid-cols-2 gap-3">
                       <button className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-slate-200 hover:border-slate-300 rounded-lg p-3 transition-all" onClick={handleGoogleDrive}>
                           <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600">
                                <HardDrive className="w-4 h-4" />
                           </div>
                           <span className="font-medium text-slate-700 text-sm">Google Drive</span>
                       </button>

                       {/* Reuse Google Drive Handler for Photos (Same Picker usually) */}
                       <button className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-slate-200 hover:border-slate-300 rounded-lg p-3 transition-all" onClick={handleGoogleDrive}>
                           <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500">
                                <ImageIcon className="w-4 h-4" />
                           </div>
                           <span className="font-medium text-slate-700 text-sm">Google Photos</span>
                       </button>

                       {/* Dropbox Chooser */}
                       {hasDropboxKeys() ? (
                           <DropboxChooser 
                                appKey={CLOUD_CONFIG.dropbox.appKey}
                                success={handleDropboxSuccess}
                                cancel={() => console.log('Dropbox canceled')}
                                multiselect={true}
                                extensions={['.jpg', '.png', '.jpeg', '.webp']}
                           >
                                <button className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-slate-200 hover:border-slate-300 rounded-lg p-3 transition-all w-full">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                            <Cloud className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-slate-700 text-sm">Dropbox</span>
                                </button>
                           </DropboxChooser>
                       ) : (
                           <button className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-slate-200 hover:border-slate-300 rounded-lg p-3 transition-all" onClick={() => alert("Missing Dropbox App Key in lib/cloud-config.ts")}>
                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                        <Cloud className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-slate-700 text-sm">Dropbox</span>
                            </button>
                       )}

                       <button 
                          className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-slate-200 hover:border-slate-300 rounded-lg p-3 transition-all"
                          onClick={() => {
                              setShowUrlDialog(true);
                          }}
                       >
                           <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                                <LinkIcon className="w-4 h-4" />
                           </div>
                           <span className="font-medium text-slate-700 text-sm">Web Link</span>
                       </button>
                   </div>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Import from Web Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                  <Input 
                        placeholder="https://example.com/image.png" 
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                      Note: Ensure the URL allows direct access (CORS enabled).
                  </p>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUrlDialog(false)}>Cancel</Button>
                  <Button onClick={handleUrlSubmit} disabled={!urlInput}>Import Image</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
