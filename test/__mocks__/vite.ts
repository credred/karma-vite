const scheduleMock = jest.fn();

const restartMock = jest.fn();
const closeMock = jest.fn();
const wsSendMock = jest.fn();
const createServerMock = jest.fn(() =>
  Promise.resolve({
    restartMock,
    close: closeMock,
    config: {
      inlineConfig: {},
      logger: {
        info: jest.fn(),
        error: jest.fn(),
      },
    },
    ws: {
      send: wsSendMock,
    },
  }),
);

const vite = jest.requireActual('vite');
module.exports = {
  ...vite,
  scheduleMock,
  restartMock,
  closeMock,
  wsSendMock,
  createServerMock,
  createServer: createServerMock,
};

export {};
