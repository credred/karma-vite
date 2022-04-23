import type { Connect, ViteDevServer } from 'vite';
import type { DiFactory } from '../types/diFactory';
import type { Config, Logger, ServeFile } from '../types/karma';
import connect from 'connect';
import stripHost, { cleanUrl } from '../utils';
import { REWRITE_KEY, VITE_CLIENT_ENTRY } from '../constants';

const unwantedViteClientHtml = new Set([
  '/context.html',
  '/client_with_context.html',
]);

type IncomingMessage = Connect.IncomingMessage & {
  [REWRITE_KEY]?: boolean;
};

const addPrefixMiddleware = (
  rewritePrefix: string,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    const url = req.url && cleanUrl(stripHost(req.url));
    if (url?.startsWith(rewritePrefix)) {
      req.url = url.replace(rewritePrefix, '/');
      Reflect.defineProperty(req, REWRITE_KEY, {
        value: true,
        enumerable: false,
      });
    }
    next();
  };
};

const removePrefixMiddleware = (
  rewritePrefix: string,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    const url = req.url && cleanUrl(stripHost(req.url));

    if (req[REWRITE_KEY]) {
      req.url = url?.replace('/', rewritePrefix);
      Reflect.deleteProperty(req, REWRITE_KEY);
    }
    next();
  };
};

const viteClientMiddleware = (
  urlRoot: string,
  serveFile: ServeFile,
): Connect.NextHandleFunction => {
  return (req: IncomingMessage, res, next) => {
    if (req.headers.referer && req.url === '/@vite/client') {
      const refererUrl = new URL(req.headers.referer).pathname;
      if (refererUrl.startsWith(urlRoot)) {
        const url = refererUrl.replace(urlRoot, '/');
        if (unwantedViteClientHtml.has(url)) {
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
  const log = logger.create('karma-vite-middleware');
  if (vite === undefined) {
    log.error('The config of framework field missing vite');
    throw 'The config of framework field missing vite';
  }

  const handler = connect();

  handler.use(addPrefixMiddleware(`${urlRoot}base/`));
  handler.use(viteClientMiddleware(urlRoot, serveFile));
  handler.use(vite.middlewares);
  handler.use(removePrefixMiddleware(`${urlRoot}base/`));

  return handler;
};

middlewareFactory.$inject = ['vite.value', 'config', 'serveFile', 'logger'];

export default middlewareFactory;
