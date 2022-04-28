import connect from 'connect';
import stripHost, { cleanUrl } from '../utils';
import { REWRITE_KEY, VITE_CLIENT_ENTRY } from '../constants';
import type { Connect, ViteDevServer } from 'vite';
import type { Logger as OriginLogger } from 'log4js';
import type { DiFactory } from '../types/diFactory';
import type { Config, Logger, ServeFile } from '../types/karma';

const unwantedViteClientHtml = new Set([
  '/context.html',
  '/client_with_context.html',
]);

type IncomingMessage = Connect.IncomingMessage & {
  [REWRITE_KEY]?: boolean;
};

const adjustPrefixMiddleware = (
  originPrefix: string,
  targetPrefix: string,
  log: OriginLogger,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    const url = req.url && cleanUrl(stripHost(req.url));
    if (url?.startsWith(originPrefix)) {
      req.url = url.replace(originPrefix, targetPrefix);
      log.debug(`this request url was replaced by ${req.url} from ${url}`);
      Reflect.defineProperty(req, REWRITE_KEY, {
        value: true,
        enumerable: false,
      });
    }
    next();
  };
};

const restorePrefixMiddleware = (
  originPrefix: string,
  targetPrefix: string,
  log: OriginLogger,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    const url = req.url && cleanUrl(stripHost(req.url));

    if (url !== undefined && req[REWRITE_KEY]) {
      req.url = url.replace(originPrefix, targetPrefix);
      log.debug(
        `this request url was replaced with adjustPrefixMiddleware, the url restored from ${url} to ${req.url}`,
      );
      Reflect.deleteProperty(req, REWRITE_KEY);
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
            `this request want to get vite client which will be mock by karma-vite because the request referer do not need hmr`,
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

  handler.use(adjustPrefixMiddleware(`${urlRoot}base/`, vite.config.base, log));
  handler.use(viteClientMiddleware(vite, urlRoot, serveFile, log));
  handler.use((req, res, next) => {
    log.debug(
      `this request is about to enter vite middlewares that url is ${
        req.url || ''
      }`,
    );
    vite.middlewares(req, res, next);
    log.debug(
      `this request was not processed by vite middlewares that url is ${
        req.url || ''
      }`,
    );
  });
  handler.use(
    restorePrefixMiddleware(vite.config.base, `${urlRoot}base/`, log),
  );

  return handler;
};

middlewareFactory.$inject = ['vite.value', 'config', 'serveFile', 'logger'];

export default middlewareFactory;
