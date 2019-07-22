const util = require('util');
const callAPI = require('./api_calls/call_api');
const getSession = require('./api_calls/get_session');
const getScrubbedSQL = require('./transform/get_scrubbed_sql');
const convert = require('./transform/convert_to_mbql');
const removeDimensionFields = require('./transform/remove_dimension_fields');
const removeDeprecatedCards = require('./transform/remove_deprecated_cards');
const postQuestion = require('./scratch/post_test');
const fs = require('fs');

async function main(){
  const session = await getSession();
  const metabaseQuestions = [];
  const allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: 5});
  const questionObject = {
    questions: []
  }

  allDatabaseCards.forEach(card => {
    metabaseQuestions.push({card, id: card.id, database_id: card.database_id, name: card.name, dataset_query: card.dataset_query, sql: ''})
  });

  const metadata = await callAPI(session, `/database/5/metadata`, 'GET')
  const savedQuestionMetadata = await callAPI(session, `/database/-1337/metadata`, 'GET')

  const filteredMetabaseQuestions = removeDeprecatedCards(metabaseQuestions, metadata, savedQuestionMetadata);

  for (let i = 0; i < 1; i++) {
    const badQuestions = [1,18,27,33,49,50,53,64,69,70,84,95]
    if (!badQuestions.includes(i)) {
      console.log(i);
      console.log(filteredMetabaseQuestions[i].id);
      let question = filteredMetabaseQuestions[i];

      try {
        const scrubbedSQL = await getScrubbedSQL(question, session);
        question.sql = scrubbedSQL;

        questionObject.questions.push(question);
        console.log(`Question ${i} / ${filteredMetabaseQuestions.length - 1} finished`);

      }
      catch(e) { console.log(util.inspect(e, false, null, true /* enable colors */)); }
    }
    else
      console.log(`Skipped question ${i} / ${filteredMetabaseQuestions.length}: Broken Question`);
  }
  const unixTimestamp = Date.now();
  fs.writeFile(`./output/metabase_questions_${unixTimestamp}.json`, JSON.stringify(questionObject), (err) => {
    if (err) throw err;
    console.log('Output File Written');
  });
}

main();