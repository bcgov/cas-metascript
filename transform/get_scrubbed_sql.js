const get_native_sql = require('../api_calls/get_native_sql');
const call_api = require('../api_calls/call_api');
const util = require('util');

const scrubMetabaseSQL = (question, sql, schemas) => {
  const quoteRegex = /"/g;
  let schemaStringWithDot = '';
  let schemaStringNoDot = '';
  schemas.forEach((schema, key, schemas) => {
    if (Object.is(schemas.length - 1, key)) {
      schemaStringWithDot += `${schema}\\\.`;
      schemaStringNoDot += `${schema}`;
    }
    else {
      schemaStringWithDot += `${schema}\\\.|`;
      schemaStringNoDot += `${schema}|`
    }
  })
  let schema;
  const schemaDotRegex = new RegExp(schemaStringWithDot, 'gi');
  const schemaNoDotRegex = new RegExp(schemaStringNoDot, 'gi');
  const regexArray = [quoteRegex, schemaDotRegex];
  let scrubbedSQL = sql;

  if (schemaNoDotRegex.test(scrubbedSQL)) {
    schema = scrubbedSQL.match(schemaNoDotRegex);
  }
  question.schema = schema[0].replace(quoteRegex, '');
  regexArray.forEach(regex => {
    scrubbedSQL = scrubbedSQL.replace(regex, '');
  });


  if (!question.dataset_query.query.fields && !question.dataset_query.query.aggregation) {
    const replaceStar = /(?<=SELECT)[\w\W]*(?=FROM)/g;
    scrubbedSQL = scrubbedSQL.replace(replaceStar, ' * ');
  }
  return scrubbedSQL;
}

async function getScrubbedSQL(question, session) {
  
  try{
    const sqlFromMetabase = await get_native_sql(question.id, session);
    const schemas = await call_api(session, `/database/${question.database_id}/schemas`);
    if (sqlFromMetabase) {
      const scrubbedSQL = scrubMetabaseSQL(question, sqlFromMetabase, schemas);
      return scrubbedSQL;
    }
  }
  catch(e) { console.log(e); }

}

module.exports = getScrubbedSQL;