const fetch = require("node-fetch");
require('dotenv').config();

/**
 * Function getSession retrieves the current user's session and returns it for api calls
 */
async function getSession({force = false}={}) {
  const username = process.env.METABASE_USERNAME;
  const password = process.env.METABASE_PASSWORD;

  // if (session[username] && !force) { return session[username]; }

  const userDetails = {
    username,
    password
  }

  let url = `${process.env.URL}/session`;
  if (process.env.NODE_ENV === 'test')
    url = `${process.env.TEST_URL}/session`;

  const param = {
    headers: {
      "content-type":"application/json",
    },
    body: JSON.stringify(userDetails),
    method: 'POST'
  }
  try {
    const res =  await fetch(url, param);
    const session = await res.json();
    return session;
  }
  catch(e) {console.log(e)};
}

module.exports = getSession;