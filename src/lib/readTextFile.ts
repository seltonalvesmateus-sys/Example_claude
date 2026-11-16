import { MAX_CHARS } from './constants';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const INVALID_FILE_MESSAGE = 'Selecione um arquivo de texto (.txt).';
export const FILE_TOO_BIG_MESSAGE = 'Arquivo muito grande (máximo 5 MB).';

export type FileText = {
  text: string;
  /** true se o arquivo tinha mais de maxChars e foi cortado. */
  truncated: boolean;
};

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsText(file);
  });
}

/** Lê um arquivo .txt e corta o conteúdo no limite de caracteres do app. */
export async function readTextFile(file: File, maxChars = MAX_CHARS): Promise<FileText> {
  const isText = file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt');
  if (!isText) throw new Error(INVALID_FILE_MESSAGE);
  if (file.size > MAX_FILE_BYTES) throw new Error(FILE_TOO_BIG_MESSAGE);

  const content = await readAsText(file);
  return { text: content.slice(0, maxChars), truncated: content.length > maxChars };
}
