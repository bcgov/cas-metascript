const fetch = require("node-fetch");
require('dotenv').config();

async function getSession() {

  const userDetails = {
    username: process.env.METABASE_USERNAME,
    password: process.env.METABASE_PASSWORD,
  }

  const url = `https://metabase-wksv3k-dev.pathfinder.gov.bc.ca/api/session`;

  const param = {
    headers: {
      "content-type":"application/json",
    },
    body: JSON.stringify(userDetails),
    method: 'POST'
  }
  try {
    const res =  await fetch(url, param)
    const data = await res.json();
    
    return data;
  }
  catch(e) {console.log(e)};
}

module.exports = getSession;