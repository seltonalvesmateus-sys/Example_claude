import { STOPWORD_OPTIONS, type StopwordLanguage } from '../lib/stopwords';
import styles from './Options.module.css';

type OptionsProps = {
  caseSensitive: boolean;
  stopwords: StopwordLanguage;
  onCaseSensitiveChange: (value: boolean) => void;
  onStopwordsChange: (value: StopwordLanguage) => void;
};

export function Options({
  caseSensitive,
  stopwords,
  onCaseSensitiveChange,
  onStopwordsChange,
}: OptionsProps) {
  return (
    <fieldset className={styles.options}>
      <legend className={styles.legend}>Opções de análise</legend>
      <label className={styles.field}>
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(event) => onCaseSensitiveChange(event.target.checked)}
        />
        Diferenciar maiúsculas de minúsculas
      </label>
      <label className={styles.field}>
        Ignorar palavras comuns
        <select
          value={stopwords}
          onChange={(event) => onStopwordsChange(event.target.value as StopwordLanguage)}
        >
          {STOPWORD_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
