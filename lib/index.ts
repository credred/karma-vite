import beforeMiddlewareFactory from './factory/beforeMiddlewareFactory';
import frameworkFactory from './factory/frameworkFactory';
import middlewareFactory from './factory/middlewareFactory';
import viteServerFactory from './factory/viteServerFactory';
export type { KarmaViteConfig } from './types/core';

export default {
  'framework:vite': ['factory', frameworkFactory],
  'middleware:vite': ['factory', middlewareFactory],
  'middleware:vite-before': ['factory', beforeMiddlewareFactory],
  vite: ['factory', viteServerFactory],
} as const;
