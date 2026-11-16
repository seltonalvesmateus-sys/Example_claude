import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCsv, toCsv, toTsv } from './export';

describe('toCsv', () => {
  it('gera cabeçalho e uma linha por palavra, separados por ponto e vírgula', () => {
    expect(
      toCsv([
        { word: 'sol', count: 3 },
        { word: 'lua', count: 1 },
      ]),
    ).toBe('palavra;ocorrencias\r\nsol;3\r\nlua;1');
  });

  it('coloca entre aspas campos com separador, vírgula ou aspas', () => {
    expect(toCsv([{ word: 'a;b', count: 1 }])).toContain('"a;b";1');
    expect(toCsv([{ word: 'a,b', count: 1 }])).toContain('"a,b";1');
    expect(toCsv([{ word: 'a"b', count: 1 }])).toContain('"a""b";1');
  });

  it('gera só o cabeçalho para lista vazia', () => {
    expect(toCsv([])).toBe('palavra;ocorrencias');
  });
});

describe('toTsv', () => {
  it('separa palavra e contagem por tabulação', () => {
    expect(toTsv([{ word: 'sol', count: 3 }])).toBe('sol\t3');
  });
});

describe('downloadCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('baixa um arquivo .csv em UTF-8 com BOM e libera a URL depois', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:fake');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv([{ word: 'olá', count: 2 }], 'teste.csv');

    expect(click).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toContain('text/csv');
    // Blob.text() descarta o BOM ao decodificar, então confere os bytes crus (EF BB BF).
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(await blob.text()).toBe('palavra;ocorrencias\r\nolá;2');
    expect(document.querySelector('a[download]')).toBeNull();

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});
