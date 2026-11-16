import { describe, expect, it } from 'vitest';
import { FILE_TOO_BIG_MESSAGE, INVALID_FILE_MESSAGE, readTextFile } from './readTextFile';

describe('readTextFile', () => {
  it('lê o conteúdo de um .txt', async () => {
    const file = new File(['olá mundo'], 'a.txt', { type: 'text/plain' });
    expect(await readTextFile(file)).toEqual({ text: 'olá mundo', truncated: false });
  });

  it('aceita .txt mesmo sem tipo MIME', async () => {
    const file = new File(['oi'], 'nota.TXT');
    expect((await readTextFile(file)).text).toBe('oi');
  });

  it('corta no limite e avisa que truncou', async () => {
    const file = new File(['a'.repeat(30)], 'a.txt', { type: 'text/plain' });
    expect(await readTextFile(file, 10)).toEqual({ text: 'a'.repeat(10), truncated: true });
  });

  it('rejeita arquivos que não são texto', async () => {
    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    await expect(readTextFile(file)).rejects.toThrow(INVALID_FILE_MESSAGE);
  });

  it('rejeita arquivos muito grandes', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
    await expect(readTextFile(file)).rejects.toThrow(FILE_TOO_BIG_MESSAGE);
  });
});
