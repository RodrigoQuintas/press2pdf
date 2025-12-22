import { useState, useRef, useEffect } from 'react';

function ScreenCapture({ onCapture, onClose }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const startPointRef = useRef(null);

  useEffect(() => {
    startScreenCapture();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScreenCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          mediaSource: 'screen',
          cursor: 'always'
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Quando o usuário parar de compartilhar, fechar o modal
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        onClose();
      });
    } catch (err) {
      console.error('Erro ao capturar tela:', err);
      alert('Não foi possível capturar a tela. Certifique-se de dar permissão.');
      onClose();
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);
    setIsCapturing(true);

    // Parar o stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleMouseDown = (e) => {
    if (!isCapturing) return;
    
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    startPointRef.current = { x, y };
    setIsDrawing(true);
    setSelectionBox(null);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !isCapturing) return;

    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const x = Math.min(startPointRef.current.x, currentX);
    const y = Math.min(startPointRef.current.y, currentY);
    const width = Math.abs(currentX - startPointRef.current.x);
    const height = Math.abs(currentY - startPointRef.current.y);
    
    setSelectionBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !selectionBox) return;
    
    setIsDrawing(false);
    cropAndSend();
  };

  const cropAndSend = () => {
    if (!selectionBox || !capturedImage) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    // Calcular proporções
    const scaleX = canvas.width / overlayCanvas.width;
    const scaleY = canvas.height / overlayCanvas.height;
    
    // Criar um novo canvas para a imagem cortada
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = selectionBox.width * scaleX;
    cropCanvas.height = selectionBox.height * scaleY;
    
    const ctx = cropCanvas.getContext('2d');
    
    // Desenhar a parte selecionada
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(
        img,
        selectionBox.x * scaleX,
        selectionBox.y * scaleY,
        selectionBox.width * scaleX,
        selectionBox.height * scaleY,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );
      
      // Converter para blob e enviar
      cropCanvas.toBlob((blob) => {
        const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
        onCapture(file);
        onClose();
      }, 'image/png');
    };
    img.src = capturedImage;
  };

  // Desenhar a caixa de seleção no canvas overlay
  useEffect(() => {
    if (!isCapturing || !overlayCanvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (selectionBox) {
      // Desenhar fundo escuro com área selecionada transparente
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Limpar área selecionada
      ctx.clearRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      
      // Desenhar borda da seleção
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      
      // Mostrar dimensões
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(selectionBox.x, selectionBox.y - 24, 100, 24);
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.fillText(
        `${Math.round(selectionBox.width)} x ${Math.round(selectionBox.height)}`,
        selectionBox.x + 5,
        selectionBox.y - 8
      );
    }
  }, [selectionBox, isCapturing]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
      {!isCapturing ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Captura de Tela</h2>
            <p className="text-gray-600 mb-4">
              A tela está sendo compartilhada. Quando estiver pronta, clique no botão abaixo para capturar.
            </p>
            
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ maxHeight: '400px' }}>
              <video
                ref={videoRef}
                className="w-full h-auto"
                autoPlay
                playsInline
                muted
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={captureFrame}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                📸 Capturar Agora
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-gray-800 font-medium">
              🖱️ Arraste o mouse para selecionar a área desejada
            </p>
          </div>
          
          <div className="relative" style={{ maxWidth: '95vw', maxHeight: '85vh' }}>
            <img 
              src={capturedImage} 
              alt="Captura" 
              className="max-w-full max-h-full"
              style={{ display: 'block' }}
            />
            <canvas
              ref={overlayCanvasRef}
              width={capturedImage ? new Image().width : 0}
              height={capturedImage ? new Image().height : 0}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair"
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          <div className="bg-white rounded-lg p-4 mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default ScreenCapture;
