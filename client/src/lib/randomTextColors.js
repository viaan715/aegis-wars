import { useCallback, useRef } from 'react';

export const DARK_BG_PALETTE = [
  '#e0b866',
  '#8fb4d1',
  '#8ed6a8',
  '#e2a9e0',
  '#f0a898',
  '#c9c9e8',
  '#f3eee4',
  '#7fd4c8',
  '#e8c86b',
  '#a8b8e8',
];

export const LIGHT_BG_PALETTE = [
  '#8a5a12',
  '#1f4e6b',
  '#1f6b3f',
  '#7a1f6b',
  '#8a2f12',
  '#2f2f7a',
  '#5a4a1f',
  '#0f5f52',
  '#6b1f3a',
  '#3a4a0f',
];

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT']);

// Nested surfaces (e.g. the light-background fill preview inside the dark
// builder) run their own useRandomTextColors call and mark their own root
// with this attribute, so an ancestor's colorer knows to leave that subtree
// alone rather than fighting over it with the wrong palette.
export const COLOR_SCOPE_ATTR = 'data-color-scope-root';

function colorTextNodesRandomly(root, palette) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(el) {
      if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
      if (el !== root && el.hasAttribute(COLOR_SCOPE_ATTR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let el = walker.currentNode;
  do {
    if (SKIP_TAGS.has(el.tagName)) continue;
    if (el !== root && el.hasAttribute(COLOR_SCOPE_ATTR)) continue;
    const hasDirectText = Array.from(el.childNodes).some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
    );
    if (hasDirectText) {
      el.style.color = palette[Math.floor(Math.random() * palette.length)];
    }
  } while ((el = walker.nextNode()));
}

// Returns a ref callback rather than taking a ref object. Several pages
// render null (or a different subtree entirely) on their first pass while
// data loads, then swap in the real content on a later re-render — a plain
// `useEffect(fn, [])` tied to the first (empty) render would miss that node
// entirely. A callback ref fires exactly when the real DOM node attaches,
// however many renders that takes, so setup always happens at the right time.
export function useRandomTextColors(palette = DARK_BG_PALETTE) {
  const observerRef = useRef(null);

  return useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      colorTextNodesRandomly(node, palette);

      // Content that loads asynchronously (fetched lists, modals, charts)
      // mounts after this initial pass, so keep watching and color it as it
      // appears. Also watch characterData: an element that starts out empty
      // (e.g. a status label with no text yet) is skipped by the initial
      // pass, and later getting text via a text-node content update is not
      // a childList change — only characterData catches that.
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const added of mutation.addedNodes) {
              if (added.nodeType === Node.ELEMENT_NODE) {
                colorTextNodesRandomly(added, palette);
              } else if (added.nodeType === Node.TEXT_NODE && added.textContent.trim().length > 0) {
                // React sometimes renders an empty string as no text node at
                // all, then inserts a fresh text node once real content
                // shows up — that's a childList addition of a bare text
                // node, not an element, so it needs its own handling here.
                const el = added.parentElement;
                if (el && !SKIP_TAGS.has(el.tagName)) {
                  el.style.color = palette[Math.floor(Math.random() * palette.length)];
                }
              }
            }
          } else if (mutation.type === 'characterData') {
            const el = mutation.target.parentElement;
            if (el && !SKIP_TAGS.has(el.tagName) && !el.style.color && mutation.target.textContent.trim().length > 0) {
              el.style.color = palette[Math.floor(Math.random() * palette.length)];
            }
          }
        }
      });
      observer.observe(node, { childList: true, subtree: true, characterData: true });
      observerRef.current = observer;
    },
    // Intentionally ignore palette changes after first attach — a page's
    // palette choice is fixed for its lifetime, this only reacts to the
    // container node itself changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}
