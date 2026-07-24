// Fix for getter-only 'fetch' property on Window/globalThis in browser/SSR environments
try {
  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
  if (g && typeof g.fetch === 'function') {
    const desc = Object.getOwnPropertyDescriptor(g, 'fetch') ||
                 Object.getOwnPropertyDescriptor(Object.getPrototypeOf(g) || {}, 'fetch');
    if (desc && desc.get && !desc.set) {
      const origFetch = g.fetch.bind(g);
      Object.defineProperty(g, 'fetch', {
        value: origFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  }
} catch {
  // ignore
}

import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

