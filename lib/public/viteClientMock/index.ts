/* eslint-disable @typescript-eslint/no-empty-function */
import type { ViteHotContext } from 'vite/types/hot';
import { ErrorOverlay } from './overlay';

const sheetsMap = new Map();

// https://wicg.github.io/construct-stylesheets
const supportsConstructedSheet = (() => {
  // TODO: re-enable this try block once Chrome fixes the performance of
  // rule insertion in really big stylesheets
  // try {
  //   new CSSStyleSheet()
  //   return true
  // } catch (e) {}
  return false;
})();

export function updateStyle(id: string, content: string): void {
  let style = sheetsMap.get(id);
  if (supportsConstructedSheet && !content.includes('@import')) {
    if (style && !(style instanceof CSSStyleSheet)) {
      removeStyle(id);
      style = undefined;
    }

    if (!style) {
      style = new CSSStyleSheet();
      style.replaceSync(content);
      // @ts-expect-error: using experimental API
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
    } else {
      style.replaceSync(content);
    }
  } else {
    if (style && !(style instanceof HTMLStyleElement)) {
      removeStyle(id);
      style = undefined;
    }

    if (!style) {
      style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.innerHTML = content;
      document.head.appendChild(style);
    } else {
      style.innerHTML = content;
    }
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id: string): void {
  const style = sheetsMap.get(id);
  if (style) {
    if (style instanceof CSSStyleSheet) {
      // @ts-expect-error: using experimental API
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s: CSSStyleSheet) => s !== style,
      );
    } else {
      document.head.removeChild(style);
    }
    sheetsMap.delete(id);
  }
}

export function createHotContext(): ViteHotContext {
  const hot: ViteHotContext = {
    get data() {
      return {};
    },

    accept() {},

    acceptDeps() {
      throw new Error(
        `hot.acceptDeps() is deprecated. ` +
          `Use hot.accept() with the same signature instead.`,
      );
    },

    dispose() {},

    // @ts-expect-error untyped
    prune() {},

    // TODO
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    decline() {},

    invalidate() {
      // TODO should tell the server to re-perform hmr propagation
      // from this module as root
      location.reload();
    },

    // custom events
    on() {},

    send() {},
  };

  return hot;
}

export function injectQuery(url: string, queryToInject: string): string {
  // skip urls that won't be handled by vite
  if (!url.startsWith('.') && !url.startsWith('/')) {
    return url;
  }

  // can't use pathname from URL since it may be relative like ../
  const pathname = url.replace(/#.*$/, '').replace(/\?.*$/, '');
  const { search, hash } = new URL(url, 'http://vitejs.dev');

  return `${pathname}?${queryToInject}${search ? `&` + search.slice(1) : ''}${
    hash || ''
  }`;
}

export { ErrorOverlay };
