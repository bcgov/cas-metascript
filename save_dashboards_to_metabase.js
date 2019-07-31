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

async function saveDashboardsToMetabase(flag) {
  try {
    // const session = await getSession();
    const session = {"id":"1ac60d20-0838-4db0-acc4-bfc927ac3324"};
    const database_id = process.env.DATABASE_ID;
    // Error handling for incorrect flag arguments (--save or --edit)
    if (flag === undefined || (flag !== '--save' && flag !== '--edit')) {
      throw console.error('Invalid or missing argument. Command must include --save(save a dashboard with a new id) or --edit(save an updated dashboard & keep current id)')
    }

    // Get all dashboards from metabasebase
    const allDashboards = await callAPI(session, '/dashboard', 'GET', null, {database: database_id});
    // Get all cards from metabase
    const allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: database_id});
    // The ID's of the dashboards to refresh
    const activeDashboardIDs = [79];//11, 18, 20, 25];
    // The dashboard objects to refresh
    const activeDashboards = [];
    const saveEditFlag = flag;
    // Iterate over the list of activeDashboardIDs and push the corresponding dashboard object to activeDashboards
    allDashboards.forEach(dashboard => {
      if (activeDashboardIDs.includes(dashboard.id))
        activeDashboards.push(dashboard);
    });
    /**
     * Get the individual dashboard object.
     * All the activeDashboard stuff looks like redundant code & it very possibly is.
     * It may just be useful for dev debugging. In which case this loop will iterate over allDashboards rather than activeDashboards
     * and the activeDashboard stuff can be removed.
     */
    for (let i = 0; i < activeDashboards.length; i++) {
      const dashboard = await callAPI(session, `/dashboard/${activeDashboards[i].id}`, 'GET', null, {database: database_id});
      let dashboardCards = [];
      // Get all cards currently attached to this dashboard
      dashboard.ordered_cards.forEach(dbCard => {
        let cardId;
        // Some cards have a `null` id. These are virtual cards that are created in the dashboard (like notes we've added)
        if (dbCard.card_id !== null)
          // Setting the cardId parameter to the card's name for comparison later
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
          // collection_id should be removed in production, this is just because I've saved all new cards to my personal collection to not mess with
          // items already on dev
          if (card.collection_id === 44 && card.name === dbCard.cardId) {
            dbCard.cardId = card.id;
          }
        });
      });

      // Save new dashboard to metabase if --save flag is set
      let newDashboardID = '';
      if (saveEditFlag === '--save') {
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
        if (saveEditFlag === '--save') {
          await callAPI(session, `/dashboard/${newDashboardID}/cards`, 'POST', dashboardCards[j])
        }
      }
      // update the array of questions for the dashboard being edited
      if (saveEditFlag === '--edit') {
        await saveDashboard(`/dashboard/${dashboard.id}/cards`, {id: dashboard.id, dashboardCards}, 'PUT', session)
      }
      console.log(`dashboard ${dashboard.id} recreation complete`);
    }
  }
  catch(e) { console.log(e); }
  // console.log(util.inspect(dashboard, false, null, true));
}

saveDashboardsToMetabase(process.argv[2]);
