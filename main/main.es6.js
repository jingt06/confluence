import 'zone.js';
import 'reflect-metadata';
import '../lib/app/app.module';

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

export function main() {
  platformBrowserDynamic().bootstrapModule(app.AppModule);
}

if (document.readyState === 'complete') {
  main();
} else {
  document.addEventListener('DOMContentLoaded', main);
}
