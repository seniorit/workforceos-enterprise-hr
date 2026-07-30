if (typeof window !== 'undefined') {
  try {
    let _f = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => _f,
      set: (v) => { _f = v; },
      configurable: true,
      enumerable: true,
    });
  } catch {
    // Ignore fetch descriptor error
  }
}

import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
