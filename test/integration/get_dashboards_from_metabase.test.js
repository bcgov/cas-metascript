const getDashboardsFromMetabase = require('../../get_dashboards_from_metabase');
const mockedEnv = require('mocked-env');
const rmdir = require('rimraf');
const fs = require('fs');
const path = require('path');
const util = require('util');

jest.setTimeout(30000);
const directory = path.join(__dirname, 'test_metabase_dashboards_directory');

describe('Test getDashboardsFromMetabase Integration when entityList is not empty', () => {
  beforeAll(async () => {
    rmdir(directory, error => {})
    await getDashboardsFromMetabase({dashboardDestination: directory, entityList: [1], databaseId: 1});
  });
  afterAll(() => rmdir(directory, error => {}));

  test('getDashboardsFromMetabase creates a folder to house the dashboards' , async () => {

    expect(fs.existsSync(directory)).toBe(true);
  });

  test('getDashboardsFromMetabase creates folders that mirror the collections on metabase' , async () => {
    expect(fs.existsSync(`${directory}/root`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/1`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/2`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/3`)).toBe(true);
  });

  test('getDashboardsFromMetabase saves a specified question' , async () => {
    const question = JSON.parse(fs.readFileSync(`${directory}/root/2/dashboard_1.json`));
    expect(question.id).toBe(1);
  });
});
describe('Test getDashboardsFromMetabase Integration when entityList is an empty array', () => {
  beforeAll(async () => {
    rmdir(directory, error => {})
    await getDashboardsFromMetabase({dashboardDestination: directory, entityList: [], databaseId: 1});
  });
  afterAll(() => rmdir(directory, error => {}));

  test('getQuestionsFromMetabase saves all dashboards' , async () => {
    expect(fs.existsSync(`${directory}/root/2/dashboard_1.json`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/3/dashboard_5.json`)).toBe(true);
  });
});
