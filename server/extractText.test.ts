// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { decodeBody, extractText } from './extractText.ts';

describe('extractText', () => {
  it('extrai título e texto, sem scripts, estilos e menus', () => {
    const html = `<html><head><title>Meu Site</title><style>p{color:red}</style></head>
      <body><nav>Menu Home Contato</nav><script>var x = "segredo";</script>
      <h1>Olá mundo</h1><p>Primeiro parágrafo.</p><footer>Rodapé</footer></body></html>`;

    const { title, text } = extractText(html);

    expect(title).toBe('Meu Site');
    expect(text).toBe('Olá mundo Primeiro parágrafo.');
  });

  it('separa blocos para não colar palavras', () => {
    const { text } = extractText('<body><p>um</p><p>dois</p><div>tres</div><br>quatro</body>');
    expect(text).toBe('um dois tres quatro');
  });

  it('prefere o conteúdo principal quando ele é substancial', () => {
    const article = 'conteúdo relevante '.repeat(20);
    const html = `<body><div>barra lateral</div><main>${article}</main></body>`;

    const { text } = extractText(html);

    expect(text).toContain('conteúdo relevante');
    expect(text).not.toContain('barra lateral');
  });

  it('usa o body inteiro quando o main é muito curto', () => {
    const { text } = extractText('<body><div>texto fora</div><main>curto</main></body>');
    expect(text).toContain('texto fora');
  });

  describe('página sem <main> nem <article>', () => {
    const paragraph = (text: string) => `<p>${text} ${'palavra '.repeat(15)}</p>`;
    const menu = `<div class="topo"><a href="/">Início</a> <a href="/a">Cursos</a>
      <a href="/b">Contato</a> <a href="/c">Entrar</a></div>`;
    const sidebar = `<div class="lateral"><h3>Outros textos</h3>
      <ul><li><a href="/1">Texto sobre praia</a></li><li><a href="/2">Texto sobre festa</a></li></ul>
      <p>Anúncio curto</p></div>`;

    it('acha o bloco que concentra os parágrafos e ignora menus e listas de links', () => {
      const html = `<body>${menu}<div class="miolo"><div class="artigo">
        <h1>O acampamento</h1>${paragraph('Primeiro')}${paragraph('Segundo')}${paragraph('Terceiro')}
        </div>${sidebar}</div></body>`;

      const { text } = extractText(html);

      expect(text).toContain('O acampamento');
      expect(text).toContain('Primeiro');
      expect(text).toContain('Terceiro');
      expect(text).not.toContain('Início');
      expect(text).not.toContain('Outros textos');
      expect(text).not.toContain('Anúncio curto');
    });

    it('mantém o texto quando os parágrafos estão divididos em dois blocos irmãos', () => {
      const html = `<body>${menu}<div class="conteudo">
        <div class="parte1">${paragraph('Alfa')}${paragraph('Beta')}</div>
        <div class="parte2">${paragraph('Gama')}${paragraph('Delta')}</div></div></body>`;

      const { text } = extractText(html);

      for (const word of ['Alfa', 'Beta', 'Gama', 'Delta']) expect(text).toContain(word);
      expect(text).not.toContain('Início');
    });

    it('não conta parágrafos que são só links', () => {
      const links = `<p><a href="/x">${'link comprido de navegação '.repeat(10)}</a></p>`;
      const html = `<body><div class="nav">${links}${links}</div>
        <div class="texto">${paragraph('Conteúdo')}${paragraph('Real')}${paragraph('Aqui')}</div></body>`;

      const { text } = extractText(html);

      expect(text).toContain('Conteúdo');
      expect(text).not.toContain('navegação');
    });
  });

  it('prefere og:title e respeita o limite de caracteres', () => {
    const html = `<head><title>Fallback</title><meta property="og:title" content="Título OG"></head>
      <body><p>${'a'.repeat(100)}</p></body>`;

    const { title, text } = extractText(html, 10);

    expect(title).toBe('Título OG');
    expect(text).toHaveLength(10);
  });

  it('devolve texto vazio para uma página sem conteúdo', () => {
    expect(extractText('<html><body><script>x()</script></body></html>').text).toBe('');
  });
});

describe('decodeBody', () => {
  it('decodifica UTF-8 por padrão', () => {
    expect(decodeBody(new TextEncoder().encode('ação'), 'text/html')).toBe('ação');
  });

  it('respeita o charset do cabeçalho', () => {
    const latin1 = Uint8Array.from([0x61, 0xe7, 0xe3, 0x6f]); // "ação" em ISO-8859-1
    expect(decodeBody(latin1, 'text/html; charset=iso-8859-1')).toBe('ação');
  });

  it('usa o charset declarado no <meta> quando o cabeçalho não diz', () => {
    const prefix = new TextEncoder().encode('<meta charset="iso-8859-1">');
    const body = Uint8Array.from([...prefix, 0xe7, 0xe3, 0x6f]);
    expect(decodeBody(body, 'text/html')).toContain('ção');
  });

  it('ignora charsets desconhecidos', () => {
    expect(decodeBody(new TextEncoder().encode('oi'), 'text/html; charset=klingon')).toBe('oi');
  });
});
