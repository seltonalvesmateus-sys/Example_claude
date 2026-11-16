import type { WordCount } from '../types/wordCount';

const PALETTE_HUES = [245, 160, 330, 30, 200, 100, 275, 0];

/** Cor da série i, com luminosidade definida pelo tema (--chart-l). */
export function seriesColor(index: number): string {
  return `hsl(${PALETTE_HUES[index % PALETTE_HUES.length]} 70% var(--chart-l))`;
}

export type CloudWord = WordCount & {
  /** 0..1: peso da palavra em relação à mais frequente (escala suavizada). */
  weight: number;
};

/**
 * Ordena as palavras para a nuvem: as maiores ficam no meio e as menores nas pontas,
 * o que dá o formato característico de nuvem em um layout que quebra linhas.
 */
export function cloudWords(rows: WordCount[], limit = 40): CloudWord[] {
  const top = rows.slice(0, limit);
  const max = top[0]?.count ?? 1;
  const min = top[top.length - 1]?.count ?? 1;
  const span = Math.log(max) - Math.log(min);

  const weighted = top.map((row) => ({
    ...row,
    weight: span === 0 ? 1 : (Math.log(row.count) - Math.log(min)) / span,
  }));

  const ordered: CloudWord[] = [];
  weighted.forEach((item, index) => {
    if (index % 2 === 0) ordered.push(item);
    else ordered.unshift(item);
  });
  return ordered;
}

export type DonutSlice = {
  label: string;
  count: number;
  /** Percentual do total de palavras, de 0 a 100. */
  percent: number;
};

/** Top N palavras mais uma fatia "outras" com o restante. */
export function donutSlices(rows: WordCount[], topN = 5): DonutSlice[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return [];

  const slices = rows.slice(0, topN).map(({ word, count }) => ({
    label: word,
    count,
    percent: (count / total) * 100,
  }));

  const othersCount = rows.slice(topN).reduce((sum, row) => sum + row.count, 0);
  if (othersCount > 0) {
    slices.push({ label: 'outras', count: othersCount, percent: (othersCount / total) * 100 });
  }
  return slices;
}

export type LengthBucket = {
  length: number;
  /** true no último grupo, que reúne tudo a partir de `length`. */
  orMore: boolean;
  /** Quantidade de palavras (contando repetições) com esse tamanho. */
  count: number;
};

/** Distribuição das palavras pelo número de letras, de 1 até maxLength ou mais. */
export function lengthDistribution(rows: WordCount[], maxLength = 12): LengthBucket[] {
  const buckets: LengthBucket[] = Array.from({ length: maxLength }, (_, index) => ({
    length: index + 1,
    orMore: index + 1 === maxLength,
    count: 0,
  }));

  for (const { word, count } of rows) {
    const size = [...word].length;
    const bucket = buckets[Math.min(size, maxLength) - 1];
    bucket.count += count;
  }

  // Descarta zeros nas pontas para o gráfico não ficar com espaço vazio.
  const first = buckets.findIndex((bucket) => bucket.count > 0);
  if (first === -1) return [];
  let last = buckets.length - 1;
  while (buckets[last].count === 0) last -= 1;
  return buckets.slice(first, last + 1);
}
