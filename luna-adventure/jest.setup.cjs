let logSpy;

beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  if (logSpy) {
    logSpy.mockRestore();
  }
});
