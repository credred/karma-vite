const vitePluginIstanbul = jest.fn().mockReturnValue({
  name: 'vite:istanbul',
});
jest.mock('vite-plugin-istanbul', () => {
  return {
    __esModule: true,
    default: vitePluginIstanbul,
  };
});

import type viteServerFactory from '@/factory/viteServerFactory';
import type { ViteDevServerInternal } from '@/factory/viteServerFactory';
import type { ConfigOptions } from 'karma';
import { scheduleMock, createServerMock } from '@test/_utils/mockFn';
import createInjector from '@test/_utils/createInjector';

function createViteDevServer(config?: ConfigOptions) {
  const injector = createInjector(config);
  return injector.get<ReturnType<typeof viteServerFactory>>('vite');
}

describe('viteServerFactory', () => {
  it('return an object which should be promise with value property', async () => {
    const vitePromise = createViteDevServer();
    expect(typeof vitePromise.then).toBe('function');
    expect(vitePromise.value).toBe(undefined);
    const vite = await vitePromise;
    expect(vitePromise.value).toBe(vite);
  });

  // because of we update only oldest vite server property
  it('the value property of returns object should not change even if vite restarted', async () => {
    const vitePromise = createViteDevServer();
    await vitePromise;
    const oldestViteServer = vitePromise.value;
    await oldestViteServer?.restart();
    expect(oldestViteServer).toBe(vitePromise.value);
  });

  describe('createServer config', () => {
    it('merge user config', async () => {
      const userConfig = {
        base: 'a/b/c/',
        configFile: false,
      } as const;
      await createViteDevServer({
        vite: {
          config: userConfig,
        },
      });
      expect(createServerMock.mock.calls[0][0]).toEqual(
        expect.objectContaining(userConfig),
      );
      expect(createServerMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('merge user promise config', async () => {
      const userConfig = {
        base: 'a/b/c/',
        configFile: false,
      } as const;
      await createViteDevServer({
        vite: {
          config: () => Promise.resolve(userConfig),
        },
      });

      expect(createServerMock.mock.calls[0][0]).toEqual(
        expect.objectContaining(userConfig),
      );
    });

    it('vite2 config', async () => {
      await createViteDevServer({
        vite: {
          version: 'vite2',
        },
      });
      expect(createServerMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('find optimize deps entries in karma files', async () => {
      await createViteDevServer({
        files: [
          'file1.ts',
          { pattern: 'files2.ts', type: 'module', served: false },
          { pattern: 'files3.ts', type: 'module', served: true },
          { pattern: 'files4.ts', served: true },
        ],
      });
      const viteConfig = createServerMock.mock.calls[0][0];
      const entries = viteConfig.optimizeDeps?.entries;
      expect(entries).toEqual(['files2.ts']);
    });

    it('istanbulPlugin should be used if enable coverage', async () => {
      await createViteDevServer({
        vite: {
          coverage: {
            enable: true,
          },
        },
      });
      const viteConfig = createServerMock.mock.calls[0][0];
      expect(vitePluginIstanbul).toHaveBeenCalled();
      expect(viteConfig.plugins).toEqual(
        expect.objectContaining([{ name: 'vite:istanbul' }]),
      );
      expect(viteConfig).toMatchSnapshot();
    });

    it('istanbulPlugin should be used if the config of reporters contain the "coverage" text', async () => {
      await createViteDevServer({
        reporters: ['coverage'],
      });
      const viteConfig = createServerMock.mock.calls[0][0];
      expect(vitePluginIstanbul).toHaveBeenCalled();
      expect(viteConfig.plugins).toEqual(
        expect.objectContaining([{ name: 'vite:istanbul' }]),
      );
    });

    it('istanbulPlugin should not be used if coverage config is set ot false even reporters contain the "coverage" text', async () => {
      await createViteDevServer({
        reporters: ['coverage'],
        vite: {
          coverage: {
            enable: false,
          },
        },
      });
      expect(vitePluginIstanbul).not.toHaveBeenCalled();
    });

    it('istanbulPlugin cwd config should be config.basePath if config.vite.coverage.cwd is not exist', async () => {
      const istanbulOriginConfig = {
        include: ['a'],
        exclude: ['b'],
        extension: 'js',
      };
      await createViteDevServer({
        basePath: '/a/b/c/',
        vite: {
          coverage: {
            enable: true,
            ...istanbulOriginConfig,
          },
        },
      });
      const vitePluginIstanbulConfig = vitePluginIstanbul.mock.calls[0][0];
      expect(vitePluginIstanbulConfig).toEqual({
        ...istanbulOriginConfig,
        cwd: '/a/b/c/',
      });
    });
  });

  describe('rewrite vite server restart method', () => {
    let vite: ViteDevServerInternal;
    beforeEach(async () => {
      vite = (await createViteDevServer()) as ViteDevServerInternal;
    });
    it('restart method should return new vite server after it was rewritten', async () => {
      const newVite = await vite.restart();
      expect(newVite).not.toStrictEqual(vite);
      expect(newVite?.ws).not.toEqual(undefined);
    });

    it('should copy the property of new vite server to old vite server', async () => {
      const oldViteConfig = vite.config;
      const newVite = await vite.restart();
      expect(oldViteConfig).not.toStrictEqual(vite.config);
      expect(vite.config).toStrictEqual(newVite?.config);
    });

    it('the createServer method should not be called again if the previous restart method did not complete', async () => {
      createServerMock.mockClear();
      void vite.restart();
      await vite.restart();
      expect(createServerMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('vite server intercept', () => {
    let vite: ViteDevServerInternal;
    beforeEach(async () => {
      vite = (await createViteDevServer()) as ViteDevServerInternal;
    });

    it('after the ws.send method is called with "update" type payload, the executor.schedule method should be called', () => {
      expect(scheduleMock).not.toHaveBeenCalled();
      vite.ws.send({ type: 'full-reload' });
      expect(scheduleMock).toHaveBeenCalled();
    });

    it('after the vite server restarted, the executor.schedule method should be called', async () => {
      await vite.restart();
      expect(scheduleMock).toHaveBeenCalled();
    });

    it('after the vite server restart, the newServer should be intercepted again', async () => {
      let newServer = await vite.restart();
      expect(scheduleMock).toHaveBeenCalledTimes(1);
      newServer?.ws.send({ type: 'full-reload' });
      expect(scheduleMock).toHaveBeenCalledTimes(2);

      newServer = await newServer?.restart();
      expect(scheduleMock).toHaveBeenCalledTimes(3);
      newServer?.ws.send({ type: 'full-reload' });
      expect(scheduleMock).toHaveBeenCalledTimes(4);
    });
  });
});
