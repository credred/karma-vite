import { Injector } from 'di';
import type { ConfigOptions } from 'karma';
import type { DiFactory } from '@/types/diFactory';
import viteServerFactory from '@/factory/viteServerFactory';
import { scheduleMock, serveFileMock } from './mockFn';
import { merge, noop } from 'lodash';

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

const commonConfig = {
  basePath: './',
  urlRoot: '/',
  reporters: [],
};

export default function createInjector(config?: ConfigOptions) {
  const injector = new Injector([
    {
      config: ['value', merge({}, commonConfig, config)],
      logger: ['factory', logger],
      serveFile: ['factory', serveFile],
      vite: ['factory', viteServerFactory],
      executor: ['factory', executor],
    },
  ]);

  return injector;
}
