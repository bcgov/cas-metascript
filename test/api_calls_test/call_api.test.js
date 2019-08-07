const mockedEnv = require('mocked-env');
const callAPI = require('../../api_calls/call_api');
let restore;

describe('callAPI() tests', () => {
  test('callAPI fails with a bad session id', async () => {
    restore = mockedEnv({
      URL: process.env.TEST_URL
    });
    const session = {id: '1234'};
    const result = await callAPI(session, '/database', 'GET');
    expect(result).toBeUndefined;
    restore();
  });

  test('callAPI returns data with a good session id', async () => {
    restore = mockedEnv({
      URL: process.env.TEST_URL
    });
    const result = await callAPI(JSON.parse(process.env.TEST_SESSION), '/database', 'GET');
    expect(result).toBeDefined;
    expect(typeof result).toBe('object');
    expect(typeof result[0].id).toBe('number');
    restore();
  });
});
