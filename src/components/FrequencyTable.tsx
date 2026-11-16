import { CaretDown, CaretUp, CaretUpDown } from '@phosphor-icons/react';
import type { CSSProperties } from 'react';
import type { SortKey, SortState } from '../lib/sortRows';
import type { WordCount } from '../types/wordCount';
import styles from './FrequencyTable.module.css';

type FrequencyTableProps = {
  rows: WordCount[];
  emptyMessage: string;
  sort: SortState;
  onSort: (key: SortKey) => void;
};

export function FrequencyTable({ rows, emptyMessage, sort, onSort }: FrequencyTableProps) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  function header(key: SortKey, label: string, className?: string) {
    const active = sort.key === key;
    const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
    const SortIcon = active ? (sort.direction === 'asc' ? CaretUp : CaretDown) : CaretUpDown;
    return (
      <th scope="col" className={className} aria-sort={ariaSort}>
        <button type="button" className={styles.sortButton} onClick={() => onSort(key)}>
          {label}
          <SortIcon
            size={14}
            weight="bold"
            aria-hidden="true"
            className={active ? styles.arrowActive : styles.arrow}
          />
        </button>
      </th>
    );
  }

  return (
    <table className={styles.table}>
      <caption className={styles.caption}>Frequência de palavras</caption>
      <thead>
        <tr>
          {header('word', 'Palavra')}
          {header('count', 'Ocorrências', styles.number)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={2} className={styles.empty}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map(({ word, count }) => (
            <tr
              key={word}
              className={styles.row}
              style={{ '--pct': `${(count / max) * 100}%` } as CSSProperties}
            >
              <td>{word}</td>
              <td className={styles.number}>{count}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
