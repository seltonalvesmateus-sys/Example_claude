import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  // Os testes do servidor rodam em ambiente node, sem DOM: não há nada para limpar.
  if (typeof document === 'undefined') return;
  // Isola os testes: nada de texto, opções ou tema salvos vazando de um teste para outro.
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
