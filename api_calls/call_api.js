const fetch = require("node-fetch");

/**
 *Function callAPI receives a metabase API endpoint as a parameter then sends a request and returns the data
 * (Could probably be it's own file with an export)
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {String} method - The http method
 * @param {object} body - The body of the request
 */
async function callAPI(apiEndpoint, method, body, params) {
  const url = `https://metabase-wksv3k-dev.pathfinder.gov.bc.ca/api${apiEndpoint}`;

  //TODO: write a separate API request to dynamically receive the metabase session token
  const param = {
    headers:{
      "content-type":"application/json",
      // "X-Metabase-Session": "8fe8a3af-2396-4b93-b583-e9cf54d21716"
      "X-Metabase-Session": "91ab1a62-2226-49ca-9e80-3a68d779d6d5"
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