import { useState } from 'react';
import { downloadCsv, toTsv } from '../lib/export';
import { getStats } from '../lib/stats';
import { DEFAULT_SORT, nextSort, sortRows, type SortState } from '../lib/sortRows';
import type { WordCount } from '../types/wordCount';
import { FrequencyChart } from './FrequencyChart';
import { FrequencyTable } from './FrequencyTable';
import styles from './Results.module.css';
import { Summary } from './Summary';

type ResultsProps = {
  rows: WordCount[];
  // false antes da primeira análise; true depois (mesmo que não haja palavras).
  analyzed: boolean;
};

export function Results({ rows, analyzed }: ResultsProps) {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const term = query.trim().toLowerCase();
  const filteredRows = term ? rows.filter(({ word }) => word.toLowerCase().includes(term)) : rows;
  const visibleRows = sortRows(filteredRows, sort);

  let emptyMessage = 'Nenhum resultado ainda. Digite um texto e clique em Translate.';
  if (analyzed) emptyMessage = 'Nenhuma palavra encontrada no texto.';
  if (analyzed && rows.length > 0) emptyMessage = 'Nenhuma palavra corresponde ao filtro.';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toTsv(visibleRows));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.results}>
      {rows.length > 0 && (
        <>
          <Summary stats={getStats(rows)} />
          <FrequencyChart rows={rows} />
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <span className={styles.srOnly}>Filtrar palavras</span>
              <input
                type="search"
                value={query}
                placeholder="Filtrar palavras..."
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button type="button" onClick={handleCopy}>
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={visibleRows.length === 0}
              onClick={() => downloadCsv(visibleRows)}
            >
              Salvar em CSV
            </button>
          </div>
        </>
      )}
      <FrequencyTable
        rows={visibleRows}
        emptyMessage={emptyMessage}
        sort={sort}
        onSort={(key) => setSort((current) => nextSort(current, key))}
      />
    </div>
  );
}
