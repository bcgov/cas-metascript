const util = require('util');
const callAPI = require('./api_calls/call_api');
const getSession = require('./api_calls/get_session');
const createFileStructure = require('./transform/create_file_structure');
const fs = require('fs');
require('dotenv').config();

/**
 * Function getDashboardsFromMetabase gets questions from Metabase, scrubs the sql from metabase if necessary, creates a file structure
 * locally based on the hierarchy of collections in metabase and saves the questions locally within their collection folder
 * @param {Array} databaseSet - a list of questions to get from metabase (if null get all questions from metabase) 
 */
async function getDashboardsFromMetabase(args){
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

  const database_id = args.databaseId;
  const databaseSet = args.entityList;
  const metabaseDashboards = [];

  console.log('Creating File Structure...')
  const collections = await createFileStructure(args, session);
  console.log('Getting dashboards from metabase...')
  // If no set of questions has been entered on the command line, get all questions from metabase
  if (databaseSet.length === 0) {
    const allDashboards = await callAPI(session, '/dashboard', 'GET', null, {database: database_id});
    allDashboards.forEach(dashboard => {
      metabaseDashboards.push(dashboard)
    });
  }
  // If there is a set of space-separated questions entered in the command line, only get those questions
  else {
    for (let i = 0; i < databaseSet.length; i++) {
      const db = await callAPI(session, `/dashboard/${databaseSet[i]}`, 'GET', null, {database: database_id});
      metabaseDashboards.push(db);
    }
  }
  
  for (let i = 0; i < metabaseDashboards.length; i++) {
    let dashboard = metabaseDashboards[i];
    // the collection_id for a question that lives in the 'Our Analytics' collection is null. Set it to root (to save it locally)
    if (dashboard.collection_id === null) { dashboard.collection_id = 'root'; };
    const writeFile = util.promisify(fs.writeFile);
    try {
      await writeFile(`${args.dashboardDestination}/${collections[dashboard.collection_id].location}/dashboard_${dashboard.id}.json`, JSON.stringify(dashboard));
      console.log(`dashboard ${i+1} / ${metabaseDashboards.length} finished (Metabase dashboard id: ${metabaseDashboards[i].id})`);
    }
    catch(e) { console.log(e); }
  }    
}

module.exports = getDashboardsFromMetabase;