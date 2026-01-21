import { useState, useEffect } from 'react';
import CustomerManager from './components/CustomerManager';
import ImageUploader from './components/ImageUploader';
import ArticleEditor from './components/ArticleEditor';

function App() {
  const [currentPage, setCurrentPage] = useState('pdf'); // 'pdf' or 'customers'
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [extractionMode, setExtractionMode] = useState('automatic'); // 'automatic' or 'manual'
  const [images, setImages] = useState([]);
  const [manualTitle, setManualTitle] = useState('');
  const [editMode, setEditMode] = useState(true); // Novo: modo de edição (ATIVADO POR PADRÃO)
  const [extractedArticle, setExtractedArticle] = useState(null); // Novo: artigo extraído
  const [editedContent, setEditedContent] = useState(''); // Novo: conteúdo editado
  const [pdfFilename, setPdfFilename] = useState(''); // Nome do arquivo PDF
  
  useEffect(() => {
    loadCustomers();
  }, []);
  
  const loadCustomers = async () => {
    try {
      const response = await fetch('/customers/customers.json');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const motivationalMessages = [
    "Agora você tem mais tempo para pedalar com a sua bike! 🚴‍♀️",
    "Tempo economizado = mais momentos com Yin e Yang! 🐱🐱",
    "Menos cliques, mais tempo para receitas veganas deliciosas! 🥗",
    "Ale, você merece mais tempo livre! Aproveite com o Nico! 💚",
    "Mais eficiência, mais tempo para cuidar dos seus gatinhos! 😻",
    "Tempo é precioso! Use-o para o que realmente importa! ⏰✨",
    "Seus gatos agradecem o tempo extra com você! 🐾",
    "Pedalando rumo à produtividade! 🚲💨",
    "Vegana, ciclista e agora mais produtiva! 💪🌱",
    "Menos trabalho manual, mais tempo para viver! 🌟"
  ];

  const getRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    return motivationalMessages[randomIndex];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (extractionMode === 'automatic' && !url.trim()) {
      setError('Por favor, insira uma URL válida');
      return;
    }

    if (extractionMode === 'manual') {
      if (images.length === 0) {
        setError('Por favor, adicione pelo menos uma imagem');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (extractionMode === 'automatic') {
        if (editMode) {
          // Novo fluxo: extrair conteúdo para edição
          const response = await fetch('http://localhost:3000/extract-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao extrair conteúdo');
          }

          const article = await response.json();
          setExtractedArticle({ ...article, url });
          setEditedContent(article.content);
        } else {
          // Fluxo direto sem edição
          const response = await fetch('http://localhost:3000/generate-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              url,
              customerPath: selectedCustomer || null
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao gerar PDF');
          }

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          setPdfUrl(blobUrl);
          setMotivationalMessage(getRandomMessage());
          setUrl('');
        }
      } else {
        // Fluxo manual com upload de imagens
        const formData = new FormData();
        formData.append('url', url);
        formData.append('title', manualTitle);
        formData.append('customerPath', selectedCustomer || '');
        
        images.forEach((image, index) => {
          formData.append('images', image.file);
        });

        const response = await fetch('http://localhost:3000/generate-pdf-manual', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao gerar PDF');
        }

        const blob = await response.blob();
        setManualTitle('');
        const blobUrl = window.URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        setMotivationalMessage(getRandomMessage());

        // Limpar imagens após sucesso
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
        setUrl('');
      }
    } catch (err) {
      setError(err.message || 'Erro ao processar a notícia');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdfFromEditor = async () => {
    if (!extractedArticle || !editedContent) {
      setError('Nenhum conteúdo disponível para gerar PDF');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/generate-pdf-from-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
          title: extractedArticle.title,
          byline: extractedArticle.byline,
          publishedDate: extractedArticle.publishedDate,
          siteName: extractedArticle.siteName,
          url: extractedArticle.url,
          customerPath: selectedCustomer || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar PDF');
      }

      // Pegar nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      console.log('Content-Disposition header:', contentDisposition);
      
      let filename = 'article.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      console.log('Filename extraído:', filename);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      setPdfUrl(blobUrl);
      
      // Armazenar nome do arquivo para uso no download
      setPdfFilename(filename);
      
      setMotivationalMessage(getRandomMessage());
      
      // Limpar estado do editor
      setExtractedArticle(null);
      setEditedContent('');
      setUrl('');
    } catch (err) {
      setError(err.message || 'Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setExtractedArticle(null);
    setEditedContent('');
    setLoading(false);
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfFilename || 'noticia.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Recarregar a página após 1 segundo
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleClose = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl('');
    setMotivationalMessage('');
  };

  if (currentPage === 'customers') {
    return <CustomerManager onBack={() => setCurrentPage('pdf')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl p-8 w-full ${extractedArticle ? 'max-w-6xl' : 'max-w-2xl'} transition-all duration-300`}>
        {/* Navigation */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setCurrentPage('customers')}
            className="text-blue-600 hover:text-blue-800 font-medium transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Gerenciar Clientes
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚲 Ale2PDF 🌱
          </h1>
          <p className="text-gray-600">
            Transforme notícias em PDF e ganhe tempo para o que importa!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
              Cliente (opcional)
            </label>
            <select
              id="customer"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              disabled={loading}
            >
              <option value="">Sem cliente (sem header/footer)</option>
              {customers.map((customer, index) => (
                <option key={index} value={customer.path}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Modo de Extração */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Modo de Extração
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="automatic"
                  checked={extractionMode === 'automatic'}
                  onChange={(e) => setExtractionMode(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  🤖 Automático
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="manual"
                  checked={extractionMode === 'manual'}
                  onChange={(e) => setExtractionMode(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">
                  📸 Manual 
                </span>
              </label>
            </div>
          </div>

          {/* Toggle para modo de edição (apenas no automático) */}
          {extractionMode === 'automatic' && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="editMode"
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                disabled={loading}
              />
              <label htmlFor="editMode" className="text-sm font-medium text-gray-700 cursor-pointer">
                ✏️ Permitir edição do conteúdo antes de gerar PDF
              </label>
            </div>
          )}

          {/* Título da Notícia (apenas no modo manual) */}
          {extractionMode === 'manual' && (
            <div>
              <label htmlFor="manualTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Título da Notícia (opcional)
              </label>
              <input
                type="text"
                id="manualTitle"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Digite o título da notícia..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                disabled={loading}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              URL da Notícia (fonte original)
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://g1.globo.com/tecnologia/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
              disabled={loading}
            />
          </div>

          {/* Upload de Imagens (apenas no modo manual) */}
          {extractionMode === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens da Notícia
              </label>
              <ImageUploader images={images} onImagesChange={setImages} />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {editMode ? 'Extraindo conteúdo...' : 'Gerando PDF...'}
              </span>
            ) : (
              editMode ? '✏️ Extrair e Editar' : '📄 Gerar PDF'
            )}
          </button>
        </form>

        {/* Editor de Conteúdo */}
        {extractedArticle && (
          <div className="mt-8 border-t pt-8">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                ✏️ Editar Conteúdo
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleGeneratePdfFromEditor}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {loading ? 'Gerando...' : '📄 Gerar PDF'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  ✖️ Cancelar
                </button>
              </div>
            </div>
            <ArticleEditor
              initialContent={extractedArticle.content}
              onContentChange={setEditedContent}
              articleMetadata={{
                title: extractedArticle.title,
                byline: extractedArticle.byline,
                publishedDate: extractedArticle.publishedDate
              }}
              onMetadataChange={(newMetadata) => setExtractedArticle({ ...extractedArticle, ...newMetadata })}
            />
          </div>
        )}

        {pdfUrl && (
          <div className="mt-6 border-t pt-6">
            {motivationalMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 text-center font-medium">
                {motivationalMessage}
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                📄 Visualização do PDF
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  ⬇️ Baixar PDF
                </button>
                <button
                  onClick={handleClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  ✖️ Fechar
                </button>
              </div>
            </div>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              <iframe
                src={pdfUrl}
                className="w-full h-[600px]"
                title="Visualização do PDF"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
