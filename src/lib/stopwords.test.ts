import { describe, expect, it } from 'vitest';
import { getStopwords } from './stopwords';

describe('getStopwords', () => {
  it('retorna undefined quando nenhum idioma é escolhido', () => {
    expect(getStopwords('none')).toBeUndefined();
  });

  it('retorna as palavras de cada idioma', () => {
    expect(getStopwords('pt')?.has('de')).toBe(true);
    expect(getStopwords('pt')?.has('the')).toBe(false);
    expect(getStopwords('en')?.has('the')).toBe(true);
    expect(getStopwords('en')?.has('de')).toBe(false);
  });

  it('junta os dois idiomas em "both"', () => {
    expect(getStopwords('both')?.has('de')).toBe(true);
    expect(getStopwords('both')?.has('the')).toBe(true);
  });
});
