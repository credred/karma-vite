import type { DiFactory } from '../types/diFactory';
import type { Config } from '../types/karma';
import type { ViteProvider } from './viteServerFactory';

const frameworkFactory: DiFactory<
  [vite: ViteProvider, config: Config],
  ViteProvider
> = (vite, config) => {
  if (config.vite?.autoInit !== false) {
    config.set({
      beforeMiddleware: (config.beforeMiddleware || []).concat(['vite-before']),
      middleware: (config.middleware || []).concat(['vite']),
    });
  }
  config.files = config.files?.map((file) => {
    if (typeof file === 'object' && file.vite) {
      return {
        ...file,
        type: 'module',
        watched: false,
        served: false,
      };
    }
    return file;
  });
  return vite;
};

frameworkFactory.$inject = ['vite', 'config'];

export default frameworkFactory;
