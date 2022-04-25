import type { FilePattern } from 'karma';
import type { HMRPayload, ViteDevServer } from 'vite';
import type { DiFactory } from '../types/diFactory';
import type { Config } from '../types/karma';
import path from 'path';
import { createServer } from 'vite';
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

function resolveCoverageReporteDir(config: Config) {
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

const viteServerFactory: DiFactory<
  [config: Config, executor: Executor],
  ViteProvider
> = (config, executor) => {
  const { basePath } = config;
  const belongToVitekarmaFiles = filterBelongToVitekarmaFiles(config.files);
  const viteProvider = createServer({
    root: basePath,
    server: {
      middlewareMode: 'ssr',
      watch: {
        ignored: [path.resolve(resolveCoverageReporteDir(config), '**')],
      },
    },
    plugins: [
      resolveEnableIstanbulPlugin(config) &&
        IstanbulPlugin(resolveIstanbulPluginConfig(config)),
    ],
    optimizeDeps: {
      entries: belongToVitekarmaFiles,
    },
  }).then((vite) => {
    viteProvider.value = vite;
    const send = vite.ws.send.bind(vite.ws);
    vite.ws.send = (payload: HMRPayload) => {
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
    return vite;
  }) as ViteProvider;
  viteProvider.value = undefined;

  return viteProvider;
};

viteServerFactory.$inject = ['config', 'executor'];

export default viteServerFactory;
