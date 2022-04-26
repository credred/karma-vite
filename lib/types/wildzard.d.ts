import type { KarmaViteConfig } from './core';
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
