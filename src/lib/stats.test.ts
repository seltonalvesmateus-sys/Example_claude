import { describe, expect, it } from 'vitest';
import { getStats } from './stats';

describe('getStats', () => {
  it('calcula total, únicas e a mais frequente', () => {
    const rows = [
      { word: 'sol', count: 3 },
      { word: 'lua', count: 1 },
    ];
    expect(getStats(rows)).toEqual({
      totalWords: 4,
      uniqueWords: 2,
      topWord: { word: 'sol', count: 3 },
    });
  });

  it('lida com lista vazia', () => {
    expect(getStats([])).toEqual({ totalWords: 0, uniqueWords: 0, topWord: null });
  });
});
