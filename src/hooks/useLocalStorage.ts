import { useEffect, useState } from 'react';

/**
 * useState que também persiste no localStorage. Se o armazenamento estiver bloqueado
 * ou o valor guardado for inválido, cai no valor inicial sem quebrar o app.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  isValid: (value: unknown) => value is T = (value): value is T => value !== undefined,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Armazenamento indisponível: o app continua funcionando, só não persiste.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
