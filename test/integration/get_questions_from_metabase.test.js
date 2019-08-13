const getQuestionsFromMetabase = require('../../get_questions_from_metabase');
const mockedEnv = require('mocked-env');
const rmdir = require('rimraf');
const fs = require('fs');
const util = require('util');

test('placeholder', () => {
  expect(1+1).toBe(2);
});

// restore = mockedEnv({
//   QUESTION_PATH: './test_questions',
//   SESSION: process.env.TEST_SESSION
// });

// describe('getQuestionsFromMetabase Integration', () => {
//   test('getQuestionsFromMetabase creates a folder to house the questions' , async () => {
//     await getQuestionsFromMetabase([1]);
//     expect(fs.existsSync(process.env.QUESTION_PATH)).toBe(true);
//   });

//   test('getQuestionsFromMetabase creates folders that mirror the collections on metabase' , async () => {
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root`)).toBe(true);
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root/1`)).toBe(true);
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root/2`)).toBe(true);
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root/3`)).toBe(true);
//   });

//   test('getQuestionsFromMetabase saves a specified question when given a question id as a parameter' , async () => {
//     const question = JSON.parse(fs.readFileSync(`${process.env.QUESTION_PATH}/root/3/1.json`));
//     expect(question.id).toBe(1);
//   });

//   test('getQuestionsFromMetabase creates a folder to house the questions' , async () => {
//     await getQuestionsFromMetabase([]);
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root/3/1.json`)).toBe(true);
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root/3/4.json`)).toBe(true);
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root/2/3.json`)).toBe(true);
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root/2/5.json`)).toBe(true);
//     expect(fs.existsSync(`${process.env.QUESTION_PATH}/root/2/6.json`)).toBe(true);
//   });
// });

// rmdir(process.env.QUESTION_PATH, error => {});
// restore();
