import { Injector } from 'di';
import type { ConfigOptions } from 'karma';
import type { DiFactory } from '@/types/diFactory';
import viteServerFactory from '@/factory/viteServerFactory';
import { scheduleMock, serveFileMock } from './mockFn';
import { mergeWith, noop } from 'lodash';

const executor: DiFactory = () => ({
  schedule: scheduleMock,
});
executor.$inject = [];
const logger: DiFactory = () => ({
  create: () => {
    return {
      info: noop,
      debug: noop,
      warn: noop,
      error: noop,
    };
  },
});
logger.$inject = [];

const serveFile: DiFactory = () => serveFileMock;
serveFile.$inject = [];

class Config {
  basePath = './';
  urlRoot = '/';
  reporters = [];
  frameworks = [];
  plugins = [];
  files = [];

  set(newConfig: ConfigOptions) {
    mergeWith(this, newConfig, (obj, src) => {
      if (Array.isArray(src)) {
        return src;
      }
    });
  }
}

export default function createInjector(userConfig?: ConfigOptions) {
  const config = new Config();
  userConfig && config.set(userConfig);
  const injector = new Injector([
    {
      config: ['value', config],
      logger: ['factory', logger],
      serveFile: ['factory', serveFile],
      vite: ['factory', viteServerFactory],
      executor: ['factory', executor],
    },
  ]);

  return injector;
}
