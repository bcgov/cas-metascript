const call_api = require('../api_calls/call_api');
const util = require('util');

const scrubMetabaseSQL = (question, sql, params) => {

  let scrubbedSQL = sql;
  scrubbedSQL = scrubbedSQL.replace(/"/g, '');
  question.schema = scrubbedSQL.match(/(\w+\.)\w+\.\w+/)[1].slice(0, -1);

  scrubbedSQL = scrubbedSQL.replace(/\w+\.(\w+\.\w+)/gi, '$1');

  if (!question.dataset_query.query.fields && !question.dataset_query.query.aggregation) {
    const replaceStar = /(?<=SELECT)[\w\W]*(?=FROM)/g;
    scrubbedSQL = scrubbedSQL.replace(replaceStar, ' * ');
  };

  // If a question returns params it is using a metabase segment, this inserts the segment params into the sql,
  // but when the question is saved, the segment is lost and the entire segment is added into the filter
  if (params.length > 0) {
    params.forEach(param => {
      scrubbedSQL = scrubbedSQL.replace(/\?/, `'${param}'`);
    });
  }
  return scrubbedSQL;
}

async function getScrubbedSQL(question, session) {
  
  try{
    const queryData = await call_api(session, `/card/${question.id}/query`, 'POST');
    let sqlFromMetabase;
    let sqlParams;
      if (queryData.data.native_form)
        sqlFromMetabase = queryData.data.native_form.query;
      else if (queryData.native) {
        sqlFromMetabase = queryData.native.query;
        sqlParams = queryData.native.params;
      }

    if (sqlFromMetabase) {
      const scrubbedSQL = scrubMetabaseSQL(question, sqlFromMetabase, sqlParams);
      return scrubbedSQL;
    }
  }
  catch(e) { console.log(e); }

}

module.exports = getScrubbedSQL;
