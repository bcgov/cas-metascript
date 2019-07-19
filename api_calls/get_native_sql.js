const fetch = require("node-fetch");
const util = require('util');

async function getSql(id) {
  const url = `https://metabase-wksv3k-dev.pathfinder.gov.bc.ca/api/card/${id}/query`;

  const param = {
    headers:{
      "content-type":"application/json",
      // "X-Metabase-Session": "533ee3a9-9839-449a-82aa-9bfb1c47bb74"
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