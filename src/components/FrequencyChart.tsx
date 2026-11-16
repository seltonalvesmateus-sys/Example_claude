import { useRef, useState, type CSSProperties } from 'react';
import type { WordCount } from '../types/wordCount';
import { DonutChart } from './DonutChart';
import styles from './FrequencyChart.module.css';
import { LengthChart } from './LengthChart';
import { WordCloud } from './WordCloud';

const TOP_N = 10;

type ChartMode = 'bars' | 'bubbles' | 'cloud' | 'donut' | 'length';

const MODES: { value: ChartMode; label: string }[] = [
  { value: 'bars', label: 'Colunas' },
  { value: 'bubbles', label: 'Bolhas' },
  { value: 'cloud', label: 'Nuvem' },
  { value: 'donut', label: 'Pizza' },
  { value: 'length', label: 'Tamanho' },
];

const TITLES: Record<ChartMode, (shown: number) => string> = {
  bars: (shown) => `Top ${shown} palavras`,
  bubbles: (shown) => `Top ${shown} palavras`,
  cloud: () => 'Nuvem de palavras',
  donut: () => 'Participação das mais frequentes',
  length: () => 'Tamanho das palavras',
};

type FrequencyChartProps = {
  rows: WordCount[];
};

export function FrequencyChart({ rows }: FrequencyChartProps) {
  const [mode, setMode] = useState<ChartMode>('bars');
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const top = rows.slice(0, TOP_N);
  const max = top[0]?.count ?? 1;

  async function handleDownload() {
    const node = sectionRef.current;
    if (!node) return;

    setDownloading(true);
    setDownloadFailed(false);
    try {
      // Carregada só quando o usuário pede a imagem, para não pesar no carregamento inicial.
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: getComputedStyle(node).backgroundColor,
        // Os controles (seletor e botão) não entram na imagem.
        filter: (element) => !(element instanceof HTMLElement && element.dataset.export === 'skip'),
      });
      const link = document.createElement('a');
      link.download = `grafico-${mode}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section ref={sectionRef} className={styles.chart} aria-label="Gráfico de frequência">
      <div className={styles.header}>
        <h2 className={styles.title}>{TITLES[mode](top.length)}</h2>
        <div className={styles.controls} data-export="skip">
          <div className={styles.toggle} role="group" aria-label="Tipo de gráfico">
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                className={mode === value ? styles.active : ''}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.download}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Gerando...' : 'Baixar PNG'}
          </button>
        </div>
      </div>
      {downloadFailed && (
        <p role="alert" className={styles.downloadError} data-export="skip">
          Não foi possível gerar a imagem.
        </p>
      )}

      {mode === 'bars' && (
        <ul className={styles.bars}>
          {top.map(({ word, count }) => (
            <li key={word} className={styles.barRow}>
              <span className={styles.barLabel}>{word}</span>
              <span className={styles.barTrack}>
                <span className={styles.barFill} style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <span className={styles.barValue}>{count}</span>
            </li>
          ))}
        </ul>
      )}

      {mode === 'bubbles' && (
        <ul className={styles.bubbles}>
          {top.map(({ word, count }) => {
            const ratio = count / max;
            const style = {
              '--size': `${56 + 84 * Math.sqrt(ratio)}px`,
              '--strength': `${Math.round(45 + 55 * ratio)}%`,
            } as CSSProperties;
            return (
              <li key={word} className={styles.bubble} style={style} title={`${word}: ${count}`}>
                <span className={styles.bubbleWord}>{word}</span>
                <span className={styles.bubbleCount}>{count}</span>
              </li>
            );
          })}
        </ul>
      )}

      {mode === 'cloud' && <WordCloud rows={rows} />}
      {mode === 'donut' && <DonutChart rows={rows} />}
      {mode === 'length' && <LengthChart rows={rows} />}
    </section>
  );
}
