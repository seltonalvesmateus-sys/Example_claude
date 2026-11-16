// @vitest-environment node
import dns from 'node:dns';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import zlib from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ExtractError } from './errors.ts';
import { extractFromUrl } from './extractFromUrl.ts';
import { fetchPage, isPrivateAddress, validateUrl } from './safeFetch.ts';

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.0.10',
    '169.254.169.254', // metadados de nuvem
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fe80::1',
    'fc00::1',
    'fd12:3456::1',
    '::ffff:127.0.0.1',
    'not-an-ip',
  ])('bloqueia %s', (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '2606:4700:4700::1111'])(
    'permite %s',
    (ip) => {
      expect(isPrivateAddress(ip)).toBe(false);
    },
  );
});

describe('validateUrl', () => {
  it('aceita sites públicos http e https', () => {
    expect(validateUrl('https://example.com/a?b=1').hostname).toBe('example.com');
    expect(validateUrl('http://example.com').protocol).toBe('http:');
  });

  it.each([
    ['not a url', 'URL inválida'],
    ['ftp://example.com', 'http://'],
    ['file:///etc/passwd', 'http://'],
    ['javascript:alert(1)', 'http://'],
    ['https://user:pass@example.com', 'usuário e senha'],
    ['http://localhost', 'não é permitido'],
    ['http://app.localhost', 'não é permitido'],
    ['http://servidor.local', 'não é permitido'],
    ['http://127.0.0.1', 'não é permitido'],
    ['http://[::1]', 'não é permitido'],
    ['http://2130706433', 'não é permitido'], // 127.0.0.1 em decimal
    ['http://0x7f.1', 'não é permitido'], // 127.0.0.1 em hexadecimal
    ['http://169.254.169.254/latest/meta-data', 'não é permitido'],
    ['http://[::ffff:7f00:1]', 'não é permitido'],
    ['http://example.com:8080', 'não é permitido'],
    ['http://example.com:22', 'não é permitido'],
  ])('recusa %s', (raw, message) => {
    expect(() => validateUrl(raw)).toThrow(ExtractError);
    expect(() => validateUrl(raw)).toThrow(message);
  });
});

describe('fetchPage e extractFromUrl (servidor local de teste)', () => {
  const big = 'x'.repeat(3000);
  let server: http.Server;
  let base: string;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const path = req.url ?? '/';
      if (path === '/ok') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end('<html><head><title>Página OK</title></head><body><p>Olá mundo</p></body></html>');
      } else if (path === '/gzip') {
        res.writeHead(200, { 'content-type': 'text/html', 'content-encoding': 'gzip' });
        res.end(zlib.gzipSync('<body><p>comprimido</p></body>'));
      } else if (path === '/redirect') {
        res.writeHead(302, { location: '/ok' });
        res.end();
      } else if (path === '/loop') {
        res.writeHead(302, { location: '/loop' });
        res.end();
      } else if (path === '/to-private') {
        res.writeHead(302, { location: 'http://127.0.0.1:1/' });
        res.end();
      } else if (path === '/to-metadata') {
        res.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data' });
        res.end();
      } else if (path === '/to-file') {
        res.writeHead(302, { location: 'file:///etc/passwd' });
        res.end();
      } else if (path === '/json') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{"a":1}');
      } else if (path === '/missing') {
        res.writeHead(404, { 'content-type': 'text/html' });
        res.end('nope');
      } else if (path === '/big') {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(`<body><p>${big}</p></body>`);
      } else if (path === '/empty') {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end('<body><script>x()</script></body>');
      } else if (path === '/plain') {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.end('texto   puro\n com linhas');
      } else if (path === '/slow') {
        // nunca responde: o prazo deve cortar
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  // Só a origem exata do servidor de teste é confiável (e só depois que ele sobe, daí a função).
  // Qualquer outra origem, inclusive destinos de redirecionamento, continua sendo validada.
  const local = () => ({ trustedOrigins: [base] });

  it('bloqueia o servidor local por padrão (rede privada)', async () => {
    await expect(fetchPage(`${base}/ok`)).rejects.toMatchObject({ status: 400 });
  });

  it('extrai título e texto de uma página', async () => {
    expect(await extractFromUrl(`${base}/ok`, local())).toEqual({
      title: 'Página OK',
      text: 'Olá mundo',
    });
  });

  it('descomprime respostas gzip', async () => {
    expect((await extractFromUrl(`${base}/gzip`, local())).text).toBe('comprimido');
  });

  it('segue redirecionamentos', async () => {
    expect((await extractFromUrl(`${base}/redirect`, local())).title).toBe('Página OK');
  });

  it('desiste de redirecionamentos infinitos', async () => {
    await expect(extractFromUrl(`${base}/loop`, local())).rejects.toThrow('vezes demais');
  });

  it.each(['/to-private', '/to-metadata', '/to-file'])(
    'barra o redirecionamento %s para um destino interno ou inválido',
    async (path) => {
      // O primeiro salto (o servidor de teste) é confiável e responde 302; o destino do
      // redirecionamento é outra origem e precisa ser rejeitado pela mesma validação.
      await expect(fetchPage(`${base}${path}`, local())).rejects.toMatchObject({ status: 400 });
    },
  );

  it('segue o redirecionamento se o destino também for confiável (prova que o primeiro salto funciona)', async () => {
    const page = await fetchPage(`${base}/redirect`, local());
    expect(page.url).toBe(`${base}/ok`);
  });

  it('bloqueia, no momento da conexão, um nome que resolve para um IP privado (DNS rebinding)', async () => {
    const lookup = vi
      .spyOn(dns, 'lookup')
      .mockImplementation(((
        _host: string,
        _options: unknown,
        callback: (error: null, addresses: { address: string; family: number }[]) => void,
      ) => callback(null, [{ address: '10.0.0.5', family: 4 }])) as unknown as typeof dns.lookup);

    try {
      // O nome parece público e passa pela validação inicial, mas resolve para 10.0.0.5.
      await expect(fetchPage('http://publico.example/pagina')).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('não é permitido'),
      });
      expect(lookup).toHaveBeenCalled();
    } finally {
      lookup.mockRestore();
    }
  });

  it('recusa conteúdo que não é página de texto', async () => {
    await expect(extractFromUrl(`${base}/json`, local())).rejects.toMatchObject({ status: 415 });
  });

  it('informa erros HTTP do site', async () => {
    await expect(extractFromUrl(`${base}/missing`, local())).rejects.toThrow('erro 404');
  });

  it('corta páginas maiores que o limite em vez de baixar tudo', async () => {
    const page = await fetchPage(`${base}/big`, { ...local(), maxBytes: 1000 });
    expect(page.body.length).toBeLessThanOrEqual(1000);
  });

  it('avisa quando a página não tem texto', async () => {
    await expect(extractFromUrl(`${base}/empty`, local())).rejects.toMatchObject({ status: 422 });
  });

  it('aceita text/plain', async () => {
    expect((await extractFromUrl(`${base}/plain`, local())).text).toBe('texto puro com linhas');
  });

  it('respeita o prazo de resposta', async () => {
    await expect(
      extractFromUrl(`${base}/slow`, { ...local(), timeoutMs: 200 }),
    ).rejects.toMatchObject({ status: 504 });
  });

  it('valida a entrada', async () => {
    await expect(extractFromUrl(null)).rejects.toMatchObject({ status: 400 });
    await expect(extractFromUrl('   ')).rejects.toMatchObject({ status: 400 });
    await expect(extractFromUrl(`http://a.com/${'x'.repeat(3000)}`)).rejects.toThrow('longa');
  });
});
