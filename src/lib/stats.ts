import type { WordCount } from '../types/wordCount';

export type Stats = {
  totalWords: number;
  uniqueWords: number;
  topWord: WordCount | null;
};

export function getStats(rows: WordCount[]): Stats {
  return {
    totalWords: rows.reduce((sum, row) => sum + row.count, 0),
    uniqueWords: rows.length,
    topWord: rows[0] ?? null,
  };
}
