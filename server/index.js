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
    
    /* Esconder elementos vazios */
    article p:empty,
    article div:empty,
    article section:empty,
    article figure:empty,
    article picture:empty,
    img[src=""],
    img:not([src]) {
      display: none !important;
      margin: 0 !important;
      padding: 0 !important;
      height: 0 !important;
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
      ${article.publishedDate ? `<div class="metadata"><span>📅 ${article.publishedDate}</span></div>` : ''}
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

// Função auxiliar para extrair data de publicação
function extractPublicationDate(dom) {
  const document = dom.window.document;
  
  // Tentar múltiplos métodos de extração de data
  
  // 1. Meta tags comuns
  const metaSelectors = [
    'meta[property="article:published_time"]',
    'meta[property="og:published_time"]',
    'meta[name="publish_date"]',
    'meta[name="pubdate"]',
    'meta[name="date"]',
    'meta[property="datePublished"]'
  ];
  
  for (const selector of metaSelectors) {
    const meta = document.querySelector(selector);
    if (meta && meta.content) {
      console.log(`Data encontrada via ${selector}:`, meta.content);
      return formatDate(meta.content);
    }
  }
  
  // 2. JSON-LD (Schema.org)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      const date = data.datePublished || data.publishedDate;
      if (date) {
        console.log('Data encontrada via JSON-LD:', date);
        return formatDate(date);
      }
    } catch (e) {
      // Ignorar erros de parse
    }
  }
  
  // 3. Seletores específicos comuns em sites de notícias
  const dateSelectors = [
    'time[datetime]',
    '.entry-date',
    '.post-date',
    '.published',
    '.date',
    '.article-date',
    '[class*="date"]',
    '[class*="time"]'
  ];
  
  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const datetime = element.getAttribute('datetime') || element.textContent;
      if (datetime && datetime.trim()) {
        console.log(`Data encontrada via seletor ${selector}:`, datetime);
        return formatDate(datetime);
      }
    }
  }
  
  console.log('Data de publicação não encontrada');
  return null;
}

// Função para formatar data
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Tentar parsear formatos brasileiros (dd/mm/yyyy)
      const parts = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (parts) {
        return `${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}/${parts[3]}`;
      }
      return dateString.trim();
    }
    
    // Formatar para pt-BR
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

// Função auxiliar para extrair imagens do artigo
function extractArticleImages(dom, baseUrl) {
  const document = dom.window.document;
  const images = [];
  const seenUrls = new Set();
  
  // Selecionar imagens do conteúdo principal - ordem de prioridade
  const contentSelectors = [
    // Imagens destacadas e principais
    'figure.post-thumbnail img',
    '.post-thumbnail img',
    'figure img',
    '.featured-image img',
    '.wp-post-image',
    // Conteúdo do artigo
    'article img',
    '.entry-content img',
    '.post-content img',
    '.article-content img',
    '.content img',
    'main img',
    '.post img',
    '[class*="content"] img',
    '[class*="article"] img',
    '[class*="post"] img',
    'img' // Fallback para todas as imagens
  ];
  
  for (const selector of contentSelectors) {
    const imgElements = document.querySelectorAll(selector);
    console.log(`Testando seletor '${selector}': ${imgElements.length} imagens encontradas`);
    
    imgElements.forEach(img => {
      // Tentar múltiplos atributos para obter a URL da imagem em ALTA QUALIDADE
      let imgUrl = null;
      console.log(`Processando imagem com classes: ${img.className}`);
      
      // 1. Verificar se o src já é uma imagem de boa qualidade
      const srcUrl = img.src || img.getAttribute('src');
      
      // 2. Verificar srcset para imagens de maior resolução
      const srcsetStr = img.srcset || img.getAttribute('srcset') || img.getAttribute('data-srcset');
      let srcsetUrl = null;
      
      if (srcsetStr) {
        console.log(`srcset encontrado: ${srcsetStr}`);
        const srcsetParts = srcsetStr.split(',').map(s => s.trim());
        let maxWidth = 0;
        
        srcsetParts.forEach(part => {
          const match = part.match(/^(.+?)\s+(\d+)w?/);
          if (match) {
            const [, url, widthStr] = match;
            const width = parseInt(widthStr);
            if (width > maxWidth) {
              maxWidth = width;
              srcsetUrl = url.trim();
            }
          }
        });
        
        if (srcsetUrl) {
          console.log(`Melhor imagem do srcset: ${srcsetUrl} (${maxWidth}w)`);
        }
      }
      
      // 3. Priorizar srcset se encontrou, senão usar src
      imgUrl = srcsetUrl || srcUrl;
      
      // 4. Fallback para atributos de alta resolução
      if (!imgUrl) {
        imgUrl = img.getAttribute('data-full-url') ||
                 img.getAttribute('data-large-file') ||
                 img.getAttribute('data-original-src') ||
                 img.getAttribute('data-hires') ||
                 img.getAttribute('data-full-src') ||
                 img.getAttribute('data-src') || 
                 img.getAttribute('data-lazy-src') ||
                 img.getAttribute('data-original');
      }
      
      if (!imgUrl) {
        console.log('⚠️ Nenhuma URL encontrada para esta imagem');
        return;
      }
      
      if (imgUrl && !seenUrls.has(imgUrl)) {
        // Limpar parâmetros de query desnecessários às vezes
        try {
          // Converter URL relativa para absoluta
          if (imgUrl.startsWith('//')) {
            imgUrl = 'https:' + imgUrl;
          } else if (imgUrl.startsWith('/')) {
            const urlObj = new URL(baseUrl);
            imgUrl = `${urlObj.protocol}//${urlObj.host}${imgUrl}`;
          } else if (!imgUrl.startsWith('http')) {
            imgUrl = new URL(imgUrl, baseUrl).href;
          }
          
          // Filtrar URLs inválidas ou de tracking
          if (imgUrl.includes('data:image') || 
              imgUrl.includes('tracking') || 
              imgUrl.includes('pixel') ||
              imgUrl.includes('spacer.gif') ||
              imgUrl.includes('blank.gif')) {
            console.log(`URL inválida/tracking filtrada: ${imgUrl}`);
            return;
          }
          
          console.log(`URL da imagem extraída: ${imgUrl}`);
          
          // Filtrar imagens muito pequenas (provavelmente ícones) - APENAS se ambas dimensões forem explicitamente definidas e pequenas
          const widthAttr = img.getAttribute('width');
          const heightAttr = img.getAttribute('height');
          
          if (widthAttr && heightAttr) {
            const width = parseInt(widthAttr);
            const height = parseInt(heightAttr);
            
            if ((width < 80 && height < 80) && width > 0 && height > 0) {
              console.log(`Imagem muito pequena ignorada (atributos): ${width}x${height} - ${imgUrl}`);
              return;
            }
          }
          
          // Verificar se a imagem não é um logo ou ícone pelo nome
          const lowerUrl = imgUrl.toLowerCase();
          const lowerAlt = (img.getAttribute('alt') || '').toLowerCase();
          const lowerClass = (img.getAttribute('class') || '').toLowerCase();
          const lowerSrc = (img.src || '').toLowerCase();
          
          // Filtrar apenas logos/ícones/banners MUITO ESPECÍFICOS que não sejam conteúdo da notícia
          // Usar padrões mais restritivos para evitar falsos positivos
          const isDefinitelyNotContent = (
            // URLs com padrões muito específicos de não-conteúdo
            lowerUrl.match(/\/(logo|icon|avatar|emoji)s?\./) || // logo.png, icons.jpg
            lowerUrl.includes('/logo/') ||
            lowerUrl.includes('/icon/') ||
            lowerUrl.includes('/widget/') ||
            lowerUrl.includes('/ads/') ||
            lowerUrl.includes('/ad-') ||
            lowerUrl.includes('spacer.') ||
            lowerUrl.includes('blank.') ||
            // Classes muito específicas de widgets/banners
            lowerClass.match(/\b(logo-|icon-|widget-|banner-|ad-|sidebar-)/) ||
            // Alt text que indica claramente publicidade (não apenas "banner" que pode estar em imagem de notícia)
            lowerAlt.match(/\b(publicidade|anúncio|propaganda|advertisement)\b/)
          );
          
          if (isDefinitelyNotContent) {
            console.log(`Imagem de logo/ícone/banner ignorada: ${imgUrl}`);
            return;
          }
          
          seenUrls.add(imgUrl);
          images.push(imgUrl);
          console.log(`✅ Imagem ACEITA e adicionada: ${imgUrl}`);
        } catch (e) {
          console.error(`❌ Erro ao processar URL da imagem: ${imgUrl}`, e.message);
        }
      }
    });
    
    if (images.length > 0) {
      console.log(`${images.length} imagens encontradas usando seletor: ${selector}`);
      break; // Se encontrou imagens, não precisa procurar em outros seletores
    }
  }
  
  console.log(`Total de ${images.length} imagens extraídas`);
  return images;
}

// Função auxiliar para baixar imagens e converter para base64
async function downloadAndConvertImages(imageUrls) {
  const imageDataUrls = [];
  
  for (const url of imageUrls) {
    try {
      console.log(`Baixando imagem: ${url}`);
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': url,
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      });
      
      const contentType = response.headers['content-type'];
      const base64 = Buffer.from(response.data).toString('base64');
      imageDataUrls.push(`data:${contentType};base64,${base64}`);
      console.log('Imagem baixada com sucesso');
    } catch (error) {
      console.error(`Erro ao baixar imagem ${url}:`, error.message);
    }
  }
  
  return imageDataUrls;
}

// Função auxiliar para carregar header e footer do cliente
async function loadCustomerImages(customerPath) {
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
  
  return { headerImage, footerImage };
}

// Endpoint para gerar PDF (modo automático)
app.post('/generate-pdf', async (req, res) => {
  const { url, customerPath } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  try {
    // Carregar imagens do cliente, se fornecido
    const { headerImage, footerImage } = await loadCustomerImages(customerPath);
    
    // 1. Usar Playwright para carregar a página com JavaScript habilitado
    console.log(`Carregando página com Playwright: ${url}`);
    const browser = await chromium.launch();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    // Navegar para a página
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 45000 
      });
    } catch (error) {
      // Se networkidle falhar, tentar com 'load' apenas
      console.log('Networkidle timeout, tentando com estratégia "load"...');
      await page.goto(url, { 
        waitUntil: 'load',
        timeout: 30000 
      });
    }
    
    // Esperar um pouco mais para garantir que imagens lazy-load sejam carregadas
    console.log('Aguardando carregamento completo das imagens...');
    await page.waitForTimeout(3000);
    
    // Scroll na página para forçar lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // Remover apenas seções MUITO ESPECÍFICAS que são definitivamente não-conteúdo
    await page.evaluate(() => {
      const selectorsToRemove = [
        'section.whatsapp-groups',
        'section.virals',
        '.newsletter-signup',
        '.social-share-buttons',
        'aside.advertisement'
      ];
      
      selectorsToRemove.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            console.log('Removendo:', selector);
            el.remove();
          });
        } catch (e) {
          // Ignorar erros de seletores inválidos
        }
      });
    });
    
    // Pegar o HTML completo após JavaScript executar e remover elementos
    const htmlContent = await page.content();
    await browser.close();
    
    // 2. Processar com Readability
    console.log('Extraindo conteúdo com Readability...');
    const dom = new JSDOM(htmlContent, { url });
    
    // Remover seções indesejadas após processar com Playwright
    const document = dom.window.document;
    const unwantedSelectors = [
      'section.whatsapp-groups',
      'section.virals'
    ];
    
    unwantedSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          console.log(`Removendo elemento indesejado: ${selector}`);
          el.remove();
        });
      } catch (e) {
        // Ignorar erros de seletores
      }
    });
    
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return res.status(400).json({ 
        error: 'Não foi possível processar a notícia. Verifique se a URL é válida.' 
      });
    }

    // Extrair data de publicação
    const publishedDate = extractPublicationDate(dom);
    if (publishedDate) {
      article.publishedDate = publishedDate;
    }

    // Extrair imagens adicionais do artigo
    const imageUrls = extractArticleImages(dom, url);
    console.log(`Imagens a serem baixadas: ${imageUrls.length}`);
    
    if (imageUrls.length > 0) {
      console.log('Baixando imagens adicionais...');
      const additionalImages = await downloadAndConvertImages(imageUrls);
      console.log(`Imagens baixadas com sucesso: ${additionalImages.length}`);
      
      // SEMPRE adicionar as imagens baixadas, pois são as de maior qualidade
      if (additionalImages.length > 0) {
        const imagesHtml = additionalImages.map((dataUrl, index) => 
          `<img src="${dataUrl}" style="width: 100%; height: auto; margin: 30px 0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" alt="Imagem ${index + 1}" />`
        ).join('\n');
        
        // Adicionar após o primeiro parágrafo
        const firstParagraphEnd = article.content.indexOf('</p>');
        if (firstParagraphEnd > -1) {
          article.content = article.content.slice(0, firstParagraphEnd + 4) + '\n' + imagesHtml + '\n' + article.content.slice(firstParagraphEnd + 4);
        } else {
          article.content = imagesHtml + '\n' + article.content;
        }
        console.log(`${additionalImages.length} imagens adicionadas ao conteúdo`);
      }
    } else {
      console.log('Nenhuma imagem encontrada na página');
    }

    // Adicionar informações extras
    article.siteName = url;

    // Limpar espaços vazios e tags vazias do conteúdo de forma recursiva e agressiva
    let cleanedContent = article.content;
    let previousLength = 0;
    
    // Loop até não haver mais mudanças (remove elementos vazios aninhados)
    while (cleanedContent.length !== previousLength) {
      previousLength = cleanedContent.length;
      cleanedContent = cleanedContent
        // Remove imagens sem src ou com src vazio/inválido
        .replace(/<img[^>]*src=""[^>]*>/gi, '')
        .replace(/<img[^>]*src=''[^>]*>/gi, '')
        .replace(/<img(?![^>]*src=)[^>]*>/gi, '')
        // Remove iframes e noscript
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<noscript[^>]*>.*?<\/noscript>/gi, '')
        // Remove tags vazias (incluindo com espaços, &nbsp;, quebras de linha)
        .replace(/<(p|div|section|figure|picture|span|article|header|footer|aside|nav|main)[^>]*>\s*(&nbsp;|\s|<br\s*\/?>)*\s*<\/\1>/gi, '')
        // Remove múltiplas tags <br> consecutivas
        .replace(/(<br\s*\/?\s*>\s*){3,}/gi, '<br><br>')
        // Remove múltiplas linhas em branco
        .replace(/\n\s*\n\s*\n+/g, '\n\n');
    }
    
    article.content = cleanedContent.trim();

    // 3. Criar HTML do PDF
    const htmlForPdf = createPDFTemplate(article);

    // 4. Gerar PDF com Playwright
    console.log('Gerando PDF com Playwright...');
    const browser2 = await chromium.launch();
    const pdfPage = await browser2.newPage();
    
    await pdfPage.setContent(htmlForPdf, { 
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

    const pdfBuffer = await pdfPage.pdf(pdfOptions);

    await browser2.close();

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
    
    if (error.response?.status === 403) {
      return res.status(403).json({ 
        error: 'Acesso negado pelo site. O site pode estar bloqueando requisições automáticas. Tente usar o modo manual.' 
      });
    }
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

// Endpoint para gerar PDF (modo manual com upload de imagens)
app.post('/generate-pdf-manual', upload.array('images'), async (req, res) => {
  const { url, customerPath } = req.body;
  let { title } = req.body;
  const images = req.files;

  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Pelo menos uma imagem é necessária' });
  }

  // Se título não for fornecido, usar "Notícia" como padrão
  if (!title || !title.trim()) {
    title = 'Notícia';
  }

  try {
    console.log(`Gerando PDF manual com ${images.length} imagens`);
    
    // Carregar imagens do cliente, se fornecido
    const { headerImage, footerImage } = await loadCustomerImages(customerPath);

    // Converter imagens para base64
    const imageDataUrls = images.map(img => {
      const base64 = img.buffer.toString('base64');
      const mimeType = img.mimetype;
      return `data:${mimeType};base64,${base64}`;
    });

    // Criar HTML com as imagens
    const imagesHtml = imageDataUrls.map((dataUrl, index) => 
      `<img src="${dataUrl}" style="width: 100%; height: auto; margin: 30px 0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); display: block;" alt="Imagem ${index + 1}" />`
    ).join('\n');

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notícia</title>
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
      text-align: center;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    
    .images-container {
      margin: 40px 0;
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
      color: #2563eb;
      text-decoration: none;
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
      <h1>${title}</h1>
    </header>
    
    <div class="images-container">
      ${imagesHtml}
    </div>
    
    <footer class="article-footer">
      <p><strong>Fonte original:</strong></p>
      <a href="${url}" class="source-link">${url}</a>
    </footer>
</body>
</html>
    `.trim();

    // Gerar PDF com Playwright
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

    // Enviar PDF
    console.log('PDF gerado com sucesso!');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=noticia.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar PDF manual:', error.message);
    res.status(500).json({ 
      error: 'Erro ao processar as imagens. Tente novamente.' 
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
  console.log(`📄 Endpoint disponível: POST /generate-pdf (modo automático)`);
  console.log(`📸 Endpoint disponível: POST /generate-pdf-manual (modo manual)`);
  console.log(`👥 Endpoint disponível: POST /api/customers`);
  console.log(`🗑️  Endpoint disponível: DELETE /api/customers/:path`);
});
