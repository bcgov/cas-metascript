const call_api = require('../api_calls/call_api');
const util = require('util');

const scrubMetabaseSQL = (question, sql) => {

  let scrubbedSQL = sql;
  scrubbedSQL = scrubbedSQL.replace(/"/g, '');
  question.schema = scrubbedSQL.match(/(\w+\.)\w+\.\w+/)[1].slice(0, -1);

  scrubbedSQL = scrubbedSQL.replace(/\w+\.(\w+\.\w+)/gi, '$1');

  if (!question.dataset_query.query.fields && !question.dataset_query.query.aggregation) {
    const replaceStar = /(?<=SELECT)[\w\W]*(?=FROM)/g;
    scrubbedSQL = scrubbedSQL.replace(replaceStar, ' * ');
  };
  return scrubbedSQL;
}

async function getScrubbedSQL(question, session) {
  
  try{
    const queryData = await call_api(session, `/card/${question.id}/query`, 'POST');
    let sqlFromMetabase;
    if (queryData.error) {
      question.broken = true;
    }
    else {
      if (queryData.data.native_form)
        sqlFromMetabase = queryData.data.native_form.query;
      else if (queryData.native)
        sqlFromMetabase = queryData.native;
    }

    if (sqlFromMetabase) {
      const scrubbedSQL = scrubMetabaseSQL(question, sqlFromMetabase);
      return scrubbedSQL;
    }
  }
  catch(e) { console.log(e); }

}

module.exports = getScrubbedSQL;