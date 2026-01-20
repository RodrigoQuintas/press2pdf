import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const ImageCropper = ({ image, onCropComplete, aspectRatio, targetWidth, targetHeight, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={setZoom}
        />
      </div>
      <div className="bg-white p-4 space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Zoom:</label>
          <input
            type="range"
            value={zoom}
            min={0.5}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(e.target.value)}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 min-w-[3rem]">{zoom}x</span>
        </div>
        <div className="text-sm text-gray-600">
          Dimensão final: {targetWidth} × {targetHeight}px
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Confirmar Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
