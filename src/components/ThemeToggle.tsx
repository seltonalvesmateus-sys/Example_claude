import { Monitor, Moon, Sun } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import styles from './ThemeToggle.module.css';

type Theme = 'system' | 'light' | 'dark';

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const LABEL: Record<Theme, string> = { system: 'Sistema', light: 'Claro', dark: 'Escuro' };
const ICON = { system: Monitor, light: Sun, dark: Moon };

function isTheme(value: unknown): value is Theme {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<Theme>('wf:theme', 'system', isTheme);
  const ThemeIcon = ICON[theme];

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Tema: ${LABEL[theme]}. Clique para alterar.`}
    >
      <ThemeIcon size={18} aria-hidden="true" /> {LABEL[theme]}
    </button>
  );
}
