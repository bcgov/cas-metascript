const fetch = require("node-fetch");
const util = require('util');

/**
 * Function postQuestion sends a post request to metabase to save a question to metabase
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {object} body - The body of the request
 */
async function postQuestion(apiEndpoint, question, session, method) {
  
  const data = question.send.dataset_query;

  const originalCard = question.card;

  let card = {};

  if (method === 'POST') {
    card = {
      visualization_settings: originalCard.visualization_settings,
      description: originalCard.description,
      collection_position: originalCard.collection_position,
      // collection_id set for debugging so that new questions are posted to my personal collection
      collection_id: 44,
      name: originalCard.name,//`dev_id_${question.id}`,
      dataset_query: data,
      display: originalCard.display
    }
  }
  else if(method === 'PUT') {
    card = {
      dataset_query: data
    }
  }
  
  const url = `${process.env.URL}${apiEndpoint}`;

  const param = {
    headers:{
      "content-type":"application/json",
      "X-Metabase-Session": session.id
    },
    body: JSON.stringify(card),
    method
  };
  const res = await fetch(url, param);
  console.log(res.status);
  return res;
};

module.exports = postQuestion;
