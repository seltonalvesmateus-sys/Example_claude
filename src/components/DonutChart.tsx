import { donutSlices, seriesColor } from '../lib/chartData';
import type { WordCount } from '../types/wordCount';
import styles from './DonutChart.module.css';

type DonutChartProps = {
  rows: WordCount[];
};

// Com raio 15.9155 a circunferência vale ~100, então o dasharray pode usar porcentagens direto.
const RADIUS = 15.9155;

export function DonutChart({ rows }: DonutChartProps) {
  const slices = donutSlices(rows);
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  // Cada fatia começa onde a anterior terminou; 25 posiciona a primeira no topo (12h).
  const offsets = slices.map((_, index) =>
    slices.slice(0, index).reduce((sum, slice) => sum - slice.percent, 25),
  );

  return (
    <div className={styles.wrapper}>
      <svg viewBox="0 0 42 42" className={styles.svg} role="img" aria-label="Gráfico de pizza">
        <circle cx="21" cy="21" r={RADIUS} className={styles.track} />
        {slices.map((slice, index) => (
          <circle
            key={slice.label}
            cx="21"
            cy="21"
            r={RADIUS}
            className={styles.slice}
            stroke={seriesColor(index)}
            strokeDasharray={`${slice.percent} ${100 - slice.percent}`}
            strokeDashoffset={offsets[index]}
          />
        ))}
        <text x="21" y="21" className={styles.total}>
          {total}
        </text>
        <text x="21" y="25.5" className={styles.totalLabel}>
          palavras
        </text>
      </svg>

      <ul className={styles.legend}>
        {slices.map((slice, index) => (
          <li key={slice.label} className={styles.item}>
            <span className={styles.dot} style={{ background: seriesColor(index) }} />
            <span className={styles.label}>{slice.label}</span>
            <span className={styles.percent}>{slice.percent.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
