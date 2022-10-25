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
import type { Config, Logger } from '../types/karma';

const unwantedViteClientHtml = new Set([
  '/',
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
  log: OriginLogger,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    let shouldNext = true;
    if (req.url === `${vite.config.base}@vite/client`) {
      let refererUrl = undefined;
      if (req.headers.referer) {
        try {
          refererUrl = new URL(req.headers.referer).pathname;
        } catch {
          // continue regardless of error
          log.debug(`not valid referer header`, req.headers.referer);
        }
      }
      const relativeRefererUrl = refererUrl?.replace(urlRoot, '/');
      if (
        refererUrl &&
        refererUrl.startsWith(urlRoot) &&
        relativeRefererUrl &&
        unwantedViteClientHtml.has(relativeRefererUrl)
      ) {
        log.debug(
          `${relativeRefererUrl} is requesting vite client which will be mock by karma-vite because the request referer do not need hmr`,
        );
        shouldNext = false;
        void vite
          .transformRequest(`${VITE_FS_PREFIX.slice(0, 1)}${VITE_CLIENT_ENTRY}`)
          .then((result) => {
            if (result) {
              res.setHeader('Content-Type', 'application/javascript');
              res.end(result.code);
            } else {
              log.debug(
                `transformRequest by ${relativeRefererUrl} result get empty content`,
                result,
              );
              next();
            }
          })
          .catch((err) => {
            log.debug(`transformRequest by ${relativeRefererUrl} error`, err);
            next();
          });
      }
    }
    shouldNext && next();
  };
};

const middlewareFactory: DiFactory<
  [vite: ViteDevServer | undefined, config: Config, logger: Logger],
  Connect.Server
> = (vite, config, logger) => {
  const { urlRoot } = config;
  const log = logger.create('karma-vite:middleware');
  if (vite === undefined) {
    log.error('The config of framework field missing vite');
    throw 'The config of framework field missing vite';
  }

  const handler = connect();

  handler.use(adjustPrefixMiddleware(urlRoot, vite.config.base, log));
  handler.use(viteClientMiddleware(vite, urlRoot, log));
  handler.use((req, res, next) => {
    vite.middlewares(req, res, next);
  });
  handler.use(restorePrefixMiddleware(log));

  return handler;
};

middlewareFactory.$inject = ['vite.value', 'config', 'logger'];

export default middlewareFactory;
