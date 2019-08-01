const util = require('util');
const callAPI = require('./api_calls/call_api');
const getSession = require('./api_calls/get_session');
const getScrubbedSQL = require('./transform/get_scrubbed_sql');
const createFileStructure = require('./transform/create_file_structure');
const fs = require('fs');
require('dotenv').config();

/**
 * getQuestionsFromMetabase gets questions from Metabase, scrubs the sql from metabase if necessary, creates a file structure
 * locally based on the hierarchy of collections in metabase and saves the questions locally within their collection folder
 * @param {Array} questionSet - a list of questions to get from metabase (if null get all questions from metabase) 
 */
async function getQuestionsFromMetabase(questionSet){
  // const session = await getSession();
  const database_id = process.env.DATABASE_ID
  const session = {"id":"1ac60d20-0838-4db0-acc4-bfc927ac3324"};
  const metabaseQuestions = [];
  console.log('Creating File Structure...')
  const collections = await createFileStructure(session);
  const brokenQuestions = [];

  console.log('Getting questions from metabase...')
  // If no set of questions has been entered on the command line, get all questions from metabase
  if (questionSet.length === 0) {
    const allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: database_id});
    allDatabaseCards.forEach(card => {
      metabaseQuestions.push({
        id: card.id,
        database_id: card.database_id,
        description: card.description,
        collection_position: card.collection_position,
        collection_id: card.collection_id,
        display: card.display,
        visualization_settings: card.visualization_settings,
        name: card.name,
        dataset_query: card.dataset_query,
        segment: false,
        broken: false,
        sql: ''})
    });
  }
  // If there is a set of space-separated questions entered in the command line, only get those questions
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
        visualization_settings: card.visualization_settings,
        name: card.name,
        dataset_query: card.dataset_query,
        segment: false,
        broken: false,
        sql: ''
      });
    }
  }

  for (let i = 0; i < metabaseQuestions.length; i++) {
    let question = metabaseQuestions[i];

    try {
      // Scrub the sql from metabase (if the query is not native)
      if (question.dataset_query.type !== 'native') {
        const scrubbedSQL = await getScrubbedSQL(question, session);
        question.sql = scrubbedSQL;
        // TODO: find out how to deal with segments
        if (metabaseQuestions[i].dataset_query.query.filter && metabaseQuestions[i].dataset_query.query.filter[0] === 'segment')
          metabaseQuestions[i].segment = true;
        }
      else
        // set the sql to the native query if the query type is native
        question.sql = `${question.dataset_query.native.query};`;

      // the collection_id for a question that lives in the 'Our Analytics' collection is null. Set it to root (to save it locally)
      if (question.collection_id === null) { question.collection_id = 'root'; };

      // If the question is not broken, write it locally within it's collection folder
      if (question.broken === false) {
        const writeFile = util.promisify(fs.writeFile);
        try {
          await writeFile(`./metabase_questions/${collections.unixTimestamp}/${collections[question.collection_id].location}/${question.id}.json`, JSON.stringify(question));
          console.log(`Question ${i+1} / ${metabaseQuestions.length} finished (Metabase card id: ${metabaseQuestions[i].id})`);
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

getQuestionsFromMetabase(process.argv.slice(2));
