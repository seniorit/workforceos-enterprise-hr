// Fix for getter-only 'fetch' property on Window/globalThis in SSR environment
try {
  const g = typeof globalThis !== 'undefined' ? globalThis : null;
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

import {
  BootstrapContext,
  bootstrapApplication,
} from '@angular/platform-browser';
import {App} from './app/app';
import {config} from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);

export default bootstrap;
