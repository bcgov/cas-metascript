const getQuestionsFromMetabase = require('../../get_questions_from_metabase');
const mockedEnv = require('mocked-env');
const rmdir = require('rimraf');
const fs = require('fs');
const path = require('path');
const util = require('util');

jest.setTimeout(30000);
const directory = path.join(__dirname, 'test_metabase_directory');

describe('Test getQuestionsFromMetabase Integration', () => {
  beforeAll(async () => {
    rmdir(directory, error => {})
    await getQuestionsFromMetabase({questionDestination: directory, entityList: [1],}, []);
  });
  afterAll(() => rmdir(directory, error => {}));

  test('getQuestionsFromMetabase creates a folder to house the questions' , async () => {

    expect(fs.existsSync(directory)).toBe(true);
  });

  test('getQuestionsFromMetabase creates folders that mirror the collections on metabase' , async () => {
    expect(fs.existsSync(`${directory}/root`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/1`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/2`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/3`)).toBe(true);
  });

  test('when given an array of question ids in entityList as a parameter getQuestionsFromMetabase saves a specified question' , async () => {
    const question = JSON.parse(fs.readFileSync(`${directory}/root/3/1.json`));
    expect(question.id).toBe(1);
  });
});

describe('empty entity list', () => {
  beforeAll(async () => {
    rmdir(directory, error => {})
    await getQuestionsFromMetabase({questionDestination: directory, entityList: [],}, [5]);
  });
  afterAll(() => rmdir(directory, error => {}));

  test('when entityList is an empty array && ignores questions in the brokenQuestions array getQuestionsFromMetabase saves all qeustions' , async () => {
    expect(fs.existsSync(`${directory}/root/3/1.json`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/3/4.json`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/2/3.json`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/2/5.json`)).toBe(false);
    expect(fs.existsSync(`${directory}/root/2/6.json`)).toBe(true);
  });
})