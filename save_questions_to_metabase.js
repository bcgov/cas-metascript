const util = require('util');
const getSession = require('./api_calls/get_session');
const sqlToMbql = require('./transform/sql_to_mbql_adv');
const mapSQLValuesToID = require('./transform/mapSQLValuesToID');
const removeDimensionFields = require('./transform/remove_dimension_fields');
const saveQuestion = require('./api_calls/post_question');
const getQuestionFiles = require('./transform/get_question_files');

//Note: metabase questions of type date 'previous n days' not currently supported

/**
 * Function save_question_to_metabase saves questions to metabase
 * @param {Array} questionSet - the cmd line args can include flags and / or a subset of questions to save to metabase from local
 */
async function saveQuestionsToMetabase(args) {
  try {
    let session;
    if (process.env.CIRCLE_TEST_ENV) {
      let string = process.env.CIRCLE_TEST_SESSION;
      const positions = [40,4,3,1];
      positions.forEach(position => {
        string = [string.slice(0, position), '"', string.slice(position)].join('');
      });
      session = JSON.parse(string);
    } else if (process.env.NODE_ENV === 'test')
        session = JSON.parse(process.env.TEST_SESSION);
      else
        session = await getSession();

    let data = getQuestionFiles(args);
    for (let i = 0; i < data.questions.length; i++) {
      let question = data.questions[i];
      question.send = {
        dataset_query: {
          query: {}
        }
      };
      console.log(`INDEX: ${i} ID: ${question.id}`);
      if (question.dataset_query.type === 'native') {
        question.send.dataset_query = question.dataset_query;
      }
      // If the original question this question is based off of changes, this question could be broken
      else if (typeof question.dataset_query.query["source-table"] === 'string' && question.dataset_query.query["source-table"].match(/card.*/))
        question.send.dataset_query = question.dataset_query;
      else {
        question.mbql = sqlToMbql(question);
        question = await mapSQLValuesToID(question, session);
        question = await removeDimensionFields(question, session);

        question.send.dataset_query.query["source-table"] = question.mbql.source_table[1];
        question.send.dataset_query.query.aggregation = question.mbql.aggregation;
        // if (question.segment === true) {
        //   /* This section could be used to POST a new segment with an updated filter to metabase
        //     or update an existing segment.
        //     TODO: Choose a course of action when dealing with segments. 
        //           Segments cause a query to have params and '?s' in the native sql in metabase. I am parsing those params and inserting them
        //           into the sql '?s'. This saves the question, but loses the connection to the segment when re-saving to metabase.
        //           All the segment logic is directly inserted into the filter of the question (which can get long, thus why Metabase has segments)

        //   const metabaseSegment = await callAPI(session, `/segment/${question.dataset_query.query.filter[1]}`, 'GET');
        //   const newSegment = {
        //     name: metabaseSegment.name,
        //     description: metabaseSegment.description,
        //     table_id: metabaseSegment.table_id,
        //     definition: metabaseSegment.definition
        //   }
        //   newSegment.definition.filter = question.mbql.filter
        //   */
        //   // question.send.dataset_query.query.filter = question.dataset_query.query.filter;
        // }
        // else {
          question.send.dataset_query.query.fields = question.mbql.fields;
          question.send.dataset_query.query.filter = question.mbql.filter;
        // }
        question.send.dataset_query.query.breakout = question.mbql.breakout;
        question.send.dataset_query.query['order-by'] = question.mbql['order-by'];
        question.send.dataset_query.type = question.dataset_query.type;
        question.send.dataset_query.database = question.dataset_query.database;
      }
      // console.log(util.inspect(question, false, null, true));
      if (args.edit)
        await saveQuestion(`/card/${question.id}`, question, session, 'PUT');
      else if (args.save)
        await saveQuestion('/card/', question, session, 'POST');
      console.log(`\nQuestion ${i}, ID ${question.id} saved to metabase`);
    };
  }
  catch(e) { console.log(util.inspect(e, false, null, true)); }
}

module.exports = saveQuestionsToMetabase;
