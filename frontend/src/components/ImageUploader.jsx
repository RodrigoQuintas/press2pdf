import { useState, useRef, useEffect } from 'react';

function ImageUploader({ images, onImagesChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showHint, setShowHint] = useState(true);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      addImages(imageFiles);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      addImages(files);
    }
  };

  const addImages = (files) => {
    const newImages = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    // Inverter a ordem das novas imagens e adicionar no início
    onImagesChange([...newImages.reverse(), ...images]);
  };

  // Suporte para colar imagens do clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
      
      if (imageItems.length > 0) {
        e.preventDefault();
        const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
        if (files.length > 0) {
          addImages(files);
          setShowHint(false);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [images]);

  const removeImage = (id) => {
    const updatedImages = images.filter(img => img.id !== id);
    const imageToRemove = images.find(img => img.id === id);
    
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    onImagesChange(updatedImages);
  };

  // Drag and Drop para reordenação
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setDraggedIndex(index);
    onImagesChange(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Dica de Atalho */}
      {showHint && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">⚡</div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 mb-2">Captura Super Rápida!</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-green-600">Mac:</span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">Cmd + Shift + 4</kbd>
                  <span>→ Selecione a área → Cole aqui com</span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">Cmd + V</kbd>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">Windows:</span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">Win + Shift + S</kbd>
                  <span>→ Selecione a área → Cole aqui com</span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-xs">Ctrl + V</kbd>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHint(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Área de Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-gray-600">
            <span className="font-medium text-blue-600">Clique para selecionar</span>, arraste ou <span className="font-medium text-green-600">cole (Ctrl+V)</span>
          </div>
          <p className="text-sm text-gray-500">PNG, JPG, GIF até 10MB</p>
        </div>
      </div>

      {/* Lista de Imagens */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Imagens ({images.length})
            </h3>
            <p className="text-xs text-gray-500">
              Arraste para reordenar
            </p>
          </div>
          
          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-all ${
                  draggedIndex === index ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {/* Handle de Drag */}
                <div className="flex-shrink-0 text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                  </svg>
                </div>

                {/* Número de Ordem */}
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>

                {/* Preview da Imagem */}
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-16 h-16 object-cover rounded"
                />

                {/* Nome do Arquivo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {image.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(image.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {/* Botão Remover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
