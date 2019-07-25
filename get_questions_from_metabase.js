const util = require('util');
const callAPI = require('./api_calls/call_api');
const getSession = require('./api_calls/get_session');
const getScrubbedSQL = require('./transform/get_scrubbed_sql');
const createFileStructure = require('./scratch/create_file_structure');
const fs = require('fs');

async function main(){
  // const session = await getSession();
  const session = {"id":"effebced-7d21-4a3f-a208-907af28a9240"};
  const metabaseQuestions = [];
  const allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: 5});
  const questionObject = {
    questions: []
  }
  const collections = await createFileStructure();

  allDatabaseCards.forEach(card => {
    metabaseQuestions.push({
      card,
      id: card.id,
      database_id: card.database_id,
      collection_id: card.collection_id,
      name: card.name,
      dataset_query: card.dataset_query,
      segment: false,
      sql: ''})
  });

  for (let i = 0; i < metabaseQuestions.length; i++) {
    const badQuestions = [22,71,87,29,30,70,95,96,63,66,83,85,76,78,84,86,25,49]

    if (!badQuestions.includes(metabaseQuestions[i].id)) {
      console.log(i);
      console.log(metabaseQuestions[i].id);
      let question = metabaseQuestions[i];

      try {
        if (question.dataset_query.type !== 'native') {
          const scrubbedSQL = await getScrubbedSQL(question, session);
          question.sql = scrubbedSQL;
          if (metabaseQuestions[i].dataset_query.query.filter && metabaseQuestions[i].dataset_query.query.filter[0] === 'segment')
            metabaseQuestions[i].segment = true;
          }
        else
          question.sql = `${question.dataset_query.native.query};`;
        questionObject.questions.push(question);
        console.log(`Question ${i} / ${metabaseQuestions.length - 1} finished`);
        if (question.collection_id === null) question.collection_id = 'root';
        fs.writeFile(`./metabase_questions/${collections.unixTimestamp}/${collections[question.collection_id].location}/${question.id}.json`, JSON.stringify(question), (err) => {
            if (err) throw err;
          });
      }
      catch(e) { console.log(util.inspect(e, false, null, true /* enable colors */)); }
    }
    else
      console.log(`Skipped question ${i} / ID: ${metabaseQuestions[i].id}: Broken Question`);
  }
  // const unixTimestamp = Date.now();
  // fs.writeFile(`./output/metabase_questions_${unixTimestamp}.json`, JSON.stringify(questionObject), (err) => {
  //   if (err) throw err;
  //   console.log('Output File Written');
  // });
}

main();