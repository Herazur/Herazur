import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Image, Info, RotateCw, Save } from 'lucide-react';

const ImageCropDialog = ({
  isOpen,
  onClose,
  image,
  onCropComplete,
  aspect,
  isGif = false,
  canUseAnimatedGif = false,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const showGifInfo = useMemo(() => Boolean(isGif && canUseAnimatedGif), [isGif, canUseAnimatedGif]);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const onCropChange = useCallback((location) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((value) => {
    const next = Array.isArray(value) ? value[0] : value;
    setZoom(next ?? 1);
  }, []);

  const onRotationChange = useCallback((value) => {
    const next = Array.isArray(value) ? value[0] : value;
    setRotation(next ?? 0);
  }, []);

  const handleCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (showGifInfo) {
        await onCropComplete(null, true, 0);
      } else if (croppedAreaPixels) {
        await onCropComplete(croppedAreaPixels, false, rotation);
      }
      onClose(); // Close dialog on successful save
    } catch (error) {
      console.error('Error in crop completion:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showGifInfo, croppedAreaPixels, rotation, onCropComplete, isLoading, onClose]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [onClose, isLoading]);

  const getAspectRatioText = useMemo(() => {
    if (aspect === 1) return '1:1 (Square)';
    if (aspect === 16 / 9) return '16:9 (Wide)';
    if (aspect === 4 / 3) return '4:3 (Standard)';
    if (aspect === 3 / 2) return '3:2 (Classic)';
    return `${aspect}:1`;
  }, [aspect]);

  const getImageTypeText = useMemo(() => {
    return aspect === 1 ? 'avatar' : 'banner';
  }, [aspect]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {showGifInfo ? 'Animated GIF' : 'Crop Image'}
          </DialogTitle>
          <DialogDescription>
            {showGifInfo
              ? `Your animated GIF will be preserved with its original animation.`
              : `Zoom, rotate and drag to select the perfect crop for your ${getImageTypeText}.`}
          </DialogDescription>
        </DialogHeader>

        {showGifInfo ? (
          <div className="p-4 text-center space-y-4">
            <div className="flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-lg">
              <Info className="h-5 w-5 mr-3 flex-shrink-0" />
              <p className="text-sm">
                <strong>Animation preserved!</strong> Your GIF will keep its original animation.
                For best results, use a <strong>{getAspectRatioText}</strong> aspect ratio.
              </p>
            </div>
            {image && (
              <div className="flex justify-center">
                <img
                  alt="Selected GIF preview"
                  className="max-w-full max-h-64 rounded-md shadow-md object-contain"
                  src={image}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="relative h-80 w-full bg-muted rounded-lg overflow-hidden">
              {image && (
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  onCropChange={onCropChange}
                  onZoomChange={onZoomChange}
                  onRotationChange={onRotationChange}
                  onCropComplete={handleCropComplete}
                  showGrid={false}
                  style={{
                    containerStyle: {
                      borderRadius: '8px',
                    },
                    mediaStyle: {
                      maxHeight: '100%',
                      maxWidth: '100%',
                    }
                  }}
                />
              )}
            </div>

            <div className="space-y-4 p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-16">Zoom</span>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={onZoomChange}
                  className="flex-1"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground w-8">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-16">Rotate</span>
                <Slider
                  value={[rotation]}
                  min={-180}
                  max={180}
                  step={1}
                  onValueChange={onRotationChange}
                  className="flex-1"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground w-12">
                  {rotation}°
                </span>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Aspect ratio: <strong>{getAspectRatioText}</strong>
              </div>
            </div>
          </>
        )}

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || (!showGifInfo && !croppedAreaPixels)}
          >
            {isLoading ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {showGifInfo ? 'Use GIF' : `Save ${getImageTypeText}`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;