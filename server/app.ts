import http from 'node:http';
import { ExtractError } from './errors.ts';
import type { ExtractedPage } from './extractText.ts';

/** Função que baixa uma página e devolve seu texto. Injetável para facilitar os testes. */
export type Extractor = (url: string | null) => Promise<ExtractedPage>;

function sendJson(response: http.ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

/** Cria o servidor da API (GET /api/extract?url=...). Quem chama decide onde ele escuta. */
export function createApiServer(extract: Extractor): http.Server {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');

    if (request.method !== 'GET' || url.pathname !== '/api/extract') {
      return sendJson(response, 404, { error: 'Rota não encontrada.' });
    }

    try {
      sendJson(response, 200, await extract(url.searchParams.get('url')));
    } catch (error) {
      if (error instanceof ExtractError) {
        return sendJson(response, error.status, { error: error.message });
      }
      // Detalhes internos vão só para o log do servidor, nunca para quem fez a requisição.
      console.error(error);
      sendJson(response, 500, { error: 'Erro inesperado no servidor.' });
    }
  });
}
