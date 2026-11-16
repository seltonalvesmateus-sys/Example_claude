import { useEffect, useRef } from 'react';
import App from './App';
import { useRoute } from './hooks/useRoute';
import { Landing } from './landing/Landing';

export default function Root() {
  const route = useRoute();
  const firstRender = useRef(true);

  // Ao trocar de página (landing <-> app), volta ao topo como numa navegação normal.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [route]);

  return route === 'app' ? <App /> : <Landing />;
}
