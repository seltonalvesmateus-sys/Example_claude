import { describe, expect, it } from 'vitest';
import { nextSort, sortRows } from './sortRows';

const rows = [
  { word: 'lua', count: 2 },
  { word: 'sol', count: 5 },
  { word: 'mar', count: 2 },
];

describe('sortRows', () => {
  it('ordena por contagem decrescente com desempate alfabético', () => {
    const result = sortRows(rows, { key: 'count', direction: 'desc' });
    expect(result.map((r) => r.word)).toEqual(['sol', 'lua', 'mar']);
  });

  it('ordena por contagem crescente', () => {
    const result = sortRows(rows, { key: 'count', direction: 'asc' });
    expect(result.map((r) => r.word)).toEqual(['lua', 'mar', 'sol']);
  });

  it('ordena alfabeticamente nos dois sentidos', () => {
    expect(sortRows(rows, { key: 'word', direction: 'asc' }).map((r) => r.word)).toEqual([
      'lua',
      'mar',
      'sol',
    ]);
    expect(sortRows(rows, { key: 'word', direction: 'desc' }).map((r) => r.word)).toEqual([
      'sol',
      'mar',
      'lua',
    ]);
  });

  it('não altera o array original', () => {
    const copy = [...rows];
    sortRows(rows, { key: 'word', direction: 'asc' });
    expect(rows).toEqual(copy);
  });
});

describe('nextSort', () => {
  it('inverte o sentido ao clicar na mesma coluna', () => {
    expect(nextSort({ key: 'count', direction: 'desc' }, 'count')).toEqual({
      key: 'count',
      direction: 'asc',
    });
  });

  it('usa o sentido padrão de cada coluna ao trocar', () => {
    expect(nextSort({ key: 'count', direction: 'desc' }, 'word')).toEqual({
      key: 'word',
      direction: 'asc',
    });
    expect(nextSort({ key: 'word', direction: 'asc' }, 'count')).toEqual({
      key: 'count',
      direction: 'desc',
    });
  });
});
