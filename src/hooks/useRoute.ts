import { useSyncExternalStore } from 'react';

export type Route = 'landing' | 'app';

export const APP_HASH = '#/app';
export const HOME_HASH = '#/';

function readRoute(): Route {
  return window.location.hash === APP_HASH ? 'app' : 'landing';
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

/**
 * Rota mínima baseada no hash da URL: "#/app" abre o aplicativo e qualquer outra coisa
 * (inclusive âncoras como "#como-funciona") mostra a landing page.
 */
export function useRoute(): Route {
  return useSyncExternalStore(subscribe, readRoute, () => 'landing');
}
