const fetch = require("node-fetch");
const getSession = require("./get_session");

/**
 *Function callAPI receives a metabase API endpoint as a parameter then sends a request and returns the data
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {String} method - The http method
 * @param {object} body - The body of the request
 */
async function callAPI(session, apiEndpoint, method, body, params) {
  const url = `https://metabase-wksv3k-dev.pathfinder.gov.bc.ca/api${apiEndpoint}`;

  const param = {
    headers:{
      "content-type":"application/json",
      "X-Metabase-Session": session.id
    },
    method,
    params
  };
  if (method = 'POST') {
    param.body = body;
  }
  const res = await fetch(url, param)
  const data = await res.json();

  return data;
};

module.exports = callAPI;