const callAPI = require('../api_calls/call_api');
const getSession = require('../api_calls/get_session');
const util = require('util');
require('dotenv').config();

/**
 * Function getBrokenQuestions retrieves cards from Metabase, runs their queries and checks for an error in the returned metadata.
 * If there is an error, the questions is pushed to the brokenCards array which is reported at the end of the function.
 * No broken cards results in an exit code 0, otherwise we exit with code 1.
 */
async function getBrokenQuestions() {
  try {
    // const session = await getSession();
    const session = JSON.parse(process.env.SESSION);
    const database_id = process.env.DATABASE_ID;
    const brokenCards = [];
    const allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: database_id});

    for (let i = 0; i < allDatabaseCards.length; i++) {
    const queryData = await callAPI(session, `/card/${allDatabaseCards[i].id}/query`, 'POST');
      if (queryData.error) {
        brokenCards.push(`${allDatabaseCards[i].id}_${allDatabaseCards[i].name}`);
      }
    }
    // const noErrorFace = String.fromCodePoint(0x1F603);
    // if (brokenCards.length === 0) {
    //   console.log(`No Card Errors ${noErrorFace}`);
    // }
    // else {
    //   console.log(`Broken Cards (ID_Name): ${brokenCards}`);
    // }
    return brokenCards;
  }
  catch(e) { console.error(e); }
}

// getBrokenQuestions();

module.exports = getBrokenQuestions;
