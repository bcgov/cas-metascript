const util = require('util');
const getSession = require('./api_calls/get_session');
const callAPI = require('./api_calls/call_api');
const saveDashboard = require('./api_calls/post_dashboard');
require('dotenv').config();

/** TODO: There is a bug in the metabase api that truncates long api responses (possibly only for api/card/:id/related).
 *  Responses from api/card/:id/related can get large. They are also the way to determine what dashboards a card belongs to.
 *  When/if this bug is fixed then a set of questions that have been edited can be passed into this function
 *  and only the affected dashboards could then be refreshed (activeDashboards).
 *  A bug issue has been placed with metabase https://github.com/metabase/metabase/issues/10432
*/

/**
 * Function saveDashboardsToMetabase re-saves dashboards to metabase with new/edited questions
 * @param {String} flag - --save saves a new version of the dashboard with a new metabase ID --edit edits the questions in the current dashboard
 */
async function saveDashboardsToMetabase(args) {
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
    const database_id = args.databaseId;

    // Get all dashboards from metabasebase
    const allDashboards = await callAPI(session, '/dashboard', 'GET', null, {database: database_id});
    // Get all cards from metabase
    const allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: database_id});
    // The ID's of the dashboards to refresh
    const activeDashboardIDs = args.entityList;//11, 18, 20, 25];
    // The dashboard objects to refresh
    const activeDashboards = [];
    // Iterate over the list of activeDashboardIDs and push the corresponding dashboard object to activeDashboards
    allDashboards.forEach(dashboard => {
      if (activeDashboardIDs.length === 0 || activeDashboardIDs.includes(dashboard.id))
        activeDashboards.push(dashboard);
    });

    // Get the individual dashboard object.
    for (let i = 0; i < activeDashboards.length; i++) {
      const dashboard = await callAPI(session, `/dashboard/${activeDashboards[i].id}`, 'GET', null, {database: database_id});
      let dashboardCards = [];
      // Get all cards currently attached to this dashboard
      dashboard.ordered_cards.forEach(dbCard => {
        let cardId;
        // Some cards have a `null` id. These are virtual cards that are created in the dashboard (like notes we've added)
        if (dbCard.card_id !== null)
          // Set the cardId parameter to the card's name for comparison later
          cardId = dbCard.card.name
        else
          cardId = null;

        dashboardCards.push({
          sizeX: dbCard.sizeX,
          sizeY: dbCard.sizeY,
          col: dbCard.col,
          row: dbCard.row,
          parameter_mappings: dbCard.parameter_mappings,
          series: dbCard.series,
          visualization_settings: dbCard.visualization_settings,
          cardId
        });
      })

      // Check the name of the cards currently in metabase against the name of the card set to cardId (The card id may have changed but name will be the same)
      allDatabaseCards.forEach(card => {
        dashboardCards.forEach(dbCard => {
          if (card.name === dbCard.cardId) {
            dbCard.cardId = card.id;
          }
        });
      });

      // Save new dashboard to metabase if --save flag is set
      let newDashboardID = '';
      if (args.save) {
        const newDashboardName = await saveDashboard(`/dashboard/`, dashboard, 'POST', session);
        const allDashboards = await callAPI(session, '/dashboard', 'GET', null, {database: database_id});
        // Get the ID of the newly saved dashboard
        allDashboards.forEach(dashboard => {
          if (dashboard.name === newDashboardName)
            newDashboardID = dashboard.id;
        });
      }
      // Change the ids in the parameter mappings if the id of the cards have changed (in case new cards were saved rather than cards were edited)
      for (let j = 0; j < dashboardCards.length; j++) {
        if (dashboardCards[j].parameter_mappings.length > 0) {
          dashboardCards[j].parameter_mappings.forEach(mapping => {
            mapping.card_id = dashboardCards[j].cardId;
          });
        }
        // Save each question to the new dashboard
        if (args.save) {
          await callAPI(session, `/dashboard/${newDashboardID}/cards`, 'POST', dashboardCards[j])
        }
      }
      // update the array of questions for the dashboard being edited
      if (args.edit) {
        await saveDashboard(`/dashboard/${dashboard.id}/cards`, {id: dashboard.id, dashboardCards}, 'PUT', session)
      }
      console.log(`dashboard ${dashboard.id} recreation complete`);
    }
  }
  catch(e) { console.log(e); }
  // console.log(util.inspect(dashboard, false, null, true));
}

module.exports = saveDashboardsToMetabase;
