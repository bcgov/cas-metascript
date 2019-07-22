const util = require('util');
const callAPI = require('./api_calls/call_api');
const getSession = require('./api_calls/get_session');
const convert = require('./transform/convert_to_mbql');
const removeDimensionFields = require('./transform/remove_dimension_fields');
const postQuestion = require('./scratch/post_test');
const fs = require('fs');

async function save_question_to_metabase() {

  // const session = await getSession();
  const session = {"id":"effebced-7d21-4a3f-a208-907af28a9240"};
  const files = fs.readdirSync('./output');
  const latestFile = {
    file: '',
    fileNumber: '0'
  }
  files.forEach(file => {
    const regex = /\d+/
    const fileNumber = file.match(regex);
    if (fileNumber[0] > latestFile.fileNumber) {
      latestFile.file = file;
      latestFile.fileNumber = fileNumber[0];
    }
  })

  let data = JSON.parse(fs.readFileSync(`./output/${latestFile.file}`));

  for (let i = 0; i < data.questions.length; i++) {
    let question = data.questions[i];
    console.log(`INDEX: ${i} ID: ${question.id}`);
    try {
      question = await convert(question, session);
      question = await removeDimensionFields(question, session);

      question.send = {
        dataset_query: {
          query: {}
        }
      };
      // console.log(util.inspect(question.sql, false, null, true));
      question.send.dataset_query.query["source-table"] = question.mbql.source_table[1];
      question.send.dataset_query.query.fields = question.mbql.fields;
      question.send.dataset_query.query.aggregation = question.mbql.aggregation;
      question.send.dataset_query.query.filter = question.mbql.filter;
      question.send.dataset_query.query.breakout = question.mbql.breakout;
      question.send.dataset_query.query['order-by'] = question.mbql['order-by'];
      question.send.dataset_query.type = question.dataset_query.type;
      question.send.dataset_query.database = question.dataset_query.database;
      console.log(util.inspect(question.send, false, null, true));
      // await postQuestion('/card/', question, session);
      console.log(`\nQuestion ${i}, ID ${question.id} saved to metabase`);
    }
    catch(e) { console.log(util.inspect(e, false, null, true)); }

  };
}

save_question_to_metabase();