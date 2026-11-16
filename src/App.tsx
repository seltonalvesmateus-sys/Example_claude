import { useMemo, useRef, useState } from 'react';
import styles from './App.module.css';
import { Options } from './components/Options';
import { Results } from './components/Results';
import { TextInput } from './components/TextInput';
import { ThemeToggle } from './components/ThemeToggle';
import { UrlFetcher } from './components/UrlFetcher';
import { useLocalStorage } from './hooks/useLocalStorage';
import { HOME_HASH } from './hooks/useRoute';
import { MAX_CHARS } from './lib/constants';
import { countWords } from './lib/countWords';
import { fetchUrlText } from './lib/fetchUrlText';
import { readTextFile } from './lib/readTextFile';
import { SAMPLE_TEXT } from './lib/sample';
import { TEXT_STORAGE_KEY } from './lib/storageKeys';
import { getStopwords, STOPWORD_OPTIONS, type StopwordLanguage } from './lib/stopwords';

const EMPTY_TEXT_ERROR = 'Digite ou cole um texto antes de clicar em Translate.';

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isStopwordLanguage = (value: unknown): value is StopwordLanguage =>
  STOPWORD_OPTIONS.some((option) => option.value === value);

export default function App() {
  // Texto e opções são lembrados entre visitas (localStorage).
  const [storedText, setText] = useLocalStorage(TEXT_STORAGE_KEY, '', isString);
  const text = storedText.slice(0, MAX_CHARS);
  const [caseSensitive, setCaseSensitive] = useLocalStorage('wf:case', false, isBoolean);
  const [stopwords, setStopwords] = useLocalStorage<StopwordLanguage>(
    'wf:stopwords',
    'none',
    isStopwordLanguage,
  );

  // Texto analisado no último clique em Translate (null = ainda não analisado).
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mudar as opções reprocessa o último texto analisado, sem precisar clicar de novo.
  const rows = useMemo(
    () =>
      submitted === null
        ? []
        : countWords(submitted, { caseSensitive, ignore: getStopwords(stopwords) }),
    [submitted, caseSensitive, stopwords],
  );

  function handleChange(value: string) {
    setText(value);
    if (error) setError(null);
    if (notice) setNotice(null);
  }

  function handleTranslate() {
    if (text.trim() === '') {
      setError(EMPTY_TEXT_ERROR);
      setSubmitted(null);
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setSubmitted(text);
  }

  function handleClear() {
    setText('');
    setSubmitted(null);
    setError(null);
    setUrlError(null);
    setNotice(null);
    inputRef.current?.focus();
  }

  function handleSample() {
    setText(SAMPLE_TEXT);
    setError(null);
    setNotice(null);
    inputRef.current?.focus();
  }

  async function handleUrl(url: string) {
    setUrlError(null);
    setNotice(null);
    setFetchingUrl(true);
    try {
      const page = await fetchUrlText(url);
      const name = page.title.length > 60 ? `${page.title.slice(0, 60)}…` : page.title;
      setText(page.text.slice(0, MAX_CHARS));
      setError(null);
      setNotice(
        page.text.length > MAX_CHARS
          ? `A página "${name}" tem mais de ${MAX_CHARS} caracteres: usamos só os primeiros ${MAX_CHARS}.`
          : `Texto de "${name}" carregado.`,
      );
      inputRef.current?.focus();
    } catch (reason) {
      setUrlError(reason instanceof Error ? reason.message : 'Não foi possível buscar a página.');
    } finally {
      setFetchingUrl(false);
    }
  }

  async function handleFile(file: File) {
    try {
      const { text: fileText, truncated } = await readTextFile(file);
      setText(fileText);
      setError(null);
      setNotice(
        truncated
          ? `Arquivo "${file.name}" tem mais de ${MAX_CHARS} caracteres: usamos só os primeiros ${MAX_CHARS}.`
          : `Arquivo "${file.name}" carregado.`,
      );
      inputRef.current?.focus();
    } catch (reason) {
      setNotice(null);
      setError(reason instanceof Error ? reason.message : 'Não foi possível abrir o arquivo.');
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Word Frequency</h1>
        <div className={styles.headerActions}>
          <a href={HOME_HASH} className={styles.homeLink}>
            ← Sobre o projeto
          </a>
          <ThemeToggle />
        </div>
      </header>
      <TextInput
        value={text}
        error={error}
        notice={notice}
        inputRef={inputRef}
        onChange={handleChange}
        onSubmit={handleTranslate}
        onClear={handleClear}
        onSample={handleSample}
        onFile={handleFile}
      />
      <UrlFetcher loading={fetchingUrl} error={urlError} onFetch={handleUrl} />
      <Options
        caseSensitive={caseSensitive}
        stopwords={stopwords}
        onCaseSensitiveChange={setCaseSensitive}
        onStopwordsChange={setStopwords}
      />
      <Results rows={rows} analyzed={submitted !== null} />
    </main>
  );
}
