const getQuestionsFromMetabase = require('../../get_questions_from_metabase');
const mockedEnv = require('mocked-env');
const rmdir = require('rimraf');
const fs = require('fs');
const path = require('path');
const util = require('util');

test('placeholder', () => {
  expect(1+1).toBe(2);
});

const directory = path.join(__dirname, 'test_metabase_directory');

afterAll(() => rmdir(directory, error => {});

describe('getQuestionsFromMetabase Integration', () => {
  test('getQuestionsFromMetabase creates a folder to house the questions' , async () => {
    await getQuestionsFromMetabase({questionDestination: directory, entityList: [1],}, []);
    expect(fs.existsSync(directory)).toBe(true);
  });

  test('getQuestionsFromMetabase creates folders that mirror the collections on metabase' , async () => {
    expect(fs.existsSync(`${directory}/root`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/1`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/2`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/3`)).toBe(true);
  });

  test('getQuestionsFromMetabase saves a specified question when given an array of question ids in entityList as a parameter' , async () => {
    const question = JSON.parse(fs.readFileSync(`${directory}/root/3/1.json`));
    expect(question.id).toBe(1);
  });

  test('getQuestionsFromMetabase saves all qeustions when entityList is an empty array && ignores questions in the brokenQuestions array' , async () => {
    await getQuestionsFromMetabase({questionDestination: directory, entityList: [],}, [5]);
    expect(fs.existsSync(`${directory}/root/3/1.json`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/3/4.json`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/2/3.json`)).toBe(true);
    expect(fs.existsSync(`${directory}/root/2/5.json`)).toBe(false);
    expect(fs.existsSync(`${directory}/root/2/6.json`)).toBe(true);
  });
});
