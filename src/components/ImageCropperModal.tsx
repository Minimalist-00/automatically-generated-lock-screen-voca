import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { toast } from 'sonner';

interface ImageCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export default function ImageCropperModal({ imageSrc, onClose, onCropComplete }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 h-[100dvh] w-screen z-[999] flex flex-col bg-[var(--background)] text-[var(--foreground)] animate-in fade-in duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2 bg-[var(--background)]/95 backdrop-blur-sm relative z-10 border-b border-[var(--secondary)]/50 pt-[max(1rem,env(safe-area-inset-top))]">
        <button 
          onClick={onClose}
          className="text-[var(--foreground)] opacity-70 hover:opacity-100 font-bold p-2"
        >
          Cancel
        </button>
        <h3 className="text-lg font-bold">Adjust Wallpaper</h3>
        <button 
          onClick={handleCrop}
          disabled={isProcessing}
          className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-bold p-2 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Done'}
        </button>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-1 w-full h-full bg-[var(--background)]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={9 / 16} // iPhone lock screen aspect ratio
          onCropChange={setCrop}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'bg-[var(--background)]',
            cropAreaClassName: 'border-2 border-[var(--primary)] shadow-[0_0_0_9999em_rgba(255,255,255,0.85)]'
          }}
        />
      </div>

      {/* Controls */}
      <div className="relative bg-[var(--background)] flex flex-col items-center gap-4 px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-[var(--secondary)]/50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <div className="w-full max-w-md flex items-center gap-4 text-[var(--foreground)]">
          <span className="material-symbols-rounded text-sm">zoom_out</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-[var(--secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
          />
          <span className="material-symbols-rounded text-sm">zoom_in</span>
        </div>
        <p className="text-xs text-[var(--foreground)] opacity-70 font-medium">Drag to pan, use slider or pinch to zoom</p>
      </div>
    </div>
  );
}
