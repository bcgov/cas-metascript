const get_native_sql = require('../api_calls/get_native_sql');
const util = require('util');

const scrubMetabaseSQL = (question, sql) => {
  const quoteRegex = /"/g;
  const schemaRegex = /ggircs\.|ciip\./gi;
  const joinRegex = /[A-Z]*\s(?=JOIN).+?((?=WHERE))|[A-Z]*\s(?=JOIN).+?((?=GROUP))|[A-Z]*\s(?=JOIN).+?((?=ORDER))|[A-Z]*\s(?=JOIN).+?((?=LIMIT))/gi;
  const aliasRegex = /\sAS\s.*?(?=\,)|\sAS\s.*?(?=\s)/gi;
  const regexArray = [quoteRegex, schemaRegex, joinRegex];
  let scrubbedSQL = sql;
  
  regexArray.forEach(regex => {
    scrubbedSQL = scrubbedSQL.replace(regex, '');
  });

  if (!question.dataset_query.query.fields && !question.dataset_query.query.aggregation) {
    const replaceStar = /(?<=SELECT)[\w\W]*(?=FROM)/g;
    scrubbedSQL = scrubbedSQL.replace(replaceStar, ' * ');
  }
  return scrubbedSQL;
}

async function getScrubbedSQL(question) {
  
  try{
    const sqlFromMetabase = await get_native_sql(question.id);
    if (sqlFromMetabase) {
      const scrubbedSQL = scrubMetabaseSQL(question, sqlFromMetabase);
      return scrubbedSQL;
    }
  }
  catch(e) { console.log(e); }

}

module.exports = getScrubbedSQL;