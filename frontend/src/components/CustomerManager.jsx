import { useState, useEffect } from 'react';
import ImageCropper from './ImageCropper';

const CustomerManager = ({ onBack }) => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [headerImage, setHeaderImage] = useState(null);
  const [footerImage, setFooterImage] = useState(null);
  const [headerPreview, setHeaderPreview] = useState(null);
  const [footerPreview, setFooterPreview] = useState(null);
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    image: null,
    type: null, // 'header' or 'footer'
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deletingPath, setDeletingPath] = useState(null);

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

  // Função para gerar slug a partir do nome
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gerar path automaticamente baseado no nome
  const customerPath = formData.name ? `/customers/${generateSlug(formData.name)}` : '';

  const handleImageSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperState({
          isOpen: true,
          image: reader.result,
          type: type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageBlob) => {
    const { type } = cropperState;
    
    if (type === 'header') {
      setHeaderImage(croppedImageBlob);
      setHeaderPreview(URL.createObjectURL(croppedImageBlob));
    } else {
      setFooterImage(croppedImageBlob);
      setFooterPreview(URL.createObjectURL(croppedImageBlob));
    }
    
    setCropperState({ isOpen: false, image: null, type: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      setMessage({ type: 'error', text: 'Por favor, preencha o nome do cliente' });
      return;
    }

    if (!headerImage || !footerImage) {
      setMessage({ type: 'error', text: 'Por favor, adicione as imagens de header e footer' });
      return;
    }

    try {
      console.log('Enviando dados:', { name: formData.name, path: customerPath });
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('path', customerPath);
      formDataToSend.append('header', headerImage, 'header.png');
      formDataToSend.append('footer', footerImage, 'footer.png');

      const response = await fetch('http://localhost:3000/api/customers', {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro do servidor:', errorData);
        throw new Error(errorData.error || 'Erro ao salvar cliente');
      }

      const result = await response.json();
      console.log('Cliente salvo com sucesso:', result);

      setMessage({ type: 'success', text: 'Cliente adicionado com sucesso!' });
      
      // Limpar formulário
      setFormData({ name: '' });
      setHeaderImage(null);
      setFooterImage(null);
      setHeaderPreview(null);
      setFooterPreview(null);
      
      // Recarregar lista de clientes após um pequeno delay para garantir que os arquivos foram salvos
      setTimeout(() => {
        loadCustomers();
      }, 500);
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDelete = async (customerPath) => {
    if (!window.confirm(`Tem certeza que deseja remover o cliente "${customerPath}"?`)) {
      return;
    }

    setDeletingPath(customerPath);

    try {
      const encodedPath = encodeURIComponent(customerPath.substring(1)); // Remove leading /
      const response = await fetch(`http://localhost:3000/api/customers/${encodedPath}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover cliente');
      }

      setMessage({ type: 'success', text: 'Cliente removido com sucesso!' });
      
      // Recarregar lista de clientes
      setTimeout(() => {
        loadCustomers();
      }, 300);
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setDeletingPath(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Gerenciamento de Clientes
          </h1>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 font-medium transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para PDF
          </button>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Formulário de Cadastro */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">
            Adicionar Novo Cliente
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cliente *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Cliente ABC"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Path do Cliente (gerado automaticamente)
              </label>
              <input
                type="text"
                name="path"
                value={customerPath}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">
                O path é gerado automaticamente baseado no nome
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Header Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Header * (2480 × 250)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, 'header')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {headerPreview && (
                  <div className="mt-3">
                    <img
                      src={headerPreview}
                      alt="Preview do Header"
                      className="w-full border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-green-600 mt-1">✓ Header pronto</p>
                  </div>
                )}
              </div>

              {/* Footer Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Footer * (2480 × 180)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, 'footer')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {footerPreview && (
                  <div className="mt-3">
                    <img
                      src={footerPreview}
                      alt="Preview do Footer"
                      className="w-full border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-green-600 mt-1">✓ Footer pronto</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-semibold text-lg shadow-md"
            >
              Adicionar Cliente
            </button>
          </form>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">
            Clientes Cadastrados
          </h2>

          {customers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum cliente cadastrado ainda
            </p>
          ) : (
            <div className="space-y-4">
              {customers.map((customer, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-gray-600">{customer.path}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(customer.path)}
                      disabled={deletingPath === customer.path}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Remover cliente"
                    >
                      {deletingPath === customer.path ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Removendo...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remover
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Header</p>
                      <img
                        src={`${customer.header}?t=${Date.now()}`}
                        alt={`${customer.name} header`}
                        className="w-full border border-gray-200 rounded"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Footer</p>
                      <img
                        src={`${customer.footer}?t=${Date.now()}`}
                        alt={`${customer.name} footer`}
                        className="w-full border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Cropper Modal */}
      {cropperState.isOpen && (
        <ImageCropper
          image={cropperState.image}
          aspectRatio={cropperState.type === 'header' ? 2480 / 250 : 2480 / 180}
          targetWidth={2480}
          targetHeight={cropperState.type === 'header' ? 250 : 180}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperState({ isOpen: false, image: null, type: null })}
        />
      )}
    </div>
  );
};

export default CustomerManager;
