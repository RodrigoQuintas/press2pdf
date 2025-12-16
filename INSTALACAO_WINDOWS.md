# 📦 Instalação no Windows - Press2PDF

Guia completo para instalar e executar a aplicação Press2PDF em um Windows sem nenhuma ferramenta instalada.

---

## 📋 Pré-requisitos

Você precisará instalar as seguintes ferramentas:

1. **Node.js** (inclui npm)
2. **Git** (opcional, mas recomendado)

---

## 🔧 Passo 1: Instalar Node.js

1. Acesse o site oficial: [https://nodejs.org/](https://nodejs.org/)
2. Baixe a versão **LTS (Long Term Support)** - recomendada
3. Execute o instalador baixado (`node-vXX.XX.X-x64.msi`)
4. Siga o assistente de instalação:
   - Aceite os termos de licença
   - Deixe o caminho padrão de instalação
   - **IMPORTANTE**: Marque a opção "Automatically install the necessary tools"
5. Clique em "Install" e aguarde
6. Clique em "Finish"

### Verificar instalação do Node.js

1. Abra o **Prompt de Comando** (CMD):
   - Pressione `Windows + R`
   - Digite `cmd` e pressione Enter

2. Digite os seguintes comandos para verificar:
   ```bash
   node --version
   npm --version
   ```

3. Se aparecer a versão (ex: `v20.11.0`), está instalado corretamente!

---

## ⚡ INÍCIO RÁPIDO (Usuário Final)

Se você já recebeu a pasta do projeto pronta, basta:

1. **Duplo clique no arquivo** `INICIAR-PRESS2PDF.bat`
2. Aguarde a aplicação abrir no navegador
3. **Pronto!** A aplicação está rodando

> ⚠️ **Importante**: NÃO feche a janela preta que aparece (Prompt de Comando). Quando quiser parar a aplicação, feche essa janela ou pressione `Ctrl+C` dentro dela.

---

## 📥 Passo 2: Baixar o projeto (Para Desenvolvedores)

### Opção A: Usando Git (Recomendado)

1. **Instalar Git**:
   - Acesse: [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - Baixe e instale com as configurações padrão

2. **Clonar o repositório**:
   - Abra o Prompt de Comando
   - Navegue até onde quer salvar (ex: `cd Desktop`)
   - Execute:
     ```bash
     git clone [URL_DO_REPOSITORIO]
     cd press2pdf
     ```

### Opção B: Download direto (Sem Git)

1. Baixe o arquivo ZIP do projeto
2. Extraia o conteúdo em uma pasta (ex: `C:\press2pdf`)
3. Abra o Prompt de Comando
4. Navegue até a pasta:
   ```bash
   cd C:\press2pdf
   ```

---

## ⚙️ Passo 3: Instalar dependências

Com o Prompt de Comando aberto na pasta do projeto:

```bash
npm install
```

Aguarde a instalação de todas as dependências (pode demorar alguns minutos).

---

## 🎭 Passo 4: Instalar Playwright Chromium

O Playwright é usado para gerar os PDFs. Instale-o com:

```bash
npm run playwright:install
```

Aguarde o download do navegador Chromium (aproximadamente 150MB).

---

## 🚀 Passo 5: Executar a aplicação

### Iniciar o servidor e frontend

```bash
npm start
```

Aguarde até ver as mensagens:
```
🚀 Servidor rodando em http://localhost:3000
➜  Local:   http://localhost:5173/
```

### Acessar a aplicação

Abra seu navegador e acesse: **http://localhost:5173**

---

## 📖 Como usar

### 1. Gerenciar Clientes

1. Na tela inicial, clique em **"Gerenciar Clientes"**
2. Preencha o nome do cliente
3. Faça upload da imagem do header (2480 × 250px)
4. Faça upload da imagem do footer (2480 × 180px)
5. Use a ferramenta de crop para ajustar as imagens
6. Clique em **"Adicionar Cliente"**

### 2. Gerar PDF

1. Volte para a tela inicial (botão "Voltar para PDF")
2. Selecione um cliente no dropdown (ou deixe "Sem cliente")
3. Cole a URL da notícia
4. Clique em **"Gerar PDF"**
5. Aguarde o processamento
6. Visualize e baixe o PDF

---

## 🛑 Parar a aplicação

No Prompt de Comando onde a aplicação está rodando:
- Pressione `Ctrl + C`
- Digite `S` (Sim) para confirmar

---

## ⚠️ Problemas Comuns

### Porta já em uso

Se aparecer erro de porta em uso:

```bash
# Matar processo na porta 3000
npx kill-port 3000

# Matar processo na porta 5173
npx kill-port 5173

# Tentar novamente
npm start
```

### Erro "command not found" ou "não reconhecido"

- Reinicie o Prompt de Comando após instalar o Node.js
- Ou reinicie o computador

### Erro ao instalar dependências

```bash
# Limpar cache do npm
npm cache clean --force

# Tentar novamente
npm install
```

### Erro de permissão

Execute o Prompt de Comando como **Administrador**:
1. Pesquise por "cmd" no menu Iniciar
2. Clique com botão direito em "Prompt de Comando"
3. Selecione "Executar como administrador"

---

## 📁 Estrutura de Pastas

```
press2pdf/
├── frontend/              # Aplicação React (interface)
│   ├── public/
│   │   └── customers/    # Imagens dos clientes
│   │       └── customers.json
│   └── src/
├── server/               # Backend Node.js
│   └── index.js
├── package.json
└── README.md
```

---

## 🔄 Atualizar o projeto

Se houver uma nova versão:

```bash
# Com Git
git pull

# Reinstalar dependências
npm install

# Reiniciar aplicação
npm start
```

---

## 📞 Suporte

Se encontrar algum problema:

1. Verifique se o Node.js está instalado corretamente
2. Certifique-se de estar na pasta correta do projeto
3. Tente limpar e reinstalar as dependências
4. Verifique se as portas 3000 e 5173 estão livres

---

## 🎯 Requisitos Mínimos

- **Sistema Operacional**: Windows 10 ou superior
- **RAM**: 4GB (recomendado 8GB)
- **Espaço em Disco**: 1GB livre
- **Conexão com Internet**: Necessária para instalação

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado e funcionando
- [ ] Projeto baixado/extraído
- [ ] Dependências instaladas (`npm install`)
- [ ] Playwright instalado (`npm run playwright:install`)
- [ ] Aplicação rodando (`npm start`)
- [ ] Navegador aberto em `http://localhost:5173`

---

**Pronto! Sua aplicação está configurada e pronta para usar! 🎉**
