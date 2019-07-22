const fetch = require("node-fetch");
const util = require('util');

async function getSql(id, session) {
  const url = `https://metabase-wksv3k-dev.pathfinder.gov.bc.ca/api/card/${id}/query`;

  const param = {
    headers:{
      "content-type":"application/json",
      "X-Metabase-Session": session.id
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