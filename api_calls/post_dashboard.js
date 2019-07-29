const fetch = require("node-fetch");
const util = require('util');

/**
 * Function postQuestion sends a post request to metabase to save a question to metabase
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {object} body - The body of the request
 */
async function postDashboard(apiEndpoint, dashboard, session) {

  const originalDash = dashboard;

  const card ={
    name: `dev_id_${dashboard.id}`,
    description: originalCard.description,
    collection_id: 25,
    collection_position: originalCard.collection_position,
  }
  
  const url = `https://metabase-wksv3k-dev.pathfinder.gov.bc.ca/api${apiEndpoint}`;

  const param = {
    headers:{
      "content-type":"application/json",
      "X-Metabase-Session": session.id
    },
    body: JSON.stringify(card),
    method:'POST'
  };
  const res = await fetch(url, param);
  console.log(res.status);
  return res;
};

module.exports = postQuestion;
s