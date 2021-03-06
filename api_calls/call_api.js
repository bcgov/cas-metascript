const fetch = require("node-fetch");
const getSession = require("./get_session");
require('dotenv').config();

/**
 *Function callAPI receives a metabase API endpoint as a parameter then sends a request and returns the data
 * @param {object} session - the current user's session (contains a session id)
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {String} method - The http method
 * @param {object} body - The body of the request
 */
async function callAPI(session, apiEndpoint, method, body, params) {
  let url = `${process.env.URL}${apiEndpoint}`;
  if (process.env.NODE_ENV === 'test')
    url = `${process.env.TEST_URL}${apiEndpoint}`;
  const param = {
    headers:{
      "content-type":"application/json",
      "X-Metabase-Session": session.id
    },
    method,
    params
  };
  if (method === 'POST' || method === 'PUT') {
    param.body = JSON.stringify(body);
  }
  try {
    const res = await fetch(url, param);
    const data = await res.json();
    return data;
  } catch(e) { return e; }
};

module.exports = callAPI;