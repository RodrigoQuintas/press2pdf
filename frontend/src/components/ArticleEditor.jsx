import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Plugin customizado para lidar com paste de imagens
const PasteImagePlugin = new Plugin({
  key: new PluginKey('pasteImage'),
  props: {
    handlePaste(view, event, slice) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItems = items.filter(item => item.type.indexOf('image') !== -1);

      if (imageItems.length === 0) {
        return false;
      }

      event.preventDefault();

      imageItems.forEach(item => {
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const { schema } = view.state;
            const img = schema.nodes.image.create({
              src: e.target.result,
            });
            const transaction = view.state.tr.replaceSelectionWith(img);
            view.dispatch(transaction);
          };
          reader.readAsDataURL(blob);
        }
      });

      return true;
    },
    handleDrop(view, event, slice, moved) {
      if (!event.dataTransfer || event.dataTransfer.files.length === 0) {
        return false;
      }

      const images = Array.from(event.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      );

      if (images.length === 0) {
        return false;
      }

      event.preventDefault();

      const { schema } = view.state;
      const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

      images.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const node = schema.nodes.image.create({
            src: e.target.result,
          });
          const transaction = view.state.tr.insert(coordinates.pos, node);
          view.dispatch(transaction);
        };
        reader.readAsDataURL(file);
      });

      return true;
    },
  },
});

// Extensão de Imagem customizada com suporte a paste e redimensionamento
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) {
            return {};
          }
          return { height: attributes.height };
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [PasteImagePlugin];
  },
});

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL da imagem:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const resizeImage = (size) => {
    const { state } = editor;
    const { selection } = state;
    const node = state.doc.nodeAt(selection.from);
    
    if (node && node.type.name === 'image') {
      let width, height;
      
      switch(size) {
        case 'small':
          width = '300px';
          break;
        case 'medium':
          width = '600px';
          break;
        case 'large':
          width = '100%';
          break;
        case 'custom':
          const customWidth = window.prompt('Largura (ex: 500px, 50%):');
          if (customWidth) {
            width = customWidth;
          }
          break;
      }
      
      if (width) {
        editor.chain().focus().updateAttributes('image', { width, height: 'auto' }).run();
      }
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b border-gray-300 p-3 flex flex-wrap gap-1 bg-white sticky top-0 z-10 items-center shadow-sm">
      <div className="flex gap-0.5">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700"
          title="Desfazer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700"
          title="Refazer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>
      
      <div className="w-px h-6 bg-gray-300"></div>

      <div className="flex gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded font-bold hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Negrito"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded italic hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Itálico"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded line-through hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Tachado"
        >
          S
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`px-2 py-1.5 rounded font-mono text-sm hover:bg-gray-100 ${editor.isActive('code') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Código"
        >
          &lt;/&gt;
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      <div className="flex gap-0.5">
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-100 ${editor.isActive('paragraph') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Parágrafo"
        >
          P
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2.5 py-1.5 rounded font-bold hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Título 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1.5 rounded font-bold hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Título 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1.5 rounded font-semibold hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Título 3"
        >
          H3
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      <div className="flex gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-100 flex items-center gap-1 ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Lista com marcadores"
        >
          • Lista
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-100 flex items-center gap-1 ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Lista numerada"
        >
          1. Lista
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      <div className="flex gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Citação"
        >
          " "
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1.5 rounded hover:bg-gray-100 ${editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Bloco de código"
        >
          {'{ }'}
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      <div className="flex gap-0.5">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Alinhar à esquerda"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Centralizar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Alinhar à direita"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Justificar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      <div className="flex gap-0.5">
        <button
          onClick={setLink}
          className={`px-3 py-1.5 rounded hover:bg-gray-100 flex items-center gap-1.5 ${editor.isActive('link') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
          title="Adicionar/editar link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Link
        </button>
        <button
          onClick={addImage}
          className="px-3 py-1.5 rounded hover:bg-gray-100 flex items-center gap-1.5 text-gray-700"
          title="Adicionar imagem"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Imagem
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      <div className="flex gap-0.5">
        <button
          onClick={() => resizeImage('small')}
          className="px-2 py-1.5 rounded hover:bg-gray-100 text-gray-700 text-xs font-semibold"
          title="Redimensionar imagem selecionada - Pequena (300px)"
        >
          P
        </button>
        <button
          onClick={() => resizeImage('medium')}
          className="px-2 py-1.5 rounded hover:bg-gray-100 text-gray-700 text-sm font-semibold"
          title="Redimensionar imagem selecionada - Média (600px)"
        >
          M
        </button>
        <button
          onClick={() => resizeImage('large')}
          className="px-2 py-1.5 rounded hover:bg-gray-100 text-gray-700 font-semibold"
          title="Redimensionar imagem selecionada - Grande (100%)"
        >
          G
        </button>
        <button
          onClick={() => resizeImage('custom')}
          className="px-2 py-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="Redimensionar imagem selecionada - Tamanho personalizado"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      <div className="flex gap-0.5">
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="Linha horizontal"
        >
          ―
        </button>
        <button
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700"
          title="Quebra de linha"
        >
          ↵
        </button>
      </div>
    </div>
  );
};

function ArticleEditor({ initialContent, onContentChange, articleMetadata, onMetadataChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange(html);
    },
  });

  const handleMetadataChange = (field, value) => {
    if (onMetadataChange) {
      onMetadataChange({
        ...articleMetadata,
        [field]: value
      });
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-md">
      {articleMetadata && (
        <div className="p-4 bg-blue-50 border-b border-gray-300">
          <input
            type="text"
            value={articleMetadata.title || ''}
            onChange={(e) => handleMetadataChange('title', e.target.value)}
            className="w-full text-xl font-bold mb-2 px-2 py-1 border border-transparent hover:border-blue-300 focus:border-blue-500 rounded focus:outline-none bg-transparent"
            placeholder="Título da notícia..."
          />
          <input
            type="text"
            value={articleMetadata.byline || ''}
            onChange={(e) => handleMetadataChange('byline', e.target.value)}
            className="w-full text-sm text-gray-600 italic mb-1 px-2 py-1 border border-transparent hover:border-blue-300 focus:border-blue-500 rounded focus:outline-none bg-transparent"
            placeholder="Autor..."
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">📅</span>
            <input
              type="text"
              value={articleMetadata.publishedDate || ''}
              onChange={(e) => handleMetadataChange('publishedDate', e.target.value)}
              className="text-sm text-gray-500 px-2 py-1 border border-transparent hover:border-blue-300 focus:border-blue-500 rounded focus:outline-none bg-transparent"
              placeholder="Data de publicação..."
            />
          </div>
        </div>
      )}
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="prose max-w-none p-6 min-h-[500px] focus:outline-none"
      />
    </div>
  );
}

export default ArticleEditor;
