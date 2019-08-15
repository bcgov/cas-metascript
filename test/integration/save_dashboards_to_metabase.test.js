const getDashboardsFromMetabase = require('../../get_dashboards_from_metabase');
const saveDashboardsToMetabase = require('../../save_dashboards_to_metabase');
const callAPI = require('../../api_calls/call_api');
const mockedEnv = require('mocked-env');
const rmdir = require('rimraf');
const fs = require('fs');
const path = require('path');
const util = require('util');

jest.setTimeout(30000);
const directory = path.join(__dirname, 'save_dashboards_directory');
const session = (process.env.CIRCLE_TEST_ENV) ? JSON.parse(process.env.CIRCLE_METABASE_SESSION) : JSON.parse(process.env.TEST_SESSION);

// TODO: rewrite descriptions
describe('saveDashboardsToMetabase Integration', () => {
  test('on save=true, saveDashboardsToMetabase saves specified dashboard(s) to metabase with a new id if entityList is not empty' , async () => {
    await saveDashboardsToMetabase({dashboardDirectory: directory, save:true, entityList:[1]});

    let allDashboards = await callAPI(session, '/dashboard/', 'GET', null, {database: 1});
    const dashboards = {};
    let newDashboardID = 0;
    allDashboards.forEach(db => {
      if (dashboards[db.name]) { dashboards[db.name]++; }
      else { dashboards[db.name] = 1; }
      if (db.id > newDashboardID) { newDashboardID = db.id; }
    });
    expect(dashboards.test_dashboard).toBe(2);
    await callAPI(session, `/dashboard/${newDashboardID}`, 'DELETE', null, {database: 1});
  });

  xtest('on edit=true, saveDashboardsToMetabase edits specified dashboards(s) in place and saves to metabase if entityList is not empty' , async () => {

  });

  xtest('on save=true, saveDashboardsToMetabase saves all dashboards in directory to metabase with a new id if entityList is empty', async () => {

  });

  xtest('on edit=true, saveDashboardsToMetabase saves all dashboards in directory to metabase with a new id if entityList is empty', async () => {
    
  });
});
