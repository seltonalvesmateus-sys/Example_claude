import type { CSSProperties } from 'react';
import { lengthDistribution } from '../lib/chartData';
import type { WordCount } from '../types/wordCount';
import styles from './LengthChart.module.css';

type LengthChartProps = {
  rows: WordCount[];
};

export function LengthChart({ rows }: LengthChartProps) {
  const buckets = lengthDistribution(rows);
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <div>
      <ul className={styles.columns}>
        {buckets.map(({ length, orMore, count }) => (
          <li
            key={length}
            className={styles.column}
            style={{ '--height': `${(count / max) * 100}%` } as CSSProperties}
          >
            <span className={styles.value}>{count}</span>
            <span className={styles.bar} />
            <span className={styles.label}>
              {length}
              {orMore ? '+' : ''}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.caption}>Palavras por número de letras</p>
    </div>
  );
}
