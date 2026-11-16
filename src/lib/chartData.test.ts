import { describe, expect, it } from 'vitest';
import { cloudWords, donutSlices, lengthDistribution } from './chartData';

const rows = [
  { word: 'sol', count: 8 },
  { word: 'lua', count: 4 },
  { word: 'mar', count: 2 },
  { word: 'céu', count: 1 },
];

describe('cloudWords', () => {
  it('dá peso 1 à mais frequente e 0 à menos frequente', () => {
    const byWord = Object.fromEntries(cloudWords(rows).map((item) => [item.word, item.weight]));
    expect(byWord.sol).toBe(1);
    expect(byWord['céu']).toBe(0);
    expect(byWord.lua).toBeGreaterThan(byWord.mar);
  });

  it('coloca as palavras maiores no meio', () => {
    const order = cloudWords(rows).map((item) => item.word);
    expect(order).toEqual(['céu', 'lua', 'sol', 'mar']);
  });

  it('respeita o limite e lida com lista vazia', () => {
    expect(cloudWords(rows, 2)).toHaveLength(2);
    expect(cloudWords([])).toEqual([]);
  });

  it('dá peso 1 a todas quando as frequências são iguais', () => {
    const equal = [
      { word: 'a', count: 2 },
      { word: 'b', count: 2 },
    ];
    expect(cloudWords(equal).every((item) => item.weight === 1)).toBe(true);
  });
});

describe('donutSlices', () => {
  it('soma 100% e agrupa o resto em "outras"', () => {
    const slices = donutSlices(rows, 2);
    expect(slices.map((slice) => slice.label)).toEqual(['sol', 'lua', 'outras']);
    expect(slices.reduce((sum, slice) => sum + slice.percent, 0)).toBeCloseTo(100);
    expect(slices[2].count).toBe(3);
  });

  it('não cria "outras" quando tudo cabe no top', () => {
    expect(donutSlices(rows, 10).map((slice) => slice.label)).not.toContain('outras');
  });

  it('retorna vazio sem palavras', () => {
    expect(donutSlices([])).toEqual([]);
  });
});

describe('lengthDistribution', () => {
  it('conta ocorrências por número de letras, contando acentos como uma letra', () => {
    const result = lengthDistribution(rows);
    expect(result).toEqual([{ length: 3, orMore: false, count: 15 }]);
  });

  it('agrupa palavras longas no último grupo e mantém os tamanhos intermediários', () => {
    const result = lengthDistribution(
      [
        { word: 'a', count: 1 },
        { word: 'extraordinariamente', count: 2 },
      ],
      5,
    );
    expect(result.map((bucket) => bucket.length)).toEqual([1, 2, 3, 4, 5]);
    expect(result[4]).toEqual({ length: 5, orMore: true, count: 2 });
  });

  it('retorna vazio sem palavras', () => {
    expect(lengthDistribution([])).toEqual([]);
  });
});
