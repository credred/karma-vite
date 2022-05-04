import request from 'supertest';
import connect from 'connect';
import beforeMiddlewareFactory from '@/factory/beforeMiddlewareFactory';
import createInjector from '@test/_utils/createInjector';
import {
  viteTransformIndexHtmlMock,
  viteTransformIndexHtmlMsg,
} from '@test/_utils/mockFn';

const urlRoot = '/test/';
const viteBase = '/vite/';
const fallbackMsg = 'fallbackMsg';

async function createServer() {
  const injector = createInjector({
    urlRoot: urlRoot,
    vite: {
      config: {
        base: viteBase,
      },
    },
  });
  await injector.get('vite');
  const beforeMiddleware = injector.invoke(beforeMiddlewareFactory);
  const server = connect();
  server.use(beforeMiddleware);
  server.use((req, res) => {
    req.url && res.setHeader('url', req.url);
    res.end(fallbackMsg);
  });
  return server;
}

describe('beforeMiddlewareFactory', () => {
  it('should intercept the context.html which serve by karma and handle it over to vite', async () => {
    const server = await createServer();
    const response = await request(server).get(`${urlRoot}context.html`);
    expect(viteTransformIndexHtmlMock).toBeCalledWith(
      '/context.html',
      fallbackMsg,
    );
    expect(response.text).toBe(viteTransformIndexHtmlMsg);
  });

  it('should not intercept other html which does not served by karma', async () => {
    const server = await createServer();
    const response = await request(server).get(`${urlRoot}another.html`);
    expect(response.text).toBe(fallbackMsg);
  });
});
