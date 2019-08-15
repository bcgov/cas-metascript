const mockedEnv = require('mocked-env');
const { setupRecorder } = require('nock-record');
const getSession = require('../../../api_calls/get_session');

const record = setupRecorder({ mode: 'record' });
// Get the URL from the nock fixture a la METABASE_USERNAME
describe('getSession() tests', () => {
  test('getSession fails with bad credentials', async () => {
    const restore = mockedEnv({
      METABASE_USERNAME: 'bad@credentials.is',
      METABASE_PASSWORD: 'accessdenied',
      URL: process.env.URL
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
      URL: process.env.URL
    });

    const  { completeRecording, assertScopesFinished } = await record('get_session_with_good_credentials');
    const session = await getSession();
    completeRecording();

    expect(typeof session).toBe('object');
    expect(typeof session.id).toBe('string');
    expect(session.id.length).toBe(36);
    assertScopesFinished();

    restore();
  });
});

//DEPRECATED TESTS

// test('getSession returns a cached session if session is still valid', async () => {
  //   const restore = mockedEnv ({
  //     METABASE_USERNAME: 'good@user.is',
  //     METABASE_PASSWORD: 'goodpassword',
  //     URL: process.env.TEST_URL
  //   });

  //   const cachedSession = JSON.parse(fs.readFileSync(`${__dirname}/../../api_calls/session/session.json`));
  //   const session = await getSession();
  //   expect(cachedSession['good@user.is']).toStrictEqual(session);
  //   restore();
  // });

  // test('getSession overwrites the session if forced', async () => {
  //   const restore = mockedEnv ({
  //     METABASE_USERNAME: 'good@user.is',
  //     METABASE_PASSWORD: 'goodpassword',
  //     URL: process.env.TEST_URL
  //   });

  //   const cachedSession = JSON.parse(fs.readFileSync(`${__dirname}/../../api_calls/session/session.json`));
  //   const  { completeRecording, assertScopesFinished } = await record('force session');
  //   const session = await getSession({force: true});
  //   completeRecording();

  //   expect(cachedSession['good@user.is'].id).not.toEqual(session.id);
  //   assertScopesFinished();
  //   restore();
  // });
