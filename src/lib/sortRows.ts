import type { WordCount } from '../types/wordCount';

export type SortKey = 'word' | 'count';
export type SortDirection = 'asc' | 'desc';
export type SortState = { key: SortKey; direction: SortDirection };

export const DEFAULT_SORT: SortState = { key: 'count', direction: 'desc' };

/** Retorna uma cópia ordenada. Em empate de contagem, desempata em ordem alfabética. */
export function sortRows(rows: WordCount[], { key, direction }: SortState): WordCount[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) =>
    key === 'word'
      ? sign * a.word.localeCompare(b.word)
      : sign * (a.count - b.count) || a.word.localeCompare(b.word),
  );
}

/** Próximo estado ao clicar num cabeçalho: repetir a coluna inverte, trocar usa o padrão dela. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { key, direction: key === 'word' ? 'asc' : 'desc' };
}
