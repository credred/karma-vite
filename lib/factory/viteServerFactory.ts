import type { FilePattern } from 'karma';
import type { HMRPayload, UserConfig, ViteDevServer } from 'vite';
import { createServer, mergeConfig } from 'vite';
import type { DiFactory } from '../types/diFactory';
import type { Config } from '../types/karma';
import path from 'path';
import IstanbulPlugin from 'vite-plugin-istanbul';
import { COVERAGE_DIR } from '../constants';

export interface ViteProvider extends Promise<ViteDevServer> {
  /**
   * value is undefined when the dependent is framework factory type
   */
  value: ViteDevServer | undefined;
}

export interface Executor {
  schedule: () => void;
}

function filterBelongToVitekarmaFiles(files?: (FilePattern | string)[]) {
  return (
    files &&
    (
      files.filter((file) => {
        if (
          typeof file === 'object' &&
          file.type === 'module' &&
          file.served === false
        ) {
          return true;
        }
      }) as FilePattern[]
    ).map((file) => file.pattern)
  );
}

function resolveEnableIstanbulPlugin(config: Config) {
  const hardEnable = config.vite?.coverage?.enable;
  return (
    hardEnable ?? config.reporters.some((report) => report.includes('coverage'))
  );
}

function resolveIstanbulPluginConfig(
  config: Config,
): Parameters<typeof IstanbulPlugin>[0] {
  const { vite: { coverage } = {} } = config;
  return {
    include: coverage?.include,
    exclude: coverage?.exclude,
    extension: coverage?.extension,
    cwd: coverage?.cwd ?? config.basePath,
  };
}

function resolveCoverageReportDir(config: Config) {
  interface ConfigForCoverageReport {
    coverageReporter?: {
      dir?: string;
    };
    coverageIstanbulReporter?: {
      dir?: string;
    };
  }
  const hardDir = config.vite?.coverage?.dir;
  const fallbackDir =
    (config as ConfigForCoverageReport)?.coverageReporter?.dir ??
    (config as ConfigForCoverageReport)?.coverageIstanbulReporter?.dir;

  return hardDir || fallbackDir || COVERAGE_DIR;
}

async function resolveViteConfig(
  inlineViteConfig: UserConfig,
  config: Config,
): Promise<UserConfig> {
  let viteConfig = config.vite?.config;
  if (!viteConfig) return inlineViteConfig;
  if (typeof viteConfig === 'function') {
    viteConfig = await viteConfig({ command: 'serve', mode: 'development' });
  }
  return mergeConfig(viteConfig, inlineViteConfig);
}

interface ViteDevServerInternal extends Omit<ViteDevServer, 'restart'> {
  restart: (
    forceOptimize?: boolean,
  ) => Promise<ViteDevServerInternal | undefined>;
  _forceOptimizeOnRestart: boolean;
  _restartPromise?: Promise<ViteDevServerInternal | undefined>;
}

function rewriteViteServerRestart(
  server: ViteDevServerInternal,
  oldestServer = server,
) {
  server.restart = (forceOptimize?: boolean) => {
    if (!server._restartPromise) {
      server._forceOptimizeOnRestart = !!forceOptimize;
      server._restartPromise = restartViteServer(server, oldestServer).finally(
        () => {
          server._restartPromise = undefined;
          server._forceOptimizeOnRestart = false;
        },
      );
    }
    return server._restartPromise;
  };
}

/**
 *
 * @param oldestServer keep oldestServer property same as latest server property.
 * so user can always using the server which is created manually by createServer with safety
 */
async function restartViteServer(
  server: ViteDevServerInternal,
  oldestServer: ViteDevServerInternal,
) {
  await server.close();

  let newServer = undefined;
  try {
    let inlineConfig = server.config.inlineConfig;
    if (server._forceOptimizeOnRestart) {
      inlineConfig = mergeConfig(inlineConfig, {
        server: {
          force: true,
        },
      });
    }
    newServer = (await createServer(inlineConfig)) as ViteDevServerInternal;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    server.config.logger.error(err.message, {
      timestamp: true,
    });
    return;
  }

  for (const key in newServer) {
    if (key === '_restartPromise') {
      // prevent new server `restart` function from calling
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      newServer[key] = oldestServer[key];
    } else if (key !== 'app') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      oldestServer[key] = newServer[key];
    }
  }

  server.config.logger.info('server restarted.', { timestamp: true });

  // new server (the current server) can restart now
  newServer._restartPromise = undefined;

  return newServer;
}

const viteServerFactory: DiFactory<
  [config: Config, executor: Executor],
  ViteProvider
> = (config, executor) => {
  const { basePath } = config;
  const belongToVitekarmaFiles = filterBelongToVitekarmaFiles(config.files);
  const inlineViteConfig: UserConfig = {
    root: basePath,
    server: {
      middlewareMode: 'ssr',
      watch: {
        ignored: [path.resolve(resolveCoverageReportDir(config), '**')],
      },
    },
    plugins: [
      resolveEnableIstanbulPlugin(config) &&
        IstanbulPlugin(resolveIstanbulPluginConfig(config)),
    ],
    optimizeDeps: {
      entries: belongToVitekarmaFiles,
    },
  };
  const viteProvider = resolveViteConfig(inlineViteConfig, config)
    .then(createServer)
    .then((vite) => {
      viteProvider.value = vite;
      const interceptViteSend = (server: ViteDevServerInternal) => {
        const send = server.ws.send.bind(server.ws);
        server.ws.send = (payload: HMRPayload) => {
          if (
            payload.type === 'full-reload' ||
            payload.type === 'update' ||
            payload.type === 'prune' ||
            payload.type === 'custom'
          ) {
            executor.schedule();
          }
          send(payload);
        };
      };
      const interceptViteRestart = (server: ViteDevServerInternal) => {
        const restart = server.restart.bind(server);
        server.restart = async () => {
          const newServer = await restart();
          if (newServer) {
            rewriteViteServerRestart(newServer, vite as ViteDevServerInternal);
            interceptViteSend(newServer);
            interceptViteRestart(newServer);
            executor.schedule();
          }
          return newServer;
        };
      };
      rewriteViteServerRestart(vite as ViteDevServerInternal);
      interceptViteSend(vite as ViteDevServerInternal);
      interceptViteRestart(vite as ViteDevServerInternal);
      return vite;
    }) as ViteProvider;
  viteProvider.value = undefined;

  return viteProvider;
};

viteServerFactory.$inject = ['config', 'executor'];

export default viteServerFactory;
