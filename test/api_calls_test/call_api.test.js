const mockedEnv = require('mocked-env');
const { setupRecorder } = require('nock-record');
const callAPI = require('../../api_calls/call_api');
let restore;

const record = setupRecorder({ mode: 'record' });

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
      URL: process.env.TEST_URL,
      TEST_SESSION: `{"id":"9f707921-b9a1-4dfb-ae58-b22c37137d1b"}`
    });

    const  { completeRecording, assertScopesFinished } = await record('callAPI_with_valid_session');
    const result = await callAPI(JSON.parse(process.env.TEST_SESSION), '/database', 'GET');
    completeRecording();

    expect(result).toBeDefined;
    expect(typeof result).toBe('object');
    expect(typeof result[0].id).toBe('number');
    assertScopesFinished();
    restore();
  });
});
