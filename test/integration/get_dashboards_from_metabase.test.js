const getDashboardsFromMetabase = require('../../get_dashboards_from_metabase');
const mockedEnv = require('mocked-env');
const rmdir = require('rimraf');
const fs = require('fs');
const path = require('path');
const util = require('util');

jest.setTimeout(30000);
const directory = path.join(__dirname, 'test_metabase_dashboards_directory');

afterAll(() => rmdir(directory, error => {}));

describe('getDashboardsFromMetabase Integration', () => {
  test('getDashboardsFromMetabase creates a folder to house the dashboards' , async () => {
    await getDashboardsFromMetabase({dashboardDestination: directory, entityList: [1], databaseId: 1});
    expect(fs.existsSync(directory)).toBe(true);
  });

  test('getDashboardsFromMetabase creates folders that mirror the collections on metabase' , async () => {
    expect(fs.existsSync(`${directory}/root`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/1`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/2`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/3`)).toBe(true);
  });

  test('getDashboardsFromMetabase saves a specified question when given an array of dashboard ids in entityList as a parameter' , async () => {
    const question = JSON.parse(fs.readFileSync(`${directory}/root/2/dashboard_1.json`));
    expect(question.id).toBe(1);
  });

  test('getQuestionsFromMetabase saves all dashboards when entityList is an empty array' , async () => {
    await getDashboardsFromMetabase({dashboardDestination: directory, entityList: [], databaseId: 1});
    expect(fs.existsSync(`${directory}/root/2/dashboard_1.json`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/3/dashboard_5.json`)).toBe(true);
  });
});
