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
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-300 font-bold p-2"
        >
          Cancel
        </button>
        <h3 className="text-lg font-bold">Adjust Wallpaper</h3>
        <button 
          onClick={handleCrop}
          disabled={isProcessing}
          className="text-[var(--accent)] hover:text-[#7BC0B5] font-bold p-2 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Done'}
        </button>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-1 w-full h-full">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={9 / 16} // iPhone lock screen aspect ratio
          onCropChange={setCrop}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'bg-black',
            cropAreaClassName: 'border-2 border-white/50 shadow-[0_0_0_9999em_rgba(0,0,0,0.7)]'
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-4">
        <div className="w-full max-w-md flex items-center gap-4 text-white">
          <span className="material-symbols-rounded text-sm">zoom_out</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
          />
          <span className="material-symbols-rounded text-sm">zoom_in</span>
        </div>
        <p className="text-xs text-gray-400 font-medium">Drag to pan, use slider or pinch to zoom</p>
      </div>
    </div>
  );
}
