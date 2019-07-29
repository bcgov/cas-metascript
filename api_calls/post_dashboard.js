const fetch = require("node-fetch");
const util = require('util');

/**
 * Function postQuestion sends a post request to metabase to save a question to metabase
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {object} body - The body of the request
 */
async function postDashboard(apiEndpoint, dashboard, session) {

  const originalDash = dashboard;

  const newDashboard ={
    name: `dev_id_dashboard_${dashboard.id}`,
    description: originalDash.description,
    parameters: originalDash.parameters,
    collection_id: 43,
  }
  
  const url = `https://metabase-wksv3k-dev.pathfinder.gov.bc.ca/api${apiEndpoint}`;

  const param = {
    headers:{
      "content-type":"application/json",
      "X-Metabase-Session": session.id
    },
    body: JSON.stringify(newDashboard),
    method:'POST'
  };
  const res = await fetch(url, param);
  console.log(`Response status: ${res.status}`);
  return newDashboard.name;
};

module.exports = postDashboard;