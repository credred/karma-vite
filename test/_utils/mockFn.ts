import type { InlineConfig } from 'vite';

export const scheduleMock = jest.fn();
export const viteRestartMock = jest.fn();
export const viteCloseMock = jest.fn();
export const viteWsSendMock = jest.fn();
export const createServerMock = jest.fn((config: InlineConfig) =>
  Promise.resolve({
    restart: viteRestartMock,
    close: viteCloseMock,
    config: {
      inlineConfig: config,
      logger: {
        info: jest.fn(),
        error: jest.fn(),
      },
    },
    ws: {
      send: viteWsSendMock,
    },
  }),
);
