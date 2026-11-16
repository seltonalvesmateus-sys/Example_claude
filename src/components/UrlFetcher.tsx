import { useState, type FormEvent } from 'react';
import styles from './UrlFetcher.module.css';

type UrlFetcherProps = {
  loading: boolean;
  error: string | null;
  onFetch: (url: string) => void;
};

export function UrlFetcher({ loading, error, onFetch }: UrlFetcherProps) {
  const [url, setUrl] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!loading) onFetch(url);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="url-input" className={styles.label}>
        Ou busque o texto de uma página da web
      </label>
      <div className={styles.row}>
        <input
          id="url-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          className={`${styles.input} ${error ? styles.invalid : ''}`}
          value={url}
          placeholder="https://exemplo.com/artigo"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'url-error' : undefined}
          onChange={(event) => setUrl(event.target.value)}
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar texto'}
        </button>
      </div>
      {error && (
        <p id="url-error" role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </form>
  );
}
