declare module 'vite' {
  export const scheduleMock: jest.Mock;
  export const restartMock: jest.Mock;
  export const closeMock: jest.Mock;
  export const wsSendMock: jest.Mock;
  export const createServerMock: jest.Mock;
}
export {};
