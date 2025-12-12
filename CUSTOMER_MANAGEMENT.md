# Sistema de Gerenciamento de Clientes

## Funcionalidade Implementada

Foi adicionado um sistema completo de cadastro de clientes com upload e crop de imagens.

### Recursos

#### 1. **Cadastro de Clientes**
- Nome do cliente
- Path personalizado (usado para criar a estrutura de pastas)
- Upload de imagem de header (2480 × 250px)
- Upload de imagem de footer (2480 × 180px)

#### 2. **Crop de Imagens Inteligente**
- Ferramenta de crop integrada usando `react-easy-crop`
- Dimensões específicas garantidas:
  - Header: 2480 × 250 pixels
  - Footer: 2480 × 180 pixels
- Controle de zoom para ajuste fino
- Preview em tempo real

#### 3. **Listagem de Clientes**
- Visualização de todos os clientes cadastrados
- Preview das imagens de header e footer
- Interface organizada e responsiva

### Como Usar

1. **Acessar o Gerenciamento de Clientes**
   - Na tela principal de geração de PDF, clique em "Gerenciar Clientes" no canto superior direito

2. **Adicionar Novo Cliente**
   - Preencha o nome do cliente
   - Digite o path (ex: `/customers/nome-cliente`)
   - Clique em "Escolher arquivo" para selecionar a imagem do header
   - Ajuste o crop conforme necessário e clique em "Confirmar Crop"
   - Repita o processo para a imagem do footer
   - Clique em "Adicionar Cliente"

3. **Visualizar Clientes**
   - Todos os clientes cadastrados aparecem na lista abaixo do formulário
   - As imagens são exibidas para conferência

### Estrutura de Arquivos

```
frontend/
  customers/
    customers.json          # Arquivo JSON com dados dos clientes
  public/
    customers/
      rs/                   # Exemplo de cliente
        header.png
        footer.png
      [novo-cliente]/       # Novos clientes seguem esta estrutura
        header.png
        footer.png
```

### API Backend

#### POST `/api/customers`
Endpoint para salvar novos clientes.

**Body (FormData):**
- `name`: Nome do cliente
- `path`: Path do cliente
- `header`: Arquivo de imagem do header
- `footer`: Arquivo de imagem do footer

**Response:**
```json
{
  "success": true,
  "customer": {
    "path": "/customers/cliente",
    "name": "Nome do Cliente",
    "footer": "/customers/cliente/footer.png",
    "header": "/customers/cliente/header.png"
  }
}
```

### Tecnologias Utilizadas

- **Frontend:**
  - React 19
  - react-easy-crop (para crop de imagens)
  - Tailwind CSS (estilização)
  
- **Backend:**
  - Express
  - Multer (upload de arquivos)
  - Node.js fs/promises (manipulação de arquivos)

### Validações

- ✅ Todos os campos são obrigatórios
- ✅ Ambas as imagens devem ser enviadas
- ✅ Imagens são automaticamente redimensionadas para as dimensões corretas
- ✅ Path do cliente é validado no formato correto

### Navegação

- Botão "Gerenciar Clientes" na tela principal leva ao gerenciamento
- Botão "Voltar para PDF" no gerenciamento retorna à tela principal
