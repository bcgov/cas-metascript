const getBrokenQuestions = require('../get_broken_questions');
const callAPI = require('../../api_calls/call_api');
const mockedEnv = require('mocked-env');

jest.mock('../../api_calls/call_api');
restore = mockedEnv({
  SESSION: process.env.TEST_SESSION
});

describe('getQuestionsFromMetabase Integration', () => {
  test('getBrokenQuestions exits with an error if there are broken questions ' , async () => {
    callAPI.mockImplementationOnce(() => [{id: 1, name:'broken'}]);
    callAPI.mockImplementation(() => qdata = {error: 'error'});
    const exit = jest.spyOn(process, 'exit').mockImplementation(number => number);
    await getBrokenQuestions();
    expect(exit).toHaveBeenCalledWith(1);
  });

  test('getBrokenQuestions exits with an error if there are broken questions ' , async () => {
    callAPI.mockImplementationOnce(() => [{id: 1, name:'not_broken'}]);
    callAPI.mockImplementation(() => qdata = {data: 'data'});
    const exit = jest.spyOn(process, 'exit').mockImplementation(number => number);
    await getBrokenQuestions();
    expect(exit).toHaveBeenCalledWith(0);
  });
});
restore();
