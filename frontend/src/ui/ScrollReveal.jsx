import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const REVEAL_SELECTOR = [
  'main > section',
  'main > article',
  'main > div > section',
  'main > div > article',
  'main .workspace-panel',
  'main .settings-card',
  'main .match-card',
  'main .try-card',
  'main .public-project-card',
  'main .public-feed-post',
].join(', ');

export default function ScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const observed = new Set();
    let revealIndex = 0;
    let intersectionObserver;

    const observeElements = (root) => {
      const elements = [...root.querySelectorAll(REVEAL_SELECTOR)];
      if (root instanceof Element && root.matches(REVEAL_SELECTOR)) elements.unshift(root);
      elements.forEach((element) => {
        if (observed.has(element)) {
          return;
        }

        observed.add(element);
        element.classList.add('scroll-reveal');
        element.style.setProperty('--reveal-delay', `${Math.min((revealIndex % 5) * 65, 260)}ms`);
        revealIndex += 1;
        intersectionObserver.observe(element);
      });
    };

    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-revealed');
        intersectionObserver.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -9% 0px',
      threshold: 0.08,
    });

    observeElements(document);
    // Inspect only new subtrees, not the entire page for every text update.
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) observeElements(node);
        }
      }
      for (const element of observed) {
        if (!element.isConnected) {
          intersectionObserver.unobserve(element);
          observed.delete(element);
        }
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      observed.forEach((element) => {
        element.classList.remove('scroll-reveal', 'is-revealed');
        element.style.removeProperty('--reveal-delay');
      });
    };
  }, [location.pathname, location.search]);

  return null;
}
