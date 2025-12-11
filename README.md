# 📰 Press2PDF

Aplicação completa para converter notícias da web em PDFs formatados e limpos.

## 🎯 Características

- Interface React moderna com Tailwind CSS
- Extração inteligente de conteúdo com Mozilla Readability
- Geração de PDF com Playwright
- Suporte para sites de notícias brasileiros e internacionais
- Template de PDF profissional e responsivo
- Tratamento robusto de erros

## 🏗️ Estrutura do Projeto

```
press2pdf/
├── frontend/          # Aplicação React (Vite + Tailwind)
├── server/            # Backend Node.js (Express + Playwright)
└── package.json       # Configuração de workspaces
```

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará todas as dependências do frontend e do backend automaticamente.

### 2. Instalar Navegadores do Playwright

```bash
npm run playwright:install --workspace server
```

Ou:

```bash
cd server && npx playwright install chromium
```

### 3. Iniciar o Projeto

```bash
npm start
```

Isso iniciará:
- Frontend em `http://localhost:5173`
- Backend em `http://localhost:3000`

### 4. Usar a Aplicação

1. Acesse `http://localhost:5173` no navegador
2. Cole a URL de uma notícia (ex: G1, UOL, Folha, BBC, etc.)
3. Clique em "Gerar PDF"
4. O PDF será baixado automaticamente

## 📦 Tecnologias Utilizadas

### Frontend
- React 18
- Vite
- Tailwind CSS
- Fetch API

### Backend
- Node.js (ES Modules)
- Express
- Playwright (geração de PDF)
- Mozilla Readability (extração de conteúdo)
- JSDOM (parsing HTML)
- Axios (requisições HTTP)

## 🔧 Scripts Disponíveis

### Projeto Raiz
- `npm start` - Inicia frontend e backend simultaneamente
- `npm run dev` - Alias para start
- `npm run build` - Faz build do frontend

### Frontend
- `npm run dev --workspace frontend` - Inicia apenas o frontend
- `npm run build --workspace frontend` - Build de produção

### Backend
- `npm run start --workspace server` - Inicia o servidor
- `npm run dev --workspace server` - Inicia com hot reload

## 🌐 Sites Suportados

A aplicação funciona com qualquer site que tenha conteúdo estruturado:

- G1
- UOL
- Folha de S.Paulo
- Estadão
- BBC Brasil
- Terra
- Band
- E muitos outros!

## 📄 API do Backend

### POST /generate-pdf

Gera um PDF a partir de uma URL de notícia.

**Body:**
```json
{
  "url": "https://g1.globo.com/tecnologia/noticia/..."
}
```

**Response:** 
- Status 200: Retorna o PDF como `application/pdf`
- Status 400: Erro na URL ou processamento
- Status 500: Erro interno do servidor

### GET /health

Verifica se o servidor está rodando.

**Response:**
```json
{
  "status": "ok",
  "message": "Servidor rodando!"
}
```

## 🎨 Personalização

### Modificar o Template do PDF

Edite a função `createPDFTemplate()` em `server/index.js` para alterar:
- Estilos CSS
- Layout
- Cores
- Fontes
- Margens

### Ajustar Configurações do PDF

Na função `page.pdf()` em `server/index.js`, você pode modificar:
- Formato (A4, Letter, etc.)
- Margens
- Orientação (portrait/landscape)
- Background

## ⚠️ Solução de Problemas

### Erro: "Playwright not installed"

Execute:
```bash
cd server && npx playwright install chromium
```

### Erro: "CORS"

Certifique-se de que o backend está rodando em `http://localhost:3000` e o frontend em `http://localhost:5173`.

### Erro: "Não foi possível processar a notícia"

Algumas páginas podem ter estruturas muito complexas ou proteções anti-scraping. Tente com outras fontes de notícias.

### Frontend não conecta ao Backend

Verifique se ambos os servidores estão rodando. Use `npm start` na raiz do projeto.

## 📝 Notas de Desenvolvimento

- O backend usa ES Modules (`"type": "module"` no package.json)
- O Playwright baixa automaticamente o Chromium na primeira instalação
- O Readability funciona melhor com artigos jornalísticos estruturados
- O PDF é gerado no servidor, não no browser

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas!

## 📄 Licença

MIT

---

Desenvolvido com ❤️ para facilitar a leitura offline de notícias
