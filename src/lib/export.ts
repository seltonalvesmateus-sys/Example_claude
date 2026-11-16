import type { WordCount } from '../types/wordCount';

// Ponto e vírgula é o separador que o Excel em português do Brasil espera
// (a vírgula é o separador decimal), e Google Sheets/LibreOffice também reconhecem.
const CSV_SEPARATOR = ';';
const UTF8_BOM = '﻿';

function escapeCsv(value: string): string {
  return /[";,\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** Gera o CSV (palavra;ocorrencias) da tabela. */
export function toCsv(rows: WordCount[]): string {
  const lines = rows.map(({ word, count }) => [escapeCsv(word), count].join(CSV_SEPARATOR));
  return [['palavra', 'ocorrencias'].join(CSV_SEPARATOR), ...lines].join('\r\n');
}

/** Gera texto separado por tabulação, bom para colar em planilhas. */
export function toTsv(rows: WordCount[]): string {
  return rows.map(({ word, count }) => `${word}\t${count}`).join('\n');
}

/** Dispara o download de um CSV no navegador (BOM para o Excel entender os acentos). */
export function downloadCsv(rows: WordCount[], filename = 'frequencia-de-palavras.csv') {
  const blob = new Blob([UTF8_BOM, toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // Alguns navegadores só aceitam o clique se o link estiver no documento.
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Adia a liberação para o navegador conseguir iniciar o download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
