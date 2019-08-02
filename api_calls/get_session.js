const fetch = require("node-fetch");
let session = {};
require('dotenv').config();

/**
 * Function getSession retrieves the current user's session and returns it for api calls
 */
async function getSession() {
  const username = process.env.METABASE_USERNAME;
  const password = process.env.METABASE_PASSWORD;

  if (session[username]) { return session[username]; }

  const userDetails = {
    username,
    password
  }

  const url = `${process.env.URL}/session`;

  const param = {
    headers: {
      "content-type":"application/json",
    },
    body: JSON.stringify(userDetails),
    method: 'POST'
  }
  try {
    const res =  await fetch(url, param)
    session[username] = await res.json();
    return session[username];
  }
  catch(e) {console.log(e)};
}

module.exports = getSession;