const getQuestionsFromMetabase = require('../../get_questions_from_metabase');
const saveQuestionsToMetabase = require('../../save_questions_to_metabase');
const callAPI = require('../../api_calls/call_api');
const mockedEnv = require('mocked-env');
const rmdir = require('rimraf');
const fs = require('fs');
const path = require('path');
const util = require('util');

jest.setTimeout(30000);
const directory = path.join(__dirname, 'save_questions_directory');
const session = (process.env.CIRCLE_TEST_ENV) ? JSON.parse(process.env.CIRCLE_METABASE_SESSION) : JSON.parse(process.env.TEST_SESSION);

describe('Test saveQuestionsToMetabase Integration', () => {
  beforeAll(
    async () => {
      rmdir(directory, error => {});
      await getQuestionsFromMetabase({questionDestination: directory, entityList: [],databaseId: 1}, [5])
    })

  afterAll(() => {
    rmdir(directory, error => {});
  });

  test('when entityList is not empty && save=true, saveQuestionsToMetabase saves specified question(s) to metabase with a new id' , async () => {
    await saveQuestionsToMetabase({questionDirectory: directory, save:true, entityList:[1]});

    let allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: 1});
    const cards = {};
    let newCardID = 0;
    allDatabaseCards.forEach(card => {
      if (cards[card.name]) { cards[card.name]++; }
      else { cards[card.name] = 1; }
      if (card.id > newCardID) { newCardID = card.id; }
    });
    expect(cards.People).toBe(2);
    await callAPI(session, `/card/${newCardID}`, 'DELETE', null, {database: 1});
  });

  test('when entityList is not empty && edit=true, saveQuestionsToMetabase edits specified question(s) in place and saves to metabase' , async () => {
    const question1 = fs.readFileSync((`${directory}/root/3/1.json`))
    const parsedQ1 = JSON.parse(question1);
    parsedQ1.sql = "SELECT PEOPLE.NAME FROM PUBLIC.PEOPLE LIMIT 2000"
    parsedQ1.dataset_query.query.fields = ['field-id', 1];

    fs.writeFileSync(`${directory}/root/3/1.json`, JSON.stringify(parsedQ1));
    await saveQuestionsToMetabase({questionDirectory: directory, edit:true, entityList:[1]});

    const metabaseQuestion1 = await callAPI(session, '/card/1/query', 'POST', null, {database: 1});
    expect(metabaseQuestion1.data.native_form.query).toEqual('SELECT "PUBLIC"."PEOPLE"."NAME" AS "NAME" FROM "PUBLIC"."PEOPLE" LIMIT 2000');
    fs.writeFileSync(`${directory}/root/3/1.json`, question1);
    await saveQuestionsToMetabase({questionDirectory: directory, edit:true, entityList:[1]});
  });

  xtest('when entityList is empty && save=true, saveQuestionsToMetabase saves all questions in directory to metabase with a new id', async () => {

  });

  xtest('when entityList is empty && edit=true, saveQuestionsToMetabase saves all questions in directory to metabase with a new id', async () => {

  });
});
