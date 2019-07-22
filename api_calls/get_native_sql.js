const fetch = require("node-fetch");
const util = require('util');

async function getSql(id) {
  const url = `https://metabase-wksv3k-dev.pathfinder.gov.bc.ca/api/card/${id}/query`;

  const param = {
    headers:{
      "content-type":"application/json",
      // "X-Metabase-Session": "8fe8a3af-2396-4b93-b583-e9cf54d21716"
      "X-Metabase-Session": "91ab1a62-2226-49ca-9e80-3a68d779d6d5"
    },
    method: 'POST'
  };
  try {
  const res = await fetch(url, param)
  const data = await res.json();
  
  if (data.data.native_form)
    return `${data.data.native_form.query};`;
  else if (data.native)
    return `${data.native.query};`;
  }
  
  catch(e) { console.log(e); }
};

module.exports = getSql;