import connect from 'connect';
import stripHost, { cleanUrl } from '../utils';
import {
  REWRITE_URL_KEY,
  VITE_CLIENT_ENTRY,
  VITE_FS_PREFIX,
} from '../constants';
import type { Connect, ViteDevServer } from 'vite';
import type { Logger as OriginLogger } from 'log4js';
import type { DiFactory } from '../types/diFactory';
import type { Config, Logger, ServeFile } from '../types/karma';

const unwantedViteClientHtml = new Set([
  '/context.html',
  '/client_with_context.html',
]);

type IncomingMessage = Connect.IncomingMessage & {
  [REWRITE_URL_KEY]?: [originPrefix: string, targetPrefix: string];
};

const adjustPrefixMiddleware = (
  urlRoot: string,
  base: string,
  log: OriginLogger,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    const url = req.url && cleanUrl(stripHost(req.url));
    const basePrefix = `${urlRoot}base/`;
    const absolutePrefix = `${urlRoot}absolute/`;
    let originPrefix, targetPrefix;
    if (url?.startsWith(basePrefix)) {
      originPrefix = basePrefix;
      targetPrefix = base;
    } else if (url?.startsWith(absolutePrefix)) {
      originPrefix = absolutePrefix;
      targetPrefix = `${base.slice(0, -1)}${VITE_FS_PREFIX}`;
    }
    if (url && originPrefix && targetPrefix) {
      req.url = url.replace(originPrefix, targetPrefix);
      Reflect.defineProperty(req, REWRITE_URL_KEY, {
        value: [absolutePrefix, targetPrefix],
        enumerable: false,
      });
      log.debug(`Url prefix rewritten: ${url} -> ${req.url}`);
    }
    next();
  };
};

const restorePrefixMiddleware = (
  log: OriginLogger,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    const url = req.url && cleanUrl(stripHost(req.url));
    const rewriteValue = req[REWRITE_URL_KEY];
    if (url !== undefined && rewriteValue) {
      const [originPrefix, targetPrefix] = rewriteValue;
      req.url = url.replace(originPrefix, targetPrefix);
      log.debug(`Url prefix restored: ${url} -> ${req.url}`);
      Reflect.deleteProperty(req, REWRITE_URL_KEY);
    }
    next();
  };
};

const viteClientMiddleware = (
  vite: ViteDevServer,
  urlRoot: string,
  serveFile: ServeFile,
  log: OriginLogger,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    if (req.headers.referer && req.url === `${vite.config.base}@vite/client`) {
      const refererUrl = new URL(req.headers.referer).pathname;
      if (refererUrl.startsWith(urlRoot)) {
        const url = refererUrl.replace(urlRoot, '/');
        if (unwantedViteClientHtml.has(url)) {
          log.debug(
            `${url} is requesting vite client which will be mock by karma-vite because the request referer do not need hmr`,
          );
          return serveFile(VITE_CLIENT_ENTRY, req.headers.range, res);
        }
      }
    }
    next();
  };
};

const middlewareFactory: DiFactory<
  [
    vite: ViteDevServer | undefined,
    config: Config,
    serveFile: ServeFile,
    logger: Logger,
  ],
  Connect.Server
> = (vite, config, serveFile, logger) => {
  const { urlRoot } = config;
  const log = logger.create('karma-vite:middleware');
  if (vite === undefined) {
    log.error('The config of framework field missing vite');
    throw 'The config of framework field missing vite';
  }

  const handler = connect();

  handler.use(adjustPrefixMiddleware(urlRoot, vite.config.base, log));
  handler.use(viteClientMiddleware(vite, urlRoot, serveFile, log));
  handler.use((req, res, next) => {
    vite.middlewares(req, res, next);
  });
  handler.use(restorePrefixMiddleware(log));

  return handler;
};

middlewareFactory.$inject = ['vite.value', 'config', 'serveFile', 'logger'];

export default middlewareFactory;
