const util = require('util');
const callAPI = require('./api_calls/call_api');
const postDashboard = require('./api_calls/post_dashboard');

async function saveDashboardsToMetabase() {
  try {
    const session = {"id":"1ac60d20-0838-4db0-acc4-bfc927ac3324"};

    const allDashboards = await callAPI(session, '/dashboard', 'GET', null, {database: 5});
    const allDatabaseCards = await callAPI(session, '/card/', 'GET', null, {database: 5});
    const activeDashboardIDs = [11, 18, 20, 25];
    const activeDashboards = []

    allDashboards.forEach(dashboard => {
      if (activeDashboardIDs.includes(dashboard.id))
        activeDashboards.push(dashboard);
    });

    for (let i = 0; i < activeDashboards.length; i++) {
      const dashboard = await callAPI(session, `/dashboard/${activeDashboards[i].id}`, 'GET', null, {database: 5});
      const virtualCards = [];
      let dashboardCards = [];

      dashboard.ordered_cards.forEach(dbCard => {
        if (dbCard.card_id !== null) {
          dashboardCards.push({
            sizeX: dbCard.sizeX,
            sizeY: dbCard.sizeY,
            col: dbCard.col,
            row: dbCard.row,
            parameter_mappings: dbCard.parameter_mappings,
            series: dbCard.series,
            cardId: dbCard.card.name
          });
        }
        else {
          virtualCards.push({
            sizeX: dbCard.sizeX,
            sizeY: dbCard.sizeY,
            col: dbCard.col,
            row: dbCard.row,
            parameter_mappings: dbCard.parameter_mappings,
            series: dbCard.series,
            visualization_settings: dbCard.visualization_settings,
            cardId: null
          });
        }
      })

      allDatabaseCards.forEach(card => {
        dashboardCards.forEach(dbCard => {
          if (card.collection_id === 25 && card.name === dbCard.cardId) {
            dbCard.cardId = card.id;
          }
        });
      });

      dashboardCards = dashboardCards.concat(virtualCards);

      // console.log(util.inspect(dashboardCards, false, null, true));
      const newDashboardName = await postDashboard(`/dashboard/`, dashboard, session);
      const allDashboards = await callAPI(session, '/dashboard', 'GET', null, {database: 5});
      let newDashboardID = '';
      allDashboards.forEach(dashboard => {
        if (dashboard.name === newDashboardName)
          newDashboardID = dashboard.id;
      });

      for (let j = 0; j < dashboardCards.length; j++) {
        if (dashboardCards[j].parameter_mappings.length > 0) {
          dashboardCards[j].parameter_mappings.forEach(mapping => {
            mapping.card_id = dashboardCards[j].cardId;
          });
        }
        await callAPI(session, `/dashboard/${newDashboardID}/cards`, 'POST', dashboardCards[j])
      }
      console.log(`dashboard ${dashboard.id} recreation complete`)
    }
  }
  catch(e) { console.log(e); }
  // console.log(util.inspect(dashboard, false, null, true));
}

saveDashboardsToMetabase();