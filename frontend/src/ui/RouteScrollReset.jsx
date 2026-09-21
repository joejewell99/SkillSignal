import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteScrollReset() {
  const location = useLocation();

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'auto' });
          return;
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
