import type { KarmaViteConfig } from './core';
declare module 'karma' {
  export interface ConfigOptions {
    vite?: KarmaViteConfig;
  }
}
