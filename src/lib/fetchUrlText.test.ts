import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_URL_MESSAGE,
  fetchUrlText,
  INVALID_URL_MESSAGE,
  normalizeUrl,
  SERVER_DOWN_MESSAGE,
} from './fetchUrlText';

function stubFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      body === undefined ? Promise.reject(new Error('sem json')) : Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('normalizeUrl', () => {
  it('mantém URLs completas', () => {
    expect(normalizeUrl('https://exemplo.com/a?b=1')).toBe('https://exemplo.com/a?b=1');
    expect(normalizeUrl('http://exemplo.com')).toBe('http://exemplo.com/');
  });

  it('acrescenta https:// quando falta e ignora espaços', () => {
    expect(normalizeUrl('  exemplo.com/pagina ')).toBe('https://exemplo.com/pagina');
  });

  it('recusa vazio, protocolos que não são http e lixo', () => {
    expect(() => normalizeUrl('   ')).toThrow(EMPTY_URL_MESSAGE);
    expect(() => normalizeUrl('ftp://exemplo.com')).toThrow(INVALID_URL_MESSAGE);
    expect(() => normalizeUrl('javascript:alert(1)')).toThrow(INVALID_URL_MESSAGE);
    expect(() => normalizeUrl('http://')).toThrow(INVALID_URL_MESSAGE);
  });
});

describe('fetchUrlText', () => {
  it('chama a API com a URL codificada e devolve título e texto', async () => {
    const fetchMock = stubFetch(200, { title: 'Site', text: 'olá mundo' });

    const result = await fetchUrlText('exemplo.com/a b');

    // O espaço vira %20 na normalização da URL e esse "%" é codificado de novo (%2520).
    expect(fetchMock).toHaveBeenCalledWith('/api/extract?url=https%3A%2F%2Fexemplo.com%2Fa%2520b');
    expect(result).toEqual({ title: 'Site', text: 'olá mundo' });
  });

  it('repassa a mensagem de erro do servidor', async () => {
    stubFetch(400, { error: 'Esse endereço não é permitido.' });
    await expect(fetchUrlText('exemplo.com')).rejects.toThrow('Esse endereço não é permitido.');
  });

  it('avisa que o servidor está fora do ar quando a conexão falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchUrlText('exemplo.com')).rejects.toThrow(SERVER_DOWN_MESSAGE);
  });

  it('avisa que o servidor está fora do ar quando o proxy responde 5xx sem JSON', async () => {
    stubFetch(500);
    await expect(fetchUrlText('exemplo.com')).rejects.toThrow(SERVER_DOWN_MESSAGE);
  });

  it('rejeita respostas fora do formato esperado', async () => {
    stubFetch(200, { algo: 'errado' });
    await expect(fetchUrlText('exemplo.com')).rejects.toThrow('Resposta inesperada');
  });

  it('não chama a API quando a URL é inválida', async () => {
    const fetchMock = stubFetch(200, { title: '', text: 'x' });
    await expect(fetchUrlText('')).rejects.toThrow(EMPTY_URL_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
