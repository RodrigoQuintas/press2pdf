import { useState, useEffect } from 'react';
import CustomerManager from './components/CustomerManager';

function App() {
  const [currentPage, setCurrentPage] = useState('pdf'); // 'pdf' or 'customers'
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
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
    
    if (!url.trim()) {
      setError('Por favor, insira uma URL válida');
      return;
    }

    setLoading(true);
    setError('');

    try {
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

      // Converter resposta em blob
      const blob = await response.blob();
      
      // Criar URL temporária para visualização
      const blobUrl = window.URL.createObjectURL(blob);
      setPdfUrl(blobUrl);
      setMotivationalMessage(getRandomMessage());

      setUrl('');
    } catch (err) {
      setError(err.message || 'Erro ao processar a notícia');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'noticia.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
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
          
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              URL da Notícia
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
                Gerando PDF...
              </span>
            ) : (
              'Gerar PDF'
            )}
          </button>
        </form>

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
