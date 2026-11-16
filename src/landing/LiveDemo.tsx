import { ArrowRight } from '@phosphor-icons/react';
import { useId, useMemo, useState } from 'react';
import { APP_HASH } from '../hooks/useRoute';
import { countWords } from '../lib/countWords';
import { TEXT_STORAGE_KEY } from '../lib/storageKeys';
import styles from './LiveDemo.module.css';

const DEFAULT_TEXT = 'Quem conta um conto aumenta um ponto. Um conto puxa outro conto.';
const DEMO_LIMIT = 280;
const TOP_N = 5;

/** Demonstração ao vivo: o visitante edita o texto e vê a frequência mudar na hora. */
export function LiveDemo() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const inputId = useId();
  const rows = useMemo(() => countWords(text).slice(0, TOP_N), [text]);
  const max = rows[0]?.count ?? 1;

  function openInApp() {
    // Leva o texto da demonstração para a caixa principal do app.
    try {
      localStorage.setItem(TEXT_STORAGE_KEY, JSON.stringify(text));
    } catch {
      // Sem armazenamento: o app abre vazio, mas continua funcionando.
    }
    window.location.hash = APP_HASH;
  }

  return (
    <section className={styles.demo} aria-label="Demonstração interativa">
      <div className={styles.block}>
        <label htmlFor={inputId} className={styles.label}>
          Experimente: edite o texto
        </label>
        <textarea
          id={inputId}
          className={styles.textarea}
          value={text}
          maxLength={DEMO_LIMIT}
          rows={3}
          onChange={(event) => setText(event.target.value)}
        />
        <span className={styles.counter}>
          {text.length} / {DEMO_LIMIT}
        </span>
      </div>

      <div className={styles.block}>
        <span className={styles.label}>Palavras mais frequentes</span>
        {rows.length === 0 ? (
          <p className={styles.empty}>Digite algo para ver as palavras.</p>
        ) : (
          <ul className={styles.bars}>
            {rows.map(({ word, count }) => (
              <li key={word} className={styles.row}>
                <span className={styles.word}>{word}</span>
                <span className={styles.track}>
                  <span className={styles.fill} style={{ width: `${(count / max) * 100}%` }} />
                </span>
                <span className={styles.count}>{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" className={styles.button} onClick={openInApp} disabled={!text.trim()}>
        Analisar no app
        <ArrowRight size={18} weight="bold" aria-hidden="true" />
      </button>
    </section>
  );
}
