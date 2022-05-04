import type { Connect, ViteDevServer } from 'vite';
import type { DiFactory } from '../types/diFactory';
import type { Config, Logger } from '../types/karma';
import type { ServerResponse } from 'http';
import stripHost, { cleanUrl } from '../utils';

const contextHtmlLikeSet = new Set([
  '/context.html',
  '/debug.html',
  '/client_with_context.html',
]);

const beforeMiddlewareFactory: DiFactory<
  [vite: ViteDevServer | undefined, config: Config, logger: Logger],
  Connect.NextHandleFunction
> = (vite, config, logger) => {
  const { urlRoot } = config;
  const log = logger.create('karma-vite-beforeMiddleware');
  if (vite === undefined) {
    log.error('The config of framework field missing vite');
    throw 'The config of framework field missing vite';
  }

  return (req, res, next) => {
    // hack, intercept the context.html which serve by karma and handle it over to vite
    const url = req.url && cleanUrl(stripHost(req.url));
    if (!url?.startsWith(urlRoot)) {
      return next();
    }
    const newUrl = url.replace(urlRoot, '/');
    if (contextHtmlLikeSet.has(newUrl)) {
      const originEnd = res.end.bind(res);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.end = (...args: any[]): ServerResponse => {
        if (typeof args[0] === 'string') {
          const [html, ...rest] = args;
          void vite.transformIndexHtml(newUrl, html).then((data) => {
            originEnd(data, ...rest);
          });
        } else {
          originEnd(...args);
        }
        return res;
      };
    }
    next();
  };
};

beforeMiddlewareFactory.$inject = ['vite.value', 'config', 'logger'];

export default beforeMiddlewareFactory;
