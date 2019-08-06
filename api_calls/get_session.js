const fetch = require("node-fetch");
const fs = require('fs');
let session = {};
require('dotenv').config();

/**
 * Function getSession retrieves the current user's session and returns it for api calls
 */
async function getSession({force = false}={}) {
  const username = process.env.METABASE_USERNAME;
  const password = process.env.METABASE_PASSWORD;

  if (fs.existsSync(`${__dirname}/session/session.json`)) {
    session = JSON.parse(fs.readFileSync(`${__dirname}/session/session.json`));
  }
  else {
    fs.writeFileSync(`${__dirname}/session/session.json`, JSON.stringify({}));
  }

  if (session[username] && !force) { return session[username]; }

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
    if (res.status === 200)
      fs.writeFileSync(`${__dirname}/session/session.json`, JSON.stringify(session));
    return session[username];
  }
  catch(e) {console.log(e)};
}

module.exports = getSession;