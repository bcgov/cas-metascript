const mockedEnv = require('mocked-env');
const getSession = require('../../api_calls/get_session');
let restore;

describe('getSession() tests', () => {
  test('getSession fails with bad credentials', async () => {
    restore = mockedEnv({
      METABASE_USERNAME: 'bad@credentials.is',
      METABASE_PASSWORD: 'accessdenied',
      URL:'https://metabase-wksv3k-test.pathfinder.gov.bc.ca/api'
    });
    const session = await getSession();
    expect(session.id).toBeUndefined();
    expect(session.errors).toBeDefined();
    restore();
  });

  test('getSession returns a session id with good credentials', async () => {
    restore = mockedEnv ({
      URL:'https://metabase-wksv3k-test.pathfinder.gov.bc.ca/api'
    });
    const session = await getSession();
    expect(session.id).toBeDefined();
    expect(session.errors).toBeUndefined();
    restore();
  });
});
