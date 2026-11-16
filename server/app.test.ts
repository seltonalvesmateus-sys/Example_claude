// @vitest-environment node
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApiServer, type Extractor } from './app.ts';
import { ExtractError } from './errors.ts';

describe('createApiServer', () => {
  const extract = vi.fn<Extractor>();
  let server: Server;
  let base: string;

  beforeAll(async () => {
    server = createApiServer(extract);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('devolve título e texto em JSON, sem cache, e repassa a URL ao extrator', async () => {
    extract.mockResolvedValueOnce({ title: 'Página', text: 'olá mundo' });

    const response = await fetch(
      `${base}/api/extract?url=${encodeURIComponent('https://a.com/x')}`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ title: 'Página', text: 'olá mundo' });
    expect(extract).toHaveBeenLastCalledWith('https://a.com/x');
  });

  it('passa null ao extrator quando falta o parâmetro url', async () => {
    extract.mockRejectedValueOnce(new ExtractError(400, 'Informe o endereço de uma página.'));

    const response = await fetch(`${base}/api/extract`);

    expect(extract).toHaveBeenLastCalledWith(null);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Informe o endereço de uma página.' });
  });

  it.each([400, 415, 422, 502, 504])('repassa o status %i dos erros esperados', async (status) => {
    extract.mockRejectedValueOnce(new ExtractError(status, `erro ${status}`));

    const response = await fetch(`${base}/api/extract?url=x`);

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: `erro ${status}` });
  });

  it('responde 500 genérico a erros inesperados, sem vazar detalhes internos', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    extract.mockRejectedValueOnce(new Error('senha do banco: 1234 em /etc/segredo'));

    const response = await fetch(`${base}/api/extract?url=x`);
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(text)).toEqual({ error: 'Erro inesperado no servidor.' });
    expect(text).not.toContain('senha');
    expect(log).toHaveBeenCalled(); // o detalhe fica só no log do servidor
    log.mockRestore();
  });

  it('responde 404 para outras rotas e para métodos que não sejam GET', async () => {
    const other = await fetch(`${base}/api/outra`);
    expect(other.status).toBe(404);

    const post = await fetch(`${base}/api/extract?url=x`, { method: 'POST' });
    expect(post.status).toBe(404);
  });
});
