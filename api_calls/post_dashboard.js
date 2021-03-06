const fetch = require("node-fetch");
const util = require('util');
require('dotenv').config();

/**
 * Function postQuestion sends a post request to metabase to save a question to metabase
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {object} body - The body of the request
 */
async function postDashboard(apiEndpoint, payload, method, session) {

  const originalDash = payload;

  let dashboardToSend = {}

  if (method === 'POST') {
   dashboardToSend ={
      // set name to show the dashboard id this dashboard was created from for debugging
      name: originalDash.name,
      description: originalDash.description,
      parameters: originalDash.parameters,
      collection_id: originalDash.collection_id,
    }
  }
  else if (method === 'PUT') {
    dashboardToSend = {
      id: payload.id,
      cards: payload.dashboardCards
    }
  }
  let url = `${process.env.URL}${apiEndpoint}`;
  if (process.env.NODE_ENV === 'test')
    url = `${process.env.TEST_URL}${apiEndpoint}`;

  const param = {
    headers:{
      "content-type":"application/json",
      "X-Metabase-Session": session.id
    },
    body: JSON.stringify(dashboardToSend),
    method
  };
  const res = await fetch(url, param);
  console.log(`Response status: ${res.status}`);
  if (method === 'POST')
    return dashboardToSend.name;
};

module.exports = postDashboard;