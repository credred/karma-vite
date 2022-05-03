import request from 'supertest';
import middlewareFactory from '@/factory/middlewareFactory';
import type { Connect, ViteDevServer } from 'vite';
import {
  serveFileMock,
  viteMiddlewareMockMsg,
  viteNotHandleUrlPrefix,
} from './_utils/mockFn';
import createInjector from './_utils/createInjector';
import { VITE_FS_PREFIX } from '@/constants';

const urlRoot = '/test/';
const viteBase = '/vite/';

async function createMiddleware() {
  const injector = createInjector({
    urlRoot: urlRoot,
    vite: {
      config: {
        base: viteBase,
      },
    },
  });
  const viteServer = await injector.get('vite');
  const middleware = injector.invoke(middlewareFactory);
  return { middleware, viteServer };
}

const fallbackMsg = 'fallbackMsg';

describe('middlewareFactory', () => {
  jest.mock('fs');
  let middleware: Connect.Server;
  let viteServer: ViteDevServer;
  beforeAll(async () => {
    ({ middleware, viteServer } = await createMiddleware());
    middleware.use((req, res) => {
      req.url && res.setHeader('url', req.url);
      res.end(fallbackMsg);
    });
  });

  it('should handle request by vite middleware', async () => {
    const response = await request(middleware).get(`${viteBase}anything`);
    expect(response.text).toEqual(viteMiddlewareMockMsg);
  });

  it('should rewrite request url before vite middleware', async () => {
    let response;

    response = await request(middleware).get(`${urlRoot}base/a`);
    expect(response.text).toEqual(viteMiddlewareMockMsg);
    expect(response.header.url).toEqual(`${viteBase}a`);

    response = await request(middleware).get(`${urlRoot}absolute/a`);
    expect(response.text).toEqual(viteMiddlewareMockMsg);
    expect(response.header.url).toEqual(
      `${viteBase.slice(0, -1)}${VITE_FS_PREFIX}a`,
    );
  });

  it('should restore url if vite middleware skipped handle the request', async () => {
    const response = await request(middleware).get(
      `${urlRoot}${viteNotHandleUrlPrefix}/anything`,
    );
    expect(response.header.url).toEqual(
      `${urlRoot}${viteNotHandleUrlPrefix}/anything`,
    );
  });

  it('fallback', async () => {
    const response = await request(middleware).get('/a/b/d/s');
    expect(response.text).toEqual(fallbackMsg);
    expect(response.headers.url).toEqual('/a/b/d/s');
  });

  it('should be effective even if vite is restarted', async () => {
    await viteServer.restart();
    const response = await request(middleware).get(`${urlRoot}base/a`);
    expect(response.text).toEqual(viteMiddlewareMockMsg);
    expect(response.header.url).toEqual(`${viteBase}a`);
  });

  it('should intercept that the request want to get @vite/client', async () => {
    await request(middleware)
      .get(`${viteBase}@vite/client`)
      .set('referer', `http://localhost${urlRoot}context.html`);
    expect(serveFileMock).toBeCalled();
  });

  it('should not intercept that the request want to get @vite/client but the request referer header does not meet the conditions', async () => {
    await request(middleware)
      .get(`${viteBase}@vite/client`)
      .set('referer', `http://localhost${urlRoot}debug.html`);
    expect(serveFileMock).not.toBeCalled();
  });
});
