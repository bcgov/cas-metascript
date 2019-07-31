const fetch = require("node-fetch");
const getSession = require("./get_session");
require('dotenv').config();

/**
 *Function callAPI receives a metabase API endpoint as a parameter then sends a request and returns the data
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {String} method - The http method
 * @param {object} body - The body of the request
 */
async function callAPI(session, apiEndpoint, method, body, params) {
  const url = `${process.env.URL}${apiEndpoint}`;

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
  const res = await fetch(url, param);
  const data = await res.json();

  return data;
};

module.exports = callAPI;