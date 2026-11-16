import { ExtractError } from './errors.ts';
import { decodeBody, extractText, type ExtractedPage } from './extractText.ts';
import { fetchPage, type FetchOptions } from './safeFetch.ts';

const MAX_URL_LENGTH = 2048;

export async function extractFromUrl(
  rawUrl: string | null,
  options: FetchOptions = {},
): Promise<ExtractedPage> {
  const url = rawUrl?.trim();
  if (!url) throw new ExtractError(400, 'Informe o endereço de uma página.');
  if (url.length > MAX_URL_LENGTH) throw new ExtractError(400, 'URL longa demais.');

  const page = await fetchPage(url, options);
  const html = decodeBody(page.body, page.contentType);
  const isPlainText = page.contentType.toLowerCase().includes('text/plain');
  const extracted = isPlainText
    ? { title: '', text: html.replace(/\s+/g, ' ').trim() }
    : extractText(html);

  if (extracted.text === '') {
    throw new ExtractError(422, 'Não encontramos texto nessa página.');
  }
  return { title: extracted.title || new URL(page.url).hostname, text: extracted.text };
}
