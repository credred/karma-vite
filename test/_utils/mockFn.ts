import { VITE_FS_PREFIX } from '@/constants';
import { noop } from 'lodash';
import type { ServerResponse } from 'http';
import type { Connect, InlineConfig, ResolvedConfig } from 'vite';

export const scheduleMock = jest.fn();
export let viteCloseMock = jest.fn();
export const viteWsSendMock = jest.fn();
let viteMiddlewareMock = jest.fn(((req, res, next) => {
  next();
}) as Connect.NextHandleFunction);
export const viteMiddlewareMockMsg = 'vite handled';
export const viteNotHandleUrlPrefix = '__vite_not_handle_url_prefix__';
export const createServerMock = jest.fn((config: InlineConfig) => {
  const base = config.base ?? '/';
  let closed = false;
  viteMiddlewareMock = jest.fn((req, res, next) => {
    if (closed) {
      return next();
    }
    if (
      (req.url?.startsWith(base) || req.url?.startsWith(VITE_FS_PREFIX)) &&
      !req.url?.startsWith(`${base}${viteNotHandleUrlPrefix}`)
    ) {
      res.setHeader('url', req.url);
      res.end(viteMiddlewareMockMsg);
    } else {
      next();
    }
  });
  viteCloseMock = jest.fn(() => {
    closed = true;
  });
  const newConfig = {
    ...config,
    base: base,
    inlineConfig: config,
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as ResolvedConfig;
  return Promise.resolve({
    restart: noop,
    close: viteCloseMock,
    config: newConfig,
    middlewares: viteMiddlewareMock,
    ws: {
      send: viteWsSendMock,
    },
  });
});

export const serveFileMock = jest.fn(
  (file: string, range: string, res: ServerResponse) => {
    res.end();
  },
);
