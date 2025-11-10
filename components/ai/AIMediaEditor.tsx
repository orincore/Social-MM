'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon, Video, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
type MediaType = 'image' | 'video' | null;

// Simple cn utility for class name concatenation
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface AIMediaEditorProps {
  onMediaProcessed: (file: File, previewUrl: string) => void;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5' | '1.91:1';
  maxFileSizeMB?: number;
}

export function AIMediaEditor({ 
  onMediaProcessed, 
  aspectRatio = '1:1',
  maxFileSizeMB = 100
}: AIMediaEditorProps) {
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [enhancements, setEnhancements] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);

  // Calculate aspect ratio dimensions
  const getAspectRatioDimensions = () => {
    const [w, h] = aspectRatio.split(':').map(Number);
    const ratio = w / h;
    const maxWidth = 800;
    const maxHeight = 800;
    
    let width = maxWidth;
    let height = maxWidth / ratio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * ratio;
    }
    
    return { width: Math.floor(width), height: Math.floor(height) };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    
    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
      setError('Please upload a valid image or video file');
      return;
    }

    // Validate file size
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxFileSizeMB}MB`);
      return;
    }

    setError('');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    if (validImageTypes.includes(file.type)) {
      setMediaType('image');
      // For images, we'll load the image to get its data for editing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { width, height } = getAspectRatioDimensions();
        canvas.width = width;
        canvas.height = height;
        
        // Draw image to fill canvas while maintaining aspect ratio
        const imgAspect = img.width / img.height;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider than canvas
          drawHeight = height;
          drawWidth = height * imgAspect;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller than canvas
          drawWidth = width;
          drawHeight = width / imgAspect;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Store original image data for resetting edits
        const imageData = ctx.getImageData(0, 0, width, height);
        setOriginalImageData(imageData);
        
        // Apply initial preview
        applyImageEnhancements(imageData);
      };
      img.src = url;
    } else {
      setMediaType('video');
      // For videos, we'll just use the video element
      onMediaProcessed(file, url);
    }
  };

  const applyImageEnhancements = (imageData: ImageData) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Apply enhancements to the image data
    const { data } = imageData;
    const brightness = enhancements.brightness / 100;
    const contrast = (enhancements.contrast / 100) + 1; // Convert to multiplier
    const saturation = (enhancements.saturation / 100) + 1; // Convert to multiplier
    
    // Apply brightness, contrast, and saturation
    for (let i = 0; i < data.length; i += 4) {
      // Brightness (add to all channels)
      data[i] += 255 * brightness;
      data[i + 1] += 255 * brightness;
      data[i + 2] += 255 * brightness;
      
      // Contrast (center around 128)
      data[i] = (data[i] - 128) * contrast + 128;
      data[i + 1] = (data[i + 1] - 128) * contrast + 128;
      data[i + 2] = (data[i + 2] - 128) * contrast + 128;
      
      // Saturation (convert to grayscale and interpolate)
      const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
      data[i] = gray + saturation * (data[i] - gray);
      data[i + 1] = gray + saturation * (data[i + 1] - gray);
      data[i + 2] = gray + saturation * (data[i + 2] - gray);
      
      // Clamp values to 0-255
      data[i] = Math.max(0, Math.min(255, data[i]));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
    }
    
    // Apply sharpness (simple convolution)
    if (enhancements.sharpness > 0) {
      // Simple sharpen kernel
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      
      const width = imageData.width;
      const height = imageData.height;
      const pixels = new Uint8ClampedArray(data);
      
      // Apply kernel to each pixel
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          let r = 0, g = 0, b = 0;
          
          // Apply kernel
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const ki = (ky + 1) * 3 + (kx + 1);
              const pi = ((y + ky) * width + (x + kx)) * 4;
              r += pixels[pi] * kernel[ki];
              g += pixels[pi + 1] * kernel[ki];
              b += pixels[pi + 2] * kernel[ki];
            }
          }
          
          // Apply strength and clamp
          const strength = enhancements.sharpness / 100;
          data[i] = Math.max(0, Math.min(255, data[i] * (1 - strength) + r * strength));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * (1 - strength) + g * strength));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * (1 - strength) + b * strength));
        }
      }
    }
    
    // Put the processed image data back to canvas
    ctx.putImageData(imageData, 0, 0);
  };

  const handleEnhancementChange = (key: keyof typeof enhancements, value: number) => {
    if (!originalImageData) return;
    
    setEnhancements(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Create a copy of the original image data
    const imageData = new ImageData(
      new Uint8ClampedArray(originalImageData.data),
      originalImageData.width,
      originalImageData.height
    );
    
    // Apply all enhancements
    applyImageEnhancements(imageData);
  };

  const handleAutoEnhance = () => {
    // Simulate auto-enhance by setting balanced values
    setEnhancements({
      brightness: 10,
      contrast: 15,
      saturation: 20,
      sharpness: 25,
    });
    
    // Apply the enhancements
    if (originalImageData) {
      const imageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
      );
      
      const enhancedEnhancements = {
        brightness: 10,
        contrast: 15,
        saturation: 20,
        sharpness: 25,
      };
      
      // Apply the enhanced values
      const { data } = imageData;
      const brightness = enhancedEnhancements.brightness / 100;
      const contrast = (enhancedEnhancements.contrast / 100) + 1;
      const saturation = (enhancedEnhancements.saturation / 100) + 1;
      
      // Apply enhancements to the image data
      for (let i = 0; i < data.length; i += 4) {
        // Brightness
        data[i] += 255 * brightness;
        data[i + 1] += 255 * brightness;
        data[i + 2] += 255 * brightness;
        
        // Contrast
        data[i] = (data[i] - 128) * contrast + 128;
        data[i + 1] = (data[i + 1] - 128) * contrast + 128;
        data[i + 2] = (data[i + 2] - 128) * contrast + 128;
        
        // Saturation
        const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
        data[i] = gray + saturation * (data[i] - gray);
        data[i + 1] = gray + saturation * (data[i + 1] - gray);
        data[i + 2] = gray + saturation * (data[i + 2] - gray);
        
        // Clamp values
        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
      }
      
      // Apply sharpness (simplified for auto-enhance)
      const strength = enhancedEnhancements.sharpness / 200; // Less aggressive for auto
      const width = imageData.width;
      const height = imageData.height;
      const pixels = new Uint8ClampedArray(data);
      
      // Apply simple sharpening
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          
          // Simple edge detection
          const gx = -pixels[i - width*4 - 4] - 2*pixels[i - 4] - pixels[i + width*4 - 4] +
                     pixels[i - width*4 + 4] + 2*pixels[i + 4] + pixels[i + width*4 + 4];
          
          const gy = -pixels[i - width*4 - 4] - 2*pixels[i - width*4] - pixels[i - width*4 + 4] +
                     pixels[i + width*4 - 4] + 2*pixels[i + width*4] + pixels[i + width*4 + 4];
          
          const magnitude = Math.sqrt(gx*gx + gy*gy) * strength;
          
          // Apply the edge enhancement
          data[i] = Math.max(0, Math.min(255, data[i] + magnitude));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + magnitude));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + magnitude));
        }
      }
      
      // Update the canvas
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.putImageData(imageData, 0, 0);
      }
    }
  };

  const handleSaveImage = () => {
    if (!canvasRef.current) return;
    
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], 'enhanced-image.png', { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      onMediaProcessed(file, url);
      
      // Show success message
      setError('Image enhanced and saved successfully!');
      setTimeout(() => setError(''), 3000);
    }, 'image/png', 0.9);
  };

  const handleReset = () => {
    if (!originalImageData || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Reset enhancements
    setEnhancements({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
    });
    
    // Reset canvas with original image
    ctx.putImageData(originalImageData, 0, 0);
  };

  const { width, height } = getAspectRatioDimensions();

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <div 
          className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 rounded-full bg-gray-100">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">Drag & drop an image or video</h3>
            <p className="text-sm text-gray-500">or click to browse files</p>
            <p className="text-xs text-gray-400 mt-2">
              Max {maxFileSizeMB}MB • {mediaType === 'image' ? 'JPG, PNG, GIF, WEBP' : 'MP4, MOV, WEBM'}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : mediaType === 'image' ? (
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ width: '100%', aspectRatio }}>
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full h-full object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          
          <Tabs defaultValue="enhance" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enhance">Enhance</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="enhance" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Brightness</span>
                  <span className="text-xs text-gray-500">{enhancements.brightness}%</span>
                </div>
                <Slider
                  value={[enhancements.brightness]}
                  onValueChange={([value]) => handleEnhancementChange('brightness', value)}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Contrast</span>
                  <span className="text-xs text-gray-500">{enhancements.contrast}%</span>
                </div>
                <Slider
                  value={[enhancements.contrast]}
                  onValueChange={([value]) => handleEnhancementChange('contrast', value)}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Saturation</span>
                  <span className="text-xs text-gray-500">{enhancements.saturation}%</span>
                </div>
                <Slider
                  value={[enhancements.saturation]}
                  onValueChange={([value]) => handleEnhancementChange('saturation', value)}
                  min={-100}
                  max={100}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sharpness</span>
                  <span className="text-xs text-gray-500">{enhancements.sharpness}%</span>
                </div>
                <Slider
                  value={[enhancements.sharpness]}
                  onValueChange={([value]) => handleEnhancementChange('sharpness', value)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleReset}
                  disabled={isProcessing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleAutoEnhance}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto Enhance
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="filters" className="mt-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Clarendon', filter: 'saturate(1.2) contrast(1.1)' },
                  { name: 'Juno', filter: 'contrast(1.1) saturate(1.3)' },
                  { name: 'Lark', filter: 'contrast(0.9) brightness(1.1)' },
                  { name: 'Reyes', filter: 'contrast(0.85) brightness(1.1) saturate(0.75) sepia(0.22)' },
                  { name: 'Gingham', filter: 'brightness(1.05) hue-rotate(-10deg)' },
                  { name: 'Moon', filter: 'grayscale(1) contrast(1.1) brightness(1.1)' },
                ].map((filter) => (
                  <div 
                    key={filter.name}
                    className="aspect-square rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
                    onClick={() => {
                      // Apply filter effect
                      if (canvasRef.current && originalImageData) {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        
                        // Reset to original
                        ctx.putImageData(originalImageData, 0, 0);
                        
                        // Apply filter
                        ctx.filter = filter.filter;
                        ctx.drawImage(canvas, 0, 0);
                        ctx.filter = 'none';
                      }
                    }}
                  >
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${previewUrl})`,
                        backgroundSize: 'cover',
                        filter: filter.filter,
                      }}
                    />
                    <p className="text-xs text-center mt-1">{filter.name}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setPreviewUrl('');
                setMediaType(null);
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveImage}
              disabled={isProcessing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Apply Changes'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
            <video 
              src={previewUrl} 
              controls 
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setPreviewUrl('');
                setMediaType(null);
                setError('');
              }}
            >
              Change Video
            </Button>
            <Button 
              onClick={() => {
                if (fileInputRef.current?.files?.[0]) {
                  onMediaProcessed(fileInputRef.current.files[0], previewUrl);
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Use This Video
            </Button>
          </div>
        </div>
      )}
      
      {error && (
        <div className={`p-3 rounded-md text-sm ${
          error.includes('success') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {error}
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center">
        <p>For best results, use high-quality images and videos with good lighting.</p>
        <p>Maximum file size: {maxFileSizeMB}MB • {mediaType === 'image' ? 'Recommended: 1080x1080px' : 'Recommended: 1080x1920px'}</p>
      </div>
    </div>
  );
}
