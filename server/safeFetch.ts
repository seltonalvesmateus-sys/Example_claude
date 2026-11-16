import dns from 'node:dns';
import http, { type IncomingMessage } from 'node:http';
import https from 'node:https';
import net from 'node:net';
import zlib from 'node:zlib';
import { ExtractError } from './errors.ts';

/*
 * Busca de páginas com proteção contra SSRF: o servidor baixa URLs escolhidas por qualquer
 * usuário, então nunca pode ser usado para alcançar a rede interna (localhost, 192.168.x.x,
 * metadados de nuvem em 169.254.169.254 etc.).
 */

const BLOCKED_CODE = 'EBLOCKED';
const ALLOWED_PORTS = new Set(['', '80', '443']);
const ALLOWED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml', 'text/plain'];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const blockedRanges = new net.BlockList();
const IPV4_RANGES: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];
const IPV6_RANGES: [string, number][] = [
  ['fc00::', 7], // endereços locais únicos
  ['fe80::', 10], // link-local
  ['ff00::', 8], // multicast
  ['64:ff9b::', 96], // NAT64
  ['2001:db8::', 32], // documentação
];
for (const [address, prefix] of IPV4_RANGES) blockedRanges.addSubnet(address, prefix, 'ipv4');
for (const [address, prefix] of IPV6_RANGES) blockedRanges.addSubnet(address, prefix, 'ipv6');
blockedRanges.addAddress('::', 'ipv6');
blockedRanges.addAddress('::1', 'ipv6');

/** true se o IP é local/privado/reservado (ou inválido, por segurança). */
export function isPrivateAddress(ip: string): boolean {
  try {
    if (!net.isIP(ip)) return true;
    // IPv4 "mapeado" em IPv6 (::ffff:127.0.0.1) pode esconder um endereço privado. Não dá para
    // usar uma regra de sub-rede para isso: o BlockList do Node trata todo IPv4 como mapeado e
    // acabaria bloqueando a internet inteira. Como nenhum site público usa esse formato, recusa.
    if (ip.toLowerCase().startsWith('::ffff:')) return true;
    return blockedRanges.check(ip, net.isIPv6(ip) ? 'ipv6' : 'ipv4');
  } catch {
    return true;
  }
}

function blockedError(): Error {
  return Object.assign(new Error('blocked'), { code: BLOCKED_CODE });
}

const NOT_ALLOWED = 'Esse endereço não é permitido. Use o endereço de um site público.';

/**
 * Valida e normaliza a URL antes de qualquer conexão. `trustedOrigins` (só para testes) isenta
 * origens exatas das checagens de rede privada; qualquer outra origem continua validada.
 */
export function validateUrl(raw: string, trustedOrigins: readonly string[] = []): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ExtractError(400, 'URL inválida.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ExtractError(400, 'Só endereços http:// e https:// são aceitos.');
  }
  if (url.username || url.password) {
    throw new ExtractError(400, 'URLs com usuário e senha não são aceitas.');
  }
  if (trustedOrigins.includes(url.origin)) return url;

  if (!ALLOWED_PORTS.has(url.port)) throw new ExtractError(400, NOT_ALLOWED);

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const isLocalName =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal');
  if (isLocalName || (net.isIP(host) && isPrivateAddress(host))) {
    throw new ExtractError(400, NOT_ALLOWED);
  }
  return url;
}

/**
 * Resolve o DNS e recusa endereços privados NO MOMENTO DA CONEXÃO. Validar só antes não basta:
 * um site malicioso poderia responder com um IP público na checagem e um privado na conexão
 * (DNS rebinding).
 */
const safeLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, []);
    if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
      return callback(blockedError(), []);
    }
    if (options.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
};

function toExtractError(error: unknown): ExtractError {
  if (error instanceof ExtractError) return error;
  const { name, code } = (error ?? {}) as { name?: string; code?: string };
  if (name === 'AbortError' || code === 'ABORT_ERR') {
    return new ExtractError(504, 'O site demorou demais para responder.');
  }
  if (code === BLOCKED_CODE) return new ExtractError(400, NOT_ALLOWED);
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return new ExtractError(502, 'Não encontramos esse site. Confira o endereço.');
  }
  return new ExtractError(502, 'Não foi possível acessar o site.');
}

function request(url: URL, signal: AbortSignal, trusted: boolean) {
  return new Promise<IncomingMessage>((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      url,
      {
        method: 'GET',
        signal,
        lookup: trusted ? undefined : safeLookup,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; WordFrequencyApp/1.0)',
          accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'accept-encoding': 'gzip, deflate, br',
        },
      },
      resolve,
    );
    req.on('error', reject);
    req.end();
  });
}

/** Lê o corpo (já descomprimido) até maxBytes; o que passar disso é descartado. */
function readBody(response: IncomingMessage, maxBytes: number): Promise<Buffer> {
  const encoding = String(response.headers['content-encoding'] ?? '').toLowerCase();
  let stream: NodeJS.ReadableStream = response;
  if (encoding === 'gzip' || encoding === 'x-gzip') stream = response.pipe(zlib.createGunzip());
  else if (encoding === 'deflate') stream = response.pipe(zlib.createInflate());
  else if (encoding === 'br') stream = response.pipe(zlib.createBrotliDecompress());

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      response.destroy();
      resolve(Buffer.concat(chunks).subarray(0, maxBytes));
    };

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= maxBytes) finish(); // só precisamos do começo da página
    });
    stream.on('end', finish);
    stream.on('error', (error) => {
      if (done) return;
      done = true;
      reject(error);
    });
    response.on('error', (error) => {
      if (done) return;
      done = true;
      reject(error);
    });
  });
}

export type FetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  /**
   * Origens exatas (ex.: "http://127.0.0.1:4000") isentas da checagem de rede privada.
   * Só para testes com servidores locais: nunca preencha isso em produção. Redirecionamentos
   * para qualquer outra origem continuam sendo validados.
   */
  trustedOrigins?: readonly string[];
};

export type FetchedPage = {
  url: string;
  contentType: string;
  body: Buffer;
};

export async function fetchPage(rawUrl: string, options: FetchOptions = {}): Promise<FetchedPage> {
  const {
    timeoutMs = 8000,
    maxBytes = 2 * 1024 * 1024,
    maxRedirects = 5,
    trustedOrigins = [],
  } = options;

  // Um único prazo cobre conexão, redirecionamentos e leitura do corpo.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let url = validateUrl(rawUrl, trustedOrigins);

    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const response = await request(url, controller.signal, trustedOrigins.includes(url.origin));
      const status = response.statusCode ?? 0;
      const location = response.headers.location;

      if (REDIRECT_STATUSES.has(status) && location) {
        response.resume();
        // Cada destino de redirecionamento passa pela mesma validação.
        let next: string;
        try {
          next = new URL(location, url).toString();
        } catch {
          throw new ExtractError(502, 'O site redirecionou para um endereço inválido.');
        }
        url = validateUrl(next, trustedOrigins);
        continue;
      }

      if (status < 200 || status >= 300) {
        response.resume();
        throw new ExtractError(502, `O site respondeu com o erro ${status}.`);
      }

      const contentType = String(response.headers['content-type'] ?? '');
      if (!ALLOWED_CONTENT_TYPES.some((type) => contentType.toLowerCase().includes(type))) {
        response.resume();
        throw new ExtractError(415, 'Esse endereço não é uma página de texto (HTML).');
      }

      const body = await readBody(response, maxBytes);
      return { url: url.toString(), contentType, body };
    }

    throw new ExtractError(502, 'O site redirecionou vezes demais.');
  } catch (error) {
    throw toExtractError(error);
  } finally {
    clearTimeout(timer);
  }
}
