const mockedEnv = require('mocked-env');
const { setupRecorder } = require('nock-record');
const getSession = require('../../api_calls/get_session');

const record = setupRecorder({ mode: 'record' });

describe('getSession() tests', () => {
  test('getSession fails with bad credentials', async () => {
    const restore = mockedEnv({
      METABASE_USERNAME: 'bad@credentials.is',
      METABASE_PASSWORD: 'accessdenied',
      URL:'https://metabase-wksv3k-test.pathfinder.gov.bc.ca/api'
    });

    const { completeRecording, assertScopesFinished } = await record("get_session_with_bad_credentials");
    const session = await getSession();
    completeRecording();

    expect(session).toStrictEqual({"errors": {"password": "did not match stored password"}});
    assertScopesFinished();

    restore();
  });

  test('getSession returns a session id with good credentials', async () => {

    const restore = mockedEnv ({
      METABASE_USERNAME: 'good@user.is',
      METABASE_PASSWORD: 'goodpassword',
      URL:'https://metabase-wksv3k-test.pathfinder.gov.bc.ca/api'
    });

    const  { completeRecording, assertScopesFinished } = await record('get_session_with_good_credentials');
    const session = await getSession();
    completeRecording();

    expect(typeof session).toBe('object')
    expect(typeof session.id).toBe('string')
    expect(session.id.length).toBe(36);
    assertScopesFinished();

    restore();
  });

  xtest('getSession returns a cached session if session is still valid', () => {

  });

  xtest('getSession overwrites the session if forced', () => {

  });
});