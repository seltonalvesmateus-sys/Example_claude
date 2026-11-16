import type { WordCount } from '../types/wordCount';

// Uma palavra é uma sequência de letras/números (Unicode, então acentos são preservados).
// Hífens e apóstrofos só contam quando ficam entre dois trechos ("guarda-chuva", "d'água").
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export type CountOptions = {
  /** Se true, "Casa" e "casa" são palavras diferentes. Padrão: false. */
  caseSensitive?: boolean;
  /** Palavras (em minúsculas) que devem ser ignoradas, como stopwords. */
  ignore?: ReadonlySet<string>;
};

/**
 * Conta a frequência de cada palavra do texto (modelo Bag of Words).
 * Ordena por frequência decrescente e, em caso de empate, em ordem alfabética.
 */
export function countWords(text: string, options: CountOptions = {}): WordCount[] {
  const { caseSensitive = false, ignore } = options;
  const counts = new Map<string, number>();
  const source = caseSensitive ? text : text.toLowerCase();

  for (const match of source.matchAll(WORD_PATTERN)) {
    const word = match[0];
    if (ignore?.has(word.toLowerCase())) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}
