const mockedEnv = require('mocked-env');
const getSession = require('../../api_calls/get_session');
const nock = require('nock');

const nockedSession = nock('https://metabase-wksv3k-test.pathfinder.gov.bc.ca', {
  "reqheaders": {
    "content-type": [
      "application/json"
    ],
    "accept": [
      "*/*"
    ],
    "content-length": [
      "64"
    ],
    "accept-encoding": [
      "gzip,deflate"
    ],
    "connection": [
      "close"
    ],
    "host": "metabase-wksv3k-test.pathfinder.gov.bc.ca"
  }
})
  .post('/api/session', {username: process.env.METABASE_USERNAME, password: process.env.METABASE_PASSWORD})
  .reply(200,
    "1f8b0800000000000000ab56ca4c51b2523233b1484b4d3448d44d4a3130d135313537d64d344f4ed34d3231b5b4304e4c323249b154aa0500823eb46e2d000000",
    { "Connection": "close",
    "Date":"Fri, 02 Aug 2019 20:10:14 GMT",
    "X-Frame-Options":"DENY",
    "X-XSS-Protection":"1; mode=block",
    "Last-Modified":"Fri, 02 Aug 2019 20:10:14 +0000",
    "Strict-Transport-Security":"max-age=31536000",
    "Set-Cookie":"metabase.SESSION_ID=;Expires=Thu, 01 Jan 1970 00:00:00 +0000;Path=/",
    "Set-Cookie":"metabase.SESSION=648fea0a-bd04-4573-a7cf-b45983ab24d9;SameSite=Lax;HttpOnly;Path=/;Max-Age=1209600;Secure",
    "X-Permitted-Cross-Domain-Policies":"none",
    "Cache-Control":"max-age=0, no-cache, must-revalidate, proxy-revalidate",
    "X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; script-src 'self' 'unsafe-eval' https://maps.google.com https://apis.google.com https://www.google-analytics.com https://*.googleapis.com *.gstatic.com  'sha256-xlgrBEvjf72cXGba6bCV/PwIVp1DcbdhY74VIXN8fA4=' 'sha256-6xC9z5Dcryu9jbxUZkBJ5yUmSofhJjt7Mbnp/ijPkFs=' 'sha256-uKEj/Qp9AmQA2Xv83bZX9mNVV2VWZteZjIsVNVzLkA0='; child-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com themes.googleusercontent.com ; img-src * 'self' data:; connect-src 'self' metabase.us10.list-manage.com ; manifest-src 'self'; ",
    "Content-Type":"application/json;charset=utf-8",
    "Content-Encoding":"gzip",
    "Expires":"Tue, 03 Jul 2001 06:00:00 GMT",
    "Server":"Jetty(9.4.z-SNAPSHOT)",
    "Set-Cookie":"fd7343b5d8041d877642b9e645b0454a=7bc0f644276398b223acb12dee0a55d5; path=/; HttpOnly; Secure"
  })

// nock.recorder.rec({
//   dont_print: false,
//   output_objects: true,
//   enable_reqheaders_recording:true
// })

describe('getSession() tests', () => {
  test('getSession fails with bad credentials', async () => {
    const restore = mockedEnv({
      METABASE_USERNAME: 'bad@credentials.is',
      METABASE_PASSWORD: 'accessdenied',
      URL:'https://metabase-wksv3k-test.pathfinder.gov.bc.ca/api'
    });
    const session = await getSession();
    
    expect(session).toStrictEqual({"errors": {"password": "did not match stored password"}});
    restore();
  });

  test('getSession returns a session id with good credentials', async () => {
    
    const restore = mockedEnv ({
      URL:'https://metabase-wksv3k-test.pathfinder.gov.bc.ca/api'
    });
    
    const session = await getSession();
    expect(typeof session).toBe('object')
    expect(typeof session.id).toBe('string')
    expect(session.id.length).toBe(36);
    restore();
  });
});
