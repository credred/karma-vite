import frameworkFactory from '@/factory/frameworkFactory';
import createInjector from '@test/_utils/createInjector';

describe('frameworkFactory', () => {
  it('should return viteServer', async () => {
    const injector = createInjector();
    const viteServer = await injector.get('vite');
    const framework = await injector.invoke(frameworkFactory);
    expect(framework).toBe(viteServer);
  });

  it('should auto init correctly in default config', async () => {
    const injector = createInjector();
    await injector.invoke(frameworkFactory);
    const config = injector.get('config');
    expect(config).toMatchSnapshot();
  });

  it('should not auto init if vite.autoInit is false in config', async () => {
    const injector = createInjector({
      vite: {
        autoInit: false,
      },
    });
    await injector.invoke(frameworkFactory);
    const config = injector.get('config');
    expect(config).toMatchSnapshot();
  });
});
