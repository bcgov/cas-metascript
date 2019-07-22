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
  // const session = await getSession();
  const session = {"id":"effebced-7d21-4a3f-a208-907af28a9240"};
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

  for (let i = 0; i < filteredMetabaseQuestions.length; i++) {
    const badQuestions = [22,71,87,29,30,70,95,96,104,63,83,76,78,62,79,69,84,86,81,25,37]
    // 37 is a nested with statement that the current transformations don't account for
    if (!badQuestions.includes(filteredMetabaseQuestions[i].id)) {
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