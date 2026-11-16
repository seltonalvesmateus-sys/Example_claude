export const EMPTY_URL_MESSAGE = 'Digite o endereço de uma página.';
export const INVALID_URL_MESSAGE =
  'Endereço inválido. Exemplo: https://pt.wikipedia.org/wiki/Brasil';
export const SERVER_DOWN_MESSAGE =
  'Não foi possível falar com o servidor de busca. Ele está rodando? (use npm run dev:all)';

export type UrlText = {
  title: string;
  text: string;
};

/** Limpa o que o usuário digitou e garante um endereço http(s) válido. */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '') throw new Error(EMPTY_URL_MESSAGE);

  // "exemplo.com/pagina" vira "https://exemplo.com/pagina".
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(INVALID_URL_MESSAGE);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(INVALID_URL_MESSAGE);
  }
  return url.toString();
}

/** Pede ao servidor o texto de uma página da web. Lança Error com mensagem pronta para exibir. */
export async function fetchUrlText(input: string): Promise<UrlText> {
  const url = normalizeUrl(input);

  let response: Response;
  try {
    response = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
  } catch {
    throw new Error(SERVER_DOWN_MESSAGE);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // Sem JSON: em desenvolvimento, o proxy do Vite responde assim quando a API está fora do ar.
    throw new Error(
      response.status >= 500 ? SERVER_DOWN_MESSAGE : 'Resposta inesperada do servidor.',
    );
  }

  const data = (body ?? {}) as Partial<UrlText> & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Erro ${response.status} ao buscar a página.`);
  if (typeof data.text !== 'string') throw new Error('Resposta inesperada do servidor.');

  return { title: data.title ?? '', text: data.text };
}
