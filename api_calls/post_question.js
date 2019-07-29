const fetch = require("node-fetch");
const util = require('util');

/**
 * Function postQuestion sends a post request to metabase to save a question to metabase
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {object} body - The body of the request
 */
async function postQuestion(apiEndpoint, question, session) {
  
  const data = question.send.dataset_query;

  const originalCard = question.card;

  const card ={
    visualization_settings: originalCard.visualization_settings,
    description: originalCard.description,
    collection_position: originalCard.collection_position,
    result_metadata: originalCard.result_metadata,
    collection_id: 25,
    name: originalCard.name,//`dev_id_${question.id}`,
    dataset_query: data,
    display: originalCard.display
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
