import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { chromium } from 'playwright';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Configurar multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Template HTML para o PDF
function createPDFTemplate(article) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.8;
      color: #333;
      background: #fff;
      padding: 20px 40px;
    }
    
    .article-header {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    
    h1 {
      font-size: 36px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    
    .metadata {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: #64748b;
      margin-top: 12px;
    }
    
    .metadata span {
      display: inline-block;
    }
    
    .byline {
      font-style: italic;
      color: #475569;
      margin-bottom: 8px;
    }
    
    .excerpt {
      font-size: 18px;
      color: #475569;
      margin-bottom: 30px;
      font-weight: 500;
      line-height: 1.6;
    }
    
    article img {
      width: 100%;
      height: auto;
      margin: 30px 0;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    article p {
      margin-bottom: 20px;
      font-size: 16px;
      text-align: justify;
    }
    
    article h2 {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 40px;
      margin-bottom: 16px;
    }
    
    article h3 {
      font-size: 20px;
      font-weight: 600;
      color: #334155;
      margin-top: 30px;
      margin-bottom: 12px;
    }
    
    article ul, article ol {
      margin: 20px 0;
      padding-left: 30px;
    }
    
    article li {
      margin-bottom: 10px;
    }
    
    article blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 20px;
      margin: 30px 0;
      font-style: italic;
      color: #475569;
    }
    
    article a {
      color: #2563eb;
      text-decoration: none;
      border-bottom: 1px solid #93c5fd;
    }
    
    article a:hover {
      border-bottom-color: #2563eb;
    }
    
    .article-footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      font-size: 14px;
      color: #64748b;
      text-align: center;
    }
    
    .source-link {
      display: block;
      margin-top: 10px;
      word-break: break-all;
    }
    
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
    <header class="article-header">
      <h1>${article.title}</h1>
      ${article.byline ? `<p class="byline">Por ${article.byline}</p>` : ''}
    </header>
    
    ${article.excerpt ? `<div class="excerpt">${article.excerpt}</div>` : ''}
    
    <article>
      ${article.content}
    </article>
    
    <footer class="article-footer">
      <p><strong>Fonte original:</strong></p>
      <a href="${article.siteName || 'Fonte'}" class="source-link">${article.siteName || 'Link da notícia'}</a>
    </footer>
</body>
</html>
  `.trim();
}

// Endpoint para gerar PDF
app.post('/generate-pdf', async (req, res) => {
  const { url, customerPath } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  try {
    // Carregar imagens do cliente, se fornecido
    let headerImage = null;
    let footerImage = null;
    
    if (customerPath) {
      try {
        const headerPath = path.join(__dirname, '../frontend/public', customerPath, 'header.png');
        const footerPath = path.join(__dirname, '../frontend/public', customerPath, 'footer.png');
        
        const headerBuffer = await fs.readFile(headerPath);
        const footerBuffer = await fs.readFile(footerPath);
        
        headerImage = `data:image/png;base64,${headerBuffer.toString('base64')}`;
        footerImage = `data:image/png;base64,${footerBuffer.toString('base64')}`;
        
        console.log('Imagens do cliente carregadas:', customerPath);
      } catch (error) {
        console.error('Erro ao carregar imagens do cliente:', error.message);
      }
    }
    
    // 1. Baixar o HTML da página
    console.log(`Baixando página: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    // 2. Processar com Readability
    console.log('Extraindo conteúdo com Readability...');
    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return res.status(400).json({ 
        error: 'Não foi possível processar a notícia. Verifique se a URL é válida.' 
      });
    }

    // Adicionar informações extras
    article.siteName = url;

    // 3. Criar HTML do PDF
    const htmlContent = createPDFTemplate(article);

    // 4. Gerar PDF com Playwright
    console.log('Gerando PDF com Playwright...');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle' 
    });

    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: headerImage ? '85px' : '20mm',
        bottom: footerImage ? '65px' : '20mm',
        left: '20mm',
        right: '20mm'
      }
    };

    if (headerImage || footerImage) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = headerImage 
        ? `<div style="font-size: 0; line-height: 0; margin: 0; padding: 0; width: 210mm; margin-left: 0mm; margin-top: -5mm;"><img src="${headerImage}" style="width: 210mm; height: auto; display: block; margin: 0; padding: 0;"/></div>`
        : '<div></div>';
      pdfOptions.footerTemplate = footerImage 
        ? `<div style="font-size: 0; line-height: 0; margin: 0; padding: 0; width: 210mm; margin-left: 0mm; margin-bottom: -5mm"><img src="${footerImage}" style="width: 210mm; height: auto; display: block; margin: 0; padding: 0;"/></div>`
        : '<div></div>';
    }

    const pdfBuffer = await page.pdf(pdfOptions);

    await browser.close();

    // 5. Enviar PDF
    console.log('PDF gerado com sucesso!');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=noticia.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(400).json({ 
        error: 'Não foi possível acessar a URL fornecida' 
      });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Página não encontrada' 
      });
    }

    res.status(500).json({ 
      error: 'Erro ao processar a notícia. Tente novamente.' 
    });
  }
});

// Rota para adicionar cliente
app.post('/api/customers', upload.fields([
  { name: 'header', maxCount: 1 },
  { name: 'footer', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Recebendo requisição para criar cliente');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const { name, path: customerPath } = req.body;
    const headerFile = req.files['header']?.[0];
    const footerFile = req.files['footer']?.[0];

    if (!name || !customerPath || !headerFile || !footerFile) {
      console.log('Dados incompletos:', { name, customerPath, hasHeader: !!headerFile, hasFooter: !!footerFile });
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    console.log('Criando cliente:', { name, customerPath });

    // Criar diretório do cliente
    const customerDir = path.join(__dirname, '../frontend/public', customerPath);
    await fs.mkdir(customerDir, { recursive: true });

    // Salvar imagens
    const headerPath = path.join(customerDir, 'header.png');
    const footerPath = path.join(customerDir, 'footer.png');
    
    await fs.writeFile(headerPath, headerFile.buffer);
    await fs.writeFile(footerPath, footerFile.buffer);

    // Ler customers.json
    const customersFilePath = path.join(__dirname, '../frontend/public/customers/customers.json');
    let customers = [];
    
    try {
      const data = await fs.readFile(customersFilePath, 'utf-8');
      customers = JSON.parse(data);
    } catch (error) {
      // Se o arquivo não existir, começar com array vazio
      console.log('Criando novo arquivo customers.json');
    }

    // Adicionar novo cliente
    const newCustomer = {
      path: customerPath,
      name: name,
      footer: `${customerPath}/footer.png`,
      header: `${customerPath}/header.png`
    };

    customers.push(newCustomer);

    // Salvar customers.json atualizado
    await fs.writeFile(customersFilePath, JSON.stringify(customers, null, 4), 'utf-8');
    
    console.log('Cliente salvo com sucesso:', newCustomer);
    console.log('Arquivo customers.json atualizado');

    res.json({ success: true, customer: newCustomer });
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Erro ao salvar cliente: ' + error.message });
  }
});

// Rota para remover cliente
app.delete('/api/customers/:customerPath(*)', async (req, res) => {
  try {
    const customerPath = '/' + req.params.customerPath;
    console.log('Removendo cliente:', customerPath);

    // Ler customers.json
    const customersFilePath = path.join(__dirname, '../frontend/public/customers/customers.json');
    let customers = [];
    
    try {
      const data = await fs.readFile(customersFilePath, 'utf-8');
      customers = JSON.parse(data);
    } catch (error) {
      return res.status(404).json({ error: 'Arquivo customers.json não encontrado' });
    }

    // Encontrar o cliente
    const customerIndex = customers.findIndex(c => c.path === customerPath);
    
    if (customerIndex === -1) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Remover diretório do cliente
    const customerDir = path.join(__dirname, '../frontend/public', customerPath);
    try {
      await fs.rm(customerDir, { recursive: true, force: true });
      console.log('Diretório removido:', customerDir);
    } catch (error) {
      console.error('Erro ao remover diretório:', error);
    }

    // Remover do array
    customers.splice(customerIndex, 1);

    // Salvar customers.json atualizado
    await fs.writeFile(customersFilePath, JSON.stringify(customers, null, 4), 'utf-8');
    
    console.log('Cliente removido com sucesso');

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover cliente:', error);
    res.status(500).json({ error: 'Erro ao remover cliente: ' + error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📄 Endpoint disponível: POST /generate-pdf`);
  console.log(`👥 Endpoint disponível: POST /api/customers`);
  console.log(`🗑️  Endpoint disponível: DELETE /api/customers/:path`);
});
