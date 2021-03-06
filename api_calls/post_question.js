const fetch = require("node-fetch");
const util = require('util');

/**
 * Function postQuestion sends a post request to metabase to save a question to metabase
 * @param {String} apiEndpoint - The metabase API endpoint 
 * @param {object} body - The body of the request
 */
async function postQuestion(apiEndpoint, question, session, method) {
  const data = question.send.dataset_query;

  let card = {};

  if (method === 'POST') {
    card = {
      visualization_settings: question.visualization_settings,
      description: question.description,
      collection_position: question.collection_position,
      collection_id: question.collection_id,
      name: question.name,
      dataset_query: data,
      display: question.display
    }
  }
  else if(method === 'PUT') {
    card = {
      dataset_query: data
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
    body: JSON.stringify(card),
    method
  };
  try {
    const res = await fetch(url, param);
    console.log(res.status);
    return res;
  } catch(e) {
    console.log(res.status);
    return res;
  }
};

module.exports = postQuestion;
