import { describe, expect, it } from 'vitest';
import { countWords } from './countWords';

describe('countWords', () => {
  it('retorna lista vazia para texto vazio ou só com espaços', () => {
    expect(countWords('')).toEqual([]);
    expect(countWords('   \n\t ')).toEqual([]);
  });

  it('retorna lista vazia quando há só pontuação', () => {
    expect(countWords('... !!! ??? , ;')).toEqual([]);
  });

  it('conta palavras repetidas', () => {
    expect(countWords('sol sol lua sol lua mar')).toEqual([
      { word: 'sol', count: 3 },
      { word: 'lua', count: 2 },
      { word: 'mar', count: 1 },
    ]);
  });

  it('ignora maiúsculas e minúsculas', () => {
    expect(countWords('Casa casa CASA')).toEqual([{ word: 'casa', count: 3 }]);
  });

  it('descarta pontuação', () => {
    expect(countWords('Olá, mundo! Olá... "mundo"?')).toEqual([
      { word: 'mundo', count: 2 },
      { word: 'olá', count: 2 },
    ]);
  });

  it('preserva acentos (é ≠ e)', () => {
    const result = countWords('é e é');
    expect(result).toEqual([
      { word: 'é', count: 2 },
      { word: 'e', count: 1 },
    ]);
  });

  it('trata várias linhas e espaços repetidos', () => {
    expect(countWords('um\ndois\r\n\tum   dois  um')).toEqual([
      { word: 'um', count: 3 },
      { word: 'dois', count: 2 },
    ]);
  });

  it('mantém hífens e apóstrofos internos', () => {
    expect(countWords("guarda-chuva d'água guarda-chuva")).toEqual([
      { word: 'guarda-chuva', count: 2 },
      { word: "d'água", count: 1 },
    ]);
  });

  it('descarta hífens e apóstrofos soltos nas bordas', () => {
    expect(countWords("- casa - 'casa' casa-")).toEqual([{ word: 'casa', count: 3 }]);
  });

  it('conta números como palavras', () => {
    expect(countWords('2024 foi 2024')).toEqual([
      { word: '2024', count: 2 },
      { word: 'foi', count: 1 },
    ]);
  });

  it('desempata em ordem alfabética', () => {
    expect(countWords('zebra abelha macaco')).toEqual([
      { word: 'abelha', count: 1 },
      { word: 'macaco', count: 1 },
      { word: 'zebra', count: 1 },
    ]);
  });

  it('diferencia maiúsculas de minúsculas quando pedido', () => {
    expect(countWords('Casa casa Casa', { caseSensitive: true })).toEqual([
      { word: 'Casa', count: 2 },
      { word: 'casa', count: 1 },
    ]);
  });

  it('ignora as palavras da lista, sem diferenciar maiúsculas', () => {
    const ignore = new Set(['o', 'de']);
    expect(countWords('O gato de O Pedro', { ignore })).toEqual([
      { word: 'gato', count: 1 },
      { word: 'pedro', count: 1 },
    ]);
    expect(countWords('O gato', { ignore, caseSensitive: true })).toEqual([
      { word: 'gato', count: 1 },
    ]);
  });

  it('retorna em ordem decrescente de frequência', () => {
    const counts = countWords('a b b c c c d d d d').map((item) => item.count);
    expect(counts).toEqual([4, 3, 2, 1]);
  });
});
