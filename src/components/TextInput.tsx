import { useRef, useState, type DragEvent, type KeyboardEvent, type Ref } from 'react';
import { MAX_CHARS } from '../lib/constants';
import { ErrorMessage } from './ErrorMessage';
import styles from './TextInput.module.css';

const WARNING_THRESHOLD = 0.9;

type TextInputProps = {
  value: string;
  error: string | null;
  notice: string | null;
  inputRef?: Ref<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onSample: () => void;
  onFile: (file: File) => void;
};

export function TextInput({
  value,
  error,
  notice,
  inputRef,
  onChange,
  onSubmit,
  onClear,
  onSample,
  onFile,
}: TextInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const nearLimit = value.length >= MAX_CHARS * WARNING_THRESHOLD;
  const atLimit = value.length >= MAX_CHARS;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor="text-input" className={styles.label}>
        Texto para analisar
      </label>
      <div
        className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          id="text-input"
          ref={inputRef}
          className={`${styles.textarea} ${error ? styles.invalid : ''}`}
          value={value}
          maxLength={MAX_CHARS}
          rows={8}
          placeholder="Digite, cole ou arraste um arquivo .txt aqui..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'text-error text-counter' : 'text-counter'}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className={styles.footer}>
        <ErrorMessage id="text-error" message={error} />
        {notice && (
          <p role="status" className={styles.notice}>
            {notice}
          </p>
        )}
        <span
          id="text-counter"
          className={`${styles.counter} ${nearLimit ? styles.counterWarning : ''}`}
        >
          {value.length} / {MAX_CHARS}
          {atLimit && ' (limite atingido)'}
        </span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={onSubmit}>
          Translate
        </button>
        <button type="button" className={styles.secondary} onClick={onSample}>
          Colar exemplo
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => fileInputRef.current?.click()}
        >
          Abrir .txt
        </button>
        <button type="button" className={styles.clear} onClick={onClear}>
          <span aria-hidden="true">✕</span> Limpar texto
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          aria-label="Abrir arquivo de texto"
          className={styles.fileInput}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = ''; // permite escolher o mesmo arquivo de novo
          }}
        />
        <span className={styles.hint}>
          ou pressione <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
        </span>
      </div>
    </div>
  );
}
