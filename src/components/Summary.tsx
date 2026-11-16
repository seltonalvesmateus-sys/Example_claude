import type { Stats } from '../lib/stats';
import styles from './Summary.module.css';

type SummaryProps = {
  stats: Stats;
};

export function Summary({ stats }: SummaryProps) {
  const { totalWords, uniqueWords, topWord } = stats;

  return (
    <dl className={styles.summary}>
      <div className={styles.card}>
        <dt>Total de palavras</dt>
        <dd>{totalWords}</dd>
      </div>
      <div className={styles.card}>
        <dt>Palavras únicas</dt>
        <dd>{uniqueWords}</dd>
      </div>
      <div className={styles.card}>
        <dt>Mais frequente</dt>
        <dd>{topWord ? `${topWord.word} (${topWord.count}×)` : '—'}</dd>
      </div>
    </dl>
  );
}
