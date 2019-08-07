const call_api = require('../api_calls/call_api');
const util = require('util');

/**
 * Function scrubMetabaseSql scrubs the sql retrieved from metabase so the parser can understand it
 * @param {object} question - the question object
 * @param {String} sql - the sql from metabase
 * @param {Array} params - params will be an empty array unless the question on metabase uses a segment
 */
const scrubMetabaseSQL = (question, sql, params) => {

  let scrubbedSQL = sql;
  // remove "" as the parser does not like them
  scrubbedSQL = scrubbedSQL.replace(/"/g, '');
  // retrieve the schema for the question
  question.schema = scrubbedSQL.match(/(\w+\.)\w+\.\w+/)[1].slice(0, -1);
  // replace instances of schema.table.field with table.field
  scrubbedSQL = scrubbedSQL.replace(/\w+\.(\w+\.\w+)/gi, '$1');

  // If the dataset query has no fields and no aggregation then it is a select all, replace long list of fields with a *
  if (!question.dataset_query.query.fields && !question.dataset_query.query.aggregation) {
    const replaceStar = /(?<=SELECT)[\w\W]*(?=FROM)/g;
    scrubbedSQL = scrubbedSQL.replace(replaceStar, ' * ');
  };

  // If a question returns params it is using a metabase segment, this inserts the segment params into the sql,
  // but when the question is saved, the segment is lost and the entire segment is added into the filter
  if (params) {
    params.forEach(param => {
      scrubbedSQL = scrubbedSQL.replace(/\?/, `'${param}'`);
    });
  }
  return scrubbedSQL;
}

async function getScrubbedSQL(question, session) {

  try{
    // Must run the query to retrieve the native sql
    const queryData = await call_api(session, `/card/${question.id}/query`, 'POST');
    let sqlFromMetabase;
    let sqlParams;
      // Two different places to retrieve the native sql depending on the type of query
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
