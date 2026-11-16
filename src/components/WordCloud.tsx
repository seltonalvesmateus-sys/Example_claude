import type { CSSProperties } from 'react';
import { cloudWords, seriesColor } from '../lib/chartData';
import type { WordCount } from '../types/wordCount';
import styles from './WordCloud.module.css';

type WordCloudProps = {
  rows: WordCount[];
};

export function WordCloud({ rows }: WordCloudProps) {
  const words = cloudWords(rows);

  return (
    <ul className={styles.cloud}>
      {words.map(({ word, count, weight }, index) => {
        const style = {
          '--weight': weight,
          color: seriesColor(index),
        } as CSSProperties;
        return (
          <li key={word} className={styles.word} style={style} title={`${word}: ${count}`}>
            {word}
          </li>
        );
      })}
    </ul>
  );
}
