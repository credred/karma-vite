import beforeMiddlewareFactory from './factory/beforeMiddlewareFactory';
import frameworkFactory from './factory/frameworkFactory';
import middlewareFactory from './factory/middlewareFactory';
import viteServerFactory from './factory/viteServerFactory';
import type { KarmaViteConfig } from './type';

export default {
  'framework:vite': ['factory', frameworkFactory],
  'middleware:vite': ['factory', middlewareFactory],
  'middleware:vite-before': ['factory', beforeMiddlewareFactory],
  vite: ['factory', viteServerFactory],
} as const;

declare module 'karma' {
  export interface FilePattern {
    /**
     * extension fields for karma-vite.
     *  This is equivalent to the following configuration
     * {
     *    type: 'module',
     *    watched: false,
     *    served: false,
     * }
     */
    vite?: boolean;
  }

  export interface ConfigOptions {
    vite?: KarmaViteConfig;
  }
}
