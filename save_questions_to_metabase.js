const util = require('util');
const callAPI = require('./api_calls/call_api');
const getSession = require('./api_calls/get_session');
const convert = require('./transform/convert_to_mbql');
const removeDimensionFields = require('./transform/remove_dimension_fields');
const saveQuestion = require('./api_calls/post_question');
const getQuestionFiles = require('./transform/get_question_files');

const argumentError = `Argument Error:

Syntax: [cmd] [--flag] [--flag/list]
      
--save: save new questions/dashboards to metabase (with new id's)
or
--edit: edit current questions/dashboards (keep current id's)

Followed by:

--all: save/edit all questions in download folder
or
A space-separated list of questions to save/edit`;

//Note: metabase questions of type date 'previous n days' not currently supported
async function save_question_to_metabase(questionSet) {
  try {
    // const session = await getSession();
    const session = {"id":"1ac60d20-0838-4db0-acc4-bfc927ac3324"};
    const flags = [];
    if (questionSet[0] === undefined) {
      throw console.error(argumentError);
    }
    else {
      while(!parseInt(questionSet[0])) {
        flags.push(questionSet.shift());
        questionSet = questionSet.slice(0,questionSet.length);
        if (flags.length > 2 || flags.length === 0 || (flags.includes('--save') && flags.includes('--edit')))
          throw console.error(argumentError);
        if (questionSet.length === 0) break;
      }
    }
    if (!flags.includes('--save') && !flags.includes('--edit'))
      throw console.error(argumentError);

    let data = getQuestionFiles(questionSet, flags);

    for (let i = 0; i < data.questions.length; i++) {
      let question = data.questions[i];
      question.send = {
        dataset_query: {
          query: {}
        }
      };
      console.log(`INDEX: ${i} ID: ${question.id}`);
      // *** TODO: Native queries are not posting back to metabase. Find out why.
      if (question.dataset_query.type === 'native') {
        question.send.dataset_query = question.dataset_query;
      }
      // If the original question this question is based off of changes, this question could be broken
      else if (typeof question.dataset_query.query["source-table"] === 'string' && question.dataset_query.query["source-table"].match(/card.*/))
        question.send.dataset_query = question.dataset_query;
      else {
        question = await convert(question, session);
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
      if (flags.includes('--save'))
        await saveQuestion('/card/', question, session, 'POST');
      else if (flags.includes('--edit'))
        await saveQuestion(`/card/${question.id}`, question, session, 'PUT');
      console.log(`\nQuestion ${i}, ID ${question.id} saved to metabase`);
    };
  }
  catch(e) { console.log(util.inspect(e, false, null, true)); }
}

save_question_to_metabase(process.argv.slice(2));
