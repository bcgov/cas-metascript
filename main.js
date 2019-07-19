const util = require('util');
const callAPI = require('./api_calls/call_api');
const getSession = require('./api_calls/get_session');
const getScrubbedSQL = require('./transform/get_scrubbed_sql');
const convert = require('./transform/convert_to_mbql');
const removeDimensionFields = require('./transform/remove_dimension_fields');
const removeDeprecatedCards = require('./transform/remove_deprecated_cards');
const postQuestion = require('./scratch/post_test');

async function main(){
  const metabaseQuestions = [];
  const allDatabaseCards = await callAPI('/card/', 'GET', null, {database: 5});
  
  allDatabaseCards.forEach(card => {
    metabaseQuestions.push({card, id: card.id, database_id: card.database_id, name: card.name, dataset_query: card.dataset_query, sql: ''})
  });

  const metadata = await callAPI(`/database/5/metadata`, 'GET')
  const savedQuestionMetadata = await callAPI(`/database/-1337/metadata`, 'GET')

  const filteredMetabaseQuestions = removeDeprecatedCards(metabaseQuestions, metadata, savedQuestionMetadata);
  
  
  for (let i = 0; i < 15; i++) {
    const badQuestions = [1,18,27,33,49,50,53,64,69,70,84,95]
    if (!badQuestions.includes(i)) {
      // console.log(i);
      // console.log(filteredMetabaseQuestions[i].id);
      let sampleQuestion = filteredMetabaseQuestions[i];
    
      try {
        const scrubbedSQL = await getScrubbedSQL(sampleQuestion);
        sampleQuestion.sql = scrubbedSQL;
        let question = await convert(sampleQuestion);
        question = await removeDimensionFields(question);

        question.send = {
          dataset_query: {
            query: {}
          }
        };
        question.send.dataset_query.query["source-table"] = question.mbql.source_table[1];
        question.send.dataset_query.query.fields = question.mbql.fields;
        question.send.dataset_query.query.aggregation = question.mbql.aggregation;
        question.send.dataset_query.query.filter = question.mbql.filter;
        question.send.dataset_query.query.breakout = question.mbql.breakout;
        question.send.dataset_query.query['order-by'] = question.mbql['order-by'];
        question.send.dataset_query.type = question.dataset_query.type;
        question.send.dataset_query.database = question.dataset_query.database;
        // console.log(util.inspect(question, false, null, true /* enable colors */));
        await postQuestion('/card/', question)
        console.log(`\nQuestion ${i}, ID ${question.id} finished`);
      }
      catch(e) { console.log(util.inspect(e, false, null, true /* enable colors */)); }
      
    }
  }
}

main();
