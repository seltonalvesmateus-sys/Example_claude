import * as cheerio from 'cheerio';

export type ExtractedPage = {
  title: string;
  text: string;
};

// Partes da página que não são o conteúdo que o leitor veio ler.
const NOISE_SELECTOR = [
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'canvas',
  'iframe',
  'object',
  'embed',
  'head',
  'nav',
  'footer',
  'aside',
  'form',
  'button',
  'select',
  '[hidden]',
  '[aria-hidden="true"]',
].join(',');

const BLOCK_SELECTOR = 'br,p,div,li,ul,ol,h1,h2,h3,h4,h5,h6,tr,td,th,section,article,blockquote';
const MIN_MAIN_CHARS = 200;
// A declaração <meta charset> fica no começo do HTML: só esse trecho é lido para descobri-la.
const CHARSET_SNIFF_BYTES = 2048;
// Um parágrafo só conta como "texto de verdade" se tiver pelo menos isso (fora de links).
const MIN_PARAGRAPH_CHARS = 20;
// Um bloco é o "conteúdo principal" se concentrar pelo menos esta fração dos parágrafos.
const MAIN_SHARE = 0.6;

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Para páginas sem <main>/<article> (muito comuns), acha o menor bloco que concentra a maior
 * parte dos parágrafos: parte do <body> e desce para o filho que contém a maioria do texto.
 * Menus e listas de links são feitos de <a>, não de parágrafos, então ficam de fora.
 */
function findContentRoot($: cheerio.CheerioAPI) {
  const paragraphs = $('p')
    .toArray()
    .map((element) => {
      const paragraph = $(element);
      const linkChars = collapseWhitespace(paragraph.find('a').text()).length;
      const weight = collapseWhitespace(paragraph.text()).length - linkChars;
      return { element, weight };
    })
    .filter(({ weight }) => weight >= MIN_PARAGRAPH_CHARS);

  const total = paragraphs.reduce((sum, { weight }) => sum + weight, 0);
  if (total < MIN_MAIN_CHARS) return null;

  let current = $('body').first();
  if (current.length === 0) return null;

  for (;;) {
    let best = null;
    let bestWeight = 0;
    for (const child of current.children().toArray()) {
      const weight = paragraphs.reduce(
        (sum, p) => (p.element === child || $.contains(child, p.element) ? sum + p.weight : sum),
        0,
      );
      if (weight > bestWeight) {
        best = child;
        bestWeight = weight;
      }
    }
    if (!best || bestWeight < total * MAIN_SHARE) return current;
    current = $(best);
  }
}

/** Extrai o título e o texto visível de um HTML, sem scripts, estilos e menus. */
export function extractText(html: string, maxChars = 50_000): ExtractedPage {
  const $ = cheerio.load(html);

  const title = collapseWhitespace(
    $('meta[property="og:title"]').attr('content') || $('title').first().text() || '',
  );

  $(NOISE_SELECTOR).remove();
  // Sem esse espaço, "<p>um</p><p>dois</p>" viraria "umdois".
  $(BLOCK_SELECTOR).after(' ');

  const bodyText = collapseWhitespace($('body').text() || $.root().text());
  const mainText = collapseWhitespace($('main, article, [role="main"]').first().text());
  const contentRoot = findContentRoot($);
  const detectedText = contentRoot ? collapseWhitespace(contentRoot.text()) : '';

  // Ordem de preferência (cada uma só vale se for substancial): a marcação semântica da página,
  // o bloco que concentra os parágrafos e, por último, o <body> inteiro.
  let text = bodyText;
  if (mainText.length >= MIN_MAIN_CHARS) text = mainText;
  else if (detectedText.length >= MIN_MAIN_CHARS) text = detectedText;

  return { title, text: text.slice(0, maxChars) };
}

/** Descobre a codificação (cabeçalho ou <meta>) e converte os bytes em texto. */
export function decodeBody(body: Uint8Array, contentType: string): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType)?.[1];
  const head = new TextDecoder('latin1').decode(body.subarray(0, CHARSET_SNIFF_BYTES));
  const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1];

  for (const label of [fromHeader, fromMeta, 'utf-8']) {
    if (!label) continue;
    try {
      return new TextDecoder(label).decode(body);
    } catch {
      // Codificação desconhecida: tenta a próxima.
    }
  }
  return new TextDecoder().decode(body);
}
