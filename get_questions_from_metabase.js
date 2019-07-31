const util = require('util');
const callAPI = require('./api_calls/call_api');
const getSession = require('./api_calls/get_session');
const getScrubbedSQL = require('./transform/get_scrubbed_sql');
const createFileStructure = require('./transform/create_file_structure');
const fs = require('fs');
require('dotenv').config();

async function main(questionSet){
  // const session = await getSession();
  const database_id = process.env.DATABASE_ID
  const session = {"id":"1ac60d20-0838-4db0-acc4-bfc927ac3324"};
  const metabaseQuestions = [];
  console.log('Creating File Structure...')
  const collections = await createFileStructure(session);
  const brokenQuestions = [];

  if (questionSet.length === 0) {
    const allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: database_id});
    allDatabaseCards.forEach(card => {
      metabaseQuestions.push({
        id: card.id,
        database_id: card.database_id,
        collection_id: card.collection_id,
        name: card.name,
        dataset_query: card.dataset_query,
        segment: false,
        broken: false,
        sql: ''})
    });
  }
  else {
    for (let i = 0; i < questionSet.length; i++) {
      const card = await callAPI(session, `/card/${questionSet[i]}`, 'GET', null, {database: database_id});
      metabaseQuestions.push({
        id: card.id,
        database_id: card.database_id,
        description: card.description,
        collection_position: card.collection_position,
        collection_id: card.collection_id,
        display: card.display,
        name: card.name,
        dataset_query: card.dataset_query,
        segment: false,
        broken: false,
        sql: ''
      });
    }
  }

  for (let i = 0; i < metabaseQuestions.length; i++) {
    console.log(i);
    console.log(metabaseQuestions[i].id);
    let question = metabaseQuestions[i];

    try {
      if (question.dataset_query.type !== 'native') {
        const scrubbedSQL = await getScrubbedSQL(question, session);
        question.sql = scrubbedSQL;
        // TODO: find out how to deal with segments
        if (metabaseQuestions[i].dataset_query.query.filter && metabaseQuestions[i].dataset_query.query.filter[0] === 'segment')
          metabaseQuestions[i].segment = true;
        }
      else
        question.sql = `${question.dataset_query.native.query};`;

      if (question.collection_id === null) { question.collection_id = 'root'; };

      if (question.broken === false) {
        const writeFile = util.promisify(fs.writeFile);
        try {
          await writeFile(`./metabase_questions/${collections.unixTimestamp}/${collections[question.collection_id].location}/${question.id}.json`, JSON.stringify(question));
          console.log(`Question ${i} / ${metabaseQuestions.length - 1} finished`);
        }
        catch(e) { console.log(e); }
      }
      else {
        brokenQuestions.push(`Index: ${i}, Question ID: ${question.id}`);
        console.log(`Skipped question ${i} / ID: ${metabaseQuestions[i].id}: Broken Question`);
      }
    }
    catch(e) { console.log(util.inspect(e, false, null, true /* enable colors */)); }
  }
  console.log(`Broken Metabase Questions: ${brokenQuestions}`);
}

main(process.argv.slice(2));
